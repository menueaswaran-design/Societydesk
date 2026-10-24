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
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  Wallet,
  AlertTriangle,
  Megaphone,
  CreditCard,
  FileText,
  Home,
  CheckCircle2,
  ArrowUpRight,
  Receipt,
  BedSingle,
  ShieldCheck,
  DoorOpen,
} from "lucide-react";

export const metadata = { title: "My Dashboard" };
export const dynamic = "force-dynamic";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
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
      href: "/resident/payments",
      title: "Payment receipts",
      caption: "View and download receipts",
      icon: Receipt,
      tone: "sky",
    },
    {
      href: "/resident/profile#documents",
      title: "KYC Verification",
      caption: data.kycStatus?.isComplete ? "Identity verified" : "Aadhaar & PAN required",
      icon: ShieldCheck,
      tone: data.kycStatus?.isComplete ? "green" : "amber",
      badge: data.kycStatus?.isComplete ? "Verified" : "Action Needed",
    },
  ];

  return (
    <div className="stack">
      <Welcome
        eyebrow={unitLabel || flatLabels.join(", ") || "Your home"}
        title={`${greeting()}, ${firstName}`}
        description={
          hasLinkedUnit
            ? isPgResident
              ? "Everything you need for your PG stay in one place."
              : "Everything you need for your home in one place."
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
              flatLabel={dueLabel}
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
                    <span className="text-[11px] text-slate-400 font-medium">
                      {isNotice ? "On Notice Period" : "Planning to leave?"}
                    </span>
                    <ResidentNoticeModal occupancy={primaryOccupancy} />
                  </div>
                </Card>

              <Card className="p-4 bg-white shadow-sm border border-slate-100 flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Security Deposit</p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {data.depositStatus ? formatMoney(data.depositStatus.amount) : "Recorded"}
                  </p>
                  <p className="text-xs text-emerald-600 font-medium">
                    Status: {data.depositStatus?.status || "HELD"} (Refundable at move-out)
                  </p>
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
                  <p className="label-xs">{isPgResident ? "Your rent bill" : "Your maintenance"}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    Invoice {due.invoiceNumber}
                  </p>
                  <p className="mt-0.5 text-[13px] text-slate-500">
                    {formatPeriod(due.billingPeriod)} · {dueLabel} · Due {formatDate(due.dueDate)}
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
                    flatLabel={dueLabel}
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
                <EmptyState icon={Receipt} title="No payments recorded yet" compact />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.recentPayments.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-slate-50/70"
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
