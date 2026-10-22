import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { unitCreateSchema, paginationSchema } from "@/lib/validation/schemas";
import { audit, AUDIT } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * GET /api/units
 * List all units (rooms) in the PG with their beds and current occupants.
 */
export const GET = handler(async (req) => {
  const user = await getSessionUser(req);
  const sp = req.nextUrl.searchParams;
  const { page, pageSize, q, status } = paginationSchema.parse(Object.fromEntries(sp));
  const societyId = resolveSocietyScope(user, null);

  const buildingId = sp.get("buildingId");
  const unitType = sp.get("unitType");

  const where = { societyId };
  if (status) where.status = status;
  if (buildingId) where.buildingId = buildingId;
  if (unitType) where.unitType = unitType;

  if (q) {
    where.OR = [
      { unitNumber: { contains: q, mode: "insensitive" } },
      { floor: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, units] = await Promise.all([
    prisma.unit.count({ where }),
    prisma.unit.findMany({
      where,
      include: {
        building: true,
        beds: {
          include: {
            occupancies: {
              where: { status: { in: ["ACTIVE", "NOTICE"] } },
              include: {
                user: { select: { id: true, name: true, phone: true, email: true } },
              },
            },
          },
          orderBy: { bedLabel: "asc" },
        },
        _count: { select: { occupancies: true, complaints: true } },
      },
      orderBy: [{ floor: "asc" }, { unitNumber: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return ok(units, {
    meta: { total, page, pageSize, pageCount: Math.ceil(total / pageSize) },
  });
});

/**
 * POST /api/units
 * Create a new room (Unit) and automatically generate its beds.
 */
export const POST = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);

  const body = unitCreateSchema.parse(await readJson(req));

  const capacity = Math.max(1, body.bedCapacity || 1);
  const bedLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

  const unit = await prisma.$transaction(async (tx) => {
    const createdUnit = await tx.unit.create({
      data: {
        societyId,
        buildingId: body.buildingId || null,
        unitNumber: body.unitNumber,
        floor: body.floor || null,
        unitType: body.unitType,
        bedCapacity: capacity,
        rentAmount: body.rentAmount,
        ac: body.ac,
        attachedBathroom: body.attachedBathroom,
        status: body.status,
      },
    });

    // Auto-generate beds for the room
    const bedCreations = [];
    for (let i = 0; i < capacity; i++) {
      const label = bedLetters[i] || `Bed ${i + 1}`;
      bedCreations.push(
        tx.bed.create({
          data: {
            societyId,
            unitId: createdUnit.id,
            bedLabel: label,
            rentAmount: body.rentAmount,
            status: "VACANT",
          },
        })
      );
    }
    await Promise.all(bedCreations);

    return createdUnit;
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.ROOM_CREATED,
    entityType: "unit",
    entityId: unit.id,
    newValue: { unitNumber: unit.unitNumber, capacity },
  });

  return ok(unit, { status: 201 });
});

