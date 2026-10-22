import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireResidentManager, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "@/lib/errors";
import { audit, AUDIT } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * GET /api/occupancies/:id
 */
export const GET = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const occupancy = await prisma.occupancy.findFirst({
    where: { id, societyId },
    include: {
      user: true,
      unit: { include: { building: true } },
      bed: true,
      deposits: {
        include: { deductions: true },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        orderBy: { invoiceDate: "desc" },
        take: 12,
      },
    },
  });

  if (!occupancy) throw notFound("Occupancy record not found");
  return ok(occupancy);
});

/**
 * PATCH /api/occupancies/:id
 * Update rent, notice period, or status.
 */
export const PATCH = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireResidentManager(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const existing = await prisma.occupancy.findFirst({
    where: { id, societyId },
  });
  if (!existing) throw notFound("Occupancy record not found");

  const body = await readJson(req);

  const updated = await prisma.occupancy.update({
    where: { id },
    data: {
      monthlyRent: body.monthlyRent !== undefined ? Number(body.monthlyRent) : undefined,
      noticePeriodDays: body.noticePeriodDays !== undefined ? Number(body.noticePeriodDays) : undefined,
      status: body.status || undefined,
      leaveDate: body.leaveDate ? new Date(body.leaveDate) : undefined,
    },
    include: { user: true, unit: true, bed: true },
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.RESIDENT_UPDATED,
    entityType: "occupancy",
    entityId: id,
    oldValue: existing,
    newValue: updated,
  });

  return ok(updated);
});

