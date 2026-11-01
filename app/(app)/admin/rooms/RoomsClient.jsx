"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BedSingle,
  BedDouble,
  Plus,
  Search,
  Building2,
  Users,
  Wind,
  Bath,
  X,
  Phone,
  Calendar,
  Sparkles,
  LayoutGrid,
  List,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import { formatMoney, formatDate } from "@/lib/format";
import { api } from "@/lib/client/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBedCount(occupied, total) {
  const bedWord = total === 1 ? "bed" : "beds";
  return `${occupied} of ${total} ${bedWord}`;
}

function formatRoomType(unitType, bedCount) {
  const typeMap = {
    SINGLE: "Single",
    DOUBLE: "Double",
    TRIPLE: "Triple",
    DORM: "Dormitory",
  };
  const type = typeMap[unitType] || unitType || "Room";
  const bedWord = bedCount === 1 ? "bed" : "beds";
  return `${type} · ${bedCount} ${bedWord}`;
}

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function RoomsClient({ initialUnits = [], buildings = [] }) {
  const router = useRouter();
  const searchInputRef = useRef(null);

  const [units, setUnits] = useState(initialUnits);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterFloor, setFilterFloor] = useState("ALL");
  const [viewMode, setViewMode] = useState("GRID"); // "GRID" | "LIST"
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
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

  // Keyboard shortcut: Press "/" to focus search
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Natural Sort: "Room 101, 102, ... 109, 1011"
  const sortedUnits = useMemo(() => {
    return [...units].sort((a, b) => {
      const floorA = Number(a.floor) || 0;
      const floorB = Number(b.floor) || 0;
      if (floorA !== floorB) return floorA - floorB;
      return a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true });
    });
  }, [units]);

  // Overall metric calculations
  const allBeds = useMemo(() => sortedUnits.flatMap((u) => u.beds || []), [sortedUnits]);
  const totalBeds = allBeds.length;
  const occupiedBeds = allBeds.filter((b) => b.status === "OCCUPIED").length;
  const vacantBeds = allBeds.filter((b) => b.status === "VACANT").length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Distinct floors with counts
  const floorsList = useMemo(() => {
    const map = new Map();
    for (const u of sortedUnits) {
      const f = u.floor || "1";
      map.set(f, (map.get(f) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([floor, count]) => ({ floor, count }))
      .sort((a, b) => Number(a.floor) - Number(b.floor));
  }, [sortedUnits]);

  // Status counts for filter chips
  const statusCounts = useMemo(() => {
    let vacant = 0;
    let vacating = 0;
    let full = 0;

    for (const u of sortedUnits) {
      const uBeds = u.beds || [];
      const hasVacant = uBeds.some((b) => b.status === "VACANT");
      const hasNotice = uBeds.some((b) => b.occupancies?.some((o) => o.status === "NOTICE"));

      if (hasNotice) vacating++;
      if (hasVacant) vacant++;
      else if (uBeds.length > 0 && !hasVacant) full++;
    }

    return {
      ALL: sortedUnits.length,
      VACANT: vacant,
      VACATING: vacating,
      FULL: full,
    };
  }, [sortedUnits]);

  // Filtered units
  const filteredUnits = useMemo(() => {
    return sortedUnits.filter((u) => {
      // 1. Search Query
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchRoom = u.unitNumber.toLowerCase().includes(q);
        const matchFloor = String(u.floor || "").toLowerCase().includes(q);
        const matchResident = u.beds?.some((b) =>
          b.occupancies?.some((o) => o.user?.name?.toLowerCase().includes(q))
        );
        if (!matchRoom && !matchFloor && !matchResident) return false;
      }

      // 2. Floor Filter
      if (filterFloor !== "ALL" && String(u.floor) !== String(filterFloor)) {
        return false;
      }

      // 3. Status Filter
      if (filterStatus === "VACANT") {
        return u.beds?.some((b) => b.status === "VACANT");
      }
      if (filterStatus === "OCCUPIED" || filterStatus === "FULL") {
        return u.beds?.length > 0 && u.beds?.every((b) => b.status === "OCCUPIED");
      }
      if (filterStatus === "NOTICE" || filterStatus === "VACATING") {
        return u.beds?.some((b) => b.occupancies?.some((o) => o.status === "NOTICE"));
      }

      return true;
    });
  }, [sortedUnits, search, filterFloor, filterStatus]);

  // Group by floor for organized building overview
  const unitsByFloor = useMemo(() => {
    const groups = {};
    for (const u of filteredUnits) {
      const f = u.floor || "1";
      if (!groups[f]) groups[f] = [];
      groups[f].push(u);
    }
    return groups;
  }, [filteredUnits]);

  // Handlers
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
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-950">
            Rooms & Beds
          </h1>
          <p className="mt-0.5 text-xs text-neutral-500 font-medium">
            Real-time occupancy matrix, room pricing, and bed availability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Grid / List View Toggle */}
          <div className="flex items-center rounded-xl border border-neutral-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "GRID"
                  ? "bg-neutral-950 text-white shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
              title="Grid view"
              aria-label="Grid view"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "LIST"
                  ? "bg-neutral-950 text-white shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
              title="List view"
              aria-label="List view"
            >
              <List className="size-4" />
            </button>
          </div>

          <Button onClick={() => setIsAddOpen(true)} size="sm">
            <Plus className="size-4" />
            Add Room
          </Button>
        </div>
      </div>

      {/* ── SEPARATE KPI STAT BOXES (PER BEDY DESIGN SYSTEM) ── */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {/* Card 1: Total Rooms */}
        <button
          type="button"
          onClick={() => {
            setFilterStatus("ALL");
            setFilterFloor("ALL");
          }}
          className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-4 sm:p-5 text-left transition-all shadow-2xs hover:border-brand-300 hover:shadow-xs cursor-pointer ${
            filterStatus === "ALL" && filterFloor === "ALL"
              ? "border-neutral-300 ring-1 ring-neutral-300/50"
              : "border-neutral-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Total Rooms
            </span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
              <Building2 className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-neutral-900">
            {units.length}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-neutral-500">
            <span>In property</span>
            <span className="text-[11px] text-neutral-400 group-hover:text-brand-600 transition-colors">
              Reset filter
            </span>
          </div>
        </button>

        {/* Card 2: Total Beds */}
        <button
          type="button"
          onClick={() => setFilterStatus("ALL")}
          className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-4 sm:p-5 text-left transition-all shadow-2xs hover:border-brand-300 hover:shadow-xs cursor-pointer ${
            filterStatus === "ALL"
              ? "border-neutral-300 ring-1 ring-neutral-300/50"
              : "border-neutral-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Total Beds
            </span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
              <BedDouble className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-neutral-900">
            {totalBeds}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-neutral-500">
            <span>Total capacity</span>
            <span className="text-[11px] text-neutral-400 group-hover:text-brand-600 transition-colors">
              Show all
            </span>
          </div>
        </button>

        {/* Card 3: Vacant Beds (Click to filter) */}
        <button
          type="button"
          onClick={() => setFilterStatus((prev) => (prev === "VACANT" ? "ALL" : "VACANT"))}
          className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 text-left transition-all shadow-2xs cursor-pointer ${
            filterStatus === "VACANT"
              ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs"
              : "border-neutral-200 bg-white hover:border-emerald-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Vacant Beds
              </span>
              <span className="size-1.5 rounded-full bg-emerald-500" />
            </div>
            <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/20">
              <Sparkles className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-emerald-600">
            {vacantBeds}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-emerald-700">
            <span>Available to book</span>
            <span className="text-[11px] font-bold text-emerald-600">
              {filterStatus === "VACANT" ? "Active filter" : "Filter →"}
            </span>
          </div>
        </button>

        {/* Card 4: Occupied Beds (Click to filter) */}
        <button
          type="button"
          onClick={() => setFilterStatus((prev) => (prev === "OCCUPIED" ? "ALL" : "OCCUPIED"))}
          className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 text-left transition-all shadow-2xs cursor-pointer ${
            filterStatus === "OCCUPIED"
              ? "border-brand-500 bg-brand-50/40 ring-2 ring-brand-500/20 shadow-xs"
              : "border-neutral-200 bg-white hover:border-brand-300 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
              Occupied Beds
            </span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-600/20">
              <Users className="size-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-brand-700">
            {occupiedBeds}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-brand-600">
            <span>Active residents</span>
            <span className="text-[11px] font-bold text-brand-700">
              {filterStatus === "OCCUPIED" ? "Active filter" : "Filter →"}
            </span>
          </div>
        </button>

        {/* Card 5: Occupancy Rate */}
        <div className="relative flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Occupancy Rate
            </span>
            <span className="flex size-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-neutral-900">
              {occupancyRate}%
            </p>
            <div className="mt-2 flex items-center justify-between text-xs font-medium text-neutral-500">
              <span>{occupiedBeds} of {totalBeds} filled</span>
              <span className="text-[11px] font-bold text-neutral-600">{totalBeds - occupiedBeds} left</span>
            </div>
          </div>
          {/* Progress bar indicator */}
          <div className="mt-2.5 h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 transition-all duration-500"
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Chips Bar (Status & Floor Chips with counts) */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Status Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "ALL", label: "All", count: statusCounts.ALL },
            { id: "VACANT", label: "Vacant", count: statusCounts.VACANT },
            { id: "NOTICE", label: "Vacating", count: statusCounts.VACATING },
            { id: "FULL", label: "Full", count: statusCounts.FULL },
          ].map((tab) => {
            const active = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  active
                    ? "bg-neutral-950 text-white shadow-2xs"
                    : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                    active ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Floor Chips & Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Floor Chips */}
          {floorsList.length > 1 && (
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              <button
                type="button"
                onClick={() => setFilterFloor("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterFloor === "ALL"
                    ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                All Floors
              </button>
              {floorsList.map(({ floor, count }) => (
                <button
                  key={floor}
                  type="button"
                  onClick={() => setFilterFloor(floor)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    filterFloor === floor
                      ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  Floor {floor} ({count})
                </button>
              ))}
            </div>
          )}

          {/* Search Input with "/" shortcut */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search room or tenant..."
              className="w-full pl-8.5 pr-7 py-1.5 text-xs rounded-xl border border-neutral-200 bg-white placeholder:text-neutral-400 text-neutral-900 focus:border-brand-500 focus:outline-none shadow-2xs"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-neutral-50 border border-neutral-200 rounded px-1.5 py-0.2 text-neutral-400 font-sans pointer-events-none">
                /
              </kbd>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredUnits.length === 0 ? (
        <EmptyState
          icon={BedSingle}
          title="No rooms match your filters"
          description="Try clearing your search query or status filter to see other rooms."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearch("");
                setFilterStatus("ALL");
                setFilterFloor("ALL");
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : viewMode === "GRID" ? (
        /* GRID VIEW: Grouped by Floor */
        <div className="space-y-7">
          {Object.entries(unitsByFloor).map(([floor, floorRooms]) => (
            <div key={floor} className="space-y-3">
              {/* Floor Section Header */}
              <div className="flex items-center gap-2 px-1">
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-neutral-400 whitespace-nowrap">
                  Floor {floor}
                </span>
                <span className="text-neutral-300">·</span>
                <span className="text-xs font-semibold text-neutral-500 whitespace-nowrap">
                  {floorRooms.length} {floorRooms.length === 1 ? "room" : "rooms"}
                </span>
                <div className="h-px flex-1 bg-neutral-200 ml-2" />
              </div>

              {/* Room Cards Grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {floorRooms.map((unit) => {
                  const unitBeds = unit.beds || [];
                  const vacantCount = unitBeds.filter((b) => b.status === "VACANT").length;
                  const occupiedCount = unitBeds.filter((b) => b.status === "OCCUPIED").length;

                  const noticeBeds = unitBeds.filter((b) =>
                    b.occupancies?.some((o) => o.status === "NOTICE")
                  );
                  const hasNotice = noticeBeds.length > 0;

                  // Find nearest leaveDate
                  const noticeLeaves = noticeBeds
                    .flatMap((b) => b.occupancies || [])
                    .filter((o) => o.status === "NOTICE" && o.leaveDate)
                    .map((o) => o.leaveDate)
                    .sort();
                  const nearestLeaveDateStr = noticeLeaves[0];

                  return (
                    <div
                      key={unit.id}
                      onClick={() => setSelectedRoom(unit)}
                      className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-4 transition-all hover:border-brand-500/60 hover:shadow-xs cursor-pointer select-none"
                    >
                      {/* Top Row: Room Number & Single Status Slot */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-lg font-extrabold text-neutral-950 group-hover:text-brand-600 transition-colors whitespace-nowrap truncate">
                            Room {unit.unitNumber}
                          </h3>
                          <p className="text-xs text-neutral-500 font-medium whitespace-nowrap truncate mt-0.5">
                            Floor {unit.floor} · {formatRoomType(unit.unitType, unitBeds.length)}
                          </p>
                        </div>

                        {/* Single Status Slot (No duplicate stacking) */}
                        <div className="shrink-0">
                          {hasNotice ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-600/25 whitespace-nowrap"
                              title={`Vacating soon: ${nearestLeaveDateStr ? formatDate(nearestLeaveDateStr) : "On notice"}`}
                            >
                              <span className="size-1.5 rounded-full bg-amber-500" />
                              Vacating {nearestLeaveDateStr ? formatDateShort(nearestLeaveDateStr) : ""}
                            </span>
                          ) : vacantCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20 whitespace-nowrap">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              {vacantCount} Vacant
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-neutral-400 whitespace-nowrap">
                              Occupied
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle Row: Price & Differentiating Amenities */}
                      <div className="my-3 flex items-center justify-between gap-2 border-t border-neutral-100 pt-2.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-base sm:text-lg font-extrabold text-neutral-950 tabular-nums">
                            {formatMoney(unit.rentAmount)}
                          </span>
                          <span className="text-xs text-neutral-400 font-medium">/bed</span>
                        </div>

                        {/* Differentiating Amenities (Quiet text) */}
                        <div className="flex items-center gap-1.5 text-xs">
                          {unit.ac && (
                            <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                              AC
                            </span>
                          )}
                          {unit.attachedBathroom && (
                            <span className="text-[11px] font-medium text-neutral-400">
                              {unit.ac ? "· Bath" : "Attached bath"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: Bed Dots (●●○) & Primary Check-in Action */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100 text-xs">
                        {/* Bed Dots ●●○ */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {unitBeds.map((b) => {
                              const isBedNotice = b.occupancies?.some(
                                (o) => o.status === "NOTICE"
                              );
                              const isBedOcc = b.status === "OCCUPIED" || b.occupancies?.length > 0;
                              const isBedVacant = b.status === "VACANT" && !isBedOcc;

                              return (
                                <span
                                  key={b.id}
                                  title={`Bed ${b.bedLabel}: ${
                                    isBedNotice ? "Vacating" : isBedOcc ? "Occupied" : "Vacant"
                                  }`}
                                  className={`size-2.5 rounded-full transition-transform ${
                                    isBedNotice
                                      ? "bg-amber-500 ring-1 ring-amber-600/30"
                                      : isBedVacant
                                      ? "bg-emerald-500 ring-1 ring-emerald-600/30"
                                      : "bg-neutral-300"
                                  }`}
                                />
                              );
                            })}
                          </div>
                          <span className="text-xs text-neutral-500 font-medium">
                            {formatBedCount(occupiedCount, unitBeds.length)}
                          </span>
                        </div>

                        {/* Primary Action for Vacant Rooms */}
                        {vacantCount > 0 ? (
                          <Button
                            as="a"
                            href={`/admin/residents?room=${unit.unitNumber}`}
                            size="xs"
                            variant="primary"
                            onClick={(e) => e.stopPropagation()}
                            className="!text-xs !py-1 !px-2.5"
                          >
                            + Check in
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW: Dense Table */
        <div className="surface overflow-hidden border border-neutral-200 rounded-2xl shadow-2xs bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-3">Floor</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Beds Status</th>
                  <th className="py-3 px-3">Amenities</th>
                  <th className="py-3 px-3 text-right">Rent / Bed</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 pr-4 pl-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredUnits.map((unit) => {
                  const unitBeds = unit.beds || [];
                  const vacantCount = unitBeds.filter((b) => b.status === "VACANT").length;
                  const occupiedCount = unitBeds.filter((b) => b.status === "OCCUPIED").length;
                  const noticeBeds = unitBeds.filter((b) =>
                    b.occupancies?.some((o) => o.status === "NOTICE")
                  );
                  const hasNotice = noticeBeds.length > 0;
                  const noticeLeaves = noticeBeds
                    .flatMap((b) => b.occupancies || [])
                    .filter((o) => o.status === "NOTICE" && o.leaveDate)
                    .map((o) => o.leaveDate)
                    .sort();
                  const nearestLeaveDateStr = noticeLeaves[0];

                  return (
                    <tr
                      key={unit.id}
                      onClick={() => setSelectedRoom(unit)}
                      className="group hover:bg-neutral-50/70 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-4 font-bold text-neutral-950 group-hover:text-brand-600 whitespace-nowrap">
                        Room {unit.unitNumber}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 font-medium whitespace-nowrap">
                        Floor {unit.floor}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-600 font-medium whitespace-nowrap">
                        {formatRoomType(unit.unitType, unitBeds.length)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {unitBeds.map((b) => {
                              const isBedNotice = b.occupancies?.some(
                                (o) => o.status === "NOTICE"
                              );
                              const isBedOcc = b.status === "OCCUPIED" || b.occupancies?.length > 0;
                              const isBedVacant = b.status === "VACANT" && !isBedOcc;

                              return (
                                <span
                                  key={b.id}
                                  className={`size-2 rounded-full ${
                                    isBedNotice
                                      ? "bg-amber-500"
                                      : isBedVacant
                                      ? "bg-emerald-500"
                                      : "bg-neutral-300"
                                  }`}
                                />
                              );
                            })}
                          </div>
                          <span className="text-[11px] text-neutral-500 font-medium">
                            {occupiedCount}/{unitBeds.length}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-neutral-500 text-[11px]">
                        {unit.ac ? (
                          <span className="text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded font-bold">
                            AC
                          </span>
                        ) : null}
                        {unit.attachedBathroom ? (
                          <span className={unit.ac ? "ml-1.5" : ""}>Attached Bath</span>
                        ) : null}
                        {!unit.ac && !unit.attachedBathroom ? "Standard" : ""}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className="font-extrabold text-neutral-950 tabular-nums">
                          {formatMoney(unit.rentAmount)}
                        </span>
                        <span className="text-neutral-400 text-[11px] ml-0.5">/bed</span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {hasNotice ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-600/25">
                            <span className="size-1 rounded-full bg-amber-500" />
                            Vacating {nearestLeaveDateStr ? formatDateShort(nearestLeaveDateStr) : ""}
                          </span>
                        ) : vacantCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-600/20">
                            <span className="size-1 rounded-full bg-emerald-500" />
                            {vacantCount} Vacant
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[11px] font-semibold">
                            Full
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 pl-3 text-right whitespace-nowrap">
                        {vacantCount > 0 ? (
                          <Button
                            as="a"
                            href={`/admin/residents?room=${unit.unitNumber}`}
                            size="xs"
                            variant="primary"
                            onClick={(e) => e.stopPropagation()}
                            className="!text-[11px] !py-0.5 !px-2"
                          >
                            + Check-in
                          </Button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedRoom(unit)}
                            className="text-[11px] font-bold text-brand-600 hover:text-brand-700 hover:underline"
                          >
                            Manage →
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enlarged Room Detail Modal */}
      {selectedRoom ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-neutral-950/60 p-2 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl animate-rise max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Top Header */}
            <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-brand-950 text-white p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md font-black text-xl text-white border border-white/20">
                    {selectedRoom.unitNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold tracking-tight text-white">
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
                          : `${
                              selectedRoom.beds?.filter((b) => b.status === "VACANT").length
                            } Available`}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-300">
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

              {/* Quick Stats */}
              <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="rounded-xl bg-white/5 p-2.5 border border-white/10">
                  <p className="text-[10.5px] text-neutral-400 font-medium">Capacity</p>
                  <p className="font-extrabold text-white mt-0.5">
                    {selectedRoom.beds?.length || 0} Beds
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-2.5 border border-white/10">
                  <p className="text-[10.5px] text-neutral-400 font-medium">Occupied</p>
                  <p className="font-extrabold text-white mt-0.5">
                    {selectedRoom.beds?.filter((b) => b.status === "OCCUPIED").length || 0} Beds
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-2.5 border border-white/10">
                  <p className="text-[10.5px] text-neutral-400 font-medium">Available</p>
                  <p className="font-extrabold text-emerald-400 mt-0.5">
                    {selectedRoom.beds?.filter((b) => b.status === "VACANT").length || 0} Vacant
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-2.5 border border-white/10">
                  <p className="text-[10.5px] text-neutral-400 font-medium">Total Rent</p>
                  <p className="font-extrabold text-white mt-0.5">
                    {formatMoney(
                      (selectedRoom.rentAmount || 0) * (selectedRoom.beds?.length || 1)
                    )}
                    /mo
                  </p>
                </div>
              </div>
            </div>

            {/* Beds List */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
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
                    ? Math.max(
                        0,
                        Math.ceil(
                          (new Date(activeOccupancy.leaveDate) - new Date()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )
                    : null;

                  return (
                    <div
                      key={bed.id}
                      className={`rounded-2xl border p-4 transition-all ${
                        isNotice
                          ? "border-amber-300 bg-amber-50/40 ring-1 ring-amber-500/20 shadow-2xs"
                          : isOcc
                          ? "border-neutral-200 bg-white shadow-2xs"
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
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : isOcc
                                ? "bg-neutral-100 text-neutral-800 border-neutral-200"
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
                                  <h4 className="font-bold text-sm text-neutral-900">
                                    {occupant.name}
                                  </h4>
                                  {isNotice ? (
                                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-600/30">
                                      ⚠️ On Notice ·{" "}
                                      {daysLeft !== null
                                        ? `Vacating in ${daysLeft}d`
                                        : "Move-out pending"}
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10.5px] font-bold text-blue-700 ring-1 ring-blue-600/20">
                                      Active Resident
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                                  {occupant.phone && (
                                    <span className="flex items-center gap-1 font-medium">
                                      <Phone className="size-3 text-neutral-400" />
                                      {occupant.phone}
                                    </span>
                                  )}
                                  <span className="font-extrabold text-neutral-800 tabular-nums">
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
                                  <h4 className="font-bold text-sm text-neutral-900">
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
                                <p className="mt-1 text-xs text-neutral-500">
                                  Booking Rent:{" "}
                                  <span className="font-extrabold text-neutral-800 tabular-nums">
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
                                className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-2xs"
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
            <div className="bg-neutral-50 p-4 border-t border-neutral-200 flex items-center justify-between">
              <p className="text-xs text-neutral-500 font-medium">
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-neutral-950/50 p-2 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-xl animate-rise max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h2 className="text-base font-extrabold text-neutral-950">Add New Room</h2>
              <button
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
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
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.ac}
                    onChange={(e) => setForm({ ...form, ac: e.target.checked })}
                    className="size-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                  />
                  Air Conditioned (AC)
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.attachedBathroom}
                    onChange={(e) => setForm({ ...form, attachedBathroom: e.target.checked })}
                    className="size-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
                  />
                  Attached Bathroom
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-neutral-100">
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
