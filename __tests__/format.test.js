import { formatMoney, titleCase, initials } from "@/lib/format";

describe("Formatting Utilities (lib/format.js)", () => {
  describe("formatMoney", () => {
    test("formats regular integer amounts with Indian Rupee symbol", () => {
      const formatted = formatMoney(15000);
      expect(formatted).toContain("15,000");
      expect(formatted).toContain("₹");
    });

    test("handles zero gracefully", () => {
      const formatted = formatMoney(0);
      expect(formatted).toContain("0");
    });

    test("handles null or undefined by defaulting to 0", () => {
      expect(formatMoney(null)).toContain("0");
      expect(formatMoney(undefined)).toContain("0");
    });
  });

  describe("titleCase", () => {
    test("capitalizes snake_case words", () => {
      expect(titleCase("pending_approval")).toBe("Pending Approval");
    });

    test("keeps financial acronyms in uppercase like UPI, NEFT, GST", () => {
      expect(titleCase("payment_mode_upi")).toBe("Payment Mode UPI");
      expect(titleCase("gst_invoice_pdf")).toBe("GST Invoice PDF");
    });

    test("returns empty string for empty input", () => {
      expect(titleCase("")).toBe("");
      expect(titleCase(null)).toBe("");
    });
  });

  describe("initials", () => {
    test("extracts initials from full names", () => {
      expect(initials("Venkatesh Babu")).toBe("VB");
      expect(initials("Deepak Sharma")).toBe("DS");
    });

    test("handles single names", () => {
      expect(initials("Admin")).toBe("A");
    });

    test("returns question mark for null or empty", () => {
      expect(initials("")).toBe("?");
      expect(initials(null)).toBe("?");
    });
  });
});

