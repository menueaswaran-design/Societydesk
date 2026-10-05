import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import SocietiesClient from "./SocietiesClient";

export const metadata = { title: "Societies - SocietyDesk" };
export const dynamic = "force-dynamic";

export default async function SuperAdminSocietiesPage() {
  const user = await getServerSession();
  requirePageRole(user, "SUPER_ADMIN");

  const societies = await prisma.society.findMany({
    include: {
      _count: { select: { flats: true, users: true, invoices: true, complaints: true, notices: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // The editor needs a per-society admin picker when reassigning ownership.
  const admins = await prisma.user.findMany({
    where: { role: "SOCIETY_ADMIN", status: "ACTIVE" },
    select: { id: true, name: true, email: true, societyId: true },
    orderBy: { name: "asc" },
  });

  return <SocietiesClient societies={societies} admins={admins} />;
}