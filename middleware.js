import { NextResponse } from "next/server";

/**
 * Cheap cookie-presence gate only.
 *
 * Real authentication and role checks happen in the server components and the
 * REST handlers (they need the database anyway). Doing it here as well would
 * mean verifying the Firebase token twice per request.
 */
const PROTECTED = ["/admin", "/resident", "/super-admin"];

const AUTH_COOKIES = ["sd_dev_user"];

export function middleware(req) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();

  const firebaseSession = req.cookies.get("__session")?.value;
  const hasDevSession = AUTH_COOKIES.some((c) => req.cookies.get(c)?.value);

  if (!firebaseSession && !hasDevSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/resident/:path*", "/super-admin/:path*"],
};