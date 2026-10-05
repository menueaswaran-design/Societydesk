"use client";

import { Fragment, useMemo, useState } from "react";
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
  Sparkle,
} from "lucide-react";
import Button, { IconButton } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Table, { Tr, Td, RowActions } from "@/components/ui/Table";
import StatusBadge from "@/components/ui/StatusBadge";
import Badge from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/Input";
import { EmptyState, ErrorBanner, SuccessBanner } from "@/components/ui/Feedback";
import { CardNote, StatLine } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import FilterPills from "@/components/ui/FilterPills";
import CollectPaymentButton from "@/components/billing/CollectPaymentButton";
import { api, fieldErrors } from "@/lib/client/api";
import { INVOICE_STATUS, PAYMENT_METHOD } from "@/lib/constants";
import { formatDate, formatMoney, formatPeriod, titleCase } from "@/lib/format";

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function InvoicesClient({ invoices, summary, filters }) {
  const router = useRouter();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [payFor, setPayFor] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState("");

  const periods = useMemo(
    () => [...new Set(invoices.map((i) => i.billingPeriod))].sort().reverse(),
    [invoices]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((i) =>
      [i.invoiceNumber, i.flat?.flatNumber, i.flat?.block, i.billingPeriod]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [invoices, query]);

  return (
    <div className="stack">
      <PageHeader
        title="Invoices"
        description="One invoice per occupied flat, per billing period."
        meta={
          <span className="text-[11px] font-semibold text-slate-500">
            {invoices.length} shown
            {filters.status ? ` · ${titleCase(filters.status)}` : ""}
          </span>
        }
        actions={
          <Button onClick={() => setGenerateOpen(true)}>
            <Sparkles />
            Generate invoices
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Billed" value={formatMoney(summary.billed)} icon={FileText} />
        <StatCard
          label="Collected"
          value={formatMoney(summary.collected)}
          tone="green"
          icon={CheckCircle2}
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(summary.outstanding)}
          tone="amber"
          icon={Wallet}
        />
        <StatCard
          label="Penalty + arrears"
          value={formatMoney(summary.penalty + summary.carriedForward)}
          tone="violet"
          icon={Sparkle}
          hint={`Penalty ${formatMoney(summary.penalty)} · carried ${formatMoney(summary.carriedForward)}`}
        />
      </div>

      <FilterBar periods={periods} filters={filters} />

      <div className="surface overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search invoice no, flat or period"
            className="w-full sm:max-w-sm"
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices"
            description="Generate invoices for a billing period to get started."
            action={
              <Button onClick={() => setGenerateOpen(true)}>
                <Sparkles />
                Generate invoices
              </Button>
            }
          />
        ) : (
          <Table
            dense
            head={[
              { label: "Invoice" },
              { label: "Flat" },
              { label: "Period", className: "hidden md:table-cell" },
              { label: "Due", className: "hidden lg:table-cell" },
              { label: "Total", align: "right" },
              { label: "Paid", align: "right" },
              { label: "Outstanding", align: "right" },
              { label: "Status" },
              { label: "", align: "right" },
            ]}
          >
            {visible.map((inv) => {
              const isOpen = expanded === inv.id;
              const Chevron = isOpen ? ChevronDown : ChevronRight;
              return (
                <Fragment key={inv.id}>
                  <Tr>
                    <Td className="font-semibold text-slate-900">{inv.invoiceNumber}</Td>
                    <Td className="tabular">
                      {inv.flat?.block ? `${inv.flat.block}-` : ""}
                      {inv.flat?.flatNumber}
                    </Td>
                    <Td className="hidden md:table-cell">{formatPeriod(inv.billingPeriod)}</Td>
                    <Td className="hidden lg:table-cell">{formatDate(inv.dueDate)}</Td>
                    <Td align="right" className="tabular font-medium text-slate-800">
                      {formatMoney(inv.totalAmount)}
                    </Td>
                    <Td align="right" className="tabular text-emerald-600">
                      {formatMoney(inv.paidAmount)}
                    </Td>
                    <Td align="right" className="tabular">
                      {inv.outstanding > 0 ? (
                        <span className="font-semibold text-amber-600">
                          {formatMoney(inv.outstanding)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </Td>
                    <Td>
                      <StatusBadge status={inv.status} />
                    </Td>
                    <Td align="right">
                      <RowActions>
                        {inv.outstanding > 0 && inv.status !== "CANCELLED" ? (
                          <>
                            <CollectPaymentButton
                              invoiceId={inv.id}
                              invoiceNumber={inv.invoiceNumber}
                              amount={inv.outstanding}
                            />
                            <Button size="xs" onClick={() => setPayFor(inv)}>
                              <Wallet />
                              Pay
                            </Button>
                          </>
                        ) : null}
                        <IconButton
                          variant="ghost"
                          label={isOpen ? "Hide breakdown" : "Show breakdown"}
                          onClick={() => setExpanded(isOpen ? null : inv.id)}
                        >
                          <Chevron />
                        </IconButton>
                      </RowActions>
                    </Td>
                  </Tr>

                  {isOpen ? (
                    <tr>
                      <Td colSpan={9} className="!p-0">
                        <InvoiceBreakdown invoice={inv} />
                      </Td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </Table>
        )}
      </div>

      <GenerateModal open={generateOpen} onClose={() => setGenerateOpen(false)} />
      <PaymentModal invoice={payFor} onClose={() => setPayFor(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function FilterBar({ periods, filters }) {
  const router = useRouter();

  /** Build an invoices URL, overriding only the parts you pass. */
  function href({ status, period } = {}) {
    const params = new URLSearchParams();
    const s = status === undefined ? filters.status : status;
    const p = period === undefined ? filters.period : period;
    if (s) params.set("status", s);
    if (p) params.set("period", p);
    const qs = params.toString();
    return qs ? `/admin/billing/invoices?${qs}` : "/admin/billing/invoices";
  }

  return (
    <FilterPills
      options={[
        { value: "ALL", label: "All", href: href({ status: null }), active: !filters.status },
        ...Object.values(INVOICE_STATUS).map((s) => ({
          value: s,
          label: titleCase(s),
          href: href({ status: s }),
          active: filters.status === s,
        })),
      ]}
      trailing={
        periods.length > 0 ? (
          <select
            value={filters.period ?? ""}
            onChange={(e) => router.push(href({ period: e.target.value || null }), { scroll: false })}
            aria-label="Filter by period"
            className="h-8 cursor-pointer rounded-full bg-white px-3 text-[13px] font-semibold text-slate-600 ring-1 ring-slate-900/8 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="">All periods</option>
            {periods.map((p) => (
              <option key={p} value={p}>
                {formatPeriod(p)}
              </option>
            ))}
          </select>
        ) : null
      }
    />
  );
}

function InvoiceBreakdown({ invoice }) {
  return (
    <div className="grid gap-6 bg-slate-50/70 p-5 lg:grid-cols-2">
      <div>
        <p className="label-xs mb-2">Charges</p>
        <ul className="space-y-1.5">
          {invoice.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-slate-700">
                {item.name}
                <Badge>{titleCase(item.type)}</Badge>
              </span>
              <span className="tabular text-slate-900">{formatMoney(item.amount)}</span>
            </li>
          ))}
          {invoice.previousDue > 0 ? (
            <li className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-700">Previous due</span>
              <span className="tabular font-medium text-amber-700">
                {formatMoney(invoice.previousDue)}
              </span>
            </li>
          ) : null}
          {invoice.penalty > 0 ? (
            <li className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-700">Penalty</span>
              <span className="tabular font-medium text-rose-700">{formatMoney(invoice.penalty)}</span>
            </li>
          ) : null}
          <li className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2 text-sm font-semibold">
            <span>Total</span>
            <span className="tabular">{formatMoney(invoice.totalAmount)}</span>
          </li>
        </ul>
      </div>

      <div>
        <p className="label-xs mb-2">Payments ({invoice.payments.length})</p>
        {invoice.payments.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing received yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {invoice.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-slate-700">
                  {formatDate(p.paymentDate)}
                  <Badge tone="brand">{titleCase(p.paymentMethod)}</Badge>
                  {p.transactionReference ? (
                    <span className="truncate text-xs text-slate-400">{p.transactionReference}</span>
                  ) : null}
                </span>
                <span className="tabular font-medium text-emerald-700">{formatMoney(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function GenerateModal({ open, onClose }) {
  const router = useRouter();
  const [form, setForm] = useState({
    billingPeriod: currentPeriod(),
    dueDate: "",
    previousDue: true,
    penaltyPercent: 2,
    skipVacant: true,
  });
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

  async function run() {
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      const data = await api.post("/api/billing/invoices/generate", {
        ...form,
        penaltyPercent: Number(form.penaltyPercent) || 0,
        dueDate: form.dueDate || undefined,
      });
      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  function close() {
    setResult(null);
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Generate invoices"
      description="One invoice per occupied flat for the selected period."
      footer={
        result ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button onClick={run} loading={saving}>
              Generate
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
            ? ` ${result.skippedCount} flat${result.skippedCount === 1 ? "" : "s"} skipped — already invoiced for this period.`
            : ""}
        </SuccessBanner>
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
              label="Skip vacant flats"
            />
          </div>

          <CardNote tone="brand" icon={Sparkles}>
            Flats already invoiced for this period are skipped, so it is safe to run this more than
            once.
          </CardNote>
        </div>
      )}
    </Modal>
  );
}

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

  // Prefill with the full outstanding amount whenever a new invoice is picked.
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
          ? `${invoice.invoiceNumber} · ${invoice.flat?.block ? `${invoice.flat.block}-` : ""}${invoice.flat?.flatNumber} · ${formatPeriod(invoice.billingPeriod)}`
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