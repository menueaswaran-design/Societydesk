import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import FeeConfigClient from "./FeeConfigClient";

export const metadata = { title: "Fee Setup - SocietyDesk" };
export const dynamic = "force-dynamic";

export default async function BillingConfigurationPage() {
  const user = await getServerSession();
  requirePageRole(user, "SOCIETY_ADMIN");

  const configs = await prisma.feeConfiguration.findMany({
    where: { societyId: user.societyId },
    orderBy: [{ active: "desc" }, { type: "asc" }],
  });

  const parsed = configs.map((c) => ({
    ...c,
    flatTypeAmounts: c.flatTypeAmounts ? JSON.parse(c.flatTypeAmounts) : null,
  }));

  return <FeeConfigClient configs={parsed} />;
}