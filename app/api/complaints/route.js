import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import {
  resolveSocietyScope,
  getResidentFlatIds,
  getResidentOccupancies,
  isComplaintManager,
  requireFlatAccess,
} from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { badRequest } from "@/lib/errors";
import { complaintCreateSchema, paginationSchema } from "@/lib/validation/schemas";
import { notifyComplaintCreated } from "@/lib/push/webpush";

export const dynamic = "force-dynamic";

/** GET /api/complaints - admin sees all, resident sees their own room/flat complaints. */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  const sp = req.nextUrl.searchParams;
  const societyId = resolveSocietyScope(user, sp.get("societyId"));
  const { page, pageSize, q, status } = paginationSchema.parse(Object.fromEntries(sp));

  const where = { societyId };
  if (status) where.status = status;
  if (!isComplaintManager(user)) {
    const flatIds = await getResidentFlatIds(user.id);
    const occupancies = await getResidentOccupancies(user.id);
    const unitIds = occupancies.map((o) => o.unitId);
    where.OR = [
      { createdById: user.id },
      { flatId: { in: flatIds } },
      { unitId: { in: unitIds } },
    ];
  }
  if (sp.get("priority")) where.priority = sp.get("priority");
  if (sp.get("unitId")) where.unitId = sp.get("unitId");
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, complaints] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      include: {
        flat: { select: { id: true, flatNumber: true, block: true } },
        unit: { select: { id: true, unitNumber: true, floor: true } },
        bed: { select: { id: true, bedLabel: true } },
        createdBy: { select: { id: true, name: true, phone: true } },
        assignedTo: { select: { id: true, name: true, phone: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return ok(complaints, {
    meta: { total, page, pageSize, pageCount: Math.ceil(total / pageSize) },
  });
});

/**
 * POST /api/complaints
 * File a complaint for a PG room/bed or apartment flat.
 */
const POSTImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  const societyId = resolveSocietyScope(user, null);
  const body = complaintCreateSchema.parse(await readJson(req));

  let flatId = body.flatId || null;
  let unitId = body.unitId || null;
  let bedId = body.bedId || null;

  if (isComplaintManager(user)) {
    if (flatId) {
      await requireFlatAccess(user, flatId, { societyId });
    }
  } else {
    // If user is a resident, auto-link to their active room/bed or flat
    const occupancies = await getResidentOccupancies(user.id);
    const ownFlatIds = await getResidentFlatIds(user.id);

    if (occupancies.length > 0) {
      unitId = unitId || occupancies[0].unitId;
      bedId = bedId || occupancies[0].bedId;
    } else if (ownFlatIds.length > 0) {
      flatId = flatId || ownFlatIds[0];
    }
  }

  const complaint = await prisma.$transaction(async (tx) => {
    const created = await tx.complaint.create({
      data: {
        societyId,
        flatId,
        unitId,
        bedId,
        createdById: user.id,
        category: body.category,
        title: body.title,
        description: body.description,
        priority: body.priority,
        status: "OPEN",
      },
    });

    if (body.attachments?.length) {
      await tx.complaintAttachment.createMany({
        data: body.attachments.map((a) => ({
          societyId,
          complaintId: created.id,
          fileUrl: a.fileUrl,
          fileName: a.fileName,
          cloudinaryPublicId: a.cloudinaryPublicId ?? null,
          resourceType: a.resourceType ?? "image",
        })),
      });
    }

    await tx.complaintComment.create({
      data: {
        societyId,
        complaintId: created.id,
        userId: user.id,
        comment: "Complaint registered",
        eventType: "COMMENT",
      },
    });

    return created;
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.COMPLAINT_CREATED,
    entityType: "complaint",
    entityId: complaint.id,
    newValue: { title: complaint.title, category: complaint.category, priority: complaint.priority },
  });

  notifyComplaintCreated({
    societyId,
    complaintId: complaint.id,
    title: complaint.title,
    category: complaint.category,
    priority: complaint.priority,
    residentName: user.name,
    residentUserId: user.id,
  });

  return ok(complaint, { status: 201 });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function POST(request, context) {
  return POSTImpl(request, context);
}
