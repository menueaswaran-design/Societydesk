import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { feeConfigCreateSchema } from "@/lib/validation/schemas";
import { serializeFlatTypeAmounts } from "@/lib/billing/calculator";
export const dynamic = "force-dynamic";


/**
 * GET /api/billing/configuration
 * Admin: the full rule set. Resident: the active rules only (so they can
 * understand a charge), with no society internals.
 */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  const societyId = resolveSocietyScope(user, null);
  const isAdmin = user.role === "SOCIETY_ADMIN" || user.role === "SUPER_ADMIN";

  const configs = await prisma.feeConfiguration.findMany({
    where: isAdmin ? { societyId } : { societyId, active: true },
    orderBy: [{ active: "desc" }, { type: "asc" }],
  });

  return ok(
    configs.map((c) => ({
      ...c,
      flatTypeAmounts:
        typeof c.flatTypeAmounts === "string"
          ? JSON.parse(c.flatTypeAmounts || "null")
          : c.flatTypeAmounts,
    }))
  );
});

/** POST /api/billing/configuration */
const POSTImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);

  const body = feeConfigCreateSchema.parse(await readJson(req));

  const config = await prisma.feeConfiguration.create({
    data: {
      societyId,
      name: body.name,
      type: body.type,
      calculationType: body.calculationType,
      amount: body.amount ?? 0,
      rate: body.rate ?? null,
      flatTypeAmounts: serializeFlatTypeAmounts(body.flatTypeAmounts),
      frequency: body.frequency,
      appliesToParkingOnly: body.appliesToParkingOnly,
      active: body.active,
    },
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.FEE_CONFIG_CREATED,
    entityType: "fee_configuration",
    entityId: config.id,
    newValue: {
      name: config.name,
      type: config.type,
      calculationType: config.calculationType,
      amount: config.amount,
      rate: config.rate,
    },
  });

  return ok(config, { status: 201 });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function POST(request, context) {
  return POSTImpl(request, context);
}
