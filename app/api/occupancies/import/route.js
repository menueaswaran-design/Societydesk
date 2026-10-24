import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireResidentManager, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { unprocessable } from "@/lib/errors";
import { pgImportSchema } from "@/lib/validation/schemas";
import { createFirebaseUser } from "@/lib/firebase/identity";

export const dynamic = "force-dynamic";

/**
 * POST /api/occupancies/import
 * Bulk-import PG rooms, beds, residents, and security deposits from Excel/CSV (spec section 12).
 *
 * Columns: Room, Bed, Name, Phone, Email, JoinDate, MonthlyRent, Deposit
 * All-or-nothing single transaction. If any row fails validation, nothing is imported.
 */
export const POST = handler(async (req) => {
  const user = await getSessionUser(req);
  requireResidentManager(user);
  const societyId = resolveSocietyScope(user, null);

  const { rows } = pgImportSchema.parse(await readJson(req));

  const errors = [];
  const seenEmails = new Map();
  const seenBeds = new Set();

  rows.forEach((row, i) => {
    const line = i + 1;
    const emailKey = row.email.toLowerCase();
    if (seenEmails.has(emailKey)) {
      errors.push({
        line,
        field: "email",
        message: `Duplicate email (already on line ${seenEmails.get(emailKey)})`,
      });
    } else {
      seenEmails.set(emailKey, line);
    }

    const bedKey = `${row.room.trim().toUpperCase()}:${(row.bed || "A").trim().toUpperCase()}`;
    if (seenBeds.has(bedKey)) {
      errors.push({
        line,
        field: "bed",
        message: `Duplicate room & bed assignment: ${row.room} Bed ${row.bed || "A"}`,
      });
    } else {
      seenBeds.add(bedKey);
    }
  });

  if (errors.length > 0) {
    throw unprocessable(
      `Import rejected: ${errors.length} validation issue${errors.length === 1 ? "" : "s"} found.`,
      errors
    );
  }

  // Check for duplicate active occupants with these emails
  const existingUsers = await prisma.user.findMany({
    where: {
      societyId,
      email: { in: rows.map((r) => r.email.toLowerCase()) },
      occupancies: { some: { status: { in: ["ACTIVE", "NOTICE"] } } },
    },
    select: { email: true, name: true },
  });

  for (const ex of existingUsers) {
    errors.push({
      line: null,
      field: "email",
      message: `${ex.name} (${ex.email}) is already an active occupant in this PG`,
    });
  }

  if (errors.length > 0) {
    throw unprocessable("Import rejected due to existing active occupants", errors);
  }

  // Execute all in a single transaction
  const result = await prisma.$transaction(async (tx) => {
    const imported = [];

    for (const row of rows) {
      const roomNumber = row.room.trim().toUpperCase();
      const bedLabel = (row.bed || "A").trim().toUpperCase();
      const joinDate = row.joinDate ? new Date(row.joinDate) : new Date();

      // 1. Ensure Room exists
      let unit = await tx.unit.findFirst({
        where: { societyId, unitNumber: roomNumber },
      });
      if (!unit) {
        unit = await tx.unit.create({
          data: {
            societyId,
            unitNumber: roomNumber,
            rentAmount: row.monthlyRent,
            bedCapacity: 2,
            status: "AVAILABLE",
          },
        });
      }

      // 2. Ensure Bed exists
      let bed = await tx.bed.findFirst({
        where: { unitId: unit.id, bedLabel },
      });
      if (!bed) {
        bed = await tx.bed.create({
          data: {
            societyId,
            unitId: unit.id,
            bedLabel,
            rentAmount: row.monthlyRent,
            status: "VACANT",
          },
        });
      }

      // 3. Find or create resident User
      let resident = await tx.user.findUnique({
        where: { email: row.email.toLowerCase() },
      });
      if (!resident) {
        resident = await tx.user.create({
          data: {
            societyId,
            name: row.name,
            email: row.email.toLowerCase(),
            phone: row.phone || null,
            role: "RESIDENT",
            status: "ACTIVE",
          },
        });
      }

      // 4. Create Occupancy
      const occupancy = await tx.occupancy.create({
        data: {
          societyId,
          userId: resident.id,
          unitId: unit.id,
          bedId: bed.id,
          joinDate,
          monthlyRent: row.monthlyRent,
          depositAmount: row.deposit || 0,
          status: "ACTIVE",
        },
      });

      // 5. Mark Bed OCCUPIED
      await tx.bed.update({
        where: { id: bed.id },
        data: { status: "OCCUPIED" },
      });

      // 6. Record Deposit if specified
      if (row.deposit && row.deposit > 0) {
        await tx.deposit.create({
          data: {
            societyId,
            occupancyId: occupancy.id,
            amountReceived: row.deposit,
            receivedDate: joinDate,
            status: "HELD",
            notes: "Imported from batch spreadsheet",
          },
        });
      }

      imported.push({
        room: roomNumber,
        bed: bedLabel,
        name: resident.name,
        email: resident.email,
        rent: row.monthlyRent,
        deposit: row.deposit,
      });
    }

    return imported;
  });

  // Provision default login credentials (bedy@123) for newly imported residents
  for (const row of rows) {
    try {
      await createFirebaseUser(row.email.toLowerCase(), "bedy@123");
    } catch {
      // Non-blocking
    }
  }

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.RESIDENT_IMPORTED,
    entityType: "import",
    entityId: `${societyId}:${Date.now()}`,
    newValue: { count: result.length },
  });

  return ok({ imported: result.length, rows: result }, { status: 201 });
});

