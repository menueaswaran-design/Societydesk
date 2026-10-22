"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Upload,
  Search,
  LogOut,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  ShieldCheck,
  ArrowRight,
  Wallet,
  Phone,
  BedSingle,
  DoorOpen,
  Calendar,
  Receipt,
  MessageCircle,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Table, { Tr, Td } from "@/components/ui/Table";
import StatusBadge from "@/components/ui/StatusBadge";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import { Card } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import Tabs from "@/components/ui/Tabs";
import Avatar from "@/components/ui/Avatar";
import RecordPaymentModal from "@/components/billing/RecordPaymentModal";
import { api } from "@/lib/client/api";
import { formatMoney, formatDate } from "@/lib/format";
import { buildRentReminderMessage, getWhatsAppUrl } from "@/lib/billing/whatsapp";

const PG_CSV_TEMPLATE = `Room,Bed,Name,Phone,Email,JoinDate,MonthlyRent,Deposit
101,A,Ravi Kumar,9876543210,ravi@email.com,2026-06-01,7500,15000
101,B,Arun Prasad,9876543211,arun@email.com,2026-07-15,7500,15000
201,A,Suresh Nair,9876543212,suresh@email.com,2026-08-01,8500,17000`;

const EMPTY_CHECKIN = {
  name: "",
  email: "",
  phone: "",
  unitId: "",
  bedId: "",
  joinDate: new Date().toISOString().slice(0, 10),
  monthlyRent: 7500,
  depositAmount: 15000,
  noticePeriodDays: 30,
  docType: "AADHAAR",
  docUrl: "",
};

