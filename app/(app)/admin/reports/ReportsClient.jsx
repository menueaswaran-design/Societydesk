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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="size-6 text-brand-600" />
            Occupancy & Revenue Reports
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time occupancy metrics, collection trends, and financial breakdown
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          {activeTab === "occupancy" && (
            <Button variant="secondary" onClick={handleExportOccupancy} className="flex items-center gap-2">
              <Download className="size-4" />
              Export Occupancy CSV
            </Button>
          )}
          {activeTab === "revenue" && (
            <Button variant="secondary" onClick={handleExportCollections} className="flex items-center gap-2">
              <Download className="size-4" />
              Export Revenue CSV
            </Button>
          )}
          {activeTab === "defaulters" && (
            <Button variant="secondary" onClick={handleExportDefaulters} className="flex items-center gap-2">
              <Download className="size-4" />
              Export Defaulters CSV
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-l-brand-600 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Occupancy Rate</span>
            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
              <BedSingle className="size-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{metrics.occupancyRate}%</span>
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

        <Card className="p-5 border-l-4 border-l-emerald-600 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Monthly Projected Rent</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-gray-900">
              {formatMoney(metrics.projectedMonthlyRent)}
            </span>
            <p className="text-xs text-gray-500 mt-1">From {metrics.activeResidents} active residents</p>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-blue-600 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Security Deposits Held</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ShieldCheck className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-gray-900">
              {formatMoney(metrics.totalDepositsHeld)}
            </span>
            <p className="text-xs text-gray-500 mt-1">Total refunded: {formatMoney(metrics.totalDepositsRefunded)}</p>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-500 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Available Vacancies</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Users className="size-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-amber-600">{metrics.vacantBeds}</span>
            <p className="text-xs text-gray-500 mt-1">
              Ready for immediate move-in across {metrics.totalRooms} rooms
            </p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("occupancy")}
          className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "occupancy"
              ? "border-brand-600 text-brand-600 font-semibold"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <BedSingle className="size-4" />
          Room & Bed Breakdown ({units.length} Rooms)
        </button>
        <button
          onClick={() => setActiveTab("revenue")}
          className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
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
          className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
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

          <div className="overflow-x-auto">
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
                {units.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No rooms configured yet.
                    </td>
                  </tr>
                ) : (
                  units.map((u) => {
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Revenue & Collections */}
      {activeTab === "revenue" && (
        <Card className="overflow-hidden bg-white shadow-sm border border-gray-100">
          <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Monthly Collection Breakdown</h3>
            <span className="text-xs text-gray-500">Rent & Add-ons Invoicing</span>
          </div>

          <div className="overflow-x-auto">
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
                {collections.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No billing periods recorded yet.
                    </td>
                  </tr>
                ) : (
                  collections.map((c) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Defaulters & Outstanding */}
      {activeTab === "defaulters" && (
        <Card className="overflow-hidden bg-white shadow-sm border border-gray-100">
          <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Unpaid & Overdue Rent Invoices</h3>
            <span className="text-xs text-amber-600 font-medium">{pendingInvoices.length} Pending Invoices</span>
          </div>

          <div className="overflow-x-auto">
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
                {pendingInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-emerald-600 font-medium">
                      ✓ No pending or overdue invoices! All payments are up to date.
                    </td>
                  </tr>
                ) : (
                  pendingInvoices.map((inv) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

