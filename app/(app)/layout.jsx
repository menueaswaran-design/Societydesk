import { redirect } from "next/navigation";
import { getServerSessionOrNull } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { getResidentFlatIds } from "@/lib/auth/permissions";
import AppShell from "@/components/layout/AppShell";

export default async function AppLayout({ children }) {
  const user = await getServerSessionOrNull();
  if (!user) redirect("/login");

  const society = user.societyId
    ? await prisma.society.findUnique({
        where: { id: user.societyId },
        select: { id: true, name: true, code: true, logoUrl: true },
      })
    : null;

  const flats =
    user.role === "RESIDENT"
      ? await prisma.flat.findMany({
          where: { id: { in: await getResidentFlatIds(user.id) } },
          select: { id: true, flatNumber: true },
        })
      : [];

  return (
    <AppShell user={user} society={society} flats={flats}>
      {children}
    </AppShell>
  );
}