import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function firebaseClientConfigured() {
  return false;
}

export function getFirebaseApp() {
  if (!firebaseClientConfigured()) return null;
  return getApps()[0] ?? initializeApp(config);
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

export {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";