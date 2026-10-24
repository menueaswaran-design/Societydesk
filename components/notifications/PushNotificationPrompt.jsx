"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, X, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import Button, { Spinner } from "@/components/ui/Button";
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPushNotifications,
} from "@/lib/client/push";

const DISMISS_KEY = "bedy_push_prompt_dismissed_until";
const DISMISS_DAYS = 5; // Snooze for 5 days if dismissed

export default function PushNotificationPrompt({ user }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);

    // Only prompt if user is logged in
    if (!user) return;

    // Check if browser supports push
    if (!isPushSupported()) return;

    // Check existing browser permission
    const currentPermission = getNotificationPermission();
    if (currentPermission !== "default") {
      // Already granted or blocked by browser
      return;
    }

    // Check if user dismissed it recently
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        return;
      }
    } catch {
      // LocalStorage unavailable
    }

    // Delay slightly (2.5 seconds) so user gets oriented with page first
    const timer = setTimeout(() => {
      setVisible(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [user]);

  if (!mounted || !visible) return null;

  function handleDismiss() {
    setVisible(false);
    try {
      const snoozeTime = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_KEY, snoozeTime.toString());
    } catch {
      // Ignore
    }
  }

  async function handleEnable() {
    setLoading(true);
    setError(null);

    try {
      const res = await subscribeToPushNotifications();
      if (res?.success) {
        setSuccess(true);
        setTimeout(() => {
          setVisible(false);
        }, 2200);
      } else {
        setVisible(false);
      }
    } catch (err) {
      setError(err?.message || "Failed to enable notifications");
      // Keep visible for user to see the error message
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] animate-rise">
      <div className="relative overflow-hidden rounded-2xl border border-brand-200/90 bg-white/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md ring-1 ring-slate-900/5">
        {/* Ambient Top Glow Line */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-amber-400 to-emerald-500" />

        {/* Close button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3.5 top-3.5 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>

        {success ? (
          <div className="flex items-center gap-3.5 py-1 text-emerald-900">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900">Notifications Activated!</p>
              <p className="text-xs text-slate-500 mt-0.5">
                A confirmation alert has been sent to your device.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="flex items-start gap-3.5 pr-6">
              <div className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-600/15">
                <BellRing className="size-5" />
                <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-slate-900">
                    Enable PG Alerts & Reminders
                  </h4>
                  <span className="rounded-md bg-brand-50 px-1.5 py-0.2 text-[10px] font-bold text-brand-700">
                    Instant
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Get real-time browser alerts on this device for rent invoices, payment confirmations, and room updates.
                </p>
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded-xl border border-rose-200">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                Maybe Later
              </button>
              <Button
                type="button"
                onClick={handleEnable}
                loading={loading}
                size="sm"
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-2xs"
              >
                <Bell className="size-3.5" />
                Enable Notifications
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
