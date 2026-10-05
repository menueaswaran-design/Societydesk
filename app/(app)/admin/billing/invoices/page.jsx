import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { outstandingOn } from "@/lib/billing/penalty";
import InvoicesClient from "./InvoicesClient";

export const metadata = { title: "Invoices - SocietyDesk" };
export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage({ searchParams }) {
  const user = await getServerSession();
  requirePageRole(user, "SOCIETY_ADMIN");

  const params = await searchParams;
  const status = typeof params?.status === "string" && params.status ? params.status : null;
  const period = typeof params?.period === "string" && params.period ? params.period : null;

  const where = { societyId: user.societyId };
  if (status) where.status = status;
  if (period) where.billingPeriod = period;

  const [invoices, summary] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        flat: { select: { id: true, flatNumber: true, block: true } },
        items: true,
        payments: { include: { receipts: true }, orderBy: { paymentDate: "desc" } },
      },
      orderBy: [{ billingPeriod: "desc" }, { invoiceNumber: "desc" }],
      take: 200,
    }),
    prisma.invoice.aggregate({
      where: { societyId: user.societyId, status: { not: "CANCELLED" } },
      _sum: { totalAmount: true, paidAmount: true, penalty: true, previousDue: true },
    }),
  ]);

  const billed = summary._sum.totalAmount ?? 0;
  const collected = summary._sum.paidAmount ?? 0;

  const withOutstanding = invoices.map((inv) => ({
    ...inv,
    outstanding: outstandingOn(inv),
    dueDate: inv.dueDate?.toISOString() ?? null,
    invoiceDate: inv.invoiceDate?.toISOString() ?? null,
    payments: inv.payments.map((p) => ({
      ...p,
      paymentDate: p.paymentDate?.toISOString() ?? null,
    })),
  }));

  return (
    <InvoicesClient
      invoices={withOutstanding}
      filters={{ status, period }}
      summary={{
        billed,
        collected,
        outstanding: Math.max(0, billed - collected),
        penalty: summary._sum.penalty ?? 0,
        carriedForward: summary._sum.previousDue ?? 0,
      }}
    />
  );
}