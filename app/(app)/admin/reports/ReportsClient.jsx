"use client";

import { useState } from "react";
import {
  TrendingUp,
  Download,
  Users,
  BedSingle,
  ShieldCheck,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  Layers,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { formatMoney, formatDate } from "@/lib/format";

export default function ReportsClient({
  metrics,
  units = [],
  collections = [],
  occupancies = [],
  invoices = [],
}) {
  const [activeTab, setActiveTab] = useState("occupancy"); // "occupancy" | "revenue" | "defaulters"

  // CSV Exporter helper
  const exportToCsv = (filename, headers, rows) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportOccupancy = () => {
    const headers = [
      "Room Number",
      "Building",
      "Floor",
      "Room Type",
      "AC / Non-AC",
      "Bed Capacity",
      "Occupied Beds",
      "Vacant Beds",
      "Current Occupants",
      "Room Status",
    ];
    const rows = units.map((u) => {
      const occupants = u.beds
        .flatMap((b) => b.occupancies)
        .map((occ) => occ.user?.name)
        .filter(Boolean)
        .join("; ");
      const occupiedCount = u.beds.filter((b) => b.status === "OCCUPIED").length;
      const vacantCount = u.beds.filter((b) => b.status === "VACANT").length;
      return [
        u.unitNumber,
        u.building?.name || "-",
        u.floor,
        u.unitType,
        u.ac ? "AC" : "Non-AC",
        u.bedCapacity,
        occupiedCount,
        vacantCount,
        occupants || "None",
        u.status,
      ];
    });
    exportToCsv(`PG_Occupancy_Report_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const handleExportCollections = () => {
    const headers = [
      "Billing Period",
      "Total Invoiced",
      "Total Collected",
      "Outstanding Pending",
      "Collection Rate %",
      "Invoices Generated",
      "Invoices Paid",
    ];
    const rows = collections.map((c) => [
      c.period,
      c.totalBilled,
      c.totalCollected,
      c.totalPending,
      `${c.collectionRate}%`,
      c.invoicesCount,
      c.paidCount,
    ]);
    exportToCsv(`PG_Revenue_Collection_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const pendingInvoices = invoices.filter((i) => i.status === "PENDING" || i.status === "OVERDUE");

  const handleExportDefaulters = () => {
    const headers = [
      "Invoice #",
      "Resident Name",
      "Room #",
      "Billing Period",
      "Due Date",
      "Total Amount",
      "Paid Amount",
      "Balance Due",
      "Status",
    ];
    const rows = pendingInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.occupancy?.user?.name || "Occupant",
      inv.occupancy?.unit?.unitNumber || "-",
      inv.billingPeriod,
      formatDate(inv.dueDate),
      inv.totalAmount,
      inv.paidAmount,
      inv.totalAmount - inv.paidAmount,
      inv.status,
    ]);
    exportToCsv(`PG_Defaulters_Dues_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="size-6 text-brand-600 shrink-0" />
            Occupancy & Revenue Reports
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time occupancy metrics, collection trends, and financial breakdown
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          {activeTab === "occupancy" && (
            <Button variant="secondary" size="sm" onClick={handleExportOccupancy} className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs">
              <Download className="size-3.5" />
              Export Occupancy CSV
            </Button>
          )}
          {activeTab === "revenue" && (
            <Button variant="secondary" size="sm" onClick={handleExportCollections} className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs">
              <Download className="size-3.5" />
              Export Revenue CSV
            </Button>
          )}
          {activeTab === "defaulters" && (
            <Button variant="secondary" size="sm" onClick={handleExportDefaulters} className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs">
              <Download className="size-3.5" />
              Export Defaulters CSV
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 border-l-4 border-l-brand-600 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Occupancy Rate</span>
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <BedSingle className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">{metrics.occupancyRate}%</span>
            <span className="text-xs text-gray-500">
              ({metrics.occupiedBeds} / {metrics.totalBeds} beds)
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-brand-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.occupancyRate)}%` }}
            />
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border-l-4 border-l-emerald-600 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Monthly Projected Rent</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {formatMoney(metrics.projectedMonthlyRent)}
            </span>
            <p className="text-xs text-gray-500 mt-1">From {metrics.activeResidents} active residents</p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border-l-4 border-l-blue-600 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Security Deposits Held</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ShieldCheck className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {formatMoney(metrics.totalDepositsHeld)}
            </span>
            <p className="text-xs text-gray-500 mt-1">Total refunded: {formatMoney(metrics.totalDepositsRefunded)}</p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border-l-4 border-l-amber-500 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Available Vacancies</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Users className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">{metrics.vacantBeds}</span>
            <p className="text-xs text-gray-500 mt-1">
              Ready for immediate move-in across {metrics.totalRooms} rooms
            </p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-none gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab("occupancy")}
          className={`py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === "occupancy"
              ? "border-brand-600 text-brand-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <BedSingle className="size-4" />
          Room & Bed Breakdown ({units.length})
        </button>
        <button
          onClick={() => setActiveTab("revenue")}
          className={`py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === "revenue"
              ? "border-brand-600 text-brand-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="size-4" />
          Revenue & Collection History
        </button>
        <button
          onClick={() => setActiveTab("defaulters")}
          className={`py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeTab === "defaulters"
              ? "border-brand-600 text-brand-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <AlertTriangle className="size-4 text-amber-500" />
          Pending Dues ({pendingInvoices.length})
        </button>
      </div>

      {/* Tab 1: Occupancy breakdown */}
      {activeTab === "occupancy" && (
        <Card className="overflow-hidden bg-white shadow-sm border border-gray-100">
          <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Room-by-Room Occupancy Matrix</h3>
            <span className="text-xs text-gray-500">Updated in real-time</span>
          </div>

          {units.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              No rooms configured yet.
            </div>
          ) : (
            <>
              {/* Mobile Cards (< 640px) */}
              <div className="divide-y divide-gray-100 sm:hidden">
                {units.map((u) => {
                  const occupiedCount = u.beds.filter((b) => b.status === "OCCUPIED").length;
                  const occupants = u.beds
                    .flatMap((b) => b.occupancies)
                    .map((occ) => occ.user?.name)
                    .filter(Boolean);
                  const isFull = occupiedCount === u.bedCapacity;
                  const isEmpty = occupiedCount === 0;

                  return (
                    <div key={u.id} className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                            <span>Room {u.unitNumber}</span>
                            {u.floor ? <span className="text-gray-400 font-normal text-xs">· Floor {u.floor}</span> : null}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-600">
                            <span>{u.unitType}</span>
                            <span>·</span>
                            <span className={u.ac ? "text-cyan-700 font-medium" : "text-gray-500"}>
                              {u.ac ? "AC" : "Non-AC"}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10.5px] font-semibold rounded-full ${
                              isFull
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : isEmpty
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {occupiedCount} / {u.bedCapacity} Occupied
                          </span>
                          <span className="block text-xs font-bold text-gray-900 mt-1">
                            {formatMoney(u.rentAmount)}/mo
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100 text-xs text-gray-600">
                        <span className="text-gray-400">Occupants: </span>
                        {occupants.length > 0 ? (
                          <span className="font-medium text-gray-800">{occupants.join(", ")}</span>
                        ) : (
                          <span className="text-gray-400 italic">No occupants</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table (>= 640px) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-gray-50/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3">Room</th>
                      <th className="px-4 py-3">Type & Climate</th>
                      <th className="px-4 py-3">Floor</th>
                      <th className="px-4 py-3">Capacity</th>
                      <th className="px-4 py-3">Occupancy Status</th>
                      <th className="px-4 py-3">Current Occupants</th>
                      <th className="px-4 py-3 text-right">Rent / Bed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {units.map((u) => {
                      const occupiedCount = u.beds.filter((b) => b.status === "OCCUPIED").length;
                      const occupants = u.beds
                        .flatMap((b) => b.occupancies)
                        .map((occ) => occ.user?.name)
                        .filter(Boolean);

                      const isFull = occupiedCount === u.bedCapacity;
                      const isEmpty = occupiedCount === 0;

                      return (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {u.unitNumber}
                            {u.building && (
                              <span className="block text-xs font-normal text-gray-400">{u.building.name}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-800">{u.unitType}</span>
                            <span
                              className={`ml-2 px-1.5 py-0.5 text-xs rounded font-medium ${
                                u.ac ? "bg-cyan-50 text-cyan-700 border border-cyan-200" : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {u.ac ? "AC" : "Non-AC"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">Floor {u.floor}</td>
                          <td className="px-4 py-3 font-medium text-gray-700">
                            {u.bedCapacity} {u.bedCapacity === 1 ? "Bed" : "Beds"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                  isFull
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : isEmpty
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {occupiedCount} / {u.bedCapacity} Occupied
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {occupants.length > 0 ? (
                              <span className="font-medium text-gray-800">{occupants.join(", ")}</span>
                            ) : (
                              <span className="text-gray-400 italic">No occupants</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {formatMoney(u.rentAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Tab 2: Revenue & Collections */}
      {activeTab === "revenue" && (
        <Card className="overflow-hidden bg-white shadow-sm border border-gray-100">
          <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Monthly Collection Breakdown</h3>
            <span className="text-xs text-gray-500">Rent & Add-ons Invoicing</span>
          </div>

          {collections.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              No billing periods recorded yet.
            </div>
          ) : (
            <>
              {/* Mobile Cards (< 640px) */}
              <div className="divide-y divide-gray-100 sm:hidden">
                {collections.map((c) => (
                  <div key={c.period} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                        <Calendar className="size-4 text-gray-400" />
                        <span>{c.period}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {c.paidCount} / {c.invoicesCount} Paid
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs rounded-xl bg-gray-50/80 p-2.5 border border-gray-100">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Invoiced</span>
                        <span className="font-semibold text-gray-900 text-xs">{formatMoney(c.totalBilled)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Collected</span>
                        <span className="font-bold text-emerald-600 text-xs">{formatMoney(c.totalCollected)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Pending</span>
                        <span className="font-semibold text-amber-600 text-xs">{formatMoney(c.totalPending)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                      <span className="text-gray-500">Collection Rate</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${c.collectionRate}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-900">{c.collectionRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= 640px) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-gray-50/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3">Billing Period</th>
                      <th className="px-4 py-3">Invoices</th>
                      <th className="px-4 py-3">Total Invoiced</th>
                      <th className="px-4 py-3">Total Collected</th>
                      <th className="px-4 py-3">Outstanding Dues</th>
                      <th className="px-4 py-3">Collection Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {collections.map((c) => (
                      <tr key={c.period} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900 flex items-center gap-2">
                          <Calendar className="size-4 text-gray-400" />
                          {c.period}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {c.paidCount} / {c.invoicesCount} Paid
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">{formatMoney(c.totalBilled)}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-600">{formatMoney(c.totalCollected)}</td>
                        <td className="px-4 py-3 font-medium text-amber-600">{formatMoney(c.totalPending)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${c.collectionRate}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-700">{c.collectionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Tab 3: Defaulters & Outstanding */}
      {activeTab === "defaulters" && (
        <Card className="overflow-hidden bg-white shadow-sm border border-gray-100">
          <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Unpaid & Overdue Rent Invoices</h3>
            <span className="text-xs text-amber-600 font-medium">{pendingInvoices.length} Pending Invoices</span>
          </div>

          {pendingInvoices.length === 0 ? (
            <div className="py-8 text-center text-emerald-600 font-medium text-xs">
              ✓ No pending or overdue invoices! All payments are up to date.
            </div>
          ) : (
            <>
              {/* Mobile Cards (< 640px) */}
              <div className="divide-y divide-gray-100 sm:hidden">
                {pendingInvoices.map((inv) => (
                  <div key={inv.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-gray-900 text-sm">
                          {inv.occupancy?.user?.name || "Occupant"}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Room {inv.occupancy?.unit?.unitNumber || "-"} · {inv.billingPeriod}
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 text-[10.5px] font-semibold rounded-full shrink-0 ${
                          inv.status === "OVERDUE"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-gray-500">Due: {formatDate(inv.dueDate)}</span>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block">Balance Due</span>
                        <span className="font-bold text-rose-600 text-sm">
                          {formatMoney(inv.totalAmount - inv.paidAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= 640px) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-gray-50/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3">Invoice #</th>
                      <th className="px-4 py-3">Resident</th>
                      <th className="px-4 py-3">Room</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3">Total Amount</th>
                      <th className="px-4 py-3">Balance Due</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {inv.occupancy?.user?.name || "Occupant"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{inv.occupancy?.unit?.unitNumber || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{inv.billingPeriod}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(inv.dueDate)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{formatMoney(inv.totalAmount)}</td>
                        <td className="px-4 py-3 font-bold text-rose-600">
                          {formatMoney(inv.totalAmount - inv.paidAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              inv.status === "OVERDUE"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

