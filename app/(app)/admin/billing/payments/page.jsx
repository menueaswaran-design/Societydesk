import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { PAYMENT_METHOD } from "@/lib/constants";
import PaymentsClient from "./PaymentsClient";

export const metadata = { title: "Payments - SocietyDesk" };
export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const user = await getServerSession();
  requirePageRole(user, "SOCIETY_ADMIN");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [payments, totals, monthTotals, methodTotals, pendingOrders] = await Promise.all([
    prisma.payment.findMany({
      where: { societyId: user.societyId },
      include: {
        flat: { select: { id: true, flatNumber: true, block: true } },
        invoice: { select: { id: true, invoiceNumber: true, billingPeriod: true } },
        receipts: { select: { id: true, receiptNumber: true, pdfUrl: true } },
        recordedBy: { select: { name: true } },
      },
      orderBy: { paymentDate: "desc" },
      take: 300,
    }),
    prisma.payment.aggregate({
      where: { societyId: user.societyId },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.payment.aggregate({
      where: { societyId: user.societyId, paymentDate: { gte: monthStart } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.payment.groupBy({
      by: ["paymentMethod"],
      where: { societyId: user.societyId },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    // Outstanding online collection links. Kept separate from payments because
    // none of this money has arrived yet - mixing the two would overstate
    // collections.
    prisma.paymentOrder.findMany({
      where: { societyId: user.societyId, status: { in: ["CREATED", "EXPIRED"] } },
      include: {
        flat: { select: { id: true, flatNumber: true, block: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
        initiatedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  // Flatten the receipt relation so the client can render it without nesting.
  const rows = payments.map(({ receipts, ...p }) => ({
    ...p,
    paymentDate: p.paymentDate?.toISOString() ?? null,
    receiptNumber: receipts[0]?.receiptNumber ?? null,
    receiptUrl: receipts[0]?.pdfUrl ?? null,
  }));

  const byMethod = Object.fromEntries(
    Object.values(PAYMENT_METHOD).map((m) => {
      const row = methodTotals.find((t) => t.paymentMethod === m);
      return [m, { amount: row?._sum.amount ?? 0, count: row?._count._all ?? 0 }];
    })
  );

  return (
    <PaymentsClient
      payments={rows}
      pendingOrders={pendingOrders.map((o) => ({
        ...o,
        createdAt: o.createdAt?.toISOString() ?? null,
        expiresAt: o.expiresAt?.toISOString() ?? null,
      }))}
      summary={{
        total: totals._sum.amount ?? 0,
        count: totals._count._all,
        monthTotal: monthTotals._sum.amount ?? 0,
        monthCount: monthTotals._count._all,
        byMethod,
      }}
    />
  );
}