import { redirect } from "next/navigation";
import { homeForRole } from "../routing.js";

export const ADMIN_ROLES = ["OWNER", "MANAGER", "SOCIETY_ADMIN"];

/**
 * Restrict a page section to specific roles.
 * Supports PG OWNER & MANAGER as well as SOCIETY_ADMIN.
 */
export function requirePageRole(user, roles) {
  if (!user) {
    redirect("/login");
    return;
  }
  const allowed = Array.isArray(roles) ? [...roles] : [roles];
  if (allowed.includes("SOCIETY_ADMIN")) {
    if (!allowed.includes("OWNER")) allowed.push("OWNER");
    if (!allowed.includes("MANAGER")) allowed.push("MANAGER");
  }
  if (!allowed.includes(user.role)) {
    redirect(homeForRole(user.role));
    return;
  }
}

/**
 * Returns the property/society id tenant-scoped queries need.
 */
export function requireSocietyContext(user) {
  if (!user) {
    redirect("/login");
    return null;
  }
  requirePageRole(user, ADMIN_ROLES);
  if (!user.societyId) {
    redirect(homeForRole(user.role));
    return null;
  }
  return user.societyId;
}
