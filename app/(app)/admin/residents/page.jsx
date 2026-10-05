import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import ResidentsClient from "./ResidentsClient";

export const metadata = { title: "Residents - SocietyDesk" };
export const dynamic = "force-dynamic";

export default async function AdminResidentsPage() {
  const user = await getServerSession();
  requirePageRole(user, "SOCIETY_ADMIN");

  const [residents, flats] = await Promise.all([
    prisma.user.findMany({
      where: { societyId: user.societyId, role: "RESIDENT" },
      include: {
        flatResidents: {
          where: { endDate: null },
          include: { flat: { select: { id: true, flatNumber: true, block: true } } },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.flat.findMany({
      where: { societyId: user.societyId },
      select: { id: true, flatNumber: true, block: true },
      orderBy: [{ block: "asc" }, { flatNumber: "asc" }],
    }),
  ]);

  return <ResidentsClient residents={residents} flats={flats} />;
}