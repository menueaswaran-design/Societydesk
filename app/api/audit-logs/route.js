import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { paginationSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/** GET /api/audit-logs - society admins review who changed what. */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const sp = req.nextUrl.searchParams;
  const societyId = resolveSocietyScope(user, sp.get("societyId"));
  const { page, pageSize, q } = paginationSchema.parse(Object.fromEntries(sp));

  const where = { societyId };
  if (q) where.action = { contains: q };
  if (sp.get("entityType")) where.entityType = sp.get("entityType");

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return ok(
    logs.map((l) => ({
      ...l,
      oldValue: l.oldValue ? JSON.parse(l.oldValue) : null,
      newValue: l.newValue ? JSON.parse(l.newValue) : null,
    })),
    { meta: { total, page, pageSize, pageCount: Math.ceil(total / pageSize) } }
  );
});

export async function GET(request, context) {
  return GETImpl(request, context);
}
