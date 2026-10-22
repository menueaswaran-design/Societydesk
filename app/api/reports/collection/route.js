import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/reports/collection
 * Rent and dues collection trends by billing period.
 */
export const GET = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);

  const invoices = await prisma.invoice.findMany({
    where: { societyId },
    select: {
      billingPeriod: true,
      totalAmount: true,
      paidAmount: true,
      status: true,
    },
    orderBy: { billingPeriod: "desc" },
  });

  // Group by billing period
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

  const reports = Object.values(periodsMap).map((p) => ({
    ...p,
    collectionRate: p.totalBilled > 0 ? Math.round((p.totalCollected / p.totalBilled) * 100) : 0,
  }));

  return ok(reports);
});

