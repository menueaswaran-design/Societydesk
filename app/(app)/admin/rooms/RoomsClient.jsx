"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BedSingle,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Wind,
  Bath,
  DoorOpen,
  Calendar,
  X,
  Building2,
  Users,
  ArrowRight,
  Phone,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import { formatMoney, formatDate } from "@/lib/format";
import { api } from "@/lib/client/api";

const BED_STATUS_THEME = {
  VACANT: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    dot: "bg-emerald-500",
    label: "Available",
  },
  OCCUPIED: {
    badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
    dot: "bg-blue-500",
    label: "Occupied",
  },
  RESERVED: {
    badge: "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20",
    dot: "bg-purple-500",
    label: "Reserved",
  },
  MAINTENANCE: {
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    dot: "bg-amber-500",
    label: "Maintenance",
  },
};

export default function RoomsClient({ initialUnits = [], buildings = [] }) {
  const router = useRouter();
  const [units, setUnits] = useState(initialUnits);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    unitNumber: "",
    floor: "1",
    buildingId: buildings[0]?.id || "",
    unitType: "DOUBLE",
    bedCapacity: 2,
    rentAmount: 7000,
    ac: false,
    attachedBathroom: true,
  });

  // Calculate high-level stats
  const allBeds = units.flatMap((u) => u.beds || []);
  const totalBeds = allBeds.length;
  const occupiedBeds = allBeds.filter((b) => b.status === "OCCUPIED").length;
  const vacantBeds = allBeds.filter((b) => b.status === "VACANT").length;
  const maintenanceBeds = allBeds.filter((b) => b.status === "MAINTENANCE").length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Filtered rooms
  const filteredUnits = units.filter((u) => {
    if (search && !u.unitNumber.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterType !== "ALL" && u.unitType !== filterType) {
      return false;
    }
    if (filterStatus === "VACANT") {
      return u.beds.some((b) => b.status === "VACANT");
    }
    if (filterStatus === "OCCUPIED") {
      return u.beds.every((b) => b.status === "OCCUPIED");
    }
    if (filterStatus === "NOTICE") {
      return u.beds.some((b) => b.occupancies?.some((o) => o.status === "NOTICE"));
    }
    if (filterStatus === "MAINTENANCE") {
      return u.beds.some((b) => b.status === "MAINTENANCE");
    }
    return true;
  });

  async function handleCreateRoom(e) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      await api.post("/api/units", {
        ...form,
        buildingId: form.buildingId?.trim() ? form.buildingId.trim() : null,
        floor: form.floor?.trim() ? form.floor.trim() : null,
        bedCapacity: Number(form.bedCapacity),
        rentAmount: Number(form.rentAmount),
      });
      setIsAddOpen(false);
      setForm({
        unitNumber: "",
        floor: "1",
        buildingId: buildings[0]?.id || "",
        unitType: "DOUBLE",
        bedCapacity: 2,
        rentAmount: 7000,
        ac: false,
        attachedBathroom: true,
      });
      router.refresh();
      const res = await api.get("/api/units");
      if (res?.data) setUnits(res.data);
    } catch (err) {
      setError(err?.message || "Failed to create room");
    } finally {
      setPending(false);
    }
  }

  async function handleToggleBedStatus(bedId, currentStatus) {
    const nextStatus = currentStatus === "MAINTENANCE" ? "VACANT" : "MAINTENANCE";
    try {
      await api.patch(`/api/beds/${bedId}`, { status: nextStatus });
      setUnits((prev) =>
        prev.map((u) => ({
          ...u,
          beds: u.beds.map((b) => (b.id === bedId ? { ...b, status: nextStatus } : b)),
        }))
      );
      router.refresh();
    } catch (err) {
      alert(err?.message || "Could not update bed");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Rooms & Beds
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time occupancy matrix, room pricing, and bed availability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsAddOpen(true)} size="md" className="font-semibold shadow-xs">
            <Plus className="size-4" />
            Add Room
          </Button>
        </div>
      </div>

      {/* Top 5 Metric Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Rooms</span>
            <Building2 className="size-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{units.length}</p>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">In property</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Beds</span>
            <BedSingle className="size-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{totalBeds}</p>
          <p className="mt-0.5 text-[11px] text-slate-400 font-medium">Overall capacity</p>
        </div>

        <div className="rounded-2xl border border-emerald-300/80 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
            <span>Vacant Beds</span>
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-emerald-700">{vacantBeds}</p>
          <p className="mt-0.5 text-[11px] text-emerald-600 font-semibold">Ready for check-in</p>
        </div>

        <div className="rounded-2xl border border-blue-300/80 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-blue-800">
            <span>Occupied Beds</span>
            <Users className="size-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-blue-700">{occupiedBeds}</p>
          <p className="mt-0.5 text-[11px] text-blue-600 font-semibold">Active residents</p>
        </div>

        <div className="rounded-2xl border border-indigo-200/80 bg-white p-4 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Occupancy Rate</span>
            <Sparkles className="size-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-black tracking-tight text-indigo-600">{occupancyRate}%</p>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-3.5 sm:p-4 shadow-2xs border border-slate-200/80 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search room number (e.g. 101)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200/90 bg-white py-2 pl-9.5 pr-3.5 text-xs text-slate-800 shadow-2xs placeholder:text-slate-400 focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15 focus:outline-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15 focus:outline-none"
          >
            <option value="ALL">All Bed Statuses</option>
            <option value="VACANT">Has Vacant Beds</option>
            <option value="OCCUPIED">Fully Occupied</option>
            <option value="NOTICE">⚠️ On Notice (Vacating)</option>
            <option value="MAINTENANCE">Has Maintenance</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15 focus:outline-none"
          >
            <option value="ALL">All Sharing Types</option>
            <option value="SINGLE">Single Room</option>
            <option value="DOUBLE">Double Sharing</option>
            <option value="TRIPLE">Triple Sharing</option>
            <option value="DORM">Dormitory</option>
          </select>
        </div>
      </div>

      {/* Rooms Grid - Minimal, Uniform & Pixel-Perfect Alignment */}
      {filteredUnits.length === 0 ? (
        <EmptyState
          icon={BedSingle}
          title="No rooms match your search"
          description="Try clearing your filters or create a new room."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredUnits.map((unit) => {
            const unitBeds = unit.beds || [];
            const vacantCount = unitBeds.filter((b) => b.status === "VACANT").length;
            const occupiedCount = unitBeds.filter((b) => b.status === "OCCUPIED").length;
            const isFull = vacantCount === 0 && unitBeds.length > 0;
            const noticeBeds = unitBeds.filter((b) => b.occupancies?.some((o) => o.status === "NOTICE"));
            const hasNotice = noticeBeds.length > 0;

            return (
              <div
                key={unit.id}
                onClick={() => setSelectedRoom(unit)}
                className={`group relative flex flex-col justify-between min-h-[175px] rounded-2xl border bg-white p-5 sm:p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer select-none ${
                  hasNotice
                    ? "border-amber-300 ring-1 ring-amber-400/20 hover:border-amber-500"
                    : isFull
                    ? "border-slate-200/90 hover:border-slate-400"
                    : "border-slate-200/90 hover:border-primary-500/60"
                }`}
              >
                {/* Top Row: Room Header & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                        Room {unit.unitNumber}
                      </h3>
                      {unit.floor ? (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          Floor {unit.floor}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 font-medium">
                      {unit.unitType} Sharing · {unitBeds.length} {unitBeds.length === 1 ? "Bed" : "Beds"}
                    </p>
                  </div>

                  {/* Clean Status Badges (with Notice indicator) */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {hasNotice && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-600/30"
                        title={`${noticeBeds.length} bed(s) vacating soon on notice`}
                      >
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        ⚠️ {noticeBeds.length} Vacating
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-tight shadow-2xs ${
                        isFull
                          ? "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/25"
                      }`}
                    >
                      {!isFull && <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      {isFull ? "Full" : `${vacantCount} Vacant`}
                    </span>
                  </div>
                </div>

                {/* Middle Row: Price & Amenities */}
                <div className="my-2.5 flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900">
                      {formatMoney(unit.rentAmount)}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/bed/mo</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {unit.ac && (
                      <span
                        title="Air Conditioned"
                        className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-600/20"
                      >
                        <Wind className="size-3" /> AC
                      </span>
                    )}
                    {unit.attachedBathroom && (
                      <span
                        title="Attached Bathroom"
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-600/20"
                      >
                        <Bath className="size-3" /> Bath
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Clean Bed Breakdown & Direct Click Prompt (NO PROGRESS BAR) */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500">
                    {occupiedCount} of {unitBeds.length} Beds Booked
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-primary-600 group-hover:translate-x-1 transition-transform">
                    View Beds & Manage <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enlarged Room Detail Modal / Drawer ("Click to Enlarge") */}
      {selectedRoom ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-2 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl animate-rise max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Top Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md font-black text-xl text-white border border-white/20">
                    {selectedRoom.unitNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold tracking-tight text-white">
                        Room {selectedRoom.unitNumber}
                      </h2>
                      {selectedRoom.floor ? (
                        <span className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-semibold text-white/90">
                          Floor {selectedRoom.floor}
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          selectedRoom.beds?.filter((b) => b.status === "VACANT").length === 0
                            ? "bg-white/20 text-white"
                            : "bg-emerald-500 text-white shadow-sm"
                        }`}
                      >
                        {selectedRoom.beds?.filter((b) => b.status === "VACANT").length === 0
                          ? "Fully Booked"
                          : `${selectedRoom.beds?.filter((b) => b.status === "VACANT").length} Available`}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">
                      {selectedRoom.unitType} Sharing · Base Rent{" "}
                      {formatMoney(selectedRoom.rentAmount)}/bed/mo
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRoom(null)}
                  className="rounded-xl p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Hero Stats */}
              <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="rounded-xl bg-white/5 p-2.5 border border-white/10">
                  <p className="text-[10.5px] text-slate-400 font-medium">Capacity</p>
                  <p className="font-bold text-white mt-0.5">
                    {selectedRoom.beds?.length || 0} Beds
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-2.5 border border-white/10">
                  <p className="text-[10.5px] text-slate-400 font-medium">Occupied</p>
                  <p className="font-bold text-white mt-0.5">
                    {selectedRoom.beds?.filter((b) => b.status === "OCCUPIED").length || 0} Beds
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-2.5 border border-white/10">
                  <p className="text-[10.5px] text-slate-400 font-medium">Available</p>
                  <p className="font-bold text-emerald-400 mt-0.5">
                    {selectedRoom.beds?.filter((b) => b.status === "VACANT").length || 0} Vacant
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-2.5 border border-white/10">
                  <p className="text-[10.5px] text-slate-400 font-medium">Total Rent</p>
                  <p className="font-bold text-white mt-0.5">
                    {formatMoney(
                      (selectedRoom.rentAmount || 0) * (selectedRoom.beds?.length || 1)
                    )}
                    /mo
                  </p>
                </div>
              </div>
            </div>

            {/* Beds List in Modal */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Beds & Current Residents
                </h3>
                <Button
                  as="a"
                  href={`/admin/residents?room=${selectedRoom.unitNumber}`}
                  size="sm"
                  className="text-xs font-bold"
                >
                  <Plus className="size-3.5" />
                  Check-in Resident
                </Button>
              </div>

              <div className="space-y-3">
                {selectedRoom.beds?.map((bed) => {
                  const activeOccupancy = bed.occupancies?.[0];
                  const occupant = activeOccupancy?.user;
                  const isOcc = bed.status === "OCCUPIED" || !!activeOccupancy;
                  const isNotice = activeOccupancy?.status === "NOTICE";
                  const isMaint = bed.status === "MAINTENANCE";
                  const daysLeft = activeOccupancy?.leaveDate
                    ? Math.max(0, Math.ceil((new Date(activeOccupancy.leaveDate) - new Date()) / (1000 * 60 * 60 * 24)))
                    : null;

                  return (
                    <div
                      key={bed.id}
                      className={`rounded-2xl border p-4 transition-all ${
                        isNotice
                          ? daysLeft !== null && daysLeft <= 7
                            ? "border-rose-300 bg-rose-50/40 ring-1 ring-rose-500/20 shadow-2xs"
                            : daysLeft !== null && daysLeft <= 15
                            ? "border-amber-300 bg-amber-50/40 ring-1 ring-amber-500/20 shadow-2xs"
                            : "border-yellow-300 bg-yellow-50/40 ring-1 ring-yellow-500/20 shadow-2xs"
                          : isOcc
                          ? "border-slate-200 bg-white shadow-2xs"
                          : isMaint
                          ? "border-amber-200 bg-amber-50/30"
                          : "border-emerald-200 bg-emerald-50/30 ring-1 ring-emerald-500/10"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl font-black text-base border shadow-2xs ${
                              isNotice
                                ? daysLeft !== null && daysLeft <= 7
                                  ? "bg-rose-100 text-rose-900 border-rose-300"
                                  : "bg-amber-100 text-amber-900 border-amber-300"
                                : isOcc
                                ? "bg-slate-100 text-slate-800 border-slate-200"
                                : isMaint
                                ? "bg-amber-100 text-amber-900 border-amber-200"
                                : "bg-emerald-100 text-emerald-900 border-emerald-300"
                            }`}
                          >
                            {bed.bedLabel}
                          </div>

                          <div>
                            {isOcc && occupant ? (
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-sm text-slate-900">
                                    {occupant.name}
                                  </h4>
                                  {isNotice ? (
                                    <span
                                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${
                                        daysLeft !== null && daysLeft <= 7
                                          ? "bg-rose-100 text-rose-800 ring-rose-600/30"
                                          : daysLeft !== null && daysLeft <= 15
                                          ? "bg-orange-100 text-orange-800 ring-orange-600/30"
                                          : "bg-yellow-100 text-yellow-800 ring-yellow-600/30"
                                      }`}
                                    >
                                      ⚠️ On Notice · {daysLeft !== null ? `Vacating in ${daysLeft}d` : "Move-out pending"}
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10.5px] font-bold text-blue-700 ring-1 ring-blue-600/20">
                                      Active Resident
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                  {occupant.phone && (
                                    <span className="flex items-center gap-1 font-medium">
                                      <Phone className="size-3 text-slate-400" />
                                      {occupant.phone}
                                    </span>
                                  )}
                                  <span className="font-bold text-slate-700">
                                    Rent: {formatMoney(bed.rentAmount || selectedRoom.rentAmount)}
                                    /mo
                                  </span>
                                </div>
                                {isNotice && activeOccupancy?.leaveDate && (
                                  <p className="mt-1 text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                                    <Calendar className="size-3.5 text-amber-600 shrink-0" />
                                    Scheduled Move-out: {formatDate(activeOccupancy.leaveDate)}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-sm text-slate-900">
                                    Bed {bed.bedLabel}{" "}
                                    {isMaint ? "(Under Maintenance)" : "(Available)"}
                                  </h4>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                                      isMaint
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-emerald-100 text-emerald-800"
                                    }`}
                                  >
                                    {isMaint ? "Maintenance" : "Vacant"}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                  Booking Rent:{" "}
                                  <span className="font-bold text-slate-700">
                                    {formatMoney(bed.rentAmount || selectedRoom.rentAmount)}/mo
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bed Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          {isNotice ? (
                            <Button
                              as="a"
                              href="/admin/residents?status=NOTICE"
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs"
                            >
                              Review & Settle
                            </Button>
                          ) : isOcc ? (
                            <Button
                              as="a"
                              href="/admin/residents"
                              variant="secondary"
                              size="sm"
                              className="text-xs font-semibold"
                            >
                              View Resident
                            </Button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={async () => {
                                  await handleToggleBedStatus(bed.id, bed.status);
                                  const nextStatus =
                                    bed.status === "MAINTENANCE" ? "VACANT" : "MAINTENANCE";
                                  setSelectedRoom((prev) => ({
                                    ...prev,
                                    beds: prev.beds.map((b) =>
                                      b.id === bed.id ? { ...b, status: nextStatus } : b
                                    ),
                                  }));
                                }}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                              >
                                {bed.status === "MAINTENANCE" ? "Mark Vacant" : "Set Maint."}
                              </button>

                              {bed.status === "VACANT" && (
                                <Button
                                  as="a"
                                  href={`/admin/residents?room=${selectedRoom.unitNumber}`}
                                  size="sm"
                                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                >
                                  + Check-in
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Bottom Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200/80 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Click Check-in to onboard a resident directly into this room.
              </p>
              <Button variant="secondary" onClick={() => setSelectedRoom(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal: Add Room */}
      {isAddOpen ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 p-2 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-xl animate-rise max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add New Room</h2>
              <button
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="mt-4 space-y-4">
              <ErrorBanner error={error} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Room Number"
                  required
                  placeholder="e.g. 101"
                  value={form.unitNumber}
                  onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
                />
                <Input
                  label="Floor"
                  placeholder="e.g. 1"
                  value={form.floor}
                  onChange={(e) => setForm({ ...form, floor: e.target.value })}
                />
              </div>

              {buildings.length > 0 && (
                <Select
                  label="Building / Block"
                  value={form.buildingId}
                  onChange={(e) => setForm({ ...form, buildingId: e.target.value })}
                >
                  <option value="">Default / Main Building</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Room Type"
                  value={form.unitType}
                  onChange={(e) => {
                    const type = e.target.value;
                    const cap =
                      type === "SINGLE" ? 1 : type === "DOUBLE" ? 2 : type === "TRIPLE" ? 3 : 4;
                    setForm({ ...form, unitType: type, bedCapacity: cap });
                  }}
                >
                  <option value="SINGLE">Single Room</option>
                  <option value="DOUBLE">Double Sharing</option>
                  <option value="TRIPLE">Triple Sharing</option>
                  <option value="DORM">Dormitory</option>
                </Select>

                <Input
                  label="Bed Capacity"
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={form.bedCapacity}
                  onChange={(e) => setForm({ ...form, bedCapacity: e.target.value })}
                />
              </div>

              <Input
                label="Monthly Rent per Bed (₹)"
                type="number"
                min="0"
                step="500"
                required
                value={form.rentAmount}
                onChange={(e) => setForm({ ...form, rentAmount: e.target.value })}
              />

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.ac}
                    onChange={(e) => setForm({ ...form, ac: e.target.checked })}
                    className="size-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  Air Conditioned (AC)
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.attachedBathroom}
                    onChange={(e) => setForm({ ...form, attachedBathroom: e.target.checked })}
                    className="size-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  Attached Bathroom
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={pending}>
                  Create Room & Beds
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
