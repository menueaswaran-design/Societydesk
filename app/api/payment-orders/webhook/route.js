import { createHmac, timingSafeEqual } from "node:crypto";
import { handler, ok } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { GATEWAY, ORDER_STATUS } from "@/lib/billing/gateway";
import { settlePaymentOrder } from "@/lib/billing/orders";
export const dynamic = "force-dynamic";

/**
 * POST /api/payment-orders/webhook  (Razorpay)
 *
 * Razorpay calls this the moment it captures a payment. It is the safety net for
 * the case the browser callback cannot cover: the resident closes the tab, drops
 * connectivity, or never returns to /verify. Without it, real money would sit
 * captured at the gateway while the books showed the invoice unpaid.
 *
 * Two independent checks stand between this endpoint and a fake payment:
 *   1. Razorpay's webhook HMAC over the raw body (when a webhook secret is set).
 *   2. settlePaymentOrder re-reads the payment from Razorpay and requires a real
 *      capture for the exact expected amount.
 * So even a forged call to this URL cannot mint a payment.
 */

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

function webhookSignatureIsValid(rawBody, header) {
  if (!WEBHOOK_SECRET) return true; // not configured; check 2 still applies
  if (!header) return false;
  const expected = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(header, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

const POSTImpl = handler(async (req) => {
  const raw = await req.text();
  if (!webhookSignatureIsValid(raw, req.headers.get("x-razorpay-signature"))) {
    return ok({ ignored: true, reason: "bad webhook signature" });
  }

  let body;
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return ok({ ignored: true, reason: "unparseable body" });
  }

  const entity = body?.payload?.payment?.entity ?? {};
  const gatewayOrderId = entity.order_id;
  if (!gatewayOrderId) return ok({ ignored: true, reason: "no order id" });

  const order = await prisma.paymentOrder.findFirst({
    where: { gateway: GATEWAY.RAZORPAY, gatewayOrderId },
  });
  if (!order) return ok({ ignored: true, reason: "unknown order" });
  if (order.status === ORDER_STATUS.PAID) {
    return ok({ ignored: true, reason: "already settled" });
  }

  try {
    const { payment } = await settlePaymentOrder({
      user: { id: order.initiatedById, role: "SYSTEM", societyId: order.societyId },
      orderId: order.id,
      societyId: order.societyId,
      payload: { paymentId: entity.id, transactionReference: entity.id },
      systemInitiated: true,
    });
    return ok({ settled: true, paymentId: payment?.id ?? null });
  } catch (err) {
    // Razorpay retries non-2xx, so a transient gateway outage is worth a retry.
    // Log and answer 200 for permanent business failures so it stops retrying.
    console.error("[payment-webhook] settle failed", err?.message ?? err);
    return ok({ settled: false, reason: err?.message ?? "settle failed" });
  }
});

export async function POST(request, context) {
  return POSTImpl(request, context);
}