import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyAdmin, resolveSocietyScope, getResidentFlatIds, isStaff, requireFlatAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { badRequest } from "@/lib/errors";
import { complaintCreateSchema, paginationSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/** GET /api/complaints - admin sees all, resident sees their own flats. */
const GETImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  const sp = req.nextUrl.searchParams;
  const societyId = resolveSocietyScope(user, sp.get("societyId"));
  const { page, pageSize, q, status } = paginationSchema.parse(Object.fromEntries(sp));

  const where = { societyId };
  if (status) where.status = status;
  if (!isStaff(user)) where.flatId = { in: await getResidentFlatIds(user.id) };
  if (sp.get("priority")) where.priority = sp.get("priority");
  if (q) {
    where.OR = [{ title: { contains: q } }, { description: { contains: q } }];
  }

  const [total, complaints] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      include: {
        flat: { select: { id: true, flatNumber: true, block: true } },
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
 * POST /api/complaints  (section 25)
 * Residents file against their own flat; admins may file on behalf of any flat
 * in the society.
 */
const POSTImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  const societyId = resolveSocietyScope(user, null);
  const body = complaintCreateSchema.parse(await readJson(req));

  let flatId = body.flatId;

  if (isStaff(user)) {
    if (!flatId) throw badRequest("Select the flat this complaint is for");
    await requireFlatAccess(user, flatId, { societyId });
  } else {
    // A resident has exactly one active flat mapping used as the default.
    const ownFlatIds = await getResidentFlatIds(user.id);
    if (flatId) {
      if (!ownFlatIds.includes(flatId)) {
        throw badRequest("You can only raise complaints for your own flat");
      }
    } else if (ownFlatIds.length > 0) {
      flatId = ownFlatIds[0];
    } else {
      throw badRequest("No flat is linked to your account yet. Contact your society admin.");
    }
  }

  const complaint = await prisma.$transaction(async (tx) => {
    const created = await tx.complaint.create({
      data: {
        societyId,
        flatId,
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

    // The first timeline entry: who raised it and when.
    await tx.complaintComment.create({
      data: {
        societyId,
        complaintId: created.id,
        userId: user.id,
        comment: "Complaint raised",
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

  return ok(complaint, { status: 201 });
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function POST(request, context) {
  return POSTImpl(request, context);
}
