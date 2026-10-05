import { cookies } from "next/headers";
import { handler, ok } from "@/lib/api";
import { DEV_COOKIE } from "@/lib/auth/session";
export const dynamic = "force-dynamic";

const SESSION_COOKIE = "__session";

/**
 * POST /api/auth/logout
 *
 * Clears every session cookie this app can set. Safe to call when already
 * signed out, and never fails - the client also tears down the Firebase user
 * before calling it, so this is only responsible for the server-side cookies.
 */
const POSTImpl = handler(async () => {
  const jar = await cookies();
  jar.delete(DEV_COOKIE);
  jar.delete(SESSION_COOKIE);

  return ok({ signedOut: true });
});

export async function POST(request, context) {
  return POSTImpl(request, context);
}