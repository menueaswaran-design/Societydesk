import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { getAdminDashboard } from "@/lib/queries/dashboard";
import { formatMoney, formatDate, formatPeriod, titleCase } from "@/lib/format";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/Feedback";
import PageHeader from "@/components/ui/PageHeader";
import { Progress, ProgressRing } from "@/components/ui/Progress";
import LinkRow from "@/components/ui/LinkRow";
import Link from "next/link";
import {
  Building2,
  Users,
  Wallet,
  Clock,
  AlertTriangle,
  TrendingUp,
  CalendarDays,
  CreditCard,
  Megaphone,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getServerSession();
  requirePageRole(user, "SOCIETY_ADMIN");

  const data = await getAdminDashboard(user.societyId);
  const { cards, collection } = data;

  return (
    <div className="stack">
      <PageHeader
        title="Dashboard"
        description="Collection position, open issues and the latest society activity."
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
            <CalendarDays className="size-3.5 text-slate-500" />
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Collected this month"
          value={formatMoney(cards.collectedThisMonth)}
          hint={`${cards.collectedThisMonthCount} payments received`}
          tone="green"
          icon={Wallet}
        />
        <StatCard
          label="Pending"
          value={formatMoney(cards.pending)}
          hint={`${collection.collectionRate}% of billed collected`}
          tone="amber"
          icon={Clock}
          footer={<Progress value={collection.collectionRate} tone="amber" size="xs" />}
        />
        <StatCard
          label="Overdue"
          value={formatMoney(cards.overdue)}
          hint={`${cards.overdueInvoiceCount} invoices past due`}
          tone="red"
          icon={AlertTriangle}
        />
        <StatCard
          label="Open complaints"
          value={cards.openComplaints}
          hint={cards.urgentComplaints > 0 ? `${cards.urgentComplaints} marked urgent` : "Nothing urgent"}
          tone={cards.urgentComplaints > 0 ? "red" : "blue"}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
            <ProgressRing
              value={collection.collectionRate}
              tone={collection.collectionRate >= 90 ? "green" : collection.collectionRate >= 60 ? "amber" : "rose"}
              size={148}
              thickness={12}
              caption="of billed amount collected"
            />

            <div className="w-full flex-1 space-y-4">
              <div>
                <p className="label-xs">Billed</p>
                <p className="tabular mt-1 text-2xl font-semibold text-slate-900">
                  {formatMoney(collection.billed)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="label-xs">Collected</p>
                  <p className="tabular mt-1 text-lg font-semibold text-emerald-600">
                    {formatMoney(collection.collected)}
                  </p>
                </div>
                <div>
                  <p className="label-xs">Outstanding</p>
                  <p className="tabular mt-1 text-lg font-semibold text-amber-600">
                    {formatMoney(Math.max(0, collection.billed - collection.collected))}
                  </p>
                </div>
              </div>
              <LinkRow
                href="/admin/billing/defaulters"
                title="Review defaulters"
                caption="See which flats are past due"
                icon={ArrowUpRight}
              />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <StatCard
            label="Total flats"
            value={cards.totalFlats}
            hint={`${cards.occupiedFlats} occupied · ${cards.vacantFlats} vacant`}
            icon={Building2}
          />
          <StatCard
            label="Residents"
            value={cards.totalResidents}
            hint="Active resident accounts"
            icon={Users}
          />
          <StatCard
            label="Collection rate"
            value={`${collection.collectionRate}%`}
            hint={`${formatMoney(collection.collected)} of ${formatMoney(collection.billed)}`}
          tone="slate"
          icon={TrendingUp}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Recent payments"
            subtitle="Last 8 recorded"
            icon={CreditCard}
            action={<ViewAll href="/admin/billing/payments" />}
          />
          {data.recentPayments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payments recorded yet"
              description="Record a payment against any invoice to see it here."
              compact
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentPayments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-slate-50/70"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {p.flat?.block ? `${p.flat.block}-` : ""}
                      {p.flat?.flatNumber}
                      <span className="ml-2 font-normal text-slate-500">
                        {formatPeriod(p.invoice?.billingPeriod)}
                      </span>
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {p.receipts?.[0]?.receiptNumber ?? p.invoice?.invoiceNumber} ·{" "}
                      {titleCase(p.paymentMethod)} · {formatDate(p.paymentDate)}
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

        <Card>
          <CardHeader
            title="Recent complaints"
            subtitle="Latest 6"
            icon={AlertTriangle}
            action={<ViewAll href="/admin/complaints" />}
          />
          {data.recentComplaints.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No complaints"
              description="Nothing has been reported yet."
              compact
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentComplaints.map((c) => (
                <li key={c.id} className="px-5 py-3.5 transition-colors hover:bg-slate-50/70">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{c.title}</p>
                      <p className="truncate text-xs text-slate-500">
                        {c.flat?.flatNumber} · {titleCase(c.category)} · {c.createdBy?.name}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={c.status} />
                      <StatusBadge status={c.priority} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent notices"
            subtitle="Latest announcements"
            icon={Megaphone}
            action={<ViewAll href="/admin/notices" />}
          />
          {data.recentNotices.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No notices posted"
              description="Post an announcement to reach every resident."
              compact
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentNotices.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/70"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{n.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {titleCase(n.category)} · {n.postedBy?.name}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={n.status} />
                    <span className="tabular text-xs text-slate-400">{n._count?.reads ?? 0} read</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent activity"
            subtitle="Audit trail"
            icon={ShieldCheck}
            action={<ViewAll href="/admin/activity" />}
          />
          {data.recentActivity.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No activity yet"
              description="Administrative changes are recorded here."
              compact
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentActivity.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/70"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-400" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {titleCase(a.action)}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {a.user?.name ?? "System"} · {titleCase(a.entityType)}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs whitespace-nowrap text-slate-400">
                    {formatDate(a.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function ViewAll({ href }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
    >
      View all
      <ArrowUpRight className="size-3.5" />
    </Link>
  );
}
