/**
 * Part-month rent calculation for PG / Hostel tenants who join or leave mid-month.
 *
 * Formula:
 *   daily_rate = monthly_rent / days_in_month
 *   amount     = Math.round(daily_rate * days_stayed)
 */

export function getDaysInMonth(year, monthIndex) {
  // monthIndex: 0-based (0 = January, 11 = December)
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function calculateProratedRent({
  monthlyRent,
  billingPeriod, // "YYYY-MM"
  joinDate,      // Date or ISO string
  leaveDate = null, // Date or ISO string or null
}) {
  if (!monthlyRent || monthlyRent <= 0) return 0;

  const [yearStr, monthStr] = billingPeriod.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-based

  const daysInMonth = getDaysInMonth(year, month);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, daysInMonth, 23, 59, 59);

  const jDate = joinDate ? new Date(joinDate) : monthStart;
  const lDate = leaveDate ? new Date(leaveDate) : null;

  // If resident joined after this billing month, 0 dues
  if (jDate > monthEnd) return 0;

  // If resident left before this billing month started, 0 dues
  if (lDate && lDate < monthStart) return 0;

  // Calculate start day within the month (1-based)
  let startDay = 1;
  if (jDate > monthStart) {
    startDay = jDate.getDate();
  }

  // Calculate end day within the month (1-based)
  let endDay = daysInMonth;
  if (lDate && lDate < monthEnd) {
    endDay = lDate.getDate();
  }

  const daysStayed = Math.max(0, endDay - startDay + 1);

  if (daysStayed >= daysInMonth) {
    return monthlyRent;
  }

  const dailyRate = monthlyRent / daysInMonth;
  return Math.round(dailyRate * daysStayed);
}

