import Link from "next/link";
import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { getResidentDashboard } from "@/lib/queries/dashboard";
import { formatDate, formatMoney, formatPeriod, titleCase } from "@/lib/format";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, StatLine } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/Feedback";
import PageHeader from "@/components/ui/PageHeader";
import { ProgressRing } from "@/components/ui/Progress";
import PayCheckoutButton from "@/components/billing/PayCheckoutButton";
import {
  Wallet,
  AlertTriangle,
  Megaphone,
  CreditCard,
  Home,
  ArrowUpRight,
  FileText,
  Sparkles,
} from "lucide-react";

export const metadata = { title: "My Dashboard" };
export const dynamic = "force-dynamic";

export default async function ResidentDashboardPage() {
  const user = await getServerSession();
  requirePageRole(user, "RESIDENT");

  const data = await getResidentDashboard(user);
  const flatById = new Map(data.flats.map((f) => [f.id, f]));
  const labelFor = (flat, fallback) => {
    const f = flat ? flatById.get(flat) : null;
    if (!f) return fallback ?? "";
    return f.block ? `${f.block}-${f.flatNumber}` : f.flatNumber;
  };
  const flatLabels = data.flats.map((f) => (f.block ? `${f.block}-${f.flatNumber}` : f.flatNumber));
  const firstName = user.name.split(" ")[0];
  const dueFlatLabel = data.currentDue
    ? labelFor(data.currentDue.flatId, data.currentDue.flat?.flatNumber)
    : "";

  return (
    <div className="stack">
      <PageHeader
        title={`Hello, ${firstName}`}
        description={
          flatLabels.length
            ? `${flatLabels.join(", ")} · everything for your home in one place`
            : "Your resident portal"
        }
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
            <Sparkles className="size-3.5" />
            Resident
          </span>
        }
      />

      {/* No flat: the resident cannot do anything else, so say so plainly. */}
      {!data.flats.length ? (
        <Card>
          <EmptyState
            icon={Home}
            title="No flat is linked to your account"
            description={data.message}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Current due"
              value={formatMoney(data.currentDue?.outstanding ?? 0)}
              hint={
                data.currentDue ? `Due ${formatDate(data.currentDue.dueDate)}` : "Nothing outstanding"
              }
              tone={data.currentDue ? (data.currentDue.isOverdue ? "red" : "amber") : "green"}
              icon={Wallet}
            />
            <StatCard
              label="Total outstanding"
              value={formatMoney(data.totalOutstanding)}
              hint={`${data.unpaidInvoices} unpaid ${data.unpaidInvoices === 1 ? "invoice" : "invoices"}`}
              tone={data.totalOutstanding > 0 ? "amber" : "green"}
              icon={FileText}
            />
            <StatCard
              label="Active complaints"
              value={data.activeComplaints.length}
              hint={
                data.activeComplaints.some((c) => c.status === "RESOLVED")
                  ? "One waiting on your confirmation"
                  : "None waiting on you"
              }
              tone={data.activeComplaints.length > 0 ? "blue" : "default"}
              icon={AlertTriangle}
            />
            <StatCard
              label="Unread notices"
              value={data.unreadNoticeCount}
              hint={data.unreadNoticeCount > 0 ? "Tap through to clear" : "All caught up"}
              tone={data.unreadNoticeCount > 0 ? "violet" : "default"}
              icon={Megaphone}
            />
          </div>

          <Card className="overflow-hidden">
            <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[auto_1fr_1fr] lg:items-center">
              {data.currentDue ? (
                <div className="flex items-center gap-6">
                  <ProgressRing
                    value={
                      data.currentDue.totalAmount > 0
                        ? (data.currentDue.paidAmount / data.currentDue.totalAmount) * 100
                        : 100
                    }
                    tone={data.currentDue.isOverdue ? "rose" : "amber"}
                    size={132}
                    thickness={11}
                    label={formatMoney(data.currentDue.outstanding)}
                    caption="still payable"
                  />
                </div>
              ) : (
                <ProgressRing value={100} tone="green" size={132} thickness={11} caption="all settled" />
              )}

              {data.currentDue ? (
                <div className="space-y-3">
                  <div>
                    <p className="label-xs">Current due</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      Invoice {data.currentDue.invoiceNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatPeriod(data.currentDue.billingPeriod)} · {dueFlatLabel}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-900/5">
                    <StatLine label="Billed" value={formatMoney(data.currentDue.totalAmount)} tone="muted" />
                    <StatLine label="Paid so far" value={formatMoney(data.currentDue.paidAmount)} tone="green" />
                    <StatLine
                      label="Payable"
                      value={formatMoney(data.currentDue.outstanding)}
                      tone={data.currentDue.isOverdue ? "rose" : "amber"}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-semibold text-slate-900">You are all settled</p>
                  <p className="mt-1 text-sm text-slate-500">
                    No pending maintenance for your flat. New invoices will appear here.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 lg:items-end lg:justify-center">
                {data.currentDue ? (
                  <>
                    <StatusBadge status={data.currentDue.isOverdue ? "OVERDUE" : data.currentDue.status} />
                    <PayCheckoutButton
                      invoiceId={data.currentDue.id}
                      invoiceNumber={data.currentDue.invoiceNumber}
                      amount={data.currentDue.outstanding}
                      flatLabel={dueFlatLabel}
                      size="lg"
                      label="Pay now"
                    />
                  </>
                ) : null}
                <Link
                  href="/resident/invoices"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800"
                >
                  All invoices
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader
                title="Active complaints"
                subtitle="Not yet closed"
                icon={AlertTriangle}
                action={<ViewAll href="/resident/complaints" />}
              />
              {data.activeComplaints.length === 0 ? (
                <EmptyState
                  icon={AlertTriangle}
                  title="Nothing reported"
                  description="Raise a complaint if something in your flat needs attention."
                  compact
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.activeComplaints.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/70"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{c.title}</p>
                        <p className="truncate text-xs text-slate-500">
                          {titleCase(c.category)} · {formatDate(c.createdAt)}
                          {c.assignedTo?.name ? ` · ${c.assignedTo.name}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={c.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Latest notices"
                subtitle={`${data.unreadNoticeCount} unread`}
                icon={Megaphone}
                action={<ViewAll href="/resident/notices" />}
              />
              {data.notices.length === 0 ? (
                <EmptyState icon={Megaphone} title="No notices" compact />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.notices.map((n) => (
                    <li
                      key={n.id}
                      className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/70"
                    >
                      <div className="min-w-0">
                        <p
                          className={`truncate text-sm ${
                            n.readByMe ? "font-medium text-slate-600" : "font-semibold text-slate-900"
                          }`}
                        >
                          {n.title}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {titleCase(n.category)} ·{" "}
                          {n.publishedAt ? formatDate(n.publishedAt) : formatDate(n.createdAt)}
                        </p>
                      </div>
                      {!n.readByMe ? (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader
                title="Recent payments"
                subtitle="Your last 6 receipts"
                icon={CreditCard}
                action={<ViewAll href="/resident/payments" />}
              />
              {data.recentPayments.length === 0 ? (
                <EmptyState icon={CreditCard} title="No payments recorded yet" compact />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.recentPayments.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/70"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {formatPeriod(p.invoice?.billingPeriod)}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {p.receipts?.[0]?.receiptNumber ?? p.invoice?.invoiceNumber} ·{" "}
                          {formatDate(p.paymentDate)}
                        </p>
                      </div>
                      <p className="tabular shrink-0 text-sm font-semibold text-emerald-600">
                        {formatMoney(p.amount)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function ViewAll({ href }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50"
    >
      View all
      <ArrowUpRight className="size-3.5" />
    </Link>
  );
}
