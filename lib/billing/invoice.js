import { prisma } from "../db/prisma.js";
import { audit, AUDIT } from "../audit.js";
import { badRequest, conflict, notFound } from "../errors.js";
import { INVOICE_STATUS, NOTICE_STATUS } from "../constants.js";
import { calculateCharges } from "./calculator.js";
import { calculatePenalty, outstandingOn, startOfDay } from "./penalty.js";
import { receiptDocumentUrl } from "./receipt.js";

/**
 * Sequential per-society, per-period invoice number.
 * Format: INV-<SOCIETYCODE>-<YYYY>-<MM>-<0001>
 */
export async function nextInvoiceNumber(societyCode, period, client = prisma) {
  const [year, month] = period.split("-");
  const prefix = `INV-${societyCode}-${year}-${month}-`;
  const last = await client.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  const lastSeq = last ? Number(last.invoiceNumber.slice(prefix.length)) || 0 : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;
}

export async function nextReceiptNumber(societyCode, client = prisma) {
  const year = new Date().getFullYear();
  const prefix = `RCP-${societyCode}-${year}-`;
  const last = await client.receipt.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: "desc" },
    select: { receiptNumber: true },
  });
  const lastSeq = last ? Number(last.receiptNumber.slice(prefix.length)) || 0 : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, "0")}`;
}

/**
 * Invoice status logic (spec section 22).
 * CANCELLED is terminal and always wins.
 */
export function deriveInvoiceStatus(invoice, now = new Date()) {
  if (invoice.status === INVOICE_STATUS.CANCELLED) return INVOICE_STATUS.CANCELLED;

  const total = invoice.totalAmount || 0;
  const paid = invoice.paidAmount || 0;

  if (total > 0 && paid >= total) return INVOICE_STATUS.PAID;
  if (paid > 0) return INVOICE_STATUS.PARTIALLY_PAID;
  if (invoice.dueDate && startOfDay(now) > startOfDay(invoice.dueDate)) {
    return INVOICE_STATUS.OVERDUE;
  }
  return INVOICE_STATUS.PENDING;
}

export function recalculateTotals(invoice) {
  const total = Math.max(
    0,
    (invoice.subtotal || 0) +
      (invoice.previousDue || 0) +
      (invoice.penalty || 0) -
      (invoice.discount || 0)
  );
  return {
    totalAmount: total,
    paidAmount: invoice.paidAmount || 0,
  };
}

/**
 * Generate one invoice per eligible flat for a billing period (section 19).
 *
 * Each invoice + its items are written in one transaction, so an invoice never
 * exists without its line items. The batch itself is intentionally resumable:
 * flats that already have an invoice for the period are skipped, so re-running
 * after a crash tops up the missing flats instead of duplicating invoices.
 */
export async function generateInvoices({
  societyId,
  userId,
  billingPeriod,
  dueDate,
  previousDue = true,
  penaltyPercent = 0,
  applyToFlatIds = null,
  skipVacant = true,
  now = new Date(),
}) {
  const society = await prisma.society.findUnique({ where: { id: societyId } });
  if (!society) throw notFound("Society");

  const feeConfigs = await prisma.feeConfiguration.findMany({
    where: { societyId, active: true },
  });
  if (feeConfigs.length === 0) {
    throw badRequest("Configure at least one active fee before generating invoices");
  }

  const where = { societyId };
  if (applyToFlatIds?.length) where.id = { in: applyToFlatIds };
  if (skipVacant) where.status = "OCCUPIED";

  const flats = await prisma.flat.findMany({
    where,
    include: {
      invoices: {
        where: { status: { not: INVOICE_STATUS.CANCELLED }, totalAmount: { gt: 0 } },
        select: { totalAmount: true, paidAmount: true, dueDate: true },
      },
    },
    orderBy: { flatNumber: "asc" },
  });

  if (flats.length === 0) {
    throw badRequest("No eligible flats found to invoice");
  }

  const alreadyInvoiced = new Set(
    (
      await prisma.invoice.findMany({
        where: { societyId, billingPeriod },
        select: { flatId: true },
      })
    ).map((i) => i.flatId)
  );

  const effectiveDueDate = dueDate ? new Date(dueDate) : defaultDueDate(billingPeriod);
  const created = [];
  const skipped = [];

  for (const flat of flats) {
    if (alreadyInvoiced.has(flat.id)) {
      skipped.push({ flatId: flat.id, flatNumber: flat.flatNumber, reason: "already_invoiced" });
      continue;
    }

    const { items, subtotal } = calculateCharges(feeConfigs, flat);

    // Carry forward any earlier unpaid balance for this flat.
    let carryForward = 0;
    if (previousDue) {
      for (const inv of flat.invoices) {
        const open = (inv.totalAmount || 0) - (inv.paidAmount || 0);
        if (open > 0) {
          carryForward += open;
          if (penaltyPercent > 0) {
            carryForward += calculatePenalty({
              totalAmount: inv.totalAmount,
              paidAmount: inv.paidAmount,
              dueDate: inv.dueDate,
              now,
              config: { percent: penaltyPercent },
            });
          }
        }
      }
    }

    const penalty =
      penaltyPercent > 0
        ? calculatePenalty({
            totalAmount: subtotal + carryForward,
            paidAmount: 0,
            dueDate: effectiveDueDate,
            now,
            config: { percent: penaltyPercent },
          })
        : 0;

    const totalAmount = Math.max(0, subtotal + carryForward + penalty);

    const invoiceNumber = await nextInvoiceNumber(society.code, billingPeriod);
    const summary = {
      societyId,
      flatId: flat.id,
      invoiceNumber,
      billingPeriod,
      invoiceDate: now,
      dueDate: effectiveDueDate,
      subtotal,
      previousDue: carryForward,
      penalty,
      discount: 0,
      totalAmount,
      paidAmount: 0,
      status: deriveInvoiceStatus(
        { totalAmount, paidAmount: 0, dueDate: effectiveDueDate },
        now
      ),
      createdById: userId ?? null,
    };

    const invoice = await prisma.$transaction(async (tx) => {
      const row = await tx.invoice.create({
        data: summary,
      });

      if (items.length) {
        await tx.invoiceItem.createMany({
          data: items.map((item) => ({ ...item, invoiceId: row.id })),
        });
      }

      return row;
    });

    created.push(invoice);
  }

  await audit({
    societyId,
    userId,
    action: AUDIT.INVOICE_CREATED,
    entityType: "invoice_batch",
    entityId: `${societyId}:${billingPeriod}`,
    newValue: {
      billingPeriod,
      created: created.length,
      skipped: skipped.length,
      totalAmount: created.reduce((sum, i) => sum + i.totalAmount, 0),
    },
  });

  return {
    billingPeriod,
    createdCount: created.length,
    skippedCount: skipped.length,
    totalAmount: created.reduce((sum, i) => sum + i.totalAmount, 0),
    invoices: created,
    skipped,
  };
}

/** Default due date: 10th of the billing month. */
export function defaultDueDate(billingPeriod) {
  const [year, month] = billingPeriod.split("-").map(Number);
  return new Date(year, month - 1, 10, 23, 59, 59);
}

/**
 * Record a payment against an invoice (section 21), update the invoice balance
 * and status, and generate a receipt. All inside one transaction.
 */
export async function recordPayment({
  societyId,
  userId,
  invoiceId,
  amount,
  paymentMethod,
  transactionReference = null,
  paymentDate = new Date(),
  notes = null,
  proofUrl = null,
  proofPublicId = null,
  orderId = null,
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { flat: { select: { id: true, flatNumber: true, block: true } } },
  });
  if (!invoice) throw notFound("Invoice");
  if (invoice.societyId !== societyId) throw notFound("Invoice in this society");
  if (invoice.status === INVOICE_STATUS.CANCELLED) {
    throw badRequest("Cannot record a payment against a cancelled invoice");
  }

  const outstanding = outstandingOn(invoice);
  if (outstanding <= 0) throw conflict("This invoice is already fully paid");
  if (amount > outstanding) {
    throw badRequest(
      `Payment exceeds the outstanding balance of ₹${outstanding.toLocaleString("en-IN")}`
    );
  }

  const society = await prisma.society.findUnique({
    where: { id: societyId },
    select: { code: true },
  });

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        societyId,
        invoiceId: invoice.id,
        flatId: invoice.flatId,
        amount,
        paymentMethod,
        transactionReference,
        paymentDate,
        notes,
        proofUrl,
        proofPublicId,
        recordedById: userId ?? null,
        // Set only when this payment settled a PaymentOrder. @unique, so a
        // replayed gateway callback cannot mint a second payment.
        orderId: orderId ?? null,
      },
    });

    const receiptNumber = await nextReceiptNumber(society.code, tx);
    const created = await tx.receipt.create({
      data: { societyId, paymentId: payment.id, receiptNumber },
    });

    // The receipt document is rendered on demand from this id, so the row is
    // given its canonical URL immediately (section 23).
    const receipt = await tx.receipt.update({
      where: { id: created.id },
      data: { pdfUrl: receiptDocumentUrl(created.id) },
    });

    const paidAmount = (invoice.paidAmount || 0) + amount;
    const status = deriveInvoiceStatus(
      { ...invoice, paidAmount, totalAmount: invoice.totalAmount },
      new Date()
    );

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: { paidAmount, status },
    });

    return { payment, receipt, invoice: updatedInvoice };
  });

  await audit({
    societyId,
    userId,
    action: AUDIT.PAYMENT_RECORDED,
    entityType: "payment",
    entityId: result.payment.id,
    newValue: {
      invoiceNumber: invoice.invoiceNumber,
      amount,
      paymentMethod,
      transactionReference,
      receiptNumber: result.receipt.receiptNumber,
    },
  });

  return result;
}

/** Reverse the most recent payment on an invoice (admin correction). */
export async function reversePayment({ societyId, userId, paymentId, reason }) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { invoice: true },
  });
  if (!payment) throw notFound("Payment");
  if (payment.societyId !== societyId) throw notFound("Payment in this society");

  const invoice = await prisma.invoice.update({
    where: { id: payment.invoiceId },
    data: {
      paidAmount: Math.max(0, (payment.invoice.paidAmount || 0) - payment.amount),
      status: INVOICE_STATUS.PENDING, // recomputed below
    },
  });

  const status = deriveInvoiceStatus({
    ...invoice,
    paidAmount: Math.max(0, (payment.invoice.paidAmount || 0) - payment.amount),
  });
  const finalInvoice = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status },
  });

  await prisma.payment.delete({ where: { id: payment.id } });

  await audit({
    societyId,
    userId,
    action: AUDIT.PAYMENT_DELETED,
    entityType: "payment",
    entityId: paymentId,
    oldValue: { amount: payment.amount, invoiceNumber: payment.invoice.invoiceNumber },
    reason,
  });

  return finalInvoice;
}

/** Flats with an unpaid invoice past its due date (section 24). */
export async function listDefaulters(societyId, now = new Date()) {
  const invoices = await prisma.invoice.findMany({
    where: {
      societyId,
      status: { in: [INVOICE_STATUS.OVERDUE, INVOICE_STATUS.PENDING, INVOICE_STATUS.PARTIALLY_PAID] },
      dueDate: { lt: startOfDay(now) },
    },
    include: {
      flat: {
        include: {
          residents: {
            where: { endDate: null },
            include: { user: { select: { name: true } } },
            orderBy: { isPrimary: "desc" },
          },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return invoices
    .map((inv) => {
      const outstanding = outstandingOn(inv);
      if (outstanding <= 0) return null;
      const daysOverdue = Math.max(
        0,
        Math.round((startOfDay(now) - startOfDay(inv.dueDate)) / 86_400_000)
      );
      const primary = inv.flat.residents[0]?.user?.name ?? null;
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        billingPeriod: inv.billingPeriod,
        flatId: inv.flatId,
        flatNumber: inv.flat.flatNumber,
        block: inv.flat.block,
        residentName: primary,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        outstanding,
        dueDate: inv.dueDate,
        daysOverdue,
      };
    })
    .filter(Boolean);
}

/** Notices are read-tracked separately; helper for the resident dashboard. */
export async function countUnreadNotices(societyId, userId) {
  const published = await prisma.notice.count({
    where: { societyId, status: NOTICE_STATUS.PUBLISHED },
  });
  if (!userId) return published;
  const read = await prisma.noticeRead.count({ where: { societyId, userId } });
  return Math.max(0, published - read);
}