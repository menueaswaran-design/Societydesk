import { z } from "zod";
import {
  ROLES,
  FLAT_STATUS,
  RESIDENT_TYPE,
  CALCULATION_TYPE,
  FREQUENCY,
  CHARGE_TYPE,
  INVOICE_STATUS,
  PAYMENT_METHOD,
  COMPLAINT_CATEGORY,
  COMPLAINT_PRIORITY,
  COMPLAINT_STATUS,
  NOTICE_CATEGORY,
  NOTICE_STATUS,
} from "../constants.js";

const trimmed = (max) => z.string().trim().max(max);
const requiredText = (label, max = 200) =>
  trimmed(max).min(1, `${label} is required`);

const oneOf = (mapping, label) =>
  z
    .string()
    .refine((v) => Object.values(mapping).includes(v), {
      message: `${label} must be one of: ${Object.values(mapping).join(", ")}`,
    });

export const idSchema = z.string().trim().min(1, "id is required");

// ---------------------------------------------------------------------------
// Societies (super admin)
// ---------------------------------------------------------------------------
export const societyCreateSchema = z.object({
  name: requiredText("Society name", 120),
  code: trimmed(20)
    .min(2, "Code is required")
    .regex(/^[A-Za-z0-9-]+$/, "Code may only contain letters, numbers and dashes")
    .transform((v) => v.toUpperCase()),
  address: trimmed(240).optional().nullable(),
  city: trimmed(80).optional().nullable(),
  state: trimmed(80).optional().nullable(),
  pincode: trimmed(10).optional().nullable(),
  phone: trimmed(20).optional().nullable(),
  email: z.string().trim().email("Enter a valid email").optional().nullable().or(z.literal("")),
  adminName: trimmed(120).optional().nullable(),
  adminEmail: z.string().trim().email("Enter a valid email").optional().nullable().or(z.literal("")),
});

export const societyUpdateSchema = societyCreateSchema
  .omit({ adminName: true, adminEmail: true })
  .partial()
  .extend({ status: oneOf({ ACTIVE: "ACTIVE", INACTIVE: "INACTIVE" }, "status").optional() });

// ---------------------------------------------------------------------------
// Flats
// ---------------------------------------------------------------------------
export const flatCreateSchema = z.object({
  flatNumber: requiredText("Flat number", 20),
  block: trimmed(20).optional().nullable(),
  floor: trimmed(20).optional().nullable(),
  flatType: trimmed(30).optional().nullable(),
  sqFt: z.coerce.number().int().nonnegative().optional().nullable(),
  parkingSlot: trimmed(30).optional().nullable(),
  status: oneOf(FLAT_STATUS, "status").default("OCCUPIED"),
});

export const flatUpdateSchema = flatCreateSchema.partial();

// ---------------------------------------------------------------------------
// Residents
// ---------------------------------------------------------------------------
export const residentCreateSchema = z.object({
  name: requiredText("Name", 120),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .transform((v) => v.toLowerCase()),
  phone: trimmed(20).optional().nullable(),
  flatId: idSchema,
  residentType: oneOf(RESIDENT_TYPE, "residentType").default("OWNER"),
  isPrimary: z.coerce.boolean().default(false),
  status: oneOf({ ACTIVE: "ACTIVE", INACTIVE: "INACTIVE" }, "status").default("ACTIVE"),
});

export const residentUpdateSchema = residentCreateSchema
  .omit({ email: true })
  .partial()
  .extend({
    email: z.string().trim().email("Enter a valid email").transform((v) => v.toLowerCase()).optional(),
  });

export const residentImportSchema = z.object({
  rows: z
    .array(
      z.object({
        flatNumber: requiredText("Flat number", 20),
        block: trimmed(20).optional().nullable(),
        name: requiredText("Name", 120),
        phone: trimmed(20).optional().nullable(),
        email: z
          .string()
          .trim()
          .email("Enter a valid email")
          .transform((v) => v.toLowerCase()),
        residentType: oneOf(RESIDENT_TYPE, "residentType").default("OWNER"),
      })
    )
    .min(1, "Nothing to import"),
});

// ---------------------------------------------------------------------------
// Fee configuration
// ---------------------------------------------------------------------------
const feeConfigBaseSchema = z.object({
  name: requiredText("Fee name", 120),
  type: oneOf(CHARGE_TYPE, "type").default("MAINTENANCE"),
  calculationType: oneOf(CALCULATION_TYPE, "calculationType").default("FIXED"),
  amount: z.coerce.number().int().nonnegative().default(0),
  rate: z.coerce.number().nonnegative().optional().nullable(),
  flatTypeAmounts: z.record(z.coerce.number().int().nonnegative()).optional().nullable(),
  frequency: oneOf(FREQUENCY, "frequency").default("MONTHLY"),
  appliesToParkingOnly: z.coerce.boolean().default(false),
  active: z.coerce.boolean().default(true),
});

/** A calculation type must be paired with the inputs it actually needs. */
function validateFeeConfig(val, ctx) {
  if (val.calculationType === CALCULATION_TYPE.FIXED && (val.amount ?? 0) <= 0) {
    ctx.addIssue({ code: "custom", path: ["amount"], message: "Amount is required for fixed fees" });
  }
  if (val.calculationType === CALCULATION_TYPE.PER_SQFT) {
    if (!val.rate || val.rate <= 0) {
      ctx.addIssue({ code: "custom", path: ["rate"], message: "Rate is required for per sq.ft fees" });
    }
  }
  if (val.calculationType === CALCULATION_TYPE.FLAT_TYPE) {
    const map = val.flatTypeAmounts || {};
    if (Object.keys(map).length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["flatTypeAmounts"],
        message: "Add at least one amount per flat type",
      });
    }
  }
}

