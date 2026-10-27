"use client";

import { useState, useId, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  QrCode,
  Smartphone,
  Copy,
  Check,
  Download,
  Share2,
  Receipt,
  FileText,
  AlertCircle,
  Building2,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  Zap,
  Utensils,
  Wrench,
  Sparkles,
  Droplets,
  Home,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatMoney, formatDate, formatPeriod } from "@/lib/format";
import {
  buildUpiDeepLink,
  buildReceiptWhatsAppMessage,
  getWhatsAppUrl,
} from "@/lib/billing/whatsapp";

function getPayItemMeta(type) {
  switch (type?.toUpperCase()) {
    case "ELECTRICITY":
      return {
        label: "Electricity",
        icon: Zap,
        bg: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "FOOD":
      return {
        label: "Food / Mess",
        icon: Utensils,
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "MAINTENANCE":
      return {
        label: "Maintenance",
        icon: Wrench,
        bg: "bg-sky-50 text-sky-700 border-sky-200",
      };
    case "LAUNDRY":
      return {
        label: "Laundry",
        icon: Sparkles,
        bg: "bg-purple-50 text-purple-700 border-purple-200",
      };
    case "WATER":
      return {
        label: "Water",
        icon: Droplets,
        bg: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "RENT":
      return {
        label: "Room Rent",
        icon: Home,
        bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      };
    default:
      return {
        label: "Charge",
        icon: Receipt,
        bg: "bg-slate-50 text-slate-700 border-slate-200",
      };
  }
}

// Dynamically load Razorpay SDK
function loadRazorpay() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null);
    if (window.Razorpay) return resolve(window.Razorpay);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(window.Razorpay || null);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });
}

