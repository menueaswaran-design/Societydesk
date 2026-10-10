"use client";

import { useEffect } from "react";

/**
 * One-time browser bootstrap for Firebase.
 *
 * Keeps the signed-in user mirrored into the __session cookie (middleware and
 * Server Components read it) and starts Analytics. Renders nothing.
 */
export default function FirebaseBootstrap() {
  useEffect(() => {
    let cancelled = false;
    let unsubscribe = null;

    (async () => {
      try {
        const client = await import("@/lib/firebase/client");
        if (cancelled || !client.firebaseClientConfigured()) return;

        const auth = client.getFirebaseClient();
        if (!auth) return;

        unsubscribe = client.onIdTokenChanged(auth, (user) => {
          if (!cancelled) client.syncSessionCookie(user);
        });

        client.getFirebaseAnalytics().catch(() => {});
      } catch {
        /* Firebase unavailable - the app keeps using the dev session */
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return null;
}
