import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import ActivityClient from "./ActivityClient";

export const metadata = { title: "Activity - SocietyDesk" };
export const dynamic = "force-dynamic";

export default async function AdminActivityPage({ searchParams }) {
  const user = await getServerSession();
  requirePageRole(user, "SOCIETY_ADMIN");

  const params = await searchParams;
  const q = typeof params?.q === "string" && params.q ? params.q : null;
  const entityType = typeof params?.entityType === "string" && params.entityType ? params.entityType : null;

  const where = { societyId: user.societyId };
  if (q) where.action = { contains: q };
  if (entityType) where.entityType = entityType;

  const [logs, entityTypes] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.auditLog.findMany({
      where: { societyId: user.societyId },
      distinct: ["entityType"],
      select: { entityType: true },
      orderBy: { entityType: "asc" },
    }),
  ]);

  const rows = logs.map((l) => ({
    ...l,
    oldValue: l.oldValue ? JSON.parse(l.oldValue) : null,
    newValue: l.newValue ? JSON.parse(l.newValue) : null,
  }));

  return (
    <ActivityClient
      logs={rows}
      entityTypes={entityTypes.map((e) => e.entityType)}
      filters={{ q, entityType }}
    />
  );
}