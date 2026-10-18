"use client";

import Link from "next/link";
import { useTranslation } from "@/components/i18n/LanguageProvider";

export function LoginHeader() {
  const { t } = useTranslation();
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        {t("auth.welcomeTitle", "Welcome back")}
      </h1>
      <p className="mt-2 text-[15px] text-slate-500">
        {t(
          "auth.welcomeSubtitle",
          "Sign in to manage billing, complaints and notices for your society."
        )}
      </p>
    </div>
  );
}

export function LoginFooter() {
  const { t } = useTranslation();
  return (
    <p className="mt-6 text-center text-[13px] text-slate-500">
      {t("auth.troubleSigningIn", "Trouble signing in?")}{" "}
      <Link
        href="/forgot-password"
        className="rounded font-semibold text-brand-700 transition-colors hover:text-brand-800"
      >
        {t("auth.resetPassword", "Reset your password")}
      </Link>
    </p>
  );
}

