import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { getPlatformDashboard } from "@/lib/queries/dashboard";
export const dynamic = "force-dynamic";


/** GET /api/dashboard/platform */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSuperAdmin(user);

  return ok(await getPlatformDashboard());
});

export async function GET(request, context) {
  return GETImpl(request, context);
}
