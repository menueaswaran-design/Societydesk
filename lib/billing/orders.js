import { prisma } from "../db/prisma.js";
import { badRequest, forbidden, notFound, conflict, unprocessable } from "../errors.js";
import { isStaff, requireFlatAccess } from "../auth/permissions.js";
import { PAYMENT_METHOD } from "../constants.js";
import { recordPayment } from "./invoice.js";
import {
  GATEWAY,
  ORDER_STATUS,
  createGatewayOrder,
  fetchGatewayPayment,
  gatewayInfo,
  publicGatewayError,
  signatureSecretFor,
  mockPaymentId,
  mockSignature,
  verifyPaymentSignature,
  fromPaise,
} from "./gateway.js";

/**
 * Online payment orders (spec section 21/23).
 *
 * Lifecycle:  create -> (resident pays at the gateway) -> verify -> PAID
 *
 * The order row is written BEFORE the resident reaches the gateway so an
 * abandoned checkout still shows up for the admin as a pending payment. It is
 * settled exactly once: Payment.orderId is @unique, so a replayed verify call
 * cannot produce a second payment.
 */

/**
 * Start a payment against an invoice.
 *
 * A resident may only pay an invoice on a flat they occupy. A society admin may
 * start one for any invoice in their own society (this is the "collect payment"
 * / payment-link flow).
 */
