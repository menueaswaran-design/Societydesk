import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { outstandingOn } from "@/lib/billing/penalty";
import InvoicesClient from "./InvoicesClient";

export const metadata = { title: "Invoices - Bedy" };
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

  const [invoices, summary, rawUnits, occupancies, meterLogs] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        society: { select: { id: true, name: true, phone: true } },
        flat: {
          select: {
            id: true,
            flatNumber: true,
            block: true,
            residents: {
              where: { endDate: null },
              include: { user: { select: { name: true, phone: true } } },
              orderBy: { isPrimary: "desc" },
              take: 1,
            },
          },
        },
        occupancy: {
          include: {
            unit: { select: { id: true, unitNumber: true } },
            bed: { select: { id: true, bedLabel: true } },
            user: { select: { id: true, name: true, phone: true } },
          },
        },
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
    prisma.unit.findMany({
      where: { societyId: user.societyId },
      select: { id: true, unitNumber: true, floor: true, rentAmount: true },
      orderBy: { unitNumber: "asc" },
    }),
    prisma.occupancy.findMany({
      where: { societyId: user.societyId, status: { in: ["ACTIVE", "NOTICE"] } },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        unit: { select: { id: true, unitNumber: true } },
        bed: { select: { id: true, bedLabel: true } },
      },
      orderBy: [{ unit: { unitNumber: "asc" } }, { bed: { bedLabel: "asc" } }],
    }),
    prisma.auditLog.findMany({
      where: { societyId: user.societyId, entityType: "UNIT_METER" },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  // Map each room's latest stored meter reading from previous month
  const latestMeterByRoom = {};
  for (const log of meterLogs) {
    const key = log.entityId;
    if (key && !latestMeterByRoom[key]) {
      try {
        const parsed = typeof log.newValue === "string" ? JSON.parse(log.newValue) : log.newValue;
        const reading =
          typeof parsed === "object"
            ? parsed?.reading ?? parsed?.meterEnd ?? parsed?.unitsUsed
            : Number(parsed);
        if (reading != null && !isNaN(Number(reading))) {
          latestMeterByRoom[key] = {
            lastReading: Number(reading),
            ratePerUnit: parsed?.ratePerUnit ?? 10,
            lastPeriod: parsed?.billingPeriod ?? null,
          };
        }
      } catch {
        if (!isNaN(Number(log.newValue))) {
          latestMeterByRoom[key] = {
            lastReading: Number(log.newValue),
            ratePerUnit: 10,
          };
        }
      }
    }
  }

  const unitsWithMeters = rawUnits.map((u) => {
    const meta = latestMeterByRoom[u.id] || latestMeterByRoom[u.unitNumber] || {};
    return {
      ...u,
      lastReading: meta.lastReading ?? 0,
      defaultRate: meta.ratePerUnit ?? 10,
      lastPeriod: meta.lastPeriod ?? null,
    };
  });

  const billed = summary._sum.totalAmount ?? 0;
  const collected = summary._sum.paidAmount ?? 0;

  const withOutstanding = invoices.map((inv) => {
    const residentName =
      inv.occupancy?.user?.name ||
      inv.flat?.residents?.[0]?.user?.name ||
      null;
    const residentPhone =
      inv.occupancy?.user?.phone ||
      inv.flat?.residents?.[0]?.user?.phone ||
      null;
    const roomLabel = inv.occupancy
      ? `Room ${inv.occupancy.unit?.unitNumber || "-"}${
          inv.occupancy.bed ? ` (${inv.occupancy.bed.bedLabel})` : ""
        }`
      : inv.flat?.block
      ? `${inv.flat.block}-${inv.flat.flatNumber}`
      : inv.flat?.flatNumber || "Unit";

    return {
      ...inv,
      residentName,
      residentPhone,
      unitLabel: roomLabel,
      societyName: inv.society?.name || user.society?.name || "Bedy",
      outstanding: outstandingOn(inv),
      dueDate: inv.dueDate?.toISOString() ?? null,
      invoiceDate: inv.invoiceDate?.toISOString() ?? null,
      payments: inv.payments.map((p) => ({
        ...p,
        paymentDate: p.paymentDate?.toISOString() ?? null,
      })),
    };
  });

  return (
    <InvoicesClient
      invoices={withOutstanding}
      units={unitsWithMeters}
      occupancies={occupancies}
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
