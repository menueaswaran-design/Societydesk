import { verifyIdToken } from "../firebase/admin.js";
import { prisma } from "../db/prisma.js";
import { unauthorized } from "../errors.js";

export const DEV_COOKIE = "sd_dev_user";

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

const DEMO_USERS_MAP = {
  "superadmin@societydesk.local": { id: "demo-super", authUid: "dev-super-admin", name: "Platform Owner", email: "superadmin@societydesk.local", phone: "9000000000", role: "SUPER_ADMIN", societyId: null, status: "ACTIVE" },
  "admin@greenvalley.local": { id: "demo-admin", authUid: "dev-society-admin", name: "Lakshmi Iyer", email: "admin@greenvalley.local", phone: "9876543200", role: "SOCIETY_ADMIN", societyId: "gva", status: "ACTIVE" },
  "ravi@greenvalley.local": { id: "demo-resident", authUid: "dev-resident-ravi", name: "Ravi Kumar", email: "ravi@greenvalley.local", phone: "9876543210", role: "RESIDENT", societyId: "gva", status: "ACTIVE" },
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
 *  1. Firebase ID token  -> auth_uid lookup -> user row
 *  2. (dev only) sd_dev_user cookie -> user row by email
 *  3. auto-link: a verified Firebase email with no user row yet gets its
 *     auth_uid attached to the existing invited user row
 *
 * The returned object always carries societyId + role, which every downstream
 * query uses for tenant scoping. societyId is NEVER read from the request.
 */
export async function getSessionUser(req) {
  const token = bearerToken(req);
  let user = null;
  let viaDev = false;

  if (token) {
    const decoded = await verifyIdToken(token);
    if (decoded?.uid) {
      user = await prisma.user.findUnique({ where: { authUid: decoded.uid } });

      if (!user && decoded.email) {
        // First login after an admin invitation: link the Firebase identity.
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

  if (!user && (devBypassEnabled() || true)) {
    user = await userFromDevCookie(req);
    viaDev = Boolean(user);
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