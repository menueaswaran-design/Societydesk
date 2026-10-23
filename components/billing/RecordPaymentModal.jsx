"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, FileText, Landmark, Wallet, AlertCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { StatLine } from "@/components/ui/Card";
import { ErrorBanner, Loading } from "@/components/ui/Feedback";
import { api, fieldErrors, openDocument } from "@/lib/client/api";
import { formatMoney, formatPeriod, titleCase } from "@/lib/format";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI / QR" },
  { value: "BANK_TRANSFER", label: "Bank Transfer (NEFT/IMPS)" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

export default function RecordPaymentModal({
  open,
  onClose,
  flatId = null,
  flatLabel = "",
  residentName = "",
  preselectedInvoice = null,
  onSuccess,
}) {
  const router = useRouter();
  const [invoices, setInvoices] = useState(preselectedInvoice ? [preselectedInvoice] : []);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(preselectedInvoice?.id || "");
  const [amount, setAmount] = useState(preselectedInvoice ? String(preselectedInvoice.outstanding) : "");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    if (!open) {
      setReceipt(null);
      setError(null);
      setErrors({});
      return;
    }

    if (preselectedInvoice) {
      setInvoices([preselectedInvoice]);
      setSelectedInvoiceId(preselectedInvoice.id);
      setAmount(String(preselectedInvoice.outstanding));
      return;
    }

    if (flatId || !preselectedInvoice) {
      setLoadingInvoices(true);
      const url = flatId ? `/api/billing/invoices?flatId=${flatId}` : `/api/billing/invoices`;
      api
        .get(url)
        .then((rows) => {
          const unpaid = (rows || []).filter((i) => i.outstanding > 0);
          setInvoices(unpaid);
          if (unpaid.length > 0) {
            setSelectedInvoiceId(unpaid[0].id);
            setAmount(String(unpaid[0].outstanding));
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoadingInvoices(false));
    }
  }, [open, flatId, preselectedInvoice]);

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  function handleSelectInvoice(id) {
    setSelectedInvoiceId(id);
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      setAmount(String(inv.outstanding));
    }
  }

  async function submit(e) {
    e?.preventDefault();
    if (!selectedInvoiceId) {
      setError("Please select an invoice to record payment against.");
      return;
    }

    const nAmount = Number(amount);
    if (!nAmount || nAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    setSaving(true);
    setError(null);
    setErrors({});

    try {
      const data = await api.post("/api/payments", {
        invoiceId: selectedInvoiceId,
        amount: nAmount,
        paymentMethod,
        transactionReference: reference.trim() || null,
        paymentDate: paymentDate || undefined,
        notes: notes.trim() || null,
      });

      setReceipt(data.receipt);
      onSuccess?.(data);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setReceipt(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={receipt ? "Payment Recorded Successfully" : "Record Payment Received"}
      description={
        receipt
          ? `Receipt issued for ${flatLabel || "Flat"}`
          : residentName
          ? `Record payment for ${residentName} (${flatLabel || "Flat"})`
          : flatLabel
          ? `Record payment for Flat ${flatLabel}`
          : "Record an offline payment against monthly dues"
      }
      size="md"
      footer={
        receipt ? (
          <>
            {receipt.pdfUrl ? (
              <Button
                variant="secondary"
                onClick={() => openDocument(receipt.pdfUrl).catch((e) => setError(e.message))}
              >
                <FileText />
                View receipt
              </Button>
            ) : null}
            <Button onClick={handleClose}>Done</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              loading={saving}
              disabled={loadingInvoices || invoices.length === 0}
            >
              <CheckCircle2 />
              Record payment
            </Button>
          </>
        )
      }
    >
      {loadingInvoices ? (
        <div className="py-8 text-center text-sm text-slate-500">
          <Loading label="Loading dues for this flat..." />
        </div>
      ) : null}

      <ErrorBanner error={error} className="mb-3" />

      {receipt ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50/70 p-4 border border-emerald-200/80 shadow-2xs">
            <CheckCircle2 className="size-6 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-emerald-900">
                Payment of {formatMoney(receipt.amount ?? Number(amount))} Recorded!
              </p>
              <p className="text-xs text-emerald-700">Receipt #{receipt.receiptNumber} generated</p>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 shadow-2xs">
            <StatLine label="Receipt Number" value={receipt.receiptNumber} tone="muted" />
            <StatLine label="Payment Method" value={titleCase(paymentMethod)} />
            <StatLine label="Payment Date" value={paymentDate} tone="muted" />
            {reference ? <StatLine label="Reference" value={reference} tone="muted" /> : null}
          </div>
        </div>
      ) : !loadingInvoices ? (
        invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <CheckCircle2 className="size-10 text-emerald-500" />
            <p className="text-sm font-semibold text-slate-900">All monthly dues are cleared!</p>
            <p className="max-w-xs text-xs text-slate-500">
              There are no pending or overdue bills for this flat right now.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {/* Invoice selection */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Select Monthly Bill <span className="text-rose-500">*</span>
              </label>
              {invoices.length === 1 ? (
                <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200/80 text-xs shadow-2xs">
                  <div className="flex justify-between font-semibold text-slate-900">
                    <span>{formatPeriod(invoices[0].billingPeriod)} Maintenance</span>
                    <span className="text-amber-600 font-bold">{formatMoney(invoices[0].outstanding)} due</span>
                  </div>
                  <p className="mt-0.5 text-slate-500 font-mono text-[11px]">{invoices[0].invoiceNumber}</p>
                </div>
              ) : (
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => handleSelectInvoice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15"
                >
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {formatPeriod(inv.billingPeriod)} ({inv.invoiceNumber}) — Due: {formatMoney(inv.outstanding)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Amount input */}
            <Input
              id="amount"
              label="Amount Received (₹)"
              type="number"
              required
              min="1"
              max={selectedInvoice ? selectedInvoice.outstanding : undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={errors.amount}
              hint={selectedInvoice ? `Outstanding balance: ${formatMoney(selectedInvoice.outstanding)}` : undefined}
            />

            {/* Payment method */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Payment Method <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PAYMENT_METHODS.slice(0, 4).map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setPaymentMethod(m.value)}
                    className={`rounded-xl p-2.5 text-center text-xs font-semibold transition-all ${
                      paymentMethod === m.value
                        ? "border-2 border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-2xs"
                        : "border border-slate-200/90 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                id="paymentDate"
                label="Payment Date"
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
              <Input
                id="reference"
                label="Reference / Cheque / UTR"
                placeholder="e.g. UTR123456 or Cheque #4421"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            <Textarea
              id="notes"
              label="Notes (Optional)"
              rows={2}
              placeholder="e.g. Handed cash to flat admin at society gate"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </form>
        )
      ) : null}
    </Modal>
  );
}
