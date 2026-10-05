import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { resolveSocietyScope } from "@/lib/auth/permissions";
import { cancelPaymentOrder } from "@/lib/billing/orders";
import { paymentOrderCancelSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";

/**
 * POST /api/payment-orders/:id/cancel
 *
 * The resident dismissed checkout. Marks the order failed so it stops showing
 * as an outstanding link. A gateway that later reports a capture is still
 * honoured by the webhook route, so a late payment is never lost.
 */
const POSTImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const body = paymentOrderCancelSchema.parse(await readJson(req));
  const order = await cancelPaymentOrder({ user, orderId: id, societyId, reason: body.reason });

  return ok({ id: order.id, status: order.status });
});

export async function POST(request, context) {
  return POSTImpl(request, context);
}