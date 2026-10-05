/**
 * End-to-end check of the online payment flow against a running dev server.
 * Drives the real HTTP API exactly as the browser does.
 */
const BASE = "http://localhost:3000";
const ADMIN = "admin@greenvalley.local";
const RESIDENT = "kumar@greenvalley.local"; // owns A102, which the seed leaves unpaid
const OTHER_TENANT = "admin@sunrise.local";

let fails = 0;
const check = (label, cond, extra = "") => {
  console.log(`  [${cond ? "ok  " : "FAIL"}] ${label}${extra ? "  ->  " + extra : ""}`);
  if (!cond) fails++;
};

async function call(path, { who, method = "GET", body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(who ? { Cookie: `sd_dev_user=${who}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, json };
}

console.log("=== 1. unauthenticated is refused ===");
let r = await call("/api/payment-orders");
check("no session -> 401", r.status === 401, `got ${r.status}`);

console.log("\n=== 2. tenant isolation on the invoice list ===");
r = await call("/api/billing/invoices?limit=200", { who: RESIDENT });
const residentInvoices = r.json?.data ?? [];
check("resident sees invoices", r.status === 200 && residentInvoices.length > 0, `${residentInvoices.length} invoices`);

const payables = residentInvoices.filter((i) => (i.totalAmount - (i.paidAmount ?? 0)) > 0);
check("resident has at least one payable invoice", payables.length > 0, `${payables.length} payable`);
const target = payables[0];

console.log("\n=== 3. resident creates a pending order ===");
r = await call("/api/payment-orders", { who: RESIDENT, method: "POST", body: { invoiceId: target.id } });
const order = r.json?.data;
check("order created or reused", (r.status === 201 || r.status === 200) && Boolean(order?.id), `status ${r.status}`);
check("reused the seeded pending order", order?.reused === true, `reused=${order?.reused}`);
check("gateway is MOCK (no real keys)", order?.checkout?.isMock === true, order?.checkout?.mode);
check("amount matches outstanding", order?.amount === target.totalAmount - (target.paidAmount ?? 0), `${order?.amount}`);
check("checkout carries a signed mock triple", Boolean(order?.checkout?.mock?.paymentId && order?.checkout?.mock?.signature));
check("no gateway secret leaked", !JSON.stringify(order ?? {}).includes("mock_secret") && !JSON.stringify(order ?? {}).toLowerCase().includes("secretvalue"));

console.log("\n=== 4. the order is pending, not paid ===");
r = await call(`/api/payment-orders/${order.id}`, { who: RESIDENT });
check("status CREATED", r.json?.data?.status === "CREATED", r.json?.data?.status);
check("no payment attached yet", r.json?.data?.payment === null);
const unpaidNow = await call("/api/billing/invoices?limit=200", { who: RESIDENT });
const stillDue = unpaidNow.json.data.find((i) => i.id === target.id);
check("invoice still unpaid", stillDue.status !== "PAID", stillDue.status);

console.log("\n=== 5. cross-tenant access is blocked ===");
r = await call(`/api/payment-orders/${order.id}`, { who: OTHER_TENANT });
check("other society gets 404", r.status === 404, `got ${r.status}`);
r = await call("/api/payment-orders", { who: OTHER_TENANT });
check("other society list is not this order", !(r.json?.data ?? []).some((o) => o.id === order.id));

console.log("\n=== 6. FORGERY: a resident cannot mark their own invoice paid ===");
r = await call(`/api/payment-orders/${order.id}/verify`, {
  who: RESIDENT,
  method: "POST",
  body: { paymentId: "pay_mock_hacked", signature: "deadbeefdeadbeef" },
});
check("bad signature rejected", r.status === 400 || r.status === 422, `got ${r.status} ${r.json?.error?.message ?? ""}`);
r = await call(`/api/payment-orders/${order.id}/verify`, {
  who: RESIDENT,
  method: "POST",
  body: { paymentId: order.checkout.mock.paymentId, signature: "deadbeefdeadbeef" },
});
check("real paymentId + wrong signature rejected", r.status === 400, `got ${r.status}`);

console.log("\n=== 7. cross-tenant settle is blocked ===");
r = await call(`/api/payment-orders/${order.id}/verify`, {
  who: OTHER_TENANT,
  method: "POST",
  body: order.checkout.mock,
});
check("other society cannot settle", r.status === 404 || r.status === 403, `got ${r.status}`);

console.log("\n=== 8. valid payment settles ===");
r = await call(`/api/payment-orders/${order.id}/verify`, {
  who: RESIDENT,
  method: "POST",
  body: { ...order.checkout.mock, transactionReference: "pay_e2e_001" },
});
const settled = r.json?.data;
check("settled", r.status === 200 && settled?.status === "PAID", `status ${r.status} ${settled?.status ?? r.json?.error?.message}`);
check("receipt number issued", Boolean(settled?.receiptNumber), settled?.receiptNumber ?? "none");
check("receipt url issued", Boolean(settled?.receiptUrl));
check("invoice fully paid", settled?.invoice?.status === "PAID", settled?.invoice?.status);
check("payment method is MOCK (simulated, never filed as a real gateway)", settled?.payment?.paymentMethod === "MOCK", settled?.payment?.paymentMethod);

console.log("\n=== 9. replaying the callback does not double-charge ===");
const payCountBefore = settled.payment.id;
r = await call(`/api/payment-orders/${order.id}/verify`, {
  who: RESIDENT,
  method: "POST",
  body: order.checkout.mock,
});
check("replay is idempotent, not a new payment", r.json?.data?.payment?.id === payCountBefore, `${r.json?.data?.payment?.id}`);
check("replay reports alreadySettled", r.json?.data?.alreadySettled === true);

console.log("\n=== 10. paid invoice can no longer start an order ===");
r = await call("/api/payment-orders", { who: RESIDENT, method: "POST", body: { invoiceId: target.id } });
check("cannot pay a settled invoice", r.status >= 400, `got ${r.status} ${r.json?.error?.message ?? ""}`);

console.log("\n=== 11. receipt is downloadable by owner and admin, not strangers ===");
if (settled?.receiptUrl) {
  r = await call(settled.receiptUrl, { who: RESIDENT });
  check("resident can open receipt", r.status === 200, `got ${r.status}`);
  r = await call(settled.receiptUrl, { who: ADMIN });
  check("admin can open receipt", r.status === 200, `got ${r.status}`);
  r = await call(settled.receiptUrl, { who: OTHER_TENANT });
  check("other society blocked", r.status === 404 || r.status === 403, `got ${r.status}`);
}

console.log("\n=== 12. admin can issue a collection link for any flat ===");
r = await call("/api/billing/invoices?limit=200", { who: ADMIN });
const adminInvoices = r.json?.data ?? [];
const otherPayable = adminInvoices.find(
  (i) => (i.totalAmount - (i.paidAmount ?? 0)) > 0 && i.id !== target.id
);
check("admin found another unpaid invoice", Boolean(otherPayable), otherPayable?.invoiceNumber ?? "none");
if (otherPayable) {
  r = await call("/api/payment-orders", { who: ADMIN, method: "POST", body: { invoiceId: otherPayable.id } });
  const adminOrder = r.json?.data;
  check("admin created collection order", r.status === 201 && Boolean(adminOrder?.id), `status ${r.status}`);
  r = await call("/api/payment-orders?status=CREATED", { who: ADMIN });
  check("order shows in admin pending list", (r.json?.data ?? []).some((o) => o.id === adminOrder?.id));
  r = await call("/api/payment-orders", { who: RESIDENT });
  check("admin's link for another flat is hidden from this resident", !(r.json?.data ?? []).some((o) => o.id === adminOrder?.id));
}

console.log("\n=== 13. cancelling releases a pending link ===");
if (otherPayable) {
  const pend = (await call("/api/payment-orders?status=CREATED", { who: ADMIN })).json.data.find(
    (o) => o.invoiceId === otherPayable.id
  );
  if (pend) {
    r = await call(`/api/payment-orders/${pend.id}/cancel`, { who: ADMIN, method: "POST", body: {} });
    check("cancel accepted", r.status === 200 && r.json?.data?.status === "FAILED", `${r.status} ${r.json?.data?.status}`);
    r = await call(`/api/payment-orders/${pend.id}/verify`, {
      who: ADMIN,
      method: "POST",
      body: { paymentId: "pay_mock_late", signature: "x" },
    });
    check("cancelled order cannot be settled with a bad signature", r.status >= 400, `got ${r.status}`);
  }
}

console.log("\n=== 14. webhook cannot mint money ===");
r = await call("/api/payment-orders/webhook", {
  method: "POST",
  body: { event: "payment.captured", payload: { payment: { entity: { id: "pay_fake", order_id: "order_live_fake" } } } },
});
check("unknown webhook order ignored", r.status === 200 && r.json?.data?.ignored === true, JSON.stringify(r.json?.data));

console.log(fails === 0 ? "\nALL END-TO-END CHECKS PASSED" : `\nFAILURES: ${fails}`);
process.exit(fails === 0 ? 0 : 1);