import { getServerSession } from "@/lib/auth/server";
import { requirePageRole, ADMIN_ROLES } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import RoomsClient from "./RoomsClient";

export const metadata = { title: "Rooms & Beds" };
export const dynamic = "force-dynamic";

export default async function RoomsPage() {
  const user = await getServerSession();
  requirePageRole(user, ADMIN_ROLES);

  const [units, buildings] = await Promise.all([
    prisma.unit.findMany({
      where: { societyId: user.societyId },
      include: {
        building: true,
        beds: {
          include: {
            occupancies: {
              where: { status: { in: ["ACTIVE", "NOTICE"] } },
              include: { user: { select: { id: true, name: true, phone: true, email: true } } },
            },
          },
          orderBy: { bedLabel: "asc" },
        },
      },
      orderBy: [{ floor: "asc" }, { unitNumber: "asc" }],
    }),
    prisma.building.findMany({
      where: { societyId: user.societyId },
      orderBy: { name: "asc" },
    }),
  ]);

  return <RoomsClient initialUnits={units} buildings={buildings} />;
}

