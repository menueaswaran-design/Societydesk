import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { getResidentFlatIds } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import ResidentComplaintsClient from "./ResidentComplaintsClient";

export const metadata = { title: "My Complaints - Bedy" };
export const dynamic = "force-dynamic";

export default async function ResidentComplaintsPage() {
  const user = await getServerSession();
  requirePageRole(user, "RESIDENT");

  let flatIds = [];
  try {
    flatIds = await getResidentFlatIds(user.id);
  } catch {
    flatIds = [];
  }

  const occupancies = await prisma.occupancy.findMany({
    where: { userId: user.id, status: { in: ["ACTIVE", "NOTICE"] } },
    include: {
      unit: { select: { id: true, unitNumber: true, building: true } },
      bed: { select: { id: true, bedLabel: true } },
    },
  });

  const unitIds = occupancies.map((o) => o.unitId).filter(Boolean);

  const [complaints, flats] = await Promise.all([
    prisma.complaint.findMany({
      where: {
        societyId: user.societyId,
        createdById: user.id,
      },
      include: {
        flat: { select: { id: true, flatNumber: true, block: true } },
        unit: { select: { id: true, unitNumber: true } },
        assignedTo: { select: { id: true, name: true, phone: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.flat.findMany({
      where: { id: { in: flatIds } },
      select: { id: true, flatNumber: true, block: true },
      orderBy: [{ block: "asc" }, { flatNumber: "asc" }],
    }),
  ]);

  // Form options: list of flats and/or PG rooms
  const rooms = occupancies.map((o) => ({
    id: o.unit.id,
    unitNumber: o.unit.unitNumber,
    bedLabel: o.bed?.bedLabel,
    buildingName: o.unit.building?.name,
    label: `Room ${o.unit.unitNumber} (Bed ${o.bed?.bedLabel || "A"})`,
  }));

  return <ResidentComplaintsClient complaints={complaints} flats={flats} rooms={rooms} />;
}
