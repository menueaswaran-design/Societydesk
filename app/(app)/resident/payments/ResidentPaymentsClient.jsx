"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Clock, CreditCard, Download, Receipt, Info } from "lucide-react";
import Table, { Tr, Td, RowActions } from "@/components/ui/Table";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import { CardNote } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import { TextAction } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PayCheckoutButton from "@/components/billing/PayCheckoutButton";
import { openDocument } from "@/lib/client/api";
import { formatDate, formatMoney, formatPeriod, titleCase } from "@/lib/format";

export default function ResidentPaymentsClient({ payments, pendingOrders = [], summary }) {
  const [query, setQuery] = useState("");
  const [docError, setDocError] = useState(null);
  const [pending, setPending] = useState(null);
  const [autoOrderId, setAutoOrderId] = useState(null);

  // An admin's ?order=<id> link should offer that exact payment on arrival.
  const searchParams = useSearchParams();
  const linkedOrderId = searchParams.get("order");
  useEffect(() => {
    if (linkedOrderId) setAutoOrderId(linkedOrderId);
  }, [linkedOrderId]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) =>
      [p.receiptNumber, p.invoice?.invoiceNumber, p.invoice?.billingPeriod, p.flat?.flatNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [payments, query]);

  const hasReceipts = payments.some((p) => p.receiptNumber);

  async function download(payment) {
    setDocError(null);
    setPending(payment.id);
    try {
      await openDocument(payment.receiptUrl);
    } catch (err) {
      setDocError(err.message);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="My payments"
        description="A complete history of everything paid against your flats, with a receipt for each."
        meta={
          <span className="text-[11px] font-semibold text-slate-500">
            {summary.count} {summary.count === 1 ? "payment" : "payments"} recorded
          </span>
        }
      />

      <ErrorBanner error={docError} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Paid this month"
          value={formatMoney(summary.paidThisMonth)}
          tone="green"
          icon={CreditCard}
        />
        <StatCard label="Paid all time" value={formatMoney(summary.totalPaid)} />
        <StatCard label="Payments" value={summary.count} icon={Receipt} />
      </div>

      {pendingOrders.length > 0 ? (
        <section className="overflow-hidden rounded-2xl bg-amber-50/70 ring-1 ring-amber-200/80">
          <div className="flex items-start gap-3 border-b border-amber-200/70 px-4 py-3">
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-amber-900">
                {pendingOrders.length} pending{" "}
                {pendingOrders.length === 1 ? "payment" : "payments"}
              </h2>
              <p className="text-xs text-amber-800">
                Started but not completed. These do not count as paid until the money is received.
              </p>
            </div>
          </div>
          <Table
            dense
            head={[
              { label: "Invoice" },
              { label: "Started", className: "hidden sm:table-cell" },
              { label: "Expires" },
              { label: "Channel", className: "hidden md:table-cell" },
              { label: "Amount", align: "right" },
              { label: "", align: "right" },
            ]}
          >
            {pendingOrders.map((o) => (
              <Tr
                key={o.id}
                className={`hover:bg-transparent ${
                  autoOrderId === o.id ? "bg-amber-100/70" : "bg-amber-50/40"
                }`}
              >
                <Td dense className="font-semibold text-slate-900">
                  {o.invoice?.invoiceNumber ?? "-"}
                </Td>
                <Td dense className="hidden whitespace-nowrap sm:table-cell">
                  {formatDate(o.createdAt)}
                </Td>
                <Td dense className="whitespace-nowrap text-amber-700">
                  {formatDate(o.expiresAt)}
                </Td>
                <Td dense className="hidden text-xs text-slate-500 md:table-cell">
                  {titleCase(o.gateway)}
                </Td>
                <Td dense align="right" className="tabular font-semibold">
                  {formatMoney(o.amount)}
                </Td>
                <Td dense align="right">
                  <PayCheckoutButton
                    invoiceId={o.invoiceId}
                    invoiceNumber={o.invoice?.invoiceNumber}
                    amount={o.amount}
                    label="Resume"
                    variant="secondary"
                    size="xs"
                    autoStart={autoOrderId === o.id}
                  />
                </Td>
              </Tr>
            ))}
          </Table>
        </section>
      ) : null}

      <div className="surface overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search receipt, invoice or period"
            className="w-full sm:max-w-sm"
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={payments.length === 0 ? "No payments recorded yet" : "Nothing matches"}
            description={
              payments.length === 0
                ? "Once your society records a payment it appears here with its receipt number."
                : "Try a different search term."
            }
          />
        ) : (
          <Table
            dense
            head={[
              { label: "Date" },
              { label: "Receipt" },
              { label: "Invoice" },
              { label: "Flat", className: "hidden sm:table-cell" },
              { label: "Period", className: "hidden lg:table-cell" },
              { label: "Method", className: "hidden md:table-cell" },
              { label: "Amount", align: "right" },
              { label: "", align: "right" },
            ]}
          >
            {visible.map((p) => (
              <Tr key={p.id}>
                <Td dense className="tabular whitespace-nowrap">{formatDate(p.paymentDate)}</Td>
                <Td dense className="font-semibold text-slate-900">
                  {p.receiptNumber ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Receipt className="size-3.5 text-slate-400" />
                      {p.receiptNumber}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </Td>
                <Td dense>{p.invoice?.invoiceNumber}</Td>
                <Td dense className="hidden sm:table-cell">
                  {p.flat?.block ? `${p.flat.block}-` : ""}
                  {p.flat?.flatNumber}
                </Td>
                <Td dense className="hidden lg:table-cell">{formatPeriod(p.invoice?.billingPeriod)}</Td>
                <Td dense className="hidden md:table-cell">
                  <Badge tone="slate">{titleCase(p.paymentMethod)}</Badge>
                </Td>
                <Td dense align="right" className="tabular font-semibold text-emerald-600">
                  {formatMoney(p.amount)}
                </Td>
                <Td dense align="right">
                  {p.receiptUrl ? (
                    <RowActions>
                      <TextAction
                        onClick={() => download(p)}
                        disabled={pending === p.id}
                      >
                        <Download />
                        {pending === p.id ? "Opening" : "Receipt"}
                      </TextAction>
                    </RowActions>
                  ) : null}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </div>

      {hasReceipts ? (
        <CardNote tone="slate" icon={Info} compact>
          Opening a receipt loads it in a new tab, where you can print it or save it as a PDF.
        </CardNote>
      ) : null}
    </div>
  );
}