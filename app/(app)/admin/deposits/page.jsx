import { getServerSession } from "@/lib/auth/server";
import { requirePageRole, ADMIN_ROLES } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import DepositsClient from "./DepositsClient";

export const metadata = { title: "Security Deposits" };
export const dynamic = "force-dynamic";

export default async function DepositsPage() {
  const user = await getServerSession();
  requirePageRole(user, ADMIN_ROLES);

  const deposits = await prisma.deposit.findMany({
    where: { societyId: user.societyId },
    include: {
      occupancy: {
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } },
          unit: true,
          bed: true,
        },
      },
      deductions: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return <DepositsClient initialDeposits={deposits} />;
}

