/**
 * Seeds:
 * 1. PG / Hostel Workspace: "Sri Lakshmi Luxury PG & Coliving" (code: SLLP)
 *    - 1 Building, 10 Rooms, 24 Beds
 *    - Owner, Manager, Resident demo users + other residents
 *    - Active occupancies with Security Deposits, 1 on notice
 *    - Invoices, payments, receipts, complaints, notices
 * 2. Society Workspace: "Green Valley Apartments" (code: GVA)
 *    - Multi-workspace proof (SOCIETY type preserved)
 *    - Society Admin, Committee, Resident users, flats, fee config
 * 3. Platform Super Admin
 *
 * Run: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import {
  generateInvoices,
  recordPayment,
} from "../lib/billing/invoice.js";
import { serializeFlatTypeAmounts } from "../lib/billing/calculator.js";

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = process.env.DEV_SUPER_ADMIN_EMAIL || "superadmin@societydesk.local";

// PG Demo Logins
const PG_OWNER_EMAIL = "owner@srilakshmipg.local";
const PG_MANAGER_EMAIL = "manager@srilakshmipg.local";
const PG_RESIDENT_EMAIL = "resident@srilakshmipg.local";

// Society Demo Logins
const SOC_ADMIN_EMAIL = "admin@greenvalley.local";
const SOC_RESIDENT_EMAIL = "ravi@greenvalley.local";

async function wipe() {
  console.log("> wiping database tables in safe order");
  await prisma.auditLog.deleteMany();
  await prisma.tenantDocument.deleteMany();
  await prisma.depositDeduction.deleteMany();
  await prisma.deposit.deleteMany();
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
  await prisma.occupancy.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.building.deleteMany();
  await prisma.feeConfiguration.deleteMany();
  await prisma.flatResident.deleteMany();
  await prisma.flat.deleteMany();
  await prisma.user.deleteMany();
  await prisma.society.deleteMany();
}

function monthKey(offset = 0) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function main() {
  await wipe();

  // ---------------------------------------------------------------- Platform Owner
  console.log("> seeding super admin");
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

  // ==============================================================================
  // 1. PRIMARY WORKSPACE: Sri Lakshmi Luxury PG & Coliving (PG)
  // ==============================================================================
  console.log("> seeding PG workspace: Sri Lakshmi Luxury PG & Coliving");
  const pg = await prisma.society.create({
    data: {
      name: "Sri Lakshmi Luxury PG & Coliving",
      code: "SLLP",
      type: "PG",
      rentCycle: "CALENDAR_MONTH",
      dueDay: 5,
      lateFee: 250,
      address: "12, 1st Cross, Near Tech Park, BTM 2nd Stage",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560076",
      phone: "9845012345",
      email: "contact@srilakshmipg.local",
      status: "ACTIVE",
    },
  });

  // PG Building
  const pgBuilding = await prisma.building.create({
    data: {
      societyId: pg.id,
      name: "Main Tower",
      floors: 3,
    },
  });

  // PG Staff Users
  const pgOwner = await prisma.user.create({
    data: {
      societyId: pg.id,
      authUid: "dev-pg-owner",
      name: "Suresh Reddy",
      email: PG_OWNER_EMAIL,
      phone: "9845012345",
      role: "OWNER",
    },
  });

  const pgManager = await prisma.user.create({
    data: {
      societyId: pg.id,
      authUid: "dev-pg-manager",
      name: "Venkatesh Babu",
      email: PG_MANAGER_EMAIL,
      phone: "9845012346",
      role: "MANAGER",
    },
  });

  // PG Demo Resident (Karthik Raja)
  const demoPgResident = await prisma.user.create({
    data: {
      societyId: pg.id,
      authUid: "dev-pg-resident",
      name: "Karthik Raja",
      email: PG_RESIDENT_EMAIL,
      phone: "9845012347",
      role: "RESIDENT",
    },
  });

  // Additional PG Occupants
  const residentNames = [
    { name: "Arun Kumar", email: "arun.k@gmail.com", phone: "9845011001" },
    { name: "Deepak Sharma", email: "deepak.s@gmail.com", phone: "9845011002" },
    { name: "Rohan Mehta", email: "rohan.m@gmail.com", phone: "9845011003" },
    { name: "Manoj Verma", email: "manoj.v@gmail.com", phone: "9845011004" },
    { name: "Ankit Tiwari", email: "ankit.t@gmail.com", phone: "9845011005" },
    { name: "Siddharth Jain", email: "sid.j@gmail.com", phone: "9845011006" },
    { name: "Pradeep Chandran", email: "pradeep.c@gmail.com", phone: "9845011007" },
    { name: "Naveen Reddy", email: "naveen.r@gmail.com", phone: "9845011008" },
    { name: "Sanjay Patel", email: "sanjay.p@gmail.com", phone: "9845011009" },
    { name: "Girish Gowda", email: "girish.g@gmail.com", phone: "9845011010" },
    { name: "Abhishek Joshi", email: "abhi.j@gmail.com", phone: "9845011011" },
    { name: "Tarun Gupta", email: "tarun.g@gmail.com", phone: "9845011012" },
    { name: "Vikrant Deshmukh", email: "vikrant.d@gmail.com", phone: "9845011013" },
    { name: "Harish Pillai", email: "harish.p@gmail.com", phone: "9845011014" },
  ];

  const pgResidents = [demoPgResident];
  for (const r of residentNames) {
    const u = await prisma.user.create({
      data: {
        societyId: pg.id,
        authUid: `dev-user-${r.phone}`,
        name: r.name,
        email: r.email,
        phone: r.phone,
        role: "RESIDENT",
      },
    });
    pgResidents.push(u);
  }

  // PG Rooms Definition (10 Rooms, 24 Beds total)
  const roomDefinitions = [
    { unitNumber: "101", floor: 1, unitType: "SINGLE", bedCapacity: 1, rent: 12000, ac: false },
    { unitNumber: "102", floor: 1, unitType: "DOUBLE", bedCapacity: 2, rent: 9500, ac: true },
    { unitNumber: "103", floor: 1, unitType: "DOUBLE", bedCapacity: 2, rent: 7500, ac: false },
    { unitNumber: "104", floor: 1, unitType: "TRIPLE", bedCapacity: 3, rent: 6500, ac: false },
    { unitNumber: "201", floor: 2, unitType: "SINGLE", bedCapacity: 1, rent: 14000, ac: true },
    { unitNumber: "202", floor: 2, unitType: "DOUBLE", bedCapacity: 2, rent: 9500, ac: true },
    { unitNumber: "203", floor: 2, unitType: "TRIPLE", bedCapacity: 3, rent: 8000, ac: true },
    { unitNumber: "204", floor: 2, unitType: "DOUBLE", bedCapacity: 2, rent: 7500, ac: false },
    { unitNumber: "301", floor: 3, unitType: "TRIPLE", bedCapacity: 3, rent: 8000, ac: true },
    { unitNumber: "302", floor: 3, unitType: "DORM", bedCapacity: 5, rent: 5500, ac: false },
  ];

  const createdUnits = [];
  const createdBeds = [];

  for (const r of roomDefinitions) {
    const unit = await prisma.unit.create({
      data: {
        societyId: pg.id,
        buildingId: pgBuilding.id,
        unitNumber: r.unitNumber,
        floor: String(r.floor),
        unitType: r.unitType,
        bedCapacity: r.bedCapacity,
        rentAmount: r.rent,
        ac: r.ac,
        attachedBathroom: true,
        status: "AVAILABLE",
      },
    });
    createdUnits.push(unit);

    // Create beds A, B, C...
    for (let b = 0; b < r.bedCapacity; b++) {
      const bedLabel = String.fromCharCode(65 + b);
      const bed = await prisma.bed.create({
        data: {
          societyId: pg.id,
          unitId: unit.id,
          bedLabel,
          rentAmount: r.rent,
          status: "VACANT",
        },
      });
      createdBeds.push(bed);
    }
  }

  console.log(`> created ${createdUnits.length} rooms and ${createdBeds.length} beds`);

  // Assign occupants to beds
  // Karthik Raja gets Room 201 Bed A (Single AC)
  const room201Bed = createdBeds.find((b) => b.unitId === createdUnits[4].id);
  const now = new Date();
  const joinDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  const occupancies = [];

  // Occupancy 0: Karthik Raja
  const karthikOcc = await prisma.occupancy.create({
    data: {
      societyId: pg.id,
      userId: demoPgResident.id,
      unitId: createdUnits[4].id,
      bedId: room201Bed.id,
      joinDate,
      monthlyRent: 14000,
      depositAmount: 15000,
      noticePeriodDays: 30,
      status: "ACTIVE",
    },
  });
  await prisma.bed.update({ where: { id: room201Bed.id }, data: { status: "OCCUPIED" } });
  occupancies.push(karthikOcc);

  await prisma.deposit.create({
    data: {
      societyId: pg.id,
      occupancyId: karthikOcc.id,
      amountReceived: 15000,
      receivedDate: joinDate,
      status: "HELD",
      notes: "Received via UPI during check-in",
    },
  });

  // Assign remaining active occupants up to 14 beds
  const bedsToOccupy = createdBeds.filter((b) => b.id !== room201Bed.id).slice(0, 14);

  for (let i = 0; i < bedsToOccupy.length; i++) {
    const bed = bedsToOccupy[i];
    const user = pgResidents[i + 1];
    const isOnNotice = i === 1; // Deepak Sharma is on notice
    const occStatus = isOnNotice ? "NOTICE" : "ACTIVE";
    const leaveDate = isOnNotice ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10) : null;
    const occJoinDate = new Date(now.getFullYear(), now.getMonth() - (i % 3 + 1), 5);

    const occ = await prisma.occupancy.create({
      data: {
        societyId: pg.id,
        userId: user.id,
        unitId: bed.unitId,
        bedId: bed.id,
        joinDate: occJoinDate,
        leaveDate,
        monthlyRent: bed.rentAmount || 8000,
        depositAmount: 10000,
        noticePeriodDays: 30,
        status: occStatus,
      },
    });
    occupancies.push(occ);

    await prisma.bed.update({
      where: { id: bed.id },
      data: { status: isOnNotice ? "OCCUPIED" : "OCCUPIED" },
    });

    await prisma.deposit.create({
      data: {
        societyId: pg.id,
        occupancyId: occ.id,
        amountReceived: 10000,
        receivedDate: occJoinDate,
        status: "HELD",
        notes: "Security deposit held securely",
      },
    });
  }

  // 1 past occupant who checked out (to test deposit deductions and refund history)
  const leftUser = await prisma.user.create({
    data: {
      societyId: pg.id,
      authUid: "dev-user-left",
      name: "Pawan Kalyan",
      email: "pawan.k@gmail.com",
      phone: "9845011999",
      role: "RESIDENT",
    },
  });

  const leftOcc = await prisma.occupancy.create({
    data: {
      societyId: pg.id,
      userId: leftUser.id,
      unitId: createdUnits[0].id,
      bedId: createdBeds[0].id,
      joinDate: new Date(now.getFullYear(), now.getMonth() - 5, 1),
      leaveDate: new Date(now.getFullYear(), now.getMonth() - 1, 28),
      monthlyRent: 12000,
      depositAmount: 12000,
      status: "LEFT",
    },
  });

  const settledDeposit = await prisma.deposit.create({
    data: {
      societyId: pg.id,
      occupancyId: leftOcc.id,
      amountReceived: 12000,
      receivedDate: new Date(now.getFullYear(), now.getMonth() - 5, 1),
      deductionsTotal: 1500,
      refundAmount: 10500,
      refundDate: new Date(now.getFullYear(), now.getMonth() - 1, 28),
      status: "REFUNDED",
      notes: "Settled upon vacating Room 101. Deducted 1,500 for room painting and deep cleaning.",
    },
  });

  await prisma.depositDeduction.create({
    data: {
      depositId: settledDeposit.id,
      reason: "Room wall painting and cleaning",
      amount: 1500,
    },
  });

  console.log(`> seeded ${occupancies.length} active/notice occupancies + 1 past checkout`);

  // Invoices & Payments for PG
  const prevPeriod = monthKey(-1);
  const curPeriod = monthKey(0);

  console.log(`> creating PG rent invoices for ${prevPeriod} and ${curPeriod}`);

  // 1. Previous month historical invoices & receipts for collection reports
  for (let i = 0; i < 6; i++) {
    const occ = occupancies[i];
    const invNum = `INV-SLLP-${prevPeriod.replace("-", "")}-${String(i + 1).padStart(4, "0")}`;
    const rent = occ.monthlyRent;
    const prevInv = await prisma.invoice.create({
      data: {
        societyId: pg.id,
        occupancyId: occ.id,
        billableType: "OCCUPANCY",
        invoiceNumber: invNum,
        billingPeriod: prevPeriod,
        invoiceDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 10),
        subtotal: rent,
        totalAmount: rent,
        paidAmount: rent,
        status: "PAID",
        createdById: pgOwner.id,
        items: {
          create: [{ name: "Room Rent", type: "RENT", amount: rent }],
        },
      },
    });

    const rcptNum = `RCP-SLLP-${now.getFullYear()}-${String(i + 1).padStart(4, "0")}`;
    const pmt = await prisma.payment.create({
      data: {
        societyId: pg.id,
        invoiceId: prevInv.id,
        occupancyId: occ.id,
        amount: rent,
        paymentMethod: "UPI",
        paymentDate: new Date(now.getFullYear(), now.getMonth() - 1, 6),
        notes: "Paid via PhonePe / GPay",
        recordedById: pgManager.id,
      },
    });

    await prisma.receipt.create({
      data: {
        societyId: pg.id,
        paymentId: pmt.id,
        receiptNumber: rcptNum,
        pdfUrl: `/api/billing/receipts/${pmt.id}/document`,
      },
    });
  }

  // 2. Current month live invoices generated via billing engine
  const curBatch = await generateInvoices({
    societyId: pg.id,
    userId: pgOwner.id,
    billingPeriod: curPeriod,
    dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
  });
  const curInvoices = curBatch.invoices || [];

  // Pay 8 current invoices, keep Karthik's invoice pending (to test resident pay), and 1 overdue
  for (let i = 0; i < Math.min(8, curInvoices.length); i++) {
    const inv = curInvoices[i];
    if (inv.occupancyId === karthikOcc.id) {
      continue; // Keep Karthik pending for live demo
    }

    await recordPayment({
      societyId: pg.id,
      userId: pgManager.id,
      invoiceId: inv.id,
      amount: inv.totalAmount,
      paymentMethod: i % 2 === 0 ? "UPI" : "BANK_TRANSFER",
      paymentDate: new Date(now.getFullYear(), now.getMonth(), 5),
      notes: "Online rent payment",
    });
  }

  // PG Complaints
  await prisma.complaint.create({
    data: {
      societyId: pg.id,
      unitId: createdUnits[4].id, // Room 201
      bedId: room201Bed.id,
      createdById: demoPgResident.id,
      category: "APPLIANCE",
      priority: "HIGH",
      title: "AC cooling is slow in Room 201",
      description: "The split AC takes over 2 hours to cool the room. Looks like filter cleaning or gas refill is needed.",
      status: "OPEN",
    },
  });

  await prisma.complaint.create({
    data: {
      societyId: pg.id,
      unitId: createdUnits[1].id, // Room 102
      createdById: pgResidents[1].id,
      category: "PLUMBING",
      priority: "MEDIUM",
      title: "Bathroom hot water mixer tap leaking",
      description: "Continuous dripping from the shower tap. Plumber needed.",
      status: "IN_PROGRESS",
      assignedToId: pgManager.id,
    },
  });

  await prisma.complaint.create({
    data: {
      societyId: pg.id,
      unitId: createdUnits[2].id, // Room 103
      createdById: pgResidents[2].id,
      category: "ELECTRICAL",
      priority: "LOW",
      title: "Bed lamp switch replaced",
      description: "Switch was loose and sparked. Replaced by electrician yesterday.",
      status: "CLOSED",
      assignedToId: pgManager.id,
    },
  });

  // PG Notices
  const pgNotice1 = await prisma.notice.create({
    data: {
      societyId: pg.id,
      title: "High-Speed 500 Mbps WiFi Upgraded on All Floors",
      body: "We have installed new mesh WiFi 6 routers on all 3 floors. Network SSID: SriLakshmi_5G. Password is posted on the notice board.",
      category: "FACILITY",
      status: "PUBLISHED",
      postedById: pgOwner.id,
      publishedAt: new Date(Date.now() - 3 * 86_400_000),
    },
  });

  await prisma.notice.create({
    data: {
      societyId: pg.id,
      title: "Sunday Deep Cleaning & Pest Control Schedule",
      body: "Professional pest control will be carried out this Sunday between 10:00 AM and 1:00 PM. Please keep room doors accessible.",
      category: "MAINTENANCE",
      status: "PUBLISHED",
      postedById: pgManager.id,
      publishedAt: new Date(Date.now() - 1 * 86_400_000),
    },
  });

  // Mark notice as read by Karthik
  await prisma.noticeRead.create({
    data: {
      societyId: pg.id,
      noticeId: pgNotice1.id,
      userId: demoPgResident.id,
    },
  });

  // ==============================================================================
  // 2. SECONDARY WORKSPACE: Green Valley Apartments (SOCIETY)
  // ==============================================================================
  console.log("> seeding Society workspace: Green Valley Apartments");
  const gva = await prisma.society.create({
    data: {
      name: "Green Valley Apartments",
      code: "GVA",
      type: "SOCIETY",
      address: "14, Valley Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
      phone: "08041234567",
      email: "office@greenvalley.local",
      status: "ACTIVE",
    },
  });

  const gvaAdmin = await prisma.user.create({
    data: {
      societyId: gva.id,
      authUid: "dev-soc-admin",
      name: "Anand Murthy",
      email: SOC_ADMIN_EMAIL,
      phone: "9876543200",
      role: "SOCIETY_ADMIN",
    },
  });

  const gvaResident = await prisma.user.create({
    data: {
      societyId: gva.id,
      authUid: "dev-soc-resident",
      name: "Ravi Kumar",
      email: SOC_RESIDENT_EMAIL,
      phone: "9876543210",
      role: "RESIDENT",
    },
  });

  const flatA101 = await prisma.flat.create({
    data: {
      societyId: gva.id,
      flatNumber: "A101",
      block: "A",
      floor: "1",
      flatType: "2 BHK",
      sqFt: 1050,
      status: "OCCUPIED",
    },
  });

  await prisma.flatResident.create({
    data: {
      societyId: gva.id,
      flatId: flatA101.id,
      userId: gvaResident.id,
      residentType: "OWNER",
      isPrimary: true,
    },
  });

  await prisma.feeConfiguration.create({
    data: {
      societyId: gva.id,
      name: "Monthly Society Maintenance",
      type: "MAINTENANCE",
      calculationType: "FIXED",
      amount: 2500,
      frequency: "MONTHLY",
      active: true,
    },
  });

  const gvaInvoices = await generateInvoices({
    societyId: gva.id,
    userId: gvaAdmin.id,
    billingPeriod: curPeriod,
    dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
  });

  // Summary counts
  const counts = {
    societies: await prisma.society.count(),
    units: await prisma.unit.count(),
    beds: await prisma.bed.count(),
    occupancies: await prisma.occupancy.count(),
    deposits: await prisma.deposit.count(),
    users: await prisma.user.count(),
    invoices: await prisma.invoice.count(),
    payments: await prisma.payment.count(),
    complaints: await prisma.complaint.count(),
    notices: await prisma.notice.count(),
  };

  console.log("\n==================================================");
  console.log("SEEDING COMPLETED SUCCESSFULLY!");
  console.log("Summary:", counts);
  console.log("==================================================");
  console.log("DEMO LOGINS (Firebase dev bypass):");
  console.log("  [PG Owner]       ", PG_OWNER_EMAIL);
  console.log("  [PG Manager]     ", PG_MANAGER_EMAIL);
  console.log("  [PG Resident]    ", PG_RESIDENT_EMAIL);
  console.log("  [Society Admin]  ", SOC_ADMIN_EMAIL);
  console.log("  [Society Resident]", SOC_RESIDENT_EMAIL);
  console.log("  [Super Admin]    ", SUPER_ADMIN_EMAIL);
  console.log("==================================================\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error("Seeding error:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
