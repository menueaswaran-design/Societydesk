import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { getResidentFlatIds, isFlatAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import ResidentsClient from "./ResidentsClient";

export const metadata = { title: "Residents - SocietyDesk" };
export const dynamic = "force-dynamic";

export default async function AdminResidentsPage() {
  const user = await getServerSession();
  requirePageRole(user, ["SOCIETY_ADMIN", "FLAT_ADMIN"]);

  const flatAdmin = isFlatAdmin(user);
  const managedFlatIds = flatAdmin ? await getResidentFlatIds(user.id) : null;

  const residentWhere = { societyId: user.societyId };
  if (flatAdmin) {
    residentWhere.flatResidents = {
      some: { endDate: null, flatId: { in: managedFlatIds } },
    };
  }

  const flatWhere = { societyId: user.societyId };
  if (flatAdmin) flatWhere.id = { in: managedFlatIds };

  const [residents, flats] = await Promise.all([
    prisma.user.findMany({
      where: residentWhere,
      include: {
        flatResidents: {
          where: { endDate: null },
          include: { flat: { select: { id: true, flatNumber: true, block: true } } },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.flat.findMany({
      where: flatWhere,
      select: { id: true, flatNumber: true, block: true },
      orderBy: [{ block: "asc" }, { flatNumber: "asc" }],
    }),
  ]);

  return <ResidentsClient residents={residents} flats={flats} />;
}
