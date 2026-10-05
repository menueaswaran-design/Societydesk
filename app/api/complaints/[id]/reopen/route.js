import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { resolveSocietyScope } from "@/lib/auth/permissions";
import { applyComplaintStatus } from "@/lib/complaints/workflow";
import { COMPLAINT_STATUS } from "@/lib/constants";
import { complaintStatusSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/**
 * POST /api/complaints/:id/reopen   (spec section 41)
 *
 * Convenience endpoint for the "issue is still there" branch of section 26.
 * The target status is fixed to REOPENED, so a client cannot smuggle a
 * different transition through this route - it shares every rule and side
 * effect with /status via applyComplaintStatus.
 */
const POSTImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;
  const societyId = resolveSocietyScope(user, null);

  // A comment is optional here; the schema only validates its shape if sent.
  const body = complaintStatusSchema
    .partial()
    .parse(await readJson(req));

  const complaint = await applyComplaintStatus({
    user,
    societyId,
    complaintId: id,
    status: COMPLAINT_STATUS.REOPENED,
    comment: body.comment ?? null,
  });

  return ok(complaint);
});

export async function POST(request, context) {
  return POSTImpl(request, context);
}