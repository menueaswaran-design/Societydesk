import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { notFound } from "@/lib/errors";
import { feeConfigUpdateSchema } from "@/lib/validation/schemas";
import { serializeFlatTypeAmounts } from "@/lib/billing/calculator";
export const dynamic = "force-dynamic";


/** PATCH /api/billing/configuration/:id */
const PATCHImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const body = feeConfigUpdateSchema.parse(await readJson(req));

  const existing = await prisma.feeConfiguration.findFirst({ where: { id, societyId } });
  if (!existing) throw notFound("Fee configuration");

  const config = await prisma.feeConfiguration.update({
    where: { id },
    data: {
      name: body.name ?? undefined,
      type: body.type ?? undefined,
      calculationType: body.calculationType ?? undefined,
      amount: body.amount ?? undefined,
      rate: body.rate ?? undefined,
      flatTypeAmounts:
        body.flatTypeAmounts !== undefined
          ? serializeFlatTypeAmounts(body.flatTypeAmounts)
          : undefined,
      frequency: body.frequency ?? undefined,
      appliesToParkingOnly: body.appliesToParkingOnly ?? undefined,
      active: body.active ?? undefined,
    },
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.FEE_CONFIG_UPDATED,
    entityType: "fee_configuration",
    entityId: id,
    oldValue: { name: existing.name, amount: existing.amount, active: existing.active },
    newValue: { name: config.name, amount: config.amount, active: config.active },
  });

  return ok(config);
});

/** DELETE /api/billing/configuration/:id - deactivate so past invoices stay valid. */
const DELETEImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const existing = await prisma.feeConfiguration.findFirst({ where: { id, societyId } });
  if (!existing) throw notFound("Fee configuration");

  const config = await prisma.feeConfiguration.update({
    where: { id },
    data: { active: false },
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.FEE_CONFIG_UPDATED,
    entityType: "fee_configuration",
    entityId: id,
    oldValue: { active: true },
    newValue: { active: false },
  });

  return ok(config);
});

export async function PATCH(request, context) {
  return PATCHImpl(request, context);
}

export async function DELETE(request, context) {
  return DELETEImpl(request, context);
}
