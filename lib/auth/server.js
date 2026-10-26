import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";

/**
 * Resolve the session inside Server Components / layouts.
 *
 * Wrapped in React cache() so multiple calls in the same request (e.g. Layout
 * + Page + Page guards) only execute the session resolution query ONCE.
 */
export const getServerSession = cache(async () => {
  try {
    const [h, c] = await Promise.all([headers(), cookies()]);
    const user = await getSessionUser({ headers: new Headers(h), cookies: c });
    if (!user) {
      redirect("/login");
    }
    return user;
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    if (
      err?.status === 401 ||
      err?.statusCode === 401 ||
      err?.code === "UNAUTHORIZED" ||
      err?.message?.includes("Authentication required")
    ) {
      redirect("/login");
    }
    throw err;
  }
});

export const getServerSessionOrNull = cache(async () => {
  try {
    const [h, c] = await Promise.all([headers(), cookies()]);
    return await getSessionUser({ headers: new Headers(h), cookies: c });
  } catch (err) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
    return null;
  }
});
