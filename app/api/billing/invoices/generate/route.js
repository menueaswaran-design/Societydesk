import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { generateInvoices } from "@/lib/billing/invoice";
import { generateInvoicesSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/**
 * POST /api/billing/invoices/generate
 * Runs the section 19 flow: pick a period, price every eligible flat, carry
 * forward arrears, apply penalty, write invoices + items.
 */
const POSTImpl = handler(async (req) => {
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
    skipVacant: body.skipVacant,
  });

  return ok(result, { status: 201 });
});

export async function POST(request, context) {
  return POSTImpl(request, context);
}
