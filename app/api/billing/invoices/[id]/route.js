import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope, requireFlatAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { notFound, badRequest, forbidden } from "@/lib/errors";
import { outstandingOn } from "@/lib/billing/penalty";
import { invoiceUpdateSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/** GET /api/billing/invoices/:id - invoice with items, payments and receipts. */
const GETImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;
  const societyId = resolveSocietyScope(user, null);

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      flat: {
        include: {
          residents: {
            where: { endDate: null },
            include: { user: { select: { name: true, phone: true, email: true } } },
            orderBy: { isPrimary: "desc" },
          },
        },
      },
      items: true,
      payments: {
        include: { receipts: true, recordedBy: { select: { name: true } } },
        orderBy: { paymentDate: "desc" },
      },
    },
  });

  if (!invoice || invoice.societyId !== societyId) throw notFound("Invoice");

  // Residents only ever see invoices for their own flats (section 8.3).
  if (user.role === "RESIDENT") {
    await requireFlatAccess(user, invoice.flatId, { societyId });
  }

  return ok({ ...invoice, outstanding: outstandingOn(invoice) });
});

/**
 * PATCH /api/billing/invoices/:id
 * Admin corrections: extend the due date, apply a discount, cancel.
 * Financial edits are audited with the reason.
 */
const PATCHImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const body = invoiceUpdateSchema.parse(await readJson(req));

  const existing = await prisma.invoice.findFirst({ where: { id, societyId } });
  if (!existing) throw notFound("Invoice");

  if (existing.paidAmount > 0 && body.discount !== undefined) {
    throw badRequest("Cannot change the discount on a partially paid invoice");
  }

  const discount = body.discount ?? existing.discount;
  const subtotal = existing.subtotal || 0;
  const previousDue = existing.previousDue || 0;
  const penalty = existing.penalty || 0;
  const totalAmount = Math.max(0, subtotal + previousDue + penalty - discount);

  if (totalAmount < existing.paidAmount) {
    throw badRequest(
      `Discount would make the total lower than the ${existing.paidAmount} already paid`
    );
  }

  const status =
    body.status ??
    (totalAmount > 0 && existing.paidAmount >= totalAmount
      ? "PAID"
      : existing.paidAmount > 0
        ? "PARTIALLY_PAID"
        : "PENDING");

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      dueDate: body.dueDate ?? undefined,
      discount,
      totalAmount,
      status,
    },
  });

  await audit({
    societyId,
    userId: user.id,
    action: body.status === "CANCELLED" ? AUDIT.INVOICE_CANCELLED : AUDIT.INVOICE_UPDATED,
    entityType: "invoice",
    entityId: id,
    oldValue: {
      dueDate: existing.dueDate,
      discount: existing.discount,
      totalAmount: existing.totalAmount,
      status: existing.status,
    },
    newValue: { dueDate: invoice.dueDate, discount: invoice.discount, totalAmount: invoice.totalAmount, status: invoice.status },
    reason: body.reason ?? null,
  });

  return ok({ ...invoice, outstanding: outstandingOn(invoice) });
});

/** DELETE /api/billing/invoices/:id - only unpaid invoices may be cancelled. */
const DELETEImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const existing = await prisma.invoice.findFirst({ where: { id, societyId } });
  if (!existing) throw notFound("Invoice");
  if (existing.paidAmount > 0) {
    throw forbidden("Reverse the payment first, then cancel the invoice");
  }

  await prisma.invoice.update({ where: { id }, data: { status: "CANCELLED" } });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.INVOICE_CANCELLED,
    entityType: "invoice",
    entityId: id,
    oldValue: { status: existing.status },
    newValue: { status: "CANCELLED" },
  });

  return ok({ id, status: "CANCELLED" });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function PATCH(request, context) {
  return PATCHImpl(request, context);
}

export async function DELETE(request, context) {
  return DELETEImpl(request, context);
}
