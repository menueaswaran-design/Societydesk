import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/reports/occupancy
 * Real-time occupancy statistics for PG / Hostel.
 */
export const GET = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);

  const [units, beds, occupancies] = await Promise.all([
    prisma.unit.findMany({
      where: { societyId },
      include: {
        building: true,
        beds: true,
      },
      orderBy: { unitNumber: "asc" },
    }),
    prisma.bed.findMany({
      where: { societyId },
      select: { id: true, status: true, rentAmount: true },
    }),
    prisma.occupancy.findMany({
      where: { societyId, status: { in: ["ACTIVE", "NOTICE"] } },
      select: { id: true, status: true, monthlyRent: true },
    }),
  ]);

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === "OCCUPIED").length;
  const vacantBeds = beds.filter((b) => b.status === "VACANT").length;
  const maintenanceBeds = beds.filter((b) => b.status === "MAINTENANCE").length;
  const reservedBeds = beds.filter((b) => b.status === "RESERVED").length;

  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const projectedMonthlyRent = occupancies.reduce((sum, occ) => sum + occ.monthlyRent, 0);

  return ok({
    metrics: {
      totalRooms: units.length,
      totalBeds,
      occupiedBeds,
      vacantBeds,
      maintenanceBeds,
      reservedBeds,
      occupancyRate,
      projectedMonthlyRent,
      activeResidents: occupancies.length,
    },
    rooms: units.map((u) => ({
      id: u.id,
      unitNumber: u.unitNumber,
      unitType: u.unitType,
      floor: u.floor,
      building: u.building?.name || null,
      bedCapacity: u.bedCapacity,
      ac: u.ac,
      rentAmount: u.rentAmount,
      totalBeds: u.beds.length,
      occupiedBeds: u.beds.filter((b) => b.status === "OCCUPIED").length,
      vacantBeds: u.beds.filter((b) => b.status === "VACANT").length,
    })),
  });
});

