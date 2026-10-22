import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { generateInvoices } from "@/lib/billing/invoice";
import { generateInvoicesSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/invoices/generate
 * Generates monthly rent/maintenance invoices for active occupants in a PG
 * or eligible flats in a society.
 */
export const POST = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);

  const body = generateInvoicesSchema.parse(await readJson(req));

  const result = await generateInvoices({
    societyId,
    userId: user.id,
    billingPeriod: body.billingPeriod,
    dueDate: body.dueDate,
    previousDue: body.previousDue,
    penaltyPercent: body.penaltyPercent,
    applyToFlatIds: body.applyToFlatIds,
    applyToOccupancyIds: body.applyToOccupancyIds,
    electricitySplit: body.electricitySplit,
    skipVacant: body.skipVacant,
  });

  return ok(result, { status: 201 });
});
