import { handler, ok, readJson } from "@/lib/api";
import { settlePaymentOrder } from "@/lib/billing/orders";
import { paymentOrderVerifySchema } from "@/lib/validation/schemas";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/public/pay/:id/verify
 *
 * Verifies gateway signature & capture for public quick-pay settlements.
 */
export const POST = handler(async (req, { params }) => {
  const { id } = await params;
  const body = paymentOrderVerifySchema.parse(await readJson(req));

  const orderId = body.orderId || id;

  const order = await prisma.paymentOrder.findFirst({
    where: {
      OR: [{ id: orderId }, { invoiceId: id }],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!order) throw notFound("Payment order");

  const payload = {
    paymentId: body.razorpay_payment_id || body.paymentId,
    signature: body.razorpay_signature || body.signature,
    transactionReference: body.transactionReference,
  };

  const { order: settledOrder, payment, alreadySettled } = await settlePaymentOrder({
    orderId: order.id,
    societyId: order.societyId,
    payload,
    isPublic: true,
  });

  return ok({
    status: settledOrder.status,
    alreadySettled,
    receiptUrl: payment?.receipt?.pdfUrl ?? settledOrder.receiptUrl ?? null,
    receiptNumber: payment?.receipt?.receiptNumber ?? null,
    payment: payment
      ? {
          id: payment.id,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          paymentDate: payment.paymentDate,
          transactionReference: payment.transactionReference,
        }
      : null,
  });
});

