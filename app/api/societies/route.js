import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { societyCreateSchema } from "@/lib/validation/schemas";
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
 */
const POSTImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSuperAdmin(user);

  const body = societyCreateSchema.parse(await readJson(req));

  const society = await prisma.$transaction(async (tx) => {
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

    if (body.adminName && body.adminEmail) {
      await tx.user.create({
        data: {
          societyId: created.id,
          name: body.adminName,
          email: body.adminEmail.toLowerCase(),
          role: "SOCIETY_ADMIN",
          status: "ACTIVE",
        },
      });
    }

    return created;
  });

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
