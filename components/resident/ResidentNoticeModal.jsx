"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DoorOpen, AlertTriangle, Calendar, CheckCircle2, X } from "lucide-react";
import Button, { Spinner } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/Feedback";
import { formatDate } from "@/lib/format";

export default function ResidentNoticeModal({ occupancy }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isNotice = occupancy?.status === "NOTICE";
  const defaultNoticeDays = occupancy?.noticePeriodDays || 30;

  // Default planned date: today + noticePeriodDays
  const minDate = new Date().toISOString().slice(0, 10);
  const defaultDate = new Date(Date.now() + defaultNoticeDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [leaveDate, setLeaveDate] = useState(
    occupancy?.leaveDate ? new Date(occupancy.leaveDate).toISOString().slice(0, 10) : defaultDate
  );
  const [reason, setReason] = useState("");

  const daysLeft = occupancy?.leaveDate
    ? Math.max(0, Math.ceil((new Date(occupancy.leaveDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

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

      setSuccess("Move-out notice submitted successfully.");
      setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(err?.message || "Failed to submit notice");
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!confirm("Are you sure you want to withdraw your move-out notice and stay active?")) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/resident/notice", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to withdraw notice");
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err?.message || "Failed to withdraw notice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {isNotice ? (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          variant="secondary"
          size="sm"
          className="border-amber-300 bg-white text-amber-800 hover:bg-amber-50 font-bold shrink-0 shadow-2xs"
        >
          <Calendar className="size-3.5 text-amber-600" />
          Manage Notice ({daysLeft} days left)
        </Button>
      ) : (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          variant="secondary"
          size="sm"
          className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold shrink-0 shadow-2xs"
        >
          <DoorOpen className="size-3.5 text-slate-500" />
          I&apos;m Leaving / Serve Notice
        </Button>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-2xl animate-rise max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                  <DoorOpen className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {isNotice ? "Move-Out Notice Active" : "Serve Move-Out Notice"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Room {occupancy?.unit?.unitNumber || "-"} · Bed {occupancy?.bed?.bedLabel || "-"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <ErrorBanner error={error} />

              {success ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>{success}</span>
                </div>
              ) : null}

              {isNotice ? (
                <div className="rounded-xl border border-amber-200/90 bg-amber-50/80 p-3.5 text-xs text-amber-900 space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span>Current Notice Period Status</span>
                    <span className="rounded-full bg-amber-600 text-white px-2 py-0.5 text-[10.5px]">
                      {daysLeft} Days Remaining
                    </span>
                  </div>
                  <p className="text-amber-800 text-[11.5px] leading-relaxed">
                    You have officially notified the PG owner of your planned move-out on{" "}
                    <strong>{formatDate(occupancy.leaveDate)}</strong>.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">PG Notice Period Policy:</p>
                  <p className="text-[11.5px] text-slate-500 leading-relaxed">
                    Please provide at least <strong>{defaultNoticeDays} days</strong> advance notice before vacating so the owner can settle your security deposit smoothly.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Planned Move-Out Date *
                </label>
                <input
                  type="date"
                  required
                  min={minDate}
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Recommended date based on your notice period: {formatDate(defaultDate)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Reason for Leaving (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Job transfer, completed college, moving to hometown..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 shadow-2xs focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-slate-100">
                {isNotice ? (
                  <button
                    type="button"
                    onClick={handleWithdraw}
                    disabled={loading}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline text-left"
                  >
                    Withdraw Notice
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
                  >
                    {isNotice ? "Update Move-Out Date" : "Submit Move-Out Notice"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

