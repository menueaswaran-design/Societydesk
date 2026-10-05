import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { resolveSocietyScope, isStaff } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { gatewayInfo } from "@/lib/billing/gateway";
import { notFound, forbidden } from "@/lib/errors";
export const dynamic = "force-dynamic";

/**
 * GET /api/payment-orders/:id
 *
 * Lets the browser poll an order it just opened, and lets the admin see the
 * live status of a payment link they handed out.
 */
const GETImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const order = await prisma.paymentOrder.findFirst({
    where: { id, societyId },
    include: {
      flat: { select: { id: true, flatNumber: true, block: true } },
      invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, paidAmount: true, status: true } },
      initiatedBy: { select: { id: true, name: true, email: true } },
      payment: {
        select: {
          id: true,
          amount: true,
          paymentDate: true,
          receipts: { select: { id: true, receiptNumber: true, pdfUrl: true } },
        },
      },
    },
  });

  if (!order) throw notFound("Payment order");

  // Residents only see orders for flats they occupy, or ones they started.
  if (!isStaff(user)) {
    const owns = await prisma.flatResident.findFirst({
      where: { userId: user.id, flatId: order.flatId, endDate: null },
    });
    if (!owns && order.initiatedById !== user.id) {
      throw forbidden("You cannot view this payment");
    }
  }

  return ok({ ...order, gateway: gatewayInfo() });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}