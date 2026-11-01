import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { getAdminBedAvailability } from "@/lib/queries/dashboard";
import { paginationSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

/** GET /api/dashboard/admin/beds?page=1&pageSize=36 */
export const GET = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);

  const sp = req.nextUrl.searchParams;
  const { page, pageSize } = paginationSchema.parse(Object.fromEntries(sp));
  const societyId = resolveSocietyScope(user, sp.get("societyId"));
  const result = await getAdminBedAvailability(societyId, page, pageSize);

  return ok(result, {
    meta: { total: result.total, page, pageSize, pageCount: result.pageCount },
  });
});