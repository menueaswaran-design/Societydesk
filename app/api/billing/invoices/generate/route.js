import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope } from "@/lib/auth/permissions";
import { generateInvoices } from "@/lib/billing/invoice";
import { notifyInvoiceGenerated } from "@/lib/push/webpush";
import { autoSendInvoiceWhatsApp } from "@/lib/billing/meta-whatsapp";
import { prisma } from "@/lib/db/prisma";
import { generateInvoicesSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/invoices/generate
 * Generates monthly rent/maintenance invoices for active occupants in a PG
 * or eligible flats in a society.
 *
 * Automatically dispatches:
 * 1. Web Push Notification to resident devices
 * 2. Meta WhatsApp Cloud API invoice message (respecting ON/OFF setting)
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
    electricityConfig: body.electricityConfig,
    extraCharges: body.extraCharges,
    skipVacant: body.skipVacant,
  });

  // Asynchronously dispatch notifications (Web Push & Meta WhatsApp)
  if (Array.isArray(result.invoices) && result.invoices.length > 0) {
    (async () => {
      const society = await prisma.society.findUnique({
        where: { id: societyId },
        select: { name: true },
      });
      const pgName = society?.name || "Bedy PG";
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bedy.in";

      for (const inv of result.invoices) {
        let recipient = null;
        let roomLabel = "Room";

        if (inv.occupancyId) {
          const occ = await prisma.occupancy.findUnique({
            where: { id: inv.occupancyId },
            include: {
              user: { select: { id: true, name: true, phone: true } },
              unit: { select: { unitNumber: true } },
              bed: { select: { bedLabel: true } },
            },
          });
          recipient = occ?.user;
          roomLabel = `Room ${occ?.unit?.unitNumber || "-"}${occ?.bed ? ` (${occ.bed.bedLabel})` : ""}`;
        } else if (inv.flatId) {
          const fr = await prisma.flatResident.findFirst({
            where: { flatId: inv.flatId, endDate: null },
            include: {
              user: { select: { id: true, name: true, phone: true } },
              flat: { select: { flatNumber: true, block: true } },
            },
          });
          recipient = fr?.user;
          roomLabel = fr?.flat ? `${fr.flat.block ? `${fr.flat.block}-` : ""}${fr.flat.flatNumber}` : "Flat";
        }

        if (recipient?.id) {
          // 1. Dispatch Web Push notification
          notifyInvoiceGenerated({
            userId: recipient.id,
            invoiceNumber: inv.invoiceNumber,
            amount: inv.totalAmount,
            billingPeriod: inv.billingPeriod,
            dueDate: inv.dueDate,
            invoiceId: inv.id,
          }).catch(() => null);

          // 2. Dispatch Meta WhatsApp Cloud API message (respecting ON/OFF toggle)
          if (recipient.phone) {
            autoSendInvoiceWhatsApp({
              invoice: inv,
              residentPhone: recipient.phone,
              residentName: recipient.name,
              roomLabel,
              pgName,
              payUrl: `${baseUrl}/pay/${inv.id}`,
            }).catch((err) => {
              console.warn("[meta-whatsapp] Auto-send skipped/failed for invoice:", inv.id, err?.message);
            });
          }
        }
      }
    })().catch(() => null);
  }

  return ok(result, { status: 201 });
});
