import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireResidentManager, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { notFound, badRequest } from "@/lib/errors";
import { depositDeductionCreateSchema } from "@/lib/validation/schemas";
import { audit, AUDIT } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/deposits/:id/deductions
 * Add a deduction against a held deposit.
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

  const body = depositDeductionCreateSchema.parse(await readJson(req));

  const newTotal = deposit.deductionsTotal + body.amount;
  if (newTotal > deposit.amountReceived) {
    throw badRequest(`Total deductions (₹${newTotal}) cannot exceed deposit amount (₹${deposit.amountReceived})`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const deduction = await tx.depositDeduction.create({
      data: {
        depositId: id,
        reason: body.reason,
        amount: body.amount,
      },
    });

    const updatedDeposit = await tx.deposit.update({
      where: { id },
      data: { deductionsTotal: newTotal },
    });

    return { deduction, deposit: updatedDeposit };
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.DEPOSIT_DEDUCTED,
    entityType: "deposit",
    entityId: id,
    newValue: { reason: body.reason, amount: body.amount, totalDeductions: newTotal },
  });

  return ok(result.deduction, { status: 201 });
});

