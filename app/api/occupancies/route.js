import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireResidentManager, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { occupancyCheckInSchema, paginationSchema } from "@/lib/validation/schemas";
import { badRequest } from "@/lib/errors";
import { audit, AUDIT } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * GET /api/occupancies
 * List occupancies in the PG.
 * Query: ?status=&unitId=&q=
 */
export const GET = handler(async (req) => {
  const user = await getSessionUser(req);
  const sp = req.nextUrl.searchParams;
  const { page, pageSize, q, status } = paginationSchema.parse(Object.fromEntries(sp));
  const societyId = resolveSocietyScope(user, null);

  const unitId = sp.get("unitId");

  const where = { societyId };
  if (status) where.status = status;
  if (unitId) where.unitId = unitId;

  if (user.role === "RESIDENT") {
    where.userId = user.id;
  }

  if (q) {
    where.OR = [
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { user: { phone: { contains: q, mode: "insensitive" } } },
      { unit: { unitNumber: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, occupancies] = await Promise.all([
    prisma.occupancy.count({ where }),
    prisma.occupancy.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        unit: { include: { building: true } },
        bed: true,
        deposits: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: [{ status: "asc" }, { joinDate: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return ok(occupancies, {
    meta: { total, page, pageSize, pageCount: Math.ceil(total / pageSize) },
  });
});

/**
 * POST /api/occupancies
 * Check-in a new resident into a room/bed and record security deposit.
 */
export const POST = handler(async (req) => {
  const user = await getSessionUser(req);
  requireResidentManager(user);
  const societyId = resolveSocietyScope(user, null);

  const body = occupancyCheckInSchema.parse(await readJson(req));

  // Verify unit belongs to this PG
  const unit = await prisma.unit.findFirst({
    where: { id: body.unitId, societyId },
  });
  if (!unit) throw badRequest("Invalid room selected");

  // Verify bed if specified
  let bed = null;
  if (body.bedId) {
    bed = await prisma.bed.findFirst({
      where: { id: body.bedId, unitId: body.unitId, societyId },
    });
    if (!bed) throw badRequest("Invalid bed selected");
    if (bed.status === "OCCUPIED") {
      throw badRequest(`Bed ${bed.bedLabel} is already occupied`);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Find or create User
    let residentUser = await tx.user.findUnique({
      where: { email: body.email },
    });

    if (!residentUser) {
      residentUser = await tx.user.create({
        data: {
          societyId,
          name: body.name,
          email: body.email,
          phone: body.phone || null,
          role: "RESIDENT",
          status: "ACTIVE",
        },
      });
    } else {
      // Update phone or link to this society if needed
      await tx.user.update({
        where: { id: residentUser.id },
        data: {
          name: body.name || residentUser.name,
          phone: body.phone || residentUser.phone,
          societyId: residentUser.societyId || societyId,
        },
      });
    }

    // 2. Create Occupancy
    const occupancy = await tx.occupancy.create({
      data: {
        societyId,
        userId: residentUser.id,
        unitId: body.unitId,
        bedId: body.bedId || null,
        joinDate: body.joinDate,
        monthlyRent: body.monthlyRent,
        depositAmount: body.depositAmount || 0,
        noticePeriodDays: body.noticePeriodDays || 30,
        status: "ACTIVE",
      },
      include: {
        user: true,
        unit: true,
        bed: true,
      },
    });

    // 3. Mark Bed as OCCUPIED
    if (body.bedId) {
      await tx.bed.update({
        where: { id: body.bedId },
        data: { status: "OCCUPIED" },
      });
    }

    // 4. Record Deposit if specified
    let depositRecord = null;
    if (body.depositAmount && body.depositAmount > 0) {
      depositRecord = await tx.deposit.create({
        data: {
          societyId,
          occupancyId: occupancy.id,
          amountReceived: body.depositAmount,
          receivedDate: body.joinDate || new Date(),
          status: "HELD",
          notes: "Initial security deposit collected at check-in",
        },
      });
    }

    // 5. Store ID proof documents if uploaded
    if (Array.isArray(body.documents) && body.documents.length > 0) {
      for (const doc of body.documents) {
        if (doc?.fileUrl) {
          await tx.tenantDocument.create({
            data: {
              societyId,
              userId: residentUser.id,
              docType: doc.docType || "OTHER",
              fileUrl: doc.fileUrl,
              cloudinaryPublicId: doc.cloudinaryPublicId || doc.publicId || null,
              resourceType: doc.resourceType || "image",
              uploadedBy: user.id,
            },
          });
        }
      }
    } else if (body.docType && body.docUrl) {
      await tx.tenantDocument.create({
        data: {
          societyId,
          userId: residentUser.id,
          docType: body.docType,
          fileUrl: body.docUrl,
          cloudinaryPublicId: body.cloudinaryPublicId || null,
          uploadedBy: user.id,
        },
      });
    }

    return { occupancy, deposit: depositRecord };
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.CHECK_IN,
    entityType: "occupancy",
    entityId: result.occupancy.id,
    newValue: {
      residentName: body.name,
      room: unit.unitNumber,
      bed: bed?.bedLabel || "Room",
      rent: body.monthlyRent,
      deposit: body.depositAmount,
    },
  });

  return ok(result.occupancy, { status: 201 });
});

