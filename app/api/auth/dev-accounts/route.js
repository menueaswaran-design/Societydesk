import { handler, ok } from "@/lib/api";
import { devBypassEnabled } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const PUBLIC_DEMO_ACCOUNTS = [
  {
    email: "owner@srilakshmipg.local",
    name: "Suresh Reddy",
    role: "OWNER",
    society: { name: "Sri Lakshmi Luxury PG & Coliving" },
  },
  {
    email: "manager@srilakshmipg.local",
    name: "Venkatesh Babu",
    role: "MANAGER",
    society: { name: "Sri Lakshmi Luxury PG & Coliving" },
  },
  {
    email: "resident@srilakshmipg.local",
    name: "Karthik Raja",
    role: "RESIDENT",
    society: { name: "Sri Lakshmi Luxury PG & Coliving" },
  },
  {
    email: "admin@greenvalley.local",
    name: "Anand Murthy",
    role: "SOCIETY_ADMIN",
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
        email: {
          in: [
            "owner@srilakshmipg.local",
            "manager@srilakshmipg.local",
            "resident@srilakshmipg.local",
            "admin@greenvalley.local",
          ],
        },
      },
      select: {
        email: true,
        name: true,
        role: true,
        societyId: true,
        society: { select: { name: true } },
      },
      orderBy: { role: "asc" },
    });

    const list = users.length > 0 ? users : PUBLIC_DEMO_ACCOUNTS;
    return ok(list);
  } catch (e) {
    return ok(PUBLIC_DEMO_ACCOUNTS);
  }
});

export async function GET(request, context) {
  return GETImpl(request, context);
}
