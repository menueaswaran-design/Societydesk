import { prisma } from "../db/prisma.js";
import { audit, AUDIT } from "../audit.js";
import { badRequest, forbidden, notFound } from "../errors.js";
import { COMPLAINT_TRANSITIONS, COMPLAINT_STATUS } from "../constants.js";
import { requireSocietyAdmin, isResident, isSuperAdmin } from "../auth/permissions.js";

/**
 * Complaint status workflow (spec section 26).
 *
 * Admins drive the work: OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED. The
 * resident then confirms the outcome by closing it ("fixed") or reopening it
 * ("still broken"). Both the generic /status endpoint and /reopen go through
 * applyComplaintStatus so the rules cannot drift apart.
 */

/** Transitions a resident may perform on their own complaint. */
const RESIDENT_TRANSITIONS = [COMPLAINT_STATUS.CLOSED, COMPLAINT_STATUS.REOPENED];

export { RESIDENT_TRANSITIONS };

/**
 * Move a complaint to `status`, recording the change on both the timeline and
 * the audit log.
 *
 * `societyId` is the caller's already-resolved tenant scope, so this can never
 * reach across tenants even if a caller passes the wrong id.
 */
export async function applyComplaintStatus({
  user,
  societyId,
  complaintId,
  status,
  comment = null,
}) {
  const existing = await prisma.complaint.findFirst({
    where: { id: complaintId, societyId },
  });
  if (!existing) throw notFound("Complaint");

  if (isResident(user)) {
    if (existing.createdById !== user.id) {
      throw forbidden("You can only update your own complaint");
    }
    if (!RESIDENT_TRANSITIONS.includes(status)) {
      throw forbidden("Residents can only close or reopen a resolved complaint");
    }
    if (existing.status !== COMPLAINT_STATUS.RESOLVED) {
      throw badRequest("You can only respond once the society marks it resolved");
    }
  } else if (!isSuperAdmin(user)) {
    requireSocietyAdmin(user);
  }

  const allowed = COMPLAINT_TRANSITIONS[existing.status] ?? [];
  if (!allowed.includes(status)) {
    throw badRequest(`Cannot move a complaint from ${existing.status} to ${status}`);
  }

  const now = new Date();
  const data = { status };
  if (status === COMPLAINT_STATUS.RESOLVED) data.resolvedAt = now;
  if (status === COMPLAINT_STATUS.CLOSED) data.closedAt = now;
  if (status === COMPLAINT_STATUS.REOPENED) {
    data.resolvedAt = null;
    data.closedAt = null;
  }

  const complaint = await prisma.$transaction(async (tx) => {
    const updated = await tx.complaint.update({ where: { id: complaintId }, data });
    await tx.complaintComment.create({
      data: {
        societyId,
        complaintId,
        userId: user.id,
        comment: comment?.trim() || `Status changed to ${status}`,
        eventType: "STATUS_CHANGE",
      },
    });
    return updated;
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.COMPLAINT_STATUS_CHANGED,
    entityType: "complaint",
    entityId: complaintId,
    oldValue: { status: existing.status },
    newValue: { status },
    reason: comment ?? null,
  });

  return complaint;
}