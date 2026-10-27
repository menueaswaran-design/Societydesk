"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  Receipt,
  Wallet,
  AlertOctagon,
  Info,
  Zap,
  Utensils,
  Wrench,
  Sparkles,
  Droplets,
  Home,
} from "lucide-react";
import Table, { Tr, Td, RowActions } from "@/components/ui/Table";
import StatusBadge from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/Feedback";
import { CardNote } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import { FilterChips } from "@/components/ui/FilterPills";
import Button, { IconButton } from "@/components/ui/Button";
import PayCheckoutButton from "@/components/billing/PayCheckoutButton";
import { openDocument } from "@/lib/client/api";
import { formatDate, formatMoney, formatPeriod, titleCase } from "@/lib/format";

function getItemBadge(type) {
  switch (type?.toUpperCase()) {
    case "ELECTRICITY":
      return {
        label: "Electricity",
        icon: Zap,
        emoji: "⚡",
        bg: "bg-amber-50 text-amber-800 border-amber-200",
      };
    case "FOOD":
      return {
        label: "Food / Mess",
        icon: Utensils,
        emoji: "🍽️",
        bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    case "MAINTENANCE":
      return {
        label: "Maintenance",
        icon: Wrench,
        emoji: "🔧",
        bg: "bg-sky-50 text-sky-800 border-sky-200",
      };
    case "LAUNDRY":
      return {
        label: "Laundry",
        icon: Sparkles,
        emoji: "🧺",
        bg: "bg-purple-50 text-purple-800 border-purple-200",
      };
    case "WATER":
      return {
        label: "Water",
        icon: Droplets,
        emoji: "💧",
        bg: "bg-blue-50 text-blue-800 border-blue-200",
      };
    case "RENT":
      return {
        label: "Room Rent",
        icon: Home,
        emoji: "🏠",
        bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
      };
    default:
      return {
        label: "Other",
        icon: Receipt,
        emoji: "📋",
        bg: "bg-slate-50 text-slate-700 border-slate-200",
      };
  }
}

const DUE_FILTERS = [
  { value: "ALL", label: "All invoices" },
  { value: "DUE", label: "With dues" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PAID", label: "Paid" },
];

export default function ResidentInvoicesClient({ invoices }) {
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter")?.toUpperCase();
  const [dueFilter, setDueFilter] = useState(
    initialFilter && ["ALL", "DUE", "OVERDUE", "PAID"].includes(initialFilter)
      ? initialFilter
      : "ALL"
  );

  async function handleDownloadReceipt(url, invoiceId) {
    if (!url) return;
    setDownloadingId(invoiceId);
    try {
      await openDocument(url);
    } catch (err) {
      alert(err.message || "Failed to open receipt");
    } finally {
      setDownloadingId(null);
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (dueFilter === "DUE" && inv.outstanding <= 0) return false;
      if (dueFilter === "OVERDUE" && inv.status !== "OVERDUE") return false;
      if (dueFilter === "PAID" && inv.outstanding > 0) return false;
      if (!q) return true;
      return [
        inv.invoiceNumber,
        inv.billingPeriod,
        inv.flatLabel,
        inv.flat?.flatNumber,
        inv.flat?.block,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [invoices, query, dueFilter]);

  const billed = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const paid = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const outstanding = invoices.reduce((s, i) => s + i.outstanding, 0);
  const overdue = invoices.filter((i) => i.outstanding > 0 && i.status === "OVERDUE").length;

  const dueInvoices = useMemo(() => invoices.filter((i) => i.outstanding > 0), [invoices]);

  return (
    <div className="stack">
      <PageHeader
        title="Invoices & Payment Receipts"
        description="View your bills, pay pending rent securely online, and download official payment receipts."
        meta={
          <span className="text-[11px] font-semibold text-slate-500">
            {invoices.length} {invoices.length === 1 ? "bill" : "bills"}
          </span>
        }
      />

      {/* Due monthly maintenance spotlight */}
      {dueInvoices.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/80 to-orange-50/50 p-4 sm:p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs font-bold">
                ₹
              </span>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  {dueInvoices.length === 1 ? "Pending Monthly Bill" : `${dueInvoices.length} Pending Monthly Bills`}
                </h3>
                <p className="text-xs text-amber-800">
                  Pay securely with Razorpay via UPI (GPay, PhonePe, Paytm), Debit/Credit Cards, or Net Banking.
                </p>
              </div>
            </div>
            <span className="tabular text-lg sm:text-xl font-bold text-amber-950">
              {formatMoney(outstanding)}
            </span>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dueInvoices.map((inv) => {
              const flatLabel =
                inv.flatLabel ||
                [inv.flat?.block ? `${inv.flat.block}-` : "", inv.flat?.flatNumber]
                  .join("")
                  .replace(/-+$/, "") ||
                "Assigned Unit";
              return (
                <div
                  key={inv.id}
                  className="flex flex-col justify-between rounded-lg border border-amber-200/80 bg-white/90 p-3.5 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-slate-900">
                        {formatPeriod(inv.billingPeriod)} Bill
                      </span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {inv.invoiceNumber} · {flatLabel}
                    </p>
                    {inv.items && inv.items.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {inv.items.map((it) => {
                          const meta = getItemBadge(it.type);
                          return (
                            <span
                              key={it.id}
                              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border ${meta.bg}`}
                              title={it.name}
                            >
                              <span>{meta.emoji}</span>
                              <span className="truncate max-w-[110px]">{meta.label}</span>
                              <span className="font-bold">{formatMoney(it.amount)}</span>
                            </span>
                          );
                        })}
                      </div>
                    ) : null}
                    <div className="mt-2.5 flex items-baseline justify-between border-t border-slate-100 pt-2">
                      <span className="text-xs text-slate-500">Due {formatDate(inv.dueDate)}</span>
                      <span className="tabular text-base font-bold text-slate-900">
                        {formatMoney(inv.outstanding)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <PayCheckoutButton
                      invoiceId={inv.id}
                      invoiceNumber={inv.invoiceNumber}
                      amount={inv.outstanding}
                      flatLabel={flatLabel}
                      label="Pay now"
                      className="w-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total billed" value={formatMoney(billed)} icon={FileText} />
        <StatCard label="Total paid" value={formatMoney(paid)} tone="green" icon={CreditCard} />
        <StatCard
          label="Outstanding"
          value={formatMoney(outstanding)}
          tone={outstanding > 0 ? "amber" : "green"}
          icon={Wallet}
        />
        <StatCard
          label="Overdue bills"
          value={overdue}
          tone={overdue > 0 ? "red" : "default"}
          icon={AlertOctagon}
        />
      </div>

      <div className="surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="w-full sm:max-w-xs">
            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search invoice number, flat, room or period..."
            />
          </div>
          <FilterChips
            options={DUE_FILTERS}
            value={dueFilter}
            onChange={setDueFilter}
            className="sm:ml-auto"
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title="No invoices found"
            description={
              invoices.length === 0
                ? "Your owner or manager has not billed your account yet."
                : "Try a different search term or switch back to all invoices."
            }
            action={
              invoices.length > 0 ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setDueFilter("ALL");
                  }}
                >
                  Reset filters
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            {/* Mobile Cards for Resident Invoices */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {visible.map((inv) => {
                const isOpen = expanded === inv.id;
                const flatLabel =
                  inv.flatLabel ||
                  [inv.flat?.block ? `${inv.flat.block}-` : "", inv.flat?.flatNumber]
                    .join("")
                    .replace(/-+$/, "") ||
                  "Assigned Unit";
                return (
                  <div key={inv.id} className="p-4 space-y-3 transition-colors hover:bg-slate-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                          {inv.invoiceNumber}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {flatLabel} · {formatPeriod(inv.billingPeriod)}
                        </div>
                      </div>
                      <StatusBadge status={inv.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50/80 p-3 text-xs border border-slate-100">
                      <div>
                        <span className="text-[11px] font-medium text-slate-500 block">Amount</span>
                        <span className="tabular font-semibold text-slate-900">{formatMoney(inv.totalAmount)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-medium text-slate-500 block">
                          Status
                        </span>
                        {inv.outstanding > 0 ? (
                          <span className="tabular font-bold text-amber-600">
                            {formatMoney(inv.outstanding)} Due
                          </span>
                        ) : (
                          <span className="tabular font-semibold text-emerald-600">Paid in full</span>
                        )}
                      </div>
                    </div>

                    {inv.items && inv.items.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {inv.items.map((it) => {
                          const meta = getItemBadge(it.type);
                          return (
                            <span
                              key={it.id}
                              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border ${meta.bg}`}
                              title={it.name}
                            >
                              <span>{meta.emoji}</span>
                              <span className="truncate max-w-[110px]">{meta.label}</span>
                              <span className="font-semibold">{formatMoney(it.amount)}</span>
                            </span>
                          );
                        })}
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : inv.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                        {isOpen ? "Hide breakdown" : "View breakdown"}
                      </button>

                      {inv.outstanding > 0 ? (
                        <PayCheckoutButton
                          invoiceId={inv.id}
                          invoiceNumber={inv.invoiceNumber}
                          amount={inv.outstanding}
                          flatLabel={flatLabel}
                          size="xs"
                        />
                      ) : inv.receiptUrl ? (
                        <Button
                          size="xs"
                          variant="secondary"
                          disabled={downloadingId === inv.id}
                          onClick={() => handleDownloadReceipt(inv.receiptUrl, inv.id)}
                          className="!border-slate-300 font-semibold text-slate-700 hover:!bg-slate-100 shadow-2xs gap-1.5"
                          title="Download payment receipt"
                        >
                          <Download className="size-3.5 text-slate-500" />
                          Receipt
                        </Button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold">Paid</span>
                      )}
                    </div>

                    {isOpen ? (
                      <div className="pt-2 border-t border-slate-100">
                        <Breakdown invoice={inv} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table for Resident Invoices */}
            <div className="hidden sm:block">
              <Table
                dense
                head={[
                  { label: "Invoice" },
                  { label: "Unit / Room", className: "hidden sm:table-cell" },
                  { label: "Period" },
                  { label: "Due", className: "hidden lg:table-cell" },
                  { label: "Amount", align: "right" },
                  { label: "Status" },
                  { label: "Action", align: "right" },
                ]}
              >
                {visible.map((inv) => {
                  const isOpen = expanded === inv.id;
                  const Chevron = isOpen ? ChevronDown : ChevronRight;
                  const flatLabel =
                    inv.flatLabel ||
                    [inv.flat?.block ? `${inv.flat.block}-` : "", inv.flat?.flatNumber]
                      .join("")
                      .replace(/-+$/, "") ||
                    "Assigned Unit";
                  return (
                    <Fragment key={inv.id}>
                      <Tr>
                        <Td dense className="whitespace-nowrap">
                          <span className="font-mono font-semibold text-slate-900 block">
                            {inv.invoiceNumber}
                          </span>
                          {inv.items && inv.items.length > 0 ? (
                            <div className="mt-1 flex flex-wrap gap-1 max-w-[220px]">
                              {inv.items.map((it) => {
                                const meta = getItemBadge(it.type);
                                return (
                                  <span
                                    key={it.id}
                                    className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9.5px] font-medium border ${meta.bg}`}
                                    title={`${it.name} (${formatMoney(it.amount)})`}
                                  >
                                    <span>{meta.emoji}</span>
                                    <span>{meta.label}</span>
                                  </span>
                                );
                              })}
                            </div>
                          ) : null}
                        </Td>
                        <Td dense className="hidden sm:table-cell whitespace-nowrap">
                          {flatLabel}
                        </Td>
                        <Td dense>{formatPeriod(inv.billingPeriod)}</Td>
                        <Td dense className="hidden whitespace-nowrap lg:table-cell">
                          {formatDate(inv.dueDate)}
                        </Td>
                        <Td dense align="right" className="tabular font-semibold text-slate-900">
                          {formatMoney(inv.totalAmount)}
                        </Td>
                        <Td dense>
                          <StatusBadge status={inv.status} />
                        </Td>
                        <Td dense align="right">
                          <RowActions>
                            {inv.outstanding > 0 ? (
                              <PayCheckoutButton
                                invoiceId={inv.id}
                                invoiceNumber={inv.invoiceNumber}
                                amount={inv.outstanding}
                                flatLabel={flatLabel}
                                size="sm"
                              />
                            ) : inv.receiptUrl ? (
                              <Button
                                size="xs"
                                variant="secondary"
                                disabled={downloadingId === inv.id}
                                onClick={() => handleDownloadReceipt(inv.receiptUrl, inv.id)}
                                className="!border-slate-300 font-semibold text-slate-700 hover:!bg-slate-100 shadow-2xs gap-1.5"
                                title="Download payment receipt PDF"
                              >
                                <Download className="size-3.5 text-slate-500" />
                                Receipt
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">Paid</span>
                            )}
                            <IconButton
                              size="xs"
                              label={isOpen ? "Hide breakdown" : "Show breakdown"}
                              aria-expanded={isOpen}
                              onClick={() => setExpanded(isOpen ? null : inv.id)}
                            >
                              <Chevron />
                            </IconButton>
                          </RowActions>
                        </Td>
                      </Tr>

                      {isOpen ? (
                        <Tr className="hover:bg-transparent">
                          <Td colSpan={7} dense className="bg-slate-50/80">
                            <Breakdown invoice={inv} />
                          </Td>
                        </Tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Breakdown({ invoice }) {
  return (
    <div className="grid gap-6 py-2.5 lg:grid-cols-2">
      <div>
        <p className="label-xs mb-2.5 flex items-center justify-between">
          <span>Charges Breakdown</span>
          <span className="text-[11px] font-normal text-slate-500">
            {invoice.items?.length || 0} item{invoice.items?.length === 1 ? "" : "s"}
          </span>
        </p>
        <ul className="space-y-1.5">
          {invoice.items?.map((item) => {
            const meta = getItemBadge(item.type);
            const Icon = meta.icon;
            return (
              <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 min-w-0 text-slate-700">
                  <span className={`flex size-6 shrink-0 items-center justify-center rounded-md border ${meta.bg}`}>
                    <Icon className="size-3.5" />
                  </span>
                  <span className="truncate font-medium text-slate-800" title={item.name}>
                    {item.name}
                  </span>
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 shrink-0">
                    {meta.label}
                  </span>
                </span>
                <span className="tabular font-semibold text-slate-900 shrink-0">{formatMoney(item.amount)}</span>
              </li>
            );
          })}
          {invoice.previousDue > 0 ? (
            <li className="flex justify-between gap-3 pt-1 text-sm">
              <span className="text-slate-700">Previous due / Arrears</span>
              <span className="tabular font-medium text-amber-700">+{formatMoney(invoice.previousDue)}</span>
            </li>
          ) : null}
          {invoice.penalty > 0 ? (
            <li className="flex justify-between gap-3 text-sm">
              <span className="text-slate-700">Late payment penalty</span>
              <span className="tabular font-medium text-rose-700">+{formatMoney(invoice.penalty)}</span>
            </li>
          ) : null}
          {invoice.discount > 0 ? (
            <li className="flex justify-between gap-3 text-sm">
              <span className="text-slate-700">Discount / Concession</span>
              <span className="tabular font-medium text-emerald-700">-{formatMoney(invoice.discount)}</span>
            </li>
          ) : null}
          <li className="flex justify-between gap-3 border-t border-slate-200 pt-2 text-sm font-semibold">
            <span>Total Bill</span>
            <span className="tabular font-bold text-slate-900">{formatMoney(invoice.totalAmount)}</span>
          </li>
        </ul>
      </div>

      <div>
        <p className="label-xs mb-2">Payments ({invoice.payments.length})</p>
        {invoice.payments.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing received against this invoice yet.</p>
        ) : (
          <ul className="space-y-1">
            {invoice.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-700">
                  {formatDate(p.paymentDate)} · {titleCase(p.paymentMethod)}
                  {p.receiptNumber ? (
                    <span className="ml-1 inline-flex items-center gap-1 text-xs text-slate-400">
                      <Receipt className="size-3" />
                      {p.receiptNumber}
                    </span>
                  ) : null}
                </span>
                <span className="flex items-center gap-2">
                  <span className="tabular text-emerald-700">{formatMoney(p.amount)}</span>
                  {p.receiptUrl ? <ReceiptDownload url={p.receiptUrl} label={p.receiptNumber} /> : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Opens a receipt document in a new tab for printing / saving as PDF. */
function ReceiptDownload({ url, label }) {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function open() {
    setError(null);
    setBusy(true);
    try {
      await openDocument(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <IconButton
      size="xs"
      onClick={open}
      disabled={busy}
      variant="brand"
      title={error ?? `Download receipt ${label ?? ""}`.trim()}
      label={`Download receipt ${label ?? ""}`.trim()}
    >
      <Download />
    </IconButton>
  );
}
