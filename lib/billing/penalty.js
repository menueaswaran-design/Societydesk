/**
 * Penalty / late-fee rules (section 19: "Apply applicable penalty").
 *
 * MVP keeps this deliberately simple: a flat percentage of the outstanding
 * amount per overdue invoice, with an optional cap.
 */

export const DEFAULT_PENALTY = {
  percent: 0, // e.g. 2 => 2% of total
  graceDays: 0, // days after dueDate before a penalty applies
  maxAmount: null, // absolute cap per invoice, null = uncapped
  compound: false, // true = penalty applies on previousDue too
};

/** Whole days between dueDate and `now` (0 if not yet due). */
export function daysOverdue(dueDate, now = new Date()) {
  if (!dueDate) return 0;
  const due = startOfDay(new Date(dueDate));
  const today = startOfDay(now);
  const diff = Math.round((today - due) / 86_400_000);
  return diff > 0 ? diff : 0;
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Compute the penalty for an invoice.
 * `outstanding` is totalAmount - paidAmount. Returns a whole rupee amount.
 */
export function calculatePenalty({
  totalAmount,
  paidAmount,
  dueDate,
  now = new Date(),
  config = DEFAULT_PENALTY,
}) {
  const percent = Number(config.percent) || 0;
  if (percent <= 0) return 0;

  const overdueDays = daysOverdue(dueDate, now);
  if (overdueDays <= (Number(config.graceDays) || 0)) return 0;

  const outstanding = Math.max(0, (Number(totalAmount) || 0) - (Number(paidAmount) || 0));
  if (outstanding <= 0) return 0;

  let base = outstanding;
  if (!config.compound) {
    // Only charge on this period's own subtotal, never on carried-over dues.
    base = Math.min(outstanding, Number(totalAmount) || outstanding);
  }

  let penalty = Math.round((base * percent) / 100);
  if (config.maxAmount != null) {
    penalty = Math.min(penalty, Math.round(config.maxAmount));
  }
  return Math.max(0, penalty);
}

/** Total still outstanding on an invoice. */
export function outstandingOn(invoice) {
  return Math.max(0, (invoice.totalAmount || 0) - (invoice.paidAmount || 0));
}