import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import ResidentVacateClient from "@/components/resident/ResidentVacateClient";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { BedSingle } from "lucide-react";

export const metadata = { title: "Vacate PG & Notice Period" };
export const dynamic = "force-dynamic";

export default async function ResidentVacatePage() {
  const user = await getServerSession();
  requirePageRole(user, "RESIDENT");

  const [occupancy, society] = await Promise.all([
    prisma.occupancy.findFirst({
      where: { userId: user.id, status: { in: ["ACTIVE", "NOTICE"] } },
      include: {
        unit: { include: { building: true } },
        bed: true,
        deposits: { where: { status: "HELD" }, take: 1 },
      },
    }),
    prisma.society.findUnique({
      where: { id: user.societyId },
      select: { name: true },
    }),
  ]);

  if (!occupancy) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Card className="p-8">
          <EmptyState
            icon={BedSingle}
            title="No active room assignment found"
            description="You do not have an active room or bed registered under your account. Please contact your PG manager."
          />
        </Card>
      </div>
    );
  }

  const activeDeposit = occupancy.deposits?.[0] || null;
  const depositStatus = activeDeposit
    ? {
        amount: activeDeposit.amountReceived,
        status: activeDeposit.status,
      }
    : null;

  return (
    <ResidentVacateClient
      occupancy={occupancy}
      depositStatus={depositStatus}
      societyName={society?.name || "Bedy PG"}
    />
  );
}
