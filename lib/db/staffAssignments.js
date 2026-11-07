import { prisma } from "./prisma.js";

/**
 * Ensures the StaffAssignment table exists in PostgreSQL.
 * Self-healing on first run.
 */
let tableInitialized = false;
export async function ensureStaffAssignmentTable() {
  if (tableInitialized) return;
  try {
    // PostgreSQL prepared statements permit only ONE command per query execution.
    // Execute table and index creation statements individually.
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "StaffAssignment" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "societyId" TEXT NOT NULL REFERENCES "Society"("id") ON DELETE CASCADE,
        "role" TEXT NOT NULL DEFAULT 'MANAGER',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "StaffAssignment_userId_societyId_key" UNIQUE ("userId", "societyId")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "StaffAssignment_userId_idx" ON "StaffAssignment"("userId")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "StaffAssignment_societyId_idx" ON "StaffAssignment"("societyId")
    `);
    tableInitialized = true;
  } catch (err) {
    console.error("[StaffAssignment] Failed to ensure table:", err.message);
  }
}

/**
 * Get all societies that the given user has access to.
 * - SUPER_ADMIN: all active societies
 * - OWNER / MANAGER: assigned societies from StaffAssignment + user's current societyId
 */
export async function getUserAccessibleSocieties(user) {
  if (!user) return [];
  await ensureStaffAssignmentTable();

  // Super admin can access all active societies
  if (user.role === "SUPER_ADMIN") {
    return prisma.society.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, code: true, type: true, logoUrl: true },
      orderBy: { name: "asc" },
    });
  }

  try {
    // 1. Fetch assigned societies from StaffAssignment
    const assignments = await prisma.$queryRawUnsafe(
      `
      SELECT s.id, s.name, s.code, s.type, s."logoUrl", sa.role
      FROM "StaffAssignment" sa
      JOIN "Society" s ON s.id = sa."societyId"
      WHERE sa."userId" = $1 AND s.status = 'ACTIVE'
      ORDER BY s.name ASC
      `,
      user.id
    );

    const societyMap = new Map();
    for (const row of assignments) {
      societyMap.set(row.id, {
        id: row.id,
        name: row.name,
        code: row.code,
        type: row.type,
        logoUrl: row.logoUrl,
        assignedRole: row.role,
      });
    }

    // 2. Also ensure user's current societyId is in the list
    if (user.societyId && !societyMap.has(user.societyId)) {
      const current = await prisma.society.findUnique({
        where: { id: user.societyId },
        select: { id: true, name: true, code: true, type: true, logoUrl: true },
      });
      if (current) {
        societyMap.set(current.id, {
          ...current,
          assignedRole: user.role,
        });
      }
    }

    // 3. For OWNER: link legacy societies that strictly match the owner's exact email
    if (user.role === "OWNER" && user.email) {
      const ownerEmail = user.email.toLowerCase().trim();
      const legacySocieties = await prisma.society.findMany({
        where: {
          status: "ACTIVE",
          email: { equals: ownerEmail, mode: "insensitive" },
        },
        select: { id: true, name: true, code: true, type: true, logoUrl: true },
      });
      for (const s of legacySocieties) {
        if (!societyMap.has(s.id)) {
          societyMap.set(s.id, { ...s, assignedRole: "OWNER" });
          await addSocietyAssignment(user.id, s.id, "OWNER").catch(() => {});
        }
      }
    }

    return Array.from(societyMap.values());
  } catch (err) {
    console.error("[StaffAssignment] Failed to fetch accessible societies:", err.message);
    if (user.societyId) {
      const s = await prisma.society.findUnique({
        where: { id: user.societyId },
        select: { id: true, name: true, code: true, type: true, logoUrl: true },
      });
      return s ? [s] : [];
    }
    return [];
  }
}

/**
 * Get all managers assigned to a list of society IDs.
 */
export async function getPGManagersForSocieties(societyIds = []) {
  if (!societyIds.length) return [];
  await ensureStaffAssignmentTable();

  try {
    // Query users with role MANAGER that belong to these societies directly or via StaffAssignment
    const assignments = await prisma.$queryRawUnsafe(
      `
      SELECT sa."userId", sa."societyId", s.name as "societyName", s.code as "societyCode"
      FROM "StaffAssignment" sa
      JOIN "Society" s ON s.id = sa."societyId"
      WHERE sa."societyId" = ANY($1::text[])
      `,
      societyIds
    );

    const userSocietyMap = new Map();
    for (const a of assignments) {
      if (!userSocietyMap.has(a.userId)) {
        userSocietyMap.set(a.userId, []);
      }
      userSocietyMap.get(a.userId).push({
        id: a.societyId,
        name: a.societyName,
        code: a.societyCode,
      });
    }

    // Also get managers who have societyId directly in societyIds
    const directManagers = await prisma.user.findMany({
      where: {
        role: "MANAGER",
        societyId: { in: societyIds },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        societyId: true,
        society: { select: { id: true, name: true, code: true } },
      },
    });

    // Also get any managers assigned via StaffAssignment
    const assignedUserIds = Array.from(userSocietyMap.keys());
    const additionalUsers = assignedUserIds.length
      ? await prisma.user.findMany({
          where: {
            id: { in: assignedUserIds },
            role: "MANAGER",
            status: "ACTIVE",
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            societyId: true,
            society: { select: { id: true, name: true, code: true } },
          },
        })
      : [];

    const managerMap = new Map();
    for (const u of [...directManagers, ...additionalUsers]) {
      // Isolate assigned societies to ONLY the requested societyIds (owner's tree)
      const assigned = (userSocietyMap.get(u.id) || []).filter((s) => societyIds.includes(s.id));
      if (u.society && societyIds.includes(u.society.id) && !assigned.some((s) => s.id === u.society.id)) {
        assigned.push(u.society);
      }
      managerMap.set(u.id, {
        ...u,
        assignedSocieties: assigned,
      });
    }

    return Array.from(managerMap.values());
  } catch (err) {
    console.error("[StaffAssignment] Failed to fetch PG managers:", err.message);
    return [];
  }
}

/**
 * Add a single society assignment without removing existing assignments.
 */
export async function addSocietyAssignment(userId, societyId, role = "OWNER") {
  await ensureStaffAssignmentTable();
  if (!userId || !societyId) return;

  const id = `assign_${userId}_${societyId}`;
  await prisma.$executeRawUnsafe(
    `
    INSERT INTO "StaffAssignment" ("id", "userId", "societyId", "role")
    VALUES ($1, $2, $3, $4)
    ON CONFLICT ("userId", "societyId") DO UPDATE SET "role" = EXCLUDED."role"
    `,
    id,
    userId,
    societyId,
    role
  );
}

/**
 * Assign a manager to one or more societies.
 */
export async function assignManagerToSocieties(userId, societyIds, role = "MANAGER") {
  await ensureStaffAssignmentTable();
  if (!userId || !Array.isArray(societyIds) || !societyIds.length) return;

  // Insert or update assignments for the user
  for (const sId of societyIds) {
    const id = `assign_${userId}_${sId}`;
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "StaffAssignment" ("id", "userId", "societyId", "role")
      VALUES ($1, $2, $3, $4)
      ON CONFLICT ("userId", "societyId") DO UPDATE SET "role" = EXCLUDED."role"
      `,
      id,
      userId,
      sId,
      role
    );
  }

  // Remove any assignments not in societyIds
  await prisma.$executeRawUnsafe(
    `
    DELETE FROM "StaffAssignment"
    WHERE "userId" = $1 AND NOT ("societyId" = ANY($2::text[]))
    `,
    userId,
    societyIds
  );

  // If user has no active societyId or it's not in the new list, update to the first
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { societyId: true },
  });
  if (!user?.societyId || !societyIds.includes(user.societyId)) {
    await prisma.user.update({
      where: { id: userId },
      data: { societyId: societyIds[0] },
    });
  }
}

