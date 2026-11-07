import { cookies } from "next/headers";
import { handler, ok, readJson } from "@/lib/api";
import { unprocessable, forbidden } from "@/lib/errors";
import { getSessionUser } from "@/lib/auth/session";
import { isSuperAdmin, isOwner } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { societyCreateSchema } from "@/lib/validation/schemas";
import { createFirebaseUser, discardFirebaseUser } from "@/lib/firebase/identity";
import { sendUserWelcomeEmail, generateTemporaryPassword } from "@/lib/email";
import {
  addSocietyAssignment,
  getUserAccessibleSocieties,
} from "@/lib/db/staffAssignments";
export const dynamic = "force-dynamic";

/** GET /api/societies - platform-wide list for super admin, or owned properties for owner. */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  if (!isSuperAdmin(user) && !isOwner(user)) {
    throw forbidden("Admin access required");
  }

  if (isSuperAdmin(user)) {
    const societies = await prisma.society.findMany({
      include: {
        _count: { select: { flats: true, users: true, invoices: true, complaints: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(societies);
  }

  // Owner: return properties accessible to this owner
  const accessible = await getUserAccessibleSocieties(user);
  const ids = accessible.map((s) => s.id);
  const societies = await prisma.society.findMany({
    where: { id: { in: ids } },
    include: {
      _count: { select: { flats: true, users: true, invoices: true, complaints: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(societies);
});

/**
 * POST /api/societies - create a PG property tenant and optionally assign managers.
 * Permitted for SUPER_ADMIN and OWNER.
 */
const POSTImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  if (!isSuperAdmin(user) && !isOwner(user)) {
    throw forbidden("Only super administrators and property owners can add PG properties");
  }

  const body = societyCreateSchema.parse(await readJson(req));

  const generatedCode =
    (body.code || "").trim() ||
    (body.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 4) +
      Math.floor(100 + Math.random() * 900)
    ).toUpperCase();

  let adminIdentity = null;
  let adminFinalPassword = null;
  if (body.adminName && body.adminEmail) {
    const adminEmail = body.adminEmail.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: adminEmail }, select: { id: true } });
    if (existing) {
      throw unprocessable("Validation failed", {
        adminEmail: "An account with this email already exists",
      });
    }
    adminFinalPassword = (body.adminPassword || "").trim() || generateTemporaryPassword();
    adminIdentity = await createFirebaseUser(adminEmail, adminFinalPassword);
  }

  let society;
  let createdManager = null;
  try {
    society = await prisma.$transaction(async (tx) => {
      const created = await tx.society.create({
        data: {
          name: body.name,
          code: generatedCode,
          type: "PG",
          address: body.address ?? null,
          city: body.city ?? null,
          state: body.state ?? null,
          pincode: body.pincode ?? null,
          phone: body.phone ?? user.phone ?? null,
          email: body.email || (isOwner(user) ? user.email : null),
          bankName: body.bankName ?? null,
          bankAccountNo: body.bankAccountNo ?? null,
          bankIfsc: body.bankIfsc ?? null,
          bankHolderName: body.bankHolderName ?? null,
          upiId: body.upiId ?? null,
          status: "ACTIVE",
        },
      });

      if (adminIdentity) {
        createdManager = await tx.user.create({
          data: {
            societyId: created.id,
            name: body.adminName,
            email: body.adminEmail.toLowerCase(),
            phone: body.adminPhone || null,
            authUid: adminIdentity.uid,
            role: isOwner(user) ? "MANAGER" : (body.adminRole || "MANAGER"),
            status: "ACTIVE",
          },
        });
      }

      return created;
    });
  } catch (err) {
    if (adminIdentity?.created && adminFinalPassword) {
      await discardFirebaseUser(body.adminEmail.toLowerCase(), adminFinalPassword);
    }
    throw err;
  }

  // 1. If created by an OWNER, link the owner to this new PG in StaffAssignment
  if (isOwner(user)) {
    await addSocietyAssignment(user.id, society.id, "OWNER");

    // If owner requested to set as active PG (or had no active PG)
    if (body.setAsActive || !user.societyId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { societyId: society.id },
      });
      const cookieStore = await cookies();
      cookieStore.set("sd_active_society", society.id, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  }

  // 2. If a new manager account was provisioned, link them in StaffAssignment
  if (createdManager) {
    await addSocietyAssignment(createdManager.id, society.id, "MANAGER");
  }

  // 3. If owner assigned existing managers to this new PG (strict owner-tree verification)
  if (Array.isArray(body.managerIds) && body.managerIds.length) {
    let allowedManagerIds = body.managerIds;
    if (isOwner(user)) {
      const ownerAccessible = await getUserAccessibleSocieties(user);
      const ownerSocietyIds = ownerAccessible.map((s) => s.id);

      if (ownerSocietyIds.length) {
        const verifiedRows = await prisma.$queryRawUnsafe(
          `
          SELECT DISTINCT "userId" 
          FROM "StaffAssignment" 
          WHERE "userId" = ANY($1::text[]) AND "societyId" = ANY($2::text[])
          `,
          body.managerIds,
          ownerSocietyIds
        );
        const verifiedSet = new Set(verifiedRows.map((r) => r.userId));
        allowedManagerIds = body.managerIds.filter((id) => verifiedSet.has(id));
      } else {
        allowedManagerIds = [];
      }
    }

    for (const mgrId of allowedManagerIds) {
      await addSocietyAssignment(mgrId, society.id, "MANAGER");
    }
  }

  await audit({
    societyId: society.id,
    userId: user.id,
    action: AUDIT.SOCIETY_CREATED,
    entityType: "society",
    entityId: society.id,
    newValue: { name: society.name, code: society.code },
  });

  if (adminIdentity && body.adminEmail && adminFinalPassword) {
    sendUserWelcomeEmail({
      email: body.adminEmail.toLowerCase(),
      name: body.adminName,
      role: isOwner(user) ? "MANAGER" : (body.adminRole || "MANAGER"),
      password: adminFinalPassword,
      societyName: society.name,
      societyId: society.id,
    }).catch((e) => console.warn("[email] Error sending society admin welcome email:", e?.message));
  }

  return ok(society, { status: 201 });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function POST(request, context) {
  return POSTImpl(request, context);
}
