import { cookies, headers } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";

/**
 * Resolve the session inside Server Components / layouts.
 *
 * Server Components have no Request object, so the incoming headers and
 * cookies are adapted into the minimal shape getSessionUser expects. The
 * resolution logic itself (Firebase token -> user row -> role + societyId)
 * stays in one place.
 */
export async function getServerSession() {
  const [h, c] = await Promise.all([headers(), cookies()]);
  return getSessionUser({ headers: new Headers(h), cookies: c });
}

export async function getServerSessionOrNull() {
  try {
    return await getServerSession();
  } catch {
    return null;
  }
}