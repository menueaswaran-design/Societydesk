import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { getResidentFlatIds } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import ProfileClient from "./ProfileClient";

export const metadata = { title: "My Profile - SocietyDesk" };
export const dynamic = "force-dynamic";

export default async function ResidentProfilePage() {
  const user = await getServerSession();
  requirePageRole(user, "RESIDENT");

  const [account, flats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        societyId: true,
      },
    }),
    prisma.flat.findMany({
      where: { id: { in: await getResidentFlatIds(user.id) } },
      include: {
        residents: {
          where: { userId: user.id, endDate: null },
          select: { residentType: true, isPrimary: true, startDate: true },
        },
      },
      orderBy: [{ block: "asc" }, { flatNumber: "asc" }],
    }),
  ]);

  return (
    <ProfileClient
      account={{
        ...account,
        createdAt: account?.createdAt?.toISOString() ?? null,
      }}
      flats={flats.map((f) => ({
        id: f.id,
        flatNumber: f.flatNumber,
        block: f.block,
        floor: f.floor,
        flatType: f.flatType,
        sqFt: f.sqFt,
        parkingSlot: f.parkingSlot,
        status: f.status,
        residentType: f.residents[0]?.residentType ?? null,
        isPrimary: f.residents[0]?.isPrimary ?? false,
      }))}
    />
  );
}