import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { getResidentFlatIds } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { receiptDocumentUrl } from "@/lib/billing/receipt";
import ResidentPaymentsClient from "./ResidentPaymentsClient";

export const metadata = { title: "My Payments - SocietyDesk" };
export const dynamic = "force-dynamic";

export default async function ResidentPaymentsPage() {
  const user = await getServerSession();
  requirePageRole(user, "RESIDENT");

  // Only the resident's own flats - never another resident's payments.
  const flatIds = await getResidentFlatIds(user.id);
  const now = new Date();

  const [payments, totals, pendingOrders] = await Promise.all([
    prisma.payment.findMany({
      where: { flatId: { in: flatIds } },
      include: {
        flat: { select: { id: true, flatNumber: true, block: true } },
        invoice: { select: { id: true, invoiceNumber: true, billingPeriod: true } },
        receipts: { select: { id: true, receiptNumber: true, pdfUrl: true } },
      },
      orderBy: { paymentDate: "desc" },
    }),
    prisma.payment.aggregate({
      where: { flatId: { in: flatIds } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    // Online payments the resident started but never finished. Without this the
    // abandoned half of the flow would be invisible to both sides.
    prisma.paymentOrder.findMany({
      where: {
        flatId: { in: flatIds },
        status: { in: ["CREATED", "EXPIRED"] },
        expiresAt: { gt: now },
      },
      select: {
        id: true,
        amount: true,
        status: true,
        gateway: true,
        createdAt: true,
        expiresAt: true,
        invoiceId: true,
        invoice: { select: { invoiceNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const paidThisMonth = payments
    .filter((p) => new Date(p.paymentDate) >= monthStart)
    .reduce((s, p) => s + p.amount, 0);

  const rows = payments.map(({ receipts, ...p }) => ({
    ...p,
    paymentDate: p.paymentDate?.toISOString() ?? null,
    receiptNumber: receipts[0]?.receiptNumber ?? null,
    // Fall back to the canonical route so the link still resolves for receipts
    // recorded before pdfUrl was persisted (the route backfills it on view).
    receiptUrl: receipts[0]
      ? (receipts[0].pdfUrl ?? receiptDocumentUrl(receipts[0].id))
      : null,
  }));

  return (
    <ResidentPaymentsClient
      payments={rows}
      pendingOrders={pendingOrders.map((o) => ({
        ...o,
        createdAt: o.createdAt?.toISOString() ?? null,
        expiresAt: o.expiresAt?.toISOString() ?? null,
      }))}
      summary={{
        totalPaid: totals._sum.amount ?? 0,
        count: totals._count._all,
        paidThisMonth,
      }}
    />
  );
}