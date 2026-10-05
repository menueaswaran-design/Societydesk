import { forbidden, badRequest } from "../errors.js";
import { prisma } from "../db/prisma.js";
import { ROLES } from "../constants.js";

export function isSuperAdmin(user) {
  return user.role === ROLES.SUPER_ADMIN;
}

export function isSocietyAdmin(user) {
  return user.role === ROLES.SOCIETY_ADMIN;
}

export function isResident(user) {
  return user.role === ROLES.RESIDENT;
}

/** True for the roles that get the admin portal. */
export function isStaff(user) {
  return isSuperAdmin(user) || isSocietyAdmin(user);
}

/** Platform-level (cross-society) operations. */
export function requireSuperAdmin(user) {
  if (!isSuperAdmin(user)) throw forbidden("Super admin access required");
  return user;
}

/** Society-scoped administration. */
export function requireSocietyAdmin(user) {
  if (!isStaff(user)) throw forbidden("Society admin access required");
  if (!user.societyId) throw forbidden("Your account is not linked to a society");
  return user;
}

/** Any authenticated member of a society. */
export function requireSocietyMember(user) {
  if (!user.societyId) throw forbidden("Your account is not linked to a society");
  return user;
}

/**
 * THE tenant guard.
 *
 * Returns the society id that every subsequent query must be filtered by.
 * Society-admin and resident requests are always pinned to their own society -
 * a society_id coming from the request body/query is only honoured for super
 * admins, and only when they explicitly target one.
 */
export function resolveSocietyScope(user, requestedSocietyId) {
  if (isSuperAdmin(user)) {
    if (requestedSocietyId) return String(requestedSocietyId);
    // A platform admin is not a member of any society, so there is no implicit
    // tenant to scope to. Returning null here used to reach Prisma as
    // `where: { societyId: null }` and 500 the whole endpoint.
    if (user.societyId) return user.societyId;
    throw forbidden("Specify which society to work in");
  }
  if (!user.societyId) throw forbidden("Your account is not linked to a society");
  if (requestedSocietyId && String(requestedSocietyId) !== String(user.societyId)) {
    throw forbidden("You cannot access another society's data");
  }
  return user.societyId;
}

/** Ids of every flat the resident currently occupies. */
export async function getResidentFlatIds(userId) {
  const links = await prisma.flatResident.findMany({
    where: { userId, endDate: null },
    select: { flatId: true },
  });
  return links.map((l) => l.flatId);
}

/**
 * Residents may only ever act on their own flats. Staff may act on any flat
 * inside their society. Returns the flat record (tenant-checked).
 */
export async function requireFlatAccess(user, flatId, { societyId } = {}) {
  if (!flatId) throw badRequest("flatId is required");

  const flat = await prisma.flat.findUnique({ where: { id: flatId } });
  if (!flat) throw forbidden("Flat not found in your society");

  if (societyId && flat.societyId !== societyId) {
    throw forbidden("You cannot access another society's data");
  }

  if (isStaff(user)) return flat;

  const owned = await prisma.flatResident.findFirst({
    where: { userId: user.id, flatId: flat.id, endDate: null },
  });
  if (!owned) throw forbidden("You do not have access to this flat");
  return flat;
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