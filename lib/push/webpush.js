import webpush from "web-push";
import { prisma } from "@/lib/db/prisma";

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@bedy.in";
const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BLNXwvclIlWcPGYPHjTpwcCOi_j7HlwVZdLTqiFRRCuid86PjAFMih6aLXO_XLMTdzVgqOMqjcHo_lROE_jwFPg";
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || "rIK3Faoh30hu7RuKZ8oO-0Loa7LqKHJBMbnEiS39e_s";

// Configure Web Push with VAPID credentials
try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err) {
  console.error("[webpush] Error setting VAPID details:", err.message);
}

/**
 * Send push notification to a specific user across all their registered devices.
 * Removes expired or invalid (404/410) subscriptions automatically.
 */
export async function sendPushToUser(userId, payload) {
  if (!userId) return { success: false, sentCount: 0 };

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (!subscriptions.length) {
    return { success: true, sentCount: 0, reason: "No active subscriptions for user" };
  }

  const payloadString = typeof payload === "string" ? payload : JSON.stringify(payload);
  const deadSubscriptionIds = [];
  let sentCount = 0;

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payloadString);
        sentCount++;
      } catch (err) {
        // If subscription is expired or unsubscribed on browser side
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          deadSubscriptionIds.push(sub.id);
        } else {
          console.warn(`[webpush] Failed sending to endpoint ${sub.endpoint.slice(0, 30)}:`, err?.message);
        }
      }
    })
  );

  // Clean up dead subscriptions
  if (deadSubscriptionIds.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { id: { in: deadSubscriptionIds } },
    }).catch(() => null);
  }

  return { success: true, sentCount };
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(userIds, payload) {
  if (!Array.isArray(userIds) || !userIds.length) return { sentCount: 0 };
  const results = await Promise.allSettled(
    userIds.map((uid) => sendPushToUser(uid, payload))
  );
  const totalSent = results.reduce(
    (sum, r) => sum + (r.status === "fulfilled" ? r.value?.sentCount || 0 : 0),
    0
  );
  return { success: true, sentCount: totalSent };
}

/**
 * Send push notification to all residents/users in a specific society
 */
export async function sendPushToSociety(societyId, payload, { excludeUserId } = {}) {
  if (!societyId) return { sentCount: 0 };

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      societyId,
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
    },
  });

  if (!subscriptions.length) return { sentCount: 0 };

  const userIds = [...new Set(subscriptions.map((s) => s.userId))];
  return sendPushToUsers(userIds, payload);
}

