import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { resolveSocietyScope } from "@/lib/auth/permissions";
import { settlePaymentOrder } from "@/lib/billing/orders";
import { paymentOrderVerifySchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";

/**
 * POST /api/payment-orders/:id/verify  (section 21/23)
 *
 * Called by the browser after checkout returns. This is the ONLY place an
 * online payment becomes a real Payment + Receipt, and it will not do so unless
 * the gateway signature checks out AND the gateway itself confirms a capture.
 *
 * Idempotent: replaying the same callback returns the original payment instead
 * of charging the resident twice.
 */
const POSTImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const body = paymentOrderVerifySchema.parse(await readJson(req));

  // Accept Razorpay's field names and the simulator's, without trusting either.
  const payload = {
    paymentId: body.razorpay_payment_id || body.paymentId,
    signature: body.razorpay_signature || body.signature,
    transactionReference: body.transactionReference,
  };

  const { order, payment, alreadySettled } = await settlePaymentOrder({
    user,
    orderId: id,
    societyId,
    payload,
  });

  return ok({
    status: order.status,
    alreadySettled,
    receiptUrl: payment?.receipt?.pdfUrl ?? order.receiptUrl ?? null,
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
    invoice: payment?.invoice ?? null,
  });
});

export async function POST(request, context) {
  return POSTImpl(request, context);
}