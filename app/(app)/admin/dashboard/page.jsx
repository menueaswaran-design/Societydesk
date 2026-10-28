import Link from "next/link";
import { getServerSession } from "@/lib/auth/server";
import { requirePageRole, ADMIN_ROLES } from "@/lib/auth/guard";
import { getAdminDashboard } from "@/lib/queries/dashboard";
import { formatMoney, formatDate, formatPeriod, titleCase } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/Feedback";
import { ProgressRing } from "@/components/ui/Progress";
import LinkRow from "@/components/ui/LinkRow";
import Button from "@/components/ui/Button";
import Welcome from "@/components/dashboard/Welcome";
import Avatar from "@/components/ui/Avatar";
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
  BedSingle,
  DoorOpen,
  Phone,
  ArrowRight,
} from "lucide-react";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getServerSession();
  requirePageRole(user, ADMIN_ROLES);

  const data = await getAdminDashboard(user.societyId);
  const { cards, collection } = data;
  const isPg = data.workspaceType === "PG";
  const society = data.society;
  const hasBankDetails = Boolean(society?.upiId || society?.bankAccountNo);
  const hasAddress = Boolean(society?.address && society?.city);
  const isProfileIncomplete = !hasBankDetails || !hasAddress;

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

  const quickActions = isPg
    ? [
        {
          href: "/admin/rooms",
          title: "Rooms & Beds",
          caption: `${cards.vacantBeds} beds available now`,
          icon: BedSingle,
          tone: "brand",
        },
        {
          href: "/admin/residents",
          title: "Residents & Check-in",
          caption: `${cards.activeOccupants} currently staying`,
          icon: Users,
          tone: "sky",
        },
        {
          href: "/admin/billing/invoices",
          title: "Generate Rent Invoices",
          caption: `${collection.invoiceCount} billed to date`,
          icon: FileText,
          tone: "blue",
        },
        {
          href: "/admin/deposits",
          title: "Security Deposits",
          caption: `${formatMoney(cards.totalDepositsHeld)} held safely`,
          icon: ShieldCheck,
          tone: "green",
        },
      ]
    : [
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
              : `${cards.openComplaints} open`,
          icon: AlertTriangle,
          tone: cards.urgentComplaints > 0 ? "red" : "amber",
          badge: cards.openComplaints > 0 ? `${cards.openComplaints}` : undefined,
        },
        {
          href: "/admin/notices",
          title: "Post a notice",
          caption: "Broadcast to all members",
          icon: Megaphone,
          tone: "violet",
        },
      ];

  const chips = isPg
    ? [
        {
          label: "Rooms & Beds",
          value: `${cards.totalBeds} beds`,
          hint: `${cards.occupiedBeds} occupied · ${cards.vacantBeds} vacant`,
          icon: BedSingle,
        },
        {
          label: "Occupancy Rate",
          value: `${cards.occupancyRate}%`,
          hint: `${cards.activeOccupants} active residents`,
          icon: Users,
        },
        {
          label: "Security Deposits",
          value: formatMoney(cards.totalDepositsHeld),
          hint: "Held under management",
          icon: ShieldCheck,
        },
        {
          label: "Overdue Rent",
          value: formatMoney(cards.overdue),
          hint: `${cards.overdueInvoiceCount} invoices past due`,
          icon: AlertTriangle,
        },
      ]
    : [
        { label: "Total flats", value: cards.totalFlats, hint: `${cards.occupiedFlats} occupied · ${cards.vacantFlats} vacant`, icon: Building2 },
        { label: "Residents", value: cards.totalResidents, hint: "Active resident accounts", icon: Users },
        { label: "Pending dues", value: formatMoney(cards.pending), hint: "Billed but not yet paid", icon: Clock },
        { label: "Overdue", value: formatMoney(cards.overdue), hint: `${cards.overdueInvoiceCount} invoices past due`, icon: AlertTriangle },
      ];

  return (
    <div className="stack">
      <Welcome
        eyebrow={isPg ? "PG & Hostel Management" : "Society administration"}
        title="Dashboard"
        description={isPg ? "Overview of live bed occupancy, monthly rent collections, and resident operations." : "Overview of flats, maintenance billing, and society operations."}
        badge={heroBadge}
        actions={
          <div className="flex items-center gap-2">
            <Button as="a" href="/admin/residents" variant="secondary" size="lg">
              <Plus />
              {isPg ? "Check-in Resident" : "Add Resident"}
            </Button>
            <Button as="a" href="/admin/billing/payments" variant="primary" size="lg">
              <Wallet />
              Record payment
            </Button>
          </div>
        }
      />

      {/* Incomplete Bank & Property Details Warning */}
      {isProfileIncomplete && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50 via-amber-50/60 to-orange-50/40 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-amber-950">
                    Property Profile & Payout Setup Required
                  </h4>
                  <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[11px] font-bold text-amber-900 ring-1 ring-amber-600/30">
                    Action Required
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-900/80 leading-relaxed max-w-2xl">
                  {!hasBankDetails && !hasAddress
                    ? "Bank / UPI payout details and property address were omitted during onboarding. Configure your UPI ID or Bank Account so tenants can pay rent via QR codes, and add your address for invoice headers."
                    : !hasBankDetails
                    ? "UPI ID and Bank Account details are not configured yet. Tenants will not be able to pay rent via UPI QR codes until your payout details are saved."
                    : "Property address and city are missing. Update your address to ensure correct details appear on rent receipts and invoices."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <Button
                as="a"
                href="/admin/billing/configuration"
                variant="primary"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs"
              >
                Configure Details
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Move-outs notice for PG */}
      {isPg && data.upcomingMoveOuts?.length > 0 ? (
        <Card className="overflow-hidden border-2 border-amber-200/90 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-200/60">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs font-bold">
                <DoorOpen className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Tenants Serving Notice Period
                  </h3>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 ring-1 ring-amber-600/30">
                    {data.upcomingMoveOuts.length} Vacating Soon
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Tenants who have requested move-out or are serving notice. Review their deposit settlements and room turnarounds.
                </p>
              </div>
            </div>

            <Link
              href="/admin/residents?status=NOTICE"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-all shrink-0 self-start sm:self-auto"
            >
              Manage All in Residents
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {data.upcomingMoveOuts.map((occ) => {
              const daysLeft = occ.leaveDate
                ? Math.max(0, Math.ceil((new Date(occ.leaveDate) - new Date()) / (1000 * 60 * 60 * 24)))
                : null;
              const depositHeld = occ.deposits?.[0]?.amountReceived || occ.depositAmount || 0;

              return (
                <Link
                  key={occ.id}
                  href="/admin/residents?status=NOTICE"
                  className={`group relative flex flex-col justify-between rounded-xl border p-4 bg-white shadow-2xs transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    daysLeft !== null && daysLeft <= 7
                      ? "border-rose-300 ring-1 ring-rose-500/20 hover:border-rose-400"
                      : daysLeft !== null && daysLeft <= 15
                      ? "border-amber-300 ring-1 ring-amber-500/20 hover:border-amber-400"
                      : "border-yellow-300 ring-1 ring-yellow-500/20 hover:border-yellow-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={occ.user?.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 group-hover:text-primary-700 transition-colors truncate">
                          {occ.user?.name}
                        </p>
                        <p className="text-xs text-slate-500 font-medium truncate">
                          Room {occ.unit?.unitNumber || "-"} · Bed {occ.bed?.bedLabel || "-"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold shrink-0 ${
                        daysLeft !== null && daysLeft <= 7
                          ? "bg-rose-100 text-rose-800 ring-1 ring-rose-600/30"
                          : daysLeft !== null && daysLeft <= 15
                          ? "bg-amber-100 text-amber-800 ring-1 ring-amber-600/30"
                          : "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600/30"
                      }`}
                    >
                      {daysLeft !== null && daysLeft <= 7 ? "🔴" : daysLeft !== null && daysLeft <= 15 ? "🟠" : "🟡"}{" "}
                      {daysLeft !== null ? `${daysLeft}d left` : "On Notice"}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10.5px] text-slate-400 block font-medium">Leave Date</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {occ.leaveDate ? formatDate(occ.leaveDate) : "Pending"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10.5px] text-slate-400 block font-medium">Deposit Held</span>
                      <span className="font-bold text-emerald-700 text-xs">
                        {depositHeld > 0 ? formatMoney(depositHeld) : "Recorded"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-amber-700 group-hover:text-amber-800">
                    <span>Settle & Check-out</span>
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      ) : null}

      <Card className="p-5 sm:p-6">
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[auto_1fr]">
          <ProgressRing
            value={collection.collectionRate}
            tone={collection.collectionRate >= 90 ? "green" : collection.collectionRate >= 60 ? "amber" : "rose"}
            size={144}
            thickness={12}
            caption="of billed amount collected"
          />

          <div className="w-full min-w-0">
            <p className="label-xs">{isPg ? "Rent Collection This Month" : "Collection this month"}</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3.5 shadow-2xs">
                <p className="text-xs font-semibold text-slate-500">Billed</p>
                <p className="tabular mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                  {formatMoney(collection.billed)}
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-3.5 shadow-2xs">
                <p className="text-xs font-semibold text-emerald-800">Collected</p>
                <p className="tabular mt-1 text-2xl font-extrabold tracking-tight text-emerald-700">
                  {formatMoney(collection.collected)}
                </p>
              </div>
              <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-3.5 shadow-2xs">
                <p className="text-xs font-semibold text-amber-800">Outstanding</p>
                <p className="tabular mt-1 text-2xl font-extrabold tracking-tight text-amber-700">
                  {formatMoney(collection.outstanding)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {collection.invoiceCount} invoices generated this month ({collection.collectionRate}% collected)
                </span>
              </div>
              <Link
                href="/admin/billing/invoices"
                className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                <span>View all invoices</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <QuickActions items={quickActions} />

      <Card className="px-5 py-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {chips.map((c) => (
            <div key={c.label} className="flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50/80">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80 shadow-2xs">
                <c.icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="tabular text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                  {c.value}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 leading-normal">{c.hint}</p>
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
              {data.recentPayments.map((p) => {
                const targetLabel = p.occupancy
                  ? `Room ${p.occupancy.unit?.unitNumber || "-"}${p.occupancy.bed ? ` (${p.occupancy.bed.bedLabel})` : ""}`
                  : `${p.flat?.block ? `${p.flat.block}-` : ""}${p.flat?.flatNumber || "-"}`;
                const residentName = p.occupancy?.user?.name || null;

                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-slate-50/70"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-slate-900">
                        {targetLabel}
                        {residentName ? (
                          <span className="ml-1.5 text-xs font-normal text-slate-600">
                            · {residentName}
                          </span>
                        ) : null}
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
                );
              })}
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
              {data.recentComplaints.map((c) => {
                const locationLabel = c.unit
                  ? `Room ${c.unit.unitNumber}${c.bed ? ` (${c.bed.bedLabel})` : ""}`
                  : c.flat?.flatNumber || "PG";

                return (
                  <li key={c.id} className="px-6 py-4 transition-colors hover:bg-slate-50/70">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-slate-900">{c.title}</p>
                        <p className="mt-0.5 truncate text-[13px] text-slate-500">
                          {locationLabel} · {titleCase(c.category)} · {c.createdBy?.name}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={c.status} />
                        <StatusBadge status={c.priority} />
                      </div>
                    </div>
                  </li>
                );
              })}
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
