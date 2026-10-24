import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireResidentManager, resolveSocietyScope, isStaff, isSuperAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { notFound, forbidden, badRequest } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/residents/:id/documents
 * List sensitive ID proof / KYC documents. Restrict access to Owner/Manager or the resident themselves.
 */
export const GET = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;

  // Non-staff can only see their own documents
  if (user.role === "RESIDENT" && user.id !== id) {
    throw forbidden("You cannot access another resident's KYC documents");
  }

  const residentUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, societyId: true },
  });
  if (!residentUser) throw notFound("Resident not found");

  const societyId = residentUser.societyId || user.societyId;

  const documents = await prisma.tenantDocument.findMany({
    where: { userId: id, ...(societyId ? { societyId } : {}) },
    orderBy: { createdAt: "desc" },
  });

  return ok(documents);
});

/**
 * POST /api/residents/:id/documents
 * Attach a new ID proof document reference for a resident.
 * Allowed for the resident themselves OR staff/admin/owner.
 */
export const POST = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;

  const isSelf = user.id === id;
  if (!isSelf && !isStaff(user) && !isSuperAdmin(user)) {
    requireResidentManager(user);
  }

  const residentUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true, societyId: true },
  });
  if (!residentUser) throw notFound("Resident not found");

  const societyId = residentUser.societyId || user.societyId;
  if (!societyId) {
    throw badRequest("No society or property linked to this resident");
  }

  const body = await readJson(req);
  if (!body.fileUrl) {
    throw badRequest("fileUrl is required");
  }

  const doc = await prisma.tenantDocument.create({
    data: {
      societyId,
      userId: id,
      docType: body.docType || "OTHER",
      fileUrl: body.fileUrl,
      cloudinaryPublicId: body.cloudinaryPublicId || null,
      resourceType: body.resourceType || (body.fileUrl.endsWith(".pdf") ? "raw" : "image"),
      uploadedBy: user.id,
    },
  });

  return ok(doc, { status: 201 });
});

/**
 * DELETE /api/residents/:id/documents?docId=...
 * Delete a document reference.
 */
export const DELETE = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const { id } = await params;

  const isSelf = user.id === id;
  if (!isSelf && !isStaff(user) && !isSuperAdmin(user)) {
    requireResidentManager(user);
  }

  const sp = req.nextUrl.searchParams;
  const docId = sp.get("docId");
  if (!docId) throw badRequest("docId query parameter is required");

  const existing = await prisma.tenantDocument.findFirst({
    where: { id: docId, userId: id },
  });
  if (!existing) throw notFound("Document not found");

  await prisma.tenantDocument.delete({
    where: { id: docId },
  });

  return ok({ success: true, deletedId: docId });
});
