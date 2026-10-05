import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import ResidentNoticesClient from "./ResidentNoticesClient";

export const metadata = { title: "Notices - SocietyDesk" };
export const dynamic = "force-dynamic";

export default async function ResidentNoticesPage() {
  const user = await getServerSession();
  requirePageRole(user, "RESIDENT");

  const notices = await prisma.notice.findMany({
    // Residents only ever see PUBLISHED notices (section 30).
    where: { societyId: user.societyId, status: "PUBLISHED" },
    include: { postedBy: { select: { id: true, name: true } } },
    orderBy: { publishedAt: "desc" },
  });

  const rows = notices.map((n) => ({
    ...n,
    publishedAt: n.publishedAt?.toISOString() ?? null,
    readCount: 0,
  }));

  // Read state for the current resident, resolved in one extra query.
  const reads = await prisma.noticeRead.findMany({
    where: { userId: user.id, noticeId: { in: notices.map((n) => n.id) } },
    select: { noticeId: true },
  });
  const readIds = new Set(reads.map((r) => r.noticeId));

  return <ResidentNoticesClient notices={rows} readIds={[...readIds]} />;
}