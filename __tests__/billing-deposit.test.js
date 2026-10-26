import { calculateDepositSettlement } from "@/lib/billing/deposit";

describe("Security Deposit Settlement (lib/billing/deposit.js)", () => {
  test("returns full refund when there are zero unpaid dues and zero deductions", () => {
    const settlement = calculateDepositSettlement({
      depositAmount: 15000,
      unpaidDues: 0,
      deductions: [],
    });

    expect(settlement).toEqual({
      depositAmount: 15000,
      unpaidDues: 0,
      deductionsTotal: 0,
      refundAmount: 15000,
      remainingDue: 0,
    });
  });

  test("deducts itemized charges and returns remaining refund", () => {
    // Deposit: ₹20,000
    // Unpaid rent: ₹3,000
    // Deductions: Painting (₹1,500), Deep Cleaning (₹800), Broken Mirror (₹700)
    // Total charges: 3000 + 3000 = 6000
    // Expected refund: 14000
    const settlement = calculateDepositSettlement({
      depositAmount: 20000,
      unpaidDues: 3000,
      deductions: [
        { reason: "Painting Charges", amount: 1500 },
        { reason: "Deep Cleaning", amount: 800 },
        { reason: "Broken Mirror Repair", amount: 700 },
      ],
    });

    expect(settlement.depositAmount).toBe(20000);
    expect(settlement.unpaidDues).toBe(3000);
    expect(settlement.deductionsTotal).toBe(3000);
    expect(settlement.refundAmount).toBe(14000);
    expect(settlement.remainingDue).toBe(0);
  });

  test("handles exact break-even where charges equal deposit amount", () => {
    // Deposit: ₹10,000, Unpaid dues: ₹10,000
    const settlement = calculateDepositSettlement({
      depositAmount: 10000,
      unpaidDues: 10000,
      deductions: [],
    });

    expect(settlement.refundAmount).toBe(0);
    expect(settlement.remainingDue).toBe(0);
  });

  test("handles negative settlement when charges exceed security deposit", () => {
    // Deposit: ₹10,000
    // Unpaid dues: ₹12,000
    // Wall damage: ₹3,000
    // Total charges: 15,000
    // Refund must be 0, and resident owes remainingDue of 5,000
    const settlement = calculateDepositSettlement({
      depositAmount: 10000,
      unpaidDues: 12000,
      deductions: [{ reason: "Wall Damaged", amount: 3000 }],
    });

    expect(settlement.depositAmount).toBe(10000);
    expect(settlement.deductionsTotal).toBe(3000);
    expect(settlement.refundAmount).toBe(0);
    expect(settlement.remainingDue).toBe(5000);
  });

  test("ignores negative deduction amounts safely", () => {
    // Deductions with negative values should be normalized to 0
    const settlement = calculateDepositSettlement({
      depositAmount: 10000,
      unpaidDues: 0,
      deductions: [
        { reason: "Normal repair", amount: 1000 },
        { reason: "Accidental negative input", amount: -500 },
      ],
    });

    expect(settlement.deductionsTotal).toBe(1000);
    expect(settlement.refundAmount).toBe(9000);
    expect(settlement.remainingDue).toBe(0);
  });

  test("handles missing or null arguments with safe defaults", () => {
    const emptySettlement = calculateDepositSettlement({});

    expect(emptySettlement).toEqual({
      depositAmount: 0,
      unpaidDues: 0,
      deductionsTotal: 0,
      refundAmount: 0,
      remainingDue: 0,
    });
  });
});
