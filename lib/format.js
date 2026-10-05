const rupee = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatMoney(amount) {
  return rupee.format(Number(amount) || 0);
}

export function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "2026-10" -> "October 2026" */
export function formatPeriod(period) {
  if (!period) return "-";
  const [year, month] = String(period).split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) return period;
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

/**
 * Tokens that must keep their upper-case spelling. Without this, UPI renders as
 * "Upi", which reads wrong on a receipt and in the payment-method filter.
 */
const ACRONYMS = new Map(
  ["upi", "neft", "rtgs", "imps", "gst", "pin", "otp", "pdf", "csv", "sms"].map(
    (t) => [t, t.toUpperCase()]
  )
);

export function titleCase(value) {
  if (!value) return "";
  return String(value)
    .split("_")
    .map((word) => {
      const lower = word.toLowerCase();
      return ACRONYMS.has(lower) ? ACRONYMS.get(lower) : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}