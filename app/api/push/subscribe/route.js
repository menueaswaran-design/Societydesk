import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { badRequest, unauthorized } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/push/subscribe
 * Check if the logged-in user has any active push subscriptions.
 */
export const GET = handler(async (req) => {
  const user = await getSessionUser(req);
  if (!user) {
    return ok({ enabled: false, loggedIn: false });
  }

  const count = await prisma.pushSubscription.count({
    where: { userId: user.id },
  });

  return ok({
    enabled: count > 0,
    loggedIn: true,
    subscriptionCount: count,
  });
});

/**
 * POST /api/push/subscribe
 * Register or update a browser push subscription for the logged-in user.
 */
export const POST = handler(async (req) => {
  const user = await getSessionUser(req);
  if (!user) throw unauthorized("Please log in to enable push notifications");

  const body = await readJson(req);
  const { subscription, userAgent } = body;

  if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    throw badRequest("Invalid push subscription payload");
  }

  // Upsert subscription by unique endpoint
  const pushSub = await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      userId: user.id,
      societyId: user.societyId || null,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent || null,
      updatedAt: new Date(),
    },
    create: {
      userId: user.id,
      societyId: user.societyId || null,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent || null,
    },
  });

  return ok({
    success: true,
    message: "Push notifications enabled successfully",
    id: pushSub.id,
  });
});

/**
 * DELETE /api/push/subscribe
 * Unsubscribe a device from push notifications.
 */
export const DELETE = handler(async (req) => {
  const user = await getSessionUser(req);
  if (!user) throw unauthorized("Authentication required");

  const body = await readJson(req).catch(() => ({}));
  const { endpoint } = body;

  if (endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: user.id },
    });
  } else {
    // Unsubscribe all devices for this user
    await prisma.pushSubscription.deleteMany({
      where: { userId: user.id },
    });
  }

  return ok({ success: true, message: "Push notifications disabled" });
});

