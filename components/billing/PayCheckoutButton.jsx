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
  const orderRef = useRef(null);

  // Keeps a dismissed / closing Razorpay popup from being counted as a payment.
  const dismissed = useRef(false);

  useEffect(() => {
    if (!open) {
      setStage("idle");
      setCheckout(null);
      orderRef.current = null;
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
      orderRef.current = order;
      setCheckout(order);
      setStage("checkout");

      if (order.checkout?.isMock) {
        // Simulated gateway. Show the confirmation step instead of a real popup.
        return;
      }
      await openRazorpay(order);
    } catch (err) {
      setError(err.message);
      setStage("idle");
    }
  }

  /** Load Razorpay's script once, then open the real checkout popup. */
  async function openRazorpay(order) {
    const co = order.checkout;
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
      name: "Bedy",
      description: `Invoice ${invoiceNumber ?? ""}`.trim(),
      prefill: {
        name: flatLabel || "Resident",
        contact: "9876543210",
      },
      notes: { invoiceNumber: invoiceNumber ?? "" },
      theme: { color: "#10b981" },
      config: {
        display: {
          blocks: {
            upi: {
              name: "Pay via UPI (GPay / PhonePe / Paytm / QR)",
              instruments: [{ method: "upi" }],
            },
            other: {
              name: "Other Payment Modes (Cards, NetBanking)",
              instruments: [{ method: "card" }, { method: "netbanking" }],
            },
          },
          sequence: ["block.upi", "block.other"],
          preferences: {
            show_default_blocks: true,
          },
        },
      },
      handler: async (response) => {
        // Razorpay's checkout finished; the server still has to verify it.
        await confirm(order?.id || orderRef.current?.id, {
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          transactionReference: response.razorpay_payment_id,
        });
      },
      modal: {
        ondismiss: () => {
          if (dismissed.current) return;
          // Resident backed out. Release the order so it stops looking pending.
          const id = order?.id || orderRef.current?.id;
          if (id) {
            api.post(`/api/payment-orders/${id}/cancel`, {}).catch(() => {});
          }
          setStage("idle");
          close();
        },
      },
    });

    instance.open();
  }

  /** POST the gateway's signed result. Identical in mock and live mode. */
  async function confirm(orderId, { paymentId, signature, transactionReference, paymentMethod } = {}) {
    const id = orderId || orderRef.current?.id || checkout?.id;
    if (!id) {
      setError("Payment order not found. Please refresh and try again.");
      setStage("idle");
      return;
    }
    setStage("verifying");
    setError(null);
    try {
      const settled = await api.post(`/api/payment-orders/${id}/verify`, {
        paymentId,
        signature,
        transactionReference,
        paymentMethod,
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
  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [upiId, setUpiId] = useState("resident@upi");

  return (
    <>
      <Button variant={variant} size={size} onClick={start} disabled={amount <= 0}>
        <CreditCard />
        {label}
      </Button>

      <Modal
        open={open}
        onClose={close}
        title={stage === "done" ? "Payment Receipt" : "Razorpay Secure Checkout"}
        description={
          invoiceNumber ? `Invoice ${invoiceNumber}${flatLabel ? ` · ${flatLabel}` : ""}` : undefined
        }
        size="md"
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
                <Button
                  className="bg-[#0c2340] hover:bg-[#13335c] text-white"
                  onClick={() => confirm(checkout?.id || orderRef.current?.id, {
                    ...checkout?.checkout?.mock,
                    paymentMethod: selectedMethod === "card" ? "CARD" : selectedMethod === "netbanking" ? "NET_BANKING" : "UPI",
                  })}
                >
                  <Sparkles className="text-yellow-400" />
                  Simulate Razorpay Payment ({formatMoney(amount)})
                </Button>
              ) : null}
            </>
          )
        }
      >
        {stage === "starting" || stage === "verifying" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-sm text-slate-500">
            <Spinner className="size-6 text-[#2b63d9]" />
            <p className="font-medium text-slate-700">
              {stage === "verifying"
                ? "Verifying payment with Razorpay & generating receipt..."
                : "Initializing secure Razorpay gateway..."}
            </p>
            <span className="text-xs text-slate-400">🔒 256-bit SSL encrypted connection</span>
          </div>
        ) : null}

        {stage === "checkout" && isMock ? (
          <div className="space-y-4">
            {/* Razorpay Brand Header Banner */}
            <div className="rounded-xl bg-[#0c2340] p-4 text-white shadow-soft">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded bg-blue-500 font-black text-xs text-white">
                    R
                  </span>
                  <div>
                    <p className="text-sm font-bold tracking-tight">Razorpay</p>
                    <p className="text-[10px] text-blue-200">Trusted Business Payment Gateway</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-300">Amount to Pay</p>
                  <p className="text-xl font-bold tracking-tight text-white">{formatMoney(amount)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[11px] text-white/60">
                <span>{flatLabel ? `Flat ${flatLabel}` : "Monthly Maintenance"}</span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-300 font-medium">Demo Mode</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/50">
              <div className="grid grid-cols-3 border-b border-slate-200 bg-white text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setSelectedMethod("upi")}
                  className={`py-2.5 text-center transition-colors ${selectedMethod === "upi" ? "border-b-2 border-blue-600 font-semibold text-blue-700 bg-blue-50/30" : "text-slate-600 hover:text-slate-900"}`}
                >
                  UPI / QR
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod("card")}
                  className={`py-2.5 text-center transition-colors ${selectedMethod === "card" ? "border-b-2 border-blue-600 font-semibold text-blue-700 bg-blue-50/30" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMethod("netbanking")}
                  className={`py-2.5 text-center transition-colors ${selectedMethod === "netbanking" ? "border-b-2 border-blue-600 font-semibold text-blue-700 bg-blue-50/30" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Net Banking
                </button>
              </div>

              <div className="p-4">
                {selectedMethod === "upi" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-white p-3 ring-1 ring-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                          UPI
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">Google Pay / PhonePe / Paytm</p>
                          <p className="text-[11px] text-slate-400">Instant approval via simulated UPI</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600">Fastest</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="inline-flex items-center px-2 py-1 bg-slate-100 rounded text-[11px] text-slate-600 font-medium">Verified ✓</span>
                    </div>
                  </div>
                ) : null}

                {selectedMethod === "card" ? (
                  <div className="space-y-2 rounded-lg bg-white p-3 ring-1 ring-slate-200">
                    <p className="text-xs font-semibold text-slate-700">Simulated Test Card</p>
                    <div className="rounded border border-slate-200 bg-slate-50 p-2.5 text-xs font-mono text-slate-700">
                      <p className="tracking-widest">4242 •••• •••• 4242</p>
                      <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                        <span>EXP: 12/28</span>
                        <span>CVV: 888</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {selectedMethod === "netbanking" ? (
                  <div className="grid grid-cols-3 gap-2">
                    {["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak", "Other"].map((b) => (
                      <div key={b} className="rounded border border-slate-200 bg-white p-2 text-center text-xs font-medium text-slate-700 hover:border-blue-400 cursor-pointer">
                        {b}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <ErrorBanner error={error} />
          </div>
        ) : null}

        {stage === "done" && result ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3.5 ring-1 ring-emerald-200/80">
              <CheckCircle2 className="size-6 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-900">
                  Payment of {formatMoney(result.payment?.amount ?? amount)} Successful!
                </p>
                <p className="text-xs text-emerald-700">Processed securely through Razorpay</p>
              </div>
            </div>

            <div className="space-y-2 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-900/5">
              {result.receiptNumber ? (
                <StatLine label="Receipt Number" value={result.receiptNumber} tone="muted" />
              ) : null}
              {result.invoice ? (
                <StatLine
                  label="Invoice Status"
                  value={
                    <Badge tone={result.invoice.status === "PAID" ? "green" : "amber"} dot>
                      {titleCase(result.invoice.status)}
                    </Badge>
                  }
                />
              ) : null}
              <StatLine
                label="Payment Method"
                value="RAZORPAY (Online)"
                tone="muted"
              />
              <StatLine
                label="Remaining Balance"
                value={formatMoney(
                  Math.max(
                    0,
                    (result.invoice?.totalAmount ?? 0) - (result.invoice?.paidAmount ?? 0)
                  )
                )}
                tone="green"
              />
            </div>
          </div>
        ) : null}

        {error && stage !== "done" && !isMock ? <ErrorBanner error={error} className="mt-3" /> : null}

        <p className="mt-4 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
          <Lock className="size-3" />
          Secured by Razorpay · 100% RBI & PCI-DSS compliant
        </p>
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