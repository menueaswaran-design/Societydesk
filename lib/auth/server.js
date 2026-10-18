import { cache } from "react";
import { cookies, headers } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";

/**
 * Resolve the session inside Server Components / layouts.
 *
 * Wrapped in React cache() so multiple calls in the same request (e.g. Layout
 * + Page + Page guards) only execute the session resolution query ONCE.
 */
export const getServerSession = cache(async () => {
  const [h, c] = await Promise.all([headers(), cookies()]);
  return getSessionUser({ headers: new Headers(h), cookies: c });
});

export const getServerSessionOrNull = cache(async () => {
  try {
    return await getServerSession();
  } catch {
    return null;
  }
});