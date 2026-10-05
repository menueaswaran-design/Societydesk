import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { noticeCreateSchema, paginationSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/**
 * GET /api/notices
 * Residents only ever see PUBLISHED notices; admins see drafts too.
 * Each row carries the reader's read state plus society-wide read counts.
 */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  const sp = req.nextUrl.searchParams;
  const societyId = resolveSocietyScope(user, sp.get("societyId"));
  const { page, pageSize, status, q } = paginationSchema.parse(Object.fromEntries(sp));

  const isAdmin = user.role === "SOCIETY_ADMIN" || user.role === "SUPER_ADMIN";

  const where = { societyId };
  if (isAdmin) {
    if (status) where.status = status;
  } else {
    where.status = "PUBLISHED";
  }
  if (q) where.OR = [{ title: { contains: q } }, { body: { contains: q } }];

  const [total, notices, memberCount] = await Promise.all([
    prisma.notice.count({ where }),
    prisma.notice.findMany({
      where,
      include: {
        postedBy: { select: { id: true, name: true } },
        reads: { select: { userId: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where: { societyId, role: "RESIDENT", status: "ACTIVE" } }),
  ]);

  return ok(
    notices.map((n) => ({
      ...n,
      readByMe: n.reads.some((r) => r.userId === user.id),
      readCount: n.reads.length,
      memberCount,
    })),
    { meta: { total, page, pageSize, pageCount: Math.ceil(total / pageSize) } }
  );
});

/** POST /api/notices - create as DRAFT or publish immediately (section 30). */
const POSTImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);

  const body = noticeCreateSchema.parse(await readJson(req));
  const isPublished = body.status === "PUBLISHED";

  const notice = await prisma.notice.create({
    data: {
      societyId,
      title: body.title,
      body: body.body,
      category: body.category,
      status: body.status,
      postedById: user.id,
      publishedAt: isPublished ? new Date() : null,
      attachmentUrl: body.attachmentUrl || null,
      attachmentPublicId: body.attachmentPublicId ?? null,
      attachmentName: body.attachmentName ?? null,
    },
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.NOTICE_CREATED,
    entityType: "notice",
    entityId: notice.id,
    newValue: { title: notice.title, status: notice.status },
  });

  return ok(notice, { status: 201 });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function POST(request, context) {
  return POSTImpl(request, context);
}
