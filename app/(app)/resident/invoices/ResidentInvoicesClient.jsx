"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
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

const DUE_FILTERS = [
  { value: "ALL", label: "All invoices" },
  { value: "DUE", label: "With dues" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PAID", label: "Paid" },
];

export default function ResidentInvoicesClient({ invoices }) {
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState("");
  const [dueFilter, setDueFilter] = useState("ALL");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (dueFilter === "DUE" && inv.outstanding <= 0) return false;
      if (dueFilter === "OVERDUE" && inv.status !== "OVERDUE") return false;
      if (dueFilter === "PAID" && inv.outstanding > 0) return false;
      if (!q) return true;
      return [inv.invoiceNumber, inv.billingPeriod, inv.flat?.flatNumber, inv.flat?.block]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [invoices, query, dueFilter]);

  const billed = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const paid = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const outstanding = invoices.reduce((s, i) => s + i.outstanding, 0);
  const overdue = invoices.filter((i) => i.outstanding > 0 && i.status === "OVERDUE").length;
  const flatCount = new Set(invoices.map((i) => i.flatId)).size;

  return (
    <div className="stack">
      <PageHeader
        title="My invoices"
        description="Every bill raised against the flats linked to your account."
        meta={
          <span className="text-[11px] font-semibold text-slate-500">
            {invoices.length} {invoices.length === 1 ? "invoice" : "invoices"} · {flatCount}{" "}
            {flatCount === 1 ? "flat" : "flats"}
          </span>
        }
      />

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
          label="Overdue invoices"
          value={overdue}
          tone={overdue > 0 ? "red" : "default"}
          icon={AlertOctagon}
        />
      </div>

      {outstanding > 0 ? (
        <CardNote tone="brand" icon={Info} title="Paying your dues">
          Settle online with UPI, net banking or a card using <strong>Pay now</strong>, or pay at the
          society office and have it recorded against the invoice.
        </CardNote>
      ) : null}

      <div className="surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search invoice number, flat or period"
            className="w-full sm:max-w-xs"
          />
          <FilterChips
            className="ml-auto"
            options={DUE_FILTERS}
            value={dueFilter}
            onChange={setDueFilter}
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={invoices.length === 0 ? "No invoices yet" : "Nothing matches"}
            description={
              invoices.length === 0
                ? "Your society admin has not billed your flat yet."
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
          <Table
            dense
            head={[
              { label: "Invoice" },
              { label: "Flat", className: "hidden sm:table-cell" },
              { label: "Period" },
              { label: "Due", className: "hidden lg:table-cell" },
              { label: "Total", align: "right" },
              { label: "Paid", align: "right", className: "hidden md:table-cell" },
              { label: "Outstanding", align: "right" },
              { label: "Status" },
              { label: "", align: "right" },
            ]}
          >
            {visible.map((inv) => {
              const isOpen = expanded === inv.id;
              const Chevron = isOpen ? ChevronDown : ChevronRight;
              const flatLabel = [inv.flat?.block ? `${inv.flat.block}-` : "", inv.flat?.flatNumber]
                .join("")
                .replace(/-+$/, "");
              return (
                <Fragment key={inv.id}>
                  <Tr>
                    <Td dense className="font-semibold text-slate-900">
                      {inv.invoiceNumber}
                    </Td>
                    <Td dense className="hidden sm:table-cell">
                      {inv.flat?.block ? `${inv.flat.block}-` : ""}
                      {inv.flat?.flatNumber}
                    </Td>
                    <Td dense>{formatPeriod(inv.billingPeriod)}</Td>
                    <Td dense className="hidden whitespace-nowrap lg:table-cell">
                      {formatDate(inv.dueDate)}
                    </Td>
                    <Td dense align="right" className="tabular">
                      {formatMoney(inv.totalAmount)}
                    </Td>
                    <Td dense align="right" className="tabular hidden text-emerald-600 md:table-cell">
                      {formatMoney(inv.paidAmount)}
                    </Td>
                    <Td dense align="right" className="tabular font-semibold">
                      {inv.outstanding > 0 ? (
                        <span className="text-amber-600">{formatMoney(inv.outstanding)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
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
                          />
                        ) : null}
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
                      <Td colSpan={9} dense className="bg-slate-50/80">
                        <Breakdown invoice={inv} />
                      </Td>
                    </Tr>
                  ) : null}
                </Fragment>
              );
            })}
          </Table>
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

function Breakdown({ invoice }) {
  return (
    <div className="grid gap-6 py-2 lg:grid-cols-2">
      <div>
        <p className="label-xs mb-2">Charges</p>
        <ul className="space-y-1">
          {invoice.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 text-sm">
              <span className="text-slate-700">
                {item.name}{" "}
                <span className="text-xs text-slate-400">({titleCase(item.type)})</span>
              </span>
              <span className="tabular text-slate-900">{formatMoney(item.amount)}</span>
            </li>
          ))}
          {invoice.previousDue > 0 ? (
            <li className="flex justify-between gap-3 text-sm">
              <span className="text-slate-700">Previous due</span>
              <span className="tabular text-amber-700">{formatMoney(invoice.previousDue)}</span>
            </li>
          ) : null}
          {invoice.penalty > 0 ? (
            <li className="flex justify-between gap-3 text-sm">
              <span className="text-slate-700">Late payment penalty</span>
              <span className="tabular text-rose-700">{formatMoney(invoice.penalty)}</span>
            </li>
          ) : null}
          {invoice.discount > 0 ? (
            <li className="flex justify-between gap-3 text-sm">
              <span className="text-slate-700">Discount</span>
              <span className="tabular text-emerald-700">-{formatMoney(invoice.discount)}</span>
            </li>
          ) : null}
          <li className="flex justify-between gap-3 border-t border-slate-200 pt-1.5 text-sm font-semibold">
            <span>Total</span>
            <span className="tabular">{formatMoney(invoice.totalAmount)}</span>
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
        <Link
          href="/resident/payments"
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800"
        >
          See all payments
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}