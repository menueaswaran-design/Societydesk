import { handler, ok } from "@/lib/api";
import { devBypassEnabled } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { forbidden } from "@/lib/errors";
export const dynamic = "force-dynamic";


/**
 * GET /api/auth/dev-accounts   (LOCAL DEVELOPMENT ONLY)
 * Lists the seeded logins shown on the dev sign-in screen.
 */
const GETImpl = handler(async () => {
  if (!devBypassEnabled()) {
    // For demo purposes without DB, return fallback accounts
    return ok([
      { email: "kumarvignesh865@gmail.com", name: "Kumar Vignesh", role: "SUPER_ADMIN", societyId: null, society: null },
      { email: "admin@greenvalley.local", name: "Lakshmi Iyer", role: "SOCIETY_ADMIN", societyId: "cmvce8djg0002m7ggemm6z1m7", society: { name: "Green Valley Apartments" } },
      { email: "ravi@greenvalley.local", name: "Ravi Kumar", role: "RESIDENT", societyId: "cmvce8djg0002m7ggemm6z1m7", society: { name: "Green Valley Apartments" } },
    ]);
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { authUid: { startsWith: "dev-" } },
          { email: "kumarvignesh865@gmail.com" },
        ],
      },
      select: { email: true, name: true, role: true, societyId: true, society: { select: { name: true } } },
      orderBy: { role: "asc" },
    });
    return ok(users);
  } catch (e) {
    // Fallback if DB not accessible
    return ok([
      { email: "kumarvignesh865@gmail.com", name: "Kumar Vignesh", role: "SUPER_ADMIN", societyId: null, society: null },
      { email: "admin@greenvalley.local", name: "Lakshmi Iyer", role: "SOCIETY_ADMIN", societyId: "cmvce8djg0002m7ggemm6z1m7", society: { name: "Green Valley Apartments" } },
      { email: "ravi@greenvalley.local", name: "Ravi Kumar", role: "RESIDENT", societyId: "cmvce8djg0002m7ggemm6z1m7", society: { name: "Green Valley Apartments" } },
    ]);
  }
});

export async function GET(request, context) {
  return GETImpl(request, context);
}
