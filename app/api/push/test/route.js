import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { unauthorized } from "@/lib/errors";
import { sendPushToUser } from "@/lib/push/webpush";

export const dynamic = "force-dynamic";

/**
 * POST /api/push/test
 * Send a test push notification to the logged-in user.
 */
export const POST = handler(async (req) => {
  const user = await getSessionUser(req);
  if (!user) throw unauthorized("Authentication required");

  const body = await readJson(req).catch(() => ({}));
  const title = body.title || "🔔 Bedy Notification Test";
  const message = body.body || `Hello ${user.name}! Push notifications are successfully active for your account.`;
  const url = body.url || (user.role === "RESIDENT" ? "/resident/dashboard" : "/admin/dashboard");

  const result = await sendPushToUser(user.id, {
    title,
    body: message,
    url,
    tag: "test-notification",
  });

  return ok({
    success: true,
    sentCount: result.sentCount,
    message: result.sentCount > 0 ? "Test notification delivered" : "No active subscriptions found for your account",
  });
});
