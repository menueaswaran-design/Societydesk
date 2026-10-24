"use client";

const PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BLNXwvclIlWcPGYPHjTpwcCOi_j7HlwVZdLTqiFRRCuid86PjAFMih6aLXO_XLMTdzVgqOMqjcHo_lROE_jwFPg";

/**
 * Convert URL base64 VAPID public key to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Check if the current browser environment supports Push Notifications & Service Worker
 */
export function isPushSupported() {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Get current browser notification permission ('default', 'granted', 'denied')
 */
export function getNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/**
 * Request notification permission, register service worker, and subscribe device
 */
export async function subscribeToPushNotifications() {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported in this browser");
  }

  // 1. Request permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    if (permission === "denied") {
      throw new Error(
        "Notification permission was denied. Please unblock notifications in your browser's site settings."
      );
    }
    return { success: false, permission };
  }

  // 2. Register / ready service worker
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;

  // 3. Subscribe to push manager with VAPID key
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
    });
  }

  // 4. Send subscription to backend to link to logged-in user
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      userAgent: navigator.userAgent,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data?.error?.message || "Failed to save push subscription on server");
  }

  // 5. Trigger instant welcome notification to confirm it works
  fetch("/api/push/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "🎉 Notifications Enabled!",
      body: "You will now receive timely updates for rent bills, payment receipts, and PG notices.",
    }),
  }).catch(() => null);

  return { success: true, subscription };
}

/**
 * Unsubscribe current device from push notifications
 */
export async function unsubscribeFromPushNotifications() {
  if (!isPushSupported()) return { success: false };

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    }
    return { success: true };
  } catch (err) {
    console.error("[push] Failed to unsubscribe:", err);
    return { success: false, error: err.message };
  }
}

