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
  WORKSPACE_TYPE,
  UNIT_TYPE,
  UNIT_STATUS,
  BED_STATUS,
  OCCUPANCY_STATUS,
  DEPOSIT_STATUS,
  DOCUMENT_TYPE,
  RENT_CYCLE,
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
// Societies / Tenants
// ---------------------------------------------------------------------------
export const societyBaseSchema = z.object({
  name: requiredText("Name", 120),
  code: trimmed(20)
    .min(2, "Code is required")
    .regex(/^[A-Za-z0-9-]+$/, "Code may only contain letters, numbers and dashes")
    .transform((v) => v.toUpperCase()),
  type: oneOf(WORKSPACE_TYPE, "Workspace Type").default("PG"),
  rentCycle: oneOf(RENT_CYCLE, "Rent Cycle").default("CALENDAR"),
  dueDay: z.coerce.number().int().min(1).max(31).default(5),
  lateFee: z.coerce.number().int().nonnegative().default(0),
  address: trimmed(240).optional().nullable(),
  city: trimmed(80).optional().nullable(),
  state: trimmed(80).optional().nullable(),
  pincode: trimmed(10).optional().nullable(),
  phone: trimmed(20).optional().nullable(),
  email: z.string().trim().email("Enter a valid email").optional().nullable().or(z.literal("")),
  adminName: trimmed(120).optional().nullable(),
  adminEmail: z.string().trim().email("Enter a valid email").optional().nullable().or(z.literal("")),
  adminPassword: trimmed(72).optional().nullable(),
  setupType: z.enum(["MULTI_FLAT", "SINGLE_FLAT"]).default("MULTI_FLAT").optional(),
  singleFlatNumber: trimmed(30).optional().nullable(),
});

export const societyCreateSchema = societyBaseSchema.superRefine((body, ctx) => {
  if ((body.adminPassword || "").trim() && body.adminPassword.trim().length < 6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["adminPassword"],
      message: "Password must be at least 6 characters",
    });
  }
  const fields = [
    ["adminName", body.adminName],
    ["adminEmail", body.adminEmail],
    ["adminPassword", body.adminPassword],
  ];
  const filled = fields.filter(([, value]) => (value || "").trim());
  if (filled.length === 0 || filled.length === fields.length) return;
  for (const [key, value] of fields) {
    if (!(value || "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: "Required to create the admin's login",
      });
    }
  }
});

export const societyUpdateSchema = societyBaseSchema
  .omit({ adminName: true, adminEmail: true, adminPassword: true })
  .partial()
  .extend({ status: oneOf({ ACTIVE: "ACTIVE", INACTIVE: "INACTIVE" }, "status").optional() });

// ---------------------------------------------------------------------------
// PG / Hostel: Buildings, Units (Rooms), Beds
// ---------------------------------------------------------------------------

export const buildingCreateSchema = z.object({
  name: requiredText("Building name", 80),
  floors: z.coerce.number().int().min(1).max(100).default(1),
});

export const buildingUpdateSchema = buildingCreateSchema.partial();

export const unitCreateSchema = z.object({
  unitNumber: requiredText("Room number", 20),
  floor: trimmed(20).optional().nullable(),
  buildingId: idSchema.optional().nullable(),
  unitType: oneOf(UNIT_TYPE, "Room type").default("DOUBLE"),
  bedCapacity: z.coerce.number().int().min(1).max(20).default(2),
  rentAmount: z.coerce.number().int().nonnegative().default(0),
  ac: z.coerce.boolean().default(false),
  attachedBathroom: z.coerce.boolean().default(true),
  status: oneOf(UNIT_STATUS, "Status").default("AVAILABLE"),
});

export const unitUpdateSchema = unitCreateSchema.partial();

export const bedCreateSchema = z.object({
  unitId: idSchema,
  bedLabel: requiredText("Bed label", 20),
  rentAmount: z.coerce.number().int().nonnegative().optional().nullable(),
  status: oneOf(BED_STATUS, "Status").default("VACANT"),
});

export const bedUpdateSchema = bedCreateSchema.partial();

// ---------------------------------------------------------------------------
// PG Check-in / Check-out / Occupancy
// ---------------------------------------------------------------------------

export const occupancyCheckInSchema = z.object({
  name: requiredText("Name", 120),
  email: z.string().trim().email("Enter a valid email").transform((v) => v.toLowerCase()),
  phone: trimmed(20).optional().nullable(),
  unitId: idSchema,
  bedId: idSchema.optional().nullable(),
  joinDate: z.coerce.date().default(() => new Date()),
  monthlyRent: z.coerce.number().int().nonnegative(),
  depositAmount: z.coerce.number().int().nonnegative().default(0),
  noticePeriodDays: z.coerce.number().int().min(0).default(30),
  docType: oneOf(DOCUMENT_TYPE, "Document Type").optional().nullable(),
  docUrl: z.string().trim().url().optional().nullable().or(z.literal("")),
  cloudinaryPublicId: trimmed(160).optional().nullable(),
});

