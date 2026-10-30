import { unitCreateSchema, unitUpdateSchema, optionalIdSchema } from "@/lib/validation/schemas";

describe("Unit & Room Validation Schemas (lib/validation/schemas.js)", () => {
  test("accepts room creation with empty buildingId string and transforms it to null", () => {
    const payload = {
      unitNumber: "101",
      floor: "1",
      buildingId: "",
      unitType: "TRIPLE",
      bedCapacity: 3,
      rentAmount: 8500,
      ac: false,
      attachedBathroom: false,
    };

    const parsed = unitCreateSchema.parse(payload);
    expect(parsed.unitNumber).toBe("101");
    expect(parsed.floor).toBe("1");
    expect(parsed.buildingId).toBeNull();
    expect(parsed.unitType).toBe("TRIPLE");
    expect(parsed.bedCapacity).toBe(3);
    expect(parsed.rentAmount).toBe(8500);
    expect(parsed.ac).toBe(false);
    expect(parsed.attachedBathroom).toBe(false);
    expect(parsed.status).toBe("AVAILABLE");
  });

  test("accepts room creation with undefined or null buildingId", () => {
    const withNull = unitCreateSchema.parse({
      unitNumber: "102",
      buildingId: null,
      rentAmount: 6000,
    });
    expect(withNull.buildingId).toBeNull();

    const withUndefined = unitCreateSchema.parse({
      unitNumber: "103",
      rentAmount: 7000,
    });
    expect(withUndefined.buildingId).toBeUndefined();
  });

  test("accepts room creation with valid buildingId", () => {
    const parsed = unitCreateSchema.parse({
      unitNumber: "201",
      buildingId: "bld_12345",
      rentAmount: 9000,
    });
    expect(parsed.buildingId).toBe("bld_12345");
  });

  test("optionalIdSchema properly handles empty strings, whitespace, null, and ids", () => {
    expect(optionalIdSchema.parse("")).toBeNull();
    expect(optionalIdSchema.parse("   ")).toBeNull();
    expect(optionalIdSchema.parse(null)).toBeNull();
    expect(optionalIdSchema.parse(undefined)).toBeUndefined();
    expect(optionalIdSchema.parse("  valid_id_123  ")).toBe("valid_id_123");
  });

  test("unitUpdateSchema allows updating buildingId to empty string or null", () => {
    const updatedWithEmpty = unitUpdateSchema.parse({ buildingId: "" });
    expect(updatedWithEmpty.buildingId).toBeNull();

    const updatedWithNull = unitUpdateSchema.parse({ buildingId: null });
    expect(updatedWithNull.buildingId).toBeNull();
  });
});

