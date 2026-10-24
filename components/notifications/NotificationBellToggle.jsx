"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, BellOff, Check, Send } from "lucide-react";
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/lib/client/push";

export default function NotificationBellToggle({ user, compact = false }) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    setSupported(true);
    setPermission(getNotificationPermission());

    // Check local device push subscription status directly with ServiceWorker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setSubscribed(true);
          } else {
            setSubscribed(false);
          }
        }).catch(() => setSubscribed(false));
      }).catch(() => null);
    }
  }, [user]);

  if (!supported || !user) return null;

  async function handleToggle() {
    setLoading(true);
    try {
      if (subscribed) {
        await unsubscribeFromPushNotifications();
        setSubscribed(false);
      } else {
        const res = await subscribeToPushNotifications();
        if (res?.success) {
          setSubscribed(true);
          setPermission("granted");
        }
      }
    } catch (err) {
      alert(err?.message || "Failed to update notification settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendTest() {
    setLoading(true);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const data = await res.json();
      if (res.ok && data?.success) {
        setTestSent(true);
        setTimeout(() => setTestSent(false), 3000);
      } else {
        alert(data?.error?.message || "Could not deliver test notification");
      }
    } catch (err) {
      alert(err?.message || "Error sending test alert");
    } finally {
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={
          subscribed
            ? "Push notifications active (Click to disable or manage)"
            : "Click to enable browser push notifications"
        }
        className={`relative inline-flex size-9 items-center justify-center rounded-xl border transition ${
          subscribed
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50"
        }`}
      >
        {subscribed ? (
          <>
            <BellRing className="size-4" />
            <span className="absolute top-1 right-1 size-2 rounded-full bg-emerald-500" />
          </>
        ) : (
          <Bell className="size-4" />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
            subscribed ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
          }`}
        >
          {subscribed ? <BellRing className="size-5" /> : <BellOff className="size-5" />}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">
            {subscribed ? "Push Notifications Active" : "Push Notifications"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {subscribed
              ? "You will receive real-time alerts on this browser."
              : "Enable browser push notifications for rent & PG announcements."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {subscribed && (
          <button
            type="button"
            onClick={handleSendTest}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            {testSent ? "Alert Sent! ✓" : "Test Alert"}
          </button>
        )}
        <button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
            subscribed
              ? "border border-rose-200 text-rose-700 hover:bg-rose-50"
              : "bg-brand-600 hover:bg-brand-700 text-white"
          }`}
        >
          {loading ? "Updating..." : subscribed ? "Disable" : "Enable Alerts"}
        </button>
      </div>
    </div>
  );
}

