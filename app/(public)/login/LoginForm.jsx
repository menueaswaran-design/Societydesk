"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, User, ShieldCheck, Loader2, Mail, Lock, ArrowRight, FlaskConical } from "lucide-react";
import Button, { Spinner } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ui/Feedback";
import { api } from "@/lib/client/api";
import { homeForRole } from "@/lib/routing";
import { titleCase } from "@/lib/format";

const ROLE_ICON = {
  SUPER_ADMIN: ShieldCheck,
  SOCIETY_ADMIN: Building2,
  RESIDENT: User,
};

const ROLE_BLURB = {
  SUPER_ADMIN: "Manages societies across the platform",
  SOCIETY_ADMIN: "Runs one society: flats, billing, complaints",
  RESIDENT: "Sees their own dues, complaints and notices",
};

const FALLBACK_ACCOUNTS = [
  { email: "superadmin@societydesk.local", name: "Platform Owner", role: "SUPER_ADMIN", societyId: null, society: null },
  { email: "admin@greenvalley.local", name: "Lakshmi Iyer", role: "SOCIETY_ADMIN", societyId: "gva", society: { name: "Green Valley Apartments" } },
  { email: "ravi@greenvalley.local", name: "Ravi Kumar", role: "RESIDENT", societyId: "gva", society: { name: "Green Valley Apartments" } },
];

export default function LoginForm({ next }) {
  const router = useRouter();
  const [mode, setMode] = useState("loading"); // loading | dev | firebase
  const [firebaseAvailable, setFirebaseAvailable] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState(null);
  const [fieldError, setFieldError] = useState({});

  const [form, setForm] = useState({ email: "", password: "" });

  const loadDevAccounts = useCallback(async () => {
    setMode("loading");
    try {
      const rows = await api.get("/api/auth/dev-accounts");
      setAccounts(rows);
    } catch {
      setAccounts(FALLBACK_ACCOUNTS);
    }
    setMode("dev");
  }, []);

  // Decide which sign-in experience to show: real Firebase when it is
  // configured in lib/firebase/config.js, otherwise the seeded dev accounts.
  useEffect(() => {
    let cancelled = false;

    async function detect() {
      let configured = false;
      try {
        const { firebaseClientConfigured } = await import("@/lib/firebase/client");
        configured = firebaseClientConfigured();
      } catch {
        configured = false;
      }
      if (cancelled) return;

      setFirebaseAvailable(configured);
      if (configured) setMode("firebase");
      else await loadDevAccounts();
    }

    detect();
    return () => {
      cancelled = true;
    };
  }, [loadDevAccounts]);

  function go(nextPath) {
    router.push(nextPath || "/");
    router.refresh();
  }

  async function devSignIn(email) {
    setPending(email);
    setError(null);
    try {
      const user = await api.post("/api/auth/dev-login", { email });
      go(next || homeForRole(user.role));
    } catch (err) {
      setError(err.message);
      setPending(null);
    }
  }

  async function firebaseSignIn(e) {
    e.preventDefault();
    setError(null);
    setFieldError({});
    setPending("firebase");

    try {
      const { getFirebaseClient, signInWithEmailAndPassword, syncSessionCookie } = await import(
        "@/lib/firebase/client"
      );
      const auth = getFirebaseClient();
      if (!auth) throw new Error("Firebase is not configured");

      const credential = await signInWithEmailAndPassword(auth, form.email, form.password);
      // Middleware only looks at the __session cookie, so it has to exist
      // before the navigation or the redirect would bounce straight back here.
      await syncSessionCookie(credential.user);
      go(next || "/");
    } catch (err) {
      setError(firebaseMessage(err));
      setPending(null);
    }
  }

  if (mode === "loading") {
    return (
      <div className="surface flex h-40 items-center justify-center">
        <Spinner className="text-brand-500" />
      </div>
    );
  }

  if (mode === "dev") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-[13px] text-amber-900 ring-1 ring-amber-200/80">
          <FlaskConical className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p>
            <span className="font-semibold">Development mode.</span>{" "}
            {firebaseAvailable
              ? "Seeded accounts are a shortcut for exploring each role."
              : "Firebase is not configured, so pick a seeded account to explore each role."}
            {firebaseAvailable ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("firebase");
                }}
                className="ml-1 font-semibold text-brand-700 underline-offset-2 hover:underline"
              >
                Sign in with email
              </button>
            ) : null}
          </p>
        </div>

        {error ? <ErrorBanner error={error} /> : null}

        <div className="surface overflow-hidden">
          {accounts.map((acc, i) => {
            const Icon = ROLE_ICON[acc.role] ?? User;
            const busy = pending === acc.email;
            return (
              <button
                key={acc.email}
                onClick={() => devSignIn(acc.email)}
                disabled={Boolean(pending)}
                className={`group flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-brand-50/50 disabled:opacity-60 ${i > 0 ? "border-t border-slate-100" : ""}`}
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-white group-hover:text-brand-600 group-hover:shadow-soft">
                  <Icon className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {acc.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {titleCase(acc.role)}
                    {acc.society ? ` · ${acc.society.name}` : " · Platform"}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                    {ROLE_BLURB[acc.role]}
                  </span>
                </span>
                {busy ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-brand-500" />
                ) : (
                  <ArrowRight className="size-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={firebaseSignIn} className="surface p-6">
      <ErrorBanner error={error} />

      <div className="mt-1 flex flex-col gap-4">
        <Input
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          error={fieldError.email}
          prefix={<Mail />}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          error={fieldError.password}
          prefix={<Lock />}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Button type="submit" size="lg" loading={pending === "firebase"} className="mt-1 w-full">
          {pending === "firebase" ? "Signing in" : "Sign in"}
          {pending === "firebase" ? null : <ArrowRight />}
        </Button>
      </div>

      <p className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
        Residents, admins and platform owners all sign in here.{" "}
        <Link href="/forgot-password" className="font-semibold text-brand-700 hover:text-brand-800">
          Forgot password?
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-slate-400">
        <button
          type="button"
          onClick={loadDevAccounts}
          className="underline-offset-2 hover:text-brand-700 hover:underline"
        >
          Use a demo account
        </button>
      </p>
    </form>
  );
}

function firebaseMessage(err) {
  const code = err?.code ?? "";
  if (
    code.includes("invalid-credential") ||
    code.includes("wrong-password") ||
    code.includes("user-not-found")
  ) {
    return "Email or password is incorrect";
  }
  if (code.includes("too-many-requests")) return "Too many attempts. Try again in a moment.";
  if (code.includes("network-request-failed")) return "Network error. Check your connection.";
  return err?.message ?? "Could not sign in";
}
