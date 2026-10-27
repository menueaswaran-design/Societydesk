import { generateInvoicesSchema } from "@/lib/validation/schemas";

describe("Generate Invoices Schema (lib/validation/schemas.js)", () => {
  test("accepts minimal standard invoice generation payload without forcing optional fields", () => {
    const valid = generateInvoicesSchema.parse({
      billingPeriod: "2026-10",
      penaltyPercent: 2,
    });

    expect(valid.billingPeriod).toBe("2026-10");
    expect(valid.penaltyPercent).toBe(2);
    expect(valid.previousDue).toBe(true);
    expect(valid.skipVacant).toBe(true);
    expect(valid.electricityConfig).toBeUndefined();
    expect(valid.extraCharges).toBeUndefined();
  });

  test("accepts COMMON electricity split configuration", () => {
    const payload = {
      billingPeriod: "2026-10",
      electricityConfig: {
        mode: "COMMON",
        commonTotal: 6000,
      },
    };

    const parsed = generateInvoicesSchema.parse(payload);
    expect(parsed.electricityConfig.mode).toBe("COMMON");
    expect(parsed.electricityConfig.commonTotal).toBe(6000);
  });

  test("accepts ROOM_WISE electricity sub-meter configuration with common-area charges and saveMeterReadings", () => {
    const payload = {
      billingPeriod: "2026-10",
      electricityConfig: {
        mode: "ROOM_WISE",
        saveMeterReadings: true,
        commonTotal: 1500,
        commonPerPerson: 150,
        rooms: [
          { unitNumber: "101", amount: 1200 },
          { unitNumber: "201", meterStart: 100, meterEnd: 220, unitsConsumed: 120, ratePerUnit: 10, amount: 1200 },
        ],
      },
    };

    const parsed = generateInvoicesSchema.parse(payload);
    expect(parsed.electricityConfig.mode).toBe("ROOM_WISE");
    expect(parsed.electricityConfig.saveMeterReadings).toBe(true);
    expect(parsed.electricityConfig.commonTotal).toBe(1500);
    expect(parsed.electricityConfig.commonPerPerson).toBe(150);
    expect(parsed.electricityConfig.rooms).toHaveLength(2);
    expect(parsed.electricityConfig.rooms[0].amount).toBe(1200);
    expect(parsed.electricityConfig.rooms[1].meterEnd).toBe(220);
    expect(parsed.electricityConfig.rooms[1].unitsConsumed).toBe(120);
  });

  test("accepts COMMON split configuration with units and rate per unit", () => {
    const payload = {
      billingPeriod: "2026-10",
      electricityConfig: {
        mode: "COMMON",
        commonUnits: 650,
        commonRatePerUnit: 12,
      },
    };

    const parsed = generateInvoicesSchema.parse(payload);
    expect(parsed.electricityConfig.mode).toBe("COMMON");
    expect(parsed.electricityConfig.commonUnits).toBe(650);
    expect(parsed.electricityConfig.commonRatePerUnit).toBe(12);
  });

  test("accepts FIXED electricity charge per resident via commonPerPerson", () => {
    const payload = {
      billingPeriod: "2026-10",
      electricityConfig: {
        mode: "COMMON",
        commonPerPerson: 500,
      },
    };

    const parsed = generateInvoicesSchema.parse(payload);
    expect(parsed.electricityConfig.mode).toBe("COMMON");
    expect(parsed.electricityConfig.commonPerPerson).toBe(500);
  });

  test("accepts INCLUDED in rent as mode NONE", () => {
    const payload = {
      billingPeriod: "2026-10",
      electricityConfig: {
        mode: "NONE",
      },
    };

    const parsed = generateInvoicesSchema.parse(payload);
    expect(parsed.electricityConfig.mode).toBe("NONE");
  });

  test("accepts INDIVIDUAL per-resident electricity configuration", () => {
    const payload = {
      billingPeriod: "2026-10",
      electricityConfig: {
        mode: "INDIVIDUAL",
        individuals: [
          { occupancyId: "occ_1", amount: 650 },
          { occupancyId: "occ_2", amount: 450 },
        ],
      },
    };

    const parsed = generateInvoicesSchema.parse(payload);
    expect(parsed.electricityConfig.mode).toBe("INDIVIDUAL");
    expect(parsed.electricityConfig.individuals).toHaveLength(2);
  });

  test("accepts extra charges (Food, AC, Laundry, Maintenance)", () => {
    const payload = {
      billingPeriod: "2026-10",
      extraCharges: [
        { name: "Mess / Food Charges", type: "FOOD", amount: 2500, targetType: "ALL" },
        { name: "AC Maintenance", type: "MAINTENANCE", amount: 500, targetType: "ROOM", targetId: "room_201" },
      ],
    };

    const parsed = generateInvoicesSchema.parse(payload);
    expect(parsed.extraCharges).toHaveLength(2);
    expect(parsed.extraCharges[0].type).toBe("FOOD");
    expect(parsed.extraCharges[0].amount).toBe(2500);
    expect(parsed.extraCharges[1].targetType).toBe("ROOM");
  });

  test("rejects invalid billing period format", () => {
    expect(() =>
      generateInvoicesSchema.parse({
        billingPeriod: "invalid-period",
      })
    ).toThrow();
  });
});

