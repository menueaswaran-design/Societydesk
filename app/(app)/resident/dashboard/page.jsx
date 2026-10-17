import Link from "next/link";
import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { getResidentDashboard } from "@/lib/queries/dashboard";
import { formatDate, formatMoney, formatPeriod, titleCase } from "@/lib/format";
import { Card, CardHeader, StatLine } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/Feedback";
import { ProgressRing } from "@/components/ui/Progress";
import Button from "@/components/ui/Button";
import PayCheckoutButton from "@/components/billing/PayCheckoutButton";
import Welcome from "@/components/dashboard/Welcome";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Wallet, AlertTriangle, Megaphone, CreditCard, FileText, Home, CheckCircle2, ArrowUpRight } from "lucide-react";

export const metadata = { title: "My Dashboard" };
export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

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

  const due = data.currentDue;
  const paidPct =
    due && due.totalAmount > 0 ? Math.round((due.paidAmount / due.totalAmount) * 100) : 100;

  const quickActions = [
    {
      href: "/resident/payments",
      title: "Pay maintenance",
      caption: due ? `${formatMoney(due.outstanding)} payable` : "All dues are cleared",
      icon: Wallet,
      tone: due ? (due.isOverdue ? "red" : "amber") : "green",
      badge: due ? "Pay now" : "Clear",
    },
    {
      href: "/resident/complaints",
      title: "Raise a complaint",
      caption:
        data.activeComplaints.length > 0
          ? `${data.activeComplaints.length} active in your flat`
          : "Something needs fixing?",
      icon: AlertTriangle,
      tone: data.activeComplaints.length > 0 ? "red" : "brand",
    },
    {
      href: "/resident/notices",
      title: "Read notices",
      caption:
        data.unreadNoticeCount > 0 ? `${data.unreadNoticeCount} new for you` : "You're all caught up",
      icon: Megaphone,
      tone: "violet",
      badge: data.unreadNoticeCount > 0 ? `${data.unreadNoticeCount} new` : undefined,
    },
    {
      href: "/resident/invoices",
      title: "View invoices",
      caption:
        data.unpaidInvoices > 0
          ? `${data.unpaidInvoices} outstanding bill${data.unpaidInvoices === 1 ? "" : "s"}`
          : "Bills and receipts",
      icon: FileText,
      tone: "sky",
    },
  ];

  return (
    <div className="stack">
      <Welcome
        eyebrow={flatLabels.join(", ") || "Your home"}
        title={`${greeting()}, ${firstName}`}
        description={
          data.flats.length
            ? "Everything you need for your home, in one place."
            : "Your resident portal"
        }
        badge={
          data.unreadNoticeCount > 0
            ? `${data.unreadNoticeCount} unread notice${data.unreadNoticeCount === 1 ? "" : "s"}`
            : "All caught up"
        }
        actions={
          due ? (
            <PayCheckoutButton
              invoiceId={due.id}
              invoiceNumber={due.invoiceNumber}
              amount={due.outstanding}
              flatLabel={dueFlatLabel}
              size="lg"
              label="Pay now"
            />
          ) : (
            <Button as="a" href="/resident/invoices" variant="secondary" size="lg">
              View invoices
            </Button>
          )
        }
      />

      {!data.flats.length ? (
        <Card>
          <EmptyState icon={Home} title="No flat is linked to your account" description={data.message} />
        </Card>
      ) : (
        <>
          {due ? (
            <Card className="p-6 sm:p-8">
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[auto_1fr_auto]">
                <ProgressRing
                  value={paidPct}
                  tone={due.isOverdue ? "rose" : "amber"}
                  size={154}
                  thickness={13}
                  label={formatMoney(due.outstanding)}
                  caption="still payable"
                />

                <div className="min-w-0">
                  <p className="label-xs">Your maintenance</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    Invoice {due.invoiceNumber}
                  </p>
                  <p className="mt-0.5 text-[13px] text-slate-500">
                    {formatPeriod(due.billingPeriod)} · {dueFlatLabel} · Due {formatDate(due.dueDate)}
                  </p>
                  <div className="mt-4 max-w-md space-y-2 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-900/5">
                    <StatLine label="Billed" value={formatMoney(due.totalAmount)} tone="muted" />
                    <StatLine label="Paid so far" value={formatMoney(due.paidAmount)} tone="green" />
                    <StatLine
                      label="Payable"
                      value={formatMoney(due.outstanding)}
                      tone={due.isOverdue ? "rose" : "amber"}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:items-end">
                  <StatusBadge status={due.isOverdue ? "OVERDUE" : due.status} />
                  <PayCheckoutButton
                    invoiceId={due.id}
                    invoiceNumber={due.invoiceNumber}
                    amount={due.outstanding}
                    flatLabel={dueFlatLabel}
                    size="lg"
                    label="Pay now"
                  />
                  <Link
                    href="/resident/invoices"
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 transition-colors hover:text-brand-800"
                  >
                    All invoices
                    <ArrowUpRight className="size-4" />
                  </Link>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
              <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/15">
                <CheckCircle2 className="size-7" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-semibold text-slate-900">You are all settled</p>
                <p className="mt-1 text-[15px] text-slate-500">
                  No pending maintenance for your home right now. New invoices will show up here
                  automatically.
                </p>
              </div>
              <Button as="a" href="/resident/invoices" variant="secondary">
                View invoices
              </Button>
            </Card>
          )}

          <QuickActions items={quickActions} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
                      className="flex items-start justify-between gap-3 px-6 py-4 transition-colors hover:bg-slate-50/70"
                    >
                      <div className="min-w-0">
                        <p
                          className={`truncate text-[15px] ${
                            n.readByMe ? "font-medium text-slate-600" : "font-semibold text-slate-900"
                          }`}
                        >
                          {n.title}
                        </p>
                        <p className="mt-0.5 truncate text-[13px] text-slate-500">
                          {titleCase(n.category)} ·{" "}
                          {n.publishedAt ? formatDate(n.publishedAt) : formatDate(n.createdAt)}
                        </p>
                      </div>
                      {!n.readByMe ? (
                        <span className="mt-2 size-2.5 shrink-0 rounded-full bg-brand-500" />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
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
                      className="flex items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-slate-50/70"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-slate-900">
                          {formatPeriod(p.invoice?.billingPeriod)}
                        </p>
                        <p className="mt-0.5 truncate text-[13px] text-slate-500">
                          {p.receipts?.[0]?.receiptNumber ?? p.invoice?.invoiceNumber} ·{" "}
                          {formatDate(p.paymentDate)}
                        </p>
                      </div>
                      <p className="tabular shrink-0 text-[15px] font-semibold text-emerald-600">
                        {formatMoney(p.amount)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {data.activeComplaints.length > 0 ? (
            <Card>
              <CardHeader
                title="Your active complaints"
                subtitle="Not yet closed"
                icon={AlertTriangle}
                action={<ViewAll href="/resident/complaints" />}
              />
              <ul className="divide-y divide-slate-100">
                {data.activeComplaints.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start justify-between gap-3 px-6 py-4 transition-colors hover:bg-slate-50/70"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-slate-900">{c.title}</p>
                      <p className="mt-0.5 truncate text-[13px] text-slate-500">
                        {titleCase(c.category)} · {formatDate(c.createdAt)}
                        {c.assignedTo?.name ? ` · ${c.assignedTo.name}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}

function ViewAll({ href }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-brand-700 transition-colors hover:bg-brand-50"
    >
      View all
      <ArrowUpRight className="size-4" />
    </Link>
  );
}