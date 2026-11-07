import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { getUserAccessibleSocieties, getPGManagersForSocieties } from "@/lib/db/staffAssignments";
import TeamClient from "@/components/team/TeamClient";

export const metadata = { title: "PG Managers - Bedy" };
export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const user = await getServerSession();
  requirePageRole(user, ["SOCIETY_ADMIN", "OWNER"]);

  const [accessibleSocieties, currentSociety] = await Promise.all([
    getUserAccessibleSocieties(user),
    user.societyId
      ? prisma.society.findUnique({
          where: { id: user.societyId },
          select: { id: true, name: true, code: true, type: true },
        })
      : null,
  ]);

  const isPg = currentSociety?.type !== "SOCIETY" || user.role === "OWNER" || user.role === "MANAGER";

  if (isPg) {
    const societyIds = accessibleSocieties.length
      ? accessibleSocieties.map((s) => s.id)
      : user.societyId
      ? [user.societyId]
      : [];
    const staff = await getPGManagersForSocieties(societyIds);

    return (
      <TeamClient
        mode="pg"
        staff={staff}
        societies={accessibleSocieties}
        userRole={user.role}
        currentSocietyId={user.societyId}
      />
    );
  }

  // Apartment society mode
  const [flats, staff] = await Promise.all([
    prisma.flat.findMany({
      where: { societyId: user.societyId },
      select: { id: true, flatNumber: true, block: true },
      orderBy: [{ block: "asc" }, { flatNumber: "asc" }],
    }),
    prisma.user.findMany({
      where: { societyId: user.societyId, role: "FLAT_ADMIN" },
      include: {
        flatResidents: {
          where: { endDate: null },
          include: { flat: { select: { id: true, flatNumber: true, block: true } } },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return <TeamClient mode="society" flats={flats} staff={staff} societies={accessibleSocieties} />;
}
