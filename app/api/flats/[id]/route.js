import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope, requireFlatAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { notFound, conflict } from "@/lib/errors";
import { flatUpdateSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/** GET /api/flats/:id */
const GETImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;
  const societyId = resolveSocietyScope(user, null);

  const flat = await requireFlatAccess(user, id, { societyId });

  const full = await prisma.flat.findUnique({
    where: { id: flat.id },
    include: {
      residents: {
        where: { endDate: null },
        include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      },
      invoices: { orderBy: { billingPeriod: "desc" }, take: 12 },
      complaints: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  return ok(full);
});

/** PATCH /api/flats/:id */
const PATCHImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const { id } = await params;
  const societyId = resolveSocietyScope(user, null);

  const body = flatUpdateSchema.parse(await readJson(req));

  const existing = await prisma.flat.findFirst({ where: { id, societyId } });
  if (!existing) throw notFound("Flat");

  const flat = await prisma.flat.update({
    where: { id },
    data: {
      flatNumber: body.flatNumber ?? undefined,
      block: body.block ?? undefined,
      floor: body.floor ?? undefined,
      flatType: body.flatType ?? undefined,
      sqFt: body.sqFt ?? undefined,
      parkingSlot: body.parkingSlot ?? undefined,
      status: body.status ?? undefined,
    },
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.FLAT_UPDATED,
    entityType: "flat",
    entityId: id,
    oldValue: { flatNumber: existing.flatNumber, status: existing.status },
    newValue: { flatNumber: flat.flatNumber, status: flat.status },
  });

  return ok(flat);
});

/**
 * DELETE /api/flats/:id
 * Blocked when the flat has billing history - financial records must never be
 * orphaned. Mark the flat VACANT instead.
 */
const DELETEImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const { id } = await params;
  const societyId = resolveSocietyScope(user, null);

  const existing = await prisma.flat.findFirst({
    where: { id, societyId },
    include: { _count: { select: { invoices: true, payments: true } } },
  });
  if (!existing) throw notFound("Flat");

  if (existing._count.invoices > 0) {
    throw conflict(
      "This flat has invoices and cannot be deleted. Mark it VACANT to keep the financial history."
    );
  }

  await prisma.flat.delete({ where: { id } });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.FLAT_DELETED,
    entityType: "flat",
    entityId: id,
    oldValue: { flatNumber: existing.flatNumber },
  });

  return ok({ id, deleted: true });
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
