import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { isSuperAdmin, isSocietyAdmin, isOwner } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { forbidden, notFound, badRequest } from "@/lib/errors";
import { ROLES } from "@/lib/constants";
import {
  getUserAccessibleSocieties,
  assignManagerToSocieties,
  removeManagerAssignment,
} from "@/lib/db/staffAssignments";

export const dynamic = "force-dynamic";

const MANAGED_ROLES = [
  ROLES.MANAGER,
  ROLES.OWNER,
  ROLES.SOCIETY_ADMIN,
  ROLES.SECURITY_ADMIN,
  ROLES.FLAT_ADMIN,
];

/**
 * PATCH /api/staff/:id - update a staff/manager member (e.g. assigned PGs, name, phone).
 */
const PATCHImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;
  const body = await readJson(req);

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || !MANAGED_ROLES.includes(target.role)) {
    throw notFound("Staff member");
  }

  // Permission check: strictly isolated to caller's owner tree
  if (!isSuperAdmin(user)) {
    const accessible = await getUserAccessibleSocieties(user);
    const accessibleIds = new Set(accessible.map((s) => s.id));

    // Get all societies target user is assigned to
    const targetAssignments = await prisma.$queryRawUnsafe(
      `SELECT "societyId" FROM "StaffAssignment" WHERE "userId" = $1`,
      target.id
    );
    const targetSocietyIds = [
      target.societyId,
      ...targetAssignments.map((a) => a.societyId),
    ].filter(Boolean);

    const belongsToCallerTree = targetSocietyIds.some((sId) => accessibleIds.has(sId));
    if (!belongsToCallerTree) {
      throw forbidden("You can only manage staff belonging to your properties");
    }

    if (body.societyIds && Array.isArray(body.societyIds)) {
      for (const sId of body.societyIds) {
        if (!accessibleIds.has(sId)) {
          throw forbidden("Cannot assign manager to a property you do not own");
        }
      }
    }
  }

  const updateData = {};
  if (body.name?.trim()) updateData.name = body.name.trim();
  if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
  if (body.status) updateData.status = body.status;

  if (Object.keys(updateData).length) {
    await prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  // Update assigned societies if provided
  if (Array.isArray(body.societyIds)) {
    await assignManagerToSocieties(id, body.societyIds, target.role);
  }

  return ok({ id, updated: true });
});

/**
 * DELETE /api/staff/:id - deactivate or unassign a staff member.
 */
const DELETEImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || !MANAGED_ROLES.includes(target.role)) throw notFound("Staff member");

  if (isSuperAdmin(user)) {
    // Super admin can deactivate any staff
  } else if (isOwner(user) || isSocietyAdmin(user)) {
    const accessible = await getUserAccessibleSocieties(user);
    const accessibleIds = new Set(accessible.map((s) => s.id));

    const targetAssignments = await prisma.$queryRawUnsafe(
      `SELECT "societyId" FROM "StaffAssignment" WHERE "userId" = $1`,
      target.id
    );
    const targetSocietyIds = [
      target.societyId,
      ...targetAssignments.map((a) => a.societyId),
    ].filter(Boolean);

    const belongsToCallerTree = targetSocietyIds.some((sId) => accessibleIds.has(sId));
    if (!belongsToCallerTree) {
      throw forbidden("You can only remove managers from your own properties");
    }

    // Unassign from the current society
    if (user.societyId) {
      await removeManagerAssignment(id, user.societyId);
      return ok({ id, unassigned: true });
    }
  } else {
    throw forbidden("Admin access required");
  }

  await prisma.user.update({ where: { id }, data: { status: "INACTIVE" } });

  await audit({
    societyId: target.societyId,
    userId: user.id,
    action: AUDIT.STAFF_DEACTIVATED,
    entityType: "user",
    entityId: id,
    oldValue: { status: target.status },
    newValue: { status: "INACTIVE" },
  });

  return ok({ id, deactivated: true });
});

export async function PATCH(request, context) {
  return PATCHImpl(request, context);
}

export async function DELETE(request, context) {
  return DELETEImpl(request, context);
}
