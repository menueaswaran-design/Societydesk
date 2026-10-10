import "server-only";
import { ApiError, unprocessable } from "../errors.js";
import { firebaseConfig } from "./config.js";

/**
 * Firebase identity from the server, via the identitytoolkit REST API.
 *
 * firebase-admin's createUser() needs a service account, which this project
 * does not have, so the web API key is the only server-side way to provision
 * an email/password login. The same pattern as scripts/bootstrap-superadmin.js.
 */

async function identityRequest(method, body) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${firebaseConfig.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result?.error?.message || "Firebase Auth request failed.");
    error.identityCode = result?.error?.message || "UNKNOWN";
    throw error;
  }
  return result;
}

function identityError(error) {
  switch (error.identityCode) {
    case "INVALID_EMAIL":
      return unprocessable("Validation failed", { adminEmail: "Enter a valid email" });
    case "WEAK_PASSWORD":
      return unprocessable("Validation failed", { adminPassword: "Password must be at least 6 characters" });
    case "OPERATION_NOT_ALLOWED":
    case "CONFIGURATION_NOT_FOUND":
      return new ApiError(
        "Email/password sign-in is not enabled in Firebase Authentication. Enable it under Authentication → Sign-in method.",
        400,
        "FIREBASE_NOT_CONFIGURED"
      );
    case "INVALID_API_KEY":
      return new ApiError(
        "Firebase rejected the API key in lib/firebase/config.js.",
        400,
        "FIREBASE_NOT_CONFIGURED"
      );
    default:
      return new ApiError(`Could not create the login: ${error.message}`, 502, "FIREBASE_ERROR");
  }
}

/**
 * Ensure `email` can sign in to Firebase with `password`.
 *
 * Returns `{ uid, created }` — `created` is false when the account already
 * existed AND the supplied password still authenticates it, which is the only
 * case where adopting the existing identity is safe. Callers use `created` to
 * decide whether a failed follow-up write may clean the account up again.
 */
export async function createFirebaseUser(email, password) {
  try {
    const result = await identityRequest("signUp", { email, password, returnSecureToken: false });
    return { uid: result.localId, created: true };
  } catch (error) {
    if (error.identityCode !== "EMAIL_EXISTS") throw identityError(error);
  }

  try {
    const result = await identityRequest("signInWithPassword", {
      email,
      password,
      returnSecureToken: false,
    });
    return { uid: result.localId, created: false };
  } catch (error) {
    if (error.identityCode === "INVALID_LOGIN_CREDENTIALS" || error.identityCode === "INVALID_PASSWORD") {
      throw unprocessable("Validation failed", {
        adminEmail: "This email already has a Firebase account with a different password",
      });
    }
    throw identityError(error);
  }
}

/**
 * Best-effort removal of an account this request just created, used when the
 * Postgres write fails so no orphan Firebase login is left behind.
 */
export async function discardFirebaseUser(email, password) {
  try {
    const { idToken } = await identityRequest("signInWithPassword", {
      email,
      password,
      returnSecureToken: true,
    });
    await identityRequest("delete", { idToken });
  } catch {
    /* nothing to clean up, or cleanup already impossible */
  }
}
