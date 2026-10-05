import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope, getResidentFlatIds } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { flatCreateSchema, paginationSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/**
 * GET /api/flats
 * Admin: every flat in the society. Resident: only their own flats.
 * Query: ?q=&status=&page=&pageSize=
 */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  const sp = req.nextUrl.searchParams;
  const { page, pageSize, q, status } = paginationSchema.parse(Object.fromEntries(sp));

  const societyId = resolveSocietyScope(user, sp.get("societyId"));

  const where = { societyId };
  if (status) where.status = status;
  if (user.role === "RESIDENT") {
    const ids = await getResidentFlatIds(user.id);
    where.id = { in: ids };
  }
  if (q) {
    where.OR = [
      { flatNumber: { contains: q } },
      { block: { contains: q } },
      { parkingSlot: { contains: q } },
    ];
  }

  const [total, flats] = await Promise.all([
    prisma.flat.count({ where }),
    prisma.flat.findMany({
      where,
      include: {
        residents: {
          where: { endDate: null },
          include: { user: { select: { id: true, name: true, phone: true, email: true } } },
          orderBy: { isPrimary: "desc" },
        },
        _count: { select: { invoices: true, complaints: true } },
      },
      orderBy: [{ block: "asc" }, { flatNumber: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return ok(flats, {
    meta: { total, page, pageSize, pageCount: Math.ceil(total / pageSize) },
  });
});

/** POST /api/flats */
const POSTImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSocietyAdmin(user);
  const societyId = resolveSocietyScope(user, null);

  const body = flatCreateSchema.parse(await readJson(req));

  const flat = await prisma.flat.create({
    data: {
      societyId,
      flatNumber: body.flatNumber,
      block: body.block ?? null,
      floor: body.floor ?? null,
      flatType: body.flatType ?? null,
      sqFt: body.sqFt ?? null,
      parkingSlot: body.parkingSlot ?? null,
      status: body.status,
    },
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.FLAT_CREATED,
    entityType: "flat",
    entityId: flat.id,
    newValue: { flatNumber: flat.flatNumber, block: flat.block },
  });

  return ok(flat, { status: 201 });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function POST(request, context) {
  return POSTImpl(request, context);
}
