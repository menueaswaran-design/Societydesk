import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { getResidentFlatIds } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { PAYMENT_METHOD } from "@/lib/constants";
import PaymentsClient from "./PaymentsClient";

export const metadata = { title: "Payments - Bedy" };
export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const user = await getServerSession();
  requirePageRole(user, ["SOCIETY_ADMIN", "FLAT_ADMIN"]);

  const isFlatAdmin = user.role === "FLAT_ADMIN";
  const assignedFlatIds = isFlatAdmin ? await getResidentFlatIds(user.id) : null;
  const where = assignedFlatIds
    ? { societyId: user.societyId, flatId: { in: assignedFlatIds } }
    : { societyId: user.societyId };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [payments, totals, monthTotals, methodTotals, pendingOrders] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        flat: { select: { id: true, flatNumber: true, block: true } },
        occupancy: {
          include: {
            unit: { select: { unitNumber: true } },
            bed: { select: { bedLabel: true } },
            user: { select: { name: true } },
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            billingPeriod: true,
            occupancy: {
              include: {
                unit: { select: { unitNumber: true } },
                bed: { select: { bedLabel: true } },
                user: { select: { name: true } },
              },
            },
          },
        },
        receipts: { select: { id: true, receiptNumber: true, pdfUrl: true } },
        recordedBy: { select: { name: true } },
      },
      orderBy: { paymentDate: "desc" },
      take: 300,
    }),
    prisma.payment.aggregate({
      where,
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.payment.aggregate({
      where: { ...where, paymentDate: { gte: monthStart } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.payment.groupBy({
      by: ["paymentMethod"],
      where,
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.paymentOrder.findMany({
      where: { ...where, status: { in: ["CREATED", "EXPIRED"] } },
      include: {
        flat: { select: { id: true, flatNumber: true, block: true } },
        occupancy: {
          include: {
            unit: { select: { unitNumber: true } },
            bed: { select: { bedLabel: true } },
            user: { select: { name: true } },
          },
        },
        invoice: { select: { id: true, invoiceNumber: true } },
        initiatedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  // Flatten the receipt relation and derive clean Room / Flat labels
  const rows = payments.map(({ receipts, ...p }) => {
    const occ = p.occupancy || p.invoice?.occupancy;
    let unitLabel = "";
    if (occ?.unit?.unitNumber) {
      unitLabel = `Room ${occ.unit.unitNumber}${occ.bed?.bedLabel ? ` (${occ.bed.bedLabel})` : ""}`;
    } else if (p.flat?.flatNumber) {
      unitLabel = p.flat.block ? `${p.flat.block}-${p.flat.flatNumber}` : `Flat ${p.flat.flatNumber}`;
    } else {
      unitLabel = "—";
    }

    return {
      ...p,
      unitLabel,
      paymentDate: p.paymentDate?.toISOString() ?? null,
      receiptNumber: receipts[0]?.receiptNumber ?? null,
      receiptUrl: receipts[0]?.pdfUrl ?? null,
    };
  });

  const byMethod = Object.fromEntries(
    Object.values(PAYMENT_METHOD).map((m) => {
      const row = methodTotals.find((t) => t.paymentMethod === m);
      return [m, { amount: row?._sum.amount ?? 0, count: row?._count._all ?? 0 }];
    })
  );

  return (
    <PaymentsClient
      payments={rows}
      pendingOrders={pendingOrders.map((o) => {
        let unitLabel = "";
        if (o.occupancy?.unit?.unitNumber) {
          unitLabel = `Room ${o.occupancy.unit.unitNumber}${o.occupancy.bed?.bedLabel ? ` (${o.occupancy.bed.bedLabel})` : ""}`;
        } else if (o.flat?.flatNumber) {
          unitLabel = o.flat.block ? `${o.flat.block}-${o.flat.flatNumber}` : `Flat ${o.flat.flatNumber}`;
        } else {
          unitLabel = "—";
        }

        return {
          ...o,
          unitLabel,
          createdAt: o.createdAt?.toISOString() ?? null,
          expiresAt: o.expiresAt?.toISOString() ?? null,
        };
      })}
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
