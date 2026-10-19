"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, CreditCard, FileDown, Search, Receipt, Undo2, Info, Landmark, Plus } from "lucide-react";
import Button, { IconButton, TextAction } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Table, { Tr, Td, RowActions } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardNote } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import { FilterChips } from "@/components/ui/FilterPills";
import CollectPaymentButton from "@/components/billing/CollectPaymentButton";
import RecordPaymentModal from "@/components/billing/RecordPaymentModal";
import { api, fieldErrors, openDocument } from "@/lib/client/api";
import { formatDate, formatMoney, formatPeriod, titleCase } from "@/lib/format";

export default function PaymentsClient({ payments, pendingOrders = [], summary }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("");
  const [editing, setEditing] = useState(null);
  const [reversing, setReversing] = useState(null);
  const [recordingOpen, setRecordingOpen] = useState(false);
  const [docError, setDocError] = useState(null);

  const methods = useMemo(
    () => Object.entries(summary.byMethod).filter(([, v]) => v.count > 0),
    [summary.byMethod]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return payments.filter((p) => {
      if (method && p.paymentMethod !== method) return false;
      if (!q) return true;
      return [
        p.invoice?.invoiceNumber,
        p.flat?.flatNumber,
        p.flat?.block,
        p.transactionReference,
        p.receiptNumber,
        p.recordedBy?.name,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [payments, query, method]);

  const visiblePending = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pendingOrders;
    return pendingOrders.filter((o) =>
      [o.invoice?.invoiceNumber, o.flat?.flatNumber, o.flat?.block, o.initiatedBy?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [pendingOrders, query]);

  async function openReceipt(payment) {
    setDocError(null);
    try {
      await openDocument(payment.receiptUrl);
    } catch (err) {
      setDocError(err.message);
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Payments"
        description="Every rupee received, with its receipt and the gateway reference behind it."
        meta={
          <span className="text-[11px] font-semibold text-slate-500">
            {visible.length} of {payments.length} shown
          </span>
        }
        actions={
          <Button onClick={() => setRecordingOpen(true)}>
            <Plus />
            Record payment
          </Button>
        }
      />

      <ErrorBanner error={docError} />

      {visiblePending.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-amber-50/50 px-5 py-3.5">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Clock className="size-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900">Awaiting online payment</h2>
              <p className="text-xs text-slate-500">
                Payment links issued but not yet completed. Not included in collected totals.
              </p>
            </div>
            <p className="tabular ml-auto text-sm font-semibold text-amber-700">
              {formatMoney(visiblePending.reduce((s, o) => s + o.amount, 0))}
            </p>
          </div>
          {/* Mobile Cards for Pending Payments */}
          <div className="divide-y divide-amber-200/50 sm:hidden">
            {visiblePending.map((o) => (
              <div key={o.id} className="p-4 space-y-2.5 bg-amber-50/25">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                      {o.invoice?.invoiceNumber ?? "Invoice"}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-600">
                      Flat {o.flat?.block ? `${o.flat.block}-` : ""}{o.flat?.flatNumber} · Expires {formatDate(o.expiresAt)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="tabular text-sm font-bold text-amber-700">
                      {formatMoney(o.amount)}
                    </div>
                    <Badge tone="violet" size="xs" className="mt-0.5">
                      {titleCase(o.gateway)}
                    </Badge>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/40 flex items-center justify-between text-xs text-slate-500">
                  <span>By {o.initiatedBy?.name ?? "System"}</span>
                  <CollectPaymentButton
                    invoiceId={o.invoiceId}
                    invoiceNumber={o.invoice?.invoiceNumber}
                    amount={o.amount}
                    size="xs"
                    label="Reissue link"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table for Pending Payments */}
          <div className="hidden sm:block">
            <Table
              dense
              head={[
                { label: "Invoice" },
                { label: "Flat" },
                { label: "Issued by", className: "hidden md:table-cell" },
                { label: "Started", className: "hidden lg:table-cell" },
                { label: "Expires" },
                { label: "Channel", className: "hidden sm:table-cell" },
                { label: "Amount", align: "right" },
                { label: "", align: "right" },
              ]}
            >
              {visiblePending.map((o) => (
                <Tr key={o.id} className="bg-amber-50/25 hover:bg-amber-50/50">
                  <Td className="font-mono font-semibold text-slate-900 whitespace-nowrap">{o.invoice?.invoiceNumber ?? "-"}</Td>
                  <Td className="tabular whitespace-nowrap">
                    {o.flat?.block ? `${o.flat.block}-` : ""}
                    {o.flat?.flatNumber}
                  </Td>
                  <Td className="hidden md:table-cell">{o.initiatedBy?.name ?? "-"}</Td>
                  <Td className="hidden whitespace-nowrap lg:table-cell">
                    {formatDate(o.createdAt)}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {new Date(o.expiresAt) < new Date() ? (
                      <Badge tone="slate">expired</Badge>
                    ) : (
                      formatDate(o.expiresAt)
                    )}
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <Badge tone="violet">{titleCase(o.gateway)}</Badge>
                  </Td>
                  <Td align="right" className="tabular font-semibold text-amber-700">
                    {formatMoney(o.amount)}
                  </Td>
                  <Td align="right">
                    <RowActions>
                      <CollectPaymentButton
                        invoiceId={o.invoiceId}
                        invoiceNumber={o.invoice?.invoiceNumber}
                        amount={o.amount}
                        size="xs"
                        label="Reissue link"
                      />
                    </RowActions>
                  </Td>
                </Tr>
              ))}
            </Table>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Collected this month"
          value={formatMoney(summary.monthTotal)}
          hint={`${summary.monthCount} payments`}
          tone="green"
          icon={CreditCard}
        />
        <StatCard
          label="Collected all time"
          value={formatMoney(summary.total)}
          hint={`${summary.count} payments`}
          icon={Receipt}
        />
        <StatCard
          label="Cash"
          value={formatMoney(summary.byMethod.CASH?.amount ?? 0)}
          hint={`${summary.byMethod.CASH?.count ?? 0} payments`}
          icon={Landmark}
        />
        <StatCard
          label="Digital"
          value={formatMoney(
            (summary.byMethod.UPI?.amount ?? 0) +
              (summary.byMethod.BANK_TRANSFER?.amount ?? 0) +
              (summary.byMethod.CHEQUE?.amount ?? 0)
          )}
          hint="UPI, bank transfer and cheque"
          tone="blue"
        />
      </div>

      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search invoice, flat, reference or receipt"
            className="w-full lg:max-w-sm"
          />
          <FilterChips
            value={method}
            onChange={setMethod}
            options={[
              { value: "", label: "All" },
              ...methods.map(([m]) => ({ value: m, label: titleCase(m) })),
            ]}
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payments"
            description="Payments recorded against an invoice show up here."
          />
        ) : (
          <>
            {/* Mobile Cards for Recorded Payments */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {visible.map((p) => (
                <div key={p.id} className="p-4 space-y-2.5 transition-colors hover:bg-slate-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                        {p.receiptNumber ?? <span className="text-slate-400 font-sans">No receipt #</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                        <span>{formatDate(p.paymentDate)}</span>
                        {p.flat?.flatNumber && (
                          <>
                            <span>•</span>
                            <span>Flat {p.flat?.block ? `${p.flat.block}-` : ""}{p.flat.flatNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="tabular text-sm font-bold text-emerald-600">
                        {formatMoney(p.amount)}
                      </div>
                      <Badge tone="brand" size="xs" className="mt-0.5">
                        {titleCase(p.paymentMethod)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="text-slate-600 truncate text-[11px]">
                      <span className="text-slate-400">Inv: </span>
                      <span className="font-mono font-medium text-slate-700 whitespace-nowrap">
                        {p.invoice?.invoiceNumber || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {p.receiptUrl ? (
                        <IconButton
                          variant="brand"
                          size="xs"
                          label={`View receipt ${p.receiptNumber}`}
                          onClick={() => openReceipt(p)}
                        >
                          <FileDown className="size-3.5" />
                        </IconButton>
                      ) : null}
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => setEditing(p)}
                        className="h-7 text-xs px-2"
                      >
                        Edit
                      </Button>
                      <IconButton
                        variant="danger"
                        size="xs"
                        label="Reverse payment"
                        onClick={() => setReversing(p)}
                      >
                        <Undo2 className="size-3.5" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table for Recorded Payments */}
            <div className="hidden sm:block">
              <Table
                dense
                head={[
                  { label: "Date" },
                  { label: "Receipt" },
                  { label: "Invoice", className: "hidden sm:table-cell" },
                  { label: "Flat" },
                  { label: "Period", className: "hidden lg:table-cell" },
                  { label: "Method" },
                  { label: "Reference", className: "hidden xl:table-cell" },
                  { label: "By", className: "hidden xl:table-cell" },
                  { label: "Amount", align: "right" },
                  { label: "", align: "right" },
                ]}
              >
                {visible.map((p) => (
                  <Tr key={p.id}>
                    <Td className="whitespace-nowrap">{formatDate(p.paymentDate)}</Td>
                    <Td className="font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {p.receiptNumber ?? <span className="text-slate-400 font-sans">-</span>}
                    </Td>
                    <Td className="font-mono hidden sm:table-cell whitespace-nowrap">{p.invoice?.invoiceNumber}</Td>
                    <Td className="tabular whitespace-nowrap">
                      {p.flat?.block ? `${p.flat.block}-` : ""}
                      {p.flat?.flatNumber}
                    </Td>
                    <Td className="hidden lg:table-cell">{formatPeriod(p.invoice?.billingPeriod)}</Td>
                    <Td>
                      <Badge tone="brand">{titleCase(p.paymentMethod)}</Badge>
                    </Td>
                    <Td className="hidden truncate text-xs text-slate-500 xl:table-cell">
                      {p.transactionReference ?? "-"}
                    </Td>
                    <Td className="hidden truncate xl:table-cell">
                      {p.recordedBy?.name ?? "System"}
                    </Td>
                    <Td align="right" className="tabular font-semibold text-emerald-600">
                      {formatMoney(p.amount)}
                    </Td>
                    <Td align="right">
                      <RowActions>
                        {p.receiptUrl ? (
                          <IconButton
                            variant="brand"
                            label={`View receipt ${p.receiptNumber}`}
                            onClick={() => openReceipt(p)}
                          >
                            <FileDown />
                          </IconButton>
                        ) : null}
                        <TextAction onClick={() => setEditing(p)}>Edit</TextAction>
                        <IconButton variant="danger" label="Reverse payment" onClick={() => setReversing(p)}>
                          <Undo2 />
                        </IconButton>
                      </RowActions>
                    </Td>
                  </Tr>
                ))}
              </Table>
            </div>
          </>
        )}
      </div>

      <CardNote tone="slate" icon={Info}>
        Amounts cannot be edited. To correct a payment, reverse it with a reason and record a new one
        against the invoice.
      </CardNote>

      <EditModal payment={editing} onClose={() => setEditing(null)} />
      <ReverseModal payment={reversing} onClose={() => setReversing(null)} />
      <RecordPaymentModal open={recordingOpen} onClose={() => setRecordingOpen(false)} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function EditModal({ payment, onClose }) {
  const router = useRouter();
  const [form, setForm] = useState({ transactionReference: "", notes: "", paymentDate: "" });
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [lastId, setLastId] = useState(null);

  if (payment && payment.id !== lastId) {
    setLastId(payment.id);
    setForm({
      transactionReference: payment.transactionReference ?? "",
      notes: payment.notes ?? "",
      paymentDate: payment.paymentDate ? payment.paymentDate.slice(0, 10) : "",
    });
    setError(null);
    setErrors({});
  }

  function set(key) {
    return (e) => setForm({ ...form, [key]: e.target.value });
  }

  async function submit() {
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      await api.patch(`/api/payments/${payment.id}`, {
        transactionReference: form.transactionReference || null,
        notes: form.notes || null,
        paymentDate: form.paymentDate || undefined,
      });
      router.refresh();
      close();
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
      open={Boolean(payment)}
      onClose={close}
      title="Edit payment details"
      description={payment ? `${formatMoney(payment.amount)} · ${payment.invoice?.invoiceNumber}` : ""}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      {payment ? (
        <div className="flex flex-col gap-4">
          <ErrorBanner error={error} />
          <Input
            id="transactionReference"
            label="Transaction reference"
            value={form.transactionReference}
            onChange={set("transactionReference")}
            error={errors.transactionReference}
          />
          <Input
            id="paymentDate"
            label="Payment date"
            type="date"
            value={form.paymentDate}
            onChange={set("paymentDate")}
            error={errors.paymentDate}
          />
          <Textarea
            id="notes"
            label="Notes"
            rows={3}
            value={form.notes}
            onChange={set("notes")}
            error={errors.notes}
          />
          <CardNote tone="slate">
            The recorded amount of {formatMoney(payment.amount)} cannot be changed here.
          </CardNote>
        </div>
      ) : null}
    </Modal>
  );
}

// ---------------------------------------------------------------------------

function ReverseModal({ payment, onClose }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastId, setLastId] = useState(null);

  if (payment && payment.id !== lastId) {
    setLastId(payment.id);
    setReason("");
    setError(null);
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await api.del(`/api/payments/${payment.id}`, { reason });
      router.refresh();
      close();
    } catch (err) {
      setError(err.message);
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
      open={Boolean(payment)}
      onClose={close}
      title="Reverse payment"
      description={payment ? `${formatMoney(payment.amount)} · ${payment.invoice?.invoiceNumber}` : ""}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={submit}
            disabled={reason.trim().length < 3}
            loading={saving}
          >
            Reverse payment
          </Button>
        </>
      }
    >
      {payment ? (
        <div className="flex flex-col gap-4">
          <ErrorBanner error={error} />
          <Textarea
            id="reason"
            label="Reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Cheque bounced, entered against the wrong flat, ..."
            hint="Stored on the audit trail. At least 3 characters."
          />
          <CardNote tone="amber" icon={Undo2}>
            The invoice balance goes back up and its status is recalculated. The payment record is
            kept for audit.
          </CardNote>
        </div>
      ) : null}
    </Modal>
  );
}