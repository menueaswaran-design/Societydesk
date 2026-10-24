"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, Check, Sparkles, AlertCircle } from "lucide-react";
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPushNotifications,
} from "@/lib/client/push";

export default function MobilePushPromptBanner({ user }) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState("default");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    if (!user || !isPushSupported()) return;
    setSupported(true);
    setPermission(getNotificationPermission());

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => {
          if (sub) setSubscribed(true);
        })
        .catch(() => null);
    }
  }, [user]);

  if (!supported || !user || subscribed) return null;

  async function handleEnable() {
    setLoading(true);
    setStatusMsg("");
    try {
      const res = await subscribeToPushNotifications();
      if (res?.success) {
        setSubscribed(true);
        setStatusMsg("Notifications enabled on this mobile device! 🎉");
      }
    } catch (err) {
      setStatusMsg(err?.message || "Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-4 shadow-sm text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs font-bold">
            <BellRing className="size-5 animate-bounce" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">
              Enable Mobile Notifications on this Phone
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Receive instant alerts for notices, new rent bills, and receipts on this device.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleEnable}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span>Enabling...</span>
          ) : (
            <>
              <Bell className="size-3.5" />
              <span>Allow Notifications on this Phone</span>
            </>
          )}
        </button>
      </div>

      {statusMsg && (
        <p className="mt-2 text-xs font-semibold text-emerald-800 bg-emerald-100/70 px-3 py-1.5 rounded-lg">
          {statusMsg}
        </p>
      )}
    </div>
  );
}
