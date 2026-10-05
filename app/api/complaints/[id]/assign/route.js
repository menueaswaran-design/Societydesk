import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { notFound, badRequest } from "@/lib/errors";
import { complaintAssignSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/**
 * POST /api/complaints/:id/assign
 * Assigns (or unassigns) a committee member. Assignment moves OPEN -> ASSIGNED
 * and records a timeline entry.
 */
const POSTImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const { assignedToId, comment } = complaintAssignSchema.parse(await readJson(req));

  const existing = await prisma.complaint.findFirst({ where: { id, societyId } });
  if (!existing) throw notFound("Complaint");
  if (["CLOSED"].includes(existing.status)) throw badRequest("Reopen the complaint before assigning");

  let assignee = null;
  if (assignedToId) {
    // The assignee must belong to the same society - never another tenant.
    assignee = await prisma.user.findFirst({
      where: { id: assignedToId, societyId },
      select: { id: true, name: true, role: true },
    });
    if (!assignee) throw notFound("Assignee in this society");
  }

  const status =
    assignedToId && existing.status === "OPEN" ? "ASSIGNED" : existing.status;

  const complaint = await prisma.$transaction(async (tx) => {
    const updated = await tx.complaint.update({
      where: { id },
      data: { assignedToId: assignedToId ?? null, status },
    });

    await tx.complaintComment.create({
      data: {
        societyId,
        complaintId: id,
        userId: user.id,
        comment:
          comment?.trim() ||
          (assignedToId
            ? `Assigned to ${assignee.name}`
            : "Assignment removed"),
        eventType: "ASSIGNMENT",
      },
    });

    return updated;
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.COMPLAINT_ASSIGNED,
    entityType: "complaint",
    entityId: id,
    oldValue: { assignedToId: existing.assignedToId, status: existing.status },
    newValue: { assignedToId: assignedToId ?? null, status },
    reason: comment ?? null,
  });

  return ok(complaint);
});

export async function POST(request, context) {
  return POSTImpl(request, context);
}
