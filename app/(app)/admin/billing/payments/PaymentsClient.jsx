"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, FileDown, Receipt, Undo2, Info, Landmark, Plus, User, BedDouble } from "lucide-react";
import Button, { IconButton, TextAction } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Table, { Tr, Td, RowActions } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { CardNote } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import { FilterChips } from "@/components/ui/FilterPills";
import Pagination from "@/components/ui/Pagination";
import RecordPaymentModal from "@/components/billing/RecordPaymentModal";
import { api, fieldErrors, openDocument } from "@/lib/client/api";
import { formatDate, formatMoney, formatPeriod, titleCase } from "@/lib/format";

export default function PaymentsClient({
  payments,
  summary,
  initialRecordOpen = false,
  initialInvoiceId = null,
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState("");
  const [editing, setEditing] = useState(null);
  const [reversing, setReversing] = useState(null);
  const [recordingOpen, setRecordingOpen] = useState(initialRecordOpen || false);
  const [preselectedInvoice, setPreselectedInvoice] = useState(
    initialInvoiceId ? { id: initialInvoiceId } : null
  );
  const [docError, setDocError] = useState(null);

  useEffect(() => {
    if (initialRecordOpen || initialInvoiceId) {
      setRecordingOpen(true);
      if (initialInvoiceId) {
        setPreselectedInvoice({ id: initialInvoiceId });
      }
    }
  }, [initialRecordOpen, initialInvoiceId]);

  // Pagination State - 20 items per page by default
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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
        p.residentName,
        p.residentPhone,
        p.unitLabel,
        p.notes,
        p.recordedBy?.name,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [payments, query, method]);

  // Derived Pagination
  const totalItems = visible.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedPayments = useMemo(() => {
    return visible.slice(startIndex, startIndex + pageSize);
  }, [visible, startIndex, pageSize]);

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
        description="Every rupee received, with its resident details, room allocation, and digital receipt."
        meta={
          <span className="text-[11px] font-semibold text-slate-500">
            {totalItems === 0
              ? "0 payments"
              : `${startIndex + 1}–${Math.min(startIndex + pageSize, totalItems)} of ${totalItems} shown`}
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
            onChange={(val) => {
              setQuery(val);
              setPage(1);
            }}
            placeholder="Search resident name or room number..."
            className="w-full lg:max-w-sm"
          />
          <FilterChips
            value={method}
            onChange={(val) => {
              setMethod(val);
              setPage(1);
            }}
            options={[
              { value: "", label: "All" },
              ...methods.map(([m]) => ({ value: m, label: titleCase(m) })),
            ]}
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payments found"
            description="Payments recorded against residents show up here."
          />
        ) : (
          <>
            {/* Mobile Cards for Recorded Payments */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {paginatedPayments.map((p) => (
                <div key={p.id} className="p-4 space-y-2.5 transition-colors hover:bg-slate-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {p.residentName || "Resident"}
                        </span>
                        <Badge tone={p.paymentMethod === "UPI" ? "brand" : p.paymentMethod === "CASH" ? "green" : "violet"} size="xs">
                          {titleCase(p.paymentMethod)}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{p.unitLabel || "—"}</span>
                        <span>•</span>
                        <span>{formatPeriod(p.invoice?.billingPeriod)}</span>
                        <span>•</span>
                        <span>{formatDate(p.paymentDate)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="tabular text-base font-black text-emerald-600">
                        {formatMoney(p.amount)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="text-slate-500 text-[11px]">
                      By {p.recordedBy?.name || "System"}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.receiptUrl ? (
                        <button
                          type="button"
                          onClick={() => openReceipt(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold transition"
                        >
                          <FileDown className="size-3.5" />
                          <span>Receipt</span>
                        </button>
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

            {/* Desktop Table - Clean, Human-Centric (No raw IDs) */}
            <div className="hidden sm:block">
              <Table
                dense
                head={[
                  { label: "Resident" },
                  { label: "Room / Bed" },
                  { label: "Period", className: "hidden md:table-cell" },
                  { label: "Date" },
                  { label: "Method" },
                  { label: "Amount", align: "right" },
                  { label: "Receipt / Actions", align: "right" },
                ]}
              >
                {paginatedPayments.map((p) => (
                  <Tr key={p.id}>
                    {/* 1. Resident Column */}
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-brand-50 border border-brand-200/80 flex items-center justify-center text-xs font-bold text-brand-700 shrink-0">
                          {(p.residentName || "R")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate text-xs">
                            {p.residentName || "Resident"}
                          </span>
                          {p.residentPhone && (
                            <span className="text-[11px] text-slate-400 block font-mono">
                              {p.residentPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </Td>

                    {/* 2. Room & Bed */}
                    <Td className="whitespace-nowrap font-semibold text-slate-800 text-xs">
                      {p.unitLabel || "—"}
                    </Td>

                    {/* 3. Billing Period */}
                    <Td className="hidden md:table-cell whitespace-nowrap text-slate-600 text-xs">
                      {formatPeriod(p.invoice?.billingPeriod)}
                    </Td>

                    {/* 4. Payment Date */}
                    <Td className="whitespace-nowrap text-slate-600 text-xs">
                      {formatDate(p.paymentDate)}
                    </Td>

                    {/* 5. Payment Method */}
                    <Td>
                      <Badge tone={p.paymentMethod === "UPI" ? "brand" : p.paymentMethod === "CASH" ? "green" : "violet"}>
                        {titleCase(p.paymentMethod)}
                      </Badge>
                    </Td>

                    {/* 6. Amount */}
                    <Td align="right" className="tabular font-black text-sm text-emerald-600">
                      {formatMoney(p.amount)}
                    </Td>

                    {/* 7. Action / View Receipt */}
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.receiptUrl ? (
                          <button
                            type="button"
                            onClick={() => openReceipt(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold transition"
                            title="Download or view payment receipt"
                          >
                            <FileDown className="size-3.5" />
                            <span>Receipt</span>
                          </button>
                        ) : null}
                        <TextAction onClick={() => setEditing(p)}>Edit</TextAction>
                        <IconButton variant="danger" label="Reverse payment" onClick={() => setReversing(p)}>
                          <Undo2 className="size-3.5" />
                        </IconButton>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Table>
            </div>

            {/* Modern Pagination UI (20 items per page default) */}
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
              itemName="payments"
            />
          </>
        )}
      </div>

      <CardNote tone="slate" icon={Info}>
        Amounts cannot be edited once recorded. To correct an entry, reverse it with a reason and record a new payment.
      </CardNote>

      <EditModal payment={editing} onClose={() => setEditing(null)} />
      <ReverseModal payment={reversing} onClose={() => setReversing(null)} />
      <RecordPaymentModal
        open={recordingOpen}
        onClose={() => {
          setRecordingOpen(false);
          setPreselectedInvoice(null);
        }}
        preselectedInvoice={preselectedInvoice}
      />
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
    setError(null);
    setErrors({});
    onClose();
  }

  return (
    <Modal
      open={Boolean(payment)}
      onClose={close}
      title="Edit payment notes"
      description="Update payment date or internal notes. Amount cannot be changed."
      size="md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="stack"
      >
        <ErrorBanner error={error} />
        <Input
          label="Payment date"
          type="date"
          value={form.paymentDate}
          onChange={set("paymentDate")}
          error={errors.paymentDate}
        />
        <Input
          label="Reference / Cheque # (optional)"
          value={form.transactionReference}
          onChange={set("transactionReference")}
          placeholder="e.g. UPI ref or cheque #"
          error={errors.transactionReference}
        />
        <Textarea
          label="Notes"
          value={form.notes}
          onChange={set("notes")}
          placeholder="Any notes about this payment"
          rows={3}
          error={errors.notes}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

function ReverseModal({ payment, onClose }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/payments/${payment.id}/reverse`, { reason });
      router.refresh();
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    setReason("");
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={Boolean(payment)}
      onClose={close}
      title="Reverse payment"
      description="Reversing voids the receipt and restores the outstanding amount on the invoice."
      size="md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="stack"
      >
        <ErrorBanner error={error} />
        <p className="text-xs text-slate-600">
          Reversing payment of <strong className="text-slate-900">{formatMoney(payment?.amount ?? 0)}</strong> for{" "}
          <strong className="text-slate-900">{payment?.residentName || "Resident"}</strong> ({payment?.unitLabel}).
        </p>
        <Textarea
          label="Reason for reversal"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Duplicate entry, bounced cheque, wrong account"
          rows={3}
          required
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={submitting}>
            Confirm reversal
          </Button>
        </div>
      </form>
    </Modal>
  );
}
