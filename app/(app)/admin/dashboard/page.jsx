import Link from "next/link";
import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { getAdminDashboard } from "@/lib/queries/dashboard";
import { formatMoney, formatDate, formatPeriod, titleCase } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/Feedback";
import { ProgressRing } from "@/components/ui/Progress";
import LinkRow from "@/components/ui/LinkRow";
import Button from "@/components/ui/Button";
import Welcome from "@/components/dashboard/Welcome";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  CalendarDays,
  CreditCard,
  Plus,
  Wallet,
  Clock,
  AlertTriangle,
  FileText,
  Megaphone,
  ShieldCheck,
  Building2,
  Users,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getServerSession();
  requirePageRole(user, "SOCIETY_ADMIN");

  const data = await getAdminDashboard(user.societyId);
  const { cards, collection } = data;

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const heroBadge = (
    <span className="inline-flex items-center gap-1.5">
      <CalendarDays className="size-4 text-brand-300" />
      {today}
    </span>
  );

  const quickActions = [
    {
      href: "/admin/billing/payments",
      title: "Record payment",
      caption: `${cards.collectedThisMonthCount} received this month`,
      icon: Wallet,
      tone: "green",
    },
    {
      href: "/admin/billing/invoices",
      title: "Raise invoices",
      caption: `${collection.invoiceCount} billed in total`,
      icon: FileText,
      tone: "sky",
    },
    {
      href: "/admin/complaints",
      title: "Open complaints",
      caption:
        cards.urgentComplaints > 0
          ? `${cards.openComplaints} open · ${cards.urgentComplaints} urgent`
          : `${cards.openComplaints} open · nothing urgent`,
      icon: AlertTriangle,
      tone: cards.urgentComplaints > 0 ? "red" : "amber",
      badge: cards.openComplaints > 0 ? `${cards.openComplaints}` : undefined,
    },
    {
      href: "/admin/notices",
      title: "Post a notice",
      caption: "Tell every resident at once",
      icon: Megaphone,
      tone: "violet",
    },
  ];

  const chips = [
    { label: "Total flats", value: cards.totalFlats, hint: `${cards.occupiedFlats} occupied · ${cards.vacantFlats} vacant`, icon: Building2 },
    { label: "Residents", value: cards.totalResidents, hint: "Active resident accounts", icon: Users },
    { label: "Pending dues", value: formatMoney(cards.pending), hint: "Billed but not yet paid", icon: Clock },
    { label: "Overdue", value: formatMoney(cards.overdue), hint: `${cards.overdueInvoiceCount} invoices past due`, icon: AlertTriangle },
  ];

  return (
    <div className="stack">
      <Welcome
        eyebrow="Society administration"
        title="Dashboard"
        description={`${today} · ${collection.collectionRate}% of everything billed has been collected.`}
        badge={heroBadge}
        actions={
          <Button as="a" href="/admin/billing/payments" variant="secondary" size="lg">
            <Plus />
            Record payment
          </Button>
        }
      />

      <Card className="p-6 sm:p-8">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[auto_1fr]">
          <ProgressRing
            value={collection.collectionRate}
            tone={collection.collectionRate >= 90 ? "green" : collection.collectionRate >= 60 ? "amber" : "rose"}
            size={164}
            thickness={14}
            caption="of billed amount collected"
          />

          <div className="w-full min-w-0">
            <p className="label-xs">Collection this month</p>
            <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <p className="text-[13px] text-slate-500">Billed</p>
                <p className="tabular mt-1 text-[26px] leading-none font-semibold text-slate-900">
                  {formatMoney(collection.billed)}
                </p>
              </div>
              <div>
                <p className="text-[13px] text-slate-500">Collected</p>
                <p className="tabular mt-1 text-[26px] leading-none font-semibold text-emerald-600">
                  {formatMoney(collection.collected)}
                </p>
              </div>
              <div>
                <p className="text-[13px] text-slate-500">Outstanding</p>
                <p className="tabular mt-1 text-[26px] leading-none font-semibold text-amber-600">
                  {formatMoney(collection.outstanding)}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-900/5">
                <TrendingUp className="size-5 shrink-0 text-brand-500" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900">
                    {collection.collectionRate}%
                  </p>
                  <p className="text-xs text-slate-500">collection rate</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-900/5 sm:col-span-2">
                <AlertTriangle className="size-5 shrink-0 text-amber-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-slate-900">
                    {formatMoney(cards.overdue)} overdue
                  </p>
                  <p className="text-xs text-slate-500">
                    {cards.overdueInvoiceCount} invoices past due
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <LinkRow
                href="/admin/billing/defaulters"
                title="Review defaulters"
                caption="See which flats are past due"
                icon={ArrowUpRight}
              />
            </div>
          </div>
        </div>
      </Card>

      <QuickActions items={quickActions} />

      <Card className="px-6 py-5 sm:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
          {chips.map((c) => (
            <div key={c.label} className="flex items-start gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <c.icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="label-xs">{c.label}</p>
                <p className="tabular mt-1 truncate text-lg font-semibold text-slate-900">
                  {c.value}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{c.hint}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
                  className="flex items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-slate-50/70"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-slate-900">
                      {p.flat?.block ? `${p.flat.block}-` : ""}
                      {p.flat?.flatNumber}
                      <span className="ml-2 font-normal text-slate-500">
                        {formatPeriod(p.invoice?.billingPeriod)}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-[13px] text-slate-500">
                      {p.receipts?.[0]?.receiptNumber ?? p.invoice?.invoiceNumber} ·{" "}
                      {titleCase(p.paymentMethod)} · {formatDate(p.paymentDate)}
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
                <li key={c.id} className="px-6 py-4 transition-colors hover:bg-slate-50/70">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-slate-900">{c.title}</p>
                      <p className="mt-0.5 truncate text-[13px] text-slate-500">
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
                  className="flex items-start justify-between gap-3 px-6 py-4 transition-colors hover:bg-slate-50/70"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-slate-900">{n.title}</p>
                    <p className="mt-0.5 truncate text-[13px] text-slate-500">
                      {titleCase(n.category)} · {n.postedBy?.name}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={n.status} />
                    <span className="tabular text-[13px] text-slate-400">
                      {n._count?.reads ?? 0} read
                    </span>
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
                  className="flex items-start justify-between gap-3 px-6 py-4 transition-colors hover:bg-slate-50/70"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-slate-400" />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-slate-800">
                        {titleCase(a.action)}
                      </p>
                      <p className="mt-0.5 truncate text-[13px] text-slate-500">
                        {a.user?.name ?? "System"} · {titleCase(a.entityType)}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[13px] whitespace-nowrap text-slate-400">
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
      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
    >
      View all
      <ArrowUpRight className="size-3.5" />
    </Link>
  );
}