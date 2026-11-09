"use client";

import { useTranslation } from "@/components/i18n/LanguageProvider";

export function LoginHeader() {
  const { t } = useTranslation();
  return (
    <div className="mb-4 text-center">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
        {t("auth.welcomeTitle", "Welcome back")}
      </h1>
      <p className="mt-1 text-xs text-slate-500">
        {t(
          "auth.welcomeSubtitle",
          "Sign in to manage your PG, hostel & co-living property."
        )}
      </p>
    </div>
  );
}

export function LoginFooter() {
  return null;
}
