/**
 * Browser-side helper for the REST API.
 *
 * Writes always go through these endpoints rather than Server Actions, so the
 * REST surface in app/api is the single source of truth for every mutation.
 * The Firebase ID token is attached when one is available (production mode).
 */

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details || null;
  }
}

async function authHeader() {
  // Imported lazily so this module stays usable when Firebase is not configured.
  try {
    const { firebaseClientConfigured, getIdToken } = await import("@/lib/firebase/client");
    if (!firebaseClientConfigured()) return {};
    const token = await getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function apiFetch(path, { method = "GET", body, headers = {} } = {}) {
  const auth = await authHeader();

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const res = await fetch(path, {
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(isFormData || body === undefined ? {} : { "Content-Type": "application/json" }),
      ...auth,
      ...headers,
    },
    body: isFormData ? body : body === undefined ? undefined : JSON.stringify(body),
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok || payload?.success === false) {
    const err = payload?.error || {};
    throw new ApiError(
      err.message || `Request failed (${res.status})`,
      res.status,
      err.code || "ERROR",
      err.details
    );
  }

  return payload?.data;
}

export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: "POST", body }),
  patch: (path, body) => apiFetch(path, { method: "PATCH", body }),
  del: (path, body) => apiFetch(path, { method: "DELETE", body }),
  upload: (path, formData) => apiFetch(path, { method: "POST", body: formData }),
};

/** Turn an ApiError's field details into { field: message } for form display. */
export function fieldErrors(err) {
  if (!err?.details) return {};
  if (Array.isArray(err.details)) {
    const out = {};
    for (const d of err.details) {
      if (d.field && !out[d.field]) out[d.field] = d.message;
    }
    return out;
  }
  return err.details;
}

/**
 * Open a server-rendered document (receipt, invoice) in a new tab, where the
 * browser can print it or save it as a PDF.
 *
 * Fetched rather than linked with a plain <a href> on purpose: the Firebase ID
 * token rides in the Authorization header, which a normal navigation cannot
 * set. Going through fetch keeps the download working in production, where
 * there is no session cookie to fall back on.
 */
export async function openDocument(path) {
  const auth = await authHeader();

  let res;
  try {
    res = await fetch(path, {
      credentials: "include",
      headers: { Accept: "text/html,application/json", ...auth },
    });
  } catch {
    throw new ApiError("Network error while loading the document", 0, "NETWORK_ERROR");
  }

  if (!res.ok) {
    let message = `Could not open the document (${res.status})`;
    try {
      const payload = await res.json();
      if (payload?.error?.message) message = payload.error.message;
    } catch {
      /* error body was not JSON */
    }
    throw new ApiError(message, res.status, "ERROR");
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);

  const tab = window.open(objectUrl, "_blank", "noopener,noreferrer");
  if (!tab) {
    URL.revokeObjectURL(objectUrl);
    throw new ApiError("Allow pop-ups for this site to view the receipt", 0, "POPUP_BLOCKED");
  }

  // The blob URL is only valid in this document, so revoke it once the new tab
  // has had time to load the content.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  return true;
}