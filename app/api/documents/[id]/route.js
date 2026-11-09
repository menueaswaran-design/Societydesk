import { handler, ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { isStaff, isSuperAdmin } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { forbidden, notFound, unauthorized } from "@/lib/errors";
import { generateSignedCloudinaryUrl } from "@/lib/client/server";
import { audit } from "@/lib/audit";
import { AUDIT_ACTION } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * GET /api/documents/:id
 *
 * Secure gateway for accessing KYC and tenant identity documents.
 * UIDAI & DPDP Act 2023 Compliant:
 * 1. Requires authenticated session.
 * 2. Enforces RBAC (only the resident or authorized property staff/admin).
 * 3. Logs an audit trail on every document view (DOCUMENT_VIEWED).
 * 4. Generates time-limited signed Cloudinary tokens or streams private storage.
 * 5. Prevents open static URL indexing or caching (Cache-Control: private, no-store).
 */
export const GET = handler(async (req, { params }) => {
  const user = await getSessionUser(req);
  if (!user) throw unauthorized("Authentication required to access identity documents");

  const { id } = await params;
  if (!id) throw notFound("Document ID is required");

  const doc = await prisma.tenantDocument.findUnique({
    where: { id },
  });
  if (!doc) throw notFound("Document not found");

  // Strict RBAC authorization
  const isOwnerResident = user.id === doc.userId;
  const isAuthorizedStaff =
    (isStaff(user) || user.role === "ADMIN" || user.role === "OWNER") &&
    (!user.societyId || user.societyId === doc.societyId);
  const isAdmin = isSuperAdmin(user);

  if (!isOwnerResident && !isAuthorizedStaff && !isAdmin) {
    throw forbidden("You are not authorized to view this sensitive document");
  }

  // Audit log document view
  await audit({
    societyId: doc.societyId,
    userId: user.id,
    action: AUDIT_ACTION.DOCUMENT_VIEWED,
    entityType: "tenantDocument",
    entityId: doc.id,
    reason: `Viewed KYC document (${doc.docType})`,
  });

  const isDownload = req.nextUrl?.searchParams?.get("download") === "true";
  const wantRedirect = req.nextUrl?.searchParams?.get("redirect") === "true";
  const defaultExt = doc.resourceType === "raw" ? "pdf" : "jpg";
  const downloadFileName = `${doc.docType.toLowerCase()}_${doc.id}.${defaultExt}`;

  // 1. Cloudinary Authenticated Asset Delivery
  if (doc.cloudinaryPublicId) {
    const signedUrl = generateSignedCloudinaryUrl({
      publicId: doc.cloudinaryPublicId,
      resourceType: doc.resourceType || "image",
    });

    if (signedUrl) {
      if (wantRedirect) {
        return Response.redirect(signedUrl, 302);
      }

      try {
        const upstream = await fetch(signedUrl);
        if (upstream.ok) {
          const contentType =
            upstream.headers.get("content-type") ||
            (doc.resourceType === "raw" ? "application/pdf" : "image/jpeg");

          return new Response(upstream.body, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "private, no-cache, no-store, must-revalidate",
              "Content-Disposition": isDownload
                ? `attachment; filename="${downloadFileName}"`
                : "inline",
            },
          });
        }
      } catch (upstreamErr) {
        console.warn("[documents] Upstream fetch failed, redirecting to signed URL:", upstreamErr.message);
      }

      // Fallback redirect to signed URL
      return Response.redirect(signedUrl, 302);
    }
  }

  // 2. Data URI delivery
  if (doc.fileUrl?.startsWith("data:")) {
    const match = doc.fileUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const mime = match[1];
      const buffer = Buffer.from(match[2], "base64");
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "Content-Disposition": isDownload
            ? `attachment; filename="${downloadFileName}"`
            : "inline",
        },
      });
    }
  }

  // 3. Local Private Storage delivery (outside public/)
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    // Check storage/private_uploads or legacy public/uploads
    const possiblePaths = [
      path.join(process.cwd(), "storage", "private_uploads", doc.societyId, path.basename(doc.fileUrl)),
      path.join(process.cwd(), "storage", "private_uploads", "global", path.basename(doc.fileUrl)),
      path.join(process.cwd(), "public", doc.fileUrl.replace(/^\//, "")),
    ];

    for (const p of possiblePaths) {
      try {
        const stat = await fs.stat(p);
        if (stat.isFile()) {
          const fileBuffer = await fs.readFile(p);
          const ext = path.extname(p).toLowerCase();
          const mime =
            ext === ".pdf"
              ? "application/pdf"
              : ext === ".png"
              ? "image/png"
              : ext === ".webp"
              ? "image/webp"
              : "image/jpeg";

          return new Response(fileBuffer, {
            status: 200,
            headers: {
              "Content-Type": mime,
              "Cache-Control": "private, no-cache, no-store, must-revalidate",
              "Content-Disposition": isDownload
                ? `attachment; filename="${downloadFileName}"`
                : "inline",
            },
          });
        }
      } catch {
        // Continue search
      }
    }
  } catch (fsErr) {
    console.warn("[documents] Local file read error:", fsErr.message);
  }

  // 4. Fallback URL redirect (if external)
  if (doc.fileUrl?.startsWith("http://") || doc.fileUrl?.startsWith("https://")) {
    return Response.redirect(doc.fileUrl, 302);
  }

  throw notFound("Document asset is not accessible");
});

