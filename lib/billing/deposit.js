/**
 * Deposit settlement math for PG / Hostel resident check-out.
 *
 * Formula:
 *   deposit settlement = deposit - unpaid_dues - deductions = refund
 */

export function calculateDepositSettlement({
  depositAmount = 0,
  unpaidDues = 0,
  deductions = [], // array of { reason, amount }
}) {
  const deposit = Math.max(0, Number(depositAmount) || 0);
  const dues = Math.max(0, Number(unpaidDues) || 0);
  const deductionsTotal = deductions.reduce(
    (sum, d) => sum + Math.max(0, Number(d.amount) || 0),
    0
  );

  const totalCharges = dues + deductionsTotal;
  const refundAmount = Math.max(0, deposit - totalCharges);
  const remainingDue = Math.max(0, totalCharges - deposit);

  return {
    depositAmount: deposit,
    unpaidDues: dues,
    deductionsTotal,
    refundAmount,
    remainingDue,
  };
}

