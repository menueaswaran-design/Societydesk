import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { resolveSocietyScope, getResidentFlatIds, isStaff, isFlatAdmin } from "@/lib/auth/permissions";
import { forbidden } from "@/lib/errors";
import { prisma } from "@/lib/db/prisma";
import { recordPayment } from "@/lib/billing/invoice";
import { paymentCreateSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/**
 * GET /api/payments
 * Admin: society-wide. Flat admin / Resident: their own flats' payments.
 */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  const sp = req.nextUrl.searchParams;
  const societyId = resolveSocietyScope(user, sp.get("societyId"));
  const page = Number(sp.get("page") || 1);
  const pageSize = Math.min(200, Number(sp.get("pageSize") || 25));

  const where = { societyId };
  if (isFlatAdmin(user) || !isStaff(user)) {
    where.flatId = { in: await getResidentFlatIds(user.id) };
  }
  if (sp.get("flatId")) where.flatId = sp.get("flatId");
  if (sp.get("invoiceId")) where.invoiceId = sp.get("invoiceId");

  const [total, payments, agg] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      include: {
        flat: { select: { id: true, flatNumber: true, block: true } },
        invoice: { select: { id: true, invoiceNumber: true, billingPeriod: true } },
        receipts: true,
        recordedBy: { select: { name: true } },
      },
      orderBy: { paymentDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.payment.aggregate({ where, _sum: { amount: true } }),
  ]);

  return ok(payments, {
    meta: {
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
      totalAmount: agg._sum.amount ?? 0,
    },
  });
});

/**
 * POST /api/payments  (section 21)
 * Records a payment, updates the invoice balance/status and issues a receipt.
 * Permitted for Society Admins, and Flat Admins for their assigned flat.
 */
const POSTImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  if (!isStaff(user) && !isFlatAdmin(user)) {
    throw forbidden("Staff or flat admin access required");
  }
  const societyId = resolveSocietyScope(user, null);

  const body = paymentCreateSchema.parse(await readJson(req));

  if (isFlatAdmin(user)) {
    const assignedFlatIds = await getResidentFlatIds(user.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id: body.invoiceId },
      select: { flatId: true, societyId: true },
    });
    if (!invoice || invoice.societyId !== societyId || !assignedFlatIds.includes(invoice.flatId)) {
      throw forbidden("You can only record payments for your assigned flat");
    }
  }

  const result = await recordPayment({
    societyId,
    userId: user.id,
    invoiceId: body.invoiceId,
    amount: body.amount,
    paymentMethod: body.paymentMethod,
    transactionReference: body.transactionReference ?? null,
    paymentDate: body.paymentDate ?? new Date(),
    notes: body.notes ?? null,
    proofUrl: body.proofUrl || null,
  });

  return ok(result, { status: 201 });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function POST(request, context) {
  return POSTImpl(request, context);
}
