import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { isSuperAdmin, isSocietyAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { forbidden, notFound } from "@/lib/errors";
import { ROLES } from "@/lib/constants";
export const dynamic = "force-dynamic";

const MANAGED_ROLES = [ROLES.SOCIETY_ADMIN, ROLES.SECURITY_ADMIN, ROLES.FLAT_ADMIN];

/**
 * DELETE /api/staff/:id - deactivate an admin's login (soft delete).
 *
 * Super admin may deactivate society/security admins; a society admin may only
 * deactivate a flat admin inside their own society.
 */
const DELETEImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || !MANAGED_ROLES.includes(target.role)) throw notFound("Staff member");

  if (isSuperAdmin(user)) {
    if (![ROLES.SOCIETY_ADMIN, ROLES.SECURITY_ADMIN].includes(target.role)) {
      throw forbidden("Super admins manage society and security admins");
    }
  } else if (isSocietyAdmin(user)) {
    if (target.societyId !== user.societyId || target.role !== ROLES.FLAT_ADMIN) {
      throw forbidden("You can only remove flat admins in your own society");
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

export async function DELETE(request, context) {
  return DELETEImpl(request, context);
}
