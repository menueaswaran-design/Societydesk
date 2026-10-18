"use client";

import { Globe } from "lucide-react";
import { useTranslation } from "./LanguageProvider";

export default function LanguageSwitcher({ className = "" }) {
  const { locale, setLocale } = useTranslation();

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/90 p-0.5 text-xs font-medium shadow-xs ${className}`}
      role="group"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        title="Switch to English"
        aria-pressed={locale === "en"}
        className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
          locale === "en"
            ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-900/5"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <span>English</span>
      </button>
      <button
        type="button"
        onClick={() => setLocale("ta")}
        title="தமிழுக்கு மாறவும்"
        aria-pressed={locale === "ta"}
        className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
          locale === "ta"
            ? "bg-brand-600 text-white shadow-xs"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <span>தமிழ்</span>
      </button>
    </div>
  );
}
