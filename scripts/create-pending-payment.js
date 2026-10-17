import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking database...");

  const societies = await prisma.society.findMany({
    select: { id: true, name: true, code: true },
  });
  console.log("Societies:", societies);

  if (societies.length === 0) {
    console.log("No society found.");
    return;
  }

  const flats = await prisma.flat.findMany({
    include: {
      society: { select: { id: true, name: true } },
      residents: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      invoices: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  console.log(`Found ${flats.length} flats.`);

  // Find a flat that has a resident
  let targetFlat = flats.find((f) => f.residents.length > 0);
  if (!targetFlat && flats.length > 0) {
    targetFlat = flats[0];
  }

  if (!targetFlat) {
    console.log("No flat available to attach invoice to.");
    return;
  }

  console.log(
    `Target Flat: ${targetFlat.block ? targetFlat.block + "-" : ""}${targetFlat.flatNumber} (ID: ${targetFlat.id}) in Society ${targetFlat.society.name}`
  );
  if (targetFlat.residents.length > 0) {
    console.log(`Residents in flat:`, targetFlat.residents.map((r) => `${r.user.name} (${r.user.email})`));
  } else {
    console.log("Warning: Flat has no assigned residents.");
  }

  // Create a pending invoice for the current month: 2026-10 or 2026-11
  const today = new Date();
  const yearMonth = "2026-11"; // November 2026 or a fresh period
  const invoiceNumber = `INV-${targetFlat.society.code || "SOC"}-${targetFlat.flatNumber}-${Date.now().toString().slice(-5)}`;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15); // due in 15 days

  const invoice = await prisma.invoice.create({
    data: {
      societyId: targetFlat.societyId,
      flatId: targetFlat.id,
      invoiceNumber,
      billingPeriod: yearMonth,
      invoiceDate: new Date(),
      dueDate,
      subtotal: 4500,
      previousDue: 0,
      penalty: 0,
      discount: 0,
      totalAmount: 4500,
      paidAmount: 0,
      status: "PENDING",
      items: {
        create: [
          {
            name: "Monthly Maintenance (Base)",
            type: "MAINTENANCE",
            amount: 3500,
          },
          {
            name: "Covered Parking Slot",
            type: "PARKING",
            amount: 500,
          },
          {
            name: "Sinking Fund Contribution",
            type: "SINKING_FUND",
            amount: 500,
          },
        ],
      },
    },
    include: {
      items: true,
      flat: true,
    },
  });

  console.log("\n=========================================");
  console.log("✅ Successfully created pending invoice!");
  console.log(`Invoice ID: ${invoice.id}`);
  console.log(`Invoice Number: ${invoice.invoiceNumber}`);
  console.log(`Billing Period: ${invoice.billingPeriod}`);
  console.log(`Flat: ${invoice.flat.block ? invoice.flat.block + "-" : ""}${invoice.flat.flatNumber}`);
  console.log(`Amount: ₹${invoice.totalAmount}`);
  console.log(`Status: ${invoice.status}`);
  console.log(`Due Date: ${invoice.dueDate.toISOString().split("T")[0]}`);
  console.log("Breakdown items:");
  for (const item of invoice.items) {
    console.log(`  - ${item.name}: ₹${item.amount} (${item.type})`);
  }
  console.log("=========================================\n");
}

try {
  await main();
} catch (e) {
  console.error("Error creating pending invoice:", e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

