"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { dictionaries, DEFAULT_LOCALE, resolveKey, SUPPORTED_LOCALES } from "@/lib/i18n";

const LanguageContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  toggleLocale: () => {},
  t: (key, fallback) => fallback ?? key,
});

export function LanguageProvider({ children, initialLocale = DEFAULT_LOCALE }) {
  const [locale, setLocaleState] = useState(initialLocale);

  // Sync with saved preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sd_locale");
      if (saved && SUPPORTED_LOCALES.includes(saved)) {
        setLocaleState(saved);
        return;
      }
      // Check cookies
      const match = document.cookie.match(/(?:^|;\s*)sd_locale=([^;]+)/);
      if (match && SUPPORTED_LOCALES.includes(match[1])) {
        setLocaleState(match[1]);
      }
    } catch {
      /* ignore storage access restrictions */
    }
  }, []);

  const setLocale = useCallback((newLocale) => {
    if (!SUPPORTED_LOCALES.includes(newLocale)) return;
    setLocaleState(newLocale);
    try {
      localStorage.setItem("sd_locale", newLocale);
      document.cookie = `sd_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      /* ignore storage access restrictions */
    }
  }, []);

  const toggleLocale = useCallback(() => {
    const next = locale === "en" ? "ta" : "en";
    setLocale(next);
  }, [locale, setLocale]);

  const t = useCallback(
    (key, fallback) => {
      const dict = dictionaries[locale] || dictionaries.en;
      return resolveKey(dict, key, fallback);
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t,
    }),
    [locale, setLocale, toggleLocale, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

