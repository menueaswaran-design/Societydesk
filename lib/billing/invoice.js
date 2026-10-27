import { randomUUID } from "node:crypto";
import { prisma } from "../db/prisma.js";
import { audit, AUDIT } from "../audit.js";
import { badRequest, conflict, notFound } from "../errors.js";
import { INVOICE_STATUS, NOTICE_STATUS } from "../constants.js";
import { calculateCharges } from "./calculator.js";
import { calculatePenalty, outstandingOn, startOfDay } from "./penalty.js";
import { receiptDocumentUrl } from "./receipt.js";
import { calculateProratedRent } from "./prorate.js";

/**
 * Sequential per-society/tenant, per-period invoice number.
 * Format: INV-<TENANTCODE>-<YYYY>-<MM>-<0001>
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
 * Invoice status logic: CANCELLED is terminal and always wins.
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

/** Default due date: 10th of the billing month. */
export function defaultDueDate(billingPeriod) {
  const [year, month] = billingPeriod.split("-").map(Number);
  return new Date(year, month - 1, 10, 23, 59, 59);
}

/**
 * Generate invoices for either a PG workspace (per occupancy) or Society workspace (per flat).
 */
export async function generateInvoices({
  societyId,
  userId,
  billingPeriod,
  dueDate,
  previousDue = true,
  penaltyPercent = 0,
  applyToFlatIds = null,
  applyToOccupancyIds = null,
  electricitySplit = 0,
  electricityConfig = null,
  extraCharges = [],
  skipVacant = true,
  now = new Date(),
}) {
  const society = await prisma.society.findUnique({ where: { id: societyId } });
  if (!society) throw notFound("Property / Society not found");

  if (society.type === "PG") {
    return generatePgInvoices({
      society,
      societyId,
      userId,
      billingPeriod,
      dueDate,
      previousDue,
      penaltyPercent,
      applyToOccupancyIds,
      electricitySplit,
      electricityConfig,
      extraCharges,
      now,
    });
  }

  // --- Society workspace flat-based billing ---
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
        where: { societyId, billingPeriod, billableType: "FLAT" },
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

    const { items: baseItems, subtotal: baseSubtotal } = calculateCharges(feeConfigs, flat);
    const items = [...baseItems];

    if (Array.isArray(extraCharges) && extraCharges.length > 0) {
      for (const charge of extraCharges) {
        const amount = Math.round(Number(charge.amount) || 0);
        if (amount <= 0) continue;

        let applies = false;
        if (charge.targetType === "ALL" || !charge.targetType) {
          applies = true;
        } else if (charge.targetType === "FLAT" || charge.targetType === "ROOM") {
          applies =
            (charge.targetId && charge.targetId === flat.id) ||
            (charge.targetId && charge.targetId === flat.flatNumber);
        }

        if (applies) {
          items.push({
            name: charge.name || "Extra Charge",
            type: charge.type || "OTHER",
            amount,
          });
        }
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

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
      billableType: "FLAT",
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

    const invoice = await prisma.$transaction(
      async (tx) => {
        const row = await tx.invoice.create({ data: summary });
        if (items.length) {
          await tx.invoiceItem.createMany({
            data: items.map((it) => ({ invoiceId: row.id, name: it.name, type: it.type, amount: it.amount })),
          });
        }
        return tx.invoice.findUnique({
          where: { id: row.id },
          include: { items: true, flat: true },
        });
      },
      { maxWait: 20000, timeout: 60000 }
    );

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

  // Persist meter readings so next month they automatically prefill for the owner
  if (
    electricityConfig?.mode === "ROOM_WISE" &&
    electricityConfig.saveMeterReadings !== false &&
    Array.isArray(electricityConfig.rooms)
  ) {
    for (const rc of electricityConfig.rooms) {
      const end = rc.meterEnd != null && rc.meterEnd !== "" ? Number(rc.meterEnd) : undefined;
      const units =
        rc.unitsConsumed != null && rc.unitsConsumed !== ""
          ? Number(rc.unitsConsumed)
          : end != null && rc.meterStart != null
          ? end - Number(rc.meterStart)
          : undefined;

      if (end != null || units != null || Number(rc.amount) > 0) {
        await audit({
          societyId,
          userId,
          action: "RECORD_METER",
          entityType: "UNIT_METER",
          entityId: rc.unitId || rc.unitNumber,
          oldValue: rc.meterStart != null ? Number(rc.meterStart) : null,
          newValue: {
            reading: end != null ? end : null,
            unitsUsed: units != null ? units : null,
            ratePerUnit: Number(rc.ratePerUnit) || 10,
            amount: rc.amount ? Number(rc.amount) : null,
            billingPeriod,
          },
          reason: `Meter reading for Room ${rc.unitNumber || ""} (${billingPeriod})`,
        });
      }
    }
  }

  return {
    billingPeriod,
    createdCount: created.length,
    skippedCount: skipped.length,
    totalAmount: created.reduce((sum, i) => sum + i.totalAmount, 0),
    invoices: created,
    skipped,
  };
}

/**
 * PG per-person occupancy billing (spec section 5).
 */
export async function generatePgInvoices({
  society,
  societyId,
  userId,
  billingPeriod,
  dueDate,
  previousDue = true,
  penaltyPercent = 0,
  applyToOccupancyIds = null,
  electricitySplit = 0,
  electricityConfig = null,
  extraCharges = [],
  now = new Date(),
}) {
  const where = {
    societyId,
    status: { in: ["ACTIVE", "NOTICE"] },
  };
  if (applyToOccupancyIds?.length) {
    where.id = { in: applyToOccupancyIds };
  }

  const occupancies = await prisma.occupancy.findMany({
    where,
    include: {
      user: true,
      unit: true,
      bed: true,
      invoices: {
        where: { status: { not: INVOICE_STATUS.CANCELLED }, totalAmount: { gt: 0 } },
        select: { totalAmount: true, paidAmount: true, dueDate: true },
      },
    },
    orderBy: [{ unit: { unitNumber: "asc" } }, { bed: { bedLabel: "asc" } }],
  });

  if (occupancies.length === 0) {
    throw badRequest("No active residents found to invoice");
  }

  const alreadyInvoiced = new Set(
    (
      await prisma.invoice.findMany({
        where: { societyId, billingPeriod, billableType: "OCCUPANCY" },
        select: { occupancyId: true },
      })
    )
      .map((i) => i.occupancyId)
      .filter(Boolean)
  );

  const effectiveDueDate = dueDate ? new Date(dueDate) : defaultDueDate(billingPeriod);
  const created = [];
  const skipped = [];

  // Pre-calculate occupant counts per room so room electricity is split equally
  const occupantsByRoom = new Map();
  for (const occ of occupancies) {
    const rKey = occ.unitId || occ.unit?.unitNumber || "unknown";
    occupantsByRoom.set(rKey, (occupantsByRoom.get(rKey) || 0) + 1);
  }

  for (const occ of occupancies) {
    if (alreadyInvoiced.has(occ.id)) {
      skipped.push({
        occupancyId: occ.id,
        residentName: occ.user.name,
        room: occ.unit.unitNumber,
        reason: "already_invoiced",
      });
      continue;
    }

    // Calculate part-month or full rent
    const rentAmount = calculateProratedRent({
      monthlyRent: occ.monthlyRent,
      billingPeriod,
      joinDate: occ.joinDate,
      leaveDate: occ.leaveDate,
    });

    const items = [
      {
        name: `Room Rent (${occ.unit.unitNumber}${occ.bed ? ` - Bed ${occ.bed.bedLabel}` : ""})`,
        type: "RENT",
        amount: rentAmount,
      },
    ];

    // Flexible Electricity Billing (Common, Room-wise, or Individual)
    if (electricityConfig && electricityConfig.mode && electricityConfig.mode !== "NONE") {
      if (electricityConfig.mode === "COMMON") {
        let share = 0;
        let commonLabel = "Electricity Bill (Common Share)";
        if (Number(electricityConfig.commonPerPerson) > 0) {
          share = Math.round(Number(electricityConfig.commonPerPerson));
          commonLabel = `Electricity (Fixed ₹${share}/resident)`;
        } else if (Number(electricityConfig.commonTotal) > 0 && occupancies.length > 0) {
          share = Math.round(Number(electricityConfig.commonTotal) / occupancies.length);
          commonLabel = occupancies.length > 1
            ? `Electricity (₹${Number(electricityConfig.commonTotal)} split ÷ ${occupancies.length} residents)`
            : "Electricity (Common Split)";
        } else if (Number(electricityConfig.commonUnits) > 0 && occupancies.length > 0) {
          const rate = Number(electricityConfig.commonRatePerUnit) || 10;
          share = Math.round((Number(electricityConfig.commonUnits) * rate) / occupancies.length);
          commonLabel = occupancies.length > 1
            ? `Electricity (${electricityConfig.commonUnits} units @ ₹${rate}/u ÷ ${occupancies.length} residents)`
            : `Electricity (${electricityConfig.commonUnits} units @ ₹${rate}/u)`;
        }
        if (share > 0) {
          items.push({
            name: commonLabel,
            type: "ELECTRICITY",
            amount: share,
          });
        }
      } else if (electricityConfig.mode === "ROOM_WISE" && Array.isArray(electricityConfig.rooms)) {
        const roomConfig = electricityConfig.rooms.find(
          (r) => (r.unitId && r.unitId === occ.unitId) || (r.unitNumber && r.unitNumber === occ.unit?.unitNumber)
        );
        if (roomConfig) {
          const rKey = occ.unitId || occ.unit?.unitNumber || "unknown";
          const occupantsInThisRoom = occupantsByRoom.get(rKey) || 1;
          let roomTotal = 0;
          let label = `Electricity (Room ${occ.unit?.unitNumber || ""})`;

          if (roomConfig.mode === "UNITS" || (roomConfig.unitsConsumed != null && Number(roomConfig.unitsConsumed) > 0)) {
            const units = Number(roomConfig.unitsConsumed) || 0;
            const rate = Number(roomConfig.ratePerUnit) || 10;
            roomTotal = Math.round(units * rate);
            label = occupantsInThisRoom > 1
              ? `Electricity (${units} units @ ₹${rate}/u ÷ ${occupantsInThisRoom} residents)`
              : `Electricity (${units} units @ ₹${rate}/u)`;
          } else if (
            roomConfig.meterEnd != null &&
            roomConfig.meterStart != null &&
            Number(roomConfig.meterEnd) >= Number(roomConfig.meterStart)
          ) {
            const units = Math.max(0, Number(roomConfig.meterEnd) - Number(roomConfig.meterStart));
            const rate = Number(roomConfig.ratePerUnit) || 10;
            roomTotal = Math.round(units * rate);
            label = occupantsInThisRoom > 1
              ? `Electricity (${units} units @ ₹${rate}/u [${roomConfig.meterStart}→${roomConfig.meterEnd}] ÷ ${occupantsInThisRoom} residents)`
              : `Electricity (${units} units @ ₹${rate}/u [${roomConfig.meterStart}→${roomConfig.meterEnd}])`;
          } else if (Number(roomConfig.amount) > 0) {
            roomTotal = Number(roomConfig.amount);
            label = occupantsInThisRoom > 1
              ? `Electricity (Room ${occ.unit?.unitNumber || ""} - ₹${roomTotal} ÷ ${occupantsInThisRoom} residents)`
              : `Electricity (Room ${occ.unit?.unitNumber || ""})`;
          }

          if (roomTotal > 0) {
            const roomShare = Math.round(roomTotal / occupantsInThisRoom);
            if (roomShare > 0) {
              items.push({
                name: label,
                type: "ELECTRICITY",
                amount: roomShare,
              });
            }
          }
        }

        // Common-area electricity share (if configured alongside room sub-meters)
        let commonShare = 0;
        let commonAreaLabel = "Electricity (Common Area Share)";
        if (Number(electricityConfig.commonPerPerson) > 0) {
          commonShare = Math.round(Number(electricityConfig.commonPerPerson));
          commonAreaLabel = `Electricity (Common Area - Fixed ₹${commonShare}/resident)`;
        } else if (Number(electricityConfig.commonTotal) > 0 && occupancies.length > 0) {
          commonShare = Math.round(Number(electricityConfig.commonTotal) / occupancies.length);
          commonAreaLabel = occupancies.length > 1
            ? `Electricity (Common Area - ₹${Number(electricityConfig.commonTotal)} split ÷ ${occupancies.length} residents)`
            : "Electricity (Common Area Share)";
        } else if (Number(electricityConfig.commonUnits) > 0 && occupancies.length > 0) {
          const commonRate = Number(electricityConfig.commonRatePerUnit) || 10;
          commonShare = Math.round((Number(electricityConfig.commonUnits) * commonRate) / occupancies.length);
          commonAreaLabel = occupancies.length > 1
            ? `Electricity (Common Area - ${electricityConfig.commonUnits} units @ ₹${commonRate}/u ÷ ${occupancies.length} residents)`
            : `Electricity (Common Area - ${electricityConfig.commonUnits} units @ ₹${commonRate}/u)`;
        }
        if (commonShare > 0) {
          items.push({
            name: commonAreaLabel,
            type: "ELECTRICITY",
            amount: commonShare,
          });
        }
      } else if (electricityConfig.mode === "INDIVIDUAL" && Array.isArray(electricityConfig.individuals)) {
        const indConfig = electricityConfig.individuals.find((i) => i.occupancyId === occ.id);
        if (indConfig && Number(indConfig.amount) > 0) {
          items.push({
            name: "Electricity Bill (Fixed Resident Charge)",
            type: "ELECTRICITY",
            amount: Math.round(Number(indConfig.amount)),
          });
        }
      }
    } else if (electricitySplit > 0) {
      items.push({
        name: "Electricity & Amenities Share",
        type: "ELECTRICITY",
        amount: electricitySplit,
      });
    }

    // Extra Charges (Food, AC, Laundry, Maintenance, Custom)
    if (Array.isArray(extraCharges) && extraCharges.length > 0) {
      for (const charge of extraCharges) {
        const amount = Math.round(Number(charge.amount) || 0);
        if (amount <= 0) continue;

        let applies = false;
        if (charge.targetType === "ALL" || !charge.targetType) {
          applies = true;
        } else if (charge.targetType === "ROOM") {
          applies =
            (charge.targetId && charge.targetId === occ.unitId) ||
            (charge.targetId && charge.targetId === occ.unit?.unitNumber);
        } else if (charge.targetType === "INDIVIDUAL") {
          applies = charge.targetId && charge.targetId === occ.id;
        }

        if (applies) {
          items.push({
            name: charge.name || "Extra Charge",
            type: charge.type || "OTHER",
            amount,
          });
        }
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

    // Carry forward earlier unpaid balances for this occupant
    let carryForward = 0;
    if (previousDue) {
      for (const inv of occ.invoices) {
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
      occupancyId: occ.id,
      billableType: "OCCUPANCY",
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

    const invoice = await prisma.$transaction(
      async (tx) => {
        const row = await tx.invoice.create({ data: summary });
        if (items.length) {
          await tx.invoiceItem.createMany({
            data: items.map((it) => ({
              invoiceId: row.id,
              name: it.name,
              type: it.type,
              amount: it.amount,
            })),
          });
        }
        return tx.invoice.findUnique({
          where: { id: row.id },
          include: {
            items: true,
            occupancy: { include: { user: true, unit: true, bed: true } },
          },
        });
      },
      { maxWait: 20000, timeout: 60000 }
    );

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

/**
 * Record a payment against an invoice, update balance, and generate a receipt.
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
    include: {
      flat: { select: { id: true, flatNumber: true, block: true } },
      occupancy: { include: { user: true, unit: true, bed: true } },
    },
  });
  if (!invoice) throw notFound("Invoice");
  if (invoice.societyId !== societyId) throw notFound("Invoice in this property");
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

  const result = await prisma.$transaction(
    async (tx) => {
      const payment = await tx.payment.create({
        data: {
          societyId,
          invoiceId: invoice.id,
          flatId: invoice.flatId || null,
          occupancyId: invoice.occupancyId || null,
          amount,
          paymentMethod,
          transactionReference,
          paymentDate,
          notes,
          proofUrl,
          proofPublicId,
          recordedById: userId ?? null,
          orderId: orderId ?? null,
        },
      });

      const receiptNumber = await nextReceiptNumber(society.code, tx);
      const receiptId = `rcpt_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
      const receipt = await tx.receipt.create({
        data: {
          id: receiptId,
          societyId,
          paymentId: payment.id,
          receiptNumber,
          pdfUrl: receiptDocumentUrl(receiptId),
        },
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
    },
    { maxWait: 20000, timeout: 60000 }
  );

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
  if (payment.societyId !== societyId) throw notFound("Payment in this property");

  const invoice = await prisma.invoice.update({
    where: { id: payment.invoiceId },
    data: {
      paidAmount: Math.max(0, (payment.invoice.paidAmount || 0) - payment.amount),
      status: INVOICE_STATUS.PENDING,
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

/** Units or flats with an unpaid invoice past due date (supports both PG and Society). */
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
            include: { user: { select: { name: true, phone: true } } },
            orderBy: { isPrimary: "desc" },
          },
        },
      },
      occupancy: {
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } },
          unit: true,
          bed: true,
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

      let residentName = null;
      let residentPhone = null;
      let unitLabel = "Unit";

      if (inv.occupancy) {
        residentName = inv.occupancy.user?.name ?? null;
        residentPhone = inv.occupancy.user?.phone ?? null;
        unitLabel = `Room ${inv.occupancy.unit?.unitNumber || "-"}${
          inv.occupancy.bed ? ` (${inv.occupancy.bed.bedLabel})` : ""
        }`;
      } else if (inv.flat) {
        const primary = inv.flat.residents?.[0]?.user;
        residentName = primary?.name ?? null;
        residentPhone = primary?.phone ?? null;
        unitLabel = inv.flat.block
          ? `${inv.flat.block}-${inv.flat.flatNumber}`
          : inv.flat.flatNumber;
      }

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        billingPeriod: inv.billingPeriod,
        flatId: inv.flatId,
        occupancyId: inv.occupancyId,
        unitLabel,
        flatNumber: inv.flat?.flatNumber || (inv.occupancy ? inv.occupancy.unit?.unitNumber : "-"),
        block: inv.flat?.block || null,
        residentName,
        phone: residentPhone,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        outstanding,
        dueDate: inv.dueDate,
        daysOverdue,
      };
    })
    .filter(Boolean);
}

/** Notices read tracking helper. */
export async function countUnreadNotices(societyId, userId) {
  const published = await prisma.notice.count({
    where: { societyId, status: NOTICE_STATUS.PUBLISHED },
  });
  if (!userId) return published;
  const read = await prisma.noticeRead.count({ where: { societyId, userId } });
  return Math.max(0, published - read);
}
