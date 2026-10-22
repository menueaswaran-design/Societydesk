import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import TeamClient from "@/components/team/TeamClient";

export const metadata = { title: "Flat admins - Bedy" };
export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const user = await getServerSession();
  requirePageRole(user, "SOCIETY_ADMIN");

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

  return <TeamClient mode="society" flats={flats} staff={staff} />;
}
