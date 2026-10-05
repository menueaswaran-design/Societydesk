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
  return process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS === "true";
}

function bearerToken(req) {
  const header = req.headers.get("authorization") || "";
  if (header.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  return null;
}

async function userFromDevCookie(req) {
  const email = req.cookies?.get?.(DEV_COOKIE)?.value;
  if (!email) return null;
  return prisma.user.findUnique({ where: { email } });
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

  if (!user && devBypassEnabled()) {
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