export const feeConfigCreateSchema = feeConfigBaseSchema.superRefine(validateFeeConfig);

// Built from the plain object so .partial() is available - a ZodEffects
// wrapper (from superRefine) does not expose it.
export const feeConfigUpdateSchema = feeConfigBaseSchema
  .partial()
  .superRefine(validateFeeConfig);

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------
const periodSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Billing period must look like 2026-10");

export const generateInvoicesSchema = z.object({
  billingPeriod: periodSchema,
  dueDate: z.coerce.date().optional(),
  previousDue: z.coerce.boolean().default(true),
  penaltyPercent: z.coerce.number().min(0).max(100).default(0),
  applyToFlatIds: z.array(idSchema).optional(),
  skipVacant: z.coerce.boolean().default(true),
});

export const invoiceListSchema = z.object({
  status: oneOf(INVOICE_STATUS, "status").optional(),
  flatId: idSchema.optional(),
  period: periodSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const invoiceUpdateSchema = z.object({
  dueDate: z.coerce.date().optional(),
  discount: z.coerce.number().int().nonnegative().optional(),
  status: oneOf(INVOICE_STATUS, "status").optional(),
  reason: trimmed(240).optional(),
});

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------
export const paymentCreateSchema = z.object({
  invoiceId: idSchema,
  amount: z.coerce.number().int().positive("Amount must be greater than zero"),
  paymentMethod: oneOf(PAYMENT_METHOD, "paymentMethod"),
  transactionReference: trimmed(80).optional().nullable(),
  paymentDate: z.coerce.date().optional(),
  notes: trimmed(240).optional().nullable(),
  proofUrl: z.string().trim().url("Enter a valid URL").optional().nullable().or(z.literal("")),
});

export const paymentUpdateSchema = paymentCreateSchema.omit({ invoiceId: true }).partial().extend({
  reason: trimmed(240).optional(),
});

// ---------------------------------------------------------------------------
// Complaints
// ---------------------------------------------------------------------------
export const complaintCreateSchema = z.object({
  flatId: idSchema.optional(),
  category: oneOf(COMPLAINT_CATEGORY, "category"),
  title: requiredText("Title", 140),
  description: requiredText("Description", 2000),
  priority: oneOf(COMPLAINT_PRIORITY, "priority").default("MEDIUM"),
  attachments: z
    .array(
      z.object({
        fileUrl: z.string().trim().url(),
        fileName: trimmed(160),
        cloudinaryPublicId: trimmed(160).optional().nullable(),
        resourceType: trimmed(30).optional().nullable(),
      })
    )
    .max(5, "Up to 5 attachments")
    .default([]),
});

export const complaintUpdateSchema = complaintCreateSchema
  .omit({ attachments: true })
  .partial()
  .extend({ resolutionNotes: trimmed(1000).optional().nullable() });

export const complaintStatusSchema = z.object({
  status: oneOf(COMPLAINT_STATUS, "status"),
  comment: trimmed(500).optional(),
});

export const complaintAssignSchema = z.object({
  assignedToId: idSchema.nullable(),
  comment: trimmed(500).optional(),
});

export const complaintCommentSchema = z.object({
  comment: requiredText("Comment", 1000),
});

// ---------------------------------------------------------------------------
// Notices
// ---------------------------------------------------------------------------
export const noticeCreateSchema = z.object({
  title: requiredText("Title", 160),
  body: requiredText("Body", 5000),
  category: oneOf(NOTICE_CATEGORY, "category").default("GENERAL"),
  status: oneOf(NOTICE_STATUS, "status").default("DRAFT"),
  attachmentUrl: z.string().trim().url().optional().nullable().or(z.literal("")),
  attachmentPublicId: trimmed(160).optional().nullable(),
  attachmentName: trimmed(160).optional().nullable(),
});

export const noticeUpdateSchema = noticeCreateSchema.partial();

export const profileUpdateSchema = z.object({
  name: requiredText("Name", 120),
  phone: trimmed(20).optional().nullable(),
});

// ---------------------------------------------------------------------------
// Shared query schemas
// ---------------------------------------------------------------------------
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
  q: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

// ---------------------------------------------------------------------------
// Online payments (gateway orders)
// ---------------------------------------------------------------------------
export const paymentOrderCreateSchema = z.object({
  invoiceId: idSchema,
});

export const paymentOrderVerifySchema = z
  .object({
    // Razorpay Checkout handler payload.
    razorpay_order_id: z.string().trim().optional(),
    razorpay_payment_id: z.string().trim().optional(),
    razorpay_signature: z.string().trim().optional(),
    // Simulator payload.
    paymentId: z.string().trim().optional(),
    signature: z.string().trim().optional(),
    transactionReference: z.string().trim().max(120).optional(),
  })
  .refine((v) => Boolean(v.signature && (v.paymentId || v.razorpay_payment_id)), {
    message: "A payment id and signature are required to confirm this payment",
    path: ["signature"],
  });

export const paymentOrderCancelSchema = z.object({
  reason: z.string().trim().max(200).optional(),
});

export { ROLES };