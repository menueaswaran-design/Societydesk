import { redirect } from "next/navigation";
import { homeForRole } from "../routing.js";

/**
 * Restrict a page section to specific roles.
 *
 * Anyone else is redirected to their own home page. This matters most for
 * SUPER_ADMIN, who has no `societyId`: tenant-scoped queries filter on
 * `societyId`, so letting a platform admin reach /admin/* or /resident/* used
 * to crash those pages with a Prisma "societyId must not be null" error.
 *
 * Call from a server component. `redirect()` throws, so the caller stops there.
 */
export function requirePageRole(user, roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.role)) redirect(homeForRole(user.role));
}

/**
 * Same as requirePageRole but returns the society id tenant-scoped queries need,
 * failing loudly if a society-less account somehow got through.
 */
export function requireSocietyContext(user) {
  requirePageRole(user, "SOCIETY_ADMIN");
  if (!user.societyId) redirect(homeForRole(user.role));
  return user.societyId;
}