"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  ShieldCheck,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  KeyRound,
} from "lucide-react";
import Button, { Spinner } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ui/Feedback";
import { api } from "@/lib/client/api";
import { homeForRole } from "@/lib/routing";
import { titleCase } from "@/lib/format";
import { useTranslation } from "@/components/i18n/LanguageProvider";

const ROLE_BADGE = {
  OWNER: {
    icon: Building2,
    badge: "bg-primary-50 text-primary-700 ring-1 ring-primary-600/20",
    label: "PG Owner",
    labelTa: "பிஜி உரிமையாளர்",
  },
  MANAGER: {
    icon: ShieldCheck,
    badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20",
    label: "PG Manager",
    labelTa: "பிஜி மேலாளர்",
  },
  SOCIETY_ADMIN: {
    icon: Building2,
    badge: "bg-primary-50 text-primary-700 ring-1 ring-primary-600/20",
    label: "Society Admin",
    labelTa: "குடியிருப்பு நிர்வாகி",
  },
  FLAT_ADMIN: {
    icon: ShieldCheck,
    badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20",
    label: "Flat Admin",
    labelTa: "வீட்டு நிர்வாகி",
  },
  RESIDENT: {
    icon: User,
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    label: "Resident",
    labelTa: "குடியிருப்பாளர்",
  },
};

const ROLE_BLURB = {
  OWNER: "Full control: rooms, beds, rent billing, security deposits & staff",
  MANAGER: "Day-to-day operations: resident check-in, rent collection, complaints & notices",
  SOCIETY_ADMIN: "Full oversight: society bills, complaints, residents and notices",
  FLAT_ADMIN: "Manages flat members, unit maintenance & payments",
  RESIDENT: "View room/bed, pay rent online, view deposit status & raise complaints",
};

const ROLE_BLURB_TA = {
  OWNER: "முழு கட்டுப்பாடு: அறைகள், படுக்கைகள், வாடகை & முன்பணம்",
  MANAGER: "தினசரி செயல்பாடுகள்: வாடகை வசூல், புகார்கள் & அறிவிப்புகள்",
  SOCIETY_ADMIN: "முழுக் குடியிருப்பு: வீடுகள், கட்டணங்கள், புகார்கள் & அறிவிப்புகளை நிர்வகிக்கிறார்",
  FLAT_ADMIN: "தனது வீட்டின் குடியிருப்பாளர்கள், கட்டணங்கள் மற்றும் புகார்களை நிர்வகிக்கிறார்",
  RESIDENT: "தனது வாடகை, முன்பணம், புகார்கள், அறிவிப்புகளைப் பார்க்கிறார்",
};

const FALLBACK_ACCOUNTS = [
  {
    email: "owner@srilakshmipg.local",
    name: "Suresh Reddy",
    role: "OWNER",
    society: { name: "Sri Lakshmi Luxury PG & Coliving" },
  },
  {
    email: "manager@srilakshmipg.local",
    name: "Venkatesh Babu",
    role: "MANAGER",
    society: { name: "Sri Lakshmi Luxury PG & Coliving" },
  },
  {
    email: "resident@srilakshmipg.local",
    name: "Karthik Raja",
    role: "RESIDENT",
    society: { name: "Sri Lakshmi Luxury PG & Coliving" },
  },
  {
    email: "admin@greenvalley.local",
    name: "Anand Murthy",
    role: "SOCIETY_ADMIN",
    society: { name: "Green Valley Apartments" },
  },
];

