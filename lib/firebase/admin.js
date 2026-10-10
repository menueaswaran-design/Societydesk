import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { firebaseConfig } from "./config.js";

/**
 * Optional service account (server only - never exposed to the browser).
 *
 * When it is present the Admin SDK gets full privileges (user management,
 * revocation checks). When it is absent the SDK is initialised with just the
 * project id, which is enough to verify ID tokens: the public certs are fetched
 * from Google and the issuer/audience are derived from the project id.
 */
const SERVICE_ACCOUNT = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

// Firebase Admin is initialised lazily and only once.
let adminAuth = null;

function hasServiceAccount() {
  return Boolean(
    SERVICE_ACCOUNT.projectId && SERVICE_ACCOUNT.clientEmail && SERVICE_ACCOUNT.privateKey
  );
}

function isConfigured() {
  return hasServiceAccount() || Boolean(firebaseConfig.projectId);
}

export function firebaseAdminConfigured() {
  return isConfigured();
}

export function getAdminAuth() {
  if (adminAuth) return adminAuth;
  if (!isConfigured()) return null;

  const app =
    getApps()[0] ??
    (hasServiceAccount()
      ? initializeApp({
          credential: cert({
            projectId: SERVICE_ACCOUNT.projectId,
            clientEmail: SERVICE_ACCOUNT.clientEmail,
            privateKey: SERVICE_ACCOUNT.privateKey.replace(/\\n/g, "\n"),
          }),
        })
      : initializeApp({ projectId: firebaseConfig.projectId }));

  adminAuth = getAuth(app);
  return adminAuth;
}

/**
 * Verify a Firebase ID token and return its decoded payload.
 * Returns null when the token is absent or invalid.
 */
export async function verifyIdToken(token) {
  const auth = getAdminAuth();
  if (!auth || !token) return null;
  try {
    // Revocation checks hit the Auth backend with the service account, so they
    // are only attempted when one is configured.
    return await auth.verifyIdToken(token, hasServiceAccount());
  } catch (err) {
    console.warn("[auth] token verification failed:", err?.message);
    return null;
  }
}
