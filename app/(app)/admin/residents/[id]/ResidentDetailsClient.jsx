"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  Calendar,
  Wallet,
  Receipt,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  CreditCard,
  Edit2,
  LogOut,
  ExternalLink,
  Plus,
  X,
  FileCheck2,
  Eye,
  Check,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ui/Feedback";
import Avatar from "@/components/ui/Avatar";
import RecordPaymentModal from "@/components/billing/RecordPaymentModal";
import DocumentUploadSection from "@/components/residents/DocumentUploadSection";
import { api } from "@/lib/client/api";
import { formatMoney, formatDate, formatPeriod } from "@/lib/format";
import { buildRentReminderMessage, getWhatsAppUrl } from "@/lib/billing/whatsapp";

export default function ResidentDetailsClient({
  occupancy,
  allStays = [],
  documents = [],
  society,
  userRole = "OWNER",
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  // Modals state
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [preselectedInvoice, setPreselectedInvoice] = useState(null);

  // Edit Profile modal
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: occupancy.user?.name || "",
    phone: occupancy.user?.phone || "",
    email: occupancy.user?.email || "",
    monthlyRent: occupancy.monthlyRent || 0,
    noticePeriodDays: occupancy.noticePeriodDays || 30,
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  // Checkout modal
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().slice(0, 10));
  const [deductions, setDeductions] = useState([
    { reason: "Room Cleaning", amount: 1000 },
  ]);
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [checkoutSaving, setCheckoutSaving] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  // Receipt Modal
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);

  // Billing tab filters
  const [billingFilter, setBillingFilter] = useState("ALL"); // "ALL" | "UNPAID" | "PAID"

  // KYC status
  const hasAadhaar = documents.some((d) => d.docType === "AADHAAR");
  const hasPan = documents.some((d) => d.docType === "PAN");
  const isKycComplete = hasAadhaar && hasPan;

  // Invoices & Financial calculations
  const allInvoices = occupancy.invoices || [];
  const unpaidInvoices = allInvoices.filter(
    (inv) => inv.status === "PENDING" || inv.status === "OVERDUE" || inv.status === "PARTIALLY_PAID"
  );
  const outstandingBalance = unpaidInvoices.reduce(
    (sum, inv) => sum + Math.max(0, inv.totalAmount - inv.paidAmount),
    0
  );
  const isOverdue = unpaidInvoices.some(
    (inv) => inv.dueDate && new Date(inv.dueDate) < new Date()
  );

  // Security deposit held
  const heldDepositRecord = (occupancy.deposits || []).find((d) => d.status === "HELD");
  const depositHeld = heldDepositRecord
    ? heldDepositRecord.amountReceived
    : occupancy.status !== "LEFT"
    ? occupancy.depositAmount || 0
    : 0;

  // Last payment
  const allPayments = occupancy.payments || [];
  const lastPayment = allPayments[0] || null;

  // Notice & Days left
  const isNotice = occupancy.status === "NOTICE";
  const isLeft = occupancy.status === "LEFT";
  const daysLeft = occupancy.leaveDate
    ? Math.max(0, Math.ceil((new Date(occupancy.leaveDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  // WhatsApp Reminder URL
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const firstUnpaid = unpaidInvoices[0] || null;
  const payUrl = firstUnpaid ? `${origin}/pay/${firstUnpaid.id}` : "";
  const roomLabel = `Room ${occupancy.unit?.unitNumber || "-"}${occupancy.bed ? ` (Bed ${occupancy.bed.bedLabel})` : ""}`;
  const reminderText = firstUnpaid
    ? buildRentReminderMessage({
        residentName: occupancy.user?.name,
        roomLabel,
        period: firstUnpaid.billingPeriod,
        amount: outstandingBalance,
        dueDate: formatDate(firstUnpaid.dueDate),
        payUrl,
        pgName: society?.name || "Bedy PG",
      })
    : `Hi ${occupancy.user?.name}, greetings from ${society?.name || "Bedy PG"}.`;
  const waUrl = occupancy.user?.phone ? getWhatsAppUrl(occupancy.user?.phone, reminderText) : null;

  // Filtered invoices for Billing tab
  const displayedInvoices = useMemo(() => {
    if (billingFilter === "UNPAID") {
      return allInvoices.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED");
    }
    if (billingFilter === "PAID") {
      return allInvoices.filter((i) => i.status === "PAID");
    }
    return allInvoices;
  }, [allInvoices, billingFilter]);

  // Checkout deposit net refund calculation
  const totalDeductions = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const netRefund = Math.max(0, depositHeld - totalDeductions);

  // Edit Profile submit
  async function handleEditProfileSubmit(e) {
    e.preventDefault();
    setEditSaving(true);
    setEditError(null);

    try {
      // Update User profile (name, phone)
      await api.patch(`/api/residents/${occupancy.userId}`, {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
      });

      // Update Occupancy details (monthlyRent, noticePeriodDays)
      await api.patch(`/api/occupancies/${occupancy.id}`, {
        monthlyRent: Number(editForm.monthlyRent),
        noticePeriodDays: Number(editForm.noticePeriodDays),
      });

      setEditProfileOpen(false);
      router.refresh();
    } catch (err) {
      setEditError(err?.message || "Failed to update profile");
    } finally {
      setEditSaving(false);
    }
  }

  // Checkout submit
  async function handleCheckoutSubmit(e) {
    e.preventDefault();
    setCheckoutSaving(true);
    setCheckoutError(null);

    try {
      await api.post(`/api/occupancies/${occupancy.id}/checkout`, {
        leaveDate: checkoutDate,
        deductions: deductions.map((d) => ({
          reason: d.reason,
          amount: Number(d.amount) || 0,
        })),
        notes: checkoutNotes,
      });

      setCheckoutOpen(false);
      router.refresh();
    } catch (err) {
      setCheckoutError(err?.message || "Failed to process check-out");
    } finally {
      setCheckoutSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Link */}
      <div>
        <Link
          href="/admin/residents"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Residents & Check-in</span>
        </Link>
      </div>

      {/* 1. Resident Header */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar name={occupancy.user?.name} size="lg" className="size-14 text-lg font-bold" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {occupancy.user?.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isNotice
                      ? "bg-amber-100 text-amber-900 ring-1 ring-amber-600/30"
                      : isLeft
                      ? "bg-slate-100 text-slate-600"
                      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                  }`}
                >
                  {isNotice ? `On Notice (${daysLeft}d left)` : isLeft ? "Checked Out" : "Active"}
                </span>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isKycComplete
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                      : "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                  }`}
                >
                  <ShieldCheck className="size-3" />
                  {isKycComplete ? "KYC Verified" : "KYC Missing"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Building2 className="size-3.5 text-slate-400" />
                  <span>Room {occupancy.unit?.unitNumber || "-"}</span>
                  {occupancy.bed ? <span>(Bed {occupancy.bed.bedLabel})</span> : null}
                  <span className="font-normal text-slate-500">· {occupancy.unit?.unitType} Sharing</span>
                </div>

                <div className="flex items-center gap-1.5 font-mono">
                  <Phone className="size-3.5 text-slate-400" />
                  <span>{occupancy.user?.phone || "No phone"}</span>
                </div>

                {occupancy.user?.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="size-3.5 text-slate-400" />
                    <span>{occupancy.user.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            {outstandingBalance > 0 && waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors"
              >
                <MessageCircle className="size-3.5" />
                <span>WhatsApp Reminder</span>
              </a>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setPreselectedInvoice(firstUnpaid);
                setRecordPaymentOpen(true);
              }}
            >
              <CreditCard className="size-3.5" />
              <span>Record Payment</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditProfileOpen(true)}
            >
              <Edit2 className="size-3.5" />
              <span>Edit Profile</span>
            </Button>

            {!isLeft && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setCheckoutOpen(true)}
              >
                <LogOut className="size-3.5" />
                <span>Check-out</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Financial Summary Cards (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Monthly Rent
          </span>
          <span className="text-xl font-extrabold text-slate-900 mt-1 block">
            {formatMoney(occupancy.monthlyRent)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">per resident / month</span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Outstanding Balance
          </span>
          {outstandingBalance > 0 ? (
            <span
              className={`text-xl font-extrabold mt-1 block ${
                isOverdue ? "text-rose-600" : "text-amber-700"
              }`}
            >
              ₹{outstandingBalance.toLocaleString()} Due
            </span>
          ) : (
            <span className="text-xl font-extrabold text-emerald-600 mt-1 block flex items-center gap-1.5">
              <CheckCircle2 className="size-5" /> Paid Up
            </span>
          )}
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {unpaidInvoices.length} unpaid {unpaidInvoices.length === 1 ? "invoice" : "invoices"}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Security Deposit
          </span>
          <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
            {formatMoney(depositHeld)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {isLeft ? "Settled on checkout" : "Held safely"}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Last Payment
          </span>
          {lastPayment ? (
            <span className="text-xl font-extrabold text-slate-900 mt-1 block">
              {formatMoney(lastPayment.amount)}
            </span>
          ) : (
            <span className="text-sm font-bold text-slate-400 mt-2 block">No payments yet</span>
          )}
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {lastPayment ? formatDate(lastPayment.paymentDate) : "Awaiting first invoice"}
          </span>
        </div>
      </div>

      {/* 3. Five Organized Tabs */}
      <div className="space-y-4">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-0.5">
          {[
            { id: "overview", label: "Overview", icon: Building2 },
            { id: "billing", label: `Billing (${allInvoices.length})`, icon: Receipt },
            { id: "payments", label: `Payments (${allPayments.length})`, icon: Wallet },
            { id: "documents", label: `Profile & Documents (${documents.length})`, icon: FileText },
            { id: "history", label: `Stay History (${allStays.length})`, icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-brand-600 text-brand-700 font-extrabold"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                <Icon className={`size-4 ${isActive ? "text-brand-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Details Cards */}
            <div className="lg:col-span-2 space-y-4">
              {/* Room & Tenancy Details */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Room & Bed Assignment
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50/80 p-3">
                    <span className="text-[10.5px] text-slate-500 block font-medium">Room Number</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      Room {occupancy.unit?.unitNumber || "-"}
                    </span>
                    <span className="text-[10.5px] text-slate-400 mt-0.5 block">
                      Floor {occupancy.unit?.floor || "1"}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50/80 p-3">
                    <span className="text-[10.5px] text-slate-500 block font-medium">Bed Identifier</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      Bed {occupancy.bed?.bedLabel || "-"}
                    </span>
                    <span className="text-[10.5px] text-slate-400 mt-0.5 block">
                      {occupancy.unit?.unitType} Sharing
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50/80 p-3">
                    <span className="text-[10.5px] text-slate-500 block font-medium">Monthly Rent</span>
                    <span className="font-bold text-brand-700 text-sm mt-0.5 block">
                      {formatMoney(occupancy.monthlyRent)}
                    </span>
                    <span className="text-[10.5px] text-slate-400 mt-0.5 block">Billed monthly</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[10.5px] text-slate-500 block font-medium">Check-in Date</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      {formatDate(occupancy.joinDate)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10.5px] text-slate-500 block font-medium">Notice Period Policy</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      {occupancy.noticePeriodDays || 30} days required
                    </span>
                  </div>

                  <div>
                    <span className="text-[10.5px] text-slate-500 block font-medium">Move-out Date</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      {occupancy.leaveDate ? formatDate(occupancy.leaveDate) : "Indefinite stay"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Personal & Contact Information
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditProfileOpen(true)}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline"
                  >
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10.5px] text-slate-500 block">Full Name</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      {occupancy.user?.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10.5px] text-slate-500 block">Phone Number</span>
                    <span className="font-semibold font-mono text-slate-900 mt-0.5 block">
                      {occupancy.user?.phone || "Not provided"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10.5px] text-slate-500 block">Email Address</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      {occupancy.user?.email || "Not provided"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10.5px] text-slate-500 block">Member Since</span>
                    <span className="font-semibold text-slate-900 mt-0.5 block">
                      {formatDate(occupancy.user?.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Recent Invoices & Payments */}
            <div className="space-y-4">
              {/* Recent Invoices Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Recent Invoices
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("billing")}
                    className="text-[11px] font-bold text-brand-600 hover:underline"
                  >
                    View All
                  </button>
                </div>

                {allInvoices.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No invoices generated yet.</p>
                ) : (
                  <div className="space-y-2">
                    {allInvoices.slice(0, 3).map((inv) => (
                      <div
                        key={inv.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{formatPeriod(inv.billingPeriod)}</p>
                          <p className="text-[10.5px] text-slate-500">Due: {formatDate(inv.dueDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-slate-900">{formatMoney(inv.totalAmount)}</p>
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              inv.status === "PAID"
                                ? "bg-emerald-50 text-emerald-700"
                                : inv.status === "OVERDUE"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Payments Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Recent Payments
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab("payments")}
                    className="text-[11px] font-bold text-brand-600 hover:underline"
                  >
                    View All
                  </button>
                </div>

                {allPayments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No payments recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {allPayments.slice(0, 3).map((pay) => (
                      <div
                        key={pay.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-emerald-700">{formatMoney(pay.amount)}</p>
                          <p className="text-[10.5px] text-slate-500">{pay.paymentMethod}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-semibold text-slate-700">
                            {formatDate(pay.paymentDate)}
                          </p>
                          <span className="text-[10px] text-emerald-600 font-bold">Successful</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BILLING */}
        {activeTab === "billing" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span>Filter:</span>
                {[
                  { id: "ALL", label: `All Invoices (${allInvoices.length})` },
                  { id: "UNPAID", label: `Unpaid / Overdue (${unpaidInvoices.length})` },
                  { id: "PAID", label: "Paid" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setBillingFilter(f.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      billingFilter === f.id
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setPreselectedInvoice(firstUnpaid);
                  setRecordPaymentOpen(true);
                }}
              >
                <Plus className="size-3.5" /> Record Payment
              </Button>
            </div>

            {/* Invoices Table */}
            {displayedInvoices.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                No invoices found for this filter.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Invoice #</th>
                      <th className="px-4 py-3">Billing Period</th>
                      <th className="px-4 py-3">Invoice / Due Date</th>
                      <th className="px-4 py-3">Item Breakdown</th>
                      <th className="px-4 py-3 text-right">Total Amount</th>
                      <th className="px-4 py-3 text-right">Paid</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedInvoices.map((inv) => {
                      const balance = Math.max(0, inv.totalAmount - inv.paidAmount);
                      const isPastDue = inv.dueDate && new Date(inv.dueDate) < new Date();
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {formatPeriod(inv.billingPeriod)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <div>Inv: {formatDate(inv.invoiceDate)}</div>
                            <div className="text-[10.5px] text-slate-400">Due: {formatDate(inv.dueDate)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {(inv.items || []).map((item, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[10.5px] text-slate-700 font-medium"
                                >
                                  {item.name}: ₹{item.amount.toLocaleString()}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">
                            {formatMoney(inv.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                            {formatMoney(inv.paidAmount)}
                          </td>
                          <td className="px-4 py-3 text-right font-extrabold">
                            {balance > 0 ? (
                              <span className={isPastDue ? "text-rose-600" : "text-amber-700"}>
                                ₹{balance.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-emerald-600">₹0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                  : inv.status === "OVERDUE"
                                  ? "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={`/pay/${inv.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline"
                              >
                                View <ExternalLink className="size-3" />
                              </a>
                              {balance > 0 && (
                                <Button
                                  size="xs"
                                  variant="secondary"
                                  onClick={() => {
                                    setPreselectedInvoice(inv);
                                    setRecordPaymentOpen(true);
                                  }}
                                >
                                  Collect
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PAYMENTS */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-800">
                Payment History ({allPayments.length} recorded)
              </span>

              <Button
                size="sm"
                onClick={() => {
                  setPreselectedInvoice(firstUnpaid);
                  setRecordPaymentOpen(true);
                }}
              >
                <Plus className="size-3.5" /> Record Payment
              </Button>
            </div>

            {allPayments.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                No payments have been recorded for this resident yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Payment Method</th>
                      <th className="px-4 py-3">Applied Invoice</th>
                      <th className="px-4 py-3">Reference / Notes</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                          {formatDate(pay.paymentDate)}
                        </td>
                        <td className="px-4 py-3 font-extrabold text-emerald-700 whitespace-nowrap">
                          {formatMoney(pay.amount)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">
                          {pay.paymentMethod}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {pay.invoice ? (
                            <span>
                              {pay.invoice.invoiceNumber} ({formatPeriod(pay.invoice.billingPeriod)})
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Direct credit</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {pay.transactionReference || "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                            Successful
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptPayment(pay)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline"
                          >
                            <Receipt className="size-3" /> Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROFILE & DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tenant Identity Verification (KYC)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Government identity documents, Aadhaar, and PAN cards required for PG stay compliance.
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                    isKycComplete
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                      : "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"
                  }`}
                >
                  <ShieldCheck className="size-3.5" />
                  {isKycComplete ? "All Required Verified" : "KYC Incomplete"}
                </span>
              </div>

              <DocumentUploadSection
                userId={occupancy.userId}
                initialDocuments={documents}
                onDocumentsChange={(updated) => {
                  router.refresh();
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 5: STAY HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Occupancy & Room Transfer History</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete chronological history of room assignments, stays, and deposit settlements for {occupancy.user?.name}.
                </p>
              </div>

              <div className="space-y-3">
                {allStays.map((stay, index) => {
                  const isCurrent = stay.id === occupancy.id;
                  const depositRec = stay.deposits?.[0];
                  return (
                    <div
                      key={stay.id}
                      className={`rounded-xl border p-4 text-xs space-y-3 transition-colors ${
                        isCurrent
                          ? "border-brand-300 bg-brand-50/20 ring-1 ring-brand-500/20"
                          : "border-slate-200 bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">
                            Room {stay.unit?.unitNumber || "-"}
                            {stay.bed ? ` · Bed ${stay.bed.bedLabel}` : ""}
                          </span>
                          {isCurrent ? (
                            <span className="rounded-full bg-brand-600 text-white px-2 py-0.5 text-[10px] font-bold">
                              Current Stay
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-200 text-slate-700 px-2 py-0.5 text-[10px] font-bold">
                              Previous Stay
                            </span>
                          )}
                        </div>

                        <span className="font-bold text-slate-900">
                          {formatMoney(stay.monthlyRent)} / month
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-600">
                        <div>
                          <span className="text-[10.5px] text-slate-400 block">Check-in:</span>
                          <span className="font-semibold text-slate-800">{formatDate(stay.joinDate)}</span>
                        </div>
                        <div>
                          <span className="text-[10.5px] text-slate-400 block">Check-out:</span>
                          <span className="font-semibold text-slate-800">
                            {stay.leaveDate ? formatDate(stay.leaveDate) : "Currently Staying"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10.5px] text-slate-400 block">Deposit Status:</span>
                          <span className="font-semibold text-slate-800">
                            {depositRec?.status === "HELD" ? "Held safely" : depositRec?.status || "Recorded"}
                          </span>
                        </div>
                      </div>

                      {/* Deposit Settlement Details if any */}
                      {depositRec && depositRec.status !== "HELD" && (
                        <div className="rounded-lg bg-white border border-slate-200 p-2.5 text-[11px] space-y-1">
                          <span className="font-bold text-slate-800 block">Deposit Settlement:</span>
                          <div className="flex justify-between text-slate-600">
                            <span>Initial Deposit: {formatMoney(depositRec.amountReceived)}</span>
                            <span>Deductions: {formatMoney(depositRec.deductionsTotal)}</span>
                            <span className="font-bold text-emerald-700">Refunded: {formatMoney(depositRec.refundAmount)}</span>
                          </div>
                          {depositRec.notes && (
                            <p className="text-slate-500 italic mt-1">Notes: {depositRec.notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Edit Profile Modal */}
      {editProfileOpen && (
        <Modal
          open={editProfileOpen}
          onClose={() => setEditProfileOpen(false)}
          title="Edit Resident Profile & Agreement"
          description="Update personal contact information, monthly rent, and notice period."
          size="md"
        >
          <form onSubmit={handleEditProfileSubmit} className="space-y-4">
            <ErrorBanner error={editError} />

            <Input
              label="Full Name"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Phone Number"
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />

              <Input
                label="Email Address"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <Input
                label="Monthly Rent (₹)"
                type="number"
                min="0"
                step="500"
                required
                value={editForm.monthlyRent}
                onChange={(e) => setEditForm({ ...editForm, monthlyRent: e.target.value })}
              />

              <Input
                label="Notice Period (Days)"
                type="number"
                min="0"
                value={editForm.noticePeriodDays}
                onChange={(e) => setEditForm({ ...editForm, noticePeriodDays: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditProfileOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={editSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 2: Check-out with Deposit Settlement Modal */}
      {checkoutOpen && (
        <Modal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          title="Resident Check-out & Deposit Settlement"
          description={`Process check-out for ${occupancy.user?.name} from Room ${occupancy.unit?.unitNumber}.`}
          size="md"
        >
          <form onSubmit={handleCheckoutSubmit} className="space-y-4">
            <ErrorBanner error={checkoutError} />

            <Input
              label="Move-out / Leave Date"
              type="date"
              required
              value={checkoutDate}
              onChange={(e) => setCheckoutDate(e.target.value)}
            />

            {/* Deposit Settlement Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-700">
                <span>Security Deposit Held:</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {formatMoney(depositHeld)}
                </span>
              </div>

              <div className="border-t border-slate-200/80 pt-2 space-y-2">
                <span className="font-semibold text-slate-700 block">
                  Deductions (Damages, Cleaning, Dues):
                </span>
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
                      className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white"
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
                      className="w-24 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-bold"
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
                  className="text-[11px] font-semibold text-brand-600 hover:underline py-1"
                >
                  + Add Deduction Item
                </button>
              </div>

              <div className="border-t border-slate-200/80 pt-2 flex justify-between items-center font-bold text-sm">
                <span>Net Refund to Resident:</span>
                <span className="text-emerald-700 font-extrabold">{formatMoney(netRefund)}</span>
              </div>
            </div>

            <Input
              label="Settlement Notes"
              placeholder="UPI transaction reference, cash hand-over notes..."
              value={checkoutNotes}
              onChange={(e) => setCheckoutNotes(e.target.value)}
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCheckoutOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={checkoutSaving} variant="danger">
                Confirm Check-out & Settle
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: Record Payment Modal */}
      {recordPaymentOpen && (
        <RecordPaymentModal
          open={recordPaymentOpen}
          onClose={() => {
            setRecordPaymentOpen(false);
            setPreselectedInvoice(null);
          }}
          residentName={occupancy.user?.name}
          preselectedInvoice={preselectedInvoice}
          onSuccess={() => {
            setRecordPaymentOpen(false);
            setPreselectedInvoice(null);
            router.refresh();
          }}
        />
      )}

      {/* MODAL 4: Payment Receipt View Modal */}
      {selectedReceiptPayment && (
        <Modal
          open={Boolean(selectedReceiptPayment)}
          onClose={() => setSelectedReceiptPayment(null)}
          title="Payment Receipt"
          description={`Receipt details for ${formatMoney(selectedReceiptPayment.amount)} payment.`}
          size="sm"
          footer={
            <Button onClick={() => setSelectedReceiptPayment(null)}>
              Close
            </Button>
          }
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">Property:</span>
              <span className="font-bold text-slate-900">{society?.name || "Bedy PG"}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">Resident:</span>
              <span className="font-bold text-slate-900">{occupancy.user?.name}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">Room / Bed:</span>
              <span className="font-bold text-slate-900">
                Room {occupancy.unit?.unitNumber} {occupancy.bed ? `(Bed ${occupancy.bed.bedLabel})` : ""}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">Payment Date:</span>
              <span className="font-bold text-slate-900">{formatDate(selectedReceiptPayment.paymentDate)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-bold text-slate-900">{selectedReceiptPayment.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
              <span className="text-slate-500">Reference:</span>
              <span className="font-mono text-slate-700">{selectedReceiptPayment.transactionReference || "-"}</span>
            </div>
            <div className="flex justify-between items-center pt-1 font-bold text-sm">
              <span className="text-slate-900">Amount Paid:</span>
              <span className="text-emerald-700 font-extrabold">{formatMoney(selectedReceiptPayment.amount)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

