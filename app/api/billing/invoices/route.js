import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { resolveSocietyScope, getResidentFlatIds, isStaff } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { outstandingOn } from "@/lib/billing/penalty";
import { invoiceListSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

/**
 * GET /api/billing/invoices
 * Admin: property/society-wide with filters & pagination. Resident: only their own invoices.
 * Query: ?status=&period=&flatId=&occupancyId=&page=&pageSize=&search=&floor=
 */
export const GET = handler(async (req) => {
  const user = await getSessionUser(req);
  const sp = req.nextUrl.searchParams;
  const { page, pageSize, status, period, flatId, occupancyId, search, q, floor } =
    invoiceListSchema.parse(Object.fromEntries(sp));

  const societyId = resolveSocietyScope(user, sp.get("societyId"));

  const where = { societyId };
  if (status) where.status = status;
  if (period) where.billingPeriod = period;
  if (occupancyId) where.occupancyId = occupancyId;
  if (flatId) where.flatId = flatId;

  const searchTerm = (search || q)?.trim();
  if (searchTerm || floor) {
    where.AND = [];
    if (searchTerm) {
      where.AND.push({
        OR: [
          { invoiceNumber: { contains: searchTerm } },
          { occupancy: { user: { name: { contains: searchTerm } } } },
          { occupancy: { user: { phone: { contains: searchTerm } } } },
          { occupancy: { unit: { unitNumber: { contains: searchTerm } } } },
          { flat: { flatNumber: { contains: searchTerm } } },
          { flat: { residents: { some: { user: { name: { contains: searchTerm } } } } } },
        ],
      });
    }
    if (floor) {
      where.AND.push({
        OR: [
          { occupancy: { unit: { floor: String(floor) } } },
          { flat: { block: String(floor) } },
        ],
      });
    }
  }

  if (!isStaff(user)) {
    const flatIds = await getResidentFlatIds(user.id);
    where.OR = [
      { flatId: { in: flatIds } },
      { occupancy: { userId: user.id } },
    ];
  }

  const [total, invoices, agg] = await Promise.all([
    prisma.invoice.count({ where }),
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
            user: { select: { id: true, name: true, phone: true, email: true } },
            unit: { select: { id: true, unitNumber: true, floor: true } },
            bed: { select: { id: true, bedLabel: true } },
          },
        },
        items: true,
        payments: { include: { receipts: true }, orderBy: { paymentDate: "desc" } },
      },
      orderBy: [{ billingPeriod: "desc" }, { invoiceNumber: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoice.aggregate({
      where: { societyId, status: { not: "CANCELLED" } },
      _sum: { totalAmount: true, paidAmount: true, penalty: true, previousDue: true },
    }),
  ]);

  const billed = agg._sum.totalAmount ?? 0;
  const collected = agg._sum.paidAmount ?? 0;

  return ok(
    invoices.map((inv) => {
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
    }),
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
