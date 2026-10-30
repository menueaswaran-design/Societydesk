import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import SocietiesClient from "./SocietiesClient";

export const metadata = { title: "PG Properties - Bedy" };
export const dynamic = "force-dynamic";

export default async function SuperAdminSocietiesPage() {
  const user = await getServerSession();
  requirePageRole(user, "SUPER_ADMIN");

  const societies = await prisma.society.findMany({
    include: {
      users: {
        where: { role: { in: ["OWNER", "MANAGER", "SOCIETY_ADMIN"] } },
        select: { id: true, name: true, email: true, phone: true, role: true },
      },
      _count: {
        select: {
          units: true,
          beds: true,
          occupancies: true,
          users: true,
          invoices: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const admins = await prisma.user.findMany({
    where: { role: { in: ["OWNER", "MANAGER", "SOCIETY_ADMIN"] }, status: "ACTIVE" },
    select: { id: true, name: true, email: true, societyId: true, role: true },
    orderBy: { name: "asc" },
  });

  return <SocietiesClient societies={societies} admins={admins} />;
}