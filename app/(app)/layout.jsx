import { redirect } from "next/navigation";
import { getServerSessionOrNull } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { getResidentFlatIds } from "@/lib/auth/permissions";
import AppShell from "@/components/layout/AppShell";

export default async function AppLayout({ children }) {
  const user = await getServerSessionOrNull();
  if (!user) redirect("/login");

  let society = null;
  let flats = [];

  try {
    society = user.societyId
      ? await prisma.society.findUnique({
          where: { id: user.societyId },
          select: { id: true, name: true, code: true, logoUrl: true },
        })
      : null;
  } catch (e) {
    // Demo fallback
    if (user.societyId === "gva") {
      society = { id: "gva", name: "Green Valley Apartments", code: "GVA", logoUrl: null };
    }
  }

  try {
    if (user.role === "RESIDENT") {
      const flatIds = await getResidentFlatIds(user.id).catch(() => []);
      flats = flatIds.length
        ? await prisma.flat.findMany({
            where: { id: { in: flatIds } },
            select: { id: true, flatNumber: true },
          })
        : [];
    }
  } catch (e) {
    // Demo fallback for resident
    if (user.email === "ravi@greenvalley.local") {
      flats = [{ id: "flat-a101", flatNumber: "A101" }];
    }
  }

  return (
    <AppShell user={user} society={society} flats={flats}>
      {children}
    </AppShell>
  );
}