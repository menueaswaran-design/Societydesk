import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { resolveSocietyScope, isStaff, requireFlatAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { audit, AUDIT } from "@/lib/audit";
import { notFound, forbidden } from "@/lib/errors";
import { complaintUpdateSchema } from "@/lib/validation/schemas";
export const dynamic = "force-dynamic";


/** GET /api/complaints/:id - includes the full comment timeline (section 27). */
const GETImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;
  const societyId = resolveSocietyScope(user, null);

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      flat: { select: { id: true, flatNumber: true, block: true } },
      createdBy: { select: { id: true, name: true, phone: true, email: true } },
      assignedTo: { select: { id: true, name: true, phone: true } },
      attachments: true,
      comments: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!complaint || complaint.societyId !== societyId) throw notFound("Complaint");
  if (!isStaff(user)) await requireFlatAccess(user, complaint.flatId, { societyId });

  return ok(complaint);
});

/** PATCH /api/complaints/:id - edit content (author while OPEN, or admin). */
const PATCHImpl = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;
  const societyId = resolveSocietyScope(user, null);

  const existing = await prisma.complaint.findFirst({ where: { id, societyId } });
  if (!existing) throw notFound("Complaint");

  if (!isStaff(user)) {
    await requireFlatAccess(user, existing.flatId, { societyId });
    if (existing.createdById !== user.id) throw forbidden("You can only edit your own complaint");
    if (!["OPEN", "REOPENED"].includes(existing.status)) {
      throw forbidden("This complaint is already being handled and can no longer be edited");
    }
  }

  const body = complaintUpdateSchema.parse(await readJson(req));

  const complaint = await prisma.complaint.update({
    where: { id },
    data: {
      title: body.title ?? undefined,
      description: body.description ?? undefined,
      category: body.category ?? undefined,
      priority: body.priority ?? undefined,
    },
  });

  await audit({
    societyId,
    userId: user.id,
    action: AUDIT.COMPLAINT_UPDATED,
    entityType: "complaint",
    entityId: id,
    oldValue: { title: existing.title, priority: existing.priority },
    newValue: { title: complaint.title, priority: complaint.priority },
  });

  return ok(complaint);
});

export async function GET(request, context) {
  return GETImpl(request, context);
}

export async function PATCH(request, context) {
  return PATCHImpl(request, context);
}