export default function LoginForm({ next }) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [mode, setMode] = useState("loading"); // loading | dev | firebase
  const [firebaseAvailable, setFirebaseAvailable] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [pending, setPending] = useState(null);
  const [error, setError] = useState(null);
  const [fieldError, setFieldError] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({ email: "", password: "" });

  const loadDevAccounts = useCallback(async () => {
    setMode("loading");
    try {
      const rows = await api.get("/api/auth/dev-accounts");
      // Never expose SUPER_ADMIN on public demo cards
      setAccounts(rows.filter((r) => r.role !== "SUPER_ADMIN"));
    } catch {
      setAccounts(FALLBACK_ACCOUNTS);
    }
    setMode("dev");
  }, []);

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
    window.location.href = nextPath || "/";
  }

  async function devSignIn(email) {
    setPending(email);
    setError(null);
    try {
      try {
        const { getFirebaseClient, signOut } = await import("@/lib/firebase/client");
        const auth = getFirebaseClient();
        if (auth?.currentUser) await signOut(auth);
      } catch {
        /* ignore */
      }
      if (typeof document !== "undefined") {
        document.cookie = "__session=; path=/; max-age=0; samesite=lax";
      }

      const user = await api.post("/api/auth/dev-login", { email });
      const target = next && next !== "/" ? next : homeForRole(user?.role);
      go(target);
    } catch (err) {
      setError(err?.message || "Could not sign in with demo account");
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
      await syncSessionCookie(credential.user);

      let target = next && next !== "/" ? next : null;
      if (!target) {
        try {
          const me = await api.get("/api/auth/me");
          const role = me?.user?.role || me?.role;
          target = homeForRole(role);
        } catch {
          if (
            form.email.toLowerCase().includes("superadmin") ||
            form.email.toLowerCase().includes("bedy") ||
            form.email.toLowerCase() === "kumarvignesh865@gmail.com"
          ) {
            target = "/super-admin/dashboard";
          } else {
            target = "/admin/dashboard";
          }
        }
      }
      go(target);
    } catch (err) {
      setError(firebaseMessage(err));
      setPending(null);
    }
  }

  if (mode === "loading") {
    return (
      <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-8 shadow-xs">
        <Spinner className="size-6 text-primary-600" />
        <p className="text-xs font-medium text-slate-500">
          {locale === "ta" ? "சரிபார்க்கிறது..." : "Connecting..."}
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------- Dev Demo Accounts
  if (mode === "dev") {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs text-amber-950">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-bold tracking-tight text-amber-900">
              <Sparkles className="size-3.5 text-amber-600" />
              {locale === "ta" ? "சோதனை மாதிரிகள் (Demo Roles)" : "Instant Demo Access"}
            </span>
            {firebaseAvailable ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("firebase");
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 underline-offset-2 hover:text-amber-950 hover:underline"
              >
                <KeyRound className="size-3" />
                {locale === "ta" ? "கடவுச்சொல் உள்நுழைவு" : "Use password"}
              </button>
            ) : null}
          </div>
          <p className="mt-1 leading-relaxed text-amber-800/90 text-[11.5px]">
            {locale === "ta"
              ? "ஒரு கிளிக்கில் நீங்கள் விரும்பும் பொறுப்பில் உள்நுழைந்து கணினியை சோதிக்கவும்."
              : "Click any account below to explore that role instantly without entering a password."}
          </p>
        </div>

        {error ? <ErrorBanner error={error} /> : null}

        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          {accounts.map((acc, i) => {
            const roleMeta = ROLE_BADGE[acc.role] || {
              icon: User,
              badge: "bg-slate-100 text-slate-700",
              label: titleCase(acc.role),
              labelTa: titleCase(acc.role),
            };
            const Icon = roleMeta.icon;
            const busy = pending === acc.email;

            return (
              <button
                key={acc.email}
                onClick={() => devSignIn(acc.email)}
                disabled={Boolean(pending)}
                className={`group flex w-full items-center gap-3.5 p-4 sm:px-5 sm:py-4.5 text-left transition-all hover:bg-slate-50/80 disabled:opacity-60 ${
                  i > 0 ? "border-t border-slate-100" : ""
                }`}
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-primary-50 group-hover:text-primary-600">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-900 group-hover:text-primary-700">
                      {acc.name}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium ${roleMeta.badge}`}
                    >
                      {locale === "ta" ? roleMeta.labelTa : roleMeta.label}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500 font-mono">
                    {acc.email}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    {locale === "ta" && ROLE_BLURB_TA[acc.role]
                      ? ROLE_BLURB_TA[acc.role]
                      : ROLE_BLURB[acc.role]}
                  </p>
                </div>
                <div className="shrink-0 pl-1">
                  {busy ? (
                    <Loader2 className="size-4 animate-spin text-primary-600" />
                  ) : (
                    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-slate-100/70 text-slate-400 transition-all group-hover:bg-primary-600 group-hover:text-white">
                      <ArrowRight className="size-3.5" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- Real Sign-In Form
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
      <form onSubmit={firebaseSignIn} className="space-y-4">
        <ErrorBanner error={error} />

        <Input
          id="email"
          label={t("auth.email", "Email address")}
          type="email"
          autoComplete="email"
          required
          autoFocus
          placeholder="name@society.com"
          value={form.email}
          error={fieldError.email}
          prefix={<Mail className="text-slate-400" />}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <Input
          id="password"
          label={t("auth.password", "Password")}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
          placeholder="••••••••"
          value={form.password}
          error={fieldError.password}
          prefix={<Lock className="text-slate-400" />}
          labelRight={
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors"
            >
              {t("auth.forgotPassword", "Forgot password?")}
            </Link>
          }
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
              className="rounded p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-300"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <Button
          type="submit"
          size="lg"
          loading={pending === "firebase"}
          className="mt-2 w-full font-medium"
        >
          {pending === "firebase"
            ? locale === "ta"
              ? "உள்நுழைகிறது..."
              : "Signing in..."
            : t("auth.signIn", "Sign in to account")}
          {pending === "firebase" ? null : <ArrowRight className="size-4" />}
        </Button>
      </form>

      {/* Demo Switcher */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200/80" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 font-medium text-slate-400">
            {locale === "ta" ? "அல்லது" : "Or explore first"}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={loadDevAccounts}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/70 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
      >
        <Sparkles className="size-3.5 text-amber-500" />
        {locale === "ta" ? "மாதிரிக் கணக்குகளைத் திறக்க (Demo)" : "Explore with sample demo accounts"}
      </button>

      {/* Security badge */}
      <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
        <Shield className="size-3 text-slate-400" />
        <span>256-bit SSL encrypted · Role-based access</span>
      </div>
    </div>
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
