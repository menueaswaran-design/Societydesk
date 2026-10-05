import "server-only";
import { createHash } from "node:crypto";

/**
 * Minimal Cloudinary signed-upload client.
 *
 * Implemented with fetch + node:crypto rather than the vendor SDK so the
 * project stays dependency-light. The API secret is used only here, on the
 * server, and is never sent to the browser (spec section 29).
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export function cloudinaryConfigured() {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

function sign(params) {
  // Cloudinary signs the sorted "key=value&..." string, excluding api_key and
  // any file field, with the API secret appended.
  const payload = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  return createHash("sha1").update(`${payload}${API_SECRET}`).digest("hex");
}

/**
 * Upload a base64 data URI (what a browser file input produces) to Cloudinary.
 * Returns { fileUrl, publicId, resourceType }.
 */
export async function uploadBase64({
  dataUri,
  folder = "societydesk",
  resourceType = "auto",
  publicId,
}) {
  if (!cloudinaryConfigured()) {
    const err = new Error("Cloudinary is not configured");
    err.code = "CLOUDINARY_NOT_CONFIGURED";
    throw err;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = { timestamp, folder };
  if (publicId) params.public_id = publicId;

  const body = new FormData();
  body.append("file", dataUri);
  body.append("api_key", API_KEY);
  body.append("timestamp", String(timestamp));
  body.append("folder", folder);
  if (publicId) body.append("public_id", publicId);
  body.append("signature", sign(params));

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body }
  );

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json?.error?.message || "Cloudinary upload failed");
    err.code = "CLOUDINARY_UPLOAD_FAILED";
    throw err;
  }

  return {
    fileUrl: json.secure_url,
    publicId: json.public_id,
    resourceType: json.resource_type,
    width: json.width,
    height: json.height,
    bytes: json.bytes,
    format: json.format,
  };
}

/** Build the data URI a browser sends for a File. */
export function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}