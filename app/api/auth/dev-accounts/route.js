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
  if (!devBypassEnabled()) throw forbidden("Not available");

  const users = await prisma.user.findMany({
    where: { authUid: { startsWith: "dev-" } },
    select: { email: true, name: true, role: true, societyId: true, society: { select: { name: true } } },
    orderBy: { role: "asc" },
  });

  return ok(users);
});

export async function GET(request, context) {
  return GETImpl(request, context);
}
