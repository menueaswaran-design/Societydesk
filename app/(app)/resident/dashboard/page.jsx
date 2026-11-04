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
import ResidentNoticeModal from "@/components/resident/ResidentNoticeModal";
import MobilePushPromptBanner from "@/components/notifications/MobilePushPromptBanner";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  Wallet,
  AlertTriangle,
  AlertCircle,
  Clock,
  Calendar,
  Megaphone,
  CreditCard,
  FileText,
  Home,
  CheckCircle2,
  Check,
  ArrowUpRight,
  Receipt,
  BedSingle,
  ShieldCheck,
  DoorOpen,
  Zap,
  Utensils,
  Wrench,
  Sparkles,
  Droplets,
} from "lucide-react";

export const metadata = { title: "My Dashboard" };
export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getChargeMeta(type) {
  switch (type?.toUpperCase()) {
    case "ELECTRICITY":
      return {
        label: "Electricity",
        icon: Zap,
        bg: "bg-amber-50 text-amber-600 border-amber-200",
        badge: "bg-amber-100 text-amber-800",
      };
    case "FOOD":
      return {
        label: "Food / Mess",
        icon: Utensils,
        bg: "bg-emerald-50 text-emerald-600 border-emerald-200",
        badge: "bg-emerald-100 text-emerald-800",
      };
    case "MAINTENANCE":
      return {
        label: "Maintenance",
        icon: Wrench,
        bg: "bg-sky-50 text-sky-600 border-sky-200",
        badge: "bg-sky-100 text-sky-800",
      };
    case "LAUNDRY":
      return {
        label: "Laundry",
        icon: Sparkles,
        bg: "bg-purple-50 text-purple-600 border-purple-200",
        badge: "bg-purple-100 text-purple-800",
      };
    case "WATER":
      return {
        label: "Water",
        icon: Droplets,
        bg: "bg-blue-50 text-blue-600 border-blue-200",
        badge: "bg-blue-100 text-blue-800",
      };
    case "RENT":
      return {
        label: "Room Rent",
        icon: Home,
        bg: "bg-indigo-50 text-indigo-600 border-indigo-200",
        badge: "bg-indigo-100 text-indigo-800",
      };
    default:
      return {
        label: "Charge",
        icon: Receipt,
        bg: "bg-slate-50 text-slate-600 border-slate-200",
        badge: "bg-slate-100 text-slate-800",
      };
  }
}

function ViewAll({ href }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 transition-colors hover:text-brand-800"
    >
      View all
      <ArrowUpRight className="size-4" />
    </Link>
  );
}

