import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { uploadBase64, cloudinaryConfigured } from "@/lib/client/server";
import { badRequest, unauthorized } from "@/lib/errors";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB for documents & images
const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/jpg",
  "application/pdf",
];

/**
 * POST /api/uploads
 *
 * Uploads a document/image to Cloudinary (or fallback storage if Cloudinary is pending config).
 * For sensitive KYC / identity documents, uses Cloudinary 'authenticated' storage (UIDAI & DPDP compliance)
 * and isolates local fallback storage outside public static directories.
 * Returns { fileUrl, publicId, resourceType, fileName, bytes, isPrivate }.
 */
const POSTImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  if (!user) throw unauthorized("Authentication required");

  // Resolve society id for folder separation
  let societyId = user.societyId;
  if (!societyId && user.role === "RESIDENT") {
    const occ = await prisma.occupancy.findFirst({
      where: { userId: user.id },
      select: { societyId: true },
    });
    societyId = occ?.societyId;
    if (!societyId) {
      const fr = await prisma.flatResident.findFirst({
        where: { userId: user.id },
        include: { flat: { select: { societyId: true } } },
      });
      societyId = fr?.flat?.societyId;
    }
  }

  const form = await req.formData();
  const file = form.get("file");

  if (!file || typeof file === "string") throw badRequest("No file provided");
  if (file.size > MAX_BYTES) throw badRequest("File must be smaller than 10 MB");
  if (!ALLOWED.includes(file.type)) {
    throw badRequest("Unsupported file type. Allowed: JPG, PNG, WEBP, PDF");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
  const resourceType = file.type === "application/pdf" ? "raw" : "image";

  const requestedFolder = String(form.get("folder") || "documents").replace(/[^a-zA-Z0-9/_-]/g, "");
  const folder = `bedy/${societyId || "global"}/${requestedFolder}`;

  // Government & DPDP compliance: KYC & Identity proofs must be securely vaulted
  const isPrivate =
    form.get("isPrivate") === "true" ||
    requestedFolder.toLowerCase().includes("kyc") ||
    requestedFolder.toLowerCase().includes("document");
  const uploadType = isPrivate ? "authenticated" : "upload";

  if (cloudinaryConfigured()) {
    try {
      const result = await uploadBase64({
        dataUri,
        folder,
        resourceType,
        type: uploadType,
      });
      return ok(
        {
          fileUrl: result.fileUrl,
          publicId: result.publicId,
          resourceType: result.resourceType,
          fileName: file.name,
          bytes: result.bytes,
          isPrivate,
          type: result.type,
        },
        { status: 201 }
      );
    } catch (err) {
      console.warn("[uploads] Cloudinary upload failed, attempting fallback:", err.message);
    }
  }

  // Graceful fallback: Store in private_uploads (for sensitive KYC) or public/uploads (for public assets)
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    // Private KYC files must never reside inside public/ (which would expose them on the open web)
    const baseDir = isPrivate
      ? path.join(process.cwd(), "storage", "private_uploads", societyId || "global")
      : path.join(process.cwd(), "public", "uploads", societyId || "global");

    await fs.mkdir(baseDir, { recursive: true });
    const ext = file.name.split(".").pop() || (file.type === "application/pdf" ? "pdf" : "jpg");
    const safeName = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = path.join(baseDir, safeName);
    await fs.writeFile(filePath, buffer);

    const fileUrl = isPrivate
      ? `/api/documents/raw/${societyId || "global"}/${safeName}`
      : `/uploads/${societyId || "global"}/${safeName}`;

    return ok(
      {
        fileUrl,
        publicId: safeName,
        resourceType,
        fileName: file.name,
        bytes: file.size,
        isPrivate,
        localPrivatePath: isPrivate ? path.join("storage", "private_uploads", societyId || "global", safeName) : null,
      },
      { status: 201 }
    );
  } catch (fsErr) {
    // If running in a read-only serverless runtime, return data URI directly
    return ok(
      {
        fileUrl: dataUri,
        publicId: `data_${Date.now()}`,
        resourceType,
        fileName: file.name,
        bytes: file.size,
        isPrivate,
      },
      { status: 201 }
    );
  }
});

export async function POST(request, context) {
  return POSTImpl(request, context);
}
