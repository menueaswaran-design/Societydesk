"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, Send, CreditCard, ShieldCheck, Clock } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { StatLine } from "@/components/ui/Card";
import { ErrorBanner, Loading } from "@/components/ui/Feedback";
import { api } from "@/lib/client/api";
import { formatDateTime, formatMoney } from "@/lib/format";

/**
 * Admin side of the online payment flow: create a pending order for any invoice
 * and hand the resident a link to pay it.
 *
 * The link only starts an order - it never marks anything paid. The resident has
 * to go through the gateway, and the server issues the receipt only after the
 * capture is verified.
 */
export default function CollectPaymentButton({
  invoiceId,
  invoiceNumber,
  amount,
  size = "sm",
  label = "Collect",
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);

  async function create() {
    setBusy(true);
    setError(null);
    setOpen(true);
    setOrder(null);
    try {
      const created = await api.post("/api/payment-orders", { invoiceId });
      setOrder(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(paymentLink(order.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy automatically. Select the link and copy it manually.");
    }
  }

  function close() {
    setOpen(false);
    setOrder(null);
    setError(null);
    setCopied(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" size={size} onClick={create} loading={busy}>
        <Link2 />
        {label}
      </Button>

      <Modal
        open={open}
        onClose={close}
        title="Collect payment online"
        description={invoiceNumber ? `Invoice ${invoiceNumber}` : undefined}
        size="sm"
        footer={<Button onClick={close}>Done</Button>}
      >
        {busy ? <Loading label="Creating a payment link" /> : null}

        <ErrorBanner error={error} className="mb-3" />

        {order ? (
          <div className="space-y-4">
            <div className="space-y-2 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-900/5">
              <StatLine label="Amount due" value={formatMoney(order.amount)} />
              <StatLine label="Channel" value={order.checkout?.isMock ? "Test mode (mock)" : "Razorpay"} tone="muted" />
              <StatLine label="Expires" value={formatDateTime(order.expiresAt)} tone="muted" />
            </div>

            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Send className="size-3.5 text-brand-500" />
                Send this link to the resident
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={paymentLink(order.id)}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Payment link"
                  className="h-9 min-w-0 flex-1 rounded-xl bg-white px-3 text-xs text-slate-600 shadow-xs ring-1 ring-slate-900/10 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <Button variant="secondary" size="sm" onClick={copyLink}>
                  {copied ? <Check /> : <Copy />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-500">
              <p className="flex items-start gap-1.5">
                <Clock className="mt-0.5 size-3 shrink-0" />
                Opening the link starts a payment window. It stays pending until the gateway confirms
                the money, and the receipt appears on the payments page when it does.
              </p>
              <p className="flex items-start gap-1.5">
                <ShieldCheck className="mt-0.5 size-3 shrink-0 text-emerald-500" />
                <CreditCard className="mt-0.5 size-3 shrink-0" />
                SocietyDesk never sees or stores card or UPI credentials.
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

/** Deep link a resident can open to pay this specific order. */
function paymentLink(orderId) {
  if (typeof window === "undefined") return `/resident/payments?order=${orderId}`;
  return `${window.location.origin}/resident/payments?order=${orderId}`;
}