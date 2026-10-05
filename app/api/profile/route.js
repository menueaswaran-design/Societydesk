import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { profileUpdateSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/** PATCH /api/profile - a resident editing their own permitted fields. */
const PATCHImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  const body = profileUpdateSchema.parse(await readJson(req));

  const existing = await prisma.user.findUnique({ where: { id: user.id } });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: body.name, phone: body.phone ?? null },
    select: { id: true, name: true, email: true, phone: true, role: true, societyId: true },
  });

  await audit({
    societyId: user.societyId,
    userId: user.id,
    action: AUDIT.RESIDENT_UPDATED,
    entityType: "user",
    entityId: user.id,
    oldValue: { name: existing?.name, phone: existing?.phone },
    newValue: { name: updated.name, phone: updated.phone },
    reason: "self-service profile update",
  });

  return ok(updated);
});

export async function PATCH(request, context) {
  return PATCHImpl(request, context);
}
