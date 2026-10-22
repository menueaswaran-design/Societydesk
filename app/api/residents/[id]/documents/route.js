import { handler, ok, readJson } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireResidentManager, resolveSocietyScope } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { notFound, forbidden } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/residents/:id/documents
 * List sensitive ID proof / KYC documents. Restrict access to Owner/Manager or the resident themselves.
 */
export const GET = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  // Non-staff can only see their own documents
  if (user.role === "RESIDENT" && user.id !== id) {
    throw forbidden("You cannot access another resident's KYC documents");
  }

  const documents = await prisma.tenantDocument.findMany({
    where: { societyId, userId: id },
    orderBy: { createdAt: "desc" },
  });

  return ok(documents);
});

/**
 * POST /api/residents/:id/documents
 * Attach a new ID proof document reference for a resident.
 */
export const POST = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  requireResidentManager(user);
  const societyId = resolveSocietyScope(user, null);
  const { id } = await params;

  const residentUser = await prisma.user.findFirst({
    where: { id, societyId },
  });
  if (!residentUser) throw notFound("Resident not found in this PG");

  const body = await readJson(req);

  const doc = await prisma.tenantDocument.create({
    data: {
      societyId,
      userId: id,
      docType: body.docType || "OTHER",
      fileUrl: body.fileUrl,
      cloudinaryPublicId: body.cloudinaryPublicId || null,
      resourceType: body.resourceType || "image",
      uploadedBy: user.id,
    },
  });

  return ok(doc, { status: 201 });
});

