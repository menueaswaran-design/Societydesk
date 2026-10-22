import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireResidentManager, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { notFound, badRequest } from "@/lib/errors";
import { occupancyCheckOutSchema } from "@/lib/validation/schemas";
import { calculateDepositSettlement } from "@/lib/billing/deposit";
import { audit, AUDIT } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/occupancies/:id/checkout
 * Process resident check-out, settle security deposit minus dues & deductions,
 * mark occupancy LEFT, and release bed to VACANT.
 */
export const POST = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireResidentManager(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const occupancy = await prisma.occupancy.findFirst({
    where: { id, societyId },
    include: {
      user: true,
      unit: true,
      bed: true,
      deposits: { where: { status: "HELD" }, take: 1 },
      invoices: {
        where: { status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] } },
      },
    },
  });

  if (!occupancy) throw notFound("Occupancy record not found");
  if (occupancy.status === "LEFT") {
    throw badRequest("Resident has already checked out");
  }

  const body = occupancyCheckOutSchema.parse(await readJson(req));
  const leaveDate = body.leaveDate || new Date();

  // Calculate unpaid invoices total
  const unpaidDues = occupancy.invoices.reduce(
    (sum, inv) => sum + Math.max(0, inv.totalAmount - inv.paidAmount),
    0
  );

  const activeDeposit = occupancy.deposits[0] || null;
  const depositAmount = activeDeposit ? activeDeposit.amountReceived : occupancy.depositAmount;

  const settlement = calculateDepositSettlement({
    depositAmount,
    unpaidDues,
    deductions: body.deductions || [],
  });

  const finalRefund = body.refundAmount !== undefined ? body.refundAmount : settlement.refundAmount;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update Occupancy status to LEFT
    const updatedOccupancy = await tx.occupancy.update({
      where: { id },
      data: {
        status: "LEFT",
        leaveDate,
      },
    });

    // 2. Mark Bed as VACANT
    if (occupancy.bedId) {
      await tx.bed.update({
        where: { id: occupancy.bedId },
        data: { status: "VACANT" },
      });
    }

    // 3. Update or create Deposit settlement record
    let depositRecord = activeDeposit;
    if (depositRecord) {
      // Record any deductions
      if (body.deductions?.length) {
        await Promise.all(
          body.deductions.map((d) =>
            tx.depositDeduction.create({
              data: {
                depositId: depositRecord.id,
                reason: d.reason,
                amount: Math.round(Number(d.amount)),
              },
            })
          )
        );
      }

      depositRecord = await tx.deposit.update({
        where: { id: depositRecord.id },
        data: {
          deductionsTotal: settlement.deductionsTotal,
          refundAmount: finalRefund,
          refundDate: leaveDate,
          status: finalRefund > 0 ? "REFUNDED" : "PARTIALLY_REFUNDED",
          notes: body.notes || "Check-out deposit settlement completed",
        },
      });
    }

    return { occupancy: updatedOccupancy, deposit: depositRecord, settlement };
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.CHECK_OUT,
    entityType: "occupancy",
    entityId: id,
    newValue: {
      residentName: occupancy.user.name,
      room: occupancy.unit.unitNumber,
      bed: occupancy.bed?.bedLabel || "-",
      deposit: depositAmount,
      deductions: settlement.deductionsTotal,
      unpaidDues,
      refundAmount: finalRefund,
      reasons: (body.deductions || []).map((d) => `${d.reason}: ₹${d.amount}`).join("; "),
    },
  });

  return ok({
    success: true,
    occupancy: result.occupancy,
    settlement: {
      ...settlement,
      finalRefund,
    },
  });
});

