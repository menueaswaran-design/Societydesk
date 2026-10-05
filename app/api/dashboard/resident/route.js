import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { resolveSocietyScope } from "@/lib/auth/permissions";
import { getResidentDashboard } from "@/lib/queries/dashboard";
export const dynamic = "force-dynamic";


/** GET /api/dashboard/resident */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  resolveSocietyScope(user, null);

  return ok(await getResidentDashboard(user));
});

export async function GET(request, context) {
  return GETImpl(request, context);
}
