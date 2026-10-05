import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { resolveSocietyScope, isStaff, getResidentFlatIds } from "@/lib/auth/permissions";
import { createPaymentOrder, listPaymentOrders } from "@/lib/billing/orders";
import { gatewayInfo } from "@/lib/billing/gateway";
import { paymentOrderCreateSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";

/**
 * GET /api/payment-orders
 *
 * Staff: every order in the society, so an abandoned checkout is visible as a
 * pending payment. Resident: only orders they started on their own flats.
 */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  const sp = req.nextUrl.searchParams;
  const societyId = resolveSocietyScope(user, sp.get("societyId"));

  const orders = await listPaymentOrders({
    societyId,
    status: sp.get("status") || undefined,
    limit: Number(sp.get("limit") || 50),
  });

  // A resident must not see another household's payment attempts.
  if (!isStaff(user)) {
    const flatIds = await getResidentFlatIds(user.id);
    const mine = orders.filter((o) => flatIds.includes(o.flatId) || o.initiatedById === user.id);
    return ok(mine, { meta: { gateway: gatewayInfo() } });
  }

  return ok(orders, { meta: { gateway: gatewayInfo() } });
});

/**
 * POST /api/payment-orders  (section 21)
 *
 * Starts an online payment. Residents pay their own invoice; a society admin can
 * also start one for any invoice in their society (the "collect payment" link).
 * Returns the checkout details the browser needs.
 */
const POSTImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  const societyId = resolveSocietyScope(user, null);

  const body = paymentOrderCreateSchema.parse(await readJson(req));

  const { order, reused, checkout } = await createPaymentOrder({
    user,
    invoiceId: body.invoiceId,
    societyId,
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

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function POST(request, context) {
  return POSTImpl(request, context);
}