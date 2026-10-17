import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "kumarvignesh865@gmail.com";
  const authUid = "OjCNGFzBbCNlLLF1Z7UIWuYsbCn2";

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Kumar Vignesh",
      authUid,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
    update: {
      name: "Kumar Vignesh",
      authUid,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("Upserted super-admin successfully:", user);
}

try {
  await main();
} catch (e) {
  console.error("Error upserting superadmin:", e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

