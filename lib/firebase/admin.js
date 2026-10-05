import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Firebase Admin is initialised lazily and only once. All env vars are read on
// the server; none of them are ever exposed to the browser.
let adminAuth = null;

function isConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

export function firebaseAdminConfigured() {
  return isConfigured();
}

export function getAdminAuth() {
  if (adminAuth) return adminAuth;
  if (!isConfigured()) return null;

  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });

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
    return await auth.verifyIdToken(token, true);
  } catch (err) {
    console.warn("[auth] token verification failed:", err?.message);
    return null;
  }
}