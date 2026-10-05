import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import FlatsClient from "./FlatsClient";

export const metadata = { title: "Flats - SocietyDesk" };
export const dynamic = "force-dynamic";

export default async function AdminFlatsPage() {
  const user = await getServerSession();
  requirePageRole(user, "SOCIETY_ADMIN");

  const flats = await prisma.flat.findMany({
    where: { societyId: user.societyId },
    include: {
      residents: {
        where: { endDate: null },
        include: { user: { select: { id: true, name: true, phone: true } } },
        orderBy: { isPrimary: "desc" },
      },
      _count: { select: { invoices: true, complaints: true } },
    },
    orderBy: [{ block: "asc" }, { flatNumber: "asc" }],
  });

  return <FlatsClient flats={flats} />;
}