/**
 * Remove a manager from a society.
 */
export async function removeManagerAssignment(userId, societyId) {
  await ensureStaffAssignmentTable();
  await prisma.$executeRawUnsafe(
    `
    DELETE FROM "StaffAssignment"
    WHERE "userId" = $1 AND "societyId" = $2
    `,
    userId,
    societyId
  );

  // Check remaining assignments
  const remaining = await prisma.$queryRawUnsafe(
    `
    SELECT "societyId" FROM "StaffAssignment" WHERE "userId" = $1
    `,
    userId
  );

  if (remaining.length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { societyId: remaining[0].societyId },
    });
  } else {
    // If no remaining societies, mark user inactive or delete
    await prisma.user.update({
      where: { id: userId },
      data: { status: "INACTIVE" },
    });
  }
}

/**
 * Switch a user's active society.
 */
export async function switchUserActiveSociety(user, targetSocietyId) {
  if (!user || !targetSocietyId) {
    throw new Error("User and target society ID are required");
  }

  const accessible = await getUserAccessibleSocieties(user);
  const hasAccess = accessible.some((s) => s.id === targetSocietyId);

  if (!hasAccess && user.role !== "SUPER_ADMIN") {
    throw new Error("You do not have access to this property");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { societyId: targetSocietyId },
  });

  return accessible.find((s) => s.id === targetSocietyId);
}
