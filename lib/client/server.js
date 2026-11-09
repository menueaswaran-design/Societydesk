import "server-only";
import { createHash } from "node:crypto";

/**
 * Minimal Cloudinary signed-upload client.
 *
 * Implemented with fetch + node:crypto rather than the vendor SDK so the
 * project stays dependency-light. The API secret is used only here, on the
 * server, and is never sent to the browser (spec section 29).
 */

function clean(v) {
  if (!v) return "";
  let s = String(v).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

export function getCloudinaryCredentials() {
  const cloudName = clean(process.env.CLOUDINARY_CLOUD_NAME) || "ltkmypv6";
  const apiKey = clean(process.env.CLOUDINARY_API_KEY) || "949224439155261";
  const apiSecret = clean(process.env.CLOUDINARY_API_SECRET) || "K-QGsjF7gyYPl85DYLv-lHVXGZI";
  return { cloudName, apiKey, apiSecret };
}

export function cloudinaryConfigured() {
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  return Boolean(cloudName && apiKey && apiSecret);
}

function sign(params, apiSecret) {
  // Cloudinary signs the sorted "key=value&..." string, excluding api_key and
  // any file field, with the API secret appended.
  const payload = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

/**
 * Upload a base64 data URI (what a browser file input produces) to Cloudinary.
 * Supports type = "authenticated" / "private" for government-compliant ID storage.
 * Returns { fileUrl, publicId, resourceType, type, bytes, format }.
 */
export async function uploadBase64({
  dataUri,
  folder = "societydesk",
  resourceType = "auto",
  publicId,
  type = "upload",
}) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  if (!cloudinaryConfigured()) {
    const err = new Error("Cloudinary is not configured");
    err.code = "CLOUDINARY_NOT_CONFIGURED";
    throw err;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = { timestamp, folder };
  if (publicId) params.public_id = publicId;
  if (type && type !== "upload") params.type = type;

  const body = new FormData();
  body.append("file", dataUri);
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("folder", folder);
  if (publicId) body.append("public_id", publicId);
  if (type && type !== "upload") body.append("type", type);
  body.append("signature", sign(params, apiSecret));

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
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
    type: json.type || type,
    width: json.width,
    height: json.height,
    bytes: json.bytes,
    format: json.format,
  };
}

/**
 * Generate a time-limited signed download URL for private/authenticated Cloudinary assets.
 * Valid for statutory/legal access (KYC, Aadhaar, PAN) without public exposure.
 */
export function generateSignedCloudinaryUrl({
  publicId,
  resourceType = "image",
  format = "",
}) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  if (!cloudinaryConfigured() || !publicId) return null;

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = sign({ public_id: publicId, timestamp }, apiSecret);

  let url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/download?public_id=${encodeURIComponent(
    publicId
  )}&timestamp=${timestamp}&api_key=${apiKey}&signature=${signature}`;

  if (format) {
    url += `&format=${encodeURIComponent(format)}`;
  }
  return url;
}

/** Build the data URI a browser sends for a File. */
export function fileToDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
