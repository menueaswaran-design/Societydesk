import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireResidentManager, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { paginationSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

/**
 * GET /api/deposits
 * List security deposits.
 * Query: ?status=HELD|REFUNDED|PARTIALLY_REFUNDED
 */
export const GET = handler(async (req) => {
  const user = await getSessionUser(req);
  const sp = req.nextUrl.searchParams;
  const { page, pageSize, status } = paginationSchema.parse(Object.fromEntries(sp));
  const societyId = resolveSocietyScope(user, null);

  const where = { societyId };
  if (status) where.status = status;

  if (user.role === "RESIDENT") {
    where.occupancy = { userId: user.id };
  }

  const [total, deposits] = await Promise.all([
    prisma.deposit.count({ where }),
    prisma.deposit.findMany({
      where,
      include: {
        occupancy: {
          include: {
            user: { select: { id: true, name: true, phone: true, email: true } },
            unit: true,
            bed: true,
          },
        },
        deductions: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  // Aggregate summary totals
  const allDeposits = await prisma.deposit.findMany({
    where: { societyId },
    select: { amountReceived: true, refundAmount: true, deductionsTotal: true, status: true },
  });

  const summary = allDeposits.reduce(
    (acc, d) => {
      acc.totalReceived += d.amountReceived;
      if (d.status === "HELD") {
        acc.totalHeld += (d.amountReceived - d.deductionsTotal);
      }
      acc.totalRefunded += d.refundAmount;
      acc.totalDeductions += d.deductionsTotal;
      return acc;
    },
    { totalReceived: 0, totalHeld: 0, totalRefunded: 0, totalDeductions: 0 }
  );

  return ok(deposits, {
    meta: {
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
      summary,
    },
  });
});

