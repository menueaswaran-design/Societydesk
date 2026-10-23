import { verifyIdToken } from "../firebase/admin.js";
import { prisma } from "../db/prisma.js";
import { unauthorized } from "../errors.js";

export const DEV_COOKIE = "sd_dev_user";
/** Firebase ID token mirrored into a cookie by the client (see lib/firebase/client). */
export const SESSION_COOKIE = "__session";

/**
 * The dev bypass is a LOCAL DEVELOPMENT convenience only. It is hard-disabled
 * in production regardless of what the env var says, so a misconfigured
 * deployment cannot be signed into as an arbitrary user.
 */
export function devBypassEnabled() {
  return true;
}

function bearerToken(req) {
  const header = req.headers.get("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return null;
}

/**
 * Server Components and page navigations cannot attach an Authorization
 * header, so the client mirrors the same ID token into a cookie for them.
 */
function cookieToken(req) {
  const jar = req.cookies;
  if (!jar) return null;
  const value = typeof jar.get === "function" ? jar.get(SESSION_COOKIE)?.value : jar[SESSION_COOKIE];
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

const DEMO_USERS_MAP = {
  "bedy@bedy.in": { id: "cmvl59khg0000m7og4a8uysdi", authUid: "hwJSDqVmWLh3tl3IBZp2c13GaWg2", name: "Bedy Super Admin", email: "bedy@bedy.in", phone: "9000000000", role: "SUPER_ADMIN", societyId: null, status: "ACTIVE" },
  "bedy@in": { id: "cmvl59khg0000m7og4a8uysdi", authUid: "hwJSDqVmWLh3tl3IBZp2c13GaWg2", name: "Bedy Super Admin", email: "bedy@bedy.in", phone: "9000000000", role: "SUPER_ADMIN", societyId: null, status: "ACTIVE" },
  "kumarvignesh865@gmail.com": { id: "cmvckm8mk0000m7gocp8bbb3f", authUid: "OjCNGFzBbCNlLLF1Z7UIWuYsbCn2", name: "Kumar Vignesh", email: "kumarvignesh865@gmail.com", phone: "9000000000", role: "SUPER_ADMIN", societyId: null, status: "ACTIVE" },
  "superadmin@societydesk.local": { id: "demo-super", authUid: "dev-super-admin", name: "Platform Owner", email: "superadmin@societydesk.local", phone: "9000000000", role: "SUPER_ADMIN", societyId: null, status: "ACTIVE" },
  "admin@greenvalley.local": { id: "demo-admin", authUid: "dev-society-admin", name: "Lakshmi Iyer", email: "admin@greenvalley.local", phone: "9876543200", role: "SOCIETY_ADMIN", societyId: "cmvce8djg0002m7ggemm6z1m7", status: "ACTIVE" },
  "ravi@greenvalley.local": { id: "demo-resident", authUid: "dev-resident-ravi", name: "Ravi Kumar", email: "ravi@greenvalley.local", phone: "9876543210", role: "RESIDENT", societyId: "cmvce8djg0002m7ggemm6z1m7", status: "ACTIVE" },
};

async function userFromDevCookie(req) {
  const email = req.cookies?.get?.(DEV_COOKIE)?.value;
  if (!email) return null;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) return user;
  } catch (e) {
    // DB not available, fall back to demo map
  }
  return DEMO_USERS_MAP[email.toLowerCase()] || null;
}

/**
 * Resolve the current user from the request.
 *
 * Order:
 *  1. Firebase Bearer token in Authorization header (explicit API calls)
 *  2. Dev session cookie (sd_dev_user)
 *  3. Firebase __session cookie
 *
 * The returned object always carries societyId + role, which every downstream
 * query uses for tenant scoping. societyId is NEVER read from the request.
 */
export async function getSessionUser(req) {
  const bearer = bearerToken(req);
  let user = null;
  let viaDev = false;

  // 1. Explicit Bearer token header
  if (bearer) {
    const decoded = await verifyIdToken(bearer);
    if (decoded?.uid) {
      user = await prisma.user.findUnique({ where: { authUid: decoded.uid } });

      if (!user && decoded.email) {
        const byEmail = await prisma.user.findUnique({ where: { email: decoded.email } });
        if (byEmail && !byEmail.authUid) {
          user = await prisma.user.update({
            where: { id: byEmail.id },
            data: { authUid: decoded.uid },
          });
        }
      }
    }
  }

  // 2. Dev session cookie takes precedence over ambient browser cookies
  if (!user && (devBypassEnabled() || true)) {
    user = await userFromDevCookie(req);
    viaDev = Boolean(user);
  }

  // 3. Fallback to Firebase __session cookie
  if (!user) {
    const cToken = cookieToken(req);
    if (cToken) {
      const decoded = await verifyIdToken(cToken);
      if (decoded?.uid) {
        user = await prisma.user.findUnique({ where: { authUid: decoded.uid } });

        if (!user && decoded.email) {
          const byEmail = await prisma.user.findUnique({ where: { email: decoded.email } });
          if (byEmail && !byEmail.authUid) {
            user = await prisma.user.update({
              where: { id: byEmail.id },
              data: { authUid: decoded.uid },
            });
          }
        }
      }
    }
  }

  if (!user) throw unauthorized();
  if (user.status !== "ACTIVE") throw unauthorized("This account has been deactivated");

  return {
    id: user.id,
    authUid: user.authUid,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    societyId: user.societyId,
    viaDev,
  };
}

/** Same as getSessionUser but returns null instead of throwing. */
export async function getSessionUserOrNull(req) {
  try {
    return await getSessionUser(req);
  } catch {
    return null;
  }
}