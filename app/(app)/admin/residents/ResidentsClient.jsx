"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Upload,
  Search,
  Users,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Phone,
  DoorOpen,
  Calendar,
  Receipt,
  FileText,
  FileCheck2,
  Trash2,
  Eye,
  X,
  AlertCircle,
  RotateCcw,
  Sparkles,
  CreditCard,
  Building2,
  BadgeAlert,
  ChevronRight,
} from "lucide-react";
import Button, { Spinner } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import Avatar from "@/components/ui/Avatar";
import RecordPaymentModal from "@/components/billing/RecordPaymentModal";
import { api } from "@/lib/client/api";
import { formatMoney, formatDate } from "@/lib/format";
import DocumentUploadSection from "@/components/residents/DocumentUploadSection";

const PG_CSV_TEMPLATE = `Room,Bed,Name,Phone,Email,JoinDate,MonthlyRent,Deposit
101,A,Ravi Kumar,9876543210,ravi@email.com,2026-06-01,7500,15000
101,B,Arun Prasad,9876543211,arun@email.com,2026-07-15,7500,15000
201,A,Suresh Nair,9876543212,suresh@email.com,2026-08-01,8500,17000`;

const KYC_DOCUMENT_OPTIONS = [
  { value: "AADHAAR", label: "Aadhaar Card / Govt ID", required: true },
  { value: "PAN", label: "PAN Card", required: true },
  { value: "COLLEGE_ID", label: "College / Student ID" },
  { value: "OFFICE_ID", label: "Company / Work ID" },
  { value: "DRIVING_LICENSE", label: "Driving License" },
  { value: "PASSPORT", label: "Passport" },
  { value: "VOTER_ID", label: "Voter ID" },
  { value: "OTHER", label: "Other ID Proof" },
];

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
  initialDocuments = [],
  initialStatus = "ACTIVE",
  initialRoom = "ALL",
}) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [kycResident, setKycResident] = useState(null);

  // Check-in modal
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInForm, setCheckInForm] = useState(EMPTY_CHECKIN);
  const [checkInDocs, setCheckInDocs] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState(null);
  const [docTypeToUpload, setDocTypeToUpload] = useState("AADHAAR");
  const [checkInSaving, setCheckInSaving] = useState(false);
  const [checkInError, setCheckInError] = useState(null);

  // CSV Import Modal
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);

  // Record payment modal
  const [paymentOccupancy, setPaymentOccupancy] = useState(null);

  // Search & Filters Toolbar State
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState(initialStatus); // "ALL" | "ACTIVE" | "NOTICE" | "LEFT"
  const [filterRoom, setFilterRoom] = useState(initialRoom); // "ALL" | roomNumber
  const [filterKyc, setFilterKyc] = useState("ALL"); // "ALL" | "VERIFIED" | "MISSING"
  const [filterDues, setFilterDues] = useState("ALL"); // "ALL" | "DUE" | "PAID"

  // Helper: check resident KYC status
  function getResidentKyc(userId) {
    const docs = (documents || []).filter((d) => d.userId === userId);
    const hasAadhaar = docs.some((d) => d.docType === "AADHAAR");
    const hasPan = docs.some((d) => d.docType === "PAN");
    return {
      isComplete: hasAadhaar && hasPan,
      hasAadhaar,
      hasPan,
      count: docs.length,
      docs,
    };
  }

  // Pre-calculate per-occupant financials
  const occupancyDataMap = useMemo(() => {
    const map = new Map();
    for (const occ of occupancies) {
      // Unpaid invoices
      const unpaidInvoices = (occ.invoices || []).filter(
        (inv) => inv.status === "PENDING" || inv.status === "OVERDUE" || inv.status === "PARTIALLY_PAID"
      );
      const outstandingBalance = unpaidInvoices.reduce(
        (sum, inv) => sum + Math.max(0, inv.totalAmount - inv.paidAmount),
        0
      );
      const isOverdue = unpaidInvoices.some(
        (inv) => inv.dueDate && new Date(inv.dueDate) < new Date()
      );

      // Security deposit
      const heldDeposit = (occ.deposits || []).find((d) => d.status === "HELD");
      const depositHeld = heldDeposit
        ? heldDeposit.amountReceived
        : occ.status !== "LEFT"
        ? occ.depositAmount || 0
        : 0;

      // KYC
      const kyc = getResidentKyc(occ.user?.id);

      map.set(occ.id, {
        outstandingBalance,
        isOverdue,
        unpaidInvoices,
        firstUnpaidInvoice: unpaidInvoices[0] || null,
        depositHeld,
        kyc,
      });
    }
    return map;
  }, [occupancies, documents]);

  // Summary Metrics
  const activeCount = useMemo(() => occupancies.filter((o) => o.status === "ACTIVE").length, [occupancies]);
  const noticeCount = useMemo(() => occupancies.filter((o) => o.status === "NOTICE").length, [occupancies]);
  const leftCount = useMemo(() => occupancies.filter((o) => o.status === "LEFT").length, [occupancies]);

  const duesStats = useMemo(() => {
    let totalDuesAmount = 0;
    let residentsWithDuesCount = 0;
    for (const occ of occupancies) {
      const data = occupancyDataMap.get(occ.id);
      if (data && data.outstandingBalance > 0) {
        totalDuesAmount += data.outstandingBalance;
        residentsWithDuesCount += 1;
      }
    }
    return { totalDuesAmount, residentsWithDuesCount };
  }, [occupancies, occupancyDataMap]);

  // Is any filter active?
  const hasActiveFilters =
    query.trim() !== "" ||
    filterStatus !== "ALL" ||
    filterRoom !== "ALL" ||
    filterKyc !== "ALL" ||
    filterDues !== "ALL";

  function clearAllFilters() {
    setQuery("");
    setFilterStatus("ALL");
    setFilterRoom("ALL");
    setFilterKyc("ALL");
    setFilterDues("ALL");
  }

  // Filtered Occupancies
  const filteredOccupancies = useMemo(() => {
    const q = query.trim().toLowerCase();
    return occupancies.filter((occ) => {
      // Status filter
      if (filterStatus !== "ALL" && occ.status !== filterStatus) return false;

      // Room filter
      if (filterRoom !== "ALL" && occ.unit?.unitNumber !== filterRoom) return false;

      const data = occupancyDataMap.get(occ.id);

      // KYC filter
      if (filterKyc === "VERIFIED" && !data?.kyc?.isComplete) return false;
      if (filterKyc === "MISSING" && data?.kyc?.isComplete) return false;

      // Dues filter
      if (filterDues === "DUE" && (!data || data.outstandingBalance <= 0)) return false;
      if (filterDues === "PAID" && data && data.outstandingBalance > 0) return false;

      // Search query
      if (!q) return true;
      return (
        occ.user?.name?.toLowerCase().includes(q) ||
        occ.user?.email?.toLowerCase().includes(q) ||
        occ.user?.phone?.toLowerCase().includes(q) ||
        occ.unit?.unitNumber?.toLowerCase().includes(q) ||
        occ.bed?.bedLabel?.toLowerCase().includes(q)
      );
    });
  }, [occupancies, query, filterStatus, filterRoom, filterKyc, filterDues, occupancyDataMap]);

  // Available beds for selected room in Check-in form
  const selectedUnit = units.find((u) => u.id === checkInForm.unitId);
  const availableBeds = useMemo(() => {
    if (!selectedUnit) return [];
    return selectedUnit.beds?.filter((b) => b.status === "VACANT") || [];
  }, [selectedUnit]);

  // Document upload in Check-in modal
  async function handleOnboardingDocUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingDoc(true);
    setDocUploadError(null);

    try {
      const newDocs = [];
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is larger than 10 MB`);
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "kyc");

        const res = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data?.error?.message || `Failed to upload ${file.name}`);
        }

        newDocs.push({
          docType: docTypeToUpload,
          fileUrl: data.data.fileUrl,
          cloudinaryPublicId: data.data.publicId,
          resourceType: data.data.resourceType,
          fileName: file.name,
        });
      }

      setCheckInDocs((prev) => {
        const next = [...prev, ...newDocs];
        if (docTypeToUpload === "AADHAAR" && !next.some((d) => d.docType === "PAN")) {
          setDocTypeToUpload("PAN");
        }
        return next;
      });
    } catch (err) {
      setDocUploadError(err?.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  }

  // Check-in submit
  async function handleCheckInSubmit(e) {
    e.preventDefault();
    setCheckInSaving(true);
    setCheckInError(null);

    try {
      await api.post("/api/occupancies", {
        ...checkInForm,
        documents: checkInDocs,
        monthlyRent: Number(checkInForm.monthlyRent),
        depositAmount: Number(checkInForm.depositAmount),
        noticePeriodDays: Number(checkInForm.noticePeriodDays),
      });

      setCheckInOpen(false);
      setCheckInForm(EMPTY_CHECKIN);
      setCheckInDocs([]);
      setDocUploadError(null);
      router.refresh();
    } catch (err) {
      setCheckInError(err?.message || "Failed to check-in resident");
    } finally {
      setCheckInSaving(false);
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
      setTimeout(() => {
        setImportOpen(false);
        setImportSuccess(null);
        router.refresh();
      }, 1500);
    } catch (err) {
      setImportError(err?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* 1. Header with Primary & Secondary Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Residents & Check-in
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage residents, room assignments, rent, deposits, and check-in/check-out activities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => setImportOpen(true)}
            size="md"
            className="shadow-2xs"
          >
            <Upload className="size-4" />
            Import Residents
          </Button>
          <Button onClick={() => setCheckInOpen(true)} size="md" className="shadow-xs">
            <Plus className="size-4" />
            Check-in Resident
          </Button>
        </div>
      </div>

      {/* 2. Compact Resident Statistics Bar (Clickable Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {/* Metric 1: Total Residents */}
        <button
          type="button"
          onClick={() => {
            setFilterStatus("ALL");
            setFilterDues("ALL");
          }}
          className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
            filterStatus === "ALL" && filterDues === "ALL"
              ? "border-slate-900 bg-slate-900 text-white shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-800"
          }`}
        >
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider block ${
              filterStatus === "ALL" && filterDues === "ALL" ? "text-slate-300" : "text-slate-500"
            }`}
          >
            Total Residents
          </span>
          <span className="text-xl font-extrabold mt-0.5 tracking-tight">
            {occupancies.length}
          </span>
        </button>

        {/* Metric 2: Active Residents */}
        <button
          type="button"
          onClick={() => {
            setFilterStatus("ACTIVE");
            setFilterDues("ALL");
          }}
          className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
            filterStatus === "ACTIVE" && filterDues === "ALL"
              ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
              : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 text-slate-800"
          }`}
        >
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider block ${
              filterStatus === "ACTIVE" && filterDues === "ALL" ? "text-emerald-100" : "text-slate-500"
            }`}
          >
            Active Staying
          </span>
          <span className="text-xl font-extrabold mt-0.5 tracking-tight text-emerald-700 group-hover:text-emerald-800">
            <span className={filterStatus === "ACTIVE" && filterDues === "ALL" ? "text-white" : "text-emerald-700"}>
              {activeCount}
            </span>
          </span>
        </button>

        {/* Metric 3: Residents on Notice */}
        <button
          type="button"
          onClick={() => {
            setFilterStatus("NOTICE");
            setFilterDues("ALL");
          }}
          className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
            filterStatus === "NOTICE"
              ? "border-amber-500 bg-amber-500 text-white shadow-xs"
              : noticeCount > 0
              ? "border-amber-200 bg-amber-50/50 hover:bg-amber-100/50 text-slate-800"
              : "border-slate-200 bg-white hover:border-slate-300 text-slate-800"
          }`}
        >
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider block ${
              filterStatus === "NOTICE" ? "text-amber-100" : "text-amber-700 font-bold"
            }`}
          >
            On Notice
          </span>
          <span className="text-xl font-extrabold mt-0.5 tracking-tight">
            <span className={filterStatus === "NOTICE" ? "text-white" : "text-amber-700"}>
              {noticeCount}
            </span>
          </span>
        </button>

        {/* Metric 4: Outstanding Dues */}
        <button
          type="button"
          onClick={() => {
            setFilterDues("DUE");
            setFilterStatus("ALL");
          }}
          className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
            filterDues === "DUE"
              ? "border-rose-600 bg-rose-600 text-white shadow-xs"
              : duesStats.residentsWithDuesCount > 0
              ? "border-rose-200 bg-rose-50/40 hover:bg-rose-100/40 text-slate-800"
              : "border-slate-200 bg-white hover:border-slate-300 text-slate-800"
          }`}
        >
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider block ${
              filterDues === "DUE" ? "text-rose-100" : "text-rose-600 font-bold"
            }`}
          >
            Outstanding Dues
          </span>
          <span className="text-xl font-extrabold mt-0.5 tracking-tight">
            <span className={filterDues === "DUE" ? "text-white" : "text-rose-600"}>
              ₹{duesStats.totalDuesAmount.toLocaleString()}
            </span>
          </span>
        </button>

        {/* Metric 5: Checked Out */}
        <button
          type="button"
          onClick={() => {
            setFilterStatus("LEFT");
            setFilterDues("ALL");
          }}
          className={`flex flex-col p-3 rounded-xl border text-left transition-all ${
            filterStatus === "LEFT"
              ? "border-slate-700 bg-slate-700 text-white shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-800"
          }`}
        >
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider block ${
              filterStatus === "LEFT" ? "text-slate-300" : "text-slate-500"
            }`}
          >
            Checked Out
          </span>
          <span className="text-xl font-extrabold mt-0.5 tracking-tight">
            {leftCount}
          </span>
        </button>
      </div>

      {/* 3. Compact Search & Filters Toolbar */}
      <div className="flex flex-col gap-2.5 rounded-2xl bg-white p-3 sm:p-3.5 shadow-2xs border border-slate-200/80">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search resident name, phone, room, bed..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-9 rounded-xl border border-slate-200/90 bg-white pl-9.5 pr-3 text-xs text-slate-900 shadow-2xs placeholder:text-slate-400 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Room Filter */}
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="h-9 rounded-xl border border-slate-200/90 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-brand-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Rooms</option>
              {units.map((u) => (
                <option key={u.id} value={u.unitNumber}>
                  Room {u.unitNumber}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-9 rounded-xl border border-slate-200/90 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-brand-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses ({occupancies.length})</option>
              <option value="ACTIVE">Active ({activeCount})</option>
              <option value="NOTICE">On Notice ({noticeCount})</option>
              <option value="LEFT">Checked Out ({leftCount})</option>
            </select>

            {/* KYC Filter */}
            <select
              value={filterKyc}
              onChange={(e) => setFilterKyc(e.target.value)}
              className="h-9 rounded-xl border border-slate-200/90 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-brand-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All KYC</option>
              <option value="VERIFIED">KYC Verified ✓</option>
              <option value="MISSING">KYC Missing / Incomplete</option>
            </select>

            {/* Dues Filter */}
            <select
              value={filterDues}
              onChange={(e) => setFilterDues(e.target.value)}
              className="h-9 rounded-xl border border-slate-200/90 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-brand-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Balances</option>
              <option value="DUE">Has Dues ({duesStats.residentsWithDuesCount})</option>
              <option value="PAID">Paid Up</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
              title="Reset all search and filters"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </button>
          )}
        </div>

        {/* Showing count indicator */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong>{filteredOccupancies.length}</strong> of {occupancies.length} residents
          </span>
          {hasActiveFilters && (
            <span className="text-amber-700 font-medium">Filtered results</span>
          )}
        </div>
      </div>

      {/* 4. Redesigned Resident Table & Mobile Cards */}
      {filteredOccupancies.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No residents match the selected filters"
          description="Try clearing your search query or adjusting your status filters to find residents."
          action={
            hasActiveFilters ? (
              <Button variant="secondary" onClick={clearAllFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button onClick={() => setCheckInOpen(true)}>
                <Plus className="size-4" /> Check-in Resident
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Mobile Cards View (< 640px) */}
          <div className="space-y-3 sm:hidden">
            {filteredOccupancies.map((occ) => {
              const data = occupancyDataMap.get(occ.id) || {
                outstandingBalance: 0,
                isOverdue: false,
                depositHeld: occ.depositAmount || 0,
                kyc: { isComplete: false, count: 0 },
              };
              const isNotice = occ.status === "NOTICE";
              const isLeft = occ.status === "LEFT";
              const daysLeft = occ.leaveDate
                ? Math.max(0, Math.ceil((new Date(occ.leaveDate) - new Date()) / (1000 * 60 * 60 * 24)))
                : null;

              return (
                <div
                  key={occ.id}
                  className={`rounded-2xl border p-4 shadow-2xs space-y-3 bg-white ${
                    isNotice ? "border-amber-300 bg-amber-50/20" : "border-slate-200"
                  }`}
                >
                  {/* Top: Name, Status, Room */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={occ.user?.name} size="sm" />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/residents/${occ.id}`}
                          className="font-bold text-slate-900 text-sm hover:text-brand-600 hover:underline flex items-center gap-1 truncate"
                        >
                          <span>{occ.user?.name}</span>
                          <ChevronRight className="size-3.5 text-slate-400 shrink-0" />
                        </Link>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {occ.user?.phone || "No phone"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isNotice
                          ? "bg-amber-100 text-amber-800 ring-1 ring-amber-600/30"
                          : isLeft
                          ? "bg-slate-100 text-slate-600"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                      }`}
                    >
                      {isNotice ? `On Notice (${daysLeft}d)` : isLeft ? "Left" : "Active"}
                    </span>
                  </div>

                  {/* Room & KYC Tags */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
                      Room {occ.unit?.unitNumber || "-"}{occ.bed ? ` · Bed ${occ.bed.bedLabel}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => setKycResident(occ.user)}
                      className={`inline-flex items-center justify-center size-5 rounded-md transition cursor-pointer shrink-0 ${
                        data.kyc.isComplete
                          ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                          : "text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200"
                      }`}
                      title={data.kyc.isComplete ? "KYC Verified (Aadhaar & PAN submitted)" : "KYC Missing - click to upload documents"}
                    >
                      {data.kyc.isComplete ? (
                        <ShieldCheck className="size-3" />
                      ) : (
                        <ShieldAlert className="size-3" />
                      )}
                    </button>
                  </div>

                  {/* Financial Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Rent</span>
                      <span className="font-bold text-slate-900">{formatMoney(occ.monthlyRent)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Balance</span>
                      {data.outstandingBalance > 0 ? (
                        <span className={`font-extrabold ${data.isOverdue ? "text-rose-600" : "text-amber-700"}`}>
                          ₹{data.outstandingBalance.toLocaleString()} Due
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-600">Paid Up</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block font-medium">Deposit</span>
                      <span className="font-bold text-slate-900">{formatMoney(data.depositHeld)}</span>
                    </div>
                  </div>

                  {/* Mobile Link to Details */}
                  <Link
                    href={`/admin/residents/${occ.id}`}
                    className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600 hover:text-brand-600 group"
                  >
                    <span>View Profile & Billing</span>
                    <ArrowRight className="size-3.5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= 640px) */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="border-b border-slate-200/80 bg-slate-50/90 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Resident</th>
                    <th className="px-4 py-3.5 font-bold">Room & Bed</th>
                    <th className="px-4 py-3.5 font-bold">Monthly Rent</th>
                    <th className="px-4 py-3.5 font-bold">Outstanding Balance</th>
                    <th className="px-4 py-3.5 font-bold">Security Deposit</th>
                    <th className="px-4 py-3.5 font-bold">Check-in Date</th>
                    <th className="px-4 py-3.5 font-bold text-center">Status</th>
                    <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOccupancies.map((occ) => {
                    const data = occupancyDataMap.get(occ.id) || {
                      outstandingBalance: 0,
                      isOverdue: false,
                      depositHeld: occ.depositAmount || 0,
                      kyc: { isComplete: false, count: 0 },
                    };
                    const isNotice = occ.status === "NOTICE";
                    const isLeft = occ.status === "LEFT";
                    const daysLeft = occ.leaveDate
                      ? Math.max(0, Math.ceil((new Date(occ.leaveDate) - new Date()) / (1000 * 60 * 60 * 24)))
                      : null;

                    return (
                      <tr
                        key={occ.id}
                        className={`transition-colors hover:bg-slate-50/70 ${
                          isNotice ? "bg-amber-50/30" : ""
                        }`}
                      >
                        {/* 1. Resident Column */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={occ.user?.name} size="sm" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/admin/residents/${occ.id}`}
                                  className="font-bold text-slate-900 hover:text-brand-600 hover:underline truncate"
                                  title="View full resident profile & billing"
                                >
                                  {occ.user?.name}
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => setKycResident(occ.user)}
                                  className={`inline-flex items-center justify-center size-5 rounded-md transition cursor-pointer shrink-0 ${
                                    data.kyc.isComplete
                                      ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                                      : "text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200"
                                  }`}
                                  title={data.kyc.isComplete ? "KYC Verified (Aadhaar & PAN submitted)" : "KYC Missing - click to upload documents"}
                                >
                                  {data.kyc.isComplete ? (
                                    <ShieldCheck className="size-3" />
                                  ) : (
                                    <ShieldAlert className="size-3" />
                                  )}
                                </button>
                              </div>
                              <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                                {occ.user?.phone || occ.user?.email || "No contact"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Room & Bed Column */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">
                              Room {occ.unit?.unitNumber || "-"}
                            </span>
                            {occ.bed ? (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-bold text-slate-700">
                                Bed {occ.bed.bedLabel}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {occ.unit?.unitType} Sharing
                          </p>
                        </td>

                        {/* 3. Monthly Rent Column */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-bold text-slate-900">
                            {formatMoney(occ.monthlyRent)}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">/ month</span>
                        </td>

                        {/* 4. Outstanding Balance Column */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {data.outstandingBalance > 0 ? (
                            <div>
                              <span
                                className={`inline-block font-extrabold text-xs ${
                                  data.isOverdue ? "text-rose-600" : "text-amber-700"
                                }`}
                              >
                                ₹{data.outstandingBalance.toLocaleString()}
                              </span>
                              <span
                                className={`block text-[10px] font-semibold ${
                                  data.isOverdue ? "text-rose-500" : "text-amber-600"
                                }`}
                              >
                                {data.isOverdue ? "Overdue" : "Pending Due"}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="size-3" /> Paid Up
                            </span>
                          )}
                        </td>

                        {/* 5. Security Deposit Column */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-bold text-emerald-700">
                            {formatMoney(data.depositHeld)}
                          </span>
                          <span className="text-[10.5px] text-slate-400 block mt-0.5">
                            {isLeft ? "Settled on checkout" : "Held safely"}
                          </span>
                        </td>

                        {/* 6. Check-in Date Column */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="text-slate-700 font-medium">
                            {formatDate(occ.joinDate)}
                          </span>
                          {occ.leaveDate ? (
                            <span className="text-[10.5px] text-amber-600 block mt-0.5 font-semibold">
                              Move-out: {formatDate(occ.leaveDate)}
                            </span>
                          ) : null}
                        </td>

                        {/* 7. Status Column */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {isNotice ? (
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 ring-1 ring-amber-600/30">
                              <span className="size-1.5 rounded-full bg-amber-600 animate-pulse" />
                              On Notice {daysLeft !== null ? `(${daysLeft}d left)` : ""}
                            </span>
                          ) : isLeft ? (
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600">
                              Checked Out
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                              Active
                            </span>
                          )}
                        </td>

                        {/* 8. Actions Column */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end">
                            <Link
                              href={`/admin/residents/${occ.id}`}
                              className="inline-flex items-center justify-center size-8 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              title="View resident details"
                            >
                              <ArrowRight className="size-4" />
                            </Link>
                          </div>
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

      {/* 5. Check-in Modal */}
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
                onClick={() => {
                  setCheckInOpen(false);
                  setCheckInDocs([]);
                  setDocUploadError(null);
                }}
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

              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      ID Proof & KYC Documents (Optional)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Choose required document type and upload directly here
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        checkInDocs.some((d) => d.docType === "AADHAAR")
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      Aadhaar {checkInDocs.some((d) => d.docType === "AADHAAR") ? "✓" : "Pending"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        checkInDocs.some((d) => d.docType === "PAN")
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      PAN {checkInDocs.some((d) => d.docType === "PAN") ? "✓" : "Pending"}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Select Document Needed
                      </label>
                      <select
                        value={docTypeToUpload}
                        onChange={(e) => setDocTypeToUpload(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                      >
                        {KYC_DOCUMENT_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label} {t.required ? "(Recommended)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-6">
                      <label
                        className={`flex items-center justify-center gap-2 w-full rounded-lg border border-brand-600 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100 cursor-pointer ${
                          uploadingDoc ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                      >
                        {uploadingDoc ? (
                          <>
                            <Spinner className="size-3.5 text-brand-600" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="size-3.5" />
                            <span>Upload Document</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          multiple
                          disabled={uploadingDoc}
                          className="hidden"
                          onChange={handleOnboardingDocUpload}
                        />
                      </label>
                    </div>
                  </div>

                  {docUploadError && (
                    <p className="mt-2 text-[11px] font-medium text-rose-600">{docUploadError}</p>
                  )}
                </div>

                {checkInDocs.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    <p className="text-[11px] font-semibold text-slate-600">
                      Uploaded Documents ({checkInDocs.length}):
                    </p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {checkInDocs.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileCheck2 className="size-4 shrink-0 text-emerald-600" />
                            <div className="truncate">
                              <span className="font-semibold text-slate-800">
                                {KYC_DOCUMENT_OPTIONS.find((t) => t.value === doc.docType)?.label || doc.docType}
                              </span>
                              <span className="ml-1.5 text-[11px] text-slate-400 truncate">
                                ({doc.fileName || "Uploaded file"})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-brand-600 hover:bg-brand-50 hover:underline"
                            >
                              <Eye className="size-3" />
                              View
                            </a>
                            <button
                              type="button"
                              onClick={() => setCheckInDocs((prev) => prev.filter((_, i) => i !== idx))}
                              className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                              title="Remove document"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

      {/* 6. Excel / CSV Import Modal */}
      {importOpen && (
        <Modal
          open={importOpen}
          onClose={() => setImportOpen(false)}
          title="Import Residents from Excel / CSV"
          description="Batch import residents, room & bed assignments, and security deposits."
          size="lg"
        >
          <div className="space-y-4">
            <ErrorBanner error={importError} />
            {importSuccess && (
              <div className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                {importSuccess}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">
                Expected CSV Format:
              </p>
              <pre className="rounded-xl bg-slate-900 p-3 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
                {PG_CSV_TEMPLATE}
              </pre>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Paste CSV Rows:
                </label>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Paste CSV rows here (Room,Bed,Name,Phone,Email,JoinDate,MonthlyRent,Deposit)..."
                  className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCsvText(PG_CSV_TEMPLATE)}
                >
                  Load Sample Data
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setImportOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={importing}>
                    <Upload className="size-4" /> Import Records
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* KYC Modal */}
      {kycResident && (
        <Modal
          open={Boolean(kycResident)}
          onClose={() => setKycResident(null)}
          size="lg"
          title={`Tenant Verification - ${kycResident.name}`}
          description="View and upload Aadhaar Card, PAN Card, and government identity proofs."
          footer={
            <Button onClick={() => setKycResident(null)}>
              Done
            </Button>
          }
        >
          <DocumentUploadSection
            userId={kycResident.id}
            initialDocuments={(documents || []).filter((d) => d.userId === kycResident.id)}
            onDocumentsChange={(updatedResidentDocs) => {
              setDocuments((prev) => [
                ...updatedResidentDocs,
                ...prev.filter((d) => d.userId !== kycResident.id),
              ]);
            }}
          />
        </Modal>
      )}

      {/* 9. Record Payment Modal */}
      {paymentOccupancy && (
        <RecordPaymentModal
          open={Boolean(paymentOccupancy)}
          onClose={() => setPaymentOccupancy(null)}
          residentName={paymentOccupancy.user?.name}
          onSuccess={() => {
            setPaymentOccupancy(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
