import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "@/lib/errors";
import { bedUpdateSchema } from "@/lib/validation/schemas";
import { audit, AUDIT } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/beds/:id
 * Update bed status or rent override.
 */
export const PATCH = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const existing = await prisma.bed.findFirst({ where: { id, societyId } });
  if (!existing) throw notFound("Bed not found");

  const body = bedUpdateSchema.parse(await readJson(req));

  const updated = await prisma.bed.update({
    where: { id },
    data: {
      bedLabel: body.bedLabel ?? undefined,
      rentAmount: body.rentAmount !== undefined ? body.rentAmount : undefined,
      status: body.status ?? undefined,
    },
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.BED_STATUS_CHANGED,
    entityType: "bed",
    entityId: id,
    oldValue: existing,
    newValue: updated,
  });

  return ok(updated);
});

