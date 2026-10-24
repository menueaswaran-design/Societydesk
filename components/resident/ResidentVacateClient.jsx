"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DoorOpen,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  BedSingle,
  Wallet,
  ArrowRight,
  Info,
  Undo2,
  Check,
} from "lucide-react";
import Button, { Spinner } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/Feedback";
import { Card } from "@/components/ui/Card";
import { formatDate, formatMoney } from "@/lib/format";

const QUICK_REASONS = [
  "Job Relocation",
  "College Semester Completed",
  "Moving to Own Flat",
  "Internship Ended",
  "Personal / Family Reason",
];

export default function ResidentVacateClient({ occupancy, depositStatus, societyName }) {
  const router = useRouter();

  const isNotice = occupancy?.status === "NOTICE";
  const defaultNoticeDays = occupancy?.noticePeriodDays || 30;

  // Default suggested leave date: today + noticePeriodDays
  const minDate = new Date().toISOString().slice(0, 10);
  const suggestedDate = new Date(Date.now() + defaultNoticeDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [leaveDate, setLeaveDate] = useState(
    occupancy?.leaveDate ? new Date(occupancy.leaveDate).toISOString().slice(0, 10) : suggestedDate
  );
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showEditDate, setShowEditDate] = useState(false);

  const daysLeft = occupancy?.leaveDate
    ? Math.max(0, Math.ceil((new Date(occupancy.leaveDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/resident/notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveDate, reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to submit move-out notice");
      }

      setSuccess("Move-out notice submitted successfully! Owner/manager has been notified.");
      setShowEditDate(false);
      setTimeout(() => {
        router.refresh();
      }, 800);
    } catch (err) {
      setError(err?.message || "Failed to submit notice");
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!confirm("Are you sure you want to withdraw your notice and stay active in your room?")) {
      return;
    }
    setWithdrawing(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/resident/notice", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to cancel notice");
      }

      setSuccess("Move-out notice withdrawn. Your stay remains active.");
      setTimeout(() => {
        router.refresh();
      }, 800);
    } catch (err) {
      setError(err?.message || "Failed to withdraw notice");
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
          <Link href="/resident/dashboard" className="hover:text-slate-800">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-800">Vacate & Notice Period</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Vacate PG & Serve Notice
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your scheduled move-out, notify the PG owner, and prepare for security deposit settlement.
        </p>
      </div>

      {error && <ErrorBanner message={error} />}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 flex items-center gap-3">
          <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{success}</p>
        </div>
      )}

      {/* Current Stay & Deposit Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="p-4 bg-white shadow-2xs border border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
              <BedSingle className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Your Room & Bed
              </p>
              <p className="text-base font-bold text-slate-900">
                Room {occupancy?.unit?.unitNumber} · Bed {occupancy?.bed?.bedLabel}
              </p>
              <p className="text-xs text-slate-500">
                {occupancy?.unit?.unitType} Sharing · {occupancy?.unit?.ac ? "AC" : "Non-AC"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white shadow-2xs border border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Security Deposit
              </p>
              <p className="text-base font-bold text-slate-900">
                {depositStatus ? formatMoney(depositStatus.amount) : "Recorded"}
              </p>
              <p className="text-xs text-emerald-600 font-medium">
                Refundable upon move-out inspection
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white shadow-2xs border border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Notice Policy
              </p>
              <p className="text-base font-bold text-slate-900">{defaultNoticeDays} Days Notice</p>
              <p className="text-xs text-slate-500">Per your PG stay agreement</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Status & Action Card */}
      {isNotice ? (
        <Card className="overflow-hidden border-2 border-amber-300 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-200/80">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                <DoorOpen className="size-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300">
                    <span className="size-2 rounded-full bg-amber-600 animate-pulse" />
                    Notice Period Active
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      daysLeft !== null && daysLeft <= 7
                        ? "bg-rose-100 text-rose-800 ring-1 ring-rose-600/30"
                        : daysLeft !== null && daysLeft <= 15
                        ? "bg-orange-100 text-orange-800 ring-1 ring-orange-600/30"
                        : "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600/30"
                    }`}
                  >
                    {daysLeft !== null ? `${daysLeft} Days Remaining` : "Serving Notice"}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-2">
                  Scheduled Move-out: {formatDate(occupancy.leaveDate)}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  The PG owner and manager have received your notice. They will conduct a room handover inspection on your move-out date.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowEditDate(!showEditDate)}
                className="text-xs font-semibold"
              >
                <Calendar className="size-3.5" />
                Change Date
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleWithdraw}
                loading={withdrawing}
                className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
              >
                <Undo2 className="size-3.5" />
                Withdraw Notice
              </Button>
            </div>
          </div>

          {/* Edit date form if toggled */}
          {showEditDate && (
            <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-white border border-amber-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Update Move-out Date</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    New Move-out Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={minDate}
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Updated Reason (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Reason for change..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowEditDate(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={loading} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                  Save New Date
                </Button>
              </div>
            </form>
          )}

          {/* Move-out Checklist */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Move-out & Deposit Refund Process
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="flex size-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">
                    1
                  </span>
                  Clear Rent & Dues
                </div>
                <p className="text-slate-500 text-[11px]">
                  Ensure all monthly rents and electricity bills are paid prior to departure.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="flex size-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">
                    2
                  </span>
                  Room & Key Handover
                </div>
                <p className="text-slate-500 text-[11px]">
                  Hand over room keys and cupboard keys to the PG warden or owner on {formatDate(occupancy.leaveDate)}.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="flex size-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px]">
                    3
                  </span>
                  Deposit Settlement
                </div>
                <p className="text-slate-500 text-[11px]">
                  Security deposit ({depositStatus ? formatMoney(depositStatus.amount) : "held amount"}) is settled and transferred to your account.
                </p>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 sm:p-8 bg-white shadow-2xs border border-slate-200/80 space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
              <DoorOpen className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Serve Move-out Notice
              </h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Planning to leave {societyName || "the PG"}? Submit your notice period here to inform the management, schedule key handover, and process your security deposit refund.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 pt-4 border-t border-slate-100">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                Planned Move-out Date *
              </label>
              <div className="relative max-w-sm">
                <input
                  type="date"
                  required
                  min={minDate}
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold text-slate-900 shadow-2xs focus:border-amber-500 focus:ring-3 focus:ring-amber-500/15 focus:outline-none"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
                <Info className="size-3.5 text-slate-400" />
                Agreement notice period is <strong>{defaultNoticeDays} days</strong>. You can adjust the exact departure date as needed.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                Reason for Leaving (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Job transfer, relocating to home town, college term over..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-800 shadow-2xs focus:border-amber-500 focus:ring-3 focus:ring-amber-500/15 focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 space-y-2 text-xs text-slate-600">
              <p className="font-bold text-slate-800">What happens after you submit?</p>
              <ul className="list-disc list-inside space-y-1 text-[11.5px] text-slate-600">
                <li>Your room and bed will be scheduled for vacating on the chosen date.</li>
                <li>The PG owner will prepare your account settlement (deposit refund minus any pending rent).</li>
                <li>You can withdraw or update your move-out date anytime prior to departure.</li>
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href="/resident/dashboard"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                ← Back to Dashboard
              </Link>
              <Button
                type="submit"
                loading={loading}
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs"
              >
                <DoorOpen className="size-4" />
                Submit Move-out Notice
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

