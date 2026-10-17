import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import TeamClient from "@/components/team/TeamClient";

export const metadata = { title: "Admins - SocietyDesk" };
export const dynamic = "force-dynamic";

export default async function SuperAdminTeamPage() {
  const user = await getServerSession();
  requirePageRole(user, "SUPER_ADMIN");

  const [societies, staff] = await Promise.all([
    prisma.society.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: { in: ["SOCIETY_ADMIN", "SECURITY_ADMIN"] } },
      include: { society: { select: { id: true, name: true, code: true } } },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
  ]);

  return <TeamClient mode="super" societies={societies} staff={staff} />;
}
