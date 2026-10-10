import { handler, ok, readJson } from "@/lib/api";
import { unprocessable } from "@/lib/errors";
import { getSessionUser } from "@/lib/auth/session";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { societyCreateSchema } from "@/lib/validation/schemas";
import { createFirebaseUser, discardFirebaseUser } from "@/lib/firebase/identity";
export const dynamic = "force-dynamic";


/** GET /api/societies - platform-wide list (super admin only). */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSuperAdmin(user);

  const societies = await prisma.society.findMany({
    include: {
      _count: { select: { flats: true, users: true, invoices: true, complaints: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(societies);
});

/**
 * POST /api/societies - create a tenant and, optionally, its first admin.
 * Both writes are atomic so a society never exists without an owner.
 *
 * When the admin block is filled, the Firebase email/password login is
 * provisioned first (it cannot join the Postgres transaction), then the
 * transaction stores the uid; if the transaction fails, the freshly created
 * Firebase account is discarded again so no orphan login is left behind.
 */
const POSTImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSuperAdmin(user);

  const body = societyCreateSchema.parse(await readJson(req));

  let adminIdentity = null;
  if (body.adminName && body.adminEmail && body.adminPassword) {
    const adminEmail = body.adminEmail.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: adminEmail }, select: { id: true } });
    if (existing) {
      throw unprocessable("Validation failed", {
        adminEmail: "An account with this email already exists",
      });
    }
    adminIdentity = await createFirebaseUser(adminEmail, body.adminPassword);
  }

  let society;
  try {
    society = await prisma.$transaction(async (tx) => {
      const created = await tx.society.create({
        data: {
          name: body.name,
          code: body.code,
          address: body.address ?? null,
          city: body.city ?? null,
          state: body.state ?? null,
          pincode: body.pincode ?? null,
          phone: body.phone ?? null,
          email: body.email || null,
          status: "ACTIVE",
        },
      });

      if (adminIdentity) {
        await tx.user.create({
          data: {
            societyId: created.id,
            name: body.adminName,
            email: body.adminEmail.toLowerCase(),
            authUid: adminIdentity.uid,
            role: "SOCIETY_ADMIN",
            status: "ACTIVE",
          },
        });
      }

      return created;
    });
  } catch (err) {
    if (adminIdentity?.created) {
      await discardFirebaseUser(body.adminEmail.toLowerCase(), body.adminPassword);
    }
    throw err;
  }

  await audit({
    societyId: society.id,
    userId: user.id,
    action: AUDIT.SOCIETY_CREATED,
    entityType: "society",
    entityId: society.id,
    newValue: { name: society.name, code: society.code },
  });

  return ok(society, { status: 201 });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function POST(request, context) {
  return POSTImpl(request, context);
}
