import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { getResidentFlatIds } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import ComplaintsClient from "./ComplaintsClient";

export const metadata = { title: "Complaints - SocietyDesk" };
export const dynamic = "force-dynamic";

export default async function AdminComplaintsPage({ searchParams }) {
  const user = await getServerSession();
  requirePageRole(user, ["SOCIETY_ADMIN", "SECURITY_ADMIN", "FLAT_ADMIN"]);

  const params = await searchParams;
  const status = typeof params?.status === "string" && params.status ? params.status : null;

  const isFlatAdmin = user.role === "FLAT_ADMIN";
  const assignedFlatIds = isFlatAdmin ? await getResidentFlatIds(user.id) : null;

  const where = { societyId: user.societyId };
  if (assignedFlatIds?.length) where.flatId = { in: assignedFlatIds };
  if (status) where.status = status;

  const [complaints, assignees, flats] = await Promise.all([
    prisma.complaint.findMany({
      where,
      include: {
        flat: { select: { id: true, flatNumber: true, block: true } },
        createdBy: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.user.findMany({
      where: { societyId: user.societyId, status: "ACTIVE", role: { not: "RESIDENT" } },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.flat.findMany({
      where: { societyId: user.societyId },
      select: { id: true, flatNumber: true, block: true },
      orderBy: [{ block: "asc" }, { flatNumber: "asc" }],
    }),
  ]);

  return <ComplaintsClient complaints={complaints} assignees={assignees} flats={flats} filters={{ status }} />;
}