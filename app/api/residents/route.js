import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireResidentManager, resolveSocietyScope, getResidentFlatIds, isFlatAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { notFound, forbidden } from "@/lib/errors";
import { residentCreateSchema, paginationSchema } from "@/lib/validation/schemas";
import { createFirebaseUser, sendFirebasePasswordReset } from "@/lib/firebase/identity";
import { sendResidentWelcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * GET /api/residents
 * Lists people in the society with the flat(s) they occupy.
 * Supports filtering by q, status, block, flatId, and residentType.
 */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  requireResidentManager(user);
  const societyId = resolveSocietyScope(user, req.nextUrl.searchParams.get("societyId"));

  const sp = req.nextUrl.searchParams;
  const { page, pageSize, q, status } = paginationSchema.parse(Object.fromEntries(sp));
  const flatId = sp.get("flatId");
  const block = sp.get("block");
  const residentType = sp.get("residentType");

  const where = { societyId };

  // A flat admin only sees the residents of the flat(s) they manage.
  if (isFlatAdmin(user)) {
    where.flatResidents = {
      some: { endDate: null, flatId: { in: await getResidentFlatIds(user.id) } },
    };
  } else if (flatId) {
    where.flatResidents = {
      some: { endDate: null, flatId },
    };
  }

  if (block) {
    where.flatResidents = {
      ...(where.flatResidents || {}),
      some: { ...(where.flatResidents?.some || {}), flat: { block }, endDate: null },
    };
  }

  if (residentType) {
    where.flatResidents = {
      ...(where.flatResidents || {}),
      some: { ...(where.flatResidents?.some || {}), residentType, endDate: null },
    };
  }

  if (status) where.status = status;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
    ];
  }

  const [total, residents] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: {
        flatResidents: {
          where: { endDate: null },
          include: { flat: { select: { id: true, flatNumber: true, block: true } } },
        },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return ok(residents, {
    meta: { total, page, pageSize, pageCount: Math.ceil(total / pageSize) },
  });
});

/**
 * POST /api/residents
 * Creates the user record, provisions Firebase identity, sends password in mail,
 * and links them to the flat in one clean flow.
 * Both Society Admin and Flat Admin can add residents.
 */
const POSTImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  requireResidentManager(user);
  const societyId = resolveSocietyScope(user, null);

  const body = residentCreateSchema.parse(await readJson(req));

  // A flat admin may only add residents to the flat they manage.
  if (isFlatAdmin(user)) {
    const managedFlatIds = await getResidentFlatIds(user.id);
    if (!managedFlatIds.includes(body.flatId)) {
      throw forbidden("You can only add residents to the flat you manage");
    }
  }

  const [flat, society] = await Promise.all([
    prisma.flat.findFirst({ where: { id: body.flatId, societyId } }),
    prisma.society.findUnique({ where: { id: societyId }, select: { name: true } }),
  ]);
  if (!flat) throw notFound("Flat");

  // Generate temporary password for resident onboarding
  const tempPassword = `Society@${Math.floor(1000 + Math.random() * 9000)}`;

  // Provision Firebase auth identity if configured
  let authUid = null;
  try {
    const fb = await createFirebaseUser(body.email.toLowerCase(), tempPassword);
    if (fb?.uid) {
      authUid = fb.uid;
      await sendFirebasePasswordReset(body.email.toLowerCase()).catch(() => null);
    }
  } catch (fbErr) {
    console.log("[residents] Firebase account creation skipped:", fbErr?.message);
  }

  const created = await prisma.$transaction(async (tx) => {
    // Check if user already exists in this society
    let resident = await tx.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });

    if (!resident) {
      resident = await tx.user.create({
        data: {
          societyId,
          name: body.name,
          email: body.email.toLowerCase(),
          phone: body.phone ?? null,
          role: "RESIDENT",
          status: body.status,
          authUid,
        },
      });
    } else if (authUid && !resident.authUid) {
      resident = await tx.user.update({
        where: { id: resident.id },
        data: { authUid },
      });
    }

    // If this new resident is primary, unmark any previous primary for this flat
    if (body.isPrimary) {
      await tx.flatResident.updateMany({
        where: { flatId: flat.id, endDate: null },
        data: { isPrimary: false },
      });
    }

    // Link to flat
    await tx.flatResident.create({
      data: {
        societyId,
        flatId: flat.id,
        userId: resident.id,
        residentType: body.residentType,
        isPrimary: body.isPrimary,
      },
    });

    // Mark flat occupied
    await tx.flat.update({ where: { id: flat.id }, data: { status: "OCCUPIED" } });

    return resident;
  });

  // Send onboarding email with temporary password
  await sendResidentWelcomeEmail({
    email: body.email.toLowerCase(),
    name: body.name,
    password: tempPassword,
    societyName: society?.name,
    flatNumber: flat.block ? `${flat.block}-${flat.flatNumber}` : flat.flatNumber,
  }).catch((e) => console.warn("[email] Error sending welcome email:", e?.message));

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.RESIDENT_CREATED,
    entityType: "user",
    entityId: created.id,
    newValue: { name: created.name, email: created.email, flatNumber: flat.flatNumber },
  });

  return ok(
    {
      ...created,
      temporaryPassword: tempPassword,
      credentialsSent: true,
      flat: { id: flat.id, flatNumber: flat.flatNumber, block: flat.block },
    },
    { status: 201 }
  );
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function POST(request, context) {
  return POSTImpl(request, context);
}
