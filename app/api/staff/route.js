import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { isSuperAdmin, isSocietyAdmin, isOwner } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { forbidden, badRequest, notFound, unprocessable } from "@/lib/errors";
import { ROLES } from "@/lib/constants";
import { staffCreateSchema } from "@/lib/validation/schemas";
import { createFirebaseUser, discardFirebaseUser } from "@/lib/firebase/identity";
import { sendUserWelcomeEmail, generateTemporaryPassword } from "@/lib/email";
import {
  getUserAccessibleSocieties,
  getPGManagersForSocieties,
  assignManagerToSocieties,
} from "@/lib/db/staffAssignments";

export const dynamic = "force-dynamic";

/**
 * GET /api/staff
 * Super admin: every society/security/flat admin across the platform.
 * Owner / Society admin: managers and staff belonging to their accessible PG properties or society.
 */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  if (!isSuperAdmin(user) && !isSocietyAdmin(user) && !isOwner(user)) {
    throw forbidden("Admin access required");
  }

  // 1. Super Admin
  if (isSuperAdmin(user)) {
    const societyId = req.nextUrl.searchParams.get("societyId");
    if (societyId) {
      const managers = await getPGManagersForSocieties([societyId]);
      return ok(managers);
    }
    const staff = await prisma.user.findMany({
      where: {
        role: { in: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.OWNER, ROLES.SOCIETY_ADMIN] },
      },
      include: {
        society: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
    return ok(staff);
  }

  // 2. PG Owner / Society Admin
  const accessibleSocieties = await getUserAccessibleSocieties(user);
  const societyIds = accessibleSocieties.map((s) => s.id);

  if (!societyIds.length) {
    return ok([]);
  }

  const isApartment = accessibleSocieties.some((s) => s.type === "SOCIETY");

  if (isApartment && !isOwner(user)) {
    // For Apartment Society: return flat admins
    const flatAdmins = await prisma.user.findMany({
      where: {
        role: ROLES.FLAT_ADMIN,
        societyId: { in: societyIds },
      },
      include: {
        society: { select: { id: true, name: true, code: true } },
        flatResidents: {
          where: { endDate: null },
          include: { flat: { select: { id: true, flatNumber: true, block: true } } },
        },
      },
      orderBy: { name: "asc" },
    });
    return ok(flatAdmins);
  }

  // For PGs: return PG managers assigned to any of the owner's accessible PGs
  const managers = await getPGManagersForSocieties(societyIds);
  return ok(managers);
});

/**
 * POST /api/staff
 *
 * SUPER_ADMIN: Can add PG Managers, Owners, Society Admins.
 * OWNER / SOCIETY_ADMIN: Can add PG Managers (and assign them to 1 or more of their PGs).
 */
const POSTImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  const rawBody = await readJson(req);
  const body = staffCreateSchema.parse(rawBody);

  let targetSocietyIds = [];
  let primarySocietyId = null;
  let flatId = null;

  if (isSuperAdmin(user)) {
    if (body.role === ROLES.SUPER_ADMIN) {
      primarySocietyId = null;
    } else if (body.role === ROLES.MANAGER || body.role === ROLES.OWNER || body.role === ROLES.SOCIETY_ADMIN) {
      const ids = Array.isArray(body.societyIds) && body.societyIds.length
        ? body.societyIds
        : body.societyId
        ? [body.societyId]
        : [];
      if (!ids.length) throw badRequest("Choose which PG property this staff member belongs to");
      targetSocietyIds = ids;
      primarySocietyId = ids[0];
    } else {
      throw forbidden("Super admins can only add PG Managers, Owners, or other Super Admins");
    }
  } else if (isOwner(user) || isSocietyAdmin(user)) {
    // PG Owner or Society Admin adding PG Manager
    if (body.role === ROLES.MANAGER) {
      const accessibleSocieties = await getUserAccessibleSocieties(user);
      const accessibleIds = new Set(accessibleSocieties.map((s) => s.id));

      const requestedIds = Array.isArray(body.societyIds) && body.societyIds.length
        ? body.societyIds
        : body.societyId
        ? [body.societyId]
        : user.societyId
        ? [user.societyId]
        : [];

      if (!requestedIds.length) {
        throw badRequest("Please select at least one PG property for this manager");
      }

      // Verify owner has access to all requested societies
      for (const reqId of requestedIds) {
        if (!accessibleIds.has(reqId)) {
          throw forbidden("You cannot assign a manager to a property you do not manage");
        }
      }

      targetSocietyIds = requestedIds;
      primarySocietyId = requestedIds[0];
    } else if (body.role === ROLES.FLAT_ADMIN) {
      primarySocietyId = user.societyId;
      if (!body.flatId) throw badRequest("Choose the flat this flat admin manages");
      const flat = await prisma.flat.findFirst({ where: { id: body.flatId, societyId: user.societyId } });
      if (!flat) throw notFound("Flat");
      flatId = flat.id;
    } else {
      throw forbidden("PG Owners can add PG Managers");
    }
  } else {
    throw forbidden("Admin access required");
  }

  const email = body.email;
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, societyId: true },
  });
  if (existing) {
    // If user already exists as a manager, allow assigning them to additional PGs ONLY IF they belong to caller's tree
    if (existing.role === ROLES.MANAGER && targetSocietyIds.length) {
      if (!isSuperAdmin(user)) {
        const accessible = await getUserAccessibleSocieties(user);
        const accessibleIds = new Set(accessible.map((s) => s.id));
        const existingAssignments = await prisma.$queryRawUnsafe(
          `SELECT "societyId" FROM "StaffAssignment" WHERE "userId" = $1`,
          existing.id
        );
        const existingSocietyIds = [
          existing.societyId,
          ...existingAssignments.map((a) => a.societyId),
        ].filter(Boolean);

        const belongsToCallerTree = existingSocietyIds.some((sId) => accessibleIds.has(sId));
        if (!belongsToCallerTree) {
          throw unprocessable("Validation failed", {
            email: "An account with this email already belongs to another organization",
          });
        }
      }

      await assignManagerToSocieties(existing.id, targetSocietyIds, "MANAGER");
      return ok({ id: existing.id, updated: true, message: "Assigned manager to properties" });
    }
    throw unprocessable("Validation failed", { email: "An account with this email already exists" });
  }

  const finalPassword = (body.password || "").trim() || generateTemporaryPassword();
  const identity = await createFirebaseUser(email, finalPassword);

  let created;
  try {
    created = await prisma.$transaction(async (tx) => {
      const row = await tx.user.create({
        data: {
          societyId: primarySocietyId,
          name: body.name,
          email,
          phone: body.phone ?? null,
          authUid: identity.uid,
          role: body.role,
          status: "ACTIVE",
        },
      });

      if (flatId) {
        await tx.flatResident.create({
          data: {
            societyId: primarySocietyId,
            flatId,
            userId: row.id,
            residentType: "OWNER",
            isPrimary: true,
          },
        });
      }

      return row;
    });

    // Assign to multiple societies if applicable
    if (targetSocietyIds.length) {
      await assignManagerToSocieties(created.id, targetSocietyIds, body.role);
    }
  } catch (err) {
    if (identity.created) {
      await discardFirebaseUser(email, finalPassword);
    }
    throw err;
  }

  await audit({
    societyId: primarySocietyId,
    userId: user.id,
    action: AUDIT.STAFF_CREATED,
    entityType: "user",
    entityId: created.id,
    newValue: { name: created.name, email: created.email, role: created.role, targetSocietyIds },
  });

  // Send welcome email with login credentials
  const targetSociety = primarySocietyId
    ? await prisma.society.findUnique({ where: { id: primarySocietyId }, select: { name: true } })
    : null;

  sendUserWelcomeEmail({
    email: created.email,
    name: created.name,
    role: created.role,
    password: finalPassword,
    societyName: targetSociety?.name,
    societyId: primarySocietyId,
  }).catch((e) => console.warn("[email] Error sending staff welcome email:", e?.message));

  return ok(created, { status: 201 });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function POST(request, context) {
  return POSTImpl(request, context);
}
