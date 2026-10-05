"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Lock, ShieldCheck, Sparkles, FileText } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button, { Spinner } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { StatLine } from "@/components/ui/Card";
import { ErrorBanner, SuccessBanner } from "@/components/ui/Feedback";
import { api, openDocument } from "@/lib/client/api";
import { formatMoney, titleCase } from "@/lib/format";

/**
 * Start an online payment for an invoice and hand the result back.
 *
 * Mock mode and live Razorpay mode both end in the same POST /verify call, so
 * there is only one settlement path to reason about. Nothing in here decides
 * whether a payment succeeded - the server re-checks the gateway capture and
 * issues the receipt. This component only opens checkout and reports the result.
 */
export default function PayCheckoutButton({
  invoiceId,
  invoiceNumber,
  amount,
  flatLabel,
  size = "sm",
  variant = "primary",
  label = "Pay now",
  onPaid,
  autoStart = false,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState("idle"); // idle | starting | checkout | verifying | done
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [checkout, setCheckout] = useState(null);

  // Keeps a dismissed / closing Razorpay popup from being counted as a payment.
  const dismissed = useRef(false);

  useEffect(() => {
    if (!open) {
      setStage("idle");
      setCheckout(null);
      setResult(null);
      setError(null);
      dismissed.current = false;
    }
  }, [open]);

  // Arriving on ?order=<id> from an admin's payment link should open checkout
  // straight away instead of making the resident hunt for the Resume button.
  const startedRef = useRef(false);
  useEffect(() => {
    if (!autoStart || startedRef.current) return;
    startedRef.current = true;
    start();
    // Intentionally runs once per mount for this order only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  function close() {
    dismissed.current = true;
    setOpen(false);
  }

  async function start() {
    setError(null);
    setStage("starting");
    setOpen(true);
    try {
      const order = await api.post("/api/payment-orders", { invoiceId });
      setCheckout(order);
      setStage("checkout");

      if (order.checkout?.isMock) {
        // Simulated gateway. Show the confirmation step instead of a real popup.
        return;
      }
      await openRazorpay(order.checkout);
    } catch (err) {
      setError(err.message);
      setStage("idle");
    }
  }

  /** Load Razorpay's script once, then open the real checkout popup. */
  async function openRazorpay(co) {
    const razorpay = await loadRazorpay();
    if (!razorpay) {
      setError("Could not load the payment window. Check your connection and try again.");
      setStage("idle");
      return;
    }

    const instance = new razorpay({
      key: co.keyId,
      order_id: co.orderId,
      amount: co.razorpayAmount,
      currency: co.currency,
      name: "Society Desk",
      description: `Invoice ${invoiceNumber ?? ""}`.trim(),
      prefill: { name: flatLabel },
      notes: { invoiceNumber: invoiceNumber ?? "" },
      theme: { color: "#4f46e5" },
      handler: async (response) => {
        // Razorpay's checkout finished; the server still has to verify it.
        await confirm({
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          transactionReference: response.razorpay_payment_id,
        });
      },
      modal: {
        ondismiss: () => {
          if (dismissed.current) return;
          // Resident backed out. Release the order so it stops looking pending.
          api.post(`/api/payment-orders/${checkout.id}/cancel`, {}).catch(() => {});
          setStage("idle");
          close();
        },
      },
    });

    instance.open();
  }

  /** POST the gateway's signed result. Identical in mock and live mode. */
  async function confirm({ paymentId, signature, transactionReference }) {
    setStage("verifying");
    setError(null);
    try {
      const settled = await api.post(`/api/payment-orders/${checkout.id}/verify`, {
        paymentId,
        signature,
        transactionReference,
      });
      setResult(settled);
      setStage("done");
      dismissed.current = true;
      onPaid?.(settled);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setStage("checkout");
    }
  }

  const isMock = checkout?.checkout?.isMock;

  return (
    <>
      <Button variant={variant} size={size} onClick={start} disabled={amount <= 0}>
        <CreditCard />
        {label}
      </Button>

      <Modal
        open={open}
        onClose={close}
        title={`Pay ${formatMoney(amount)}`}
        description={
          invoiceNumber ? `Invoice ${invoiceNumber}${flatLabel ? ` · ${flatLabel}` : ""}` : undefined
        }
        size="sm"
        footer={
          stage === "done" ? (
            <>
              {result?.receiptUrl ? (
                <Button
                  variant="secondary"
                  onClick={() => openDocument(result.receiptUrl).catch((e) => setError(e.message))}
                >
                  <FileText />
                  View receipt
                </Button>
              ) : null}
              <Button onClick={close}>Done</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              {stage === "checkout" && isMock ? (
                <Button onClick={() => confirm(checkout.checkout.mock)}>
                  <Sparkles />
                  Simulate {formatMoney(amount)} payment
                </Button>
              ) : null}
            </>
          )
        }
      >
        {stage === "starting" || stage === "verifying" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-slate-500">
            <Spinner className="size-5 text-brand-500" />
            {stage === "verifying"
              ? "Confirming payment with the gateway"
              : "Preparing secure checkout"}
          </div>
        ) : null}

        {stage === "checkout" && isMock ? (
          <div className="space-y-3">
            <SuccessBanner title="Test mode" icon={Sparkles}>
              No real money moves. Use the button below to play the part of a successful bank
              payment, or cancel to try again.
            </SuccessBanner>
            <ErrorBanner error={error} />
          </div>
        ) : null}

        {stage === "done" && result ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200/80">
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-900">
                {formatMoney(result.payment?.amount ?? amount)} received
              </p>
            </div>

            <div className="space-y-2 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-900/5">
              {result.receiptNumber ? (
                <StatLine label="Receipt" value={result.receiptNumber} tone="muted" />
              ) : null}
              {result.invoice ? (
                <StatLine
                  label="Invoice status"
                  value={
                    <Badge tone={result.invoice.status === "PAID" ? "green" : "amber"} dot>
                      {titleCase(result.invoice.status)}
                    </Badge>
                  }
                />
              ) : null}
              <StatLine
                label="Still outstanding"
                value={formatMoney(
                  Math.max(
                    0,
                    (result.invoice?.totalAmount ?? 0) - (result.invoice?.paidAmount ?? 0)
                  )
                )}
                tone="amber"
              />
            </div>
          </div>
        ) : null}

        {error && stage !== "done" && !isMock ? <ErrorBanner error={error} className="mt-3" /> : null}

        {checkout?.checkout?.keyId ? (
          <p className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
            <Lock className="size-3" />
            Payments are processed by Razorpay.
            <ShieldCheck className="size-3" />
            This app never sees or stores card or UPI credentials.
          </p>
        ) : null}
      </Modal>
    </>
  );
}

/** Load window.Razorpay exactly once per page. */
let razorpayPromise = null;
function loadRazorpay() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (razorpayPromise) return razorpayPromise;

  razorpayPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(window.Razorpay ?? null);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });
  return razorpayPromise;
}