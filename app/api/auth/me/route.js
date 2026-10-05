import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getResidentFlatIds } from "@/lib/auth/permissions";
export const dynamic = "force-dynamic";


/**
 * GET /api/auth/me
 * The current session resolved to a database user. The frontend uses this to
 * decide which portal to render and what the nav should contain.
 */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);

  const society = user.societyId
    ? await prisma.society.findUnique({
        where: { id: user.societyId },
        select: { id: true, name: true, code: true, logoUrl: true, status: true },
      })
    : null;

  const flatIds = user.role === "RESIDENT" ? await getResidentFlatIds(user.id) : [];

  const flats =
    flatIds.length > 0
      ? await prisma.flat.findMany({
          where: { id: { in: flatIds } },
          select: { id: true, flatNumber: true, block: true, flatType: true },
        })
      : [];

  return ok({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      societyId: user.societyId,
    },
    society,
    flats,
    viaDevBypass: user.viaDev,
  });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}
