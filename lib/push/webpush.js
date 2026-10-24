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
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  const results = await Promise.allSettled(
    uniqueIds.map((uid) => sendPushToUser(uid, payload))
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
    select: { userId: true },
  });

  if (!subscriptions.length) return { sentCount: 0 };

  const userIds = [...new Set(subscriptions.map((s) => s.userId))];
  return sendPushToUsers(userIds, payload);
}

/**
 * Send push notification to property owners and managers
 */
export async function sendPushToAdmins(societyId, payload) {
  if (!societyId) return { sentCount: 0 };

  const adminUsers = await prisma.user.findMany({
    where: {
      societyId,
      role: { in: ["OWNER", "MANAGER", "SOCIETY_ADMIN"] },
      status: "ACTIVE",
    },
    select: { id: true },
  });

  const adminIds = adminUsers.map((u) => u.id);
  return sendPushToUsers(adminIds, payload);
}

// ---------------------------------------------------------------------------
// Business Event Notifications (Notice, Invoice, Complaint, Payment)
// ---------------------------------------------------------------------------

/**
 * 1. Notice Published -> Send to all society residents
 */
export async function notifyNoticePublished({ societyId, title, body, noticeId, excludeUserId }) {
  try {
    const summary = body ? (body.length > 120 ? body.slice(0, 117) + "..." : body) : "New PG announcement";
    return await sendPushToSociety(
      societyId,
      {
        title: `📢 ${title}`,
        body: summary,
        url: "/resident/notices",
        tag: `notice-${noticeId || Date.now()}`,
      },
      { excludeUserId }
    );
  } catch (err) {
    console.warn("[webpush] notifyNoticePublished failed:", err?.message);
  }
}

/**
 * 2. Invoice / Rent Bill Generated -> Send to resident
 */
export async function notifyInvoiceGenerated({ userId, invoiceNumber, amount, billingPeriod, dueDate, invoiceId }) {
  try {
    const dueStr = dueDate ? ` Due by ${new Date(dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}.` : "";
    return await sendPushToUser(userId, {
      title: `🧾 New Bill: ₹${amount.toLocaleString("en-IN")}`,
      body: `Invoice ${invoiceNumber} for ${billingPeriod} has been generated.${dueStr}`,
      url: `/resident/invoices`,
      tag: `invoice-${invoiceId || Date.now()}`,
    });
  } catch (err) {
    console.warn("[webpush] notifyInvoiceGenerated failed:", err?.message);
  }
}

/**
 * 3. Complaint Registered -> Send to Admins and Resident
 */
export async function notifyComplaintCreated({ societyId, complaintId, title, category, priority, residentName, residentUserId }) {
  try {
    // Notify admins
    await sendPushToAdmins(societyId, {
      title: `🛠️ New Complaint (${priority})`,
      body: `${residentName || "Resident"}: "${title}" [${category}]`,
      url: `/admin/complaints`,
      tag: `complaint-${complaintId}`,
    });

    // Notify resident that complaint is logged
    if (residentUserId) {
      await sendPushToUser(residentUserId, {
        title: "Complaint Registered",
        body: `Your ticket for "${title}" has been received. Our team will review it shortly.`,
        url: `/resident/complaints`,
        tag: `complaint-${complaintId}`,
      });
    }
  } catch (err) {
    console.warn("[webpush] notifyComplaintCreated failed:", err?.message);
  }
}

/**
 * 4. Complaint Status Updated -> Send to Resident
 */
export async function notifyComplaintUpdated({ complaintId, title, status, residentUserId, updatedByName }) {
  try {
    if (!residentUserId) return;
    const statusLabels = {
      IN_PROGRESS: "is now In Progress 🔧",
      RESOLVED: "has been Resolved ✅",
      CLOSED: "has been Closed",
      REOPENED: "was Reopened ⚠️",
    };
    const label = statusLabels[status] || `status changed to ${status}`;

    return await sendPushToUser(residentUserId, {
      title: `Complaint Update: ${status}`,
      body: `Your ticket "${title}" ${label}.`,
      url: `/resident/complaints`,
      tag: `complaint-${complaintId}`,
    });
  } catch (err) {
    console.warn("[webpush] notifyComplaintUpdated failed:", err?.message);
  }
}

/**
 * 5. Payment Recorded -> Send to Resident
 */
export async function notifyPaymentReceived({ userId, amount, invoiceNumber, paymentId }) {
  try {
    if (!userId) return;
    return await sendPushToUser(userId, {
      title: `💳 Payment Received: ₹${Number(amount).toLocaleString("en-IN")}`,
      body: `Your payment for invoice ${invoiceNumber || ""} has been recorded. Receipt is ready.`,
      url: `/resident/payments`,
      tag: `payment-${paymentId || Date.now()}`,
    });
  } catch (err) {
    console.warn("[webpush] notifyPaymentReceived failed:", err?.message);
  }
}
