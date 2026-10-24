import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { generateInvoices } from "@/lib/billing/invoice";
import { notifyInvoiceGenerated } from "@/lib/push/webpush";
import { prisma } from "@/lib/db/prisma";
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

  // Send push notifications to residents for generated invoices
  if (Array.isArray(result.invoices) && result.invoices.length > 0) {
    (async () => {
      for (const inv of result.invoices) {
        let recipientId = null;
        if (inv.occupancyId) {
          const occ = await prisma.occupancy.findUnique({
            where: { id: inv.occupancyId },
            select: { userId: true },
          });
          recipientId = occ?.userId;
        } else if (inv.flatId) {
          const fr = await prisma.flatResident.findFirst({
            where: { flatId: inv.flatId, endDate: null },
            select: { userId: true },
          });
          recipientId = fr?.userId;
        }
        if (recipientId) {
          notifyInvoiceGenerated({
            userId: recipientId,
            invoiceNumber: inv.invoiceNumber,
            amount: inv.totalAmount,
            billingPeriod: inv.billingPeriod,
            dueDate: inv.dueDate,
            invoiceId: inv.id,
          });
        }
      }
    })().catch(() => null);
  }

  return ok(result, { status: 201 });
});
