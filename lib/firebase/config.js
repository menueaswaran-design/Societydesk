/**
 * Firebase web app configuration.
 *
 * Kept as a plain file on purpose (no NEXT_PUBLIC_ env vars) - Firebase client
 * config is public by design: it ships to the browser on every page load and
 * is protected by Firebase Auth domain rules + security rules, not by secrecy.
 *
 * Server-only secrets (the Admin service account) live in .env and are read by
 * lib/firebase/admin.js - never put them here.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyBWaATMxj6BS94ENw1DUvJ8kqTnxaOKLIA",
  authDomain: "flatmanage-206b1.firebaseapp.com",
  projectId: "flatmanage-206b1",
  storageBucket: "flatmanage-206b1.firebasestorage.app",
  messagingSenderId: "892385690791",
  appId: "1:892385690791:web:d67df1b2fb27362aa7c782",
  measurementId: "G-FS569X3693",
};

/** True when the file carries a usable config, so callers can branch on it. */
export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
