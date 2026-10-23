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
  X,
  Building2,
  Users,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import { formatMoney } from "@/lib/format";
import { api } from "@/lib/client/api";

const BED_STATUS_THEME = {
  VACANT: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    dot: "bg-emerald-500",
    label: "Vacant",
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
    badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-400/20",
    dot: "bg-slate-400",
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
      // Refetch units
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
      {/* Header & Quick Stats */}
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
          <Button onClick={() => setIsAddOpen(true)} size="md">
            <Plus className="size-4" />
            Add Room
          </Button>
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Total Rooms</p>
          <p className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">{units.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Total Beds</p>
          <p className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">{totalBeds}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-4 shadow-2xs">
          <p className="text-xs font-semibold text-emerald-800">Vacant Beds</p>
          <p className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-700">{vacantBeds}</p>
        </div>
        <div className="rounded-2xl border border-sky-200/70 bg-sky-50/50 p-4 shadow-2xs">
          <p className="text-xs font-semibold text-sky-800">Occupied Beds</p>
          <p className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-sky-700">{occupiedBeds}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-slate-500">Occupancy Rate</p>
          <p className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">{occupancyRate}%</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-3.5 sm:p-4 shadow-2xs border border-slate-200/80 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search room (e.g. 101)..."
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

      {/* Rooms Grid */}
      {filteredUnits.length === 0 ? (
        <EmptyState
          icon={BedSingle}
          title="No rooms match your search"
          description="Try clearing your filters or create a new room."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredUnits.map((unit) => {
            const unitBeds = unit.beds || [];
            const vacantCount = unitBeds.filter((b) => b.status === "VACANT").length;
            const isFull = vacantCount === 0 && unitBeds.length > 0;

            return (
              <div
                key={unit.id}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs transition-all hover:shadow-xs"
              >
                {/* Room Header */}
                <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50/60 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        Room {unit.unitNumber}
                      </h3>
                      {unit.floor ? (
                        <span className="text-xs text-slate-500 font-medium">
                          · Floor {unit.floor}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                      <span>{unit.unitType} Sharing</span>
                      <span>·</span>
                      <span className="font-semibold text-slate-800">
                        {formatMoney(unit.rentAmount)}/mo
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {unit.ac ? (
                      <span
                        title="Air Conditioned"
                        className="inline-flex size-6 items-center justify-center rounded-md bg-sky-50 text-sky-700 ring-1 ring-sky-600/20"
                      >
                        <Wind className="size-3.5" />
                      </span>
                    ) : null}
                    {unit.attachedBathroom ? (
                      <span
                        title="Attached Bathroom"
                        className="inline-flex size-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20"
                      >
                        <Bath className="size-3.5" />
                      </span>
                    ) : null}
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                        isFull
                          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                      }`}
                    >
                      {isFull ? "Full" : `${vacantCount} Vacant`}
                    </span>
                  </div>
                </div>

                {/* Beds in Room */}
                <div className="p-4 space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Beds ({unitBeds.length})
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {unitBeds.map((bed) => {
                      const theme = BED_STATUS_THEME[bed.status] || BED_STATUS_THEME.VACANT;
                      const activeOccupancy = bed.occupancies?.[0];
                      const residentName = activeOccupancy?.user?.name;

                      return (
                        <div
                          key={bed.id}
                          className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 text-xs transition-all hover:border-slate-300 shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white font-bold text-slate-700 border border-slate-200/80 shadow-2xs">
                              {bed.bedLabel}
                            </span>
                            <div className="min-w-0">
                              {bed.status === "OCCUPIED" && residentName ? (
                                <p className="truncate font-semibold text-slate-900">
                                  {residentName}
                                </p>
                              ) : (
                                <p className="font-medium text-slate-600">
                                  {bed.status === "MAINTENANCE"
                                    ? "Under maintenance"
                                    : "Available"}
                                </p>
                              )}
                              <p className="text-[11px] text-slate-400">
                                {formatMoney(bed.rentAmount || unit.rentAmount)}/mo
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${theme.badge}`}
                            >
                              <span className={`size-1.5 rounded-full ${theme.dot}`} />
                              {theme.label}
                            </span>

                            {bed.status !== "OCCUPIED" ? (
                              <button
                                type="button"
                                onClick={() => handleToggleBedStatus(bed.id, bed.status)}
                                className="text-[10.5px] font-semibold text-slate-400 hover:text-slate-700 underline underline-offset-2"
                              >
                                {bed.status === "MAINTENANCE" ? "Mark Vacant" : "Maint."}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="border-t border-slate-100 bg-slate-50/30 px-4 py-2.5 text-right">
                  <Button
                    as="a"
                    href={`/admin/residents?room=${unit.unitNumber}`}
                    variant="ghost"
                    size="sm"
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Check-in Resident →
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Room Type"
                  value={form.unitType}
                  onChange={(e) => {
                    const type = e.target.value;
                    const cap = type === "SINGLE" ? 1 : type === "DOUBLE" ? 2 : type === "TRIPLE" ? 3 : 4;
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

