import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireResidentManager, resolveSocietyScope, getResidentFlatIds, isFlatAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { notFound, forbidden } from "@/lib/errors";
import { residentCreateSchema, paginationSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/**
 * GET /api/residents
 * Lists people in the society with the flat(s) they occupy.
 */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  requireResidentManager(user);
  const societyId = resolveSocietyScope(user, req.nextUrl.searchParams.get("societyId"));

  const sp = req.nextUrl.searchParams;
  const { page, pageSize, q, status } = paginationSchema.parse(Object.fromEntries(sp));

  const where = { societyId };
  // A flat admin only sees the residents of the flat(s) they manage.
  if (isFlatAdmin(user)) {
    where.flatResidents = {
      some: { endDate: null, flatId: { in: await getResidentFlatIds(user.id) } },
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
 * Creates the user record and links them to a flat in one transaction. The
 * Firebase identity is attached later on first sign-in (see lib/auth/session).
 */
const POSTImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  requireResidentManager(user);
  const societyId = resolveSocietyScope(user, null);

  const body = residentCreateSchema.parse(await readJson(req));

  // If society has multiple flats, flat admins must add residents.
  // If society has only 1 flat, society admin can add residents directly.
  if (isSocietyAdmin(user)) {
    const flatCount = await prisma.flat.count({ where: { societyId } });
    if (flatCount > 1) {
      throw forbidden(
        "Societies with multiple flats must use Flat Admins to manage residents. Please assign a Flat Admin for this flat."
      );
    }
  }

  // A flat admin may only add residents to the flat they manage.
  if (isFlatAdmin(user)) {
    const managedFlatIds = await getResidentFlatIds(user.id);
    if (!managedFlatIds.includes(body.flatId)) {
      throw forbidden("You can only add residents to the flat you manage");
    }
  }

  const flat = await prisma.flat.findFirst({
    where: { id: body.flatId, societyId },
  });
  if (!flat) throw notFound("Flat");

  const created = await prisma.$transaction(async (tx) => {
    const resident = await tx.user.create({
      data: {
        societyId,
        name: body.name,
        email: body.email,
        phone: body.phone ?? null,
        role: "RESIDENT",
        status: body.status,
      },
    });

    await tx.flatResident.create({
      data: {
        societyId,
        flatId: flat.id,
        userId: resident.id,
        residentType: body.residentType,
        isPrimary: body.isPrimary,
      },
    });

    // A flat with residents is occupied unless told otherwise.
    if (!body.isPrimary) {
      await tx.flat.update({ where: { id: flat.id }, data: { status: "OCCUPIED" } });
    }

    return resident;
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.RESIDENT_CREATED,
    entityType: "user",
    entityId: created.id,
    newValue: { name: created.name, email: created.email, flatNumber: flat.flatNumber },
  });

  return ok({ ...created, flat: { id: flat.id, flatNumber: flat.flatNumber } }, { status: 201 });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function POST(request, context) {
  return POSTImpl(request, context);
}
