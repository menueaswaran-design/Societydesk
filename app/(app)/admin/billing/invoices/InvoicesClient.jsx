"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  FileText,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Search,
  CheckCircle2,
  Receipt,
  MessageCircle,
  Trash2,
  MoreHorizontal,
  Eye,
  X,
  CheckSquare,
  Square,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Building,
} from "lucide-react";
import Button, { IconButton } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/Input";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/ui/Feedback";
import { CardNote, StatLine } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import CollectPaymentButton from "@/components/billing/CollectPaymentButton";
import ElectricityBillingSection from "./ElectricityBillingSection";
import { api, fieldErrors } from "@/lib/client/api";
import { INVOICE_STATUS, PAYMENT_METHOD } from "@/lib/constants";
import {
  formatDate,
  formatMoney,
  formatCompactMoney,
  getRelativeDueDate,
  formatPeriod,
  titleCase,
} from "@/lib/format";
import { buildRentReminderMessage, getWhatsAppUrl } from "@/lib/billing/whatsapp";

// ---------------------------------------------------------------------------
// Helpers & Subcomponents
// ---------------------------------------------------------------------------

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Quiet status indicator: small dot + colored text */
function StatusDot({ status }) {
  const configs = {
    PAID: { dot: "bg-emerald-500", text: "text-emerald-700", label: "Paid" },
    PARTIALLY_PAID: { dot: "bg-blue-500", text: "text-blue-700", label: "Partial" },
    OVERDUE: { dot: "bg-rose-500", text: "text-rose-700", label: "Overdue" },
    PENDING: { dot: "bg-amber-500", text: "text-amber-700", label: "Pending" },
    CANCELLED: { dot: "bg-slate-400", text: "text-slate-500", label: "Cancelled" },
    DRAFT: { dot: "bg-slate-400", text: "text-slate-600", label: "Draft" },
  };
  const cfg = configs[status] || {
    dot: "bg-slate-400",
    text: "text-slate-600",
    label: titleCase(status || "Unknown"),
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cfg.text} whitespace-nowrap`}>
      <span className={`size-1.5 rounded-full ${cfg.dot} shrink-0`} />
      {cfg.label}
    </span>
  );
}

/** 1-Click WhatsApp Reminder button */
function WhatsAppReminderButton({ invoice, size = "xs", className = "" }) {
  const handleSend = (e) => {
    e?.stopPropagation?.();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const payUrl = `${origin}/pay/${invoice.id}`;
    const text = buildRentReminderMessage({
      residentName: invoice.residentName || "Resident",
      roomLabel: invoice.unitLabel || "Room",
      period: formatPeriod(invoice.billingPeriod),
      amount: invoice.outstanding,
      dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : "the due date",
      payUrl,
      pgName: invoice.societyName || "Bedy PG",
      items: invoice.items,
    });
    const url = getWhatsAppUrl(invoice.residentPhone, text);
    window.open(url, "_blank");
  };

  return (
    <Button
      variant="secondary"
      size={size}
      onClick={handleSend}
      className={`!text-emerald-700 !bg-emerald-50 hover:!bg-emerald-100 !border-emerald-200 transition-colors ${className}`}
      title="Send 1-Click WhatsApp Reminder with Instant UPI Pay Link"
    >
      <MessageCircle className="size-3 text-emerald-600" />
      Remind
    </Button>
  );
}

/** Row action ⋯ dropdown menu */
function RowMoreMenu({ invoice, onRecordPayment, onOpenDrawer }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex size-7.5 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition focus:outline-none"
        title="More options"
        aria-label="More options"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-48 origin-top-right rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 animate-pop">
          {invoice.outstanding > 0 && invoice.status !== "CANCELLED" && (
            <>
              <div className="px-2 py-1 border-b border-slate-100">
                <CollectPaymentButton
                  invoiceId={invoice.id}
                  invoiceNumber={invoice.invoiceNumber}
                  amount={invoice.outstanding}
                  size="xs"
                  label="Send link"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onRecordPayment();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition"
              >
                <Wallet className="size-3.5 text-slate-400" />
                Record payment
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onOpenDrawer();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition"
          >
            <Eye className="size-3.5 text-slate-400" />
            View details
          </button>
        </div>
      )}
    </div>
  );
}

/** Side Drawer showing full invoice, payment history, and actions without leaving list */
function InvoiceDrawer({ invoice, onClose, onRecordPayment }) {
  if (!invoice) return null;
  const rel = getRelativeDueDate(invoice.dueDate);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-slide-left">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-900">
                  {invoice.invoiceNumber}
                </span>
                <StatusDot status={invoice.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatPeriod(invoice.billingPeriod)} · Created {formatDate(invoice.invoiceDate)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Close drawer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Resident & Room Details */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Tenant & Room
                  </span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {invoice.unitLabel || "Room"}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    {invoice.residentName || "No resident assigned"}
                    {invoice.residentPhone ? ` · ${invoice.residentPhone}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Due Date
                  </span>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">
                    {formatDate(invoice.dueDate)}
                  </p>
                  {rel && (
                    <span
                      className={`text-[11px] font-bold ${
                        rel.isOverdue ? "text-rose-600" : "text-amber-600"
                      }`}
                    >
                      {rel.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Highlights */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-100 bg-white p-3 text-center shadow-2xs">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total
                </span>
                <span className="font-mono text-sm font-bold text-slate-900 mt-1 block tabular-nums">
                  {formatMoney(invoice.totalAmount)}
                </span>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-center shadow-2xs">
                <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">
                  Paid
                </span>
                <span className="font-mono text-sm font-bold text-emerald-700 mt-1 block tabular-nums">
                  {formatMoney(invoice.paidAmount)}
                </span>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-center shadow-2xs">
                <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider block">
                  Outstanding
                </span>
                <span className="font-mono text-sm font-bold text-amber-700 mt-1 block tabular-nums">
                  {formatMoney(invoice.outstanding)}
                </span>
              </div>
            </div>

            {/* Itemized Charges & Payments History */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <InvoiceBreakdown invoice={invoice} />
            </div>
          </div>

          {/* Sticky Drawer Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
            {invoice.outstanding > 0 && invoice.status !== "CANCELLED" ? (
              <>
                <WhatsAppReminderButton invoice={invoice} size="sm" />
                <div className="flex items-center gap-2">
                  <CollectPaymentButton
                    invoiceId={invoice.id}
                    invoiceNumber={invoice.invoiceNumber}
                    amount={invoice.outstanding}
                    size="sm"
                    label="Send link"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      onClose();
                      onRecordPayment();
                    }}
                  >
                    <Wallet className="size-4" />
                    Record payment
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" />
                  Invoice fully settled
                </span>
                <Button size="sm" variant="secondary" onClick={onClose}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Bulk WhatsApp Reminder Modal */
function BulkRemindModal({ open, onClose, invoices = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!open || invoices.length === 0) return null;

  const current = invoices[currentIndex] || invoices[0];
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  function openWhatsApp(inv) {
    const payUrl = `${origin}/pay/${inv.id}`;
    const text = buildRentReminderMessage({
      residentName: inv.residentName || "Resident",
      roomLabel: inv.unitLabel || "Room",
      period: formatPeriod(inv.billingPeriod),
      amount: inv.outstanding,
      dueDate: inv.dueDate ? formatDate(inv.dueDate) : "the due date",
      payUrl,
      pgName: inv.societyName || "Bedy PG",
      items: inv.items,
    });
    const url = getWhatsAppUrl(inv.residentPhone, text);
    window.open(url, "_blank");
  }

  function handleSendNext() {
    openWhatsApp(current);
    if (currentIndex < invoices.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  async function copyAllLinks() {
    const lines = invoices.map((inv) => {
      const payUrl = `${origin}/pay/${inv.id}`;
      return `${inv.unitLabel || "Room"} (${inv.residentName || "Resident"}): ${formatMoney(
        inv.outstanding
      )} - ${payUrl}`;
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      alert("Copied all reminder pay links to clipboard!");
    } catch {
      /* ignore */
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Remind Defaulters (${invoices.length} selected)`}
      description="Quickly notify tenants with their itemized bill and 1-click UPI pay link."
      size="md"
      footer={
        <div className="flex items-center justify-between w-full gap-2">
          <Button variant="secondary" size="sm" onClick={copyAllLinks}>
            <Copy className="size-3.5" />
            Copy all links
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Done
            </Button>
            <Button
              size="sm"
              onClick={handleSendNext}
              className="!bg-emerald-600 hover:!bg-emerald-700 text-white"
            >
              <MessageCircle className="size-4" />
              Send #{currentIndex + 1} ({current.residentName || "Resident"})
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pb-1 border-b border-slate-100">
          <span>Tenant & Room</span>
          <span>Dues & Action</span>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
          {invoices.map((inv, idx) => {
            const isCur = idx === currentIndex;
            return (
              <div
                key={inv.id}
                className={`py-2 px-2.5 flex items-center justify-between gap-3 text-xs rounded-lg transition-colors ${
                  isCur ? "bg-emerald-50/80 ring-1 ring-emerald-200" : "hover:bg-slate-50"
                }`}
              >
                <div>
                  <span className="font-bold text-slate-900 block">
                    {inv.unitLabel || "Room"} · {inv.residentName || "Resident"}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {inv.residentPhone || "No phone saved"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800">
                    {formatMoney(inv.outstanding)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      openWhatsApp(inv);
                    }}
                    className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                    title="Send WhatsApp message"
                  >
                    <MessageCircle className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main InvoicesClient Component
// ---------------------------------------------------------------------------

export default function InvoicesClient({
  invoices,
  summary,
  filters,
  units = [],
  occupancies = [],
}) {
  const router = useRouter();
  const searchInputRef = useRef(null);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [payFor, setPayFor] = useState(null);
  const [drawerInvoice, setDrawerInvoice] = useState(null);

  // Search & Filter state
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedStatusTab, setSelectedStatusTab] = useState(filters.status || "ACTION_NEEDED");

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkRemindOpen, setBulkRemindOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut: Press "/" to focus search
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Distinct periods and floors
  const periods = useMemo(
    () => [...new Set(invoices.map((i) => i.billingPeriod))].filter(Boolean).sort().reverse(),
    [invoices]
  );

  const floors = useMemo(() => {
    const set = new Set();
    for (const inv of invoices) {
      const f = inv.occupancy?.unit?.floor || inv.flat?.block;
      if (f) set.add(String(f));
    }
    return [...set].sort();
  }, [invoices]);

  // Live status counts for filter chips
  const statusCounts = useMemo(() => {
    let overdue = 0;
    let pending = 0;
    let partial = 0;
    let paid = 0;

    for (const inv of invoices) {
      if (inv.status === "OVERDUE") overdue++;
      else if (inv.status === "PENDING") pending++;
      else if (inv.status === "PARTIALLY_PAID") partial++;
      else if (inv.status === "PAID") paid++;
    }

    return {
      ALL: invoices.length,
      ACTION_NEEDED: overdue + pending + partial,
      OVERDUE: overdue,
      PENDING: pending,
      PARTIALLY_PAID: partial,
      PAID: paid,
    };
  }, [invoices]);

  // Filter and sort invoices
  const visible = useMemo(() => {
    let result = invoices;

    // 1. Status Filter Tab
    if (selectedStatusTab === "ACTION_NEEDED") {
      result = result.filter(
        (i) => i.status === "OVERDUE" || i.status === "PENDING" || i.status === "PARTIALLY_PAID"
      );
    } else if (selectedStatusTab && selectedStatusTab !== "ALL") {
      result = result.filter((i) => i.status === selectedStatusTab);
    }

    // 2. Floor Filter
    if (selectedFloor) {
      result = result.filter((i) => {
        const f = i.occupancy?.unit?.floor || i.flat?.block;
        return String(f) === selectedFloor;
      });
    }

    // 3. Search query
    const q = debouncedQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((i) =>
        [
          i.invoiceNumber,
          i.flat?.flatNumber,
          i.flat?.block,
          i.unitLabel,
          i.residentName,
          i.billingPeriod,
          i.residentPhone,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    // 4. Default Sort: What needs action first (Overdue first, then nearest due date)
    return [...result].sort((a, b) => {
      const statusWeight = {
        OVERDUE: 0,
        PARTIALLY_PAID: 1,
        PENDING: 2,
        DRAFT: 3,
        PAID: 4,
        CANCELLED: 5,
      };
      const wA = statusWeight[a.status] ?? 99;
      const wB = statusWeight[b.status] ?? 99;
      if (wA !== wB) return wA - wB;

      // Within same status, sort by due date ascending
      const dueA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dueB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return dueA - dueB;
    });
  }, [invoices, selectedStatusTab, selectedFloor, debouncedQuery]);

  // Bulk selection toggles
  const isAllSelected = visible.length > 0 && visible.every((i) => selectedIds.has(i.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visible.map((i) => i.id)));
    }
  };

  const toggleSelectInvoice = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectedInvoicesList = useMemo(() => {
    return invoices.filter((i) => selectedIds.has(i.id) && i.outstanding > 0);
  }, [invoices, selectedIds]);

  const overdueInvoicesList = useMemo(() => {
    return invoices.filter((i) => i.status === "OVERDUE" && i.outstanding > 0);
  }, [invoices]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Invoices"
        description="One invoice per occupied room/bed, per billing period."
        meta={
          <span className="text-[11px] font-semibold text-slate-500">
            {visible.length} of {invoices.length} shown
          </span>
        }
        actions={
          <Button onClick={() => setGenerateOpen(true)}>
            <Sparkles />
            Generate invoices
          </Button>
        }
      />

      {/* Flat Editorial Stat Strip (Saves ~150px height, removes clutter) */}
      <div className="bg-white rounded-2xl border border-[#E5EAF3] shadow-2xs p-4 sm:px-6 sm:py-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 gap-3 sm:gap-0">
          {/* 1. Total Billed */}
          <div className="sm:pr-6 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Billed
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono tabular-nums cursor-default"
                title={formatMoney(summary.billed)}
              >
                {formatCompactMoney(summary.billed)}
              </span>
              <span className="text-xs text-slate-400">
                {invoices.length} invoices
              </span>
            </div>
          </div>

          {/* 2. Collected */}
          <div className="pt-3 sm:pt-0 sm:px-6 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Collected
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className="text-2xl font-extrabold text-emerald-600 tracking-tight font-mono tabular-nums cursor-default"
                title={formatMoney(summary.collected)}
              >
                {formatCompactMoney(summary.collected)}
              </span>
              {summary.billed > 0 ? (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {Math.min(100, Math.round((summary.collected / summary.billed) * 100))}%
                </span>
              ) : null}
            </div>
          </div>

          {/* 3. Outstanding */}
          <div className="pt-3 sm:pt-0 sm:pl-6 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Outstanding Dues
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className="text-2xl font-extrabold text-amber-600 tracking-tight font-mono tabular-nums cursor-default"
                title={formatMoney(summary.outstanding)}
              >
                {formatCompactMoney(summary.outstanding)}
              </span>
            </div>
            {(summary.penalty > 0 || summary.carriedForward > 0) && (
              <p className="mt-1 text-[11px] text-slate-500 font-medium truncate">
                Includes{" "}
                {summary.penalty > 0 ? (
                  <span className="text-rose-600 font-semibold" title={formatMoney(summary.penalty)}>
                    {formatCompactMoney(summary.penalty)} penalty
                  </span>
                ) : null}
                {summary.penalty > 0 && summary.carriedForward > 0 ? " · " : ""}
                {summary.carriedForward > 0 ? (
                  <span className="text-amber-700 font-semibold" title={formatMoney(summary.carriedForward)}>
                    {formatCompactMoney(summary.carriedForward)} arrears
                  </span>
                ) : null}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar with Status Tabs, Period & Floor Selectors */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Status Filter Chips with Live Counts */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "ACTION_NEEDED", label: "Needs Action", count: statusCounts.ACTION_NEEDED, tone: "amber" },
            { id: "OVERDUE", label: "Overdue", count: statusCounts.OVERDUE, tone: "rose" },
            { id: "PENDING", label: "Pending", count: statusCounts.PENDING, tone: "amber" },
            { id: "PARTIALLY_PAID", label: "Partial", count: statusCounts.PARTIALLY_PAID, tone: "blue" },
            { id: "PAID", label: "Paid", count: statusCounts.PAID, tone: "emerald" },
            { id: "ALL", label: "All", count: statusCounts.ALL, tone: "slate" },
          ].map((tab) => {
            const active = selectedStatusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatusTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  active
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dropdowns: Period & Floor */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          {floors.length > 0 && (
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              aria-label="Filter by floor"
              className="h-8 cursor-pointer rounded-full bg-white px-3 text-xs font-semibold text-slate-600 border border-slate-200 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="">All Floors</option>
              {floors.map((f) => (
                <option key={f} value={f}>
                  Floor {f}
                </option>
              ))}
            </select>
          )}

          {periods.length > 0 && (
            <select
              value={filters.period ?? ""}
              onChange={(e) => {
                const params = new URLSearchParams(window.location.search);
                if (e.target.value) params.set("period", e.target.value);
                else params.delete("period");
                router.push(`/admin/billing/invoices?${params.toString()}`, { scroll: false });
              }}
              aria-label="Filter by period"
              className="h-8 cursor-pointer rounded-full bg-white px-3 text-xs font-semibold text-slate-600 border border-slate-200 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-brand-500 focus:outline-none whitespace-nowrap"
            >
              <option value="">All periods</option>
              {periods.map((p) => (
                <option key={p} value={p}>
                  {formatPeriod(p)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Surface: Search Input, Bulk Selection Bar, Table */}
      <div className="surface overflow-hidden border border-[#E5EAF3] rounded-2xl shadow-2xs bg-white">
        {/* Search header with shortcut indicator */}
        <div className="border-b border-slate-100 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tenant, room, invoice..."
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:border-brand-500 focus:outline-none transition-colors"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-block text-[10px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-400 font-mono">
                /
              </kbd>
            )}
          </div>

          {/* Quick action: Remind all overdue */}
          {overdueInvoicesList.length > 0 && (
            <Button
              size="xs"
              variant="secondary"
              onClick={() => {
                setSelectedIds(new Set(overdueInvoicesList.map((i) => i.id)));
                setBulkRemindOpen(true);
              }}
              className="!text-rose-700 !bg-rose-50 hover:!bg-rose-100 !border-rose-200 text-xs"
            >
              <MessageCircle className="size-3 text-rose-600" />
              Remind all overdue ({overdueInvoicesList.length})
            </Button>
          )}
        </div>

        {/* Bulk Action Sticky Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-brand-50/90 border-b border-brand-100 px-4 py-2.5 flex items-center justify-between gap-3 text-xs animate-fade-in">
            <div className="flex items-center gap-2 text-brand-950 font-semibold">
              <CheckSquare className="size-4 text-brand-600" />
              <span>
                {selectedIds.size} invoice{selectedIds.size === 1 ? "" : "s"} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="primary"
                onClick={() => setBulkRemindOpen(true)}
                className="!text-xs !bg-emerald-600 hover:!bg-emerald-700 text-white"
              >
                <MessageCircle className="size-3.5" />
                Remind selected ({selectedInvoicesList.length})
              </Button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {visible.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No matching invoices"
            description={
              query || selectedStatusTab !== "ALL"
                ? "Try clearing your search or status filter to see other invoices."
                : "Generate invoices for this billing period to get started."
            }
            action={
              <Button onClick={() => setGenerateOpen(true)}>
                <Sparkles />
                Generate invoices
              </Button>
            }
          />
        ) : (
          <>
            {/* Mobile Cards (Collapsed Stacked Lines) */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {visible.map((inv) => {
                const rel = getRelativeDueDate(inv.dueDate);
                return (
                  <div
                    key={inv.id}
                    onClick={() => setDrawerInvoice(inv)}
                    className="p-3.5 space-y-2 cursor-pointer transition-colors active:bg-slate-50/80 hover:bg-slate-50/50"
                  >
                    {/* Line 1: Flat/Room & Tenant on left, Amount on right */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-slate-900 block truncate">
                          {inv.unitLabel ||
                            (inv.flat?.block
                              ? `${inv.flat.block}-${inv.flat.flatNumber}`
                              : inv.flat?.flatNumber)}
                        </span>
                        <span className="text-xs text-slate-500 truncate block">
                          {inv.residentName ? `${inv.residentName} · ` : ""}
                          <span className="font-mono text-[11px] text-slate-400">
                            {inv.invoiceNumber}
                          </span>
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        {inv.outstanding > 0 ? (
                          <span
                            className={`font-mono font-bold text-sm tabular-nums ${
                              inv.status === "OVERDUE" ? "text-rose-600" : "text-amber-600"
                            }`}
                          >
                            {formatMoney(inv.outstanding)}
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-sm tabular-nums text-slate-800">
                            {formatMoney(inv.totalAmount)}
                          </span>
                        )}
                        <span className="block text-[10px] text-slate-400 font-medium">
                          {inv.outstanding > 0 ? "due" : "settled"}
                        </span>
                      </div>
                    </div>

                    {/* Line 2: Status + Due date on left, Single Action on right */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <StatusDot status={inv.status} />
                        {rel && (
                          <span
                            className={`text-[11px] font-medium whitespace-nowrap ${
                              rel.isOverdue ? "text-rose-600 font-semibold" : "text-slate-500"
                            }`}
                          >
                            · {rel.label}
                          </span>
                        )}
                      </div>

                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        {(inv.status === "PENDING" || inv.status === "OVERDUE") &&
                        inv.outstanding > 0 ? (
                          <WhatsAppReminderButton invoice={inv} size="xs" />
                        ) : inv.status === "PARTIALLY_PAID" && inv.outstanding > 0 ? (
                          <Button
                            size="xs"
                            variant="primary"
                            onClick={() => setPayFor(inv)}
                            className="!text-xs !py-1 !px-2.5"
                          >
                            <Wallet className="size-3" />
                            Record
                          </Button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDrawerInvoice(inv)}
                            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                          >
                            Details →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table with Sticky Columns */}
            <div className="hidden sm:block overflow-x-auto relative">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                    {/* Checkbox */}
                    <th className="py-3 pl-4 pr-2 w-8">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all"
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                    </th>

                    {/* Flat/Room (Sticky Left) */}
                    <th className="py-3 px-3 sticky left-0 z-20 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] min-w-[140px]">
                      Room / Tenant
                    </th>

                    {/* Invoice # (Muted Gray Mono) */}
                    <th className="py-3 px-3 hidden lg:table-cell min-w-[110px]">
                      Invoice #
                    </th>

                    {/* Period (No wrap) */}
                    <th className="py-3 px-3 hidden md:table-cell whitespace-nowrap min-w-[90px]">
                      Period
                    </th>

                    {/* Due Date & Relative */}
                    <th className="py-3 px-3 whitespace-nowrap min-w-[110px]">
                      Due Date
                    </th>

                    {/* Money columns: Right aligned, tabular-nums */}
                    <th className="py-3 px-3 text-right font-medium min-w-[90px]">
                      Total
                    </th>
                    <th className="py-3 px-3 text-right font-medium min-w-[90px]">
                      Paid
                    </th>
                    <th className="py-3 px-3 text-right font-medium min-w-[100px]">
                      Outstanding
                    </th>

                    {/* Status */}
                    <th className="py-3 px-3 min-w-[90px]">
                      Status
                    </th>

                    {/* Action (Sticky Right) */}
                    <th className="py-3 pr-4 pl-3 text-right sticky right-0 z-20 bg-slate-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)] min-w-[140px]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visible.map((inv) => {
                    const isSelected = selectedIds.has(inv.id);
                    const rel = getRelativeDueDate(inv.dueDate);

                    return (
                      <tr
                        key={inv.id}
                        onClick={() => setDrawerInvoice(inv)}
                        className={`group hover:bg-slate-50/70 cursor-pointer transition-colors ${
                          isSelected ? "bg-brand-50/30" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-2.5 pl-4 pr-2 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectInvoice(inv.id)}
                            aria-label={`Select invoice ${inv.invoiceNumber}`}
                            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                          />
                        </td>

                        {/* Flat / Room & Tenant (Sticky Left) */}
                        <td className="py-2.5 px-3 sticky left-0 z-10 bg-white group-hover:bg-slate-50/70 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] min-w-[140px]">
                          <span className="font-semibold text-slate-900 block truncate">
                            {inv.unitLabel ||
                              (inv.flat?.block
                                ? `${inv.flat.block}-${inv.flat.flatNumber}`
                                : inv.flat?.flatNumber)}
                          </span>
                          <span className="block text-[11px] text-slate-500 font-normal truncate">
                            {inv.residentName || "Unassigned"}
                          </span>
                        </td>

                        {/* Invoice # (Muted Gray Mono) */}
                        <td className="py-2.5 px-3 hidden lg:table-cell font-mono text-xs text-slate-500 whitespace-nowrap">
                          {inv.invoiceNumber}
                        </td>

                        {/* Period (No wrap) */}
                        <td className="py-2.5 px-3 hidden md:table-cell whitespace-nowrap text-xs text-slate-600">
                          {formatPeriod(inv.billingPeriod)}
                        </td>

                        {/* Due Date & Relative badge */}
                        <td className="py-2.5 px-3 whitespace-nowrap text-xs">
                          {rel ? (
                            <div>
                              <span
                                className={`font-semibold block ${
                                  rel.isOverdue ? "text-rose-600" : "text-slate-800"
                                }`}
                              >
                                {rel.label}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {formatDate(inv.dueDate)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Total */}
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-medium text-slate-800 whitespace-nowrap">
                          {formatMoney(inv.totalAmount)}
                        </td>

                        {/* Paid */}
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-emerald-600 whitespace-nowrap">
                          {inv.paidAmount > 0 ? (
                            formatMoney(inv.paidAmount)
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>

                        {/* Outstanding */}
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs whitespace-nowrap">
                          {inv.outstanding > 0 ? (
                            <span
                              className={`font-bold ${
                                inv.status === "OVERDUE" ? "text-rose-600" : "text-amber-600"
                              }`}
                            >
                              {formatMoney(inv.outstanding)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Status Dot */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <StatusDot status={inv.status} />
                        </td>

                        {/* Sticky Action Column */}
                        <td
                          className="py-2.5 pr-4 pl-3 text-right sticky right-0 z-10 bg-white group-hover:bg-slate-50/70 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)] whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Single primary action based on status */}
                            {(inv.status === "PENDING" || inv.status === "OVERDUE") &&
                            inv.outstanding > 0 ? (
                              <WhatsAppReminderButton invoice={inv} size="xs" />
                            ) : inv.status === "PARTIALLY_PAID" && inv.outstanding > 0 ? (
                              <Button
                                size="xs"
                                variant="primary"
                                onClick={() => setPayFor(inv)}
                                className="!text-xs !py-1 !px-2.5"
                              >
                                <Wallet className="size-3" />
                                Record payment
                              </Button>
                            ) : inv.status === "PAID" ? (
                              <span className="text-[11px] text-slate-400 font-medium px-2 py-1">
                                ✓ Paid
                              </span>
                            ) : inv.outstanding > 0 ? (
                              <Button
                                size="xs"
                                variant="secondary"
                                onClick={() => setPayFor(inv)}
                                className="!text-xs !py-1 !px-2.5"
                              >
                                <Wallet className="size-3" />
                                Record payment
                              </Button>
                            ) : null}

                            {/* ⋯ Menu */}
                            <RowMoreMenu
                              invoice={inv}
                              onRecordPayment={() => setPayFor(inv)}
                              onOpenDrawer={() => setDrawerInvoice(inv)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Side Drawer for Details */}
      <InvoiceDrawer
        invoice={drawerInvoice}
        onClose={() => setDrawerInvoice(null)}
        onRecordPayment={() => {
          setPayFor(drawerInvoice);
        }}
      />

      {/* Bulk WhatsApp Remind Modal */}
      <BulkRemindModal
        open={bulkRemindOpen}
        onClose={() => setBulkRemindOpen(false)}
        invoices={selectedInvoicesList.length > 0 ? selectedInvoicesList : overdueInvoicesList}
      />

      {/* Generate Invoices Modal with 2-Step Preview */}
      <GenerateModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        units={units}
        occupancies={occupancies}
      />

      {/* Payment Recording Modal */}
      <PaymentModal invoice={payFor} onClose={() => setPayFor(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invoice Charges & Payments Breakdown Component
// ---------------------------------------------------------------------------

function InvoiceBreakdown({ invoice }) {
  return (
    <div className="grid gap-6 bg-slate-50/70 p-5 lg:grid-cols-2">
      <div>
        <p className="label-xs mb-2">Itemized Charges</p>
        <ul className="space-y-1.5">
          {invoice.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 text-xs sm:text-sm">
              <span className="flex min-w-0 items-center gap-2 text-slate-700">
                {item.name}
                <Badge>{titleCase(item.type)}</Badge>
              </span>
              <span className="tabular font-mono text-slate-900">{formatMoney(item.amount)}</span>
            </li>
          ))}
          {invoice.previousDue > 0 ? (
            <li className="flex items-center justify-between gap-3 text-xs sm:text-sm">
              <span className="text-slate-700">Previous arrears</span>
              <span className="tabular font-mono font-medium text-amber-700">
                {formatMoney(invoice.previousDue)}
              </span>
            </li>
          ) : null}
          {invoice.penalty > 0 ? (
            <li className="flex items-center justify-between gap-3 text-xs sm:text-sm">
              <span className="text-slate-700">Late penalty</span>
              <span className="tabular font-mono font-medium text-rose-700">
                {formatMoney(invoice.penalty)}
              </span>
            </li>
          ) : null}
          <li className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2 text-xs sm:text-sm font-semibold">
            <span>Total amount</span>
            <span className="tabular font-mono">{formatMoney(invoice.totalAmount)}</span>
          </li>
        </ul>
      </div>

      <div>
        <p className="label-xs mb-2">Payment Receipts ({invoice.payments.length})</p>
        {invoice.payments.length === 0 ? (
          <p className="text-xs text-slate-400">No payments recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {invoice.payments.map((p) => (
              <li
                key={p.id}
                className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800">
                    {formatDate(p.paymentDate)}
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatMoney(p.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-slate-500">
                  <Badge tone="brand">{titleCase(p.paymentMethod)}</Badge>
                  {p.transactionReference && (
                    <span className="truncate font-mono text-[11px] text-slate-400">
                      Ref: {p.transactionReference}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// GenerateModal with Step 1: Config, Step 2: Preview & Confirm
// ---------------------------------------------------------------------------

function GenerateModal({ open, onClose, units = [], occupancies = [] }) {
  const router = useRouter();
  const [step, setStep] = useState("CONFIG"); // "CONFIG" | "PREVIEW"

  const [form, setForm] = useState({
    billingPeriod: currentPeriod(),
    dueDate: "",
    previousDue: true,
    penaltyPercent: 2,
    skipVacant: true,
  });

  // Expandable sections toggles
  const [showElectricity, setShowElectricity] = useState(false);
  const [electricityConfig, setElectricityConfig] = useState(undefined);
  const [showExtraCharges, setShowExtraCharges] = useState(false);

  // All distinct rooms from units prop or derived from occupancies
  const allRooms = useMemo(() => {
    if (units.length > 0) return units;
    const roomMap = new Map();
    for (const occ of occupancies) {
      if (occ.unit) {
        roomMap.set(occ.unit.id || occ.unit.unitNumber, {
          ...occ.unit,
          lastReading: 0,
          defaultRate: 10,
        });
      }
    }
    return Array.from(roomMap.values());
  }, [units, occupancies]);

  // Occupants list per room
  const occupantsByRoomMap = useMemo(() => {
    const map = {};
    for (const occ of occupancies) {
      const rKey = occ.unit?.id || occ.unit?.unitNumber;
      if (rKey) {
        if (!map[rKey]) map[rKey] = [];
        map[rKey].push(occ);
      }
    }
    return map;
  }, [occupancies]);

  // Extra charges list
  const [extraChargesList, setExtraChargesList] = useState([]);

  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  function set(key) {
    return (e) => {
      const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm({ ...form, [key]: value });
    };
  }

  // Calculate preview figures
  const eligibleOccupancies = useMemo(() => {
    if (form.skipVacant) {
      return occupancies.filter((o) => o.status === "ACTIVE" || o.status === "NOTICE");
    }
    return occupancies;
  }, [occupancies, form.skipVacant]);

  const estimatedCount = eligibleOccupancies.length || units.length || 0;
  const estimatedBaseRent = eligibleOccupancies.reduce(
    (sum, o) => sum + (Number(o.rentAmount) || Number(o.unit?.rentAmount) || 0),
    0
  );
  const estimatedExtra = extraChargesList.reduce((sum, c) => {
    const amt = Number(c.amount) || 0;
    if (c.targetType === "ALL") return sum + amt * (estimatedCount || 1);
    return sum + amt;
  }, 0);
  const estimatedTotal = estimatedBaseRent + estimatedExtra;

  function handleGoToPreview() {
    if (!form.billingPeriod?.trim()) {
      setError("Billing period is required.");
      return;
    }
    setError(null);
    setStep("PREVIEW");
  }

  async function run() {
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      const extraCharges =
        showExtraCharges && extraChargesList.length > 0
          ? extraChargesList
              .filter((c) => c.name?.trim() && Number(c.amount) > 0)
              .map((c) => ({
                name: c.name.trim(),
                type: c.type || "OTHER",
                amount: Number(c.amount),
                targetType: c.targetType || "ALL",
                targetId: c.targetId || undefined,
              }))
          : undefined;

      const data = await api.post("/api/billing/invoices/generate", {
        ...form,
        penaltyPercent: Number(form.penaltyPercent) || 0,
        dueDate: form.dueDate || undefined,
        electricityConfig: showElectricity && electricityConfig ? electricityConfig : undefined,
        extraCharges,
      });

      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setErrors(fieldErrors(err));
      setStep("CONFIG"); // Back to config if error
    } finally {
      setSaving(false);
    }
  }

  function close() {
    setResult(null);
    setError(null);
    setStep("CONFIG");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={
        result
          ? "Invoices generated"
          : step === "PREVIEW"
          ? "Preview invoice generation"
          : "Generate invoices"
      }
      description={
        step === "PREVIEW"
          ? "Review estimated numbers before generating live invoices."
          : "One invoice per occupied room/flat for the selected billing period."
      }
      size="xl"
      footer={
        result ? (
          <Button onClick={close}>Done</Button>
        ) : step === "PREVIEW" ? (
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" onClick={() => setStep("CONFIG")}>
              ← Back & Edit
            </Button>
            <Button onClick={run} loading={saving}>
              Confirm & Generate ({estimatedCount} Invoices)
            </Button>
          </div>
        ) : (
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button onClick={handleGoToPreview}>
              Review & Preview →
            </Button>
          </>
        )
      }
    >
      {result ? (
        <SuccessBanner
          title={`Created ${result.createdCount} invoice${result.createdCount === 1 ? "" : "s"}`}
          icon={CheckCircle2}
        >
          Total billed {formatMoney(result.totalAmount)} for {formatPeriod(result.billingPeriod)}.
          {result.skippedCount > 0
            ? ` ${result.skippedCount} resident${result.skippedCount === 1 ? "" : "s"} skipped — already invoiced for this period.`
            : ""}
        </SuccessBanner>
      ) : step === "PREVIEW" ? (
        <div className="space-y-4">
          <ErrorBanner error={error} />

          {/* Large Preview Highlight Card */}
          <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-600 text-white font-bold shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Ready to generate for {formatPeriod(form.billingPeriod)}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  This will create approximately{" "}
                  <strong className="text-brand-700 font-bold">
                    {estimatedCount} invoices
                  </strong>{" "}
                  totaling{" "}
                  <strong className="text-brand-700 font-bold">
                    {formatMoney(estimatedTotal)}
                  </strong>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown summary */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Billing period</span>
              <span className="font-semibold text-slate-900">{formatPeriod(form.billingPeriod)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Estimated base rent</span>
              <span className="font-semibold font-mono text-slate-900">{formatMoney(estimatedBaseRent)}</span>
            </div>
            {extraChargesList.length > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Extra charges ({extraChargesList.length})</span>
                <span className="font-semibold font-mono text-slate-900">+{formatMoney(estimatedExtra)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Electricity meter calculation</span>
              <span className="font-semibold text-slate-900">{showElectricity ? "Enabled" : "Disabled"}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Carry forward unpaid balances</span>
              <span className="font-semibold text-slate-900">{form.previousDue ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Skip vacant rooms/beds</span>
              <span className="font-semibold text-slate-900">{form.skipVacant ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800">Estimated Total Amount</span>
              <span className="font-bold font-mono text-brand-700 text-sm">~{formatMoney(estimatedTotal)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <ErrorBanner error={error} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              id="billingPeriod"
              label="Billing period"
              value={form.billingPeriod}
              onChange={set("billingPeriod")}
              error={errors.billingPeriod}
              placeholder="2026-10"
              hint="YYYY-MM"
              required
            />
            <Input
              id="dueDate"
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={set("dueDate")}
              error={errors.dueDate}
              hint="Defaults to the 10th"
            />
          </div>

          <Input
            id="penaltyPercent"
            label="Late payment penalty (%)"
            type="number"
            step="0.5"
            min="0"
            max="100"
            value={form.penaltyPercent}
            onChange={set("penaltyPercent")}
            error={errors.penaltyPercent}
            hint="Applied to overdue earlier invoices and to this one once past due"
          />

          <div className="flex flex-col gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-900/5">
            <Checkbox
              id="previousDue"
              checked={form.previousDue}
              onChange={set("previousDue")}
              label="Carry forward unpaid earlier balances"
            />
            <Checkbox
              id="skipVacant"
              checked={form.skipVacant}
              onChange={set("skipVacant")}
              label="Skip vacant flats / beds"
            />
          </div>

          {/* Electricity Billing Section */}
          <ElectricityBillingSection
            allRooms={allRooms}
            occupancies={occupancies}
            occupantsByRoomMap={occupantsByRoomMap}
            enabled={showElectricity}
            onToggleEnabled={setShowElectricity}
            onConfigChange={setElectricityConfig}
          />

          {/* Extra Charges Collapsible Section */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowExtraCharges(!showExtraCharges)}
              className="flex items-center justify-between w-full p-3.5 bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold text-xs shadow-2xs">
                  ➕
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Add Extra Charges</span>
                    <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      Optional
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {extraChargesList.length === 0
                      ? "None (Mess/Food, AC, Laundry, Maintenance, Custom)"
                      : `${extraChargesList.length} extra charge${
                          extraChargesList.length === 1 ? "" : "s"
                        } added`}
                  </p>
                </div>
              </div>
              <span className="text-slate-400">
                {showExtraCharges ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </span>
            </button>

            {showExtraCharges && (
              <div className="p-3.5 border-t border-slate-200 space-y-3 bg-white">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Quick Add Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {[
                      { name: "Mess / Food Charges", type: "FOOD", amount: 2500 },
                      { name: "AC Maintenance Fee", type: "MAINTENANCE", amount: 500 },
                      { name: "Laundry Service", type: "LAUNDRY", amount: 400 },
                      { name: "Custom Charge", type: "OTHER", amount: "" },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setExtraChargesList([
                            ...extraChargesList,
                            {
                              id: String(Date.now() + Math.random()),
                              name: preset.name,
                              type: preset.type,
                              amount: preset.amount,
                              targetType: "ALL",
                              targetId: "",
                            },
                          ]);
                        }}
                        className="py-1 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 text-xs transition-colors"
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {extraChargesList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center">
                    No extra charges added yet. Click a preset above or add a custom fee.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {extraChargesList.map((charge, idx) => (
                      <div
                        key={charge.id || idx}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-2 text-xs"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Charge Name (e.g. Mess Food)"
                            value={charge.name}
                            onChange={(e) => {
                              const updated = [...extraChargesList];
                              updated[idx].name = e.target.value;
                              setExtraChargesList(updated);
                            }}
                            className="rounded-lg border border-slate-300 p-1.5 bg-white text-xs"
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="Amount (₹)"
                            value={charge.amount}
                            onChange={(e) => {
                              const updated = [...extraChargesList];
                              updated[idx].amount = e.target.value;
                              setExtraChargesList(updated);
                            }}
                            className="rounded-lg border border-slate-300 p-1.5 bg-white text-xs font-semibold"
                          />
                          <div className="flex items-center gap-1.5">
                            <select
                              value={charge.targetType}
                              onChange={(e) => {
                                const updated = [...extraChargesList];
                                updated[idx].targetType = e.target.value;
                                updated[idx].targetId = "";
                                setExtraChargesList(updated);
                              }}
                              className="w-full rounded-lg border border-slate-300 p-1.5 bg-white text-xs"
                            >
                              <option value="ALL">All Residents</option>
                              <option value="ROOM">Specific Room</option>
                              <option value="INDIVIDUAL">Specific Resident</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                setExtraChargesList(extraChargesList.filter((_, i) => i !== idx));
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                              title="Remove charge"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>

                        {charge.targetType === "ROOM" && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 shrink-0">Select Room:</span>
                            <select
                              value={charge.targetId}
                              onChange={(e) => {
                                const updated = [...extraChargesList];
                                updated[idx].targetId = e.target.value;
                                setExtraChargesList(updated);
                              }}
                              className="w-full rounded-lg border border-slate-300 p-1 bg-white text-xs"
                            >
                              <option value="">-- Choose Room --</option>
                              {allRooms.map((r) => (
                                <option key={r.id || r.unitNumber} value={r.id || r.unitNumber}>
                                  Room {r.unitNumber}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {charge.targetType === "INDIVIDUAL" && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 shrink-0">Select Resident:</span>
                            <select
                              value={charge.targetId}
                              onChange={(e) => {
                                const updated = [...extraChargesList];
                                updated[idx].targetId = e.target.value;
                                setExtraChargesList(updated);
                              }}
                              className="w-full rounded-lg border border-slate-300 p-1 bg-white text-xs"
                            >
                              <option value="">-- Choose Resident --</option>
                              {occupancies.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.user?.name} (Room {o.unit?.unitNumber || "-"}
                                  {o.bed ? ` · Bed ${o.bed.bedLabel}` : ""})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <CardNote tone="brand" icon={Sparkles}>
            Flats and rooms already invoiced for this period are skipped, so it is safe to run this more than once.
          </CardNote>
        </div>
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Payment Recording Modal
// ---------------------------------------------------------------------------

function PaymentModal({ invoice, onClose }) {
  const router = useRouter();
  const [form, setForm] = useState({
    amount: "",
    paymentMethod: "UPI",
    transactionReference: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // Prefill with the full outstanding amount whenever a new invoice is picked
  const [lastId, setLastId] = useState(null);
  if (invoice && invoice.id !== lastId) {
    setLastId(invoice.id);
    setForm({
      amount: String(invoice.outstanding),
      paymentMethod: "UPI",
      transactionReference: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setError(null);
    setErrors({});
    setReceipt(null);
  }

  function set(key) {
    return (e) => setForm({ ...form, [key]: e.target.value });
  }

  async function submit() {
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      const data = await api.post("/api/payments", {
        invoiceId: invoice.id,
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
        transactionReference: form.transactionReference || null,
        paymentDate: form.paymentDate || undefined,
        notes: form.notes || null,
      });
      setReceipt({ ...data.receipt, invoice: data.invoice });
      router.refresh();
    } catch (err) {
      setError(err.message);
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  function close() {
    setLastId(null);
    onClose();
  }

  return (
    <Modal
      open={Boolean(invoice)}
      onClose={close}
      title={receipt ? "Payment recorded" : "Record payment"}
      description={
        invoice
          ? `${invoice.invoiceNumber} · ${
              invoice.flat?.block ? `${invoice.flat.block}-` : ""
            }${invoice.flat?.flatNumber || invoice.unitLabel} · ${formatPeriod(invoice.billingPeriod)}`
          : ""
      }
      footer={
        receipt ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              Record payment
            </Button>
          </>
        )
      }
    >
      {receipt ? (
        <div className="space-y-3">
          <SuccessBanner title={`Receipt ${receipt.receiptNumber}`} icon={Receipt}>
            {formatMoney(form.amount)} received via {titleCase(form.paymentMethod)}. Invoice status
            is now {titleCase(receipt.invoice?.status ?? "")}.
          </SuccessBanner>
          <p className="text-xs text-slate-500">
            The resident can see this payment and its receipt number immediately.
          </p>
        </div>
      ) : invoice ? (
        <div className="flex flex-col gap-4">
          <ErrorBanner error={error} />

          <div className="space-y-2 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-900/5">
            <StatLine label="Total" value={formatMoney(invoice.totalAmount)} />
            <StatLine label="Already paid" value={formatMoney(invoice.paidAmount)} tone="green" />
            <StatLine label="Outstanding" value={formatMoney(invoice.outstanding)} tone="amber" />
          </div>

          <Input
            id="amount"
            label="Amount received"
            type="number"
            min="1"
            max={invoice.outstanding}
            value={form.amount}
            onChange={set("amount")}
            error={errors.amount}
            required
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              id="paymentMethod"
              label="Method"
              value={form.paymentMethod}
              onChange={set("paymentMethod")}
              error={errors.paymentMethod}
            >
              {Object.values(PAYMENT_METHOD).map((m) => (
                <option key={m} value={m}>
                  {titleCase(m)}
                </option>
              ))}
            </Select>
            <Input
              id="paymentDate"
              label="Payment date"
              type="date"
              value={form.paymentDate}
              onChange={set("paymentDate")}
              error={errors.paymentDate}
            />
          </div>

          <Input
            id="transactionReference"
            label="Transaction reference"
            value={form.transactionReference}
            onChange={set("transactionReference")}
            error={errors.transactionReference}
            placeholder="UPI ref / cheque number"
          />

          <Textarea
            id="notes"
            label="Notes"
            rows={2}
            value={form.notes}
            onChange={set("notes")}
            error={errors.notes}
          />
        </div>
      ) : null}
    </Modal>
  );
}
