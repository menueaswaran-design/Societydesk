import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { resolveSocietyScope } from "@/lib/auth/permissions";
import { applyComplaintStatus } from "@/lib/complaints/workflow";
import { complaintStatusSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/**
 * POST /api/complaints/:id/status
 *
 * Admins drive the workflow (OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED).
 * The resident then confirms the outcome: RESOLVED -> CLOSED ("fixed") or
 * RESOLVED -> REOPENED ("still broken"). Anything else is rejected.
 * See lib/complaints/workflow.js for the transition rules.
 */
const POSTImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;
  const societyId = resolveSocietyScope(user, null);

  const { status, comment } = complaintStatusSchema.parse(await readJson(req));

  const complaint = await applyComplaintStatus({
    user,
    societyId,
    complaintId: id,
    status,
    comment: comment ?? null,
  });

  return ok(complaint);
});

export async function POST(request, context) {
  return POSTImpl(request, context);
}