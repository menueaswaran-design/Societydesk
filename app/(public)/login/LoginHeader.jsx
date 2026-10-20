"use client";

import Link from "next/link";
import { useTranslation } from "@/components/i18n/LanguageProvider";

export function LoginHeader() {
  const { t } = useTranslation();
  return (
    <div className="mb-6 text-center sm:text-left">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
        {t("auth.welcomeTitle", "Welcome back")}
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        {t(
          "auth.welcomeSubtitle",
          "Sign in to manage billing, complaints and notices for your society."
        )}
      </p>
    </div>
  );
}

export function LoginFooter() {
  return null;
}

