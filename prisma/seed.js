/**
 * Seeds one demo society ("Green Valley Apartments", code GVA) plus a second
 * tenant to prove isolation, three users covering every role, 12 flats, fee
 * configuration, two months of invoices with payments/receipts, complaints and
 * notices.
 *
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import {
  generateInvoices,
  recordPayment,
  deriveInvoiceStatus,
} from "../lib/billing/invoice.js";
import { serializeFlatTypeAmounts } from "../lib/billing/calculator.js";
import { outstandingOn } from "../lib/billing/penalty.js";

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = process.env.DEV_SUPER_ADMIN_EMAIL || "superadmin@societydesk.local";
const ADMIN_EMAIL = process.env.DEV_ADMIN_EMAIL || "admin@greenvalley.local";
const RESIDENT_EMAIL = process.env.DEV_RESIDENT_EMAIL || "ravi@greenvalley.local";

async function wipe() {
  // Order matters: children before parents.
  await prisma.noticeRead.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.complaintComment.deleteMany();
  await prisma.complaintAttachment.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.paymentOrder.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.feeConfiguration.deleteMany();
  await prisma.flatResident.deleteMany();
  await prisma.flat.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.society.deleteMany();
}

function monthKey(offset = 0) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function isoDueDate(period) {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 10, 23, 59, 59);
}

const FLAT_SEED = [
  { flatNumber: "A101", block: "A", floor: "1", flatType: "2 BHK", sqFt: 1050, parkingSlot: "P-101", resident: "Ravi Kumar", email: RESIDENT_EMAIL, phone: "9876543210", residentType: "OWNER" },
  { flatNumber: "A102", block: "A", floor: "1", flatType: "2 BHK", sqFt: 1050, parkingSlot: "P-102", resident: "Kumaraswamy", email: "kumar@greenvalley.local", phone: "9876543211", residentType: "OWNER" },
  { flatNumber: "A103", block: "A", floor: "1", flatType: "1 BHK", sqFt: 720, parkingSlot: null, resident: "Arun Prasad", email: "arun@greenvalley.local", phone: "9876543212", residentType: "TENANT" },
  { flatNumber: "A201", block: "A", floor: "2", flatType: "3 BHK", sqFt: 1420, parkingSlot: "P-201", resident: "Meera Shah", email: "meera@greenvalley.local", phone: "9876543213", residentType: "OWNER" },
  { flatNumber: "A202", block: "A", floor: "2", flatType: "2 BHK", sqFt: 1050, parkingSlot: "P-202", resident: "Suresh Nair", email: "suresh@greenvalley.local", phone: "9876543214", residentType: "OWNER" },
  { flatNumber: "A203", block: "A", floor: "2", flatType: "2 BHK", sqFt: 1000, parkingSlot: null, resident: "Fatima Sheikh", email: "fatima@greenvalley.local", phone: "9876543215", residentType: "TENANT" },
  { flatNumber: "B101", block: "B", floor: "1", flatType: "2 BHK", sqFt: 1100, parkingSlot: "P-301", resident: "Vikram Rao", email: "vikram@greenvalley.local", phone: "9876543216", residentType: "OWNER" },
  { flatNumber: "B102", block: "B", floor: "1", flatType: "1 BHK", sqFt: 700, parkingSlot: null, resident: "Anita Desai", email: "anita@greenvalley.local", phone: "9876543217", residentType: "TENANT" },
  { flatNumber: "B201", block: "B", floor: "2", flatType: "3 BHK", sqFt: 1500, parkingSlot: "P-302", resident: "Harpreet Singh", email: "harpreet@greenvalley.local", phone: "9876543218", residentType: "OWNER" },
  { flatNumber: "B202", block: "B", floor: "2", flatType: "2 BHK", sqFt: 1050, parkingSlot: "P-303", resident: "Priya Menon", email: "priya@greenvalley.local", phone: "9876543219", residentType: "OWNER" },
  { flatNumber: "C101", block: "C", floor: "1", flatType: "1 BHK", sqFt: 650, parkingSlot: null, resident: "Rahul Verma", email: "rahul@greenvalley.local", phone: "9876543220", residentType: "OWNER" },
  { flatNumber: "C102", block: "C", floor: "1", flatType: "STUDIO", sqFt: 480, parkingSlot: null, resident: null, email: null, phone: null, residentType: null },
];

async function main() {
  console.log("> clearing existing data");
  await wipe();

  // ---------------------------------------------------------------- platform
  const superAdmin = await prisma.user.create({
    data: {
      societyId: null,
      authUid: "dev-super-admin",
      name: "Platform Owner",
      email: SUPER_ADMIN_EMAIL,
      phone: "9000000000",
      role: "SUPER_ADMIN",
    },
  });

  // --------------------------------------------------------------- society A
  const gva = await prisma.society.create({
    data: {
      name: "Green Valley Apartments",
      code: "GVA",
      address: "14, Valley Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
      phone: "08041234567",
      email: "office@greenvalley.local",
      status: "ACTIVE",
    },
  });

  const admin = await prisma.user.create({
    data: {
      societyId: gva.id,
      authUid: "dev-society-admin",
      name: "Lakshmi Iyer",
      email: ADMIN_EMAIL,
      phone: "9812345670",
      role: "SOCIETY_ADMIN",
    },
  });

  const treasurer = await prisma.user.create({
    data: {
      societyId: gva.id,
      authUid: "dev-society-treasurer",
      name: "Nagaraj Pillai",
      email: "treasurer@greenvalley.local",
      phone: "9812345671",
      role: "SOCIETY_ADMIN",
    },
  });

  // --------------------------------------------------------------- society B
  // Second tenant, used to prove society_id isolation.
  const other = await prisma.society.create({
    data: {
      name: "Sunrise Heights",
      code: "SHR",
      city: "Chennai",
      state: "Tamil Nadu",
      status: "ACTIVE",
    },
  });

  await prisma.user.create({
    data: {
      societyId: other.id,
      authUid: "dev-other-admin",
      name: "Other Society Admin",
      email: "admin@sunrise.local",
      role: "SOCIETY_ADMIN",
    },
  });

  await prisma.flat.create({
    data: {
      societyId: other.id,
      flatNumber: "X-01",
      block: "X",
      floor: "0",
      flatType: "1 BHK",
      sqFt: 600,
      status: "OCCUPIED",
    },
  });

  // ------------------------------------------------------ flats + residents
  console.log("> creating flats and residents");
  const flatByNumber = new Map();

  for (const f of FLAT_SEED) {
    const flat = await prisma.flat.create({
      data: {
        societyId: gva.id,
        flatNumber: f.flatNumber,
        block: f.block,
        floor: f.floor,
        flatType: f.flatType,
        sqFt: f.sqFt,
        parkingSlot: f.parkingSlot,
        status: f.resident ? "OCCUPIED" : "VACANT",
      },
    });
    flatByNumber.set(f.flatNumber, flat);

    if (!f.resident) continue;

    // Ravi (the login demo resident) is reused across his flat records.
    const user =
      f.email === RESIDENT_EMAIL
        ? await prisma.user.upsert({
            where: { email: RESIDENT_EMAIL },
            update: {},
            create: {
              societyId: gva.id,
              authUid: "dev-resident-ravi",
              name: f.resident,
              email: RESIDENT_EMAIL,
              phone: f.phone,
              role: "RESIDENT",
            },
          })
        : await prisma.user.create({
            data: {
              societyId: gva.id,
              name: f.resident,
              email: f.email,
              phone: f.phone,
              role: "RESIDENT",
              status: "ACTIVE",
            },
          });

    await prisma.flatResident.create({
      data: {
        societyId: gva.id,
        flatId: flat.id,
        userId: user.id,
        residentType: f.residentType,
        isPrimary: true,
      },
    });
  }

  // --------------------------------------------------- fee configuration
  console.log("> creating fee configuration");
  await prisma.feeConfiguration.createMany({
    data: [
      {
        societyId: gva.id,
        name: "Monthly Maintenance",
        type: "MAINTENANCE",
        calculationType: "FIXED",
        amount: 2500,
        frequency: "MONTHLY",
        active: true,
      },
      {
        societyId: gva.id,
        name: "Parking Charges",
        type: "PARKING",
        calculationType: "FIXED",
        amount: 500,
        frequency: "MONTHLY",
        appliesToParkingOnly: true,
        active: true,
      },
      {
        societyId: gva.id,
        name: "Water Charges",
        type: "WATER",
        calculationType: "PER_SQFT",
        rate: 0.2,
        frequency: "MONTHLY",
        active: true,
      },
      {
        societyId: gva.id,
        name: "Sinking Fund",
        type: "SINKING_FUND",
        calculationType: "FIXED",
        amount: 300,
        frequency: "MONTHLY",
        active: true,
      },
      {
        societyId: gva.id,
        name: "Annual Deep Clean (special fund)",
        type: "SPECIAL_FUND",
        calculationType: "FLAT_TYPE",
        flatTypeAmounts: serializeFlatTypeAmounts({
          "1 BHK": 500,
          "2 BHK": 800,
          "3 BHK": 1200,
          STUDIO: 300,
        }),
        frequency: "ONE_TIME",
        active: false, // inactive: excluded from generation until switched on
      },
    ],
  });

  // ------------------------------------------------------------- invoices
  console.log("> generating invoices for the last two months");
  const older = monthKey(-2);
  const recent = monthKey(-1);

  await generateInvoices({
    societyId: gva.id,
    userId: admin.id,
    billingPeriod: older,
    dueDate: isoDueDate(older),
    penaltyPercent: 2,
  });
  await generateInvoices({
    societyId: gva.id,
    userId: admin.id,
    billingPeriod: recent,
    dueDate: isoDueDate(recent),
    penaltyPercent: 2,
  });

  // ------------------------------------------------------------- payments
  console.log("> recording payments");
  const paidMethods = ["UPI", "BANK_TRANSFER", "CASH", "CHEQUE"];
  let payIndex = 0;

  const olderInvoices = await prisma.invoice.findMany({
    where: { societyId: gva.id, billingPeriod: older },
    include: { flat: { select: { flatNumber: true } } },
    orderBy: { invoiceNumber: "asc" },
  });
  const recentInvoices = await prisma.invoice.findMany({
    where: { societyId: gva.id, billingPeriod: recent },
    orderBy: { invoiceNumber: "asc" },
  });

  for (const inv of olderInvoices) {
    // A few flats deliberately left unpaid so the defaulter list has content.
    if (["A103", "C101", "A203"].includes(inv.flat.flatNumber)) continue;
    await recordPayment({
      societyId: gva.id,
      userId: admin.id,
      invoiceId: inv.id,
      amount: inv.totalAmount,
      paymentMethod: paidMethods[payIndex++ % paidMethods.length],
      transactionReference: `TXN${900000 + payIndex}`,
      paymentDate: new Date(inv.dueDate.getTime() - 3 * 86_400_000),
      notes: "Full payment",
    });
  }

  // Last month: mostly paid, a couple partial, a few untouched.
  const partial = new Set([recentInvoices[1]?.id, recentInvoices[4]?.id].filter(Boolean));
  const skip = new Set([recentInvoices[2]?.id].filter(Boolean));

  for (const inv of recentInvoices) {
    if (skip.has(inv.id)) continue;
    if (partial.has(inv.id)) {
      await recordPayment({
        societyId: gva.id,
        userId: treasurer.id,
        invoiceId: inv.id,
        amount: Math.round(inv.totalAmount / 2),
        paymentMethod: "UPI",
        transactionReference: `TXN${950000 + payIndex}`,
        paymentDate: new Date(),
        notes: "Part payment",
      });
      continue;
    }
    await recordPayment({
      societyId: gva.id,
      userId: admin.id,
      invoiceId: inv.id,
      amount: inv.totalAmount,
      paymentMethod: paidMethods[payIndex++ % paidMethods.length],
      transactionReference: `TXN${950000 + payIndex}`,
      paymentDate: new Date(inv.dueDate.getTime() + 86_400_000),
    });
  }

  // Refresh statuses so OVERDUE is applied based on today's date.
  const allInvoices = await prisma.invoice.findMany({ where: { societyId: gva.id } });
  for (const inv of allInvoices) {
    const status = deriveInvoiceStatus(inv);
    if (status !== inv.status) {
      await prisma.invoice.update({ where: { id: inv.id }, data: { status } });
    }
  }

  // -------------------------------------------------- pending online payment
  // One resident who opened a payment window and never finished it, so the
  // "Awaiting online payment" list and the resident's pending row have something
  // real to show. Deliberately mock: no money has moved and none should.
  console.log("> creating a pending online payment");
  const pendingInvoice = allInvoices
    .filter((inv) => inv.status !== "CANCELLED" && outstandingOn(inv) > 0)
    .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))[0];

  if (pendingInvoice) {
    // The initiator must be someone who actually lives on that flat, otherwise
    // the resident view (scoped by flat) would never show it.
    const occupant = await prisma.flatResident.findFirst({
      where: { flatId: pendingInvoice.flatId, endDate: null },
      orderBy: { isPrimary: "desc" },
    });

    if (occupant) {
      await prisma.paymentOrder.create({
        data: {
          societyId: gva.id,
          invoiceId: pendingInvoice.id,
          flatId: pendingInvoice.flatId,
          initiatedById: occupant.userId,
          gateway: "MOCK",
          gatewayOrderId: `order_mock_seed_${pendingInvoice.invoiceNumber}`,
          amount: outstandingOn(pendingInvoice),
          currency: "INR",
          status: "CREATED",
          // Far enough out that the demo never shows a stale link.
          expiresAt: new Date(Date.now() + 7 * 86_400_000),
        },
      });
    }
  }

  // ------------------------------------------------------------ complaints
  console.log("> creating complaints");
  const ravi = await prisma.user.findUnique({ where: { email: RESIDENT_EMAIL } });
  const meera = await prisma.user.findUnique({ where: { email: "meera@greenvalley.local" } });

  const c1 = await prisma.complaint.create({
    data: {
      societyId: gva.id,
      flatId: flatByNumber.get("A101").id,
      createdById: ravi.id,
      category: "PLUMBING",
      title: "Water leakage in kitchen sink",
      description:
        "There is a continuous leak under the kitchen sink for the last four days. Water is pooling on the floor and the cabinet below is swelling.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      assignedToId: admin.id,
      createdAt: new Date(Date.now() - 6 * 86_400_000),
    },
  });
  await prisma.complaintComment.createMany({
    data: [
      {
        societyId: gva.id,
        complaintId: c1.id,
        userId: ravi.id,
        comment: "Complaint raised by Ravi",
        eventType: "COMMENT",
        createdAt: new Date(Date.now() - 6 * 86_400_000),
      },
      {
        societyId: gva.id,
        complaintId: c1.id,
        userId: admin.id,
        comment: "Assigned to plumbing vendor, visit scheduled",
        eventType: "ASSIGNMENT",
        createdAt: new Date(Date.now() - 5 * 86_400_000),
      },
      {
        societyId: gva.id,
        complaintId: c1.id,
        userId: admin.id,
        comment: "Plumber visited the flat, replacing the pipe joint.",
        eventType: "COMMENT",
        createdAt: new Date(Date.now() - 2 * 86_400_000),
      },
    ],
  });

  await prisma.complaint.create({
    data: {
      societyId: gva.id,
      flatId: flatByNumber.get("A201").id,
      createdById: meera.id,
      category: "NOISE",
      title: "Loud music late at night",
      description: "Music from B201 after 11pm every night. Disturbing sleep for families.",
      priority: "MEDIUM",
      status: "OPEN",
    },
  });

  await prisma.complaint.create({
    data: {
      societyId: gva.id,
      flatId: flatByNumber.get("B101").id,
      createdById: (await prisma.user.findUnique({ where: { email: "vikram@greenvalley.local" } })).id,
      category: "ELECTRICAL",
      title: "Street light not working",
      description: "The street light outside block B entrance has been off for a week.",
      priority: "LOW",
      status: "RESOLVED",
      assignedToId: admin.id,
      resolvedAt: new Date(Date.now() - 86_400_000),
    },
  });

  // --------------------------------------------------------------- notices
  console.log("> creating notices");
  await prisma.notice.create({
    data: {
      societyId: gva.id,
      title: "Water Supply Maintenance on Sunday",
      body: "There will be no water supply on Sunday 09:00 to 13:00 for tank cleaning. Please store water in advance.",
      category: "MAINTENANCE",
      status: "PUBLISHED",
      postedById: admin.id,
      publishedAt: new Date(Date.now() - 2 * 86_400_000),
    },
  });
  await prisma.notice.create({
    data: {
      societyId: gva.id,
      title: "Diwali Committee Meeting",
      body: "The Diwali celebration planning meeting is scheduled in the clubhouse. All residents are welcome.",
      category: "MEETING",
      status: "PUBLISHED",
      postedById: treasurer.id,
      publishedAt: new Date(Date.now() - 5 * 86_400_000),
    },
  });
  await prisma.notice.create({
    data: {
      societyId: gva.id,
      title: "Revised Parking Rules (draft)",
      body: "Draft of the revised parking allocation policy, pending committee approval.",
      category: "GENERAL",
      status: "DRAFT",
      postedById: admin.id,
    },
  });

  // Mark one notice as read by the demo resident.
  const firstNotice = await prisma.notice.findFirst({
    where: { societyId: gva.id, status: "PUBLISHED" },
  });
  await prisma.noticeRead.create({
    data: { societyId: gva.id, noticeId: firstNotice.id, userId: ravi.id },
  });

  // ------------------------------------------------------------- audit log
  await prisma.auditLog.createMany({
    data: [
      {
        societyId: gva.id,
        userId: admin.id,
        action: "SOCIETY_UPDATED",
        entityType: "society",
        entityId: gva.id,
        newValue: JSON.stringify({ name: gva.name }),
      },
      {
        societyId: gva.id,
        userId: admin.id,
        action: "FEE_CONFIG_CREATED",
        entityType: "fee_configuration",
        entityId: gva.id,
        newValue: JSON.stringify({ count: 5 }),
      },
    ],
  });

  const counts = {
    societies: await prisma.society.count(),
    flats: await prisma.flat.count(),
    users: await prisma.user.count(),
    invoices: await prisma.invoice.count(),
    payments: await prisma.payment.count(),
    receipts: await prisma.receipt.count(),
    complaints: await prisma.complaint.count(),
    notices: await prisma.notice.count(),
  };

  console.log("\nSeed complete:", counts);
  console.log("\nLog in with (dev bypass):");
  console.log("  SUPER_ADMIN    ", SUPER_ADMIN_EMAIL);
  console.log("  SOCIETY_ADMIN  ", ADMIN_EMAIL);
  console.log("  RESIDENT       ", RESIDENT_EMAIL);
  console.log(`  (other tenant:admin@sunrise.local)`);
  console.log(`\nsuperAdmin.id=${superAdmin.id}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });