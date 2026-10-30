import { formatMoney, formatCompactMoney, getRelativeDueDate, titleCase, initials } from "@/lib/format";

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

  describe("formatCompactMoney", () => {
    test("formats crores with Cr suffix", () => {
      expect(formatCompactMoney(656709655)).toBe("₹65.67 Cr");
    });

    test("formats lakhs with L suffix", () => {
      expect(formatCompactMoney(959944)).toBe("₹9.60 L");
    });

    test("formats tens of thousands with k suffix", () => {
      expect(formatCompactMoney(15000)).toBe("₹15k");
    });

    test("formats standard small amounts normally", () => {
      expect(formatCompactMoney(8500)).toContain("8,500");
      expect(formatCompactMoney(0)).toContain("0");
    });
  });

  describe("getRelativeDueDate", () => {
    test("identifies overdue dates", () => {
      const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const res = getRelativeDueDate(past);
      expect(res.isOverdue).toBe(true);
      expect(res.label).toContain("3d overdue");
    });

    test("identifies due today", () => {
      const today = new Date().toISOString();
      const res = getRelativeDueDate(today);
      expect(res.label).toBe("Due today");
      expect(res.isOverdue).toBe(false);
    });

    test("handles null gracefully", () => {
      expect(getRelativeDueDate(null)).toBeNull();
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

