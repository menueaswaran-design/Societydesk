import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { getResidentFlatIds } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { receiptDocumentUrl } from "@/lib/billing/receipt";
import { outstandingOn } from "@/lib/billing/penalty";
import ResidentInvoicesClient from "./ResidentInvoicesClient";

export const metadata = { title: "My Invoices - Bedy" };
export const dynamic = "force-dynamic";

export default async function ResidentInvoicesPage() {
  const user = await getServerSession();
  requirePageRole(user, "RESIDENT");

  // Scoped to resident's own flats AND PG occupancies
  let flatIds = [];
  try {
    flatIds = await getResidentFlatIds(user.id);
  } catch {
    flatIds = [];
  }

  const occupancies = await prisma.occupancy.findMany({
    where: { userId: user.id, status: { in: ["ACTIVE", "NOTICE", "LEFT"] } },
    select: { id: true },
  });
  const occupancyIds = occupancies.map((o) => o.id);

  // If user has neither flat nor occupancy, return empty list
  if (!flatIds.length && !occupancyIds.length) {
    return <ResidentInvoicesClient invoices={[]} />;
  }

  const whereClause = {
    societyId: user.societyId,
    OR: [
      ...(flatIds.length ? [{ flatId: { in: flatIds } }] : []),
      ...(occupancyIds.length ? [{ occupancyId: { in: occupancyIds } }] : []),
    ],
  };

  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    include: {
      flat: { select: { id: true, flatNumber: true, block: true } },
      occupancy: {
        include: {
          unit: { select: { id: true, unitNumber: true } },
          bed: { select: { id: true, bedLabel: true } },
        },
      },
      items: { orderBy: { type: "asc" } },
      payments: {
        include: { receipts: { select: { id: true, receiptNumber: true, pdfUrl: true } } },
        orderBy: { paymentDate: "desc" },
      },
    },
    orderBy: [{ billingPeriod: "desc" }, { invoiceNumber: "desc" }],
  });

  const rows = invoices.map((inv) => ({
    ...inv,
    flatLabel: inv.flat
      ? inv.flat.block ? `${inv.flat.block}-${inv.flat.flatNumber}` : inv.flat.flatNumber
      : inv.occupancy
      ? `Room ${inv.occupancy.unit?.unitNumber} · Bed ${inv.occupancy.bed?.bedLabel}`
      : "Assigned",
    outstanding: outstandingOn(inv),
    dueDate: inv.dueDate?.toISOString() ?? null,
    invoiceDate: inv.invoiceDate?.toISOString() ?? null,
    payments: inv.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      paymentDate: p.paymentDate?.toISOString() ?? null,
      receiptNumber: p.receipts[0]?.receiptNumber ?? null,
      receiptUrl: p.receipts[0]
        ? (p.receipts[0].pdfUrl ?? receiptDocumentUrl(p.receipts[0].id))
        : null,
    })),
  }));

  return <ResidentInvoicesClient invoices={rows} />;
}
