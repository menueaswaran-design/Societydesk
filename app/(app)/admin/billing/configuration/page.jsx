import { getServerSession } from "@/lib/auth/server";
import { requirePageRole, ADMIN_ROLES } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import FeeConfigClient from "./FeeConfigClient";

export const metadata = { title: "Billing & Payout Setup - Bedy" };
export const dynamic = "force-dynamic";

export default async function BillingConfigurationPage() {
  const user = await getServerSession();
  requirePageRole(user, ADMIN_ROLES);

  const [configs, society] = await Promise.all([
    prisma.feeConfiguration.findMany({
      where: { societyId: user.societyId },
      orderBy: [{ active: "desc" }, { type: "asc" }],
    }),
    prisma.society.findUnique({
      where: { id: user.societyId },
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        phone: true,
        email: true,
        bankName: true,
        bankAccountNo: true,
        bankIfsc: true,
        bankHolderName: true,
        upiId: true,
      },
    }),
  ]);

  const parsed = configs.map((c) => ({
    ...c,
    flatTypeAmounts: c.flatTypeAmounts ? JSON.parse(c.flatTypeAmounts) : null,
  }));

  return <FeeConfigClient configs={parsed} society={society} />;
}
