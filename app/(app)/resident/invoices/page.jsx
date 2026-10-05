import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { getResidentFlatIds } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { receiptDocumentUrl } from "@/lib/billing/receipt";
import { outstandingOn } from "@/lib/billing/penalty";
import ResidentInvoicesClient from "./ResidentInvoicesClient";

export const metadata = { title: "My Invoices - SocietyDesk" };
export const dynamic = "force-dynamic";

export default async function ResidentInvoicesPage() {
  const user = await getServerSession();
  requirePageRole(user, "RESIDENT");

  // Scoped to the resident's own flats, so no other flat's invoice is reachable.
  const flatIds = await getResidentFlatIds(user.id);

  const invoices = await prisma.invoice.findMany({
    where: { flatId: { in: flatIds } },
    include: {
      flat: { select: { id: true, flatNumber: true, block: true } },
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