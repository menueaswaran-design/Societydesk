import { handler, ok } from "@/lib/api";
import { createPaymentOrder } from "@/lib/billing/orders";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/public/pay/:id/order
 *
 * Public payment checkout initiation for WhatsApp 1-click rent collection.
 */
export const POST = handler(async (req, { params }) => {
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: {
      OR: [{ id }, { invoiceNumber: id }],
    },
    select: { id: true, societyId: true },
  });

  if (!invoice) throw notFound("Invoice");

  const { order, reused, checkout } = await createPaymentOrder({
    invoiceId: invoice.id,
    societyId: invoice.societyId,
    isPublic: true,
  });

  return ok(
    {
      id: order.id,
      status: order.status,
      amount: order.amount,
      invoiceId: order.invoiceId,
      expiresAt: order.expiresAt,
      reused,
      checkout,
    },
    { status: reused ? 200 : 201 }
  );
});