export const occupancyCheckOutSchema = z.object({
  leaveDate: z.coerce.date().default(() => new Date()),
  deductions: z
    .array(
      z.object({
        reason: requiredText("Deduction reason", 120),
        amount: z.coerce.number().int().nonnegative(),
      })
    )
    .default([]),
  refundAmount: z.coerce.number().int().nonnegative().optional(),
  notes: trimmed(500).optional().nullable(),
});

// ---------------------------------------------------------------------------
// Deposits
// ---------------------------------------------------------------------------

export const depositDeductionCreateSchema = z.object({
  reason: requiredText("Reason", 140),
  amount: z.coerce.number().int().positive("Deduction amount must be positive"),
});

export const depositRefundCreateSchema = z.object({
  refundAmount: z.coerce.number().int().nonnegative(),
  refundDate: z.coerce.date().default(() => new Date()),
  notes: trimmed(500).optional().nullable(),
});

// ---------------------------------------------------------------------------
// PG Excel Import
// ---------------------------------------------------------------------------

export const pgImportSchema = z.object({
  rows: z
    .array(
      z.object({
        room: requiredText("Room", 20),
        bed: trimmed(20).optional().nullable(),
        name: requiredText("Name", 120),
        phone: trimmed(20).optional().nullable(),
        email: z.string().trim().email("Enter a valid email").transform((v) => v.toLowerCase()),
        joinDate: z.string().trim().optional(),
        monthlyRent: z.coerce.number().int().nonnegative(),
        deposit: z.coerce.number().int().nonnegative().default(0),
      })
    )
    .min(1, "Nothing to import"),
});

// ---------------------------------------------------------------------------
// Flats & Residents (Societies)
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

export const residentCreateSchema = z.object({
  name: requiredText("Name", 120),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .transform((v) => v.toLowerCase()),
  phone: trimmed(20).optional().nullable(),
  flatId: idSchema,
  residentType: oneOf(RESIDENT_TYPE, "residentType").default("TENANT"),
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
export const feeConfigUpdateSchema = feeConfigBaseSchema.partial().superRefine(validateFeeConfig);

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
  applyToOccupancyIds: z.array(idSchema).optional(),
  electricitySplit: z.coerce.number().int().nonnegative().optional(),
  skipVacant: z.coerce.boolean().default(true),
  electricityConfig: z
    .object({
      mode: z.enum(["NONE", "COMMON", "ROOM_WISE", "INDIVIDUAL"]).default("NONE"),
      commonTotal: z.coerce.number().nonnegative().optional(),
      commonPerPerson: z.coerce.number().nonnegative().optional(),
      rooms: z
        .array(
          z.object({
            unitId: z.string().optional(),
            unitNumber: z.string().optional(),
            amount: z.coerce.number().nonnegative().optional(),
            meterStart: z.coerce.number().nonnegative().optional(),
            meterEnd: z.coerce.number().nonnegative().optional(),
            ratePerUnit: z.coerce.number().nonnegative().optional(),
          })
        )
        .optional(),
      individuals: z
        .array(
          z.object({
            occupancyId: z.string(),
            amount: z.coerce.number().nonnegative(),
          })
        )
        .optional(),
    })
    .optional(),
  extraCharges: z
    .array(
      z.object({
        name: z.string().min(1, "Charge name is required"),
        type: z
          .enum([
            "FOOD",
            "MAINTENANCE",
            "LAUNDRY",
            "WATER",
            "ELECTRICITY",
            "OTHER",
          ])
          .default("OTHER"),
        amount: z.coerce.number().nonnegative("Amount must be positive"),
        targetType: z.enum(["ALL", "ROOM", "INDIVIDUAL"]).default("ALL"),
        targetId: z.string().optional().nullable(),
      })
    )
    .optional(),
});

export const invoiceListSchema = z.object({
  status: oneOf(INVOICE_STATUS, "status").optional(),
  flatId: idSchema.optional(),
  occupancyId: idSchema.optional(),
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
  flatId: idSchema.optional().nullable(),
  unitId: idSchema.optional().nullable(),
  bedId: idSchema.optional().nullable(),
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
// Staff / admins
// ---------------------------------------------------------------------------
export const staffCreateSchema = z.object({
  name: requiredText("Name", 120),
  email: z.string().trim().email("Enter a valid email").transform((v) => v.toLowerCase()),
  phone: trimmed(20).optional().nullable(),
  password: trimmed(72).min(6, "Password must be at least 6 characters"),
  role: oneOf(ROLES, "role"),
  societyId: trimmed(64).optional().nullable(),
  flatId: trimmed(64).optional().nullable(),
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
// Online payments
// ---------------------------------------------------------------------------
export const paymentOrderCreateSchema = z.object({
  invoiceId: idSchema,
});

export const paymentOrderVerifySchema = z
  .object({
    razorpay_order_id: z.string().trim().optional(),
    razorpay_payment_id: z.string().trim().optional(),
    razorpay_signature: z.string().trim().optional(),
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
