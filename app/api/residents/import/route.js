import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { unprocessable } from "@/lib/errors";
import { residentImportSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/**
 * POST /api/residents/import
 * Bulk-create flats + residents from parsed rows (section 35).
 *
 * All-or-nothing: every row is validated first, then the whole batch runs in a
 * single transaction. If anything fails, nothing is written.
 */
const POSTImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);

  const { rows } = residentImportSchema.parse(await readJson(req));

  // ---------------------------------------------------------- validate first
  const errors = [];
  const seenEmails = new Map();
  const seenFlats = new Set();

  rows.forEach((row, i) => {
    const line = i + 1;

    const key = row.email.toLowerCase();
    if (seenEmails.has(key)) {
      errors.push({ line, field: "email", message: `Duplicate email (also on line ${seenEmails.get(key)})` });
    } else {
      seenEmails.set(key, line);
    }

    if (seenFlats.has(row.flatNumber)) {
      errors.push({ line, field: "flatNumber", message: "Duplicate flat number in this file" });
    } else {
      seenFlats.add(row.flatNumber);
    }
  });

  const existingFlats = await prisma.flat.findMany({
    where: { societyId, flatNumber: { in: rows.map((r) => r.flatNumber) } },
    select: { flatNumber: true },
  });
  const existingFlatNumbers = new Set(existingFlats.map((f) => f.flatNumber));
  const existingEmails = await prisma.user.findMany({
    where: { societyId, email: { in: rows.map((r) => r.email.toLowerCase()) } },
    select: { email: true },
  });
  const existingEmailSet = new Set(existingEmails.map((u) => u.email.toLowerCase()));

  for (const f of existingFlatNumbers) {
    errors.push({ line: null, field: "flatNumber", value: f, message: `Flat ${f} already exists` });
  }
  for (const e of existingEmailSet) {
    errors.push({ line: null, field: "email", value: e, message: `${e} is already a resident` });
  }

  if (errors.length > 0) {
    throw unprocessable(
      `Import rejected: ${errors.length} problem${errors.length === 1 ? "" : "s"} found. Nothing was imported.`,
      errors
    );
  }

  // ------------------------------------------------------------- one transaction
  const result = await prisma.$transaction(async (tx) => {
    const created = [];

    for (const row of rows) {
      const flat = await tx.flat.upsert({
        where: { societyId_flatNumber: { societyId, flatNumber: row.flatNumber } },
        update: { block: row.block ?? undefined },
        create: {
          societyId,
          flatNumber: row.flatNumber,
          block: row.block ?? null,
          status: "OCCUPIED",
        },
      });

      const resident = await tx.user.create({
        data: {
          societyId,
          name: row.name,
          email: row.email.toLowerCase(),
          phone: row.phone ?? null,
          role: "RESIDENT",
          status: "ACTIVE",
        },
      });

      await tx.flatResident.create({
        data: {
          societyId,
          flatId: flat.id,
          userId: resident.id,
          residentType: row.residentType,
          isPrimary: true,
        },
      });

      created.push({ flatNumber: flat.flatNumber, name: resident.name, email: resident.email });
    }

    return created;
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.RESIDENT_IMPORTED,
    entityType: "import",
    entityId: `${societyId}:${Date.now()}`,
    newValue: { rows: result.length },
  });

  return ok(
    { imported: result.length, residents: result },
    { status: 201 }
  );
});

export async function POST(request, context) {
  return POSTImpl(request, context);
}
