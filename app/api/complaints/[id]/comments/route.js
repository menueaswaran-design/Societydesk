import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { resolveSocietyScope, requireFlatAccess, isStaff } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { notFound, forbidden, badRequest } from "@/lib/errors";
import { complaintCommentSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/**
 * POST /api/complaints/:id/comments
 * Adds a timeline entry. Residents may comment on their own complaint; admins
 * on any complaint in their society.
 */
const POSTImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;
  const societyId = resolveSocietyScope(user, null);

  const { comment } = complaintCommentSchema.parse(await readJson(req));

  const complaint = await prisma.complaint.findFirst({ where: { id, societyId } });
  if (!complaint) throw notFound("Complaint");

  if (!isStaff(user)) {
    await requireFlatAccess(user, complaint.flatId, { societyId });
    if (complaint.createdById !== user.id) {
      throw forbidden("You can only comment on your own complaint");
    }
  }

  if (["CLOSED"].includes(complaint.status) && !isStaff(user)) {
    throw badRequest("This complaint is closed");
  }

  const row = await prisma.complaintComment.create({
    data: {
      societyId,
      complaintId: id,
      userId: user.id,
      comment,
      eventType: "COMMENT",
    },
    include: { user: { select: { id: true, name: true, role: true } } },
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.COMPLAINT_UPDATED,
    entityType: "complaint_comment",
    entityId: row.id,
    newValue: { comment: comment.slice(0, 120) },
  });

  return ok(row, { status: 201 });
});

export async function POST(request, context) {
  return POSTImpl(request, context);
}
