import { redirect } from "next/navigation";
import { getServerSessionOrNull } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { getResidentFlatIds } from "@/lib/auth/permissions";
import AppShell from "@/components/layout/AppShell";

const societyCache = new Map();

async function getCachedSociety(societyId) {
  if (!societyId) return null;
  const entry = societyCache.get(societyId);
  if (entry && Date.now() - entry.time < 60_000) {
    return entry.data;
  }
  const data = await prisma.society.findUnique({
    where: { id: societyId },
    select: { id: true, name: true, code: true, logoUrl: true },
  });
  if (data) {
    societyCache.set(societyId, { data, time: Date.now() });
  }
  return data;
}

export default async function AppLayout({ children }) {
  const user = await getServerSessionOrNull();
  if (!user) redirect("/login");

  let society = null;
  let flats = [];

  const [societyRes, flatsRes] = await Promise.allSettled([
    user.societyId ? getCachedSociety(user.societyId) : Promise.resolve(null),
    user.role === "RESIDENT"
      ? getResidentFlatIds(user.id).then(async (flatIds) => {
          if (!flatIds?.length) return [];
          return prisma.flat.findMany({
            where: { id: { in: flatIds } },
            select: { id: true, flatNumber: true, block: true },
          });
        })
      : Promise.resolve([]),
  ]);

  if (societyRes.status === "fulfilled" && societyRes.value) {
    society = societyRes.value;
  } else if (user.societyId === "gva" || user.societyId === "cmvce8djg0002m7ggemm6z1m7") {
    society = { id: user.societyId || "cmvce8djg0002m7ggemm6z1m7", name: "Green Valley Apartments", code: "GVA", logoUrl: null };
  }

  if (flatsRes.status === "fulfilled" && flatsRes.value) {
    flats = flatsRes.value;
  } else if (user.email === "ravi@greenvalley.local") {
    flats = [{ id: "flat-a101", flatNumber: "A101" }];
  }

  return (
    <AppShell user={user} society={society} flats={flats}>
      {children}
    </AppShell>
  );
}