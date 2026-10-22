import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { listDefaulters } from "@/lib/billing/invoice";
import DefaultersClient from "./DefaultersClient";

export const metadata = { title: "Defaulters - Bedy" };
export const dynamic = "force-dynamic";

export default async function AdminDefaultersPage() {
  const user = await getServerSession();
  requirePageRole(user, "SOCIETY_ADMIN");

  const defaulters = await listDefaulters(user.societyId);

  // Group by room/flat so a resident/flat that owes across multiple months shows once.
  const byFlat = new Map();
  for (const d of defaulters) {
    const key = d.occupancyId || d.flatId || d.id;
    const row = byFlat.get(key) ?? {
      id: d.id,
      targetId: key,
      flatId: d.flatId,
      occupancyId: d.occupancyId,
      unitLabel: d.unitLabel,
      flatNumber: d.flatNumber,
      block: d.block,
      residentName: d.residentName,
      phone: d.phone,
      societyName: user.society?.name || "Bedy PG",
      outstanding: 0,
      invoiceCount: 0,
      oldestDueDate: null,
      daysOverdue: 0,
    };
    row.outstanding += d.outstanding;
    row.invoiceCount += 1;
    row.daysOverdue = Math.max(row.daysOverdue, d.daysOverdue);
    if (!row.oldestDueDate) row.oldestDueDate = d.dueDate?.toISOString() ?? null;
    byFlat.set(key, row);
  }

  const rows = [...byFlat.values()].sort((a, b) => b.outstanding - a.outstanding);
  const totalOutstanding = rows.reduce((sum, r) => sum + r.outstanding, 0);

  return (
    <DefaultersClient
      defaulters={rows}
      summary={{
        flatCount: rows.length,
        invoiceCount: defaulters.length,
        totalOutstanding,
        worstDays: rows.reduce((max, r) => Math.max(max, r.daysOverdue), 0),
      }}
    />
  );
}