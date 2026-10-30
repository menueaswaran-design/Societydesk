const rupee = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatMoney(amount) {
  return rupee.format(Number(amount) || 0);
}

/** Formats numbers compactly for dashboards and stat strips: ₹6.56 Cr, ₹9.60 L, ₹15k */
export function formatCompactMoney(amount) {
  const num = Number(amount) || 0;
  if (Math.abs(num) >= 10000000) {
    return `₹${(num / 10000000).toFixed(2).replace(/\.00$/, "")} Cr`;
  }
  if (Math.abs(num) >= 100000) {
    return `₹${(num / 100000).toFixed(2).replace(/\.00$/, "")} L`;
  }
  if (Math.abs(num) >= 10000) {
    return `₹${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return formatMoney(num);
}

/** Computes relative due date e.g. "Due today", "3d overdue" */
export function getRelativeDueDate(dueDateStr) {
  if (!dueDateStr) return null;
  const due = new Date(dueDateStr);
  if (Number.isNaN(due.getTime())) return null;
  const now = new Date();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = dueDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { label: "Due today", tone: "amber", isOverdue: false, days: 0 };
  } else if (diffDays === 1) {
    return { label: "Due tomorrow", tone: "slate", isOverdue: false, days: 1 };
  } else if (diffDays > 1 && diffDays <= 7) {
    return { label: `Due in ${diffDays}d`, tone: "slate", isOverdue: false, days: diffDays };
  } else if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return { label: `${daysAgo}d overdue`, tone: "rose", isOverdue: true, days: diffDays };
  } else {
    return { label: formatDate(dueDateStr), tone: "slate", isOverdue: false, days: diffDays };
  }
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