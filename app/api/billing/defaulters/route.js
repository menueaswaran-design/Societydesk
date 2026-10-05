import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { listDefaulters } from "@/lib/billing/invoice";
export const dynamic = "force-dynamic";


/**
 * GET /api/billing/defaulters  (section 24)
 * Unpaid invoices past their due date, with days overdue per flat.
 */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, req.nextUrl.searchParams.get("societyId"));

  const defaulters = await listDefaulters(societyId);

  const totalOutstanding = defaulters.reduce((sum, d) => sum + d.outstanding, 0);

  return ok(defaulters, {
    meta: {
      total: defaulters.length,
      totalOutstanding,
      societyId,
    },
  });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}
