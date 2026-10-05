import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { reversePayment, deriveInvoiceStatus } from "@/lib/billing/invoice";
import { audit, AUDIT } from "@/lib/audit";
import { notFound, badRequest } from "@/lib/errors";
export const dynamic = "force-dynamic";


/** GET /api/payments/:id */
const GETImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;
  const societyId = resolveSocietyScope(user, null);

  const payment = await prisma.payment.findFirst({
    where: { id, societyId },
    include: {
      flat: { select: { id: true, flatNumber: true, block: true } },
      invoice: true,
      receipts: true,
      recordedBy: { select: { name: true, email: true } },
    },
  });
  if (!payment) throw notFound("Payment");

  return ok(payment);
});

/** PATCH /api/payments/:id - correct reference/notes only, never the amount. */
const PATCHImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const body = await readJson(req);

  const existing = await prisma.payment.findFirst({ where: { id, societyId } });
  if (!existing) throw notFound("Payment");

  if (body.amount !== undefined && Number(body.amount) !== existing.amount) {
    throw badRequest("Payment amount cannot be edited - reverse the payment and record a new one");
  }

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      transactionReference: body.transactionReference ?? undefined,
      notes: body.notes ?? undefined,
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
    },
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.PAYMENT_UPDATED,
    entityType: "payment",
    entityId: id,
    oldValue: { reference: existing.transactionReference },
    newValue: { reference: payment.transactionReference },
    reason: body.reason ?? null,
  });

  return ok(payment);
});

/** DELETE /api/payments/:id - reverse the payment and re-open the invoice. */
const DELETEImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const body = await readJson(req);
  if (!body?.reason || String(body.reason).trim().length < 3) {
    throw badRequest("A reason is required to reverse a payment");
  }

  const invoice = await reversePayment({
    societyId,
    userId: user.id,
    paymentId: id,
    reason: body.reason,
  });

  return ok({ paymentId: id, reversed: true, invoice });
});

/** POST /api/payments/:id/receipt - regenerate/locate the receipt record. */
const POSTImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const payment = await prisma.payment.findFirst({
    where: { id, societyId },
    include: { receipts: true, invoice: true },
  });
  if (!payment) throw notFound("Payment");

  const receipt = payment.receipts[0];
  if (!receipt) throw notFound("Receipt");

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.RECEIPT_GENERATED,
    entityType: "receipt",
    entityId: receipt.id,
    newValue: { receiptNumber: receipt.receiptNumber, invoiceNumber: payment.invoice.invoiceNumber },
  });

  return ok({
    ...receipt,
    status: deriveInvoiceStatus(payment.invoice),
  });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function PATCH(request, context) {
  return PATCHImpl(request, context);
}

export async function DELETE(request, context) {
  return DELETEImpl(request, context);
}

export async function POST(request, context) {
  return POSTImpl(request, context);
}
