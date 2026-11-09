"use client";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  FileText,
  ChevronDown,
  ChevronRight,
  FilePlus2,
  Info,
  Search,
  CheckCircle2,
  Receipt,
  Trash2,
  X,
  CheckSquare,
  Square,
  ArrowRight,
  Check,
  Clock,
  AlertTriangle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Building,
  Plus,
  Zap,
  BellRing,
  Sparkles,
  Calendar,
  SlidersHorizontal,
} from "lucide-react";
import Button, { IconButton } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/Input";
import { DropdownSelect } from "@/components/ui/Dropdown";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/ui/Feedback";
import { StatLine } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import ElectricityBillingSection from "./ElectricityBillingSection";
import Pagination from "@/components/ui/Pagination";
import { api, fieldErrors } from "@/lib/client/api";
import { INVOICE_STATUS, PAYMENT_METHOD } from "@/lib/constants";
import {
  formatDate,
  formatMoney,
  formatCompactMoney,
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

function getOrdinal(n) {
  const num = Number(n);
  if (!num) return "th";
  const s = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
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
      <WhatsAppIcon className="size-3.5" />
      Remind
    </Button>
  );
}


/** Side Drawer showing full invoice, payment history, and actions without leaving list */
function InvoiceDrawer({ invoice, onClose, onRecordPayment }) {
  if (!invoice) return null;

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
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      onClose();
                      onRecordPayment();
                    }}
                  >
                    <Wallet className="size-4" />
                    Add payment
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
      title={`Remind Overdue (${invoices.length} selected)`}
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
              <WhatsAppIcon className="size-4" />
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
                    <WhatsAppIcon className="size-3.5" />
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
  society = null,
  initialAutoConfig = null,
  initialGenerateOpen = false,
}) {
  const router = useRouter();
  const searchInputRef = useRef(null);

  const [generateOpen, setGenerateOpen] = useState(initialGenerateOpen || false);
  const [payFor, setPayFor] = useState(null);
  const [drawerInvoice, setDrawerInvoice] = useState(null);

  useEffect(() => {
    if (initialGenerateOpen) {
      setGenerateOpen(true);
    }
  }, [initialGenerateOpen]);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Search & Filter state
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");
  const [selectedStatusTab, setSelectedStatusTab] = useState(filters.status || "ACTION_NEEDED");

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkRemindOpen, setBulkRemindOpen] = useState(false);

  // Auto-Billing Configuration & Prompts State
  const [autoConfig, setAutoConfig] = useState(() => {
    return (
      initialAutoConfig || {
        mode: "CONFIRMATION",
        dueDay: society?.dueDay || 10,
        penaltyPercent: 2,
        previousDue: true,
        skipVacant: true,
        lastAutoPeriod: null,
      }
    );
  });

  const [autoSettingsOpen, setAutoSettingsOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [autoSuccessBanner, setAutoSuccessBanner] = useState(null);

  // Current period (e.g. "2026-11")
  const currentPeriodStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  // Eligible active occupants count
  const eligibleActiveOccupancies = useMemo(() => {
    return occupancies.filter((o) => o.status === "ACTIVE" || o.status === "NOTICE");
  }, [occupancies]);

  // How many active occupants are missing an invoice for currentPeriodStr
  const pendingAutoOccupants = useMemo(() => {
    const invoicedOccupancyIds = new Set(
      invoices
        .filter((inv) => inv.billingPeriod === currentPeriodStr && inv.status !== "CANCELLED")
        .map((inv) => inv.occupancyId)
        .filter(Boolean)
    );
    return eligibleActiveOccupancies.filter((o) => !invoicedOccupancyIds.has(o.id));
  }, [invoices, eligibleActiveOccupancies, currentPeriodStr]);

  const pendingAutoCount = pendingAutoOccupants.length;

  const estimatedAutoRent = useMemo(() => {
    return pendingAutoOccupants.reduce((sum, o) => {
      const rent =
        (Number(o.monthlyRent) > 0 ? Number(o.monthlyRent) : 0) ||
        (Number(o.bed?.rentAmount) > 0 ? Number(o.bed.rentAmount) : 0) ||
        (Number(o.unit?.rentAmount) > 0 ? Number(o.unit.rentAmount) : 0) ||
        (Number(o.rentAmount) > 0 ? Number(o.rentAmount) : 0);
      return sum + rent;
    }, 0);
  }, [pendingAutoOccupants]);

  // 1. CONFIRMATION MODE: Prompt pop-up when pending invoices exist
  useEffect(() => {
    if (
      autoConfig.mode === "CONFIRMATION" &&
      pendingAutoCount > 0 &&
      autoConfig.lastAutoPeriod !== currentPeriodStr &&
      !initialGenerateOpen
    ) {
      const dismissKey = `auto_confirm_dismissed_${currentPeriodStr}`;
      if (!sessionStorage.getItem(dismissKey)) {
        setConfirmModalOpen(true);
      }
    }
  }, [autoConfig.mode, pendingAutoCount, autoConfig.lastAutoPeriod, currentPeriodStr, initialGenerateOpen]);

  // 2. FULL AUTO MODE: Generate automatically without asking for permission
  useEffect(() => {
    if (
      autoConfig.mode === "FULL_AUTO" &&
      pendingAutoCount > 0 &&
      autoConfig.lastAutoPeriod !== currentPeriodStr
    ) {
      const runKey = `full_auto_run_${currentPeriodStr}`;
      if (!sessionStorage.getItem(runKey)) {
        sessionStorage.setItem(runKey, "true");
        (async () => {
          try {
            setAutoGenerating(true);
            const dueDay = autoConfig.dueDay || society?.dueDay || 10;
            const formattedDueDate = `${currentPeriodStr}-${String(dueDay).padStart(2, "0")}`;
            const res = await api.post("/api/billing/invoices/generate", {
              billingPeriod: currentPeriodStr,
              dueDate: formattedDueDate,
              previousDue: autoConfig.previousDue ?? true,
              penaltyPercent: Number(autoConfig.penaltyPercent) || 0,
              skipVacant: autoConfig.skipVacant ?? true,
            });

            await api.post("/api/billing/auto-generate", {
              ...autoConfig,
              lastAutoPeriod: currentPeriodStr,
            });

            setAutoConfig((prev) => ({ ...prev, lastAutoPeriod: currentPeriodStr }));
            setAutoSuccessBanner(
              `⚡ Full Auto: ${res.createdCount} invoices were automatically generated for ${formatPeriod(currentPeriodStr)} without requiring permission (Due: ${formatDate(formattedDueDate)}).`
            );
            router.refresh();
          } catch (err) {
            console.error("Full auto invoice generation error:", err);
          } finally {
            setAutoGenerating(false);
          }
        })();
      }
    }
  }, [autoConfig, pendingAutoCount, currentPeriodStr, society?.dueDay, router]);

  // Handler for 1-click "Allow & Generate" in Confirmation modal
  async function handleAllowGenerate() {
    setAutoGenerating(true);
    try {
      const dueDay = autoConfig.dueDay || society?.dueDay || 10;
      const formattedDueDate = `${currentPeriodStr}-${String(dueDay).padStart(2, "0")}`;
      const res = await api.post("/api/billing/invoices/generate", {
        billingPeriod: currentPeriodStr,
        dueDate: formattedDueDate,
        previousDue: autoConfig.previousDue ?? true,
        penaltyPercent: Number(autoConfig.penaltyPercent) || 0,
        skipVacant: autoConfig.skipVacant ?? true,
      });

      await api.post("/api/billing/auto-generate", {
        ...autoConfig,
        lastAutoPeriod: currentPeriodStr,
      });

      setAutoConfig((prev) => ({ ...prev, lastAutoPeriod: currentPeriodStr }));
      setConfirmModalOpen(false);
      setAutoSuccessBanner(
        `Created ${res.createdCount} invoices totaling ${formatMoney(res.totalAmount)} for ${formatPeriod(res.billingPeriod)}. Web push & WhatsApp links dispatched.`
      );
      router.refresh();
    } catch (err) {
      alert("Error generating invoices: " + err.message);
    } finally {
      setAutoGenerating(false);
    }
  }

  // Handler to update and persist auto configuration
  async function handleSaveAutoConfig(newConfig) {
    try {
      const res = await api.post("/api/billing/auto-generate", newConfig);
      setAutoConfig(res.config || newConfig);
      setAutoSettingsOpen(false);
    } catch (err) {
      alert("Failed to save automation settings: " + err.message);
    }
  }

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

  // Reset page when search or status filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, selectedStatusTab, selectedFloor]);

  const totalItems = visible.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedInvoices = useMemo(() => {
    return visible.slice(startIndex, startIndex + pageSize);
  }, [visible, startIndex, pageSize]);

  // Bulk selection toggles (select current page)
  const isAllSelected =
    paginatedInvoices.length > 0 && paginatedInvoices.every((i) => selectedIds.has(i.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const next = new Set(selectedIds);
      paginatedInvoices.forEach((i) => next.delete(i.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      paginatedInvoices.forEach((i) => next.add(i.id));
      setSelectedIds(next);
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

  const totalOverdue = useMemo(() => {
    return overdueInvoicesList.reduce((sum, i) => sum + (i.outstanding || 0), 0);
  }, [overdueInvoicesList]);

  const pendingAmount = Math.max(0, (summary.outstanding || 0) - totalOverdue);
  const collectionRate =
    summary.billed > 0 ? Math.min(100, Math.round((summary.collected / summary.billed) * 100)) : 0;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title="Invoices"
        description="One invoice per occupied room/bed, per billing period."
        meta={
          <span className="text-[11px] font-semibold text-neutral-500">
            {totalItems} {totalItems === 1 ? "invoice" : "invoices"}
            {totalPages > 1 ? ` · Page ${safePage} of ${totalPages}` : ""}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Auto-Billing Status Pill */}
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setAutoSettingsOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60 transition-all cursor-pointer"
                title="Click to change Invoice Automation Settings"
              >
                {autoConfig.mode === "FULL_AUTO" ? (
                  <>
                    <Zap className="size-3.5 text-slate-700" />
                    <span className="font-semibold text-slate-900">Auto: Full Auto</span>
                  </>
                ) : autoConfig.mode === "CONFIRMATION" ? (
                  <>
                    <BellRing className="size-3.5 text-slate-700" />
                    <span className="font-semibold text-slate-900">Auto with Confirmation</span>
                  </>
                ) : (
                  <>
                    <Clock className="size-3.5 text-slate-500" />
                    <span>Auto-Billing: Off</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setInfoModalOpen(true)}
                className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors ml-0.5 cursor-pointer"
                title="How invoice automation works"
              >
                <Info className="size-3.5" />
              </button>
            </div>

            <Button onClick={() => setGenerateOpen(true)}>
              <FilePlus2 className="size-4" />
              Generate invoices
            </Button>
          </div>
        }
      />

      {autoSuccessBanner && (
        <SuccessBanner
          title="Invoices Generated Successfully"
          icon={CheckCircle2}
          onDismiss={() => setAutoSuccessBanner(null)}
        >
          {autoSuccessBanner}
        </SuccessBanner>
      )}

      {/* Separate KPI Stat Boxes (Per Bedy Design System) */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        {/* Card 1: Total Billed */}
        <button
          type="button"
          onClick={() => {
            setSelectedStatusTab("ALL");
            setSelectedFloor("");
          }}
          className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-4 sm:p-5 text-left transition-all shadow-2xs hover:border-brand-300 hover:shadow-xs cursor-pointer ${
            selectedStatusTab === "ALL" && !selectedFloor
              ? "border-neutral-300 ring-1 ring-neutral-300/50"
              : "border-neutral-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Total Billed
            </span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
              <FileText className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-neutral-900">
            {formatMoney(summary.billed)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-neutral-500">
            <span>{invoices.length} invoices generated</span>
            <span className="text-[11px] text-neutral-400 group-hover:text-brand-600 transition-colors">
              {selectedStatusTab === "ALL" ? "All shown" : "Reset →"}
            </span>
          </div>
        </button>

        {/* Card 2: Collected (Paid) */}
        <button
          type="button"
          onClick={() => setSelectedStatusTab((prev) => (prev === "PAID" ? "ALL" : "PAID"))}
          className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 text-left transition-all shadow-2xs cursor-pointer ${
            selectedStatusTab === "PAID"
              ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs"
              : "border-neutral-200 bg-white hover:border-emerald-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Collected Rent
            </span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/20">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-emerald-600">
            {formatMoney(summary.collected)}
          </p>
          <div>
            <div className="mt-2 flex items-center justify-between text-xs font-medium text-emerald-700">
              <span>{statusCounts.PAID} paid ({collectionRate}%)</span>
              <span className="text-[11px] font-bold text-emerald-600">
                {selectedStatusTab === "PAID" ? "Active filter" : "Filter →"}
              </span>
            </div>
            {/* Mini progress line */}
            <div className="mt-2.5 h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${collectionRate}%` }}
              />
            </div>
          </div>
        </button>

        {/* Card 3: Pending Dues */}
        <button
          type="button"
          onClick={() => setSelectedStatusTab((prev) => (prev === "PENDING" ? "ALL" : "PENDING"))}
          className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 text-left transition-all shadow-2xs cursor-pointer ${
            selectedStatusTab === "PENDING"
              ? "border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20 shadow-xs"
              : "border-neutral-200 bg-white hover:border-amber-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Pending Dues
            </span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-600/20">
              <Clock className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-amber-700">
            {formatMoney(pendingAmount)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-amber-700">
            <span>{statusCounts.PENDING} awaiting payment</span>
            <span className="text-[11px] font-bold text-amber-700">
              {selectedStatusTab === "PENDING" ? "Active filter" : "Filter →"}
            </span>
          </div>
        </button>

        {/* Card 4: Overdue Rent (MAIN MOTIVE / PRIORITY) */}
        <button
          type="button"
          onClick={() => setSelectedStatusTab((prev) => (prev === "OVERDUE" ? "ALL" : "OVERDUE"))}
          className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 text-left transition-all shadow-2xs cursor-pointer ${
            selectedStatusTab === "OVERDUE"
              ? "border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20 shadow-xs"
              : "border-neutral-200 bg-white hover:border-rose-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              Overdue Rent
            </span>
            <span
              className={`flex size-8 items-center justify-center rounded-xl ${
                totalOverdue > 0
                  ? "bg-rose-50 text-rose-600 ring-1 ring-rose-600/20"
                  : "bg-neutral-100 text-neutral-500"
              }`}
            >
              <AlertTriangle className="size-4" />
            </span>
          </div>
          <p
            className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
              totalOverdue > 0 ? "text-rose-600" : "text-neutral-900"
            }`}
          >
            {formatMoney(totalOverdue)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-rose-700">
            <span>
              {statusCounts.OVERDUE > 0
                ? `${statusCounts.OVERDUE} invoices past due`
                : "Zero overdue rent"}
            </span>
            <span className="text-[11px] font-bold text-rose-600">
              {selectedStatusTab === "OVERDUE" ? "Active filter" : "Filter →"}
            </span>
          </div>
        </button>
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
            <DropdownSelect
              size="sm"
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              aria-label="Filter by floor"
              className="w-32"
            >
              <option value="">All Floors</option>
              {floors.map((f) => (
                <option key={f} value={f}>
                  Floor {f}
                </option>
              ))}
            </DropdownSelect>
          )}

          {periods.length > 0 && (
            <DropdownSelect
              size="sm"
              value={filters.period ?? ""}
              onChange={(e) => {
                const params = new URLSearchParams(window.location.search);
                if (e.target.value) params.set("period", e.target.value);
                else params.delete("period");
                router.push(`/admin/billing/invoices?${params.toString()}`, { scroll: false });
              }}
              aria-label="Filter by period"
              className="w-36"
            >
              <option value="">All periods</option>
              {periods.map((p) => (
                <option key={p} value={p}>
                  {formatPeriod(p)}
                </option>
              ))}
            </DropdownSelect>
          )}
        </div>
      </div>

      {/* Surface: Search Input, Bulk Selection Bar, Table */}
      <div className="surface overflow-hidden border border-[#E5EAF3] rounded-2xl shadow-2xs bg-white">
        {/* Search header with shortcut indicator */}
        <div className="border-b border-slate-100 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tenant, room, invoice..."
              aria-label="Search tenant, room, invoice"
              className="w-full h-9.5 pl-9 pr-8 text-xs sm:text-[13px] rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 text-slate-900 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15 focus:outline-none shadow-2xs transition-all"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-block text-[10px] bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-slate-400 font-sans pointer-events-none">
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
              <WhatsAppIcon className="size-3.5" />
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
                <WhatsAppIcon className="size-3.5" />
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
                <FilePlus2 className="size-4" />
                Generate invoices
              </Button>
            }
          />
        ) : (
          <>
            {/* Mobile Cards (Collapsed Stacked Lines) */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {paginatedInvoices.map((inv) => {
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
                        {inv.dueDate && (
                          <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">
                            · Due {formatDate(inv.dueDate)}
                          </span>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {inv.status === "PAID" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            Paid
                          </span>
                        ) : inv.outstanding > 0 ? (
                          <>
                            <WhatsAppReminderButton invoice={inv} size="xs" />
                            <Button
                              size="xs"
                              variant="secondary"
                              onClick={() => setPayFor(inv)}
                              className="!text-xs !py-1 !px-2 font-bold"
                              title="Add payment"
                            >
                              <Plus className="size-3" />
                              Add
                            </Button>
                          </>
                        ) : null}
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

                    {/* Period (No wrap) */}
                    <th className="py-3 px-3 hidden md:table-cell whitespace-nowrap min-w-[90px]">
                      Period
                    </th>

                    {/* Due Date & Relative */}
                    <th className="py-3 px-3 whitespace-nowrap min-w-[110px]">
                      Due Date
                    </th>

                    {/* Money columns: Right aligned, tabular-nums */}
                    <th className="py-3 px-3 text-right font-semibold min-w-[90px]">
                      Total
                    </th>
                    <th className="py-3 px-3 text-right font-semibold min-w-[95px]">
                      Paid
                    </th>
                    <th className="py-3 px-3 text-right font-semibold min-w-[100px]">
                      Outstanding
                    </th>

                    {/* Action (Sticky Right) */}
                    <th className="py-3 pr-4 pl-3 text-right sticky right-0 z-20 bg-neutral-50 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)] min-w-[140px]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100">
                  {paginatedInvoices.map((inv) => {
                    const isSelected = selectedIds.has(inv.id);

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

                        {/* Period (No wrap) */}
                        <td className="py-2.5 px-3 hidden md:table-cell whitespace-nowrap text-xs text-slate-600">
                          {formatPeriod(inv.billingPeriod)}
                        </td>

                        {/* Due Date */}
                        <td className="py-2.5 px-3 whitespace-nowrap text-xs text-slate-700 font-medium">
                          {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                        </td>

                        {/* Total */}
                        <td className="py-2.5 px-3 text-right tabular-nums text-xs font-semibold text-neutral-800 whitespace-nowrap">
                          {formatMoney(inv.totalAmount)}
                        </td>

                        {/* Paid (Prominent check mark when paid, clean dash when zero) */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {inv.status === "PAID" || (inv.paidAmount > 0 && inv.outstanding === 0) ? (
                            <span className="inline-flex items-center gap-1 font-extrabold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full ring-1 ring-emerald-600/20 tabular-nums">
                              <Check className="size-3 text-emerald-600 stroke-[3]" />
                              {formatMoney(inv.paidAmount || inv.totalAmount)}
                            </span>
                          ) : inv.paidAmount > 0 ? (
                            <div className="inline-flex flex-col items-end">
                              <span className="font-extrabold text-xs text-neutral-900 tabular-nums">
                                {formatMoney(inv.paidAmount)}
                              </span>
                              <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded">
                                Partial
                              </span>
                            </div>
                          ) : (
                            <span className="text-neutral-400 font-bold text-xs tabular-nums">—</span>
                          )}
                        </td>

                        {/* Outstanding */}
                        <td className="py-2.5 px-3 text-right tabular-nums text-xs whitespace-nowrap">
                          {inv.outstanding > 0 ? (
                            <span
                              className={`font-extrabold ${
                                inv.status === "OVERDUE" ? "text-rose-600" : "text-amber-600"
                              }`}
                            >
                              {formatMoney(inv.outstanding)}
                            </span>
                          ) : (
                            <span className="text-neutral-400 font-bold text-xs tabular-nums">—</span>
                          )}
                        </td>

                        {/* Sticky Action Column */}
                        <td
                          className="py-2.5 pr-4 pl-3 text-right sticky right-0 z-10 bg-white group-hover:bg-neutral-50/70 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.06)] whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {inv.status === "PAID" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <CheckCircle2 className="size-3 text-emerald-600" />
                                Paid
                              </span>
                            ) : inv.outstanding > 0 ? (
                              <>
                                <WhatsAppReminderButton invoice={inv} size="xs" />
                                <Button
                                  size="xs"
                                  variant="secondary"
                                  onClick={() => setPayFor(inv)}
                                  className="!text-xs !py-1 !px-2.5 font-bold"
                                  title="Add payment"
                                >
                                  <Plus className="size-3" />
                                  Add
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modern Pagination UI */}
            {visible.length > 0 && (
              <Pagination
                page={safePage}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={(newPage) => setPage(newPage)}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
                pageSizeOptions={[10, 20, 50, 100]}
                itemName="invoices"
              />
            )}
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
        autoConfig={autoConfig}
        onUpdateAutoConfig={handleSaveAutoConfig}
        onOpenInfoModal={() => setInfoModalOpen(true)}
      />

      {/* Auto-Billing Explainer Modal */}
      <AutoBillingInfoModal
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />

      {/* Auto with Confirmation Prompt Pop-up */}
      <AutoGenerateConfirmationModal
        open={confirmModalOpen}
        onClose={() => {
          sessionStorage.setItem(`auto_confirm_dismissed_${currentPeriodStr}`, "true");
          setConfirmModalOpen(false);
        }}
        currentPeriod={currentPeriodStr}
        pendingCount={pendingAutoCount}
        estimatedTotal={estimatedAutoRent}
        dueDay={autoConfig.dueDay || society?.dueDay || 10}
        societyName={society?.name || "Bedy PG"}
        onAllowGenerate={handleAllowGenerate}
        onReviewManually={() => {
          sessionStorage.setItem(`auto_confirm_dismissed_${currentPeriodStr}`, "true");
          setConfirmModalOpen(false);
          setGenerateOpen(true);
        }}
        generating={autoGenerating}
      />

      {/* Auto Settings Modal */}
      <AutoSettingsModal
        open={autoSettingsOpen}
        onClose={() => setAutoSettingsOpen(false)}
        config={autoConfig}
        onSave={handleSaveAutoConfig}
        onOpenInfoModal={() => setInfoModalOpen(true)}
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
// ---------------------------------------------------------------------------
// Invoice Automation Modals: Explainer, Confirmation Prompt, Settings
// ---------------------------------------------------------------------------

function AutoBillingInfoModal({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="How Invoice Automation Works"
      description="Choose how monthly rent invoices are generated for your residents."
      size="lg"
      footer={<Button onClick={onClose}>Understood</Button>}
    >
      <div className="space-y-4">
        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Full Auto */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-800 border border-slate-200">
                  <Zap className="size-3 text-slate-700" />
                  Full Auto
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Zero Permission
                </span>
              </div>
              <h4 className="mt-2.5 text-sm font-bold text-slate-900">
                Auto-Generate on 1st of Every Month
              </h4>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Invoices are created automatically on the 1st of each month without asking for any manual approval or permission.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="size-3.5 text-slate-600 shrink-0 mt-0.5" />
                  <span>100% hands-free monthly invoice generation.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="size-3.5 text-slate-600 shrink-0 mt-0.5" />
                  <span>Due date automatically set to your chosen recurring due day.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="size-3.5 text-slate-600 shrink-0 mt-0.5" />
                  <span>Automated WhatsApp & Web Push payment reminders dispatched instantly.</span>
                </li>
              </ul>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              Best for: Landlords who want completely automatic billing every month.
            </div>
          </div>

          {/* Card 2: Auto with Confirmation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-800 border border-slate-200">
                  <BellRing className="size-3 text-slate-700" />
                  Auto with Confirmation
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Recommended
                </span>
              </div>
              <h4 className="mt-2.5 text-sm font-bold text-slate-900">
                1-Click Pop-up Confirmation
              </h4>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                When next month arrives, a clear confirmation pop-up asks: <em>"Allow invoice generation for this month?"</em>
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="size-3.5 text-slate-600 shrink-0 mt-0.5" />
                  <span>Shows resident count and estimated rent before generating.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="size-3.5 text-slate-600 shrink-0 mt-0.5" />
                  <span>Click <strong>"Allow & Generate"</strong> to create all invoices in 1 second.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="size-3.5 text-slate-600 shrink-0 mt-0.5" />
                  <span>Opportunity to add electricity readings or custom charges before generating.</span>
                </li>
              </ul>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              Best for: Landlords who want automatic preparation but retain final approval.
            </div>
          </div>
        </div>

        {/* Same Due Date Guarantee Box */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
            <Calendar className="size-4" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-slate-900">Customizable Due Date Guarantee</p>
            <p className="text-slate-600 mt-0.5">
              Across both modes, the due date is consistently locked to your property&apos;s chosen recurring due day so residents always have a predictable payment timeline.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AutoGenerateConfirmationModal({
  open,
  onClose,
  currentPeriod,
  pendingCount,
  estimatedTotal,
  dueDay = 10,
  societyName = "Bedy PG",
  onAllowGenerate,
  onReviewManually,
  generating = false,
}) {
  const formattedDueDate = `${currentPeriod}-${String(dueDay).padStart(2, "0")}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Monthly Invoices Ready to Generate"
      description={`Auto with Confirmation mode is active for ${societyName}.`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full gap-2">
          <Button variant="secondary" onClick={onClose} disabled={generating}>
            Remind Later
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onReviewManually} disabled={generating}>
              Review Details
            </Button>
            <Button onClick={onAllowGenerate} loading={generating}>
              <Sparkles className="size-4" />
              Allow & Generate ({pendingCount} Invoices)
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-3.5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white shrink-0 shadow-xs">
              <BellRing className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  Ready for {formatPeriod(currentPeriod)}
                </span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                  Confirmation Requested
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Your settings are configured to <strong>Auto with Confirmation</strong>. Invoices are prepared for all eligible active residents. Click <strong>Allow & Generate</strong> to create and dispatch them immediately.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-600">
            <span>Billing Period</span>
            <span className="font-semibold text-slate-900">{formatPeriod(currentPeriod)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Eligible Residents</span>
            <span className="font-semibold text-slate-900">{pendingCount} active staying</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Payment Due Date</span>
            <span className="font-semibold text-slate-900">
              {formatDate(formattedDueDate)} ({dueDay}{getOrdinal(dueDay)} of the month)
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-800">Estimated Total Rent</span>
            <span className="font-bold font-mono text-brand-700 text-sm">
              ~{formatMoney(estimatedTotal)}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function AutoSettingsModal({ open, onClose, config, onSave, onOpenInfoModal }) {
  const [mode, setMode] = useState(config?.mode || "CONFIRMATION");
  const [dueDay, setDueDay] = useState(config?.dueDay || 10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(config?.mode || "CONFIRMATION");
      setDueDay(config?.dueDay || 10);
    }
  }, [open, config]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        ...config,
        mode,
        dueDay: Number(dueDay) || 10,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Monthly Invoice Automation Settings"
      description="Configure how recurring rent invoices are generated each month."
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save Automation Settings
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Choose Automation Mode:</span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenInfoModal();
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 cursor-pointer"
          >
            <Info className="size-3.5" />
            (i) How both modes work
          </button>
        </div>

        <div className="space-y-2.5">
          {/* Card 1: Full Auto */}
          <button
            type="button"
            onClick={() => setMode("FULL_AUTO")}
            className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              mode === "FULL_AUTO"
                ? "border-2 border-brand-600 bg-brand-50/40 text-slate-900 ring-2 ring-brand-500/20 shadow-2xs"
                : "border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-800"
            }`}
          >
            <div className={`flex size-9 items-center justify-center rounded-lg shrink-0 mt-0.5 ${
              mode === "FULL_AUTO" ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"
            }`}>
              <Zap className="size-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">
                  Auto-Generate (Full Auto)
                </span>
                {mode === "FULL_AUTO" && (
                  <span className="flex size-4.5 items-center justify-center rounded-full bg-brand-600 text-white">
                    <Check className="size-3" />
                  </span>
                )}
              </div>
              <p className="text-xs mt-1 leading-relaxed text-slate-600">
                Generates invoices on the 1st of every month automatically without requiring any manual approval.
              </p>
              <span className={`inline-block mt-2 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                mode === "FULL_AUTO" ? "bg-brand-100 text-brand-800" : "bg-slate-100 text-slate-700"
              }`}>
                Zero Permission Needed · Consistent Due Date
              </span>
            </div>
          </button>

          {/* Card 2: Auto with Confirmation */}
          <button
            type="button"
            onClick={() => setMode("CONFIRMATION")}
            className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              mode === "CONFIRMATION"
                ? "border-2 border-brand-600 bg-brand-50/40 text-slate-900 ring-2 ring-brand-500/20 shadow-2xs"
                : "border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-800"
            }`}
          >
            <div className={`flex size-9 items-center justify-center rounded-lg shrink-0 mt-0.5 ${
              mode === "CONFIRMATION" ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"
            }`}>
              <BellRing className="size-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">
                  Auto with Confirmation (Recommended)
                </span>
                {mode === "CONFIRMATION" && (
                  <span className="flex size-4.5 items-center justify-center rounded-full bg-brand-600 text-white">
                    <Check className="size-3" />
                  </span>
                )}
              </div>
              <p className="text-xs mt-1 leading-relaxed text-slate-600">
                Shows a 1-click confirmation pop-up on the 1st of every month. If you allow, invoices are generated instantly.
              </p>
              <span className={`inline-block mt-2 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                mode === "CONFIRMATION" ? "bg-brand-100 text-brand-800" : "bg-slate-100 text-slate-700"
              }`}>
                Ask First with 1-Click Allow · Consistent Due Date
              </span>
            </div>
          </button>

          {/* Card 3: Manual */}
          <button
            type="button"
            onClick={() => setMode("MANUAL")}
            className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              mode === "MANUAL"
                ? "border-2 border-slate-700 bg-slate-50 text-slate-900 ring-2 ring-slate-400/20 shadow-2xs"
                : "border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-800"
            }`}
          >
            <div className={`flex size-9 items-center justify-center rounded-lg shrink-0 mt-0.5 ${
              mode === "MANUAL" ? "bg-slate-200 text-slate-800" : "bg-slate-100 text-slate-600"
            }`}>
              <Clock className="size-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">
                  Manual Generation Only
                </span>
                {mode === "MANUAL" && (
                  <span className="flex size-4.5 items-center justify-center rounded-full bg-slate-700 text-white">
                    <Check className="size-3" />
                  </span>
                )}
              </div>
              <p className="text-xs mt-1 leading-relaxed text-slate-600">
                No automatic generation or prompts. Invoices are generated only when you click "Generate invoices".
              </p>
            </div>
          </button>
        </div>

        {/* Same Due Date Setting */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <label htmlFor="autoDueDay" className="text-xs font-bold text-slate-800 block mb-1">
            Monthly Due Date (Defaults to 10th of every month)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">Day</span>
            <input
              id="autoDueDay"
              type="number"
              min="1"
              max="28"
              value={dueDay}
              onChange={(e) => setDueDay(Number(e.target.value) || 10)}
              className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-900 text-center"
            />
            <span className="text-xs text-slate-600">of every month</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Both automated modes lock the payment due date to this day every month.
          </p>
        </div>
      </div>
    </Modal>
  );
}

// GenerateModal with Step 1: Config, Step 2: Preview & Confirm
// ---------------------------------------------------------------------------

function GenerateModal({
  open,
  onClose,
  units = [],
  occupancies = [],
  autoConfig = null,
  onUpdateAutoConfig = null,
  onOpenInfoModal = null,
}) {
  const router = useRouter();
  const [step, setStep] = useState("CONFIG"); // "CONFIG" | "PREVIEW"

  const defaultDueDay = autoConfig?.dueDay || 10;
  const initialPeriod = currentPeriod();
  const initialDueDate = `${initialPeriod}-${String(defaultDueDay).padStart(2, "0")}`;

  const [form, setForm] = useState({
    billingPeriod: initialPeriod,
    dueDate: initialDueDate,
    previousDue: autoConfig?.previousDue ?? true,
    penaltyPercent: autoConfig?.penaltyPercent ?? 2,
    skipVacant: autoConfig?.skipVacant ?? true,
  });

  const [selectedAutoMode, setSelectedAutoMode] = useState(autoConfig?.mode || "CONFIRMATION");
  const [selectedDueDay, setSelectedDueDay] = useState(autoConfig?.dueDay || 10);
  const [modalInfoOpen, setModalInfoOpen] = useState(false);
  const [showAutoOptions, setShowAutoOptions] = useState(false);

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

  // Available billing period options: 5 months before to 20 months in the future
  const periodOptions = useMemo(() => {
    const list = [];
    const now = new Date();
    const currentY = now.getFullYear();
    const currentM = now.getMonth();

    // From -5 months (before 5) to +20 months (next 20)
    for (let offset = -5; offset <= 20; offset++) {
      const d = new Date(currentY, currentM + offset, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const val = `${yyyy}-${mm}`;
      const label = d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      list.push({
        value: val,
        label,
        isCurrent: offset === 0,
      });
    }

    if (form.billingPeriod && !list.some((p) => p.value === form.billingPeriod)) {
      const [y, m] = form.billingPeriod.split("-");
      const d = new Date(Number(y), Number(m) - 1, 1);
      const label = !isNaN(d.getTime())
        ? d.toLocaleDateString("en-IN", { month: "short", year: "numeric" })
        : form.billingPeriod;
      list.unshift({ value: form.billingPeriod, label, isCurrent: false });
    }

    return list;
  }, [form.billingPeriod]);

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

  // Base rent calculation: check monthlyRent -> bed.rentAmount -> unit.rentAmount -> o.rentAmount
  const estimatedBaseRent = useMemo(() => {
    return eligibleOccupancies.reduce((sum, o) => {
      const rent =
        (Number(o.monthlyRent) > 0 ? Number(o.monthlyRent) : 0) ||
        (Number(o.bed?.rentAmount) > 0 ? Number(o.bed.rentAmount) : 0) ||
        (Number(o.unit?.rentAmount) > 0 ? Number(o.unit.rentAmount) : 0) ||
        (Number(o.rentAmount) > 0 ? Number(o.rentAmount) : 0);
      return sum + rent;
    }, 0);
  }, [eligibleOccupancies]);

  // Carried forward unpaid balances from previous invoices
  const estimatedPreviousDue = useMemo(() => {
    if (!form.previousDue) return 0;
    let total = 0;
    for (const o of eligibleOccupancies) {
      if (Array.isArray(o.invoices)) {
        for (const inv of o.invoices) {
          if (inv.billingPeriod === form.billingPeriod) continue;
          const open = Math.max(0, (Number(inv.totalAmount) || 0) - (Number(inv.paidAmount) || 0));
          if (open > 0) {
            total += open;
            if (Number(form.penaltyPercent) > 0) {
              total += Math.round(open * (Number(form.penaltyPercent) / 100));
            }
          }
        }
      }
    }
    return total;
  }, [eligibleOccupancies, form.previousDue, form.penaltyPercent, form.billingPeriod]);

  // Extra charges calculation
  const estimatedExtra = useMemo(() => {
    return extraChargesList.reduce((sum, c) => {
      const amt = Number(c.amount) || 0;
      if (c.targetType === "ALL" || !c.targetType) return sum + amt * (estimatedCount || 1);
      return sum + amt;
    }, 0);
  }, [extraChargesList, estimatedCount]);

  // Estimated electricity calculation
  const estimatedElectricity = useMemo(() => {
    if (!showElectricity || !electricityConfig) return 0;
    if (electricityConfig.mode === "COMMON") {
      if (Number(electricityConfig.commonPerPerson) > 0) {
        return Math.round(Number(electricityConfig.commonPerPerson) * (estimatedCount || 1));
      }
      if (Number(electricityConfig.commonTotal) > 0) {
        return Math.round(Number(electricityConfig.commonTotal));
      }
      if (Number(electricityConfig.commonUnits) > 0) {
        return Math.round(Number(electricityConfig.commonUnits) * (Number(electricityConfig.commonRatePerUnit) || 10));
      }
    }
    if (electricityConfig.mode === "ROOM_WISE" && Array.isArray(electricityConfig.rooms)) {
      return electricityConfig.rooms.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    }
    if (electricityConfig.mode === "INDIVIDUAL" && Array.isArray(electricityConfig.individuals)) {
      return electricityConfig.individuals.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    }
    return 0;
  }, [showElectricity, electricityConfig, estimatedCount]);

  const estimatedTotal = estimatedBaseRent + estimatedPreviousDue + estimatedExtra + estimatedElectricity;

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

      // Persist auto-generate preference
      if (selectedAutoMode && onUpdateAutoConfig) {
        const customDay = form.dueDate ? Number(form.dueDate.split("-")[2]) : selectedDueDay;
        onUpdateAutoConfig({
          ...autoConfig,
          mode: selectedAutoMode,
          dueDay: Number(customDay) || selectedDueDay || 10,
        });
      }

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
              <div className="flex size-9 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-700 shrink-0">
                <CheckCircle2 className="size-4.5 text-brand-600" />
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
              <span>Estimated base rent ({estimatedCount} resident{estimatedCount === 1 ? "" : "s"})</span>
              <span className="font-semibold font-mono text-slate-900">{formatMoney(estimatedBaseRent)}</span>
            </div>
            {form.previousDue && (
              <div className="flex justify-between text-slate-600">
                <span>Carried forward unpaid dues</span>
                <span className={`font-semibold font-mono ${estimatedPreviousDue > 0 ? "text-amber-700 font-bold" : "text-slate-900"}`}>
                  {estimatedPreviousDue > 0 ? `+${formatMoney(estimatedPreviousDue)}` : "₹0 (All clear)"}
                </span>
              </div>
            )}
            {extraChargesList.length > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Extra charges ({extraChargesList.length})</span>
                <span className="font-semibold font-mono text-slate-900">+{formatMoney(estimatedExtra)}</span>
              </div>
            )}
            {showElectricity && (
              <div className="flex justify-between text-slate-600">
                <span>Estimated electricity</span>
                <span className="font-semibold font-mono text-slate-900">
                  {estimatedElectricity > 0 ? `+${formatMoney(estimatedElectricity)}` : "Enabled (included)"}
                </span>
              </div>
            )}
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

          {/* Compact Setting Row for Auto-Billing */}
          <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-2.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex size-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 shrink-0">
                  <Zap className="size-3.5" />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap min-w-0 text-xs">
                  <span className="font-semibold text-slate-800">Auto-billing:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white border border-slate-200 text-slate-700">
                    {selectedAutoMode === "FULL_AUTO"
                      ? `Full Auto (Due ${selectedDueDay}${getOrdinal(selectedDueDay)})`
                      : selectedAutoMode === "CONFIRMATION"
                      ? `Auto with Confirmation (Due ${selectedDueDay}${getOrdinal(selectedDueDay)})`
                      : "Off (Manual)"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenInfoModal) onOpenInfoModal();
                      else setModalInfoOpen(true);
                    }}
                    className="inline-flex items-center text-slate-400 hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
                    title="How auto-billing works"
                  >
                    <Info className="size-3.5" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAutoOptions((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer shrink-0"
              >
                <SlidersHorizontal className="size-3 text-slate-500" />
                <span>{showAutoOptions ? "Hide" : "Settings"}</span>
                <ChevronDown className={`size-3 text-slate-400 transition-transform ${showAutoOptions ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Revealed options only after clicking Settings */}
            {showAutoOptions && (
              <div className="pt-2.5 border-t border-slate-200/80 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Option 1: Full Auto */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAutoMode("FULL_AUTO");
                      onUpdateAutoConfig?.({ ...autoConfig, mode: "FULL_AUTO", dueDay: selectedDueDay });
                    }}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedAutoMode === "FULL_AUTO"
                        ? "border-2 border-brand-600 bg-brand-50/40 text-slate-900 ring-2 ring-brand-500/20 shadow-2xs"
                        : "border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-800"
                    }`}
                  >
                    <div className={`flex size-7 items-center justify-center rounded-lg shrink-0 mt-0.5 ${
                      selectedAutoMode === "FULL_AUTO" ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"
                    }`}>
                      <Zap className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          Auto-Generate (Full Auto)
                        </span>
                        {selectedAutoMode === "FULL_AUTO" && (
                          <span className="flex size-4 items-center justify-center rounded-full bg-brand-600 text-white">
                            <Check className="size-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] mt-0.5 leading-tight text-slate-600">
                        Generates on the 1st of every month without asking.
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-brand-800">
                        <span>Zero permission</span>
                        <span>Due: {selectedDueDay}{getOrdinal(selectedDueDay)} of month</span>
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Auto with Confirmation */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAutoMode("CONFIRMATION");
                      onUpdateAutoConfig?.({ ...autoConfig, mode: "CONFIRMATION", dueDay: selectedDueDay });
                    }}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedAutoMode === "CONFIRMATION"
                        ? "border-2 border-brand-600 bg-brand-50/40 text-slate-900 ring-2 ring-brand-500/20 shadow-2xs"
                        : "border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-800"
                    }`}
                  >
                    <div className={`flex size-7 items-center justify-center rounded-lg shrink-0 mt-0.5 ${
                      selectedAutoMode === "CONFIRMATION" ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600"
                    }`}>
                      <BellRing className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          Auto with Confirmation
                        </span>
                        {selectedAutoMode === "CONFIRMATION" && (
                          <span className="flex size-4 items-center justify-center rounded-full bg-brand-600 text-white">
                            <Check className="size-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] mt-0.5 leading-tight text-slate-600">
                        Shows 1-click confirmation pop-up on the 1st to allow.
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-brand-800">
                        <span>Ask before generating</span>
                        <span>Due: {selectedDueDay}{getOrdinal(selectedDueDay)} of month</span>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-brand-600 shrink-0" />
                    <label htmlFor="recurringDueDaySelect" className="text-xs font-semibold text-slate-700">
                      Recurring Due Day:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <select
                        id="recurringDueDaySelect"
                        value={selectedDueDay}
                        onChange={(e) => {
                          const day = Number(e.target.value) || 10;
                          setSelectedDueDay(day);
                          if (form.billingPeriod) {
                            setForm((prev) => ({
                              ...prev,
                              dueDate: `${prev.billingPeriod}-${String(day).padStart(2, "0")}`,
                            }));
                          }
                          onUpdateAutoConfig?.({ ...autoConfig, dueDay: day, mode: selectedAutoMode });
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-900 shadow-2xs hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            {d}{getOrdinal(d)} of every month
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedAutoMode !== "MANUAL" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAutoMode("MANUAL");
                        onUpdateAutoConfig?.({ ...autoConfig, mode: "MANUAL" });
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Turn off auto-billing
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              id="billingPeriod"
              label="Billing period"
              value={form.billingPeriod}
              onChange={(e) => {
                const newPeriod = e.target.value;
                const dueDay = selectedDueDay || autoConfig?.dueDay || 10;
                const newDueDate =
                  newPeriod && newPeriod.length === 7
                    ? `${newPeriod}-${String(dueDay).padStart(2, "0")}`
                    : form.dueDate;
                setForm((prev) => ({
                  ...prev,
                  billingPeriod: newPeriod,
                  dueDate: newDueDate,
                }));
              }}
              error={errors.billingPeriod}
              required
            >
              {periodOptions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}{p.isCurrent ? " (Current)" : ""}
                </option>
              ))}
            </Select>
            <Input
              id="dueDate"
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={(e) => {
                const val = e.target.value;
                setForm((prev) => ({ ...prev, dueDate: val }));
                if (val && val.includes("-")) {
                  const parts = val.split("-");
                  if (parts[2]) {
                    const day = Number(parts[2]);
                    if (day >= 1 && day <= 31) {
                      setSelectedDueDay(day);
                      onUpdateAutoConfig?.({ ...autoConfig, dueDay: day, mode: selectedAutoMode });
                    }
                  }
                }
              }}
              error={errors.dueDate}
              hint={`Defaults to ${selectedDueDay}${getOrdinal(selectedDueDay)} of month`}
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
              label="Skip vacant rooms / beds"
            />
          </div>

    {modalInfoOpen && (
            <AutoBillingInfoModal
              open={modalInfoOpen}
              onClose={() => setModalInfoOpen(false)}
            />
          )}

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
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 shadow-2xs">
                  <Receipt className="size-4 text-slate-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Add Extra Charges</span>
                    <span className="rounded-full bg-slate-100 border border-slate-200/70 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
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
                        className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold border border-slate-200 text-xs transition-colors cursor-pointer"
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
                            <DropdownSelect
                              size="sm"
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
                            </DropdownSelect>
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
                            <DropdownSelect
                              size="sm"
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
                            </DropdownSelect>
                          </div>
                        )}

                        {charge.targetType === "INDIVIDUAL" && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 shrink-0">Select Resident:</span>
                            <DropdownSelect
                              size="sm"
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
                            </DropdownSelect>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-600">
            <Info className="size-4 text-slate-400 shrink-0" />
            <span>Rooms and beds already invoiced for this period will automatically be skipped.</span>
          </div>
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
      title={receipt ? "Payment recorded" : "Add payment"}
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
              Add payment
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