export default function PayLandingClient({ initialData }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("instant"); // "instant" | "qr"
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Settlement results
  const [settledReceipt, setSettledReceipt] = useState(() => {
    const latestPayment = initialData.invoice.payments?.[0];
    const latestReceipt = latestPayment?.receipts?.[0];
    if (latestReceipt) {
      return {
        receiptNumber: latestReceipt.receiptNumber,
        receiptUrl: latestReceipt.pdfUrl,
        amount: latestPayment.amount,
        paymentDate: latestPayment.paymentDate,
        transactionReference: latestPayment.transactionReference,
      };
    }
    return null;
  });

  const { invoice, property, resident } = data;
  const isPaid = invoice.status === "PAID" || settledReceipt !== null;

  // Fallback property UPI ID
  const upiId = property.phone
    ? `${property.phone.replace(/\D/g, "").slice(-10)}@okaxis`
    : "bedy@upi";

  const upiDeepLink = buildUpiDeepLink({
    upiId,
    payeeName: property.name,
    amount: invoice.outstanding,
    invoiceNumber: invoice.invoiceNumber,
  });

  // Dynamic QR Code URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
    upiDeepLink
  )}`;

  // Copy UPI ID to clipboard
  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // 1-Click Pay flow
  const handleStartPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Create order publicly
      const res = await fetch(`/api/public/pay/${invoice.id}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const orderPayload = await res.json();
      if (!res.ok) {
        throw new Error(orderPayload.error || "Failed to initiate payment");
      }

      const co = orderPayload.checkout;

      // In mock/dev mode: settle immediately or simulated verification
      if (co?.isMock) {
        const verifyRes = await fetch(`/api/public/pay/${invoice.id}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: orderPayload.id,
            paymentId: co.mock?.paymentId,
            signature: co.mock?.signature,
            transactionReference: `SIM_${Date.now()}`,
          }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) {
          throw new Error(verifyData.error || "Verification failed");
        }

        setSettledReceipt({
          receiptNumber: verifyData.receiptNumber,
          receiptUrl: verifyData.receiptUrl,
          amount: invoice.outstanding,
          paymentDate: new Date().toISOString(),
          transactionReference: verifyData.payment?.transactionReference,
        });

        setData((prev) => ({
          ...prev,
          invoice: { ...prev.invoice, status: "PAID", outstanding: 0, paidAmount: prev.invoice.totalAmount },
        }));
        setLoading(false);
        return;
      }

      // Live Razorpay popup
      const Razorpay = await loadRazorpay();
      if (!Razorpay) {
        throw new Error("Could not load payment gateway. Please check your internet connection.");
      }

      const options = {
        key: co.keyId,
        order_id: co.orderId,
        amount: co.razorpayAmount,
        currency: co.currency,
        name: property.name,
        description: `Rent for ${formatPeriod(invoice.billingPeriod)} - ${resident.unitLabel}`,
        prefill: {
          name: resident.name,
          contact: resident.phone || "9876543210",
        },
        theme: { color: "#16a34a" },
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
          try {
            setLoading(true);
            const verifyRes = await fetch(`/api/public/pay/${invoice.id}/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: orderPayload.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                transactionReference: response.razorpay_payment_id,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");

            setSettledReceipt({
              receiptNumber: verifyData.receiptNumber,
              receiptUrl: verifyData.receiptUrl,
              amount: invoice.outstanding,
              paymentDate: new Date().toISOString(),
              transactionReference: response.razorpay_payment_id,
            });

            setData((prev) => ({
              ...prev,
              invoice: { ...prev.invoice, status: "PAID", outstanding: 0, paidAmount: prev.invoice.totalAmount },
            }));
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(false);
          }
        },
      };

      const rzp = new Razorpay(options);
      rzp.open();
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // WhatsApp receipt sharing URL
  const whatsappReceiptUrl = settledReceipt
    ? getWhatsAppUrl(
        resident.phone || property.phone,
        buildReceiptWhatsAppMessage({
          residentName: resident.name,
          roomLabel: resident.unitLabel,
          amount: settledReceipt.amount,
          receiptNumber: settledReceipt.receiptNumber,
          receiptUrl:
            typeof window !== "undefined"
              ? `${window.location.origin}${settledReceipt.receiptUrl}`
              : settledReceipt.receiptUrl,
          pgName: property.name,
        })
      )
    : "#";

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16 pt-4 text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Brand Header */}
      <header className="mx-auto max-w-xl px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-bold text-lg">
              {property.name.charAt(0) || "P"}
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-snug">{property.name}</h1>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-emerald-600 inline" />
                Verified Payment Portal
              </p>
            </div>
          </div>
          <Badge tone={isPaid ? "green" : invoice.status === "OVERDUE" ? "red" : "amber"}>
            {isPaid ? "PAID" : invoice.status === "OVERDUE" ? "OVERDUE" : "DUE"}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 space-y-4 mt-2">
        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Success Card if Paid */}
        {isPaid && (
          <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-lg shadow-emerald-500/5 transition-all">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md mb-3 ring-8 ring-white/10">
                <CheckCircle2 className="size-8 text-white" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Payment Completed!</h2>
              <p className="mt-1 text-xs text-emerald-100">
                Official digital receipt has been generated for {resident.name}.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-500 block">Receipt Number</span>
                  <span className="font-mono font-bold text-slate-900">
                    {settledReceipt?.receiptNumber || "Generating..."}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Amount Paid</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {formatMoney(settledReceipt?.amount || invoice.totalAmount)}
                  </span>
                </div>
                {settledReceipt?.transactionReference && (
                  <div className="col-span-2 pt-2 border-t border-slate-200/60 flex justify-between items-center">
                    <span className="text-slate-500">Transaction ID</span>
                    <span className="font-mono text-slate-700 text-[11px]">
                      {settledReceipt.transactionReference}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons for Paid State */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {settledReceipt?.receiptUrl && (
                  <a
                    href={settledReceipt.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-md transition hover:bg-slate-800"
                  >
                    <Download className="size-4" />
                    Download PDF Receipt
                  </a>
                )}

                <a
                  href={whatsappReceiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
                >
                  <Share2 className="size-4" />
                  Share on WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Bill Summary Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Billed Resident
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{resident.name}</h3>
              <p className="text-xs text-slate-500 font-medium">{resident.unitLabel}</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Billing Period
              </span>
              <div className="text-xs font-bold text-slate-900 mt-0.5">
                {formatPeriod(invoice.billingPeriod)}
              </div>
              <div className="text-[11px] text-slate-500">Due: {formatDate(invoice.dueDate)}</div>
            </div>
          </div>

          {/* Amount Highlight */}
          <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white flex items-center justify-between shadow-inner">
            <div>
              <span className="text-[11px] font-medium text-slate-300 block">
                {isPaid ? "Total Paid" : "Total Amount Due"}
              </span>
              <div className="text-2xl font-extrabold tracking-tight text-white mt-0.5">
                {formatMoney(isPaid ? invoice.totalAmount : invoice.outstanding)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-mono">
                {invoice.invoiceNumber}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 mt-1">
                Zero Convenience Fee
              </span>
            </div>
          </div>

          {/* Itemized Line Items */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Itemized Charges Breakdown</span>
              <span className="text-[11px] font-normal text-slate-500">
                {invoice.items?.length || 0} charge{invoice.items?.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 text-xs bg-slate-50/70 overflow-hidden shadow-2xs">
              {invoice.items?.map((item) => {
                const meta = getPayItemMeta(item.type);
                const Icon = meta.icon;
                return (
                  <div key={item.id} className="flex items-center justify-between p-2.5 gap-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`flex size-6 shrink-0 items-center justify-center rounded-md border ${meta.bg}`}>
                        <Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0">
                        <span className="text-slate-800 font-medium truncate block" title={item.name}>
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          {meta.label}
                        </span>
                      </div>
                    </div>
                    <span className="font-semibold text-slate-900 tabular-nums shrink-0">
                      {formatMoney(item.amount)}
                    </span>
                  </div>
                );
              })}
              {invoice.penalty > 0 && (
                <div className="flex justify-between p-2.5 text-rose-600 bg-rose-50/40">
                  <span className="font-medium">Late Fee / Penalty</span>
                  <span className="font-semibold tabular-nums">+{formatMoney(invoice.penalty)}</span>
                </div>
              )}
              {invoice.previousDue > 0 && (
                <div className="flex justify-between p-2.5 text-amber-700 bg-amber-50/40">
                  <span className="font-medium">Previous Balance / Arrears</span>
                  <span className="font-semibold tabular-nums">
                    +{formatMoney(invoice.previousDue)}
                  </span>
                </div>
              )}
              {invoice.paidAmount > 0 && !isPaid && (
                <div className="flex justify-between p-2.5 text-emerald-600 bg-emerald-50/40">
                  <span className="font-medium">Already Paid</span>
                  <span className="font-semibold tabular-nums">
                    -{formatMoney(invoice.paidAmount)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Methods (If Pending / Overdue) */}
        {!isPaid && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Select Payment Method</h4>
                <p className="text-xs text-slate-500">Direct instant settlement via UPI</p>
              </div>
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab("instant")}
                  className={`rounded-md px-2.5 py-1 transition ${
                    activeTab === "instant"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  1-Click UPI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("qr")}
                  className={`rounded-md px-2.5 py-1 transition ${
                    activeTab === "qr"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Scan QR Code
                </button>
              </div>
            </div>

            {activeTab === "instant" ? (
              <div className="space-y-3">
                {/* 1-Click Razorpay Button */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleStartPayment}
                  className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-4 text-white shadow-md shadow-emerald-600/25 transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-white/20">
                      <Smartphone className="size-5 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm">
                        {loading ? "Processing..." : `Pay ${formatMoney(invoice.outstanding)} via UPI / Cards`}
                      </div>
                      <div className="text-[11px] text-emerald-100">
                        PhonePe, Google Pay, Paytm, BHIM & Netbanking
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="size-5 shrink-0 text-white/80" />
                </button>

                {/* Mobile Direct Deep-link */}
                <a
                  href={upiDeepLink}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  <ExternalLink className="size-3.5 text-slate-500" />
                  Launch Installed UPI App (Mobile Only)
                </a>
              </div>
            ) : (
              /* QR Code Tab */
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="Scan UPI QR Code"
                    width={220}
                    height={220}
                    className="size-48 sm:size-52 rounded-lg object-contain"
                  />
                </div>
                <p className="text-xs text-slate-600 text-center font-medium max-w-xs">
                  Scan with any UPI app (GPay, PhonePe, Paytm, Cred) to pay instantly.
                </p>

                {/* Copy UPI ID */}
                <div className="flex items-center gap-2 w-full max-w-xs bg-white border border-slate-200 rounded-lg p-1.5 px-3 text-xs">
                  <span className="text-slate-500 font-mono text-[11px] truncate flex-1">
                    {upiId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="size-3 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security & Support Footer */}
        <div className="pt-2 text-center text-xs text-slate-400 space-y-1">
          <p className="flex items-center justify-center gap-1">
            <ShieldCheck className="size-3.5 text-slate-400" />
            256-Bit Bank Grade Encryption · NPCI & RBI Compliant
          </p>
          <p>
            Questions? Contact {property.name} at {property.phone || property.email || "support"}.
          </p>
        </div>
      </main>
    </div>
  );
}

