import { calculateProratedRent, getDaysInMonth } from "@/lib/billing/prorate";

describe("Prorated Rent Calculations (lib/billing/prorate.js)", () => {
  describe("getDaysInMonth", () => {
    test("returns correct days for standard months", () => {
      // monthIndex: 0 = Jan (31), 1 = Feb (28/29), 9 = Oct (31)
      expect(getDaysInMonth(2026, 0)).toBe(31); // January
      expect(getDaysInMonth(2026, 3)).toBe(30); // April
      expect(getDaysInMonth(2026, 9)).toBe(31); // October
    });

    test("handles leap years correctly", () => {
      expect(getDaysInMonth(2024, 1)).toBe(29); // 2024 is a leap year
      expect(getDaysInMonth(2025, 1)).toBe(28); // 2025 is not
    });
  });

  describe("calculateProratedRent", () => {
    const monthlyRent = 10000;
    const billingPeriod = "2026-10"; // October has 31 days

    test("charges full rent when resident stayed the entire month", () => {
      const result = calculateProratedRent({
        monthlyRent,
        billingPeriod,
        joinDate: "2026-10-01",
        leaveDate: null,
      });

      expect(result).toBe(10000);
    });

    test("prorates rent accurately for mid-month joiner", () => {
      // Joined on Oct 16. Days stayed: 16 to 31 = 16 days.
      // Daily rate: 10000 / 31 = 322.58
      // Expected: Math.round(322.5806 * 16) = 5161
      const result = calculateProratedRent({
        monthlyRent,
        billingPeriod,
        joinDate: "2026-10-16",
        leaveDate: null,
      });

      expect(result).toBe(5161);
    });

    test("prorates rent accurately when resident leaves mid-month", () => {
      // Joined earlier, vacated on Oct 10. Days stayed: 1 to 10 = 10 days.
      // Daily rate: 10000 / 31 = 322.58
      // Expected: Math.round(322.5806 * 10) = 3226
      const result = calculateProratedRent({
        monthlyRent,
        billingPeriod,
        joinDate: "2026-08-01",
        leaveDate: "2026-10-10",
      });

      expect(result).toBe(3226);
    });

    test("returns 0 if resident joins after the billing period", () => {
      const result = calculateProratedRent({
        monthlyRent,
        billingPeriod,
        joinDate: "2026-11-01", // November joiner for October bill
        leaveDate: null,
      });

      expect(result).toBe(0);
    });

    test("returns 0 if resident left before the billing period started", () => {
      const result = calculateProratedRent({
        monthlyRent,
        billingPeriod,
        joinDate: "2026-01-01",
        leaveDate: "2026-09-30", // Left in Sept
      });

      expect(result).toBe(0);
    });

    test("returns 0 when monthly rent is 0 or negative", () => {
      expect(calculateProratedRent({ monthlyRent: 0, billingPeriod })).toBe(0);
      expect(calculateProratedRent({ monthlyRent: -5000, billingPeriod })).toBe(0);
    });
  });
});

