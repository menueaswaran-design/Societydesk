import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { bedCreateSchema } from "@/lib/validation/schemas";
import { audit, AUDIT } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * GET /api/beds
 * Query params: unitId, status
 */
export const GET = handler(async (req) => {
  const user = await getSessionUser(req);
  const sp = req.nextUrl.searchParams;
  const societyId = resolveSocietyScope(user, null);

  const unitId = sp.get("unitId");
  const status = sp.get("status");

  const where = { societyId };
  if (unitId) where.unitId = unitId;
  if (status) where.status = status;

  const beds = await prisma.bed.findMany({
    where,
    include: {
      unit: true,
      occupancies: {
        where: { status: { in: ["ACTIVE", "NOTICE"] } },
        include: { user: true },
      },
    },
    orderBy: [{ unit: { unitNumber: "asc" } }, { bedLabel: "asc" }],
  });

  return ok(beds);
});

/**
 * POST /api/beds
 * Add a bed to an existing room.
 */
export const POST = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);

  const body = bedCreateSchema.parse(await readJson(req));

  const bed = await prisma.bed.create({
    data: {
      societyId,
      unitId: body.unitId,
      bedLabel: body.bedLabel,
      rentAmount: body.rentAmount,
      status: body.status,
    },
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.BED_CREATED,
    entityType: "bed",
    entityId: bed.id,
    newValue: { bedLabel: bed.bedLabel, unitId: bed.unitId },
  });

  return ok(bed, { status: 201 });
});

