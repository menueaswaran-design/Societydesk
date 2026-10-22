import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireResidentManager, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { notFound, badRequest } from "@/lib/errors";
import { depositRefundCreateSchema } from "@/lib/validation/schemas";
import { audit, AUDIT } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/deposits/:id/refund
 * Record a refund for a security deposit.
 */
export const POST = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireResidentManager(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const deposit = await prisma.deposit.findFirst({
    where: { id, societyId },
  });
  if (!deposit) throw notFound("Deposit record not found");

  const body = depositRefundCreateSchema.parse(await readJson(req));

  const maxRefund = Math.max(0, deposit.amountReceived - deposit.deductionsTotal);
  if (body.refundAmount > maxRefund) {
    throw badRequest(`Refund amount (₹${body.refundAmount}) cannot exceed refundable balance (₹${maxRefund})`);
  }

  const updated = await prisma.deposit.update({
    where: { id },
    data: {
      refundAmount: body.refundAmount,
      refundDate: body.refundDate || new Date(),
      status: body.refundAmount >= maxRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
      notes: body.notes || deposit.notes,
    },
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.DEPOSIT_REFUNDED,
    entityType: "deposit",
    entityId: id,
    newValue: { refundAmount: body.refundAmount, refundDate: body.refundDate },
  });

  return ok(updated);
});

