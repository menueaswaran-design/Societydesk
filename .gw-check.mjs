import {
  GATEWAY,
  ORDER_STATUS,
  gatewayInfo,
  toPaise,
  fromPaise,
  createGatewayOrder,
  verifyPaymentSignature,
  signatureSecretFor,
  mockSignature,
  mockPaymentId,
  hasRazorpayKeys,
} from "./lib/billing/gateway.js";

let fails = 0;
const check = (label, cond, extra = "") => {
  console.log(`  [${cond ? "ok  " : "FAIL"}] ${label}${extra ? "  " + extra : ""}`);
  if (!cond) fails++;
};

console.log("=== mode selection ===");
console.log("  hasRazorpayKeys:", hasRazorpayKeys());
const info = gatewayInfo();
console.log("  gatewayInfo:", JSON.stringify(info));
check("falls back to MOCK with no keys", info.mode === GATEWAY.MOCK);
check("isMock flag set", info.isMock === true);
check("no key id leaked in mock mode", info.keyId === null);

console.log("\n=== money units (rupees <-> paise) ===");
check("toPaise(1) === 100", toPaise(1) === 100, `got ${toPaise(1)}`);
check("toPaise(2500) === 250000", toPaise(2500) === 250000, `got ${toPaise(2500)}`);
check("toPaise(0.5) === 50", toPaise(0.5) === 50, `got ${toPaise(0.5)}`);
check("fromPaise(250000) === 2500", fromPaise(250000) === 2500, `got ${fromPaise(250000)}`);
check("round-trip 3003", fromPaise(toPaise(3003)) === 3003);

console.log("\n=== mock order creation ===");
const o1 = await createGatewayOrder({ amount: 2500, receiptRef: "INV-GVA-2026-08-0003" });
const o2 = await createGatewayOrder({ amount: 2500, receiptRef: "INV-GVA-2026-08-0003" });
check("gateway is MOCK", o1.gateway === GATEWAY.MOCK);
check("amount converted to paise", o1.amountPaise === 250000, `got ${o1.amountPaise}`);
check("order id prefixed order_mock_", String(o1.gatewayOrderId).startsWith("order_mock_"));
check("order ids are unique", o1.gatewayOrderId !== o2.gatewayOrderId);
check("expiresAt is in the future", o1.expiresAt > new Date());
check("expiry ~30 min out", Math.round((o1.expiresAt - Date.now()) / 60000) === 30);

console.log("\n=== signature verification (the anti-forgery check) ===");
const pid = mockPaymentId(o1.gatewayOrderId);
const sig = mockSignature(o1.gatewayOrderId, pid);
check("mockPaymentId shape", pid.startsWith("pay_mock_"), pid);
check(
  "correct signature accepted",
  verifyPaymentSignature({ orderId: o1.gatewayOrderId, paymentId: pid, signature: sig, secret: signatureSecretFor(GATEWAY.MOCK) })
);
check(
  "wrong signature rejected",
  !verifyPaymentSignature({ orderId: o1.gatewayOrderId, paymentId: pid, signature: "deadbeef", secret: signatureSecretFor(GATEWAY.MOCK) })
);
check(
  "signature from another order rejected",
  !verifyPaymentSignature({ orderId: o2.gatewayOrderId, paymentId: pid, signature: sig, secret: signatureSecretFor(GATEWAY.MOCK) })
);
check(
  "signature with a tampered payment id rejected",
  !verifyPaymentSignature({ orderId: o1.gatewayOrderId, paymentId: "pay_mock_hacked", signature: sig, secret: signatureSecretFor(GATEWAY.MOCK) })
);
check(
  "razorpay secret does not validate a mock order",
  !verifyPaymentSignature({ orderId: o1.gatewayOrderId, paymentId: pid, signature: sig, secret: signatureSecretFor(GATEWAY.RAZORPAY) })
);
check(
  "missing signature rejected",
  !verifyPaymentSignature({ orderId: o1.gatewayOrderId, paymentId: pid, signature: "", secret: signatureSecretFor(GATEWAY.MOCK) })
);
check(
  "missing payment id rejected",
  !verifyPaymentSignature({ orderId: o1.gatewayOrderId, paymentId: "", signature: sig, secret: signatureSecretFor(GATEWAY.MOCK) })
);
check("no secret configured -> reject, not crash", !verifyPaymentSignature({ orderId: "o", paymentId: "p", signature: "s" }));

console.log("\n=== ORDER_STATUS values ===");
check("has CREATED/PAID/FAILED/EXPIRED", ["CREATED", "PAID", "FAILED", "EXPIRED"].every((s) => ORDER_STATUS[s] === s));

console.log(fails === 0 ? "\nALL GATEWAY CHECKS PASSED" : `\nFAILURES: ${fails}`);