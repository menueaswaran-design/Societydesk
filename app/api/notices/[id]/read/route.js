import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { resolveSocietyScope, isStaff } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { notFound, forbidden } from "@/lib/errors";
export const dynamic = "force-dynamic";


/**
 * POST /api/notices/:id/read  (section 31)
 * Idempotent: reading twice does not create a second record.
 */
const POSTImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;
  const societyId = resolveSocietyScope(user, null);

  const notice = await prisma.notice.findFirst({ where: { id, societyId } });
  if (!notice) throw notFound("Notice");
  if (!isStaff(user) && notice.status !== "PUBLISHED") throw notFound("Notice");

  await prisma.noticeRead.upsert({
    where: { noticeId_userId: { noticeId: id, userId: user.id } },
    update: {},
    create: { societyId, noticeId: id, userId: user.id },
  });

  const [readCount, totalMembers] = await Promise.all([
    prisma.noticeRead.count({ where: { noticeId: id } }),
    prisma.user.count({ where: { societyId, role: "RESIDENT", status: "ACTIVE" } }),
  ]);

  return ok({ noticeId: id, readCount, totalMembers, unread: Math.max(0, totalMembers - readCount) });
});

export async function POST(request, context) {
  return POSTImpl(request, context);
}
