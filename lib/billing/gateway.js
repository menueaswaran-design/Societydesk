import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Payment gateway adapter.
 *
 * Two modes, chosen automatically from the environment:
 *
 *   live  - RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET are present. Orders are
 *           created against Razorpay's REST API and the checkout callback is
 *           verified with Razorpay's HMAC scheme.
 *   mock  - no keys. Orders are created locally and settled by a simulated
 *           checkout. Same request/response shape and the same signature
 *           verification path, so switching to live keys needs no code change.
 *
 * MONEY UNITS. Everything inside this app is stored in WHOLE RUPEES
 * (Invoice.totalAmount, Payment.amount, FeeConfiguration.amount). Razorpay's
 * API wants the smallest currency unit (paise). The conversion happens only at
 * this boundary - `toPaise()` going out, `fromPaise()` coming back - so the
 * rest of the codebase never has to think about it.
 */

export const GATEWAY = { RAZORPAY: "RAZORPAY", MOCK: "MOCK" };

export const ORDER_STATUS = {
  CREATED: "CREATED",
  PAID: "PAID",
  FAILED: "FAILED",
  EXPIRED: "EXPIRED",
};

/** Razorpay keys are secrets that only the server may see. */
const KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

/** The publishable key is safe to ship to the browser. */
export const PUBLIC_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || KEY_ID;

/**
 * `auto` (default) uses Razorpay when keys exist and the simulator otherwise.
 * Set PAYMENT_GATEWAY_MODE=mock to force the simulator even with keys present.
 */
function activeMode() {
  const forced = (process.env.PAYMENT_GATEWAY_MODE || "auto").toLowerCase();
  if (forced === "mock") return GATEWAY.MOCK;
  if (forced === "live" && !hasRazorpayKeys()) {
    throw new Error("PAYMENT_GATEWAY_MODE=live but RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are not set");
  }
  return hasRazorpayKeys() ? GATEWAY.RAZORPAY : GATEWAY.MOCK;
}

export function hasRazorpayKeys() {
  return Boolean(KEY_ID && KEY_SECRET);
}

/** What the client needs to open checkout, plus whether it is the simulator. */
export function gatewayInfo() {
  const mode = activeMode();
  return {
    mode,
    isMock: mode === GATEWAY.MOCK,
    keyId: mode === GATEWAY.RAZORPAY ? PUBLIC_KEY_ID : null,
    currency: "INR",
  };
}

/** rupees -> paise */
export function toPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

/** paise -> rupees */
export function fromPaise(paise) {
  return Math.round(Number(paise)) / 100;
}

/** Orders are collectable for 30 minutes, matching Razorpay's own checkout window. */
const ORDER_TTL_MINUTES = 30;

function basicAuth() {
  return `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`;
}

/**
 * Create a payment order at the gateway.
 *
 * Returns the shape the PaymentOrder row needs plus the extra fields only the
 * browser checkout requires.
 */
export async function createGatewayOrder({ amount, currency = "INR", receiptRef, notes = {} }) {
  const mode = activeMode();
  const paise = toPaise(amount);

  if (mode === GATEWAY.MOCK) {
    return {
      gateway: GATEWAY.MOCK,
      gatewayOrderId: `order_mock_${randomToken()}`,
      amountPaise: paise,
      currency,
      expiresAt: new Date(Date.now() + ORDER_TTL_MINUTES * 60_000),
      // Razorpay Checkout only ever sees these; the simulator ignores them.
      razorpayOrderId: null,
      razorpayKeyId: null,
    };
  }

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: basicAuth() },
    body: JSON.stringify({
      amount: paise,
      currency,
      receipt: receiptRef,
      notes,
      payment_capture: 1, // capture immediately, so verify can settle it
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gateway rejected the order (${res.status}): ${detail.slice(0, 300)}`);
  }

  const json = await res.json();
  return {
    gateway: GATEWAY.RAZORPAY,
    gatewayOrderId: json.id,
    amountPaise: paise,
    currency: json.currency ?? currency,
    expiresAt: new Date(Date.now() + ORDER_TTL_MINUTES * 60_000),
    razorpayOrderId: json.id,
    razorpayKeyId: PUBLIC_KEY_ID,
  };
}

/**
 * Confirm with the gateway that a payment really happened.
 *
 * Razorpay is the source of truth: a client claiming "I paid" proves nothing,
 * so we re-read the order over the API before trusting it.
 */
export async function fetchGatewayPayment(gateway, gatewayOrderId) {
  if (gateway !== GATEWAY.RAZORPAY) return { captured: true, method: "mock", source: "simulator" };

  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(gatewayOrderId)}`, {
    headers: { Authorization: basicAuth() },
    cache: "no-store",
  });
  if (res.status === 404) return { captured: false, reason: "not_found" };
  if (!res.ok) throw new Error(`Gateway lookup failed (${res.status})`);

  const p = await res.json();
  return {
    captured: p.status === "captured",
    status: p.status,
    method: p.method ?? null,
    gatewayPaymentId: p.id ?? null,
    amountPaise: p.amount ?? null,
    bank: p.bank ?? null,
  };
}

/**
 * The key a given gateway's signatures are signed with. Chosen from the
 * order's own gateway rather than the ambient mode, so a mode switch mid-flight
 * can never make a legitimate signature look forged (or vice versa).
 */
export function signatureSecretFor(gateway) {
  if (gateway === GATEWAY.RAZORPAY) return KEY_SECRET;
  if (gateway === GATEWAY.MOCK) return MOCK_SECRET;
  return "";
}

/**
 * Verify the signature the gateway returns to the browser.
 *
 * This is what stops a resident from marking their own invoice paid by editing
 * a value in devtools. In mock mode we still run a real HMAC comparison so the
 * same code path is exercised in the demo.
 */
export function verifyPaymentSignature({ orderId, paymentId, signature, secret }) {
  if (!orderId || !paymentId || !signature) return false;
  const key = secret || "";
  if (!key) return false;

  const expected = createHmac("sha256", key).update(`${orderId}|${paymentId}`).digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(signature), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * The simulator signs with a well-known key so the demo can complete a payment
 * without a gateway account. It is only ever used in mock mode.
 */
export const MOCK_SECRET = "sd_mock_gateway_secret";

/** Signature a client must send to settle a simulated order. */
export function mockSignature(orderId, paymentId) {
  return createHmac("sha256", MOCK_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
}

/** Deterministic fake payment id for the simulator. */
export function mockPaymentId(gatewayOrderId) {
  return `pay_mock_${String(gatewayOrderId).replace(/^order_mock_/, "")}`;
}

function randomToken() {
  return (
    Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
  );
}

/**
 * Never let a raw gateway error reach the browser - it can contain key ids.
 */
export function publicGatewayError(err) {
  const message = err instanceof Error ? err.message : "Payment gateway error";
  if (/key|secret|auth/i.test(message)) return "Payment gateway rejected the request";
  return message.slice(0, 200);
}