"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CreditCard,
  FileText,
  Landmark,
  Wallet,
  AlertCircle,
  Search,
  User,
  BedDouble,
  Check,
  QrCode,
  Banknote,
  Calendar,
  ArrowRight,
  X,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { StatLine } from "@/components/ui/Card";
import { ErrorBanner, Loading } from "@/components/ui/Feedback";
import { api, fieldErrors, openDocument } from "@/lib/client/api";
import { formatDate, formatMoney, formatPeriod, titleCase } from "@/lib/format";

const PAYMENT_METHODS = [
  { value: "UPI", label: "UPI / QR", icon: QrCode },
  { value: "CASH", label: "Cash", icon: Banknote },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Landmark },
  { value: "CHEQUE", label: "Cheque", icon: FileText },
  { value: "OTHER", label: "Other", icon: CreditCard },
];

function getResidentName(inv) {
  return (
    inv?.residentName ||
    inv?.occupancy?.user?.name ||
    inv?.flat?.residents?.[0]?.user?.name ||
    "Resident"
  );
}

function getUnitLabel(inv) {
  if (inv?.unitLabel) return inv.unitLabel;
  const occ = inv?.occupancy;
  if (occ?.unit?.unitNumber) {
    return `Room ${occ.unit.unitNumber}${occ.bed?.bedLabel ? ` (${occ.bed.bedLabel})` : ""}`;
  }
  if (inv?.flat?.flatNumber) {
    return inv.flat.block ? `${inv.flat.block}-${inv.flat.flatNumber}` : `Flat ${inv.flat.flatNumber}`;
  }
  return "—";
}

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
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [residentSearch, setResidentSearch] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    if (!open) {
      setReceipt(null);
      setError(null);
      setErrors({});
      setResidentSearch("");
      return;
    }

    const hasFullInvoiceData =
      preselectedInvoice &&
      (preselectedInvoice.totalAmount !== undefined || preselectedInvoice.outstanding !== undefined) &&
      (preselectedInvoice.residentName || preselectedInvoice.occupancy || preselectedInvoice.flat);

    if (hasFullInvoiceData) {
      const calcOutstanding =
        preselectedInvoice.outstanding ??
        Math.max(0, (preselectedInvoice.totalAmount || 0) - (preselectedInvoice.paidAmount || 0));
      const normalizedInv = {
        ...preselectedInvoice,
        outstanding: calcOutstanding,
      };
      setInvoices([normalizedInv]);
      setSelectedInvoiceId(preselectedInvoice.id);
      setAmount(String(calcOutstanding));
      return;
    }

    if (flatId || !hasFullInvoiceData) {
      setLoadingInvoices(true);
      const url = flatId ? `/api/billing/invoices?flatId=${flatId}&pageSize=100` : `/api/billing/invoices?pageSize=100`;
      api
        .get(url)
        .then((rows) => {
          const list = Array.isArray(rows) ? rows : rows?.invoices || rows?.data || [];
          const unpaid = list.filter((i) => (i.outstanding ?? (i.totalAmount - (i.paidAmount || 0))) > 0);
          setInvoices(unpaid);
          const targetId = preselectedInvoice?.id;
          const match = targetId ? unpaid.find((i) => i.id === targetId) : null;
          if (match) {
            setSelectedInvoiceId(match.id);
            setAmount(String(match.outstanding));
          } else if (unpaid.length > 0) {
            setSelectedInvoiceId(unpaid[0].id);
            setAmount(String(unpaid[0].outstanding));
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoadingInvoices(false));
    }
  }, [open, flatId, preselectedInvoice]);

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  // Filter invoices for resident picker
  const filteredInvoices = useMemo(() => {
    const q = residentSearch.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv) => {
      const name = getResidentName(inv).toLowerCase();
      const unit = getUnitLabel(inv).toLowerCase();
      return name.includes(q) || unit.includes(q);
    });
  }, [invoices, residentSearch]);

  function handleSelectInvoice(inv) {
    setSelectedInvoiceId(inv.id);
    setAmount(String(inv.outstanding));
    setError(null);
  }

  async function submit(e) {
    e?.preventDefault();
    if (!selectedInvoiceId) {
      setError("Please select a resident to Add payment for.");
      return;
    }

    const nAmount = Number(amount);
    if (!nAmount || nAmount <= 0) {
      setError("Please enter a valid payment amount.");
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

  const activeResidentName = selectedInvoice
    ? getResidentName(selectedInvoice)
    : residentName || "Resident";
  const activeUnitLabel = selectedInvoice
    ? getUnitLabel(selectedInvoice)
    : flatLabel || "Room";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={receipt ? "Payment Recorded Successfully" : "Record Resident Payment"}
      description={
        receipt
          ? `Receipt issued for ${activeResidentName} (${activeUnitLabel})`
          : "Record rent or utility dues received via UPI, Cash, or Bank Transfer."
      }
      size="lg"
      footer={
        receipt ? (
          <>
            {receipt.pdfUrl ? (
              <Button
                variant="secondary"
                onClick={() => openDocument(receipt.pdfUrl).catch((e) => setError(e.message))}
              >
                <FileText className="size-4" />
                View & Print Receipt
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
              disabled={loadingInvoices || invoices.length === 0 || !selectedInvoice}
              className="bg-brand-600 hover:bg-brand-700 text-white"
            >
              <CheckCircle2 className="size-4" />
              <span>
                Record {amount ? formatMoney(Number(amount)) : "Payment"} for {activeResidentName}
              </span>
            </Button>
          </>
        )
      }
    >
      {loadingInvoices ? (
        <div className="py-12 text-center text-sm text-slate-500">
          <Loading label="Loading pending dues..." />
        </div>
      ) : null}

      <ErrorBanner error={error} className="mb-3" />

      {/* ── SUCCESS STATE RECEIPT CARD ──────────────────────────────────── */}
      {receipt ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3.5 rounded-2xl bg-emerald-50 p-5 border border-emerald-200">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-6" />
            </span>
            <div>
              <p className="text-base font-extrabold text-emerald-950">
                Payment of {formatMoney(receipt.amount ?? Number(amount))} Recorded!
              </p>
              <p className="text-xs text-emerald-700">
                Resident: <strong>{activeResidentName}</strong> · {activeUnitLabel}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-[#F8FAFF] p-4 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Resident:</span>
              <span className="font-bold text-slate-900">{activeResidentName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Room / Bed:</span>
              <span className="font-bold text-slate-900">{activeUnitLabel}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-bold text-slate-900">{titleCase(paymentMethod)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Payment Date:</span>
              <span className="font-bold text-slate-900">{formatDate(paymentDate)}</span>
            </div>
            {reference ? (
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono text-slate-700">{reference}</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : !loadingInvoices ? (
        invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <CheckCircle2 className="size-12 text-emerald-500" />
            <p className="text-base font-bold text-slate-900">All monthly dues are cleared!</p>
            <p className="max-w-xs text-xs text-slate-500">
              There are no pending or overdue bills awaiting payment right now.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {/* ── STEP 1: CLEAR RESIDENT SELECTION ────────────────────────── */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 block">
                1. Resident with Pending Dues <span className="text-rose-500">*</span>
              </label>

              {/* If single preselected invoice */}
              {preselectedInvoice || invoices.length === 1 ? (
                <div className="rounded-2xl border-2 border-brand-200 bg-brand-50/50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-brand-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                      {(getResidentName(invoices[0]) || "R")[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-950">
                        {getResidentName(invoices[0])}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">
                        {getUnitLabel(invoices[0])} · {formatPeriod(invoices[0].billingPeriod)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-medium">Pending Dues</span>
                    <span className="text-base font-black text-amber-700 font-mono">
                      {formatMoney(invoices[0].outstanding)}
                    </span>
                  </div>
                </div>
              ) : (
                /* Multi-resident searchable picker */
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                    <input
                      type="text"
                      value={residentSearch}
                      onChange={(e) => setResidentSearch(e.target.value)}
                      placeholder="Search resident by name or room..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                    />
                    {residentSearch && (
                      <button
                        type="button"
                        onClick={() => setResidentSearch("")}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Scrollable Resident Cards */}
                  <div className="max-h-52 overflow-y-auto space-y-1.5 rounded-xl border border-slate-200 p-1.5 bg-[#F8FAFF]">
                    {filteredInvoices.map((inv) => {
                      const isSelected = selectedInvoiceId === inv.id;
                      const name = getResidentName(inv);
                      const unit = getUnitLabel(inv);
                      return (
                        <div
                          key={inv.id}
                          onClick={() => handleSelectInvoice(inv)}
                          className={`cursor-pointer rounded-xl p-3 flex items-center justify-between transition-all ${
                            isSelected
                              ? "bg-white border-2 border-brand-600 shadow-xs"
                              : "bg-white/80 hover:bg-white border border-slate-200/80"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`size-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                                isSelected ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {(name || "R")[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-slate-900 block truncate">
                                {name}
                              </span>
                              <span className="text-[11px] text-slate-500 block truncate">
                                {unit} · {formatPeriod(inv.billingPeriod)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 ml-3">
                            <span className="text-xs font-black text-amber-700 block font-mono">
                              {formatMoney(inv.outstanding)}
                            </span>
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600">
                                <Check className="size-3 shrink-0" />
                                <span>Selected</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Click to pick</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── STEP 2: AMOUNT RECEIVED ─────────────────────────────────── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900">
                  2. Amount Received (₹) <span className="text-rose-500">*</span>
                </label>
                {selectedInvoice && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(selectedInvoice.outstanding))}
                    className="text-[11px] font-bold text-brand-600 hover:text-brand-700 underline"
                  >
                    Set Full Due ({formatMoney(selectedInvoice.outstanding)})
                  </button>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold text-slate-400 text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  max={selectedInvoice?.outstanding ? selectedInvoice.outstanding * 2 : 500000}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 8500"
                  required
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white font-black text-slate-900 text-base shadow-2xs focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                />
              </div>
            </div>

            {/* ── STEP 3: PAYMENT METHOD (PILL SELECTOR) ─────────────────── */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-900 block">
                3. Payment Method <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PAYMENT_METHODS.slice(0, 4).map((m) => {
                  const isPicked = paymentMethod === m.value;
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                        isPicked
                          ? "border-brand-600 bg-brand-50 text-brand-700 ring-2 ring-brand-600/10 shadow-2xs"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className={`size-3.5 shrink-0 ${isPicked ? "text-brand-600" : "text-slate-500"}`} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── STEP 4: DATE & OPTIONAL NOTE ────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Internal Notes / Reference (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Paid via GPay, handed cash at desk"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </form>
        )
      ) : null}
    </Modal>
  );
}
