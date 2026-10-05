import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { resolveSocietyScope, getResidentFlatIds, isStaff } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { outstandingOn } from "@/lib/billing/penalty";
import { invoiceListSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/**
 * GET /api/billing/invoices
 * Admin: society-wide with filters. Resident: only their own flats.
 * Query: ?status=&period=&flatId=&page=&pageSize=
 */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  const sp = req.nextUrl.searchParams;
  const { page, pageSize, status, period, flatId } = invoiceListSchema.parse(
    Object.fromEntries(sp)
  );

  const societyId = resolveSocietyScope(user, sp.get("societyId"));

  const where = { societyId };
  if (status) where.status = status;
  if (period) where.billingPeriod = period;
  if (flatId) where.flatId = flatId;
  if (!isStaff(user)) {
    where.flatId = { in: await getResidentFlatIds(user.id) };
  }

  const [total, invoices, agg] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      include: {
        flat: { select: { id: true, flatNumber: true, block: true } },
        items: true,
      },
      orderBy: [{ billingPeriod: "desc" }, { invoiceNumber: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoice.aggregate({
      where,
      _sum: { totalAmount: true, paidAmount: true, penalty: true, previousDue: true },
    }),
  ]);

  const billed = agg._sum.totalAmount ?? 0;
  const collected = agg._sum.paidAmount ?? 0;

  return ok(
    invoices.map((inv) => ({ ...inv, outstanding: outstandingOn(inv) })),
    {
      meta: {
        total,
        page,
        pageSize,
        pageCount: Math.ceil(total / pageSize),
        summary: {
          billed,
          collected,
          outstanding: Math.max(0, billed - collected),
          penalty: agg._sum.penalty ?? 0,
          carriedForward: agg._sum.previousDue ?? 0,
        },
      },
    }
  );
});

export async function GET(request, context) {
  return GETImpl(request, context);
}
