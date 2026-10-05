import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { getAdminDashboard } from "@/lib/queries/dashboard";
export const dynamic = "force-dynamic";


/** GET /api/dashboard/admin */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, req.nextUrl.searchParams.get("societyId"));

  return ok(await getAdminDashboard(societyId));
});

export async function GET(request, context) {
  return GETImpl(request, context);
}
