import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { buildingCreateSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

/**
 * GET /api/buildings
 * List all buildings/blocks for this PG or society.
 */
export const GET = handler(async (req) => {
  const user = await getSessionUser(req);
  const societyId = resolveSocietyScope(user, null);

  const buildings = await prisma.building.findMany({
    where: { societyId },
    include: {
      _count: { select: { units: true } },
    },
    orderBy: { name: "asc" },
  });

  return ok(buildings);
});

/**
 * POST /api/buildings
 * Create a new building/block.
 */
export const POST = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);

  const body = buildingCreateSchema.parse(await readJson(req));

  const building = await prisma.building.create({
    data: {
      societyId,
      name: body.name,
      floors: body.floors,
    },
  });

  return ok(building, { status: 201 });
});

