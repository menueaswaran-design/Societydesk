const BASE = "http://localhost:3000";
async function call(path, { who, method = "GET", body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(who ? { Cookie: `sd_dev_user=${who}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json };
}
const RES = "fatima@greenvalley.local";
const inv = (await call("/api/billing/invoices?limit=200", { who: RES })).json.data
  .find(i => (i.totalAmount - (i.paidAmount ?? 0)) > 0);
console.log("paying", inv.invoiceNumber, "due", inv.totalAmount - inv.paidAmount);

const created = (await call("/api/payment-orders", { who: RES, method: "POST", body: { invoiceId: inv.id } })).json.data;
console.log("order", created.id, created.status, "reused:", created.reused);

const first = await call(`/api/payment-orders/${created.id}/verify`, { who: RES, method: "POST", body: created.checkout.mock });
console.log("\nFIRST settle:", first.status);
console.log(JSON.stringify(first.json, null, 2));

const second = await call(`/api/payment-orders/${created.id}/verify`, { who: RES, method: "POST", body: created.checkout.mock });
console.log("\nREPLAY:", second.status);
console.log(JSON.stringify(second.json, null, 2));
