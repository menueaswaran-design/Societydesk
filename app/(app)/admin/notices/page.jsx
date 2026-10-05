import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import NoticesClient from "./NoticesClient";

export const metadata = { title: "Notices - SocietyDesk" };
export const dynamic = "force-dynamic";

export default async function AdminNoticesPage({ searchParams }) {
  const user = await getServerSession();
  requirePageRole(user, "SOCIETY_ADMIN");

  const params = await searchParams;
  const status = typeof params?.status === "string" && params.status ? params.status : null;

  const where = { societyId: user.societyId };
  if (status) where.status = status;

  const [notices, memberCount] = await Promise.all([
    prisma.notice.findMany({
      where,
      include: {
        postedBy: { select: { id: true, name: true } },
        reads: { select: { userId: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.user.count({ where: { societyId: user.societyId, role: "RESIDENT", status: "ACTIVE" } }),
  ]);

  const rows = notices.map(({ reads, ...n }) => ({
    ...n,
    readCount: reads.length,
    memberCount,
    publishedAt: n.publishedAt?.toISOString() ?? null,
  }));

  return <NoticesClient notices={rows} memberCount={memberCount} filters={{ status }} />;
}