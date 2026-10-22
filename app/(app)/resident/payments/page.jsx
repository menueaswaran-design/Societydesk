import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { getResidentFlatIds } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { receiptDocumentUrl } from "@/lib/billing/receipt";
import ResidentPaymentsClient from "./ResidentPaymentsClient";

export const metadata = { title: "My Payments - Bedy" };
export const dynamic = "force-dynamic";

export default async function ResidentPaymentsPage() {
  const user = await getServerSession();
  requirePageRole(user, "RESIDENT");

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

  if (!flatIds.length && !occupancyIds.length) {
    return (
      <ResidentPaymentsClient
        payments={[]}
        stats={{ totalCount: 0, totalAmount: 0, paidThisMonth: 0 }}
        pendingOrders={[]}
      />
    );
  }

  const whereClause = {
    societyId: user.societyId,
    OR: [
      ...(flatIds.length ? [{ flatId: { in: flatIds } }] : []),
      ...(occupancyIds.length ? [{ occupancyId: { in: occupancyIds } }] : []),
    ],
  };

  const now = new Date();

  const [payments, totals, pendingOrders] = await Promise.all([
    prisma.payment.findMany({
      where: whereClause,
      include: {
        flat: { select: { id: true, flatNumber: true, block: true } },
        occupancy: {
          include: {
            unit: { select: { id: true, unitNumber: true } },
            bed: { select: { id: true, bedLabel: true } },
          },
        },
        invoice: { select: { id: true, invoiceNumber: true, billingPeriod: true } },
        receipts: { select: { id: true, receiptNumber: true, pdfUrl: true } },
      },
      orderBy: { paymentDate: "desc" },
    }),
    prisma.payment.aggregate({
      where: whereClause,
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.paymentOrder.findMany({
      where: {
        societyId: user.societyId,
        OR: [
          ...(flatIds.length ? [{ flatId: { in: flatIds } }] : []),
          ...(occupancyIds.length ? [{ occupancyId: { in: occupancyIds } }] : []),
        ],
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

  const rows = payments.map((p) => {
    const flatLabel = p.flat
      ? p.flat.block ? `${p.flat.block}-${p.flat.flatNumber}` : p.flat.flatNumber
      : p.occupancy
      ? `Room ${p.occupancy.unit?.unitNumber} · Bed ${p.occupancy.bed?.bedLabel}`
      : "Assigned";

    const receipt = p.receipts[0] ?? null;
    return {
      id: p.id,
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      paymentDate: p.paymentDate?.toISOString() ?? null,
      notes: p.notes,
      flatLabel,
      invoice: p.invoice
        ? {
            id: p.invoice.id,
            invoiceNumber: p.invoice.invoiceNumber,
            billingPeriod: p.invoice.billingPeriod,
          }
        : null,
      receipt: receipt
        ? {
            id: receipt.id,
            receiptNumber: receipt.receiptNumber,
            downloadUrl: receipt.pdfUrl ?? receiptDocumentUrl(receipt.id),
          }
        : null,
    };
  });

  return (
    <ResidentPaymentsClient
      payments={rows}
      stats={{
        totalCount: totals._count._all ?? 0,
        totalAmount: totals._sum.amount ?? 0,
        paidThisMonth,
      }}
      pendingOrders={pendingOrders.map((o) => ({
        id: o.id,
        amount: o.amount,
        status: o.status,
        gateway: o.gateway,
        createdAt: o.createdAt?.toISOString() ?? null,
        expiresAt: o.expiresAt?.toISOString() ?? null,
        invoiceId: o.invoiceId,
        invoiceNumber: o.invoice?.invoiceNumber ?? null,
      }))}
    />
  );
}
