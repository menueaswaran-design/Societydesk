import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope, isStaff } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { notFound, forbidden } from "@/lib/errors";
import { noticeUpdateSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/** GET /api/notices/:id */
const GETImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;
  const societyId = resolveSocietyScope(user, null);

  const notice = await prisma.notice.findUnique({
    where: { id },
    include: {
      postedBy: { select: { id: true, name: true } },
      reads: { select: { userId: true, readAt: true } },
    },
  });

  if (!notice || notice.societyId !== societyId) throw notFound("Notice");
  if (!isStaff(user) && notice.status !== "PUBLISHED") throw notFound("Notice");

  return ok({
    ...notice,
    readByMe: notice.reads.some((r) => r.userId === user.id),
    readCount: notice.reads.length,
  });
});

/** PATCH /api/notices/:id */
const PATCHImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const body = noticeUpdateSchema.parse(await readJson(req));

  const existing = await prisma.notice.findFirst({ where: { id, societyId } });
  if (!existing) throw notFound("Notice");

  const nowPublished = body.status === "PUBLISHED" && existing.status !== "PUBLISHED";

  const notice = await prisma.notice.update({
    where: { id },
    data: {
      title: body.title ?? undefined,
      body: body.body ?? undefined,
      category: body.category ?? undefined,
      status: body.status ?? undefined,
      publishedAt: nowPublished ? new Date() : existing.publishedAt,
      attachmentUrl: body.attachmentUrl !== undefined ? body.attachmentUrl || null : undefined,
    },
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.NOTICE_UPDATED,
    entityType: "notice",
    entityId: id,
    oldValue: { title: existing.title, status: existing.status },
    newValue: { title: notice.title, status: notice.status },
  });

  return ok(notice);
});

/** DELETE /api/notices/:id - drafts are removed, published notices are archived. */
const DELETEImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const existing = await prisma.notice.findFirst({ where: { id, societyId } });
  if (!existing) throw notFound("Notice");

  if (existing.status === "DRAFT") {
    await prisma.notice.delete({ where: { id } });
  } else {
    await prisma.notice.update({ where: { id }, data: { status: "ARCHIVED" } });
  }

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.NOTICE_DELETED,
    entityType: "notice",
    entityId: id,
    oldValue: { title: existing.title, status: existing.status },
    newValue: { status: existing.status === "DRAFT" ? "deleted" : "ARCHIVED" },
  });

  return ok({ id, archived: existing.status !== "DRAFT" });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function PATCH(request, context) {
  return PATCHImpl(request, context);
}

export async function DELETE(request, context) {
  return DELETEImpl(request, context);
}
