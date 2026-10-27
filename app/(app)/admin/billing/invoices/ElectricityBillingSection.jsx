"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Zap,
  CheckCircle2,
  Split,
  Gauge,
  Receipt,
  AlertCircle,
  Info,
  Check,
  Building2,
  Users,
  RotateCcw,
  Sparkles,
} from "lucide-react";

/**
 * ElectricityBillingSection
 *
 * Fully redesigned, SaaS-grade electricity billing configuration section.
 * Supports 4 distinct billing methods with conditional rendering,
 * desktop table + mobile responsive cards, rate overrides, draft preservation,
 * and real-time live billing summary.
 */
export default function ElectricityBillingSection({
  allRooms = [],
  occupancies = [],
  occupantsByRoomMap = {},
  enabled = false,
  onToggleEnabled,
  onConfigChange,
}) {
  // Method selection: "ROOM_WISE" | "COMMON" | "FIXED" | "INCLUDED"
  const [method, setMethod] = useState("ROOM_WISE");

  // Option B: Split Total Bill Config
  const [splitConfig, setSplitConfig] = useState({
    type: "TOTAL", // "TOTAL" | "UNITS" | "PER_PERSON"
    totalBill: "",
    totalUnits: "",
    ratePerUnit: "10",
    fixedPerPerson: "",
  });

  // Option C: Room-Wise Sub-Meter Config
  const [roomWiseConfig, setRoomWiseConfig] = useState({
    defaultRate: 10,
    saveMeterReadings: true,
    includeCommonArea: false,
    commonType: "TOTAL",
    commonAmount: "",
    commonUnits: "",
    trackVacantOnly: true,
  });

  // State to track if owner just clicked "Apply to all rooms"
  const [rateAppliedNotice, setRateAppliedNotice] = useState(false);

  // Search/Filter for room sub-meter table
  const [roomFilter, setRoomFilter] = useState("ALL"); // "ALL" | "OCCUPIED" | "VACANT"
  const [roomSearch, setRoomSearch] = useState("");

  // Room-wise meter readings state: { [rKey]: { meterStart, meterEnd, ratePerUnit } }
  const [roomReadings, setRoomReadings] = useState(() => {
    const initial = {};
    for (const room of allRooms) {
      const rKey = room.id || room.unitNumber;
      initial[rKey] = {
        meterStart: room.lastReading != null ? String(room.lastReading) : "0",
        meterEnd: "",
        ratePerUnit: String(room.defaultRate || 10),
        lastReading: room.lastReading || 0,
        lastPeriod: room.lastPeriod || null,
      };
    }
    return initial;
  });

  // Option D: Fixed Electricity Charge Config
  const [fixedConfig, setFixedConfig] = useState({
    basis: "PER_RESIDENT", // "PER_RESIDENT" | "PER_ROOM"
    residentAmount: "",
    roomAmount: "",
  });

  // Occupancy metrics
  const occupiedRoomKeys = useMemo(() => {
    const keys = new Set();
    for (const occ of occupancies) {
      const k = occ.unit?.id || occ.unit?.unitNumber;
      if (k) keys.add(k);
    }
    return keys;
  }, [occupancies]);

  const totalRoomsCount = allRooms.length;
  const occupiedRoomsCount = useMemo(() => {
    return allRooms.filter((r) => occupiedRoomKeys.has(r.id || r.unitNumber)).length;
  }, [allRooms, occupiedRoomKeys]);
  const vacantRoomsCount = Math.max(0, totalRoomsCount - occupiedRoomsCount);
  const activeResidentsCount = occupancies.length;

  // Real-time calculations across rooms
  const roomCalculations = useMemo(() => {
    const calc = {};
    let totalUnits = 0;
    let totalRoomAmount = 0;
    let totalOccupiedAmount = 0;
    let hasValidationError = false;

    for (const room of allRooms) {
      const rKey = room.id || room.unitNumber;
      const data = roomReadings[rKey] || {
        meterStart: String(room.lastReading || 0),
        meterEnd: "",
        ratePerUnit: String(roomWiseConfig.defaultRate || 10),
      };

      const start = Number(data.meterStart) || 0;
      const hasEnd = data.meterEnd !== "" && data.meterEnd != null;
      const end = hasEnd ? Number(data.meterEnd) : null;
      const isNegative = hasEnd && end < start;
      if (isNegative) hasValidationError = true;

      const units = hasEnd && !isNegative ? end - start : 0;
      const rate = Number(data.ratePerUnit) || Number(roomWiseConfig.defaultRate) || 10;
      const amount = Math.round(units * rate);

      const occs = occupantsByRoomMap[rKey] || [];
      const isOccupied = occs.length > 0;
      const occupantCount = occs.length;
      const perResidentShare = isOccupied && occupantCount > 0 ? Math.round(amount / occupantCount) : 0;

      calc[rKey] = {
        start,
        end,
        hasEnd,
        isNegative,
        units,
        rate,
        amount,
        isOccupied,
        occupantCount,
        perResidentShare,
      };

      totalUnits += units;
      totalRoomAmount += amount;
      if (isOccupied) {
        totalOccupiedAmount += amount;
      }
    }

    return {
      byRoom: calc,
      totalUnits,
      totalRoomAmount,
      totalOccupiedAmount,
      hasValidationError,
    };
  }, [allRooms, roomReadings, roomWiseConfig.defaultRate, occupantsByRoomMap]);

  // Common area charges calculation
  const commonAreaTotal = useMemo(() => {
    if (!roomWiseConfig.includeCommonArea) return 0;
    if (roomWiseConfig.commonType === "UNITS") {
      const u = Number(roomWiseConfig.commonUnits) || 0;
      const r = Number(roomWiseConfig.defaultRate) || 10;
      return Math.round(u * r);
    }
    return Number(roomWiseConfig.commonAmount) || 0;
  }, [roomWiseConfig]);

  const commonPerResidentShare = useMemo(() => {
    if (commonAreaTotal <= 0 || activeResidentsCount <= 0) return 0;
    return Math.round(commonAreaTotal / activeResidentsCount);
  }, [commonAreaTotal, activeResidentsCount]);

  // Live Summary Metrics for active method
  const summaryMetrics = useMemo(() => {
    if (!enabled || method === "INCLUDED") {
      return {
        totalUnits: 0,
        totalRoomCharges: 0,
        commonCharges: 0,
        totalResidentBilled: 0,
        discrepancy: 0,
      };
    }

    if (method === "COMMON") {
      let totalBill = 0;
      let units = 0;
      if (splitConfig.type === "TOTAL") {
        totalBill = Number(splitConfig.totalBill) || 0;
        units = splitConfig.ratePerUnit > 0 ? Math.round(totalBill / Number(splitConfig.ratePerUnit)) : 0;
      } else if (splitConfig.type === "UNITS") {
        units = Number(splitConfig.totalUnits) || 0;
        totalBill = Math.round(units * (Number(splitConfig.ratePerUnit) || 10));
      } else if (splitConfig.type === "PER_PERSON") {
        const perPerson = Number(splitConfig.fixedPerPerson) || 0;
        totalBill = perPerson * activeResidentsCount;
      }

      const perResident = activeResidentsCount > 0 ? Math.round(totalBill / activeResidentsCount) : 0;
      const totalResidentBilled = perResident * activeResidentsCount;
      const discrepancy = Math.abs(totalBill - totalResidentBilled);

      return {
        totalUnits: units,
        totalRoomCharges: totalBill,
        commonCharges: 0,
        totalResidentBilled,
        discrepancy,
      };
    }

    if (method === "ROOM_WISE") {
      const totalResidentBilled = roomCalculations.totalOccupiedAmount + (commonPerResidentShare * activeResidentsCount);
      return {
        totalUnits: roomCalculations.totalUnits + (roomWiseConfig.includeCommonArea && roomWiseConfig.commonType === "UNITS" ? Number(roomWiseConfig.commonUnits) || 0 : 0),
        totalRoomCharges: roomCalculations.totalRoomAmount,
        commonCharges: commonAreaTotal,
        totalResidentBilled,
        discrepancy: 0,
      };
    }

    if (method === "FIXED") {
      if (fixedConfig.basis === "PER_RESIDENT") {
        const amt = Number(fixedConfig.residentAmount) || 0;
        const total = amt * activeResidentsCount;
        return {
          totalUnits: 0,
          totalRoomCharges: total,
          commonCharges: 0,
          totalResidentBilled: total,
          discrepancy: 0,
        };
      } else {
        const amt = Number(fixedConfig.roomAmount) || 0;
        const total = amt * occupiedRoomsCount;
        return {
          totalUnits: 0,
          totalRoomCharges: total,
          commonCharges: 0,
          totalResidentBilled: total,
          discrepancy: 0,
        };
      }
    }

    return {
      totalUnits: 0,
      totalRoomCharges: 0,
      commonCharges: 0,
      totalResidentBilled: 0,
      discrepancy: 0,
    };
  }, [
    enabled,
    method,
    splitConfig,
    activeResidentsCount,
    roomCalculations,
    commonAreaTotal,
    commonPerResidentShare,
    roomWiseConfig,
    fixedConfig,
    occupiedRoomsCount,
  ]);

  // Sync prepared electricityConfig payload to parent on any change
  useEffect(() => {
    if (!onConfigChange) return;

    if (!enabled || method === "INCLUDED") {
      onConfigChange(undefined);
      return;
    }

    if (method === "COMMON") {
      const payload = {
        mode: "COMMON",
        commonTotal:
          splitConfig.type === "TOTAL" && Number(splitConfig.totalBill) > 0
            ? Number(splitConfig.totalBill)
            : undefined,
        commonUnits:
          splitConfig.type === "UNITS" && Number(splitConfig.totalUnits) > 0
            ? Number(splitConfig.totalUnits)
            : undefined,
        commonRatePerUnit: splitConfig.type === "UNITS" ? Number(splitConfig.ratePerUnit) || 10 : undefined,
        commonPerPerson:
          splitConfig.type === "PER_PERSON" && Number(splitConfig.fixedPerPerson) > 0
            ? Number(splitConfig.fixedPerPerson)
            : undefined,
      };
      onConfigChange(payload);
      return;
    }

    if (method === "ROOM_WISE") {
      const rooms = allRooms
        .map((room) => {
          const rKey = room.id || room.unitNumber;
          const data = roomReadings[rKey] || {};
          const rate = Number(data.ratePerUnit) || Number(roomWiseConfig.defaultRate) || 10;
          const start = data.meterStart !== "" && data.meterStart != null ? Number(data.meterStart) : 0;
          const end = data.meterEnd !== "" && data.meterEnd != null ? Number(data.meterEnd) : undefined;
          let units = undefined;
          let amount = undefined;

          if (end != null && end >= start) {
            units = end - start;
            amount = Math.round(units * rate);
          }

          return {
            unitId: room.id,
            unitNumber: room.unitNumber,
            mode: "METER",
            meterStart: start,
            meterEnd: end,
            unitsConsumed: units,
            ratePerUnit: rate,
            amount: amount,
          };
        })
        .filter((r) => r.meterEnd != null || Number(r.amount) > 0);

      const payload = {
        mode: "ROOM_WISE",
        saveMeterReadings: roomWiseConfig.saveMeterReadings,
        rooms,
        commonTotal:
          roomWiseConfig.includeCommonArea && commonAreaTotal > 0 ? commonAreaTotal : undefined,
        commonPerPerson:
          roomWiseConfig.includeCommonArea && commonPerResidentShare > 0
            ? commonPerResidentShare
            : undefined,
      };
      onConfigChange(payload);
      return;
    }

    if (method === "FIXED") {
      if (fixedConfig.basis === "PER_RESIDENT") {
        const payload = {
          mode: "COMMON",
          commonPerPerson: Number(fixedConfig.residentAmount) || 0,
        };
        onConfigChange(payload);
      } else {
        // Fixed charge per occupied room
        const rooms = allRooms
          .filter((r) => occupiedRoomKeys.has(r.id || r.unitNumber))
          .map((r) => ({
            unitId: r.id,
            unitNumber: r.unitNumber,
            mode: "AMOUNT",
            amount: Number(fixedConfig.roomAmount) || 0,
          }));
        const payload = {
          mode: "ROOM_WISE",
          rooms,
        };
        onConfigChange(payload);
      }
    }
  }, [
    enabled,
    method,
    splitConfig,
    roomWiseConfig,
    roomReadings,
    fixedConfig,
    allRooms,
    occupiedRoomKeys,
    commonAreaTotal,
    commonPerResidentShare,
    onConfigChange,
  ]);

  // Handler: Apply default rate to all rooms in 1 click
  function handleApplyDefaultRate() {
    const rate = String(roomWiseConfig.defaultRate || 10);
    const updated = { ...roomReadings };
    for (const rKey of Object.keys(updated)) {
      updated[rKey] = { ...updated[rKey], ratePerUnit: rate };
    }
    setRoomReadings(updated);
    setRateAppliedNotice(true);
    setTimeout(() => setRateAppliedNotice(false), 2500);
  }

  // Handler: Update room reading field
  function handleUpdateRoom(rKey, field, val) {
    const prev = roomReadings[rKey] || {
      meterStart: "0",
      meterEnd: "",
      ratePerUnit: String(roomWiseConfig.defaultRate || 10),
    };
    setRoomReadings({
      ...roomReadings,
      [rKey]: { ...prev, [field]: val },
    });
  }

  // Filtered rooms for table
  const displayedRooms = useMemo(() => {
    return allRooms.filter((room) => {
      const rKey = room.id || room.unitNumber;
      const isOcc = occupiedRoomKeys.has(rKey);
      if (roomFilter === "OCCUPIED" && !isOcc) return false;
      if (roomFilter === "VACANT" && isOcc) return false;

      if (roomSearch.trim()) {
        const query = roomSearch.toLowerCase();
        const numMatch = String(room.unitNumber).toLowerCase().includes(query);
        const occs = occupantsByRoomMap[rKey] || [];
        const nameMatch = occs.some((o) => (o.user?.name || "").toLowerCase().includes(query));
        if (!numMatch && !nameMatch) return false;
      }
      return true;
    });
  }, [allRooms, occupiedRoomKeys, roomFilter, roomSearch, occupantsByRoomMap]);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all space-y-4">
      {/* 1. Header & Master Enable Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
            <Zap className="size-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Electricity Billing</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                  enabled
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                    : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                }`}
              >
                {enabled ? "Active" : "Disabled (Rent Only)"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure how electricity charges are calculated and allocated to residents.
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <label
          htmlFor="electricity-toggle"
          className="inline-flex items-center gap-3 cursor-pointer self-start sm:self-center select-none"
        >
          <span className="text-xs font-semibold text-slate-700">
            {enabled ? "Enabled" : "Enable Billing"}
          </span>
          <span className="relative inline-flex shrink-0">
            <input
              id="electricity-toggle"
              type="checkbox"
              role="switch"
              checked={enabled}
              onChange={(e) => onToggleEnabled(e.target.checked)}
              className="peer sr-only"
            />
            <span className="h-6 w-11 rounded-full bg-slate-200 ring-1 ring-slate-300 transition-colors duration-200 peer-checked:bg-brand-600 peer-checked:ring-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500" />
            <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5" />
          </span>
        </label>
      </div>

      {/* When Disabled: Zero Clutter Notice */}
      {!enabled ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center">
          <p className="text-xs text-slate-600">
            Electricity billing is currently disabled. Invoices will be generated for room rent only.
          </p>
          <button
            type="button"
            onClick={() => onToggleEnabled(true)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-2"
          >
            <Zap className="size-3.5" /> Enable electricity charges for this period
          </button>
        </div>
      ) : (
        /* When Enabled: Billing Configuration */
        <div className="space-y-4">
          {/* 2. Billing Method Selection Grid (4 Options) */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">
              Select Billing Method:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Option A: Included in Rent */}
              <button
                type="button"
                onClick={() => setMethod("INCLUDED")}
                className={`relative flex flex-col p-3 rounded-xl border text-left transition-all duration-150 ${
                  method === "INCLUDED"
                    ? "border-brand-600 bg-brand-50/20 ring-2 ring-brand-500/20 shadow-2xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2
                      className={`size-4 ${
                        method === "INCLUDED" ? "text-brand-600" : "text-slate-400"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-900">Included in Rent</span>
                  </div>
                  {method === "INCLUDED" && (
                    <span className="size-2 rounded-full bg-brand-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Charges are already included in monthly rent. No separate line item.
                </p>
              </button>

              {/* Option B: Split Total Bill */}
              <button
                type="button"
                onClick={() => setMethod("COMMON")}
                className={`relative flex flex-col p-3 rounded-xl border text-left transition-all duration-150 ${
                  method === "COMMON"
                    ? "border-brand-600 bg-brand-50/20 ring-2 ring-brand-500/20 shadow-2xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <Split
                      className={`size-4 ${
                        method === "COMMON" ? "text-brand-600" : "text-slate-400"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-900">Split Total Bill</span>
                  </div>
                  {method === "COMMON" && (
                    <span className="size-2 rounded-full bg-brand-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Divide total property electricity bill among active residents.
                </p>
              </button>

              {/* Option C: Room-Wise Sub-Meter */}
              <button
                type="button"
                onClick={() => setMethod("ROOM_WISE")}
                className={`relative flex flex-col p-3 rounded-xl border text-left transition-all duration-150 ${
                  method === "ROOM_WISE"
                    ? "border-brand-600 bg-brand-50/20 ring-2 ring-brand-500/20 shadow-2xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <Gauge
                      className={`size-4 ${
                        method === "ROOM_WISE" ? "text-brand-600" : "text-slate-400"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-900">Room-Wise Sub-Meter</span>
                  </div>
                  {method === "ROOM_WISE" && (
                    <span className="size-2 rounded-full bg-brand-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Calculate per room using sub-meter readings and rate per unit.
                </p>
              </button>

              {/* Option D: Fixed Electricity Charge */}
              <button
                type="button"
                onClick={() => setMethod("FIXED")}
                className={`relative flex flex-col p-3 rounded-xl border text-left transition-all duration-150 ${
                  method === "FIXED"
                    ? "border-brand-600 bg-brand-50/20 ring-2 ring-brand-500/20 shadow-2xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <Receipt
                      className={`size-4 ${
                        method === "FIXED" ? "text-brand-600" : "text-slate-400"
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-900">Fixed Charge</span>
                  </div>
                  {method === "FIXED" && (
                    <span className="size-2 rounded-full bg-brand-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Flat monthly electricity amount per resident or occupied room.
                </p>
              </button>
            </div>
          </div>

          {/* 3. Conditional Detail Panel */}

          {/* OPTION A: INCLUDED IN RENT */}
          {method === "INCLUDED" && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-700 flex items-start gap-3">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900 text-sm">Electricity is Included in Rent</p>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Monthly rent already covers resident electricity usage. Invoices for this billing cycle
                  will contain only room rent without any separate electricity line item or meter reading requirement.
                </p>
              </div>
            </div>
          )}

          {/* OPTION B: SPLIT TOTAL BILL */}
          {method === "COMMON" && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2.5">
                <span className="text-xs font-bold text-slate-800">Allocation Basis:</span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                  {[
                    { id: "TOTAL", label: "Equal Bill Split (₹)" },
                    { id: "UNITS", label: "By Property Units (kWh)" },
                    { id: "PER_PERSON", label: "Fixed per Resident (₹)" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSplitConfig({ ...splitConfig, type: tab.id })}
                      className={`px-3 py-1 rounded-md font-semibold transition-all ${
                        splitConfig.type === tab.id
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-mode 1: Equal Split */}
              {splitConfig.type === "TOTAL" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Total Property Electricity Bill Amount (₹) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={splitConfig.totalBill}
                          onChange={(e) =>
                            setSplitConfig({ ...splitConfig, totalBill: e.target.value })
                          }
                          placeholder="e.g. 6000"
                          className="w-full h-9.5 pl-8 pr-3 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 flex flex-col justify-center text-xs">
                      <div className="flex justify-between items-center text-slate-600 mb-1">
                        <span>Eligible Active Residents:</span>
                        <span className="font-bold text-slate-900">{activeResidentsCount}</span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-slate-900">
                        <span>Per-Resident Share:</span>
                        <span className="text-brand-700 font-extrabold text-sm">
                          ₹
                          {activeResidentsCount > 0 && Number(splitConfig.totalBill) > 0
                            ? Math.round(Number(splitConfig.totalBill) / activeResidentsCount).toLocaleString()
                            : "0"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-500 flex items-start gap-2">
                    <Info className="size-4 text-slate-400 shrink-0 mt-0.5" />
                    <p>
                      <strong>Vacant room policy:</strong> The total bill is divided only among active residents.
                      Vacant rooms ({vacantRoomsCount}) and unassigned beds are automatically excluded from the split.
                      Currency rounding is automatically balanced.
                    </p>
                  </div>
                </div>
              )}

              {/* Sub-mode 2: By Total Units */}
              {splitConfig.type === "UNITS" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Total Units Consumed (kWh) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={splitConfig.totalUnits}
                        onChange={(e) =>
                          setSplitConfig({ ...splitConfig, totalUnits: e.target.value })
                        }
                        placeholder="e.g. 600"
                        className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Rate per Unit (₹) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={splitConfig.ratePerUnit}
                          onChange={(e) =>
                            setSplitConfig({ ...splitConfig, ratePerUnit: e.target.value })
                          }
                          placeholder="10"
                          className="w-full h-9.5 pl-8 pr-3 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15"
                        />
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 flex flex-col justify-center text-xs">
                      <div className="flex justify-between items-center text-slate-600 mb-1">
                        <span>Calculated Total Bill:</span>
                        <span className="font-bold text-slate-900">
                          ₹
                          {(
                            (Number(splitConfig.totalUnits) || 0) * (Number(splitConfig.ratePerUnit) || 10)
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-slate-900">
                        <span>Share per Resident:</span>
                        <span className="text-brand-700 font-extrabold text-sm">
                          ₹
                          {activeResidentsCount > 0
                            ? Math.round(
                                ((Number(splitConfig.totalUnits) || 0) * (Number(splitConfig.ratePerUnit) || 10)) /
                                  activeResidentsCount
                              ).toLocaleString()
                            : "0"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-mode 3: Fixed per Resident */}
              {splitConfig.type === "PER_PERSON" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Fixed Charge per Resident (₹) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={splitConfig.fixedPerPerson}
                          onChange={(e) =>
                            setSplitConfig({ ...splitConfig, fixedPerPerson: e.target.value })
                          }
                          placeholder="e.g. 500"
                          className="w-full h-9.5 pl-8 pr-3 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15"
                        />
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 flex flex-col justify-center text-xs">
                      <div className="flex justify-between items-center text-slate-600 mb-1">
                        <span>Active Residents:</span>
                        <span className="font-bold text-slate-900">{activeResidentsCount}</span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-slate-900">
                        <span>Total Expected Collection:</span>
                        <span className="text-brand-700 font-extrabold text-sm">
                          ₹
                          {(
                            (Number(splitConfig.fixedPerPerson) || 0) * activeResidentsCount
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OPTION C: ROOM-WISE SUB-METER (Primary Interface) */}
          {method === "ROOM_WISE" && (
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 space-y-4 shadow-2xs">
              {/* Configuration Toolbar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl bg-slate-50/80 border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-bold text-slate-800">Default Rate:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-600">₹</span>
                    <input
                      type="number"
                      min="1"
                      value={roomWiseConfig.defaultRate}
                      onChange={(e) =>
                        setRoomWiseConfig({
                          ...roomWiseConfig,
                          defaultRate: Number(e.target.value) || 10,
                        })
                      }
                      className="w-16 h-8 text-xs font-bold text-center rounded-lg border border-slate-300 bg-white focus:border-brand-500"
                    />
                    <span className="text-xs text-slate-500 font-medium">/ unit</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyDefaultRate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-2xs transition-colors"
                  >
                    {rateAppliedNotice ? (
                      <>
                        <Check className="size-3.5" /> Applied to all rooms!
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-3.5" /> Apply to all rooms
                      </>
                    )}
                  </button>
                </div>

                {/* Additional Settings Toggles */}
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={roomWiseConfig.saveMeterReadings}
                      onChange={(e) =>
                        setRoomWiseConfig({
                          ...roomWiseConfig,
                          saveMeterReadings: e.target.checked,
                        })
                      }
                      className="rounded accent-brand-600 size-4 cursor-pointer"
                    />
                    <span className="font-medium">Remember readings for next month</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={roomWiseConfig.includeCommonArea}
                      onChange={(e) =>
                        setRoomWiseConfig({
                          ...roomWiseConfig,
                          includeCommonArea: e.target.checked,
                        })
                      }
                      className="rounded accent-brand-600 size-4 cursor-pointer"
                    />
                    <span className="font-medium">Separate common-area charges</span>
                  </label>
                </div>
              </div>

              {/* Common Area Charges Strip (if enabled) */}
              {roomWiseConfig.includeCommonArea && (
                <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-950">
                      Common-Area Electricity (Hallway, Pump, Lobbies)
                    </span>
                    <span className="text-amber-800 text-[11px]">
                      Split equally across all active residents
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Total Common Electricity Amount (₹):
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={roomWiseConfig.commonAmount}
                          onChange={(e) =>
                            setRoomWiseConfig({
                              ...roomWiseConfig,
                              commonAmount: e.target.value,
                            })
                          }
                          placeholder="e.g. 1500"
                          className="w-full h-8 pl-8 pr-3 text-xs font-bold rounded-lg border border-amber-300 bg-white"
                        />
                      </div>
                    </div>

                    <div className="rounded-lg bg-white/80 border border-amber-200/80 p-2 flex items-center justify-between">
                      <span className="text-slate-600">Per-Resident Common Share:</span>
                      <span className="text-amber-900 font-extrabold text-xs">
                        ₹{commonPerResidentShare.toLocaleString()} / resident
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Vacant Room Handling Explanatory Note */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] text-slate-600 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <Info className="size-4 text-slate-400 shrink-0" />
                  <span>
                    <strong>Vacant rooms handling:</strong> Meter readings entered for vacant rooms are recorded
                    for property tracking only and are excluded from resident billing.
                  </span>
                </div>
                <span className="font-semibold text-slate-700">
                  {occupiedRoomsCount} Occupied · {vacantRoomsCount} Vacant
                </span>
              </div>

              {/* Filter / Search Bar for Rooms */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "ALL", label: `All Rooms (${allRooms.length})` },
                    { id: "OCCUPIED", label: `Occupied (${occupiedRoomsCount})` },
                    { id: "VACANT", label: `Vacant (${vacantRoomsCount})` },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setRoomFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        roomFilter === f.id
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="w-full sm:w-48">
                  <input
                    type="text"
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                    placeholder="Search room or resident..."
                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* DESKTOP TABLE VIEW (`hidden md:block`) */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 max-h-96 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 text-slate-600 font-bold z-10">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Room</th>
                      <th className="py-2.5 px-3 font-semibold">Residents</th>
                      <th className="py-2.5 px-3 font-semibold w-28">Prev Reading</th>
                      <th className="py-2.5 px-3 font-semibold w-32">Current Reading</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-24">Units</th>
                      <th className="py-2.5 px-3 font-semibold w-24">Rate (₹/u)</th>
                      <th className="py-2.5 px-3 font-semibold text-right w-28">Charge (₹)</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-32">Status / Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {displayedRooms.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                          No rooms match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      displayedRooms.map((room) => {
                        const rKey = room.id || room.unitNumber;
                        const data = roomReadings[rKey] || {
                          meterStart: "0",
                          meterEnd: "",
                          ratePerUnit: String(roomWiseConfig.defaultRate || 10),
                        };
                        const calc = roomCalculations.byRoom[rKey] || {
                          units: 0,
                          amount: 0,
                          isNegative: false,
                          isOccupied: false,
                          occupantCount: 0,
                          perResidentShare: 0,
                        };
                        const occs = occupantsByRoomMap[rKey] || [];

                        return (
                          <tr
                            key={rKey}
                            className={`hover:bg-slate-50/60 transition-colors ${
                              calc.isNegative ? "bg-rose-50/30" : ""
                            }`}
                          >
                            {/* Room Column */}
                            <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>Room {room.unitNumber}</span>
                                {calc.isOccupied ? (
                                  <span className="size-1.5 rounded-full bg-emerald-500" />
                                ) : (
                                  <span className="size-1.5 rounded-full bg-slate-300" />
                                )}
                              </div>
                            </td>

                            {/* Residents Column */}
                            <td className="py-2.5 px-3 text-slate-600">
                              {occs.length > 0 ? (
                                <div className="truncate max-w-[150px]" title={occs.map((o) => o.user?.name).join(", ")}>
                                  {occs.map((o) => o.user?.name || "Resident").join(", ")}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Vacant</span>
                              )}
                            </td>

                            {/* Previous Reading */}
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="0"
                                value={data.meterStart}
                                onChange={(e) => handleUpdateRoom(rKey, "meterStart", e.target.value)}
                                className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700"
                                placeholder="0"
                              />
                            </td>

                            {/* Current Reading */}
                            <td className="py-2.5 px-3">
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  value={data.meterEnd}
                                  onChange={(e) => handleUpdateRoom(rKey, "meterEnd", e.target.value)}
                                  placeholder="e.g. 1250"
                                  className={`w-full h-8 px-2 text-xs font-bold rounded-lg border transition-all ${
                                    calc.isNegative
                                      ? "border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-500"
                                      : "border-slate-300 bg-white text-slate-900 focus:border-brand-500"
                                  }`}
                                />
                                {calc.isNegative && (
                                  <span className="absolute -bottom-4 left-0 text-[10px] text-rose-600 font-semibold whitespace-nowrap z-10">
                                    Must be ≥ previous
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Units Consumed */}
                            <td className="py-2.5 px-3 text-center font-bold">
                              {calc.isNegative ? (
                                <span className="text-rose-600 text-[11px]">Invalid</span>
                              ) : calc.hasEnd ? (
                                <span className="text-slate-900">{calc.units}</span>
                              ) : (
                                <span className="text-slate-400 font-normal">-</span>
                              )}
                            </td>

                            {/* Rate per Unit */}
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="1"
                                value={data.ratePerUnit}
                                onChange={(e) => handleUpdateRoom(rKey, "ratePerUnit", e.target.value)}
                                className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 bg-white font-medium text-center"
                                placeholder="10"
                              />
                            </td>

                            {/* Electricity Charge */}
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                              {calc.hasEnd && !calc.isNegative ? (
                                <span className="text-emerald-700 font-extrabold">
                                  ₹{calc.amount.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-normal">-</span>
                              )}
                            </td>

                            {/* Status / Share */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {calc.isOccupied ? (
                                calc.hasEnd && !calc.isNegative && calc.amount > 0 ? (
                                  <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                                    ₹{calc.perResidentShare}/resident
                                  </span>
                                ) : (
                                  <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                    {calc.occupantCount} {calc.occupantCount === 1 ? "resident" : "residents"}
                                  </span>
                                )
                              ) : (
                                <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                  Tracked only
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS VIEW (`md:hidden`) */}
              <div className="md:hidden space-y-3 max-h-96 overflow-y-auto pr-1">
                {displayedRooms.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400 italic">
                    No rooms match the selected filter.
                  </p>
                ) : (
                  displayedRooms.map((room) => {
                    const rKey = room.id || room.unitNumber;
                    const data = roomReadings[rKey] || {
                      meterStart: "0",
                      meterEnd: "",
                      ratePerUnit: String(roomWiseConfig.defaultRate || 10),
                    };
                    const calc = roomCalculations.byRoom[rKey] || {
                      units: 0,
                      amount: 0,
                      isNegative: false,
                      isOccupied: false,
                      occupantCount: 0,
                      perResidentShare: 0,
                    };
                    const occs = occupantsByRoomMap[rKey] || [];

                    return (
                      <div
                        key={rKey}
                        className={`rounded-xl border p-3 bg-white space-y-2.5 transition-all ${
                          calc.isNegative ? "border-rose-300 bg-rose-50/20" : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">
                              Room {room.unitNumber}
                            </span>
                            {calc.isOccupied ? (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                                {calc.occupantCount} resident{calc.occupantCount === 1 ? "" : "s"}
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                                Vacant
                              </span>
                            )}
                          </div>

                          {calc.hasEnd && !calc.isNegative && calc.amount > 0 && (
                            <span className="text-emerald-700 font-extrabold text-xs">
                              ₹{calc.amount.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {occs.length > 0 && (
                          <p className="text-[11px] text-slate-500">
                            Occupants: {occs.map((o) => o.user?.name).join(", ")}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                              Prev Reading:
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={data.meterStart}
                              onChange={(e) => handleUpdateRoom(rKey, "meterStart", e.target.value)}
                              className="w-full h-8 px-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-700 block mb-0.5">
                              Current Reading:
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={data.meterEnd}
                              onChange={(e) => handleUpdateRoom(rKey, "meterEnd", e.target.value)}
                              placeholder="e.g. 1250"
                              className={`w-full h-8 px-2 text-xs font-bold rounded-lg border ${
                                calc.isNegative
                                  ? "border-rose-400 bg-rose-50 text-rose-900"
                                  : "border-slate-300 bg-white"
                              }`}
                            />
                          </div>
                        </div>

                        {calc.isNegative && (
                          <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                            <AlertCircle className="size-3.5" /> Current reading must be ≥ previous reading
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                          <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-1">
                            <span className="text-[10px] text-slate-500 font-medium">Units:</span>
                            <span className="font-bold text-slate-900">
                              {calc.hasEnd && !calc.isNegative ? `${calc.units} kWh` : "-"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-1">
                            <span className="text-[10px] text-slate-500 font-medium">Rate:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 text-[10px]">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={data.ratePerUnit}
                                onChange={(e) => handleUpdateRoom(rKey, "ratePerUnit", e.target.value)}
                                className="w-12 h-6 text-xs text-center rounded border border-slate-200 bg-white font-bold"
                              />
                            </div>
                          </div>
                        </div>

                        {calc.isOccupied && calc.amount > 0 && !calc.isNegative && (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50/80 rounded-lg p-2 font-medium flex justify-between items-center">
                            <span>Resident Share:</span>
                            <span className="font-bold">₹{calc.perResidentShare} / person</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* OPTION D: FIXED CHARGE */}
          {method === "FIXED" && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2.5">
                <span className="text-xs font-bold text-slate-800">Charging Basis:</span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setFixedConfig({ ...fixedConfig, basis: "PER_RESIDENT" })}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      fixedConfig.basis === "PER_RESIDENT"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Per Resident per Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setFixedConfig({ ...fixedConfig, basis: "PER_ROOM" })}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      fixedConfig.basis === "PER_ROOM"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Per Occupied Room per Month
                  </button>
                </div>
              </div>

              {fixedConfig.basis === "PER_RESIDENT" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Fixed Charge per Resident (₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={fixedConfig.residentAmount}
                        onChange={(e) =>
                          setFixedConfig({ ...fixedConfig, residentAmount: e.target.value })
                        }
                        placeholder="e.g. 500"
                        className="w-full h-9.5 pl-8 pr-3 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 flex flex-col justify-center text-xs">
                    <div className="flex justify-between items-center text-slate-600 mb-1">
                      <span>Eligible Active Residents:</span>
                      <span className="font-bold text-slate-900">{activeResidentsCount}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span>Total Collection:</span>
                      <span className="text-brand-700 font-extrabold text-sm">
                        ₹
                        {(
                          (Number(fixedConfig.residentAmount) || 0) * activeResidentsCount
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Fixed Charge per Occupied Room (₹) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={fixedConfig.roomAmount}
                        onChange={(e) =>
                          setFixedConfig({ ...fixedConfig, roomAmount: e.target.value })
                        }
                        placeholder="e.g. 1200"
                        className="w-full h-9.5 pl-8 pr-3 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 flex flex-col justify-center text-xs">
                    <div className="flex justify-between items-center text-slate-600 mb-1">
                      <span>Occupied Rooms:</span>
                      <span className="font-bold text-slate-900">{occupiedRoomsCount}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span>Total Collection:</span>
                      <span className="text-brand-700 font-extrabold text-sm">
                        ₹
                        {(
                          (Number(fixedConfig.roomAmount) || 0) * occupiedRoomsCount
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-500 flex items-start gap-2">
                <Info className="size-4 text-slate-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Vacant rooms policy:</strong> Vacant rooms are not charged. If charging per occupied room,
                  the room amount is split equally among that room&apos;s occupants.
                </p>
              </div>
            </div>
          )}

          {/* 4. Real-time Live Billing Summary Bar */}
          {method !== "INCLUDED" && (
            <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-slate-50/40 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-brand-600" /> Live Electricity Summary
                </span>
                <span className="text-slate-500 font-normal">
                  {occupiedRoomsCount} of {totalRoomsCount} rooms occupied
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="rounded-lg bg-white border border-slate-200/80 p-2 text-center">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                    Units Consumed
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {summaryMetrics.totalUnits > 0 ? `${summaryMetrics.totalUnits} kWh` : "-"}
                  </span>
                </div>

                <div className="rounded-lg bg-white border border-slate-200/80 p-2 text-center">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                    Room Charges
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    ₹{summaryMetrics.totalRoomCharges.toLocaleString()}
                  </span>
                </div>

                <div className="rounded-lg bg-white border border-slate-200/80 p-2 text-center">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
                    Common Area
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    ₹{summaryMetrics.commonCharges.toLocaleString()}
                  </span>
                </div>

                <div className="rounded-lg bg-brand-50/70 border border-brand-200/80 p-2 text-center">
                  <span className="text-[10px] text-brand-700 block uppercase font-bold tracking-wider">
                    Total to Residents
                  </span>
                  <span className="font-extrabold text-brand-800 text-sm">
                    ₹{summaryMetrics.totalResidentBilled.toLocaleString()}
                  </span>
                </div>
              </div>

              {method === "COMMON" && summaryMetrics.totalRoomCharges > 0 && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>Reconciliation:</span>
                  <span className="font-semibold text-emerald-700">
                    {summaryMetrics.discrepancy === 0
                      ? "✓ 100% Allocated (Zero Discrepancy)"
                      : `Rounding variance: ₹${summaryMetrics.discrepancy}`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

