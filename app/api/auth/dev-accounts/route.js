import { handler, ok } from "@/lib/api";
import { devBypassEnabled } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const PUBLIC_DEMO_ACCOUNTS = [
  {
    email: "admin@greenvalley.local",
    name: "Lakshmi Iyer",
    role: "SOCIETY_ADMIN",
    societyId: "cmvce8djg0002m7ggemm6z1m7",
    society: { name: "Green Valley Apartments" },
  },
  {
    email: "priya@greenvalley.local",
    name: "Priya Sharma",
    role: "FLAT_ADMIN",
    societyId: "cmvce8djg0002m7ggemm6z1m7",
    society: { name: "Green Valley Apartments" },
  },
  {
    email: "ravi@greenvalley.local",
    name: "Ravi Kumar",
    role: "RESIDENT",
    societyId: "cmvce8djg0002m7ggemm6z1m7",
    society: { name: "Green Valley Apartments" },
  },
];

/**
 * GET /api/auth/dev-accounts
 * Lists seeded demo logins shown on the public sign-in screen.
 * NOTE: SUPER_ADMIN is internal only and is NEVER exposed here.
 */
const GETImpl = handler(async () => {
  if (!devBypassEnabled()) {
    return ok(PUBLIC_DEMO_ACCOUNTS);
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        role: { not: "SUPER_ADMIN" },
        email: { in: ["admin@greenvalley.local", "priya@greenvalley.local", "ravi@greenvalley.local"] },
      },
      select: { email: true, name: true, role: true, societyId: true, society: { select: { name: true } } },
      orderBy: { role: "asc" },
    });
    const mapped = (users.length > 0 ? users : PUBLIC_DEMO_ACCOUNTS).map((u) => {
      if (u.email === "priya@greenvalley.local") {
        return { ...u, role: "FLAT_ADMIN", name: "Priya Sharma" };
      }
      return u;
    });
    return ok(mapped);
  } catch (e) {
    return ok(PUBLIC_DEMO_ACCOUNTS);
  }
});

export async function GET(request, context) {
  return GETImpl(request, context);
}
