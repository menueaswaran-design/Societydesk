"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Search,
  Plus,
  ArrowRight,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  X,
  FileMinus,
  Coins,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import { formatMoney, formatDate } from "@/lib/format";
import { api } from "@/lib/client/api";

export default function DepositsClient({ initialDeposits = [] }) {
  const router = useRouter();
  const [deposits, setDeposits] = useState(initialDeposits);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [activeDeposit, setActiveDeposit] = useState(null);
  const [deductionModalOpen, setDeductionModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const [deductionForm, setDeductionForm] = useState({ reason: "Room Deep Cleaning", amount: 1500 });
  const [refundForm, setRefundForm] = useState({ refundAmount: 0, notes: "" });

  // Totals
  const totalReceived = deposits.reduce((sum, d) => sum + d.amountReceived, 0);
  const totalHeld = deposits
    .filter((d) => d.status === "HELD")
    .reduce((sum, d) => sum + (d.amountReceived - d.deductionsTotal), 0);
  const totalDeductions = deposits.reduce((sum, d) => sum + d.deductionsTotal, 0);
  const totalRefunded = deposits.reduce((sum, d) => sum + d.refundAmount, 0);

  const filteredDeposits = deposits.filter((d) => {
    const residentName = d.occupancy?.user?.name || "";
    const room = d.occupancy?.unit?.unitNumber || "";
    if (
      search &&
      !residentName.toLowerCase().includes(search.toLowerCase()) &&
      !room.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    if (filterStatus !== "ALL" && d.status !== filterStatus) {
      return false;
    }
    return true;
  });

  async function handleAddDeduction(e) {
    e.preventDefault();
    if (!activeDeposit) return;
    setPending(true);
    setError(null);

    try {
      await api.post(`/api/deposits/${activeDeposit.id}/deductions`, {
        reason: deductionForm.reason,
        amount: Number(deductionForm.amount),
      });
      setDeductionModalOpen(false);
      router.refresh();
      const res = await api.get("/api/deposits");
      if (res?.data) setDeposits(res.data);
    } catch (err) {
      setError(err?.message || "Failed to record deduction");
    } finally {
      setPending(false);
    }
  }

  async function handleProcessRefund(e) {
    e.preventDefault();
    if (!activeDeposit) return;
    setPending(true);
    setError(null);

    try {
      await api.post(`/api/deposits/${activeDeposit.id}/refund`, {
        refundAmount: Number(refundForm.refundAmount),
        notes: refundForm.notes,
      });
      setRefundModalOpen(false);
      router.refresh();
      const res = await api.get("/api/deposits");
      if (res?.data) setDeposits(res.data);
    } catch (err) {
      setError(err?.message || "Failed to record refund");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Security Deposits
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track resident security deposits, record settlement deductions, and manage refunds upon move-out.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-4">
        <Card className="p-3.5 sm:p-4 bg-emerald-50/50 border-emerald-200/60">
          <p className="text-xs font-medium text-emerald-800">Total Deposits Held</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-emerald-700">{formatMoney(totalHeld)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Active under management</p>
        </Card>

        <Card className="p-3.5 sm:p-4">
          <p className="text-xs font-medium text-slate-500">Total Received</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">{formatMoney(totalReceived)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{deposits.length} total deposits</p>
        </Card>

        <Card className="p-3.5 sm:p-4 bg-amber-50/50 border-amber-200/60">
          <p className="text-xs font-medium text-amber-800">Deductions Recorded</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-amber-700">{formatMoney(totalDeductions)}</p>
          <p className="text-[11px] text-amber-600 mt-0.5">Repairs, cleaning & dues</p>
        </Card>

        <Card className="p-3.5 sm:p-4 bg-blue-50/50 border-blue-200/60">
          <p className="text-xs font-medium text-blue-800">Total Refunded</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold text-blue-700">{formatMoney(totalRefunded)}</p>
          <p className="text-[11px] text-blue-600 mt-0.5">Returned upon check-out</p>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 rounded-xl bg-white p-3.5 sm:p-4 shadow-2xs border border-slate-200/80 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search resident or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 sm:py-1.5 pl-9 pr-3 text-xs focus:border-primary-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 sm:py-1.5 text-xs font-medium text-slate-700"
          >
            <option value="ALL">All Deposits</option>
            <option value="HELD">Currently Held</option>
            <option value="REFUNDED">Refunded</option>
            <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
          </select>
        </div>
      </div>

      {/* Deposits List */}
      {filteredDeposits.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No deposit records found"
          description="Deposits are automatically recorded when a resident is checked in."
        />
      ) : (
        <>
          {/* Mobile Cards (< 640px) */}
          <div className="space-y-3 sm:hidden">
            {filteredDeposits.map((d) => {
              const resident = d.occupancy?.user;
              const unit = d.occupancy?.unit;
              const bed = d.occupancy?.bed;
              const refundableBalance = Math.max(
                0,
                d.amountReceived - d.deductionsTotal - d.refundAmount
              );

              return (
                <div
                  key={d.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3 transition-colors"
                >
                  {/* Header: Resident + Room badge + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">
                        {resident?.name || "Occupant"}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {resident?.phone || resident?.email || "No contact"}
                      </p>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${
                        d.status === "HELD"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                          : d.status === "REFUNDED"
                            ? "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                            : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                      }`}
                    >
                      {d.status === "HELD"
                        ? "Held"
                        : d.status === "REFUNDED"
                          ? "Refunded"
                          : "Partially Refunded"}
                    </span>
                  </div>

                  {/* Room badge */}
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-100">
                    <span>Room {unit?.unitNumber || "-"}</span>
                    {bed ? (
                      <span className="rounded bg-slate-200/70 px-1.5 py-0.2 text-[10px] font-bold text-slate-700">
                        Bed {bed.bedLabel}
                      </span>
                    ) : null}
                  </div>

                  {/* 3-stat Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2">
                      <span className="text-[10.5px] text-slate-400 block font-medium">Received</span>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {formatMoney(d.amountReceived)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {formatDate(d.receivedDate)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2">
                      <span className="text-[10.5px] text-slate-400 block font-medium">Deductions</span>
                      <span className="font-bold text-amber-700 text-xs sm:text-sm">
                        {d.deductionsTotal > 0 ? formatMoney(d.deductionsTotal) : "₹0"}
                      </span>
                      {d.deductions?.length > 0 ? (
                        <span className="text-[10px] text-slate-400 block truncate mt-0.5" title={d.deductions.map(dd => dd.reason).join(", ")}>
                          {d.deductions[0]?.reason}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 block mt-0.5">None</span>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2">
                      <span className="text-[10.5px] text-slate-400 block font-medium">
                        {d.status === "REFUNDED" ? "Refunded" : "Refundable"}
                      </span>
                      <span className="font-bold text-emerald-700 text-xs sm:text-sm">
                        {formatMoney(d.status === "REFUNDED" ? d.refundAmount : refundableBalance)}
                      </span>
                      {d.refundDate ? (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {formatDate(d.refundDate)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 block mt-0.5">Safe</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {d.status === "HELD" ? (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => {
                          setActiveDeposit(d);
                          setDeductionForm({ reason: "Cleaning / Repairs", amount: 1000 });
                          setDeductionModalOpen(true);
                        }}
                      >
                        + Deduction
                      </Button>
                      <Button
                        variant="brand"
                        size="xs"
                        onClick={() => {
                          setActiveDeposit(d);
                          setRefundForm({
                            refundAmount: Math.max(0, d.amountReceived - d.deductionsTotal),
                            notes: "Full deposit refunded",
                          });
                          setRefundModalOpen(true);
                        }}
                        className="!bg-emerald-600 hover:!bg-emerald-700"
                      >
                        Refund
                      </Button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 text-right">
                      <span className="text-[11px] text-slate-400 font-medium">Deposit Settled</span>
                    </div>
                  )}
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
                    <th className="px-5 py-3.5">Resident</th>
                    <th className="px-4 py-3.5">Room & Bed</th>
                    <th className="px-4 py-3.5">Received</th>
                    <th className="px-4 py-3.5">Deductions</th>
                    <th className="px-4 py-3.5">Refundable</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeposits.map((d) => {
                    const resident = d.occupancy?.user;
                    const unit = d.occupancy?.unit;
                    const bed = d.occupancy?.bed;
                    const refundableBalance = Math.max(
                      0,
                      d.amountReceived - d.deductionsTotal - d.refundAmount
                    );

                    return (
                      <tr key={d.id} className="transition-colors hover:bg-slate-50/60">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{resident?.name || "-"}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {resident?.phone || resident?.email}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                            Room {unit?.unitNumber || "-"}
                            {bed ? (
                              <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10.5px] font-bold text-slate-600">
                                Bed {bed.bedLabel}
                              </span>
                            ) : null}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-900">{formatMoney(d.amountReceived)}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(d.receivedDate)}</p>
                        </td>
                        <td className="px-4 py-4">
                          {d.deductionsTotal > 0 ? (
                            <div>
                              <span className="font-semibold text-amber-700">
                                {formatMoney(d.deductionsTotal)}
                              </span>
                              {d.deductions?.length > 0 ? (
                                <p className="text-[10px] text-slate-400 truncate max-w-40 mt-0.5">
                                  {d.deductions.map((dd) => dd.reason).join(", ")}
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-slate-400">₹0</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-bold text-emerald-700">
                            {formatMoney(d.status === "REFUNDED" ? d.refundAmount : refundableBalance)}
                          </p>
                          {d.refundDate ? (
                            <p className="text-[10.5px] text-slate-400 mt-0.5">
                              Refunded {formatDate(d.refundDate)}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                              d.status === "HELD"
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                                : d.status === "REFUNDED"
                                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                                  : "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20"
                            }`}
                          >
                            {d.status === "HELD"
                              ? "Held"
                              : d.status === "REFUNDED"
                                ? "Refunded"
                                : "Partially Refunded"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {d.status === "HELD" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                 setActiveDeposit(d);
                                 setDeductionForm({ reason: "Cleaning / Repairs", amount: 1000 });
                                 setDeductionModalOpen(true);
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                              >
                                + Deduction
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDeposit(d);
                                  setRefundForm({
                                    refundAmount: Math.max(0, d.amountReceived - d.deductionsTotal),
                                    notes: "Full deposit refunded",
                                  });
                                  setRefundModalOpen(true);
                                }}
                                className="rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                              >
                                Refund
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Settled</span>
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

      {/* Deduction Modal */}
      {deductionModalOpen && activeDeposit ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 p-2 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-xl animate-rise max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Add Deposit Deduction</h2>
              <button
                onClick={() => setDeductionModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddDeduction} className="mt-4 space-y-4">
              <ErrorBanner error={error} />
              <p className="text-xs text-slate-600">
                Deposit for <strong>{activeDeposit.occupancy?.user?.name}</strong>:{" "}
                <span className="font-semibold text-emerald-700">
                  {formatMoney(activeDeposit.amountReceived)}
                </span>
              </p>

              <Input
                label="Deduction Reason"
                required
                placeholder="e.g. Room painting, Key loss, Deep cleaning"
                value={deductionForm.reason}
                onChange={(e) => setDeductionForm({ ...deductionForm, reason: e.target.value })}
              />

              <Input
                label="Deduction Amount (₹)"
                type="number"
                min="100"
                required
                value={deductionForm.amount}
                onChange={(e) => setDeductionForm({ ...deductionForm, amount: e.target.value })}
              />

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDeductionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={pending}>
                  Record Deduction
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Refund Modal */}
      {refundModalOpen && activeDeposit ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 p-2 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-xl animate-rise max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Process Deposit Refund</h2>
              <button
                onClick={() => setRefundModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="mt-4 space-y-4">
              <ErrorBanner error={error} />
              <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Deposit Received:</span>
                  <span className="font-semibold">{formatMoney(activeDeposit.amountReceived)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Deductions Total:</span>
                  <span className="font-semibold text-rose-600">
                    -{formatMoney(activeDeposit.deductionsTotal)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                  <span>Net Refundable:</span>
                  <span className="text-emerald-700">
                    {formatMoney(
                      Math.max(0, activeDeposit.amountReceived - activeDeposit.deductionsTotal)
                    )}
                  </span>
                </div>
              </div>

              <Input
                label="Refund Amount (₹)"
                type="number"
                min="0"
                required
                value={refundForm.refundAmount}
                onChange={(e) => setRefundForm({ ...refundForm, refundAmount: e.target.value })}
              />

              <Input
                label="Notes (Optional)"
                placeholder="UPI ref / Cash handed over / Bank transfer"
                value={refundForm.notes}
                onChange={(e) => setRefundForm({ ...refundForm, notes: e.target.value })}
              />

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setRefundModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={pending} className="!bg-emerald-600 hover:!bg-emerald-700">
                  Confirm Refund
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