export default async function ResidentDashboardPage() {
  const user = await getServerSession();
  requirePageRole(user, "RESIDENT");

  const data = await getResidentDashboard(user);

  const flatById = new Map((data.flats || []).map((f) => [f.id, f]));
  const labelFor = (flat, fallback) => {
    const f = flat ? flatById.get(flat) : null;
    if (!f) return fallback ?? "";
    return f.block ? `${f.block}-${f.flatNumber}` : f.flatNumber;
  };

  const primaryOccupancy = data.primaryOccupancy;
  const isPgResident = !!primaryOccupancy;
  const isNotice = primaryOccupancy?.status === "NOTICE";
  const daysLeft = primaryOccupancy?.leaveDate
    ? Math.max(0, Math.ceil((new Date(primaryOccupancy.leaveDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  let unitLabel = "";
  if (isPgResident) {
    unitLabel = `Room ${primaryOccupancy.unit?.unitNumber} · Bed ${primaryOccupancy.bed?.bedLabel}`;
    if (primaryOccupancy.unit?.building?.name) {
      unitLabel = `${primaryOccupancy.unit.building.name} - ${unitLabel}`;
    }
  }

  const flatLabels = (data.flats || []).map((f) => (f.block ? `${f.block}-${f.flatNumber}` : f.flatNumber));
  const firstName = user.name.split(" ")[0];

  const due = data.currentDue;
  const dueLabel = due?.occupancy
    ? `Room ${due.occupancy.unit?.unitNumber} · Bed ${due.occupancy.bed?.bedLabel}`
    : due?.flatId
    ? labelFor(due.flatId, due.flat?.flatNumber)
    : unitLabel || "";

  const paidPct =
    due && due.totalAmount > 0 ? Math.round((due.paidAmount / due.totalAmount) * 100) : 100;

  const hasLinkedUnit = (data.flats && data.flats.length > 0) || (data.occupancies && data.occupancies.length > 0);

  const quickActions = [
    {
      href: "/resident/invoices",
      title: isPgResident ? "Pay rent & bills" : "Pay maintenance",
      caption: due ? `${formatMoney(due.outstanding)} payable` : "All dues are cleared",
      icon: Wallet,
      tone: due ? (due.isOverdue ? "red" : "amber") : "green",
      badge: due ? "Pay now" : "Clear",
    },
    {
      href: "/resident/complaints",
      title: "Raise a complaint",
      caption:
        data.activeComplaints?.length > 0
          ? `${data.activeComplaints.length} active tickets`
          : "Something needs fixing?",
      icon: AlertTriangle,
      tone: data.activeComplaints?.length > 0 ? "red" : "brand",
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
      href: "/resident/invoices?filter=PAID",
      title: "Payment receipts",
      caption: "View and download receipts",
      icon: Receipt,
      tone: "sky",
    },
  ];

  return (
    <div className="stack">
      {/* Redesigned Resident Welcome Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
        {/* Subtle decorative ambient mesh */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-12 size-64 rounded-full bg-brand-50/70 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 left-1/4 size-60 rounded-full bg-emerald-50/50 blur-3xl"
        />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            {/* Meta chips row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-700 ring-1 ring-slate-200/80">
                <Home className="size-3.5 text-slate-500" />
                {unitLabel || flatLabels.join(", ") || "Your Room"}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {data.unreadNoticeCount > 0
                  ? `${data.unreadNoticeCount} new notices`
                  : "All caught up"}
              </span>

              {isNotice && daysLeft !== null && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-300">
                  <Clock className="size-3.5 text-amber-600" />
                  On Notice ({daysLeft}d left)
                </span>
              )}
            </div>

            {/* Greeting & Subtitle */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {greeting()}, {firstName} 👋
              </h1>
              <p className="mt-1 text-xs sm:text-[13px] text-slate-500 font-medium max-w-xl leading-relaxed">
                {hasLinkedUnit
                  ? isPgResident
                    ? "Everything you need for your PG stay in one place."
                    : "Everything you need for your home in one place."
                  : "Your resident portal"}
              </p>
            </div>
          </div>

          {/* Action Pills */}
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            {due ? (
              <PayCheckoutButton
                invoiceId={due.id}
                invoiceNumber={due.invoiceNumber}
                amount={due.outstanding}
                flatLabel={dueLabel}
                size="md"
                label="Pay now"
              />
            ) : (
              <Button as="a" href="/resident/invoices" variant="secondary" size="md">
                <Receipt className="size-4 text-slate-500" />
                View invoices
              </Button>
            )}

            {isPgResident && (
              <Button
                as="a"
                href="/resident/vacate"
                variant="outline"
                size="md"
                className={
                  isNotice
                    ? "!border-amber-300 !bg-amber-50 !text-amber-900 font-bold hover:!bg-amber-100"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                }
              >
                <DoorOpen className={`size-4 ${isNotice ? "text-amber-600" : "text-slate-500"}`} />
                {isNotice ? `On Notice (${daysLeft}d left)` : "Vacate PG / Notice"}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Mobile Push Notification Opt-in Prompt */}
      <MobilePushPromptBanner user={user} />

      {/* Verification / KYC Notification Banner */}
      {!data.kycStatus?.isComplete ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50 to-orange-50/70 p-4 text-amber-950 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-2xs font-bold">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Action Required: Tenant Verification Incomplete
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Please upload your <strong>Aadhaar Card</strong> (or valid Govt ID) and <strong>PAN Card</strong> for tenant verification records.
              </p>
            </div>
          </div>
          <Link
            href="/resident/profile#documents"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-2xs shrink-0"
          >
            Upload Documents →
          </Link>
        </div>
      ) : null}

      {!hasLinkedUnit ? (
        <Card>
          <EmptyState
            icon={Home}
            title="No room or flat is linked to your account"
            description={data.message || "Contact your PG owner or admin to link your accommodation."}
          />
        </Card>
      ) : (
        <>
          {/* PG Stay & Deposit Summary Card */}
          {isPgResident && (
            <div className="space-y-4">
              {/* Active Notice Status Banner */}
              {isNotice ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 p-4 sm:p-5 shadow-xs">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs">
                      <DoorOpen className="size-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-300">
                          <span className="size-2 rounded-full bg-amber-600 animate-pulse" />
                          Notice Period Active
                        </span>
                        <span className="text-xs font-bold text-amber-900">
                          {daysLeft !== null ? `${daysLeft} days remaining` : "Notice served"}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        Move-out scheduled for <strong>{formatDate(primaryOccupancy.leaveDate)}</strong>
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        PG owner has been notified. They will inspect the room and initiate security deposit settlement upon vacating.
                      </p>
                    </div>
                  </div>
                  <ResidentNoticeModal occupancy={primaryOccupancy} />
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 bg-white shadow-sm border border-slate-100 flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                      <BedSingle className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Assigned Room</p>
                      <p className="text-base font-bold text-slate-900 mt-0.5">
                        Room {primaryOccupancy.unit?.unitNumber} · Bed {primaryOccupancy.bed?.bedLabel}
                      </p>
                      <p className="text-xs text-slate-500">
                        {primaryOccupancy.unit?.ac ? "AC" : "Non-AC"} · {primaryOccupancy.unit?.unitType || "Sharing"}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {isNotice ? "Move-out Scheduled" : "Vacating this PG?"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href="/resident/vacate"
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-300 px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-2xs"
                      >
                        <DoorOpen className="size-3.5 text-amber-700" />
                        {isNotice ? `Manage (${daysLeft}d)` : "Vacate / Notice →"}
                      </Link>
                    </div>
                  </div>
                </Card>

              <Card className="p-4 bg-white shadow-sm border border-slate-100 flex flex-col justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Security Deposit</p>
                    <p className="text-base font-bold text-slate-900 mt-0.5">
                      {data.depositStatus ? formatMoney(data.depositStatus.amount) : "Recorded"}
                    </p>
                    <p className="text-xs text-emerald-600 font-medium">
                      Status: {data.depositStatus?.status || "HELD"} (Refundable)
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Refund Policy</span>
                  <Link
                    href="/resident/vacate"
                    className="text-xs font-bold text-blue-700 hover:text-blue-800"
                  >
                    View Settlement →
                  </Link>
                </div>
              </Card>

              <Card className="p-4 bg-white shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Monthly Rent</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {formatMoney(primaryOccupancy.monthlyRent)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Joined on {formatDate(primaryOccupancy.joinDate)}
                  </p>
                </div>
              </Card>
              </div>
            </div>
          )}

          {due ? (
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-200 hover:shadow-sm">
              {/* Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex size-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
                    <Receipt className="size-3.5" />
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    Invoice #{due.invoiceNumber}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-500 font-medium">
                    {formatPeriod(due.billingPeriod)}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-700 font-semibold inline-flex items-center gap-1">
                    <Home className="size-3 text-slate-400" />
                    {dueLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={due.isOverdue ? "OVERDUE" : due.status} />
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <Clock className="size-3.5 text-slate-400" />
                    Due {formatDate(due.dueDate)}
                  </span>
                </div>
              </div>

              {/* Main Content: 2-Panel Balance */}
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                {/* Left Panel: Amount & Payment (5 cols) */}
                <div className="p-5 sm:p-6 lg:col-span-5 flex flex-col justify-between bg-gradient-to-b from-slate-50/50 to-white">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Total Amount Payable
                    </span>
                    <p className={`tabular text-3xl sm:text-4xl font-extrabold tracking-tight mt-1.5 ${
                      due.isOverdue ? "text-rose-600" : "text-emerald-700"
                    }`}>
                      {formatMoney(due.outstanding)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 font-medium">
                      {due.isOverdue ? "Payment is overdue · Please clear your dues" : "Due on or before the 5th of this month"}
                    </p>
                  </div>

                  <div className="mt-5 space-y-2">
                    <div className="w-full [&>button]:w-full">
                      <PayCheckoutButton
                        invoiceId={due.id}
                        invoiceNumber={due.invoiceNumber}
                        amount={due.outstanding}
                        flatLabel={dueLabel}
                        size="lg"
                        label="Pay now"
                      />
                    </div>
                    <Link
                      href="/resident/invoices"
                      className="inline-flex h-10.5 w-full items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-brand-700 hover:border-slate-300 transition-all select-none"
                    >
                      <FileText className="size-4 text-slate-400" />
                      <span>View All Invoices</span>
                      <ArrowUpRight className="size-4 text-slate-400" />
                    </Link>
                  </div>
                </div>

                {/* Right Panel: Clean Charges Table (7 cols) */}
                <div className="p-5 sm:p-6 lg:col-span-7 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Itemized Charges
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {due.items?.length || 1} line item{due.items?.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2.5 text-xs">
                      {due.items && due.items.length > 0 ? (
                        due.items.map((it) => {
                          const meta = getChargeMeta(it.type);
                          const Icon = meta.icon;
                          return (
                            <div key={it.id} className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-2 min-w-0 text-slate-800 font-medium">
                                <span className={`flex size-6 shrink-0 items-center justify-center rounded-lg border shadow-2xs ${meta.bg}`}>
                                  <Icon className="size-3.5" />
                                </span>
                                <span className="truncate">{it.name}</span>
                              </span>
                              <span className="tabular font-bold text-slate-900 shrink-0 text-xs sm:text-[13px]">
                                {formatMoney(it.amount)}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center justify-between font-medium text-slate-700">
                          <span>Base Rent / Maintenance</span>
                          <span className="tabular font-bold text-slate-900">
                            {formatMoney(due.subtotal || due.totalAmount)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Adjustments: Arrears, Late Fee, Discount, Paid */}
                    {(due.previousDue > 0 || due.penalty > 0 || due.discount > 0 || due.paidAmount > 0) && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                        {due.previousDue > 0 && (
                          <div className="flex items-center justify-between text-amber-800 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="size-1.5 rounded-full bg-amber-500" />
                              Previous Unpaid Dues
                            </span>
                            <span className="tabular font-semibold">+{formatMoney(due.previousDue)}</span>
                          </div>
                        )}
                        {due.penalty > 0 && (
                          <div className="flex items-center justify-between text-rose-700 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="size-1.5 rounded-full bg-rose-500" />
                              Late Payment Penalty
                            </span>
                            <span className="tabular font-semibold">+{formatMoney(due.penalty)}</span>
                          </div>
                        )}
                        {due.discount > 0 && (
                          <div className="flex items-center justify-between text-emerald-700 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Concession / Discount
                            </span>
                            <span className="tabular font-semibold">-{formatMoney(due.discount)}</span>
                          </div>
                        )}
                        {due.paidAmount > 0 && (
                          <div className="flex items-center justify-between text-emerald-800 font-medium">
                            <span>Already Paid</span>
                            <span className="tabular font-semibold">-{formatMoney(due.paidAmount)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Net Payable Summary Row */}
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs sm:text-sm font-extrabold">
                    <span className="text-slate-700 uppercase tracking-wide text-[11px]">
                      Net Amount Payable
                    </span>
                    <span className={`tabular text-base sm:text-lg ${
                      due.isOverdue ? "text-rose-600" : "text-emerald-700"
                    }`}>
                      {formatMoney(due.outstanding)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Card className="flex flex-col items-start gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
              <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/15">
                <CheckCircle2 className="size-7" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-semibold text-slate-900">You are all settled</p>
                <p className="mt-1 text-[15px] text-slate-500">
                  {isPgResident
                    ? "No pending rent or dues for your room right now. New bills will appear here automatically."
                    : "No pending maintenance for your home right now. New invoices will appear here automatically."}
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
                  {data.notices.slice(0, 3).map((n) => (
                    <li key={n.id}>
                      <Link
                        href="/resident/notices"
                        className="flex items-start justify-between gap-3 px-6 py-4 transition-colors hover:bg-slate-50/70 block"
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
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Recent payments"
                subtitle="Latest receipts"
                icon={CreditCard}
                action={<ViewAll href="/resident/invoices?filter=PAID" />}
              />
              {data.recentPayments.length === 0 ? (
                <EmptyState icon={Receipt} title="No payments recorded yet" compact />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.recentPayments.slice(0, 3).map((p) => (
                    <li key={p.id}>
                      <Link
                        href="/resident/invoices?filter=PAID"
                        className="flex items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-slate-50/70 block"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold text-slate-900">
                            {p.receipts?.[0]?.receiptNumber || p.invoice?.invoiceNumber || "Payment"}
                          </p>
                          <p className="mt-0.5 truncate text-[13px] text-slate-500">
                            {formatDate(p.paymentDate)} · {p.invoice?.billingPeriod ? formatPeriod(p.invoice.billingPeriod) : "Direct"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="tabular text-sm font-bold text-emerald-600">
                            {formatMoney(p.amount)}
                          </p>
                          <p className="text-[11px] text-slate-400 capitalize">{p.paymentMethod?.toLowerCase()}</p>
                        </div>
                      </Link>
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
