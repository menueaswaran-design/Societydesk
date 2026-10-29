"use client";

import { useState } from "react";
import Link from "next/link";
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
  CheckCircle2,
  MessageCircle,
  X,
  Sparkles,
} from "lucide-react";
import { formatMoney, formatDate, formatPeriod, titleCase } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/Feedback";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import {
  getWhatsAppUrl,
  buildRentReminderMessage,
  buildDefaulterNoticeMessage,
} from "@/lib/billing/whatsapp";

export default function AdminDashboardClient({ data, user }) {
  const { cards, collection, society, pendingInvoices = [], bedsGrid = [] } = data;
  const isPg = data.workspaceType === "PG";
  const hasBankDetails = Boolean(society?.upiId || society?.bankAccountNo);
  const hasAddress = Boolean(society?.address && society?.city);
  const isProfileIncomplete = !hasBankDetails || !hasAddress;

  const [dismissProfileWarning, setDismissProfileWarning] = useState(false);
  const [dismissNoticeBanner, setDismissNoticeBanner] = useState(false);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Calculate upcoming move-outs and filter ONLY those departing in <= 2 days
  const upcomingMoveOuts = data.upcomingMoveOuts || [];
  const urgentMoveOuts = upcomingMoveOuts.filter((occ) => {
    if (!occ.leaveDate) return false;
    const days = Math.ceil((new Date(occ.leaveDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= 2; // only urgent departures (today, tomorrow, or in 2 days)
  });

  // Notice count for general notice periods (e.g. 26d left)
  const noticeCount = upcomingMoveOuts.length;

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER / WELCOME COMMAND CARD ────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-brand p-6 sm:p-7 text-white shadow-soft">
        {/* Ambient subtle decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 size-48 rounded-full bg-brand-400/20 blur-xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold text-brand-100 backdrop-blur-xs">
                <CalendarDays className="size-3.5" />
                {today}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-200">
                {society?.name ?? (isPg ? "PG Operations" : "Property Portal")}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Operations Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-brand-100/90 leading-relaxed">
              Track pending & overdue rent collections, monitor live bed availability, and manage daily operations.
            </p>
          </div>

          {/* Quick Action Buttons Directly in Header */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              as="a"
              href="/admin/residents"
              variant="secondary"
              size="md"
              className="bg-white text-brand-700 hover:bg-brand-50 shadow-sm border-0 font-bold"
            >
              <Plus className="size-4" />
              {isPg ? "Check-in Resident" : "Add Resident"}
            </Button>
            <Button
              as="a"
              href="/admin/billing/payments"
              variant="primary"
              size="md"
              className="bg-brand-800/80 hover:bg-brand-900 text-white border border-white/20 font-bold shadow-sm"
            >
              <Wallet className="size-4" />
              Record Payment
            </Button>
            <Button
              as="a"
              href="/admin/billing/invoices"
              variant="ghost"
              size="md"
              className="text-white hover:bg-white/15 border border-white/20 text-xs font-semibold"
            >
              <FileText className="size-4" />
              Invoices
            </Button>
          </div>
        </div>
      </div>

      {/* ── DISMISSIBLE INCOMPLETE PROFILE ALERT (COMPACT) ───────────────── */}
      {isProfileIncomplete && !dismissProfileWarning && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-2.5 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
              <AlertTriangle className="size-4" />
            </span>
            <p className="truncate font-medium">
              <strong className="font-bold">Setup Required:</strong>{" "}
              {!hasBankDetails
                ? "Configure your UPI ID or Bank Account so tenants can pay rent via QR codes."
                : "Add your property address for official invoices & receipts."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/admin/billing/configuration"
              className="font-bold text-amber-800 underline hover:text-amber-950"
            >
              Configure Details →
            </Link>
            <button
              type="button"
              onClick={() => setDismissProfileWarning(true)}
              className="p-1 text-amber-600 hover:text-amber-900 rounded-md hover:bg-amber-100"
              title="Dismiss warning"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── CRITICAL MOVE-OUT ALERT (SHOWN ONLY WITHIN 2 DAYS BEFORE LEAVING) ── */}
      {urgentMoveOuts.length > 0 && !dismissNoticeBanner && (
        <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-3.5 text-xs text-rose-950 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white">
                <DoorOpen className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-rose-900">
                  Immediate Departure Alert ({urgentMoveOuts.length} vacating in ≤ 2 days)
                </p>
                <p className="text-rose-800 truncate mt-0.5">
                  {urgentMoveOuts.map((occ) => {
                    const days = Math.ceil(
                      (new Date(occ.leaveDate) - new Date()) / (1000 * 60 * 60 * 24)
                    );
                    const dayLabel = days <= 0 ? "today" : days === 1 ? "tomorrow" : "in 2 days";
                    return `${occ.user?.name} (Room ${occ.unit?.unitNumber || "-"}${occ.bed ? ` · ${occ.bed.bedLabel}` : ""}) leaves ${dayLabel}`;
                  }).join(" · ")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/admin/residents?status=NOTICE"
                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition"
              >
                <span>Settle Deposit & Checkout</span>
                <ArrowRight className="size-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setDismissNoticeBanner(true)}
                className="p-1 text-rose-600 hover:text-rose-900 rounded-md hover:bg-rose-100"
                title="Dismiss"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP OPERATIONAL KEY METRICS (STAT GRID PER DESIGN SYSTEM) ───── */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        {/* Card 1: Overdue Rent (MAIN MOTIVE - PRIORITY 1) */}
        <Link
          href="/admin/billing/defaulters"
          className="group relative rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-2xs hover:border-error-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Overdue Rent
            </span>
            <span
              className={`flex size-8 items-center justify-center rounded-xl ${
                cards.overdue > 0
                  ? "bg-error-50 text-error-600 ring-1 ring-error-600/20"
                  : "bg-neutral-100 text-neutral-500"
              }`}
            >
              <AlertTriangle className="size-4" />
            </span>
          </div>
          <p
            className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight ${
              cards.overdue > 0 ? "text-error-600" : "text-neutral-900"
            }`}
          >
            {formatMoney(cards.overdue)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span
              className={
                cards.overdue > 0
                  ? "font-semibold text-error-700"
                  : "text-neutral-500"
              }
            >
              {cards.overdueInvoiceCount > 0
                ? `${cards.overdueInvoiceCount} invoices past due`
                : "Zero overdue rent"}
            </span>
            <ArrowUpRight className="size-3.5 text-neutral-400 group-hover:text-error-600 transition" />
          </div>
        </Link>

        {/* Card 2: Pending Rent (Awaiting Payment this month) */}
        <Link
          href="/admin/billing/invoices?status=PENDING"
          className="group relative rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-2xs hover:border-warning-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Pending Dues
            </span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-warning-50 text-warning-700 ring-1 ring-warning-600/20">
              <Clock className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
            {formatMoney(cards.pending)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-neutral-500">
              {collection.outstanding > 0
                ? `${formatMoney(collection.outstanding)} uncollected`
                : "All current invoices cleared"}
            </span>
            <ArrowUpRight className="size-3.5 text-neutral-400 group-hover:text-warning-600 transition" />
          </div>
        </Link>

        {/* Card 3: Rent Collected This Month */}
        <Link
          href="/admin/billing/payments"
          className="group relative rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-2xs hover:border-success-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Rent Collected
            </span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-success-50 text-success-700 ring-1 ring-success-600/20">
              <Wallet className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-success-700">
            {formatMoney(collection.collected)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-neutral-500">
              <strong className="font-bold text-neutral-800">{collection.collectionRate}%</strong> of{" "}
              {formatMoney(collection.billed)} billed
            </span>
            <ArrowUpRight className="size-3.5 text-neutral-400 group-hover:text-success-600 transition" />
          </div>
        </Link>

        {/* Card 4: Live Bed Occupancy */}
        <Link
          href="/admin/rooms"
          className="group relative rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-2xs hover:border-brand-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Bed Occupancy
            </span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-600/20">
              <BedSingle className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-700">
            {cards.occupancyRate}%
          </p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-neutral-500">
              <strong className="font-bold text-success-700">{cards.vacantBeds} vacant</strong>{" "}
              · {cards.occupiedBeds} occupied
              {noticeCount > 0 ? ` · ${noticeCount} notice` : ""}
            </span>
            <ArrowUpRight className="size-3.5 text-neutral-400 group-hover:text-brand-600 transition" />
          </div>
        </Link>
      </div>

      {/* ── MAIN 2-COLUMN OPERATIONAL LAYOUT (DESIGN SYSTEM SECTION 11) ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ── LEFT COLUMN (7 COLS): RENT DUES & OVERDUES TRACKER ──────────── */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="overflow-hidden">
            {/* Header & Collection Progress */}
            <div className="border-b border-neutral-100 bg-neutral-50/60 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-neutral-900">
                    Rent Collection & Outstanding Dues
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Live tracker for pending and overdue resident payments
                  </p>
                </div>
                <Link
                  href="/admin/billing/invoices"
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                >
                  All Invoices
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>

              {/* Collection Progress Bar (Exact from Design System Section 11) */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-800">
                    {formatMoney(collection.collected)} collected
                  </span>
                  <span className="font-bold text-brand-700">
                    {collection.collectionRate}% achieved
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-brand-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, collection.collectionRate))}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Target: {formatMoney(collection.billed)}</span>
                  <span>Uncollected: {formatMoney(collection.outstanding)}</span>
                </div>
              </div>
            </div>

            {/* Invoices List / Defaulters Actions */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3 text-xs font-bold text-neutral-700">
                <span>Priority Dues Awaiting Payment</span>
                <span className="text-[11px] font-normal text-neutral-500">
                  {pendingInvoices.length} active bills
                </span>
              </div>

              {pendingInvoices.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-200 p-8 text-center bg-neutral-50/50">
                  <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-success-50 text-success-600 mb-2">
                    <CheckCircle2 className="size-6" />
                  </span>
                  <p className="text-sm font-bold text-neutral-900">All Rent Dues Cleared!</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    No overdue or pending invoices need operator attention right now.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {pendingInvoices.map((inv) => {
                    const resident = inv.occupancy?.user;
                    const phone = resident?.phone;
                    const roomLabel = inv.occupancy?.unit?.unitNumber
                      ? `Room ${inv.occupancy.unit.unitNumber}${inv.occupancy.bed ? ` (${inv.occupancy.bed.bedLabel})` : ""}`
                      : inv.flat?.flatNumber || "PG Resident";
                    const isOverdue = inv.status === "OVERDUE";
                    const outstanding = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));

                    const payUrl = `${typeof window !== "undefined" ? window.location.origin : "https://bedy.in"}/pay/${inv.id}`;

                    // Build instant WhatsApp message link
                    const waText = isOverdue
                      ? buildDefaulterNoticeMessage({
                          residentName: resident?.name || "Resident",
                          roomLabel,
                          daysOverdue: Math.max(1, Math.ceil((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))),
                          amount: outstanding,
                          payUrl,
                          pgName: society?.name || "Bedy PG",
                        })
                      : buildRentReminderMessage({
                          residentName: resident?.name || "Resident",
                          roomLabel,
                          period: formatPeriod(inv.billingPeriod),
                          amount: outstanding,
                          dueDate: formatDate(inv.dueDate),
                          payUrl,
                          pgName: society?.name || "Bedy PG",
                        });

                    const waUrl = getWhatsAppUrl(phone, waText);

                    return (
                      <div
                        key={inv.id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 rounded-xl px-2 transition"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                              {resident?.name || "Unassigned Tenant"}
                            </p>
                            <span
                              className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                                isOverdue
                                  ? "bg-error-50 text-error-700 ring-1 ring-error-600/20"
                                  : "bg-warning-50 text-warning-700 ring-1 ring-warning-600/20"
                              }`}
                            >
                              {isOverdue ? "OVERDUE" : "PENDING"}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            {roomLabel} · Due {formatDate(inv.dueDate)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <span
                            className={`text-sm sm:text-base font-extrabold tabular-nums ${
                              isOverdue ? "text-error-600" : "text-neutral-900"
                            }`}
                          >
                            {formatMoney(outstanding)}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {phone && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Send WhatsApp Payment Link"
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
                              >
                                <MessageCircle className="size-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                            <Link
                              href={`/admin/billing/payments?invoiceId=${inv.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1.5 text-[11px] font-bold text-neutral-700 transition"
                            >
                              <span>Record</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom direct actions */}
              <div className="mt-4 pt-3.5 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <Link
                  href="/admin/billing/defaulters"
                  className="font-bold text-error-600 hover:text-error-700 hover:underline flex items-center gap-1"
                >
                  <AlertTriangle className="size-3.5" />
                  View All Defaulters ({cards.overdueInvoiceCount})
                </Link>
                <Link
                  href="/admin/billing/invoices"
                  className="font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                >
                  <span>Batch Generate Next Month</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* ── RIGHT COLUMN (5 COLS): LIVE BED AVAILABILITY & ACTIVITY ────── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Bed Availability Matrix (Exact from Design System Section 11) */}
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Bed Availability Grid</h3>
                <p className="text-[11px] text-neutral-500">Live room allocation snapshot</p>
              </div>
              <Link
                href="/admin/rooms"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
              >
                Rooms
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {/* Visual Bed Grid (Section 11 #beds) */}
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2 my-3">
              {bedsGrid.length > 0
                ? bedsGrid.map((b) => {
                    const isNotice = b.occupancies?.[0]?.status === "NOTICE";
                    const isOccupied = b.status === "OCCUPIED" || b.occupancies?.length > 0;
                    const occupantName = b.occupancies?.[0]?.user?.name;

                    const colorClass = isNotice
                      ? "bg-warning-50 text-warning-800 border-warning-200"
                      : isOccupied
                      ? "bg-info-50 text-info-700 border-info-200"
                      : "bg-success-50 text-success-700 border-success-200";

                    return (
                      <div
                        key={b.id}
                        title={`Room ${b.unit?.unitNumber || "-"} · Bed ${b.bedLabel}${
                          occupantName ? ` (${occupantName}${isNotice ? " - On Notice" : ""})` : " (Vacant)"
                        }`}
                        className={`text-center font-bold text-[10px] sm:text-xs py-2 rounded-lg border shadow-2xs transition-transform hover:scale-105 cursor-pointer ${colorClass}`}
                      >
                        {b.bedLabel}
                      </div>
                    );
                  })
                : Array.from({ length: 18 }, (_, i) => {
                    const isNotice = i % 7 === 0;
                    const isVacant = i % 4 === 0;
                    const colorClass = isNotice
                      ? "bg-warning-50 text-warning-800 border-warning-200"
                      : isVacant
                      ? "bg-success-50 text-success-700 border-success-200"
                      : "bg-info-50 text-info-700 border-info-200";

                    return (
                      <div
                        key={i}
                        className={`text-center font-bold text-[10px] sm:text-xs py-2 rounded-lg border shadow-2xs ${colorClass}`}
                      >
                        B{i + 1}
                      </div>
                    );
                  })}
            </div>

            {/* Visual Key per Design System */}
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] font-semibold text-neutral-600">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-success-500" />
                Vacant ({cards.vacantBeds})
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-info-500" />
                Occupied ({cards.occupiedBeds})
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-warning-500" />
                Notice ({noticeCount})
              </span>
            </div>
          </Card>

          {/* Recent Payments Feed */}
          <Card>
            <CardHeader
              title="Recent Payments"
              subtitle="Latest recorded receipts"
              icon={CreditCard}
              action={
                <Link
                  href="/admin/billing/payments"
                  className="text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  View all →
                </Link>
              }
            />
            {data.recentPayments.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No payments recorded"
                description="Payments recorded will appear here instantly."
                compact
              />
            ) : (
              <ul className="divide-y divide-neutral-100 text-xs">
                {data.recentPayments.slice(0, 5).map((p) => {
                  const targetLabel = p.occupancy
                    ? `Room ${p.occupancy.unit?.unitNumber || "-"}${p.occupancy.bed ? ` (${p.occupancy.bed.bedLabel})` : ""}`
                    : p.flat?.flatNumber || "Tenant";
                  const residentName = p.occupancy?.user?.name;

                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between p-3.5 hover:bg-neutral-50/50 transition"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-900 truncate">
                          {residentName || targetLabel}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {targetLabel} · {titleCase(p.paymentMethod)} · {formatDate(p.paymentDate)}
                        </p>
                      </div>
                      <span className="font-extrabold text-success-700 tabular-nums shrink-0 ml-2">
                        +{formatMoney(p.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* ── SECONDARY ACTIVITY: COMPLAINTS & NOTICES (2-COL COMPACT) ────── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader
            title="Open Complaints"
            subtitle="Maintenance tickets"
            icon={AlertTriangle}
            action={
              <Link
                href="/admin/complaints"
                className="text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                View all →
              </Link>
            }
          />
          {data.recentComplaints.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No open complaints"
              description="Everything is running smoothly."
              compact
            />
          ) : (
            <ul className="divide-y divide-neutral-100 text-xs">
              {data.recentComplaints.slice(0, 4).map((c) => {
                const locationLabel = c.unit
                  ? `Room ${c.unit.unitNumber}`
                  : c.flat?.flatNumber || "PG";

                return (
                  <li key={c.id} className="p-3.5 hover:bg-neutral-50/50 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-900 truncate">{c.title}</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {locationLabel} · {titleCase(c.category)} · {c.createdBy?.name}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <StatusBadge status={c.status} />
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
            title="Community Notices"
            subtitle="Broadcasts & announcements"
            icon={Megaphone}
            action={
              <Link
                href="/admin/notices"
                className="text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                View all →
              </Link>
            }
          />
          {data.recentNotices.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No notices posted"
              description="Post an announcement to reach all residents."
              compact
            />
          ) : (
            <ul className="divide-y divide-neutral-100 text-xs">
              {data.recentNotices.slice(0, 4).map((n) => (
                <li
                  key={n.id}
                  className="p-3.5 hover:bg-neutral-50/50 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-neutral-900 truncate">{n.title}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {titleCase(n.category)} · Posted by {n.postedBy?.name}
                    </p>
                  </div>
                  <span className="text-[11px] text-neutral-400 shrink-0 tabular-nums">
                    {n._count?.reads ?? 0} read
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
