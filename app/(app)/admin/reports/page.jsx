import { getServerSession } from "@/lib/auth/server";
import { requirePageRole, ADMIN_ROLES } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import ReportsClient from "./ReportsClient";

export const metadata = { title: "Occupancy & Revenue Reports" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getServerSession();
  requirePageRole(user, ADMIN_ROLES);
  const societyId = user.societyId;

  const [units, beds, occupancies, invoices, deposits] = await Promise.all([
    prisma.unit.findMany({
      where: { societyId },
      include: {
        building: true,
        beds: {
          include: {
            occupancies: {
              where: { status: { in: ["ACTIVE", "NOTICE"] } },
              include: { user: { select: { id: true, name: true, phone: true } } },
            },
          },
        },
      },
      orderBy: { unitNumber: "asc" },
    }),
    prisma.bed.findMany({
      where: { societyId },
      select: { id: true, status: true, rentAmount: true },
    }),
    prisma.occupancy.findMany({
      where: { societyId },
      include: {
        user: { select: { name: true, phone: true, email: true } },
        unit: true,
        bed: true,
      },
      orderBy: { joinDate: "desc" },
    }),
    prisma.invoice.findMany({
      where: { societyId },
      select: {
        id: true,
        invoiceNumber: true,
        billingPeriod: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
        dueDate: true,
        occupancy: {
          select: {
            user: { select: { name: true } },
            unit: { select: { unitNumber: true } },
          },
        },
      },
      orderBy: { billingPeriod: "desc" },
    }),
    prisma.deposit.findMany({
      where: { societyId },
      include: {
        deductions: true,
      },
    }),
  ]);

  // Aggregate collection by billing period
  const periodsMap = {};
  for (const inv of invoices) {
    if (!periodsMap[inv.billingPeriod]) {
      periodsMap[inv.billingPeriod] = {
        period: inv.billingPeriod,
        invoicesCount: 0,
        totalBilled: 0,
        totalCollected: 0,
        totalPending: 0,
        paidCount: 0,
      };
    }
    const p = periodsMap[inv.billingPeriod];
    p.invoicesCount += 1;
    p.totalBilled += inv.totalAmount;
    p.totalCollected += inv.paidAmount;
    p.totalPending += Math.max(0, inv.totalAmount - inv.paidAmount);
    if (inv.status === "PAID") p.paidCount += 1;
  }

  const collections = Object.values(periodsMap).map((p) => ({
    ...p,
    collectionRate: p.totalBilled > 0 ? Math.round((p.totalCollected / p.totalBilled) * 100) : 0,
  }));

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === "OCCUPIED").length;
  const vacantBeds = beds.filter((b) => b.status === "VACANT").length;
  const maintenanceBeds = beds.filter((b) => b.status === "MAINTENANCE").length;
  const reservedBeds = beds.filter((b) => b.status === "RESERVED").length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const activeOccupancies = occupancies.filter((o) => o.status === "ACTIVE" || o.status === "NOTICE");
  const projectedMonthlyRent = activeOccupancies.reduce((sum, o) => sum + (o.monthlyRent || 0), 0);

  const totalDepositsHeld = deposits
    .filter((d) => d.status === "HELD" || d.status === "PARTIALLY_REFUNDED")
    .reduce((sum, d) => sum + (d.amountReceived - (d.refundAmount || 0)), 0);

  const totalDepositsRefunded = deposits.reduce((sum, d) => sum + (d.refundAmount || 0), 0);
  const totalDeductions = deposits.reduce((sum, d) => sum + (d.deductionsTotal || 0), 0);

  return (
    <ReportsClient
      metrics={{
        totalRooms: units.length,
        totalBeds,
        occupiedBeds,
        vacantBeds,
        maintenanceBeds,
        reservedBeds,
        occupancyRate,
        projectedMonthlyRent,
        activeResidents: activeOccupancies.length,
        totalDepositsHeld,
        totalDepositsRefunded,
        totalDeductions,
      }}
      units={units}
      collections={collections}
      occupancies={occupancies}
      invoices={invoices}
    />
  );
}

