import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { notFound, badRequest } from "@/lib/errors";
import { unitUpdateSchema } from "@/lib/validation/schemas";
import { audit, AUDIT } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * GET /api/units/:id
 */
export const GET = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const unit = await prisma.unit.findFirst({
    where: { id, societyId },
    include: {
      building: true,
      beds: {
        include: {
          occupancies: {
            where: { status: { in: ["ACTIVE", "NOTICE"] } },
            include: { user: true },
          },
        },
        orderBy: { bedLabel: "asc" },
      },
      complaints: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!unit) throw notFound("Room not found");
  return ok(unit);
});

/**
 * PATCH /api/units/:id
 */
export const PATCH = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const existing = await prisma.unit.findFirst({ where: { id, societyId } });
  if (!existing) throw notFound("Room not found");

  const body = unitUpdateSchema.parse(await readJson(req));

  const updated = await prisma.unit.update({
    where: { id },
    data: {
      unitNumber: body.unitNumber ?? undefined,
      floor: body.floor ?? undefined,
      buildingId: body.buildingId !== undefined ? body.buildingId : undefined,
      unitType: body.unitType ?? undefined,
      bedCapacity: body.bedCapacity ?? undefined,
      rentAmount: body.rentAmount ?? undefined,
      ac: body.ac !== undefined ? body.ac : undefined,
      attachedBathroom: body.attachedBathroom !== undefined ? body.attachedBathroom : undefined,
      status: body.status ?? undefined,
    },
    include: { building: true, beds: true },
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.ROOM_UPDATED,
    entityType: "unit",
    entityId: id,
    oldValue: existing,
    newValue: updated,
  });

  return ok(updated);
});

/**
 * DELETE /api/units/:id
 */
export const DELETE = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const unit = await prisma.unit.findFirst({
    where: { id, societyId },
    include: {
      occupancies: { where: { status: { in: ["ACTIVE", "NOTICE"] } } },
    },
  });
  if (!unit) throw notFound("Room not found");

  if (unit.occupancies.length > 0) {
    throw badRequest("Cannot delete room with active residents. Check them out first.");
  }

  await prisma.unit.delete({ where: { id } });
  return ok({ success: true });
});

