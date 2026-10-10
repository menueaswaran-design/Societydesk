import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { firebaseConfig, firebaseEnabled } from "./config.js";

/** Presence-only gate cookie read by middleware.js. */
export const SESSION_COOKIE = "__session";

/**
 * How long the gate cookie survives. It is only a cheap "is anyone signed in"
 * hint for the middleware matcher - every request is still authenticated by
 * verifying the real Firebase ID token (Authorization header or this cookie).
 */
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function firebaseClientConfigured() {
  return firebaseEnabled;
}

export function getFirebaseApp() {
  if (!firebaseClientConfigured()) return null;
  return getApps()[0] ?? initializeApp(firebaseConfig);
}

export function getFirebaseClient() {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

/** Current user's Firebase ID token, or null when Firebase is not configured. */
export async function getIdToken() {
  const auth = getFirebaseClient();
  if (!auth) return null;
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

/**
 * Mirror the signed-in user into the __session cookie so middleware and Server
 * Components (which never see an Authorization header) can recognise them.
 * Clears the cookie when there is no user.
 */
export async function syncSessionCookie(user) {
  if (typeof document === "undefined") return false;

  const current = user ?? getFirebaseClient()?.currentUser ?? null;
  if (!current) {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
    return true;
  }

  try {
    const token = await current.getIdToken();
    document.cookie = `${SESSION_COOKIE}=${token}; path=/; max-age=${SESSION_COOKIE_MAX_AGE}; samesite=lax`;
    return true;
  } catch {
    return false;
  }
}

let analyticsInstance = null;

/**
 * Lazily start Firebase Analytics in the browser. Safe to call from anywhere:
 * it is a no-op during SSR, when measurementId is missing, or when the browser
 * does not support analytics.
 */
export async function getFirebaseAnalytics() {
  if (typeof window === "undefined") return null;
  const app = getFirebaseApp();
  if (!app || !firebaseConfig.measurementId) return null;
  if (analyticsInstance) return analyticsInstance;

  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    if (!(await isSupported())) return null;
    analyticsInstance = getAnalytics(app);
  } catch {
    return null;
  }
  return analyticsInstance;
}

export {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  onAuthStateChanged,
  onIdTokenChanged,
  signOut,
} from "firebase/auth";
