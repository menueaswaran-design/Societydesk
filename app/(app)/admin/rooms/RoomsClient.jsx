"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BedSingle,
  Plus,
  Search,
  Wind,
  Bath,
  X,
  Building2,
  Users,
  Phone,
  ChevronRight,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import { formatMoney } from "@/lib/format";
import { api } from "@/lib/client/api";

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

  const allBeds = units.flatMap((u) => u.beds || []);
  const totalBeds = allBeds.length;
  const occupiedBeds = allBeds.filter((b) => b.status === "OCCUPIED").length;
  const vacantBeds = allBeds.filter((b) => b.status === "VACANT").length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const filteredUnits = units.filter((u) => {
    if (search && !u.unitNumber.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== "ALL" && u.unitType !== filterType) return false;
    if (filterStatus === "VACANT") return u.beds.some((b) => b.status === "VACANT");
    if (filterStatus === "OCCUPIED") return u.beds.every((b) => b.status === "OCCUPIED");
    if (filterStatus === "MAINTENANCE") return u.beds.some((b) => b.status === "MAINTENANCE");
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
      setForm({ unitNumber: "", floor: "1", buildingId: buildings[0]?.id || "", unitType: "DOUBLE", bedCapacity: 2, rentAmount: 7000, ac: false, attachedBathroom: true });
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
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Rooms & Beds
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Occupancy matrix · {units.length} rooms · {totalBeds} beds · {occupancyRate}% filled
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} size="sm">
          <Plus className="size-3.5" /> Add Room
        </Button>
      </div>

      {/* Compact Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Rooms", value: units.length, color: "text-slate-900" },
          { label: "Total Beds", value: totalBeds, color: "text-slate-900" },
          { label: "Vacant", value: vacantBeds, color: "text-emerald-600" },
          { label: "Occupied", value: occupiedBeds, color: "text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-2xs text-center">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8.5 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-primary-500 focus:outline-none">
            <option value="ALL">All Statuses</option>
            <option value="VACANT">Has Vacant</option>
            <option value="OCCUPIED">Full</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-primary-500 focus:outline-none">
            <option value="ALL">All Types</option>
            <option value="SINGLE">Single</option>
            <option value="DOUBLE">Double</option>
            <option value="TRIPLE">Triple</option>
            <option value="DORM">Dorm</option>
          </select>
        </div>
      </div>

      {/* Room Cards Grid */}
      {filteredUnits.length === 0 ? (
        <EmptyState icon={BedSingle} title="No rooms found" description="Try clearing filters or add a new room." />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredUnits.map((unit) => {
            const beds = unit.beds || [];
            const vac = beds.filter((b) => b.status === "VACANT").length;
            const occ = beds.filter((b) => b.status === "OCCUPIED").length;
            const isFull = vac === 0 && beds.length > 0;

            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => setSelectedRoom(unit)}
                className={`group w-full text-left rounded-xl border bg-white p-3 shadow-2xs transition-all hover:shadow-sm hover:border-primary-400 cursor-pointer ${
                  isFull ? "border-slate-200" : "border-emerald-200/80"
                }`}
              >
                {/* Row 1: Room number + status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-bold text-slate-900">{unit.unitNumber}</span>
                    <span className="text-[10px] text-slate-500">
                      Fl {unit.floor || "G"} · {unit.unitType}
                    </span>
                    {unit.ac && <Wind className="size-3 text-sky-500" />}
                    {unit.attachedBathroom && <Bath className="size-3 text-indigo-500" />}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isFull
                      ? "bg-slate-100 text-slate-600"
                      : "bg-emerald-50 text-emerald-700"
                  }`}>
                    {isFull ? "Full" : `${vac} vacant`}
                  </span>
                </div>

                {/* Row 2: Price */}
                <div className="mt-1.5 text-xs">
                  <span className="font-bold text-slate-900">{formatMoney(unit.rentAmount)}</span>
                  <span className="text-slate-400">/bed</span>
                </div>

                {/* Row 3: Bed slots as a clean table */}
                <div className="mt-2 space-y-0.5">
                  {beds.map((bed) => {
                    const isOcc = bed.status === "OCCUPIED";
                    const isMaint = bed.status === "MAINTENANCE";
                    const resident = bed.occupancies?.[0]?.user;

                    return (
                      <div key={bed.id} className="flex items-center gap-1.5 text-[11px]">
                        <span className={`flex size-4 shrink-0 items-center justify-center rounded text-[9px] font-bold ${
                          isOcc ? "bg-blue-100 text-blue-700" : isMaint ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {bed.bedLabel}
                        </span>
                        <span className={`truncate ${isOcc ? "text-slate-800 font-medium" : isMaint ? "text-amber-600" : "text-emerald-600 font-medium"}`}>
                          {isOcc ? (resident?.name || "Occupied") : isMaint ? "Maintenance" : "Available"}
                        </span>
                        {isOcc && resident?.phone && (
                          <span className="ml-auto text-[10px] text-slate-400 shrink-0">{resident.phone}</span>
                        )}
                        {!isOcc && !isMaint && (
                          <span className="ml-auto text-[10px] text-emerald-500 font-semibold shrink-0">Open</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Row 4: Subtle footer */}
                <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-end">
                  <span className="text-[10px] font-semibold text-primary-500 group-hover:text-primary-600 flex items-center gap-0.5">
                    Manage <ChevronRight className="size-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Room Detail Modal ── */}
      {selectedRoom && (() => {
        const rm = selectedRoom;
        const rmBeds = rm.beds || [];
        const rmVac = rmBeds.filter((b) => b.status === "VACANT").length;
        const rmOcc = rmBeds.filter((b) => b.status === "OCCUPIED").length;

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-xs" onClick={() => setSelectedRoom(null)}>
            <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-rise" onClick={(e) => e.stopPropagation()}>

              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">Room {rm.unitNumber}</h2>
                    <span className="text-xs text-slate-500">Floor {rm.floor || "G"} · {rm.unitType}</span>
                    {rm.ac && <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">AC</span>}
                    {rm.attachedBathroom && <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">Bath</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatMoney(rm.rentAmount)}/bed · {rmBeds.length} beds · {rmOcc} occupied · {rmVac} vacant
                  </p>
                </div>
                <button onClick={() => setSelectedRoom(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <X className="size-5" />
                </button>
              </div>

              {/* Beds List */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
                {rmBeds.map((bed) => {
                  const isOcc = bed.status === "OCCUPIED";
                  const isMaint = bed.status === "MAINTENANCE";
                  const resident = bed.occupancies?.[0]?.user;

                  return (
                    <div key={bed.id} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                      isOcc ? "border-slate-200 bg-white" : isMaint ? "border-amber-200 bg-amber-50/30" : "border-emerald-200 bg-emerald-50/30"
                    }`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold border ${
                          isOcc ? "bg-blue-50 text-blue-700 border-blue-200" : isMaint ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                          {bed.bedLabel}
                        </span>
                        <div className="min-w-0">
                          {isOcc && resident ? (
                            <>
                              <p className="text-sm font-semibold text-slate-900 truncate">{resident.name}</p>
                              <p className="text-[11px] text-slate-500">
                                {resident.phone || resident.email || "No contact"} · {formatMoney(bed.rentAmount || rm.rentAmount)}/mo
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-slate-800">
                                {isMaint ? "Under Maintenance" : "Available"}
                              </p>
                              <p className="text-[11px] text-slate-500">{formatMoney(bed.rentAmount || rm.rentAmount)}/mo</p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isOcc ? (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">Occupied</span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={async () => {
                                await handleToggleBedStatus(bed.id, bed.status);
                                const next = bed.status === "MAINTENANCE" ? "VACANT" : "MAINTENANCE";
                                setSelectedRoom((p) => ({ ...p, beds: p.beds.map((b) => b.id === bed.id ? { ...b, status: next } : b) }));
                              }}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              {isMaint ? "Mark Vacant" : "Maint."}
                            </button>
                            {!isMaint && (
                              <Button as="a" href={`/admin/residents?room=${rm.unitNumber}`} size="sm" className="text-[10px] font-bold">
                                + Check-in
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                <Button as="a" href={`/admin/residents?room=${rm.unitNumber}`} size="sm" className="text-xs">
                  <Plus className="size-3.5" /> Check-in Resident
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setSelectedRoom(null)} className="text-xs">
                  Close
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add Room Modal ── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-xl animate-rise max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add New Room</h2>
              <button onClick={() => setIsAddOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="mt-4 space-y-4">
              <ErrorBanner error={error} />

              <div className="grid grid-cols-2 gap-3">
                <Input label="Room Number" required placeholder="101" value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} />
                <Input label="Floor" placeholder="1" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select label="Room Type" value={form.unitType} onChange={(e) => {
                  const t = e.target.value;
                  const c = t === "SINGLE" ? 1 : t === "DOUBLE" ? 2 : t === "TRIPLE" ? 3 : 4;
                  setForm({ ...form, unitType: t, bedCapacity: c });
                }}>
                  <option value="SINGLE">Single</option>
                  <option value="DOUBLE">Double</option>
                  <option value="TRIPLE">Triple</option>
                  <option value="DORM">Dorm</option>
                </Select>
                <Input label="Bed Capacity" type="number" min="1" max="20" required value={form.bedCapacity} onChange={(e) => setForm({ ...form, bedCapacity: e.target.value })} />
              </div>

              <Input label="Rent per Bed (₹)" type="number" min="0" step="500" required value={form.rentAmount} onChange={(e) => setForm({ ...form, rentAmount: e.target.value })} />

              <div className="flex items-center gap-5 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.ac} onChange={(e) => setForm({ ...form, ac: e.target.checked })} className="size-3.5 rounded border-slate-300 text-primary-600" /> AC
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form.attachedBathroom} onChange={(e) => setForm({ ...form, attachedBathroom: e.target.checked })} className="size-3.5 rounded border-slate-300 text-primary-600" /> Attached Bathroom
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" loading={pending}>Create Room</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
