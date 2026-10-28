import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { isSuperAdmin, isSocietyAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { forbidden, badRequest, notFound, unprocessable } from "@/lib/errors";
import { ROLES, STAFF_ROLES } from "@/lib/constants";
import { staffCreateSchema } from "@/lib/validation/schemas";
import { createFirebaseUser, discardFirebaseUser } from "@/lib/firebase/identity";
export const dynamic = "force-dynamic";

/** Roles managed through this endpoint (never SUPER_ADMIN or RESIDENT). */
const MANAGED_ROLES = [ROLES.SOCIETY_ADMIN, ROLES.SECURITY_ADMIN, ROLES.FLAT_ADMIN];

/**
 * GET /api/staff
 * Super admin: every society/security/flat admin across the platform.
 * Society admin: the admins belonging to their own society.
 */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  if (!isSuperAdmin(user) && !isSocietyAdmin(user)) {
    throw forbidden("Admin access required");
  }

  const where = {};
  if (isSuperAdmin(user)) {
    where.role = { in: [ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.OWNER, ROLES.SOCIETY_ADMIN] };
    const societyId = req.nextUrl.searchParams.get("societyId");
    if (societyId) where.societyId = String(societyId);
  } else {
    where.role = ROLES.FLAT_ADMIN;
    where.societyId = user.societyId;
  }

  const staff = await prisma.user.findMany({
    where,
    include: {
      society: { select: { id: true, name: true, code: true } },
      flatResidents: {
        where: { endDate: null },
        include: { flat: { select: { id: true, flatNumber: true, block: true } } },
      },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return ok(staff);
});

/**
 * POST /api/staff
 *
 * SUPER_ADMIN  -> SOCIETY_ADMIN only (choose a society)
 * SOCIETY_ADMIN -> FLAT_ADMIN (choose one of their flats)
 *
 * The Firebase login is provisioned first (it cannot join the Postgres
 * transaction), then the row is written; a failed write discards the fresh
 * Firebase account so no orphan login is left behind.
 */
const POSTImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  const body = staffCreateSchema.parse(await readJson(req));

  let societyId = null;
  let flatId = null;

  if (isSuperAdmin(user)) {
    if (body.role === ROLES.SUPER_ADMIN) {
      societyId = null;
    } else if (body.role === ROLES.MANAGER || body.role === ROLES.OWNER || body.role === ROLES.SOCIETY_ADMIN) {
      if (!body.societyId) throw badRequest("Choose which PG property this manager belongs to");
      const society = await prisma.society.findUnique({ where: { id: body.societyId } });
      if (!society) throw notFound("PG Property");
      societyId = society.id;
    } else {
      throw forbidden("Super admins can only add PG Managers, Owners, or other Super Admins");
    }
  } else if (isSocietyAdmin(user)) {
    if (body.role !== ROLES.FLAT_ADMIN) {
      throw forbidden("Society admins can add flat admins");
    }
    societyId = user.societyId;
    if (!body.flatId) throw badRequest("Choose the flat this flat admin manages");
    const flat = await prisma.flat.findFirst({ where: { id: body.flatId, societyId } });
    if (!flat) throw notFound("Flat");
    flatId = flat.id;
  } else {
    throw forbidden("Admin access required");
  }

  const email = body.email;
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    throw unprocessable("Validation failed", { email: "An account with this email already exists" });
  }

  const identity = await createFirebaseUser(email, body.password);

  let created;
  try {
    created = await prisma.$transaction(async (tx) => {
      const row = await tx.user.create({
        data: {
          societyId,
          name: body.name,
          email,
          phone: body.phone ?? null,
          authUid: identity.uid,
          role: body.role,
          status: "ACTIVE",
        },
      });

      // A flat admin is linked to the flat they manage (reusing the resident
      // relationship table so no schema change is required).
      if (flatId) {
        await tx.flatResident.create({
          data: {
            societyId,
            flatId,
            userId: row.id,
            residentType: "OWNER",
            isPrimary: true,
          },
        });
      }

      return row;
    });
  } catch (err) {
    if (identity.created) {
      await discardFirebaseUser(email, body.password);
    }
    throw err;
  }

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.STAFF_CREATED,
    entityType: "user",
    entityId: created.id,
    newValue: { name: created.name, email: created.email, role: created.role },
  });

  return ok(created, { status: 201 });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function POST(request, context) {
  return POSTImpl(request, context);
}