export default function ResidentsClient({
  isPg = true,
  societyName = "Bedy PG",
  occupancies = [],
  units = [],
  residents = [],
  flats = [],
  userRole = "OWNER",
}) {
  const router = useRouter();
  const [tab, setTab] = useState("list");

  // Check-in modal
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInForm, setCheckInForm] = useState(EMPTY_CHECKIN);
  const [checkInSaving, setCheckInSaving] = useState(false);
  const [checkInError, setCheckInError] = useState(null);

  // Check-out modal
  const [checkoutOccupancy, setCheckoutOccupancy] = useState(null);
  const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().slice(0, 10));
  const [deductions, setDeductions] = useState([
    { reason: "Room Cleaning", amount: 1000 },
  ]);
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [checkoutSaving, setCheckoutSaving] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  // Record payment
  const [paymentResident, setPaymentResident] = useState(null);

  // Search & Filters
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ACTIVE");
  const [filterRoom, setFilterRoom] = useState("ALL");

  // CSV Import
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);

  // Available beds for currently selected room in Check-in
  const selectedUnit = units.find((u) => u.id === checkInForm.unitId);
  const availableBeds = useMemo(() => {
    if (!selectedUnit) return [];
    return selectedUnit.beds?.filter((b) => b.status === "VACANT") || [];
  }, [selectedUnit]);

  // Filtered occupancies
  const filteredOccupancies = useMemo(() => {
    const q = query.trim().toLowerCase();
    return occupancies.filter((occ) => {
      if (filterStatus !== "ALL" && occ.status !== filterStatus) return false;
      if (filterRoom !== "ALL" && occ.unit?.unitNumber !== filterRoom) return false;
      if (!q) return true;
      return (
        occ.user?.name?.toLowerCase().includes(q) ||
        occ.user?.email?.toLowerCase().includes(q) ||
        occ.user?.phone?.toLowerCase().includes(q) ||
        occ.unit?.unitNumber?.toLowerCase().includes(q)
      );
    });
  }, [occupancies, query, filterStatus, filterRoom]);

  // Check-in submit
  async function handleCheckInSubmit(e) {
    e.preventDefault();
    setCheckInSaving(true);
    setCheckInError(null);

    try {
      await api.post("/api/occupancies", {
        ...checkInForm,
        monthlyRent: Number(checkInForm.monthlyRent),
        depositAmount: Number(checkInForm.depositAmount),
        noticePeriodDays: Number(checkInForm.noticePeriodDays),
      });

      setCheckInOpen(false);
      setCheckInForm(EMPTY_CHECKIN);
      router.refresh();
    } catch (err) {
      setCheckInError(err?.message || "Failed to check-in resident");
    } finally {
      setCheckInSaving(false);
    }
  }

  // Check-out submit
  async function handleCheckoutSubmit(e) {
    e.preventDefault();
    if (!checkoutOccupancy) return;
    setCheckoutSaving(true);
    setCheckoutError(null);

    try {
      await api.post(`/api/occupancies/${checkoutOccupancy.id}/checkout`, {
        leaveDate: checkoutDate,
        deductions: deductions.map((d) => ({
          reason: d.reason,
          amount: Number(d.amount) || 0,
        })),
        notes: checkoutNotes,
      });

      setCheckoutOccupancy(null);
      router.refresh();
    } catch (err) {
      setCheckoutError(err?.message || "Failed to check out resident");
    } finally {
      setCheckoutSaving(false);
    }
  }

  // CSV Import submit
  async function handleImportSubmit(e) {
    e.preventDefault();
    setImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const lines = csvText.trim().split("\n");
      if (lines.length < 2) {
        throw new Error("Please provide CSV headers and at least one resident row.");
      }

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",").map((p) => p.trim());
        if (parts.length >= 7) {
          rows.push({
            room: parts[0],
            bed: parts[1] || "A",
            name: parts[2],
            phone: parts[3],
            email: parts[4],
            joinDate: parts[5],
            monthlyRent: Number(parts[6]) || 0,
            deposit: Number(parts[7]) || 0,
          });
        }
      }

      if (rows.length === 0) {
        throw new Error("Could not parse any valid resident rows from the CSV text.");
      }

      const res = await api.post("/api/occupancies/import", { rows });
      setImportSuccess(`Successfully imported ${res?.imported || rows.length} residents!`);
      setCsvText("");
      router.refresh();
    } catch (err) {
      setImportError(err?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  }

  // Deposit calculation during checkout
  const depositHeld = checkoutOccupancy?.deposits?.[0]?.amountReceived || checkoutOccupancy?.depositAmount || 0;
  const totalDeductions = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const netRefund = Math.max(0, depositHeld - totalDeductions);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {isPg ? "Residents & Check-in" : "Residents"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isPg
              ? "Onboard occupants, assign rooms & beds, record deposits, and process check-outs."
              : "Manage residents, tenancies and flat assignments."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setCheckInOpen(true)} size="md">
            <Plus className="size-4" />
            {isPg ? "Check-in Resident" : "Add Resident"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "list", label: isPg ? `Active Occupants (${occupancies.filter(o => o.status === 'ACTIVE').length})` : `Residents (${residents.length})` },
          { id: "import", label: "Excel / CSV Import" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "list" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-2xs border border-slate-200/80 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isPg ? "Search resident, room, phone..." : "Search resident..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 sm:py-1.5 pl-9 pr-3 text-xs focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {isPg && (
                <select
                  value={filterRoom}
                  onChange={(e) => setFilterRoom(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 sm:py-1.5 text-xs font-medium text-slate-700"
                >
                  <option value="ALL">All Rooms</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.unitNumber}>
                      Room {u.unitNumber}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 sm:py-1.5 text-xs font-medium text-slate-700"
              >
                <option value="ACTIVE">Active Staying</option>
                <option value="NOTICE">On Notice</option>
                <option value="LEFT">Checked Out</option>
                <option value="ALL">All Statuses</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredOccupancies.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No resident records found"
              description="Click 'Check-in Resident' to onboard an occupant into a room and bed."
            />
          ) : (
            <>
              {/* Mobile Cards for Occupants (< 640px) */}
              <div className="space-y-3 sm:hidden">
                {filteredOccupancies.map((occ) => {
                  const depositAmount = occ.deposits?.[0]?.amountReceived || occ.depositAmount || 0;
                  const isNotice = occ.status === "NOTICE";
                  const isLeft = occ.status === "LEFT";
                  const pendingInv = occ.invoices?.[0];
                  const pendingAmount = pendingInv ? pendingInv.totalAmount - pendingInv.paidAmount : 0;
                  const origin = typeof window !== "undefined" ? window.location.origin : "";
                  const payUrl = pendingInv ? `${origin}/pay/${pendingInv.id}` : "";
                  const roomLabel = `Room ${occ.unit?.unitNumber || "-"}${occ.bed ? ` (Bed ${occ.bed.bedLabel})` : ""}`;
                  const reminderText = pendingInv
                    ? buildRentReminderMessage({
                        residentName: occ.user?.name,
                        roomLabel,
                        period: pendingInv.billingPeriod,
                        amount: pendingAmount,
                        dueDate: formatDate(pendingInv.dueDate),
                        payUrl,
                        pgName: societyName || "Bedy PG",
                      })
                    : `Hi ${occ.user?.name}, greetings from ${societyName || "Bedy PG"}.`;
                  const waUrl = occ.user?.phone ? getWhatsAppUrl(occ.user?.phone, reminderText) : null;

                  return (
                    <div
                      key={occ.id}
                      className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3 transition-colors"
                    >
                      {/* Top Header: Occupant name + Room badge + Status */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar name={occ.user?.name} size="sm" />
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 text-sm truncate">
                              {occ.user?.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-600">
                              <span className="font-medium text-slate-800">Room {occ.unit?.unitNumber || "-"}</span>
                              {occ.bed ? (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-bold text-slate-700">
                                  Bed {occ.bed.bedLabel}
                                </span>
                              ) : null}
                              <span className="text-slate-400">·</span>
                              <span className="text-[11px] text-slate-500">{occ.unit?.unitType}</span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${
                            isNotice
                              ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                              : isLeft
                                ? "bg-slate-100 text-slate-600 ring-1 ring-slate-400/20"
                                : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                          }`}
                        >
                          {isNotice ? "On Notice" : isLeft ? "Left" : "Active"}
                        </span>
                      </div>

                      {/* Contact & WhatsApp Reminder pill */}
                      <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50/80 p-2.5 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2 min-w-0 text-slate-600">
                          <Phone className="size-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-xs truncate">
                            {occ.user?.phone || occ.user?.email || "No contact"}
                          </span>
                        </div>

                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs transition ${
                              pendingInv
                                ? "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95"
                                : "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
                            }`}
                          >
                            <MessageCircle className="size-3.5" />
                            <span>{pendingInv ? "Remind Due" : "WhatsApp"}</span>
                          </a>
                        ) : null}
                      </div>

                      {/* Financial Numbers Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
                          <span className="text-[11px] text-slate-500 block font-medium">Monthly Rent</span>
                          <span className="font-bold text-slate-900 text-sm">{formatMoney(occ.monthlyRent)}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">per month</span>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
                          <span className="text-[11px] text-slate-500 block font-medium">Security Deposit</span>
                          <span className="font-bold text-emerald-700 text-sm">{formatMoney(depositAmount)}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {occ.deposits?.[0]?.status === "HELD" ? "Held safely" : "Recorded"}
                          </span>
                        </div>
                      </div>

                      {/* Footer: Joined date & Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 text-[11px]">
                          Joined {formatDate(occ.joinDate)}
                          {occ.leaveDate ? ` · Left ${formatDate(occ.leaveDate)}` : ""}
                        </span>

                        {!isLeft ? (
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => setCheckoutOccupancy(occ)}
                            className="!text-rose-600 hover:!bg-rose-50 !border-rose-200"
                          >
                            Check-out
                          </Button>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-medium">Settled</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table (>= 640px) */}
              <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Occupant</th>
                        <th className="px-4 py-3.5">Room & Bed</th>
                        <th className="px-4 py-3.5">Rent / Month</th>
                        <th className="px-4 py-3.5">Security Deposit</th>
                        <th className="px-4 py-3.5">Joined</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOccupancies.map((occ) => {
                        const depositAmount = occ.deposits?.[0]?.amountReceived || occ.depositAmount || 0;
                        const isNotice = occ.status === "NOTICE";
                        const isLeft = occ.status === "LEFT";

                        return (
                          <tr key={occ.id} className="transition-colors hover:bg-slate-50/60">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <Avatar name={occ.user?.name} size="sm" />
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900">{occ.user?.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                    <span>{occ.user?.phone || occ.user?.email}</span>
                                    {occ.user?.phone ? (() => {
                                      const pendingInv = occ.invoices?.[0];
                                      const pendingAmount = pendingInv ? pendingInv.totalAmount - pendingInv.paidAmount : 0;
                                      const origin = typeof window !== "undefined" ? window.location.origin : "";
                                      const payUrl = pendingInv ? `${origin}/pay/${pendingInv.id}` : "";
                                      const roomLabel = `Room ${occ.unit?.unitNumber || "-"}${occ.bed ? ` (Bed ${occ.bed.bedLabel})` : ""}`;
                                      const reminderText = pendingInv
                                        ? buildRentReminderMessage({
                                            residentName: occ.user?.name,
                                            roomLabel,
                                            period: pendingInv.billingPeriod,
                                            amount: pendingAmount,
                                            dueDate: formatDate(pendingInv.dueDate),
                                            payUrl,
                                            pgName: societyName || "Bedy PG",
                                          })
                                        : `Hi ${occ.user?.name}, greetings from ${societyName || "Bedy PG"}.`;
                                      const waUrl = getWhatsAppUrl(occ.user?.phone, reminderText);

                                      return (
                                        <a
                                          href={waUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          title={pendingInv ? `Send WhatsApp Rent Reminder (Due: ₹${pendingAmount})` : "Chat on WhatsApp"}
                                          className={`inline-flex items-center gap-1 text-[10.5px] font-semibold transition ${
                                            pendingInv
                                              ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200"
                                              : "text-emerald-600 hover:text-emerald-700"
                                          }`}
                                        >
                                          <MessageCircle className="size-3 text-emerald-600" />
                                          {pendingInv ? "Remind Due" : ""}
                                        </a>
                                      );
                                    })() : null}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <span className="font-medium text-slate-900">
                                Room {occ.unit?.unitNumber || "-"}
                              </span>
                              {occ.bed ? (
                                <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-bold text-slate-700">
                                  Bed {occ.bed.bedLabel}
                                </span>
                              ) : null}
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {occ.unit?.unitType} Sharing
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <p className="font-bold text-slate-900">
                                {formatMoney(occ.monthlyRent)}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">per month</p>
                            </td>

                            <td className="px-4 py-4">
                              <p className="font-semibold text-emerald-700">
                                {formatMoney(depositAmount)}
                              </p>
                              <p className="text-[10.5px] text-slate-400 mt-0.5">
                                {occ.deposits?.[0]?.status === "HELD" ? "Held safely" : "Recorded"}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <p className="text-slate-700 font-medium">{formatDate(occ.joinDate)}</p>
                              {occ.leaveDate ? (
                                <p className="text-[11px] text-amber-600 mt-0.5">
                                  Left: {formatDate(occ.leaveDate)}
                                </p>
                              ) : null}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                                  isNotice
                                    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                                    : isLeft
                                      ? "bg-slate-100 text-slate-600 ring-1 ring-slate-400/20"
                                      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                }`}
                              >
                                {isNotice ? "On Notice" : isLeft ? "Left" : "Active"}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                              {!isLeft ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCheckoutOccupancy(occ)}
                                    className="text-[11px] text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                  >
                                    Check-out
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">Settled</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "import" && (
        <Card className="p-6">
          <div className="max-w-2xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Bulk Excel / CSV Resident Import
              </h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Import dozens of residents, rooms, beds and security deposits in a single transaction.
                Paste CSV data below matching the format:
              </p>
            </div>

            <pre className="rounded-xl bg-slate-900 p-3 font-mono text-xs text-slate-200 overflow-x-auto">
              {PG_CSV_TEMPLATE}
            </pre>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <ErrorBanner error={importError} />
              {importSuccess ? (
                <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                  {importSuccess}
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paste CSV Content
                </label>
                <textarea
                  rows={8}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Paste CSV rows here..."
                  className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <Button type="submit" loading={importing}>
                  <Upload className="size-4" />
                  Validate & Import
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCsvText(PG_CSV_TEMPLATE)}
                >
                  Load Sample Template
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {/* Check-in Modal */}
      {checkInOpen ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 p-2 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-xl animate-rise max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Check-in New Resident</h2>
                <p className="text-xs text-slate-500">
                  Assign room & bed, set monthly rent, and record initial security deposit.
                </p>
              </div>
              <button
                onClick={() => setCheckInOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCheckInSubmit} className="mt-4 space-y-4">
              <ErrorBanner error={checkInError} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Full Name"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={checkInForm.name}
                  onChange={(e) => setCheckInForm({ ...checkInForm, name: e.target.value })}
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="9876543210"
                  value={checkInForm.phone}
                  onChange={(e) => setCheckInForm({ ...checkInForm, phone: e.target.value })}
                />
              </div>

              <Input
                label="Email Address (Login ID)"
                type="email"
                required
                placeholder="rahul@example.com"
                value={checkInForm.email}
                onChange={(e) => setCheckInForm({ ...checkInForm, email: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Select Room"
                  required
                  value={checkInForm.unitId}
                  onChange={(e) => {
                    const uId = e.target.value;
                    const u = units.find((x) => x.id === uId);
                    setCheckInForm({
                      ...checkInForm,
                      unitId: uId,
                      bedId: "",
                      monthlyRent: u?.rentAmount || checkInForm.monthlyRent,
                    });
                  }}
                >
                  <option value="">-- Choose Room --</option>
                  {units.map((u) => {
                    const vacant = u.beds?.filter((b) => b.status === "VACANT").length || 0;
                    return (
                      <option key={u.id} value={u.id}>
                        Room {u.unitNumber} ({u.unitType}) · {vacant} vacant
                      </option>
                    );
                  })}
                </Select>

                <Select
                  label="Select Bed"
                  value={checkInForm.bedId}
                  onChange={(e) => {
                    const bId = e.target.value;
                    const b = selectedUnit?.beds?.find((x) => x.id === bId);
                    setCheckInForm({
                      ...checkInForm,
                      bedId: bId,
                      monthlyRent: b?.rentAmount || checkInForm.monthlyRent,
                    });
                  }}
                >
                  <option value="">-- Any Available Bed --</option>
                  {availableBeds.map((b) => (
                    <option key={b.id} value={b.id}>
                      Bed {b.bedLabel} {b.rentAmount ? `(₹${b.rentAmount})` : ""}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Monthly Rent (₹)"
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={checkInForm.monthlyRent}
                  onChange={(e) => setCheckInForm({ ...checkInForm, monthlyRent: e.target.value })}
                />
                <Input
                  label="Security Deposit (₹)"
                  type="number"
                  min="0"
                  step="500"
                  value={checkInForm.depositAmount}
                  onChange={(e) => setCheckInForm({ ...checkInForm, depositAmount: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Join Date"
                  type="date"
                  required
                  value={checkInForm.joinDate}
                  onChange={(e) => setCheckInForm({ ...checkInForm, joinDate: e.target.value })}
                />
                <Input
                  label="Notice Period (Days)"
                  type="number"
                  min="0"
                  value={checkInForm.noticePeriodDays}
                  onChange={(e) => setCheckInForm({ ...checkInForm, noticePeriodDays: e.target.value })}
                />
              </div>

              <div className="pt-1 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-700 mb-2">ID Proof / KYC (Optional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Document Type"
                    value={checkInForm.docType}
                    onChange={(e) => setCheckInForm({ ...checkInForm, docType: e.target.value })}
                  >
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="COLLEGE_ID">College Student ID</option>
                    <option value="OFFICE_ID">Company Employee ID</option>
                    <option value="OTHER">Other Proof</option>
                  </Select>
                  <Input
                    label="Document URL"
                    placeholder="https://..."
                    value={checkInForm.docUrl}
                    onChange={(e) => setCheckInForm({ ...checkInForm, docUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCheckInOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={checkInSaving}>
                  Confirm Check-in
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Check-out Modal */}
      {checkoutOccupancy ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 p-2 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-xl animate-rise max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Resident Check-out</h2>
                <p className="text-xs text-slate-500">
                  {checkoutOccupancy.user?.name} · Room {checkoutOccupancy.unit?.unitNumber}
                </p>
              </div>
              <button
                onClick={() => setCheckoutOccupancy(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="mt-4 space-y-4">
              <ErrorBanner error={checkoutError} />

              <Input
                label="Move-out / Leave Date"
                type="date"
                required
                value={checkoutDate}
                onChange={(e) => setCheckoutDate(e.target.value)}
              />

              {/* Deposit Settlement Card */}
              <div className="rounded-xl border border-slate-200/90 bg-slate-50 p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Security Deposit Held:</span>
                  <span className="font-bold text-slate-900">{formatMoney(depositHeld)}</span>
                </div>

                <div className="border-t border-slate-200/80 pt-2 space-y-2">
                  <p className="font-semibold text-slate-700">Deductions (Damages, Cleaning, Dues)</p>
                  {deductions.map((d, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Reason"
                        value={d.reason}
                        onChange={(e) => {
                          const next = [...deductions];
                          next[idx].reason = e.target.value;
                          setDeductions(next);
                        }}
                        className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={d.amount}
                        onChange={(e) => {
                          const next = [...deductions];
                          next[idx].amount = e.target.value;
                          setDeductions(next);
                        }}
                        className="w-24 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setDeductions(deductions.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setDeductions([...deductions, { reason: "Maintenance dues", amount: 500 }])}
                    className="text-[11px] font-semibold text-primary-600 hover:underline py-1"
                  >
                    + Add Deduction Item
                  </button>
                </div>

                <div className="border-t border-slate-200/80 pt-2 flex justify-between items-center font-bold text-sm">
                  <span>Net Refund to Resident:</span>
                  <span className="text-emerald-700">{formatMoney(netRefund)}</span>
                </div>
              </div>

              <Input
                label="Settlement Notes"
                placeholder="Refund method (UPI, cash), hand-over notes..."
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
              />

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCheckoutOccupancy(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={checkoutSaving} variant="danger">
                  Confirm Check-out & Settle
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
