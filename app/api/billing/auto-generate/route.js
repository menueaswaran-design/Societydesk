import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export const DEFAULT_AUTO_CONFIG = {
  mode: "CONFIRMATION", // "CONFIRMATION" | "FULL_AUTO" | "MANUAL"
  dueDay: 10,
  penaltyPercent: 2,
  previousDue: true,
  skipVacant: true,
  lastAutoPeriod: null,
};

/**
 * GET /api/billing/auto-generate
 * Fetch society's auto-generate invoice configuration and current billing period readiness.
 */
export const GET = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);

  const society = await prisma.society.findUnique({
    where: { id: societyId },
    select: { id: true, name: true, code: true, dueDay: true, type: true },
  });

  const record = await prisma.feeConfiguration.findFirst({
    where: { societyId, name: "AUTO_INVOICE_CONFIG" },
  });

  let config = { ...DEFAULT_AUTO_CONFIG, dueDay: society?.dueDay || 10 };
  if (record?.flatTypeAmounts) {
    try {
      const parsed =
        typeof record.flatTypeAmounts === "string"
          ? JSON.parse(record.flatTypeAmounts)
          : record.flatTypeAmounts;
      config = { ...config, ...parsed };
    } catch {
      // fallback to defaults
    }
  }

  // Determine current & next period
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const currentPeriod = `${currentYear}-${currentMonth}`;

  const nextDate = new Date(currentYear, now.getMonth() + 1, 1);
  const nextPeriod = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;

  // Check eligible active occupancies
  const activeOccupancies = await prisma.occupancy.findMany({
    where: { societyId, status: { in: ["ACTIVE", "NOTICE"] } },
    select: { id: true, monthlyRent: true, rentAmount: true },
  });

  // Check invoices already created for current period
  const existingInvoices = await prisma.invoice.findMany({
    where: {
      societyId,
      billingPeriod: currentPeriod,
      status: { not: "CANCELLED" },
    },
    select: { id: true, occupancyId: true, totalAmount: true },
  });

  const activeCount = activeOccupancies.length;
  const invoicedCount = existingInvoices.length;
  const pendingCount = Math.max(0, activeCount - invoicedCount);
  const needsGeneration = pendingCount > 0;

  const estimatedRent = activeOccupancies.reduce(
    (sum, o) => sum + (Number(o.monthlyRent) || Number(o.rentAmount) || 0),
    0
  );

  const formattedDueDate = `${currentPeriod}-${String(config.dueDay).padStart(2, "0")}`;

  return ok({
    config,
    society: {
      id: society?.id,
      name: society?.name,
      dueDay: society?.dueDay || config.dueDay,
    },
    status: {
      currentPeriod,
      nextPeriod,
      activeResidentsCount: activeCount,
      invoicedCount,
      pendingCount,
      needsGeneration,
      estimatedRent,
      dueDate: formattedDueDate,
    },
  });
});

/**
 * POST /api/billing/auto-generate
 * Update auto-generation mode & settings.
 */
export const POST = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);
  const body = await readJson(req);

  const mode = ["CONFIRMATION", "FULL_AUTO", "MANUAL"].includes(body.mode)
    ? body.mode
    : "CONFIRMATION";
  const dueDay =
    Number(body.dueDay) >= 1 && Number(body.dueDay) <= 31
      ? Math.round(Number(body.dueDay))
      : 10;
  const penaltyPercent =
    Number(body.penaltyPercent) >= 0 ? Number(body.penaltyPercent) : 2;
  const previousDue = body.previousDue !== false;
  const skipVacant = body.skipVacant !== false;
  const lastAutoPeriod = body.lastAutoPeriod ?? null;

  const dataToStore = {
    mode,
    dueDay,
    penaltyPercent,
    previousDue,
    skipVacant,
    lastAutoPeriod,
    updatedAt: new Date().toISOString(),
  };

  const existing = await prisma.feeConfiguration.findFirst({
    where: { societyId, name: "AUTO_INVOICE_CONFIG" },
  });

  if (existing) {
    await prisma.feeConfiguration.update({
      where: { id: existing.id },
      data: {
        flatTypeAmounts: JSON.stringify(dataToStore),
        amount: dueDay,
        active: mode !== "MANUAL",
      },
    });
  } else {
    await prisma.feeConfiguration.create({
      data: {
        societyId,
        name: "AUTO_INVOICE_CONFIG",
        type: "RENT",
        calculationType: "FIXED",
        amount: dueDay,
        flatTypeAmounts: JSON.stringify(dataToStore),
        active: mode !== "MANUAL",
        frequency: "MONTHLY",
      },
    });
  }

  // Update society dueDay if changed
  if (dueDay) {
    await prisma.society
      .update({
        where: { id: societyId },
        data: { dueDay },
      })
      .catch(() => null);
  }

  return ok({ success: true, config: dataToStore });
});

