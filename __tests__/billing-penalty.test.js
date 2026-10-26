import {
  daysOverdue,
  calculatePenalty,
  outstandingOn,
  DEFAULT_PENALTY,
} from "@/lib/billing/penalty";

describe("Penalty & Late Fee Rules (lib/billing/penalty.js)", () => {
  describe("daysOverdue", () => {
    test("returns 0 if dueDate is in the future", () => {
      const now = new Date("2026-10-10T12:00:00Z");
      const dueDate = new Date("2026-10-15T12:00:00Z"); // 5 days in future
      expect(daysOverdue(dueDate, now)).toBe(0);
    });

    test("returns 0 if dueDate is today", () => {
      const now = new Date("2026-10-10T14:30:00Z");
      const dueDate = new Date("2026-10-10T09:00:00Z"); // Same day
      expect(daysOverdue(dueDate, now)).toBe(0);
    });

    test("returns positive day count when past due", () => {
      const now = new Date("2026-10-15T12:00:00Z");
      const dueDate = new Date("2026-10-10T12:00:00Z"); // 5 days past due
      expect(daysOverdue(dueDate, now)).toBe(5);
    });

    test("returns 0 for null, undefined, or empty dueDate", () => {
      expect(daysOverdue(null)).toBe(0);
      expect(daysOverdue(undefined)).toBe(0);
    });
  });

  describe("calculatePenalty", () => {
    const fixedNow = new Date("2026-10-20T12:00:00Z");
    const dueDate = "2026-10-10T12:00:00Z"; // 10 days overdue

    test("returns 0 if penalty percentage is 0", () => {
      const penalty = calculatePenalty({
        totalAmount: 10000,
        paidAmount: 0,
        dueDate,
        now: fixedNow,
        config: { percent: 0, graceDays: 0 },
      });
      expect(penalty).toBe(0);
    });

    test("returns 0 within the grace period", () => {
      // 10 days overdue, but property provides 15 grace days
      const penalty = calculatePenalty({
        totalAmount: 10000,
        paidAmount: 0,
        dueDate,
        now: fixedNow,
        config: { percent: 5, graceDays: 15 },
      });
      expect(penalty).toBe(0);
    });

    test("applies penalty percentage once past the grace period", () => {
      // 10 days overdue, grace is 5 days.
      // Outstanding: 10,000. 5% penalty = 500
      const penalty = calculatePenalty({
        totalAmount: 10000,
        paidAmount: 0,
        dueDate,
        now: fixedNow,
        config: { percent: 5, graceDays: 5 },
      });
      expect(penalty).toBe(500);
    });

    test("calculates penalty strictly on outstanding balance for partially paid invoices", () => {
      // Total 10,000, but resident already paid 7,000.
      // Outstanding: 3,000. 5% of 3,000 = 150 (not 5% of 10,000)
      const penalty = calculatePenalty({
        totalAmount: 10000,
        paidAmount: 7000,
        dueDate,
        now: fixedNow,
        config: { percent: 5, graceDays: 0 },
      });
      expect(penalty).toBe(150);
    });

    test("returns 0 if invoice is fully paid or overpaid", () => {
      const fullyPaid = calculatePenalty({
        totalAmount: 10000,
        paidAmount: 10000,
        dueDate,
        now: fixedNow,
        config: { percent: 5, graceDays: 0 },
      });
      expect(fullyPaid).toBe(0);

      const overpaid = calculatePenalty({
        totalAmount: 10000,
        paidAmount: 12000,
        dueDate,
        now: fixedNow,
        config: { percent: 5, graceDays: 0 },
      });
      expect(overpaid).toBe(0);
    });

    test("respects the maximum penalty cap (maxAmount)", () => {
      // 10% on 20,000 = 2,000, but cap is 600
      const penalty = calculatePenalty({
        totalAmount: 20000,
        paidAmount: 0,
        dueDate,
        now: fixedNow,
        config: { percent: 10, graceDays: 0, maxAmount: 600 },
      });
      expect(penalty).toBe(600);
    });

    test("handles DEFAULT_PENALTY configuration safely", () => {
      const penalty = calculatePenalty({
        totalAmount: 10000,
        paidAmount: 0,
        dueDate,
        now: fixedNow,
        config: DEFAULT_PENALTY,
      });
      expect(penalty).toBe(0);
    });
  });

  describe("outstandingOn", () => {
    test("calculates unpaid invoice balance", () => {
      expect(outstandingOn({ totalAmount: 12000, paidAmount: 4000 })).toBe(8000);
      expect(outstandingOn({ totalAmount: 12000, paidAmount: 0 })).toBe(12000);
    });

    test("returns 0 when invoice is completely settled or overpaid", () => {
      expect(outstandingOn({ totalAmount: 12000, paidAmount: 12000 })).toBe(0);
      expect(outstandingOn({ totalAmount: 12000, paidAmount: 15000 })).toBe(0);
    });

    test("handles missing or null amounts safely", () => {
      expect(outstandingOn({})).toBe(0);
      expect(outstandingOn({ totalAmount: null, paidAmount: null })).toBe(0);
    });
  });
});

