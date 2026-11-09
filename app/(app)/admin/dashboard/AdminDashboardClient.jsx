"use client";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CreditCard,
  Plus,
  Wallet,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  ArrowUpRight,
  BedSingle,
  DoorOpen,
  ArrowRight,
  CheckCircle2,
  X,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Layers,
  Building,
  Building2,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/client/api";
import { formatMoney, formatDate, formatPeriod, titleCase, formatBedLabel } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  getWhatsAppUrl,
  buildRentReminderMessage,
  buildDefaulterNoticeMessage,
} from "@/lib/billing/whatsapp";

export default function AdminDashboardClient({
  data,
  user,
  accessibleSocieties = [],
  multiPGSnapshot = [],
  currentSocietyId,
}) {
  const { cards, collection, society, pendingInvoices = [], bedsGrid = [], unitsGrid = [] } = data;
  const recentComplaints = data.recentComplaints || [];
  const recentPayments = data.recentPayments || [];

  const [dismissNoticeBanner, setDismissNoticeBanner] = useState(false);
  const [switchingSocietyId, setSwitchingSocietyId] = useState(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  async function handleSwitchPG(targetId) {
    if (targetId === currentSocietyId || switchingSocietyId) return;
    setSwitchingSocietyId(targetId);
    try {
      await api.post("/api/auth/switch-society", { societyId: targetId });
      window.location.reload();
    } catch (err) {
      console.error("Failed to switch PG:", err);
      setSwitchingSocietyId(null);
    }
  }

  // Group rooms and beds by floor
  const floorData = useMemo(() => {
    let rooms = [];
    if (unitsGrid && unitsGrid.length > 0) {
      rooms = unitsGrid;
    } else if (bedsGrid && bedsGrid.length > 0) {
      const roomMap = new Map();
      for (const b of bedsGrid) {
        const uNum = b.unit?.unitNumber || "101";
        const uId = b.unit?.id || b.unitId;
        const uFloor = b.unit?.floor || null;
        if (!roomMap.has(uNum)) {
          roomMap.set(uNum, {
            id: uId,
            unitNumber: uNum,
            floor: uFloor,
            unitType: "ROOM",
            beds: [],
          });
        }
        roomMap.get(uNum).beds.push(b);
      }
      rooms = Array.from(roomMap.values());
    }

    const floorMap = new Map();
    for (const r of rooms) {
      let fName = "Floor 1";
      if (r.floor && String(r.floor).trim()) {
        const val = String(r.floor).trim();
        fName = /^floor/i.test(val) ? val : `Floor ${val}`;
      } else {
        const num = String(r.unitNumber || "").trim();
        if (/^[gG]/.test(num)) {
          fName = "Ground Floor";
        } else if (/^\d{3,}/.test(num)) {
          fName = `Floor ${num[0]}`;
        }
      }

      if (!floorMap.has(fName)) {
        floorMap.set(fName, []);
      }
      floorMap.get(fName).push(r);
    }

    if (floorMap.size === 0) {
      return [{ name: "Floor 1", rooms: [] }];
    }

    const sortedFloorNames = Array.from(floorMap.keys()).sort((a, b) => {
      const getRank = (name) => {
        if (/ground/i.test(name)) return 0;
        const match = name.match(/\d+/);
        return match ? parseInt(match[0], 10) : 999;
      };
      return getRank(a) - getRank(b);
    });

    return sortedFloorNames.map((name) => {
      const floorRooms = floorMap.get(name) || [];
      floorRooms.sort((a, b) =>
        String(a.unitNumber).localeCompare(String(b.unitNumber), undefined, { numeric: true })
      );
      return {
        name,
        rooms: floorRooms,
      };
    });
  }, [unitsGrid, bedsGrid]);

  const [selectedFloorIdx, setSelectedFloorIdx] = useState(0);
  const safeFloorIdx = Math.min(Math.max(0, selectedFloorIdx), Math.max(0, floorData.length - 1));
  const currentFloor = floorData[safeFloorIdx] || { name: "Floor 1", rooms: [] };

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

  const noticeCount = upcomingMoveOuts.length;

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER (CLEAN, SLEEK DASHBOARD TITLE & TIME) ───────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950 sm:text-3xl">
            Dashboard
          </h1>
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200/90 bg-white px-3 py-1 text-xs font-semibold text-neutral-600 shadow-2xs">
            <CalendarDays className="size-3.5 text-brand-600" />
            {today}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            as="a"
            href="/admin/residents?action=new"
            variant="primary"
            size="md"
            className="shadow-2xs font-bold"
          >
            <Plus className="size-4" />
            Check-in Resident
          </Button>
          <Button
            as="a"
            href="/admin/billing/payments?action=record"
            variant="secondary"
            size="md"
            className="font-bold shadow-2xs"
          >
            <Wallet className="size-4" />
            Add payment
          </Button>
          <Button
            as="a"
            href="/admin/billing/invoices?action=generate"
            variant="outline"
            size="md"
            className="font-bold text-neutral-700 border-neutral-200 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50/50 shadow-2xs"
          >
            <FileText className="size-4" />
            Generate Invoices
          </Button>
        </div>
      </div>

      {/* ── MULTI-PG PORTFOLIO OVERVIEW & 1-CLICK FRICTIONLESS SWITCHER ── */}
      {accessibleSocieties && accessibleSocieties.length > 1 && (
        <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-white p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-2xs">
                <Building className="size-4.5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Multi-PG Properties
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100/90 text-brand-800">
                    {accessibleSocieties.length} PGs Managed
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-500">
                  Select a PG to instantly switch rooms, occupants, and billing
                </p>
              </div>
            </div>

            {/* Quick 1-Click Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {accessibleSocieties.map((s) => {
                const isActive = s.id === currentSocietyId;
                const isSwitching = switchingSocietyId === s.id;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSwitchPG(s.id)}
                    disabled={Boolean(switchingSocietyId)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                      isActive
                        ? "bg-brand-600 text-white shadow-md ring-2 ring-brand-500/80"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    {isSwitching ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Building className={`size-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                    )}
                    <span className="truncate max-w-[150px]">{s.name}</span>
                    {isActive && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-white/25 text-white">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* All PG Data Cards: Visible & Clear */}
          {multiPGSnapshot && multiPGSnapshot.length > 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {multiPGSnapshot.map((pg) => {
                const isActive = pg.id === currentSocietyId;
                const isSwitching = switchingSocietyId === pg.id;

                return (
                  <div
                    key={pg.id}
                    onClick={() => !isActive && handleSwitchPG(pg.id)}
                    className={`group rounded-xl p-3.5 transition-all border ${
                      isActive
                        ? "bg-white border-brand-500 ring-2 ring-brand-500/30 shadow-md"
                        : "bg-white/80 border-slate-200 hover:border-brand-300 hover:shadow-sm cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{pg.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            {pg.code}
                          </span>
                        </p>
                      </div>
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 shrink-0">
                          <CheckCircle2 className="size-3 text-emerald-600" />
                          Viewing
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[11px] font-bold text-brand-600 group-hover:translate-x-0.5 transition-transform shrink-0">
                          {isSwitching ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            "Switch →"
                          )}
                        </span>
                      )}
                    </div>

                    {/* Occupancy Progress */}
                    <div className="space-y-1.5 mb-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Occupancy</span>
                        <span className="font-bold text-slate-800">
                          {pg.occupancyRate}% ({pg.occupiedBeds}/{pg.totalBeds} Beds)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pg.occupancyRate >= 85
                              ? "bg-emerald-500"
                              : pg.occupancyRate >= 50
                              ? "bg-brand-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(100, pg.occupancyRate)}%` }}
                        />
                      </div>
                    </div>

                    {/* Resident & Dues Breakdown */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">
                        <strong className="font-semibold text-slate-800">{pg.activeResidents}</strong> residents
                      </span>
                      {pg.pendingAmount > 0 ? (
                        <span className="font-bold text-rose-600">
                          {formatMoney(pg.pendingAmount)} due
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="size-3" /> Dues clear
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
          className="group relative flex flex-col justify-between overflow-hidden min-w-0 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-2xs hover:border-error-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 truncate" title="Overdue Rent">
              Overdue Rent
            </span>
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
                cards.overdue > 0
                  ? "bg-error-50 text-error-600 ring-1 ring-error-600/20"
                  : "bg-neutral-100 text-neutral-500"
              }`}
            >
              <AlertTriangle className="size-4" />
            </span>
          </div>
          <p
            className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums truncate ${
              cards.overdue > 0 ? "text-error-600" : "text-neutral-900"
            }`}
            title={formatMoney(cards.overdue)}
          >
            {formatMoney(cards.overdue)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs font-medium min-w-0 gap-1.5">
            <span
              className={`truncate ${
                cards.overdue > 0
                  ? "font-bold text-error-700"
                  : "text-neutral-500"
              }`}
              title={cards.overdueInvoiceCount > 0 ? `${cards.overdueInvoiceCount} invoices past due` : "Zero overdue rent"}
            >
              {cards.overdueInvoiceCount > 0
                ? `${cards.overdueInvoiceCount} invoices past due`
                : "Zero overdue rent"}
            </span>
            <ArrowUpRight className="size-3.5 shrink-0 text-neutral-400 group-hover:text-error-600 transition" />
          </div>
        </Link>

        {/* Card 2: Pending Rent (Awaiting Payment this month) */}
        <Link
          href="/admin/billing/invoices?status=PENDING"
          className="group relative flex flex-col justify-between overflow-hidden min-w-0 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-2xs hover:border-warning-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 truncate" title="Pending Dues">
              Pending Dues
            </span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-700 ring-1 ring-warning-600/20">
              <Clock className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-neutral-900 truncate" title={formatMoney(cards.pending)}>
            {formatMoney(cards.pending)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs font-medium min-w-0 gap-1.5">
            <span
              className="text-neutral-500 truncate"
              title={collection.outstanding > 0 ? `${formatMoney(collection.outstanding)} uncollected` : "All current invoices cleared"}
            >
              {collection.outstanding > 0
                ? `${formatMoney(collection.outstanding)} uncollected`
                : "All current invoices cleared"}
            </span>
            <ArrowUpRight className="size-3.5 shrink-0 text-neutral-400 group-hover:text-warning-600 transition" />
          </div>
        </Link>

        {/* Card 3: Rent Collected This Month */}
        <Link
          href="/admin/billing/payments"
          className="group relative flex flex-col justify-between overflow-hidden min-w-0 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-2xs hover:border-success-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 truncate" title="Rent Collected">
              Rent Collected
            </span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-success-50 text-success-700 ring-1 ring-success-600/20">
              <Wallet className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-success-700 truncate" title={formatMoney(collection.collected)}>
            {formatMoney(collection.collected)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs font-medium min-w-0 gap-1.5">
            <span className="text-neutral-500 truncate">
              {collection.billed > 0 ? (
                <>
                  <strong className="font-bold text-neutral-800">{collection.collectionRate}%</strong> of{" "}
                  {formatMoney(collection.billed)} billed
                </>
              ) : (
                `${cards.collectedThisMonthCount} payments recorded this month`
              )}
            </span>
            <ArrowUpRight className="size-3.5 shrink-0 text-neutral-400 group-hover:text-success-600 transition" />
          </div>
        </Link>

        {/* Card 4: Live Bed Occupancy */}
        <Link
          href="/admin/rooms"
          className="group relative flex flex-col justify-between overflow-hidden min-w-0 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-2xs hover:border-brand-300 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 truncate" title="Bed Occupancy">
              Bed Occupancy
            </span>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-600/20">
              <BedSingle className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-brand-700 truncate" title={`${cards.occupancyRate}%`}>
            {cards.occupancyRate}%
          </p>
          <div className="mt-2 flex items-center justify-between text-xs font-medium min-w-0 gap-1.5">
            <span className="text-neutral-500 truncate">
              <strong className="font-bold text-success-700">{cards.vacantBeds} vacant</strong>{" "}
              · {cards.occupiedBeds} occupied
              {noticeCount > 0 ? ` · ${noticeCount} notice` : ""}
            </span>
            <ArrowUpRight className="size-3.5 shrink-0 text-neutral-400 group-hover:text-brand-600 transition" />
          </div>
        </Link>
      </div>

      {/* ── ROW 1: PRIORITY DUES & LIVE BED MATRIX (MATCHING HEIGHT) ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        {/* Left Column (7 cols): Priority Dues Awaiting Payments (Showing only 4 items) */}
        <div className="lg:col-span-7 flex flex-col">
          <Card className="h-full flex flex-col justify-between overflow-hidden">
            <CardHeader
              title="Priority Dues Awaiting Payments"
              subtitle={`${pendingInvoices.length} active bills awaiting collection`}
              icon={Clock}
              action={
                <Link
                  href="/admin/billing/invoices"
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                >
                  All Invoices
                  <ArrowRight className="size-3.5" />
                </Link>
              }
            />

            {/* Invoices List / Defaulters Actions (up to 5 rows) */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
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
                  {pendingInvoices.slice(0, 5).map((inv) => {
                    const resident = inv.occupancy?.user;
                    const phone = resident?.phone;
                    const roomLabel = inv.occupancy?.unit?.unitNumber
                      ? `Room ${inv.occupancy.unit.unitNumber}${inv.occupancy.bed ? ` (${inv.occupancy.bed.bedLabel})` : ""}`
                      : inv.flat?.flatNumber || "PG Resident";
                    const isOverdue = inv.status === "OVERDUE";
                    const outstanding = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));

                    const payUrl = `${origin || "https://bedy.in"}/pay/${inv.id}`;

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
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isOverdue
                                  ? "bg-error-50 text-error-700 ring-1 ring-error-600/20"
                                  : "bg-warning-50 text-warning-700 ring-1 ring-warning-600/20"
                              }`}
                            >
                              {isOverdue ? "OVERDUE" : "PENDING"}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-neutral-500 mt-0.5">
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
                                <WhatsAppIcon className="size-3.5" />
                                <span>WhatsApp</span>
                              </a>
                            )}
                            <Link
                              href={`/admin/billing/payments?action=record&invoiceId=${inv.id}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 hover:bg-brand-50 hover:text-brand-700 px-2.5 py-1.5 text-[11px] font-bold text-neutral-700 transition"
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
                  View All Overdue ({cards.overdueInvoiceCount})
                </Link>
                <Link
                  href="/admin/billing/invoices?action=generate"
                  className="font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                >
                  <span>Batch Generate Next Month</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Bed Availability Grid (Matching Height & Scrollable Grid) */}
        <div className="lg:col-span-5 flex flex-col">
          <Card className="h-full min-h-0 flex flex-col p-0">
            <CardHeader
              title="Bed Availability"
              subtitle="Live room allocation snapshot"
              action={
                <Link
                  href="/admin/rooms"
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                >
                  Rooms
                  <ArrowRight className="size-3.5" />
                </Link>
              }
            />
            {/* Floor Navigation with Prev/Next Arrows and Floor Selector */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 bg-neutral-50/80 border-b border-neutral-100">
              <button
                type="button"
                onClick={() => setSelectedFloorIdx((prev) => Math.max(0, prev - 1))}
                disabled={safeFloorIdx === 0}
                className="inline-flex size-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                title="Previous Floor"
              >
                <ChevronLeft className="size-4" />
              </button>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {floorData.map((f, idx) => {
                  const isActive = idx === safeFloorIdx;
                  return (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => setSelectedFloorIdx(idx)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? "bg-brand-600 text-white shadow-2xs ring-2 ring-brand-600/30"
                          : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/90"
                      }`}
                    >
                      {f.name}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setSelectedFloorIdx((prev) => Math.min(floorData.length - 1, prev + 1))}
                disabled={safeFloorIdx >= floorData.length - 1}
                className="inline-flex size-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                title="Next Floor"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Room Groups for the Active Floor (Max 3 rows; internal scroll if exceeded) */}
            <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
              <div className="my-1 min-h-0 flex-1 max-h-[270px] overflow-y-auto pr-1">
                {currentFloor.rooms.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentFloor.rooms.map((room) => {
                      const roomBeds = room.beds || [];
                      const roomVacantCount = roomBeds.filter((b) => {
                        const isOccupied = b.status === "OCCUPIED" || b.occupancies?.length > 0;
                        const isNotice = b.occupancies?.[0]?.status === "NOTICE";
                        return !isOccupied && !isNotice;
                      }).length;

                      return (
                        <div
                          key={room.id}
                          className="rounded-xl border border-neutral-200/90 bg-neutral-50/60 p-2.5 flex flex-col gap-2 hover:border-brand-300 hover:bg-white transition-all shadow-2xs"
                        >
                          {/* Room Header */}
                          <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-neutral-200/60">
                            <div className="flex items-center gap-1.5 shrink-0">
                              <DoorOpen className="size-3.5 text-brand-600 shrink-0" />
                              <span className="font-extrabold text-xs text-neutral-900 whitespace-nowrap">
                                Room {room.unitNumber}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-auto">
                              {room.ac ? (
                                <span className="rounded bg-sky-50 text-sky-700 px-1 py-0.5 text-[9px] font-bold border border-sky-200 leading-none">
                                  AC
                                </span>
                              ) : null}
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap ${
                                  roomVacantCount > 0
                                    ? "bg-success-50 text-success-700 ring-1 ring-success-600/20"
                                    : "bg-neutral-100 text-neutral-500"
                                }`}
                              >
                                {roomVacantCount > 0 ? `${roomVacantCount} vacant` : "Full"}
                              </span>
                            </div>
                          </div>

                          {/* Room Beds Grid */}
                          <div
                            className={`grid gap-1.5 pt-0.5 ${
                              roomBeds.length <= 2
                                ? "grid-cols-2"
                                : roomBeds.length === 3
                                ? "grid-cols-3"
                                : "grid-cols-4"
                            }`}
                          >
                            {roomBeds.map((b) => {
                              const isNotice = b.occupancies?.[0]?.status === "NOTICE";
                              const isOccupied = b.status === "OCCUPIED" || b.occupancies?.length > 0;
                              const isVacant = !isOccupied && !isNotice;
                              const occupantName = b.occupancies?.[0]?.user?.name;

                              const colorClass = isNotice
                                ? "bg-warning-50 text-warning-800 border-warning-300 hover:bg-warning-100"
                                : isOccupied
                                ? "bg-info-50 text-info-700 border-info-300 hover:bg-info-100"
                                : "bg-success-50 text-success-700 border-success-300 hover:bg-success-100";

                              const displayLabel = formatBedLabel(b.bedLabel);

                              if (isVacant) {
                                return (
                                  <Link
                                    key={b.id}
                                    href={`/admin/residents?action=new&unitId=${room.id}&bedId=${b.id}`}
                                    title={`Room ${room.unitNumber} · Bed ${b.bedLabel} (Vacant - Click to Check-in)`}
                                    className={`flex items-center justify-center font-extrabold text-xs py-1.5 px-1.5 rounded-lg border shadow-2xs transition-all hover:scale-105 cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis ${colorClass}`}
                                  >
                                    {displayLabel}
                                  </Link>
                                );
                              }

                              return (
                                <div
                                  key={b.id}
                                  title={`Room ${room.unitNumber} · Bed ${b.bedLabel}${
                                    occupantName ? ` (${occupantName}${isNotice ? " - On Notice" : ""})` : ""
                                  }`}
                                  className={`flex items-center justify-center font-extrabold text-xs py-1.5 px-1.5 rounded-lg border shadow-2xs whitespace-nowrap overflow-hidden text-ellipsis ${colorClass}`}
                                >
                                  {displayLabel}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-neutral-200 p-6 text-center text-xs text-neutral-500">
                    No rooms on {currentFloor.name} yet.
                  </p>
                )}
              </div>
            </div>

            {/* Visual Key per Design System */}
            <div className="mx-4 mb-4 mt-1 flex items-center justify-between border-t border-neutral-100 pt-3 text-[11px] font-semibold text-neutral-600 sm:mx-5 sm:mb-5">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-success-500" />
                Vacant ({cards.vacantBeds})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-info-500" />
                Occupied ({cards.occupiedBeds})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-warning-500" />
                Notice ({noticeCount})
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* ── ROW 2: ACTIVE COMPLAINTS & RECENT PAYMENTS (MATCHING HEIGHT) ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
        {/* Left Column (7 cols): Active Complaints */}
        <div className="lg:col-span-7 flex flex-col">
          <Card className="h-full flex flex-col justify-between overflow-hidden">
            <CardHeader
              title="Active Complaints"
              subtitle={`${cards.openComplaints || 0} unresolved · ${cards.urgentComplaints || 0} urgent`}
              icon={Wrench}
              action={
                <Link
                  href="/admin/complaints"
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                >
                  View all ({cards.openComplaints || 0})
                  <ArrowRight className="size-3.5" />
                </Link>
              }
            />

            <div className="p-4 sm:p-5 flex-1">
              {recentComplaints.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-center bg-neutral-50/50">
                  <span className="mx-auto flex size-8 items-center justify-center rounded-full bg-success-50 text-success-600 mb-1.5">
                    <CheckCircle2 className="size-4.5" />
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-neutral-900">Zero Open Complaints</p>
                  <p className="text-[11px] font-medium text-neutral-500 mt-0.5">
                    All resident maintenance requests and issues have been resolved.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {recentComplaints.slice(0, 4).map((c) => {
                    const locationLabel = c.unit?.unitNumber
                      ? `Room ${c.unit.unitNumber}${c.bed?.bedLabel ? ` (${c.bed.bedLabel})` : ""}`
                      : c.flat?.flatNumber
                      ? `Flat ${c.flat.flatNumber}`
                      : "PG Resident";
                    const isUrgent = c.priority === "URGENT";

                    return (
                      <div
                        key={c.id}
                        className="py-3 flex items-center justify-between gap-3 hover:bg-neutral-50/50 rounded-xl px-2 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                              {c.title}
                            </p>
                            {isUrgent && (
                              <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold bg-error-50 text-error-700 ring-1 ring-error-600/20">
                                URGENT
                              </span>
                            )}
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                c.status === "RESOLVED"
                                  ? "bg-success-50 text-success-700 ring-1 ring-success-600/20"
                                  : c.status === "IN_PROGRESS"
                                  ? "bg-info-50 text-info-700 ring-1 ring-info-600/20"
                                  : "bg-warning-50 text-warning-700 ring-1 ring-warning-600/20"
                              }`}
                            >
                              {c.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-neutral-500 mt-0.5 truncate">
                            {locationLabel} · {c.createdBy?.name || "Resident"} · {formatDate(c.createdAt)}
                          </p>
                        </div>

                        <Link
                          href={`/admin/complaints?id=${c.id}`}
                          className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 px-2.5 py-1 text-[11px] font-bold text-neutral-700 transition"
                        >
                          <span>Review</span>
                          <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (5 cols): Recent Payments */}
        <div className="lg:col-span-5 flex flex-col">
          <Card className="h-full flex flex-col justify-between overflow-hidden">
            <CardHeader
              title="Recent Payments"
              subtitle="Latest recorded receipts"
              icon={CreditCard}
              action={
                <Link
                  href="/admin/billing/payments"
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                >
                  View all
                  <ArrowRight className="size-3.5" />
                </Link>
              }
            />
            {recentPayments.length === 0 ? (
              <div className="p-4 sm:p-5 flex-1">
                <div className="rounded-xl border border-dashed border-neutral-200 p-6 text-center bg-neutral-50/50">
                  <span className="mx-auto flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 mb-1.5">
                    <CreditCard className="size-4.5" />
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-neutral-900">No Payments Recorded</p>
                  <p className="text-[11px] font-medium text-neutral-500 mt-0.5">
                    Payments recorded will appear here instantly.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100 text-xs p-3 sm:p-4 flex-1">
                {recentPayments.slice(0, 4).map((p) => {
                  const targetLabel = p.occupancy
                    ? `Room ${p.occupancy.unit?.unitNumber || "-"}${p.occupancy.bed ? ` (${p.occupancy.bed.bedLabel})` : ""}`
                    : p.flat?.flatNumber || "Tenant";
                  const residentName = p.occupancy?.user?.name;

                  return (
                    <li
                      key={p.id}
                      className="flex items-center justify-between p-3 hover:bg-neutral-50/50 rounded-xl transition"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-900 truncate text-xs sm:text-sm">
                          {residentName || targetLabel}
                        </p>
                        <p className="text-[11px] font-medium text-neutral-500 mt-0.5">
                          {targetLabel} · {titleCase(p.paymentMethod)} · {formatDate(p.paymentDate)}
                        </p>
                      </div>
                      <span className="font-extrabold text-success-700 tabular-nums shrink-0 ml-2 text-xs sm:text-sm">
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

      {/* Closed bottom grid */}
    </div>
  );
}
