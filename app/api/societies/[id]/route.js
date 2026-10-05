import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSuperAdmin, requireSocietyAdmin, isSocietyAdmin, isSuperAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { notFound, forbidden } from "@/lib/errors";
import { societyUpdateSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/** GET /api/societies/:id */
const GETImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;

  // Super admins may inspect any tenant; everyone else only their own.
  const societyId = resolveSocietyScope(user, id);

  const society = await prisma.society.findUnique({
    where: { id: societyId },
    include: {
      _count: { select: { flats: true, users: true, invoices: true, complaints: true, notices: true } },
    },
  });
  if (!society) throw notFound("Society");

  // Finance totals are only exposed to that society's own admins.
  let finance = null;
  if (isSocietyAdmin(user) || user.role === "SUPER_ADMIN") {
    const [agg, pending] = await Promise.all([
      prisma.invoice.aggregate({
        where: { societyId },
        _sum: { totalAmount: true, paidAmount: true },
      }),
      prisma.invoice.count({ where: { societyId, status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] } } }),
    ]);
    finance = {
      invoiced: agg._sum.totalAmount ?? 0,
      collected: agg._sum.paidAmount ?? 0,
      outstanding: (agg._sum.totalAmount ?? 0) - (agg._sum.paidAmount ?? 0),
      openInvoiceCount: pending,
    };
  }

  return ok({ ...society, finance });
});

/** PATCH /api/societies/:id */
const PATCHImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;

  const existing = await prisma.society.findUnique({ where: { id } });
  if (!existing) throw notFound("Society");

  // A society admin may maintain the contact details printed on notices and
  // receipts, but never another tenant, never its own status, and never its own
  // code - the code is stamped into every invoice and receipt number.
  const platformAdmin = isSuperAdmin(user);
  if (!platformAdmin) {
    requireSocietyAdmin(user);
    if (String(id) !== String(user.societyId)) {
      throw forbidden("You can only edit your own society");
    }
  }

  const body = societyUpdateSchema.parse(await readJson(req));

  if (!platformAdmin && (body.code !== undefined || body.status !== undefined)) {
    throw forbidden("Only a platform admin can change the society code or status");
  }

  const data = {
    name: body.name ?? undefined,
    address: body.address ?? undefined,
    city: body.city ?? undefined,
    state: body.state ?? undefined,
    pincode: body.pincode ?? undefined,
    phone: body.phone ?? undefined,
    email: body.email === "" ? null : (body.email ?? undefined),
  };

  if (platformAdmin) {
    data.code = body.code ?? undefined;
    data.status = body.status ?? undefined;
  }

  const society = await prisma.society.update({ where: { id }, data });

  await audit({
    societyId: id,
    userId: user.id,
    action: AUDIT.SOCIETY_UPDATED,
    entityType: "society",
    entityId: id,
    oldValue: {
      name: existing.name,
      status: existing.status,
      address: existing.address,
      phone: existing.phone,
      email: existing.email,
    },
    newValue: {
      name: society.name,
      status: society.status,
      address: society.address,
      phone: society.phone,
      email: society.email,
    },
    reason: body.reason ?? null,
  });

  return ok(society);
});

/** DELETE /api/societies/:id - deactivate (soft delete, keeps financial records). */
const DELETEImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSuperAdmin(user);
  const { id } = await params;
  if (id === user.societyId) throw forbidden("You cannot deactivate your own society");

  const society = await prisma.society.update({
    where: { id },
    data: { status: "INACTIVE" },
  });

  await audit({
    societyId: id,
    userId: user.id,
    action: AUDIT.SOCIETY_UPDATED,
    entityType: "society",
    entityId: id,
    oldValue: { status: "ACTIVE" },
    newValue: { status: "INACTIVE" },
  });

  return ok(society);
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function PATCH(request, context) {
  return PATCHImpl(request, context);
}

export async function DELETE(request, context) {
  return DELETEImpl(request, context);
}
