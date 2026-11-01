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

  const [payments, totals, monthTotals, methodTotals] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        flat: {
          select: {
            id: true,
            flatNumber: true,
            block: true,
            residents: {
              where: { endDate: null },
              select: { user: { select: { name: true, phone: true } } },
              take: 1,
            },
          },
        },
        occupancy: {
          include: {
            unit: { select: { unitNumber: true } },
            bed: { select: { bedLabel: true } },
            user: { select: { name: true, phone: true } },
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
                user: { select: { name: true, phone: true } },
              },
            },
            flat: {
              select: {
                residents: {
                  where: { endDate: null },
                  select: { user: { select: { name: true, phone: true } } },
                  take: 1,
                },
              },
            },
          },
        },
        receipts: { select: { id: true, receiptNumber: true, pdfUrl: true } },
        recordedBy: { select: { name: true } },
      },
      orderBy: { paymentDate: "desc" },
      take: 500,
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
  ]);

  // Flatten the receipt relation and derive clean Resident & Room labels
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

    const residentName =
      occ?.user?.name ||
      p.flat?.residents?.[0]?.user?.name ||
      p.invoice?.flat?.residents?.[0]?.user?.name ||
      "Resident";

    const residentPhone =
      occ?.user?.phone ||
      p.flat?.residents?.[0]?.user?.phone ||
      p.invoice?.flat?.residents?.[0]?.user?.phone ||
      null;

    return {
      ...p,
      unitLabel,
      residentName,
      residentPhone,
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
