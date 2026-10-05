import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { requireSocietyMember } from "@/lib/auth/permissions";
import { uploadBase64, cloudinaryConfigured } from "@/lib/client/server";
import { badRequest, forbidden } from "@/lib/errors";
export const dynamic = "force-dynamic";


const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

/**
 * POST /api/uploads   (section 29)
 *
 * Browser -> this route -> Cloudinary. The API secret never leaves the server;
 * the database only ever stores the resulting secure_url + public_id.
 *
 * Form fields: file, folder (optional)
 */
const POSTImpl = handler(async (req) => {
  const user = await getSessionUser(req);
  requireSocietyMember(user);

  if (!cloudinaryConfigured()) {
    throw badRequest(
      "File uploads are not configured on this environment. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to .env.local."
    );
  }

  const form = await req.formData();
  const file = form.get("file");

  if (!file || typeof file === "string") throw badRequest("No file provided");
  if (file.size > MAX_BYTES) throw badRequest("File must be smaller than 5 MB");
  if (!ALLOWED.includes(file.type)) {
    throw badRequest(`Unsupported file type. Allowed: ${ALLOWED.join(", ")}`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

  const resourceType = file.type === "application/pdf" ? "raw" : "image";

  // Folder is namespaced by society so tenant files stay separated in the CDN.
  const requestedFolder = String(form.get("folder") || "uploads").replace(/[^a-zA-Z0-9/_-]/g, "");
  const folder = `societydesk/${user.societyId}/${requestedFolder}`;

  const result = await uploadBase64({ dataUri, folder, resourceType });

  return ok(
    {
      fileUrl: result.fileUrl,
      publicId: result.publicId,
      resourceType: result.resourceType,
      fileName: file.name,
      bytes: result.bytes,
    },
    { status: 201 }
  );
});

export async function POST(request, context) {
  return POSTImpl(request, context);
}
