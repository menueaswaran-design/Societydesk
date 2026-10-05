import { formatDate, formatMoney, formatPeriod, titleCase } from "../format.js";

/**
 * Payment receipt document (spec section 23).
 *
 * The receipt is rendered server-side as a print-ready page, so the browser's
 * own "Save as PDF" produces the PDF the resident downloads. That keeps the
 * project dependency-free and works on a local dev machine with no Cloudinary
 * credentials, while still giving a stable, shareable URL that is persisted on
 * Receipt.pdfUrl.
 */

/** Canonical, stable path for a receipt. Stored on Receipt.pdfUrl. */
export function receiptDocumentUrl(receiptId) {
  return `/api/receipts/${receiptId}`;
}

/** Escape untrusted text before it goes into the document markup. */
function esc(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Fall back to a dash so an empty cell never collapses the layout. */
function orDash(value) {
  if (value === null || value === undefined || value === "") return "—";
  return esc(value);
}

function row(label, value, opts = {}) {
  return `
        <tr>
          <th scope="row">${esc(label)}</th>
          <td class="${opts.numeric ? "num" : ""}">${value}</td>
        </tr>`;
}

/**
 * Render the receipt as a standalone HTML document.
 *
 * `resident` is the payer's name; every other value is taken from the passed
 * records so the caller controls exactly which tenant's data is exposed.
 */
export function renderReceiptDocument({ society, receipt, payment, invoice, flat, resident }) {
  const flatLabel = flat?.block ? `${flat.block}-${flat.flatNumber}` : (flat?.flatNumber ?? "—");

  const heading = society?.name ?? "SocietyDesk";
  const title = `Receipt ${receipt.receiptNumber}`;

  const rows = [
    row("Receipt number", esc(receipt.receiptNumber)),
    row("Receipt date", formatDate(receipt.createdAt)),
    row("Resident", orDash(resident?.name)),
    row("Flat", esc(flatLabel)),
    row("Invoice number", orDash(invoice?.invoiceNumber)),
    row("Billing period", formatPeriod(invoice?.billingPeriod)),
    row("Invoice date", formatDate(invoice?.invoiceDate)),
    row("Due date", formatDate(invoice?.dueDate)),
    row("Invoice total", invoice?.totalAmount === null || invoice?.totalAmount === undefined ? "—" : formatMoney(invoice.totalAmount), { numeric: true }),
    row("Payment method", esc(titleCase(payment.paymentMethod))),
    row("Transaction reference", orDash(payment.transactionReference)),
    row("Payment date", formatDate(payment.paymentDate)),
  ].join("");

  const notes = payment.notes
    ? `<div class="notes"><h2>Notes</h2><p>${esc(payment.notes)}</p></div>`
    : "";

  const contact = [society?.address, [society?.city, society?.state, society?.pincode].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(", ");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 32px 16px;
    background: #f1f5f9;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0f172a;
    font-size: 14px;
    line-height: 1.5;
  }
  .sheet {
    max-width: 720px;
    margin: 0 auto;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 40px;
  }
  header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
  header img { max-height: 56px; max-width: 180px; object-fit: contain; }
  h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
  .code { margin: 4px 0 0; color: #64748b; font-size: 12px; }
  .doc { text-align: right; }
  .doc .kind {
    margin: 0; font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: #64748b;
  }
  .doc .num { margin: 2px 0 0; font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; }
  hr { margin: 28px 0; border: 0; border-top: 1px solid #e2e8f0; }
  .amount {
    display: flex; align-items: baseline; justify-content: space-between; gap: 16px;
    margin: 0 0 28px; padding: 20px; border-radius: 10px; background: #f8fafc;
  }
  .amount .label { color: #475569; font-size: 13px; }
  .amount .value { font-size: 26px; font-weight: 700; font-variant-numeric: tabular-nums; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 9px 0; text-align: left; vertical-align: top; border-bottom: 1px solid #f1f5f9; }
  th { width: 45%; font-weight: 500; color: #64748b; }
  td { font-weight: 500; }
  td.num { font-variant-numeric: tabular-nums; }
  .notes { margin-top: 28px; }
  .notes h2 { margin: 0 0 4px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; }
  .notes p { margin: 0; white-space: pre-wrap; }
  footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; }
  .toolbar { max-width: 720px; margin: 0 auto 16px; display: flex; justify-content: flex-end; }
  .toolbar button {
    border: 0; border-radius: 8px; padding: 9px 16px; background: #4f46e5; color: #fff;
    font: inherit; font-weight: 600; cursor: pointer;
  }
  .toolbar button:hover { background: #4338ca; }
  @media print {
    body { background: #fff; padding: 0; }
    .sheet { border: 0; border-radius: 0; padding: 0; max-width: none; }
    .toolbar { display: none; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button type="button" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <main class="sheet">
    <header>
      <div>
        ${society?.logoUrl ? `<img src="${esc(society.logoUrl)}" alt="" />` : ""}
        <h1>${esc(heading)}</h1>
        ${contact ? `<p class="code">${esc(contact)}</p>` : ""}
      </div>
      <div class="doc">
        <p class="kind">Payment receipt</p>
        <p class="num">${esc(receipt.receiptNumber)}</p>
      </div>
    </header>

    <hr />

    <div class="amount">
      <span class="label">Amount received</span>
      <span class="value">${formatMoney(payment.amount)}</span>
    </div>

    <table>
      <tbody>${rows}</tbody>
    </table>

    ${notes}

    <footer>
      ${esc(heading)}${society?.phone ? ` · ${esc(society.phone)}` : ""}${society?.email ? ` · ${esc(society.email)}` : ""}
      <br />
      This is a computer-generated receipt and does not require a signature.
    </footer>
  </main>
</body>
</html>`;
}