export async function createPaymentOrder({ user, invoiceId, societyId }) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, societyId },
    include: { flat: { select: { id: true, flatNumber: true, block: true } } },
  });
  if (!invoice) throw notFound("Invoice");
  if (invoice.status === "CANCELLED") throw unprocessable("This invoice has been cancelled");

  // Residents are pinned to their own flats; staff may act anywhere in society.
  await requireFlatAccess(user, invoice.flatId, { societyId });

  const outstanding = invoice.totalAmount - invoice.paidAmount;
  if (outstanding <= 0) throw conflict("This invoice is already fully paid");

  // Reuse a live order for this invoice rather than piling up duplicates. Not
  // scoped to the same initiator on purpose: an admin who issued a collection
  // link and the resident who later presses "Pay now" must land on the SAME
  // order, otherwise the admin sees two pending links for one invoice. Safe to
  // share because settlement still requires access to the flat.
  const existing = await prisma.paymentOrder.findFirst({
    where: {
      invoiceId: invoice.id,
      status: ORDER_STATUS.CREATED,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return { order: existing, reused: true, checkout: checkoutFor(existing) };
  }

  let created;
  try {
    created = await createGatewayOrder({
      amount: outstanding,
      receiptRef: invoice.invoiceNumber.slice(0, 40),
      notes: {
        societyId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        flatNumber: invoice.flat.flatNumber,
      },
    });
  } catch (err) {
    // Surface a 4xx the UI can show, without leaking gateway internals.
    throw badRequest(publicGatewayError(err));
  }

  const order = await prisma.paymentOrder.create({
    data: {
      societyId,
      invoiceId: invoice.id,
      flatId: invoice.flatId,
      initiatedById: user.id,
      amount: outstanding,
      currency: created.currency,
      gateway: created.gateway,
      status: ORDER_STATUS.CREATED,
      gatewayOrderId: created.gatewayOrderId,
      expiresAt: created.expiresAt,
    },
  });

  return { order, reused: false, checkout: checkoutFor(order, created) };
}

/** What the browser needs to open Razorpay Checkout (or the simulator). */
function checkoutFor(order, created) {
  const info = gatewayInfo();
  const checkout = {
    mode: info.mode,
    isMock: info.isMock,
    keyId: info.keyId,
    orderId: order.gatewayOrderId,
    amount: order.amount,
    currency: order.currency,
    // Razorpay amounts are paise; the UI formats rupees from our own value.
    razorpayAmount: created?.amountPaise ?? Math.round(order.amount * 100),
  };

  // In mock mode the simulator has to present the same signed triple that a real
  // gateway would return, so the /verify path below is genuinely identical.
  // MOCK_SECRET stays on the server; only this order's signature is handed out,
  // and the server re-checks it, so a tampered value is simply rejected.
  if (info.isMock) {
    const paymentId = mockPaymentId(order.gatewayOrderId);
    checkout.mock = {
      paymentId,
      signature: mockSignature(order.gatewayOrderId, paymentId),
    };
  }

  return checkout;
}

/**
 * Settle an order after the gateway says the money arrived.
 *
 * Verification is deliberately two-layered: the signature proves the response
 * came from the gateway, and a server-side fetch proves the capture is real.
 * Only then is a Payment written and a receipt issued.
 */
export async function settlePaymentOrder({ user, orderId, societyId, payload, systemInitiated = false }) {
  const order = await prisma.paymentOrder.findFirst({
    where: { id: orderId, societyId },
    include: {
      invoice: true,
      flat: { select: { id: true, flatNumber: true } },
      initiatedBy: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
  if (!order) throw notFound("Payment order");

  // Whoever can see the invoice may settle its order (resident owner or staff).
  // A gateway webhook has no session, so it settles on the order's behalf; that
  // is safe because the capture is re-checked against the gateway below.
  if (!systemInitiated && !isStaff(user)) {
    const owns = await prisma.flatResident.findFirst({
      where: { userId: user.id, flatId: order.flatId, endDate: null },
    });
    if (!owns && order.initiatedById !== user.id) {
      throw forbidden("You cannot pay for this flat");
    }
  }

  if (order.status === ORDER_STATUS.PAID) {
    // Replay of a callback that already settled. Return the original payment so
    // the caller sees the same receipt instead of minting a second one.
    const existing = await prisma.payment.findUnique({
      where: { orderId: order.id },
      include: { receipts: true, invoice: true },
    });
    return {
      order,
      payment: normalizeSettlement(existing),
      alreadySettled: true,
    };
  }
  if (order.status === ORDER_STATUS.EXPIRED) throw conflict("This payment link has expired");
  if (order.expiresAt && order.expiresAt < new Date()) {
    await prisma.paymentOrder.update({
      where: { id: order.id },
      data: { status: ORDER_STATUS.EXPIRED },
    });
    throw conflict("This payment link has expired");
  }

  const gatewayOrderId = order.gatewayOrderId;
  const paymentId = payload?.paymentId || (order.gateway === GATEWAY.MOCK ? mockPaymentId(gatewayOrderId) : null);
  const signature = payload?.signature;

  // The browser callback must present a valid signature - that is what stops a
  // resident marking their own invoice paid from devtools. A webhook has no
  // browser signature, so it relies on the authoritative capture check instead.
  if (!systemInitiated) {
    const signatureOk = verifyPaymentSignature({
      orderId: gatewayOrderId,
      paymentId,
      signature,
      secret: signatureSecretFor(order.gateway),
    });
    if (!signatureOk) throw badRequest("Payment verification failed. Please retry.");
  }

  // Second layer: ask the gateway whether the payment was actually captured.
  let confirmation;
  try {
    confirmation = await fetchGatewayPayment(order.gateway, order.gatewayOrderId);
  } catch (err) {
    throw unprocessable(publicGatewayError(err));
  }
  if (!confirmation.captured) {
    await prisma.paymentOrder.update({
      where: { id: order.id },
      data: {
        status: ORDER_STATUS.FAILED,
        failureReason: confirmation.reason || confirmation.status || "not_captured",
        gatewayPaymentId: paymentId,
      },
    });
    throw unprocessable("The gateway did not confirm this payment");
  }

  // The captured amount must match what we asked for.
  if (confirmation.amountPaise != null) {
    const expected = Math.round(order.amount * 100);
    if (Number(confirmation.amountPaise) !== expected) {
      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: { status: ORDER_STATUS.FAILED, failureReason: "amount_mismatch", gatewayPaymentId: paymentId },
      });
      throw unprocessable("The captured amount does not match the amount due");
    }
  }

  // A simulated payment is filed as MOCK, never as RAZORPAY: a demo run must not be
  // indistinguishable from a real collection in the books.
  const method =
    order.gateway === GATEWAY.RAZORPAY ? PAYMENT_METHOD.RAZORPAY : PAYMENT_METHOD.MOCK;

  const recorded = await recordPayment({
    societyId: order.societyId,
    userId: user.id,
    invoiceId: order.invoiceId,
    amount: order.amount,
    paymentMethod: method,
    transactionReference:
      payload?.transactionReference || confirmation.gatewayPaymentId || paymentId,
    paymentDate: new Date(),
    notes: `Paid online via ${order.gateway === GATEWAY.RAZORPAY ? "Razorpay" : "demo gateway"}${
      confirmation.method ? ` (${String(confirmation.method).toUpperCase()})` : ""
    }`,
    orderId: order.id,
  });

  const receiptUrl = recorded.receipt?.pdfUrl ?? null;
  const settled = await prisma.paymentOrder.update({
    where: { id: order.id },
    data: {
      status: ORDER_STATUS.PAID,
      gatewayPaymentId: paymentId,
      gatewaySignature: signature,
      gatewayMethod: confirmation.method ?? null,
      paidAt: new Date(),
      receiptUrl,
    },
  });

  return { order: settled, payment: normalizeSettlement(recorded), alreadySettled: false };
}

/**
 * One shape for a settlement, whether it was just recorded or replayed.
 * recordPayment() returns { payment, receipt, invoice } while a replayed order
 * only has the payment row, so normalising here keeps the API contract stable.
 */
function normalizeSettlement(recorded) {
  if (!recorded) return null;
  const payment = recorded.payment ?? recorded;
  const receipt = recorded.receipt ?? payment.receipts?.[0] ?? null;
  const invoice = recorded.invoice ?? payment.invoice ?? null;
  if (!payment?.id) return null;

  return {
    id: payment.id,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    paymentDate: payment.paymentDate?.toISOString?.() ?? payment.paymentDate ?? null,
    transactionReference: payment.transactionReference ?? null,
    receipt: receipt
      ? { id: receipt.id, receiptNumber: receipt.receiptNumber, pdfUrl: receipt.pdfUrl }
      : null,
    invoice: invoice
      ? {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount,
          paidAmount: invoice.paidAmount,
          status: invoice.status,
        }
      : null,
  };
}

/** Mark an order failed (used when the resident dismisses checkout). */
export async function cancelPaymentOrder({ user, orderId, societyId, reason }) {
  const order = await prisma.paymentOrder.findFirst({ where: { id: orderId, societyId } });
  if (!order) throw notFound("Payment order");
  if (order.status !== ORDER_STATUS.CREATED) return order;
  if (!isStaff(user) && order.initiatedById !== user.id) {
    throw forbidden("You cannot change this payment");
  }
  return prisma.paymentOrder.update({
    where: { id: order.id },
    data: { status: ORDER_STATUS.FAILED, failureReason: reason || "cancelled_by_user" },
  });
}

/**
 * Orders to show on the admin payments screen: recent activity plus anything
 * still waiting on a resident.
 */
export async function listPaymentOrders({ societyId, status, limit = 50 }) {
  return prisma.paymentOrder.findMany({
    where: { societyId, ...(status ? { status } : {}) },
    include: {
      flat: { select: { id: true, flatNumber: true, block: true } },
      invoice: { select: { id: true, invoiceNumber: true, billingPeriod: true, totalAmount: true, paidAmount: true, status: true } },
      initiatedBy: { select: { id: true, name: true, email: true } },
      payment: { select: { id: true, amount: true, paymentDate: true, receipts: { select: { id: true, receiptNumber: true, pdfUrl: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(200, limit),
  });
}

export { fromPaise };