import { cache } from "react";
import { forbidden, badRequest } from "../errors.js";
import { prisma } from "../db/prisma.js";
import { ROLES } from "../constants.js";

export function isSuperAdmin(user) {
  return user.role === ROLES.SUPER_ADMIN;
}

export function isOwner(user) {
  return user.role === ROLES.OWNER;
}

export function isManager(user) {
  return user.role === ROLES.MANAGER;
}

export function isSocietyAdmin(user) {
  return user.role === ROLES.SOCIETY_ADMIN;
}

export function isSecurityAdmin(user) {
  return user.role === ROLES.SECURITY_ADMIN;
}

export function isFlatAdmin(user) {
  return user.role === ROLES.FLAT_ADMIN;
}

export function isResident(user) {
  return user.role === ROLES.RESIDENT;
}

/**
 * Full property/society administration: billing, rooms/flats, staff, settings.
 * OWNER, MANAGER, SOCIETY_ADMIN, SUPER_ADMIN.
 */
export function isStaff(user) {
  return (
    isSuperAdmin(user) ||
    isSocietyAdmin(user) ||
    isOwner(user) ||
    isManager(user)
  );
}

/** Can see and drive the whole complaint queue. */
export function isComplaintManager(user) {
  return isStaff(user) || isSecurityAdmin(user);
}

/** Can see and manage residents / occupancies. */
export function isResidentManager(user) {
  return isStaff(user) || isFlatAdmin(user);
}

/** Platform-level (cross-tenant) operations. */
export function requireSuperAdmin(user) {
  if (!isSuperAdmin(user)) throw forbidden("Super admin access required");
  return user;
}

/** Property / Society-scoped administration. */
export function requireSocietyAdmin(user) {
  if (!isStaff(user)) throw forbidden("Owner or admin access required");
  if (!user.societyId) throw forbidden("Your account is not linked to a property/society");
  return user;
}

export const requirePropertyAdmin = requireSocietyAdmin;

/** Complaint management. */
export function requireComplaintManager(user) {
  if (!isComplaintManager(user)) throw forbidden("Complaint management access required");
  if (!user.societyId) throw forbidden("Your account is not linked to a property/society");
  return user;
}

/** Resident management (Owner, Manager, Society Admin, or Flat Admin). */
export function requireResidentManager(user) {
  if (!isResidentManager(user)) throw forbidden("Resident management access required");
  if (!user.societyId) throw forbidden("Your account is not linked to a property/society");
  return user;
}

/** Any authenticated member of a property/society. */
export function requireSocietyMember(user) {
  if (!user.societyId) throw forbidden("Your account is not linked to a property/society");
  return user;
}

/**
 * THE tenant guard.
 *
 * Returns the tenant/society id that every subsequent query must be filtered by.
 * Scoped to the authenticated user's tenant.
 */
export function resolveSocietyScope(user, requestedSocietyId) {
  if (isSuperAdmin(user)) {
    if (requestedSocietyId) return String(requestedSocietyId);
    if (user.societyId) return user.societyId;
    throw forbidden("Specify which property/society to work in");
  }
  if (!user.societyId) throw forbidden("Your account is not linked to a property/society");
  if (requestedSocietyId && String(requestedSocietyId) !== String(user.societyId)) {
    throw forbidden("You cannot access another tenant's data");
  }
  return user.societyId;
}

export const resolveTenantScope = resolveSocietyScope;

/** Ids of every flat the resident currently occupies. */
export const getResidentFlatIds = cache(async (userId) => {
  try {
    const rows = await prisma.flatResident.findMany({
      where: { userId, endDate: null },
      select: { flatId: true },
    });
    return rows.map((l) => l.flatId);
  } catch (e) {
    return [];
  }
});

/** Active occupancy records for a resident in PG workspace. */
export const getResidentOccupancies = cache(async (userId) => {
  try {
    return await prisma.occupancy.findMany({
      where: { userId, status: { in: ["ACTIVE", "NOTICE"] } },
      include: {
        unit: true,
        bed: true,
      },
    });
  } catch (e) {
    return [];
  }
});

/** Checks if a user has access to a specific flat. */
export async function requireFlatAccess(user, flatId, opts = {}) {
  if (isStaff(user)) return true;
  if (!flatId) throw badRequest("Flat ID required");
  const ownFlats = await getResidentFlatIds(user.id);
  if (!ownFlats.includes(flatId)) {
    throw forbidden("You do not have access to this flat");
  }
  return true;
}

/** Checks if a user has access to a specific occupancy (PG room/bed). */
export async function requireOccupancyAccess(user, occupancyId, opts = {}) {
  if (isStaff(user)) return true;
  if (!occupancyId) throw badRequest("Occupancy ID required");
  const occ = await prisma.occupancy.findFirst({
    where: { id: occupancyId, userId: user.id },
  });
  if (!occ) {
    throw forbidden("You do not have access to this room/bed");
  }
  return true;
}

export function assertPositiveInt(value, field = "amount") {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw badRequest(`${field} must be greater than zero`);
  return Math.round(n);
}

export function assertNonNegativeInt(value, field = "amount") {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw badRequest(`${field} cannot be negative`);
  return Math.round(n);
}
