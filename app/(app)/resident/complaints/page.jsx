import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { getResidentFlatIds } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import ResidentComplaintsClient from "./ResidentComplaintsClient";

export const metadata = { title: "My Complaints - SocietyDesk" };
export const dynamic = "force-dynamic";

export default async function ResidentComplaintsPage() {
  const user = await getServerSession();
  requirePageRole(user, "RESIDENT");

  const flatIds = await getResidentFlatIds(user.id);

  const [complaints, flats] = await Promise.all([
    prisma.complaint.findMany({
      // Own flats AND raised by this resident, so they never see a neighbour's.
      where: { societyId: user.societyId, flatId: { in: flatIds }, createdById: user.id },
      include: {
        flat: { select: { id: true, flatNumber: true, block: true } },
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

  return <ResidentComplaintsClient complaints={complaints} flats={flats} />;
}