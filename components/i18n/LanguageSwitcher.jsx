"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useTranslation } from "./LanguageProvider";

const LANGUAGES = [
  { code: "en", label: "English", short: "EN", nativeLabel: "English" },
  { code: "ta", label: "Tamil", short: "TA", nativeLabel: "தமிழ்" },
];

export default function LanguageSwitcher({ className = "", align = "auto" }) {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ horizontal: "right", vertical: "down" });
  const containerRef = useRef(null);

  const currentLang = LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  // Outside click and Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Compute smart position when opening
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceRight = window.innerWidth - rect.right;

    let horizontal = "right";
    if (align === "left") {
      horizontal = "left";
    } else if (align === "right") {
      horizontal = "right";
    } else {
      // Auto: if close to left screen edge, align left; otherwise align right
      horizontal = rect.left < 160 && spaceRight > 160 ? "left" : "right";
    }

    // Drop up if cramped at bottom (< 120px) and sufficient room above
    const vertical = spaceBelow < 120 && rect.top > 120 ? "up" : "down";

    setMenuPosition({ horizontal, vertical });
  }, [isOpen, align]);

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select language, currently ${currentLang.nativeLabel}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-98"
      >
        <span className="tracking-wide uppercase">{currentLang.short}</span>
        <ChevronDown
          className={`size-3.5 text-slate-500 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-slate-700" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Languages"
          className={`absolute z-50 min-w-[140px] rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 ${
            menuPosition.vertical === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${menuPosition.horizontal === "left" ? "left-0" : "right-0"}`}
        >
          {LANGUAGES.map((lang) => {
            const isSelected = locale === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLocale(lang.code);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                  isSelected
                    ? "bg-brand-50 font-bold text-brand-700"
                    : "font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1 py-0.5 text-[10px] font-bold ${
                      isSelected
                        ? "bg-brand-100/80 text-brand-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {lang.short}
                  </span>
                  <span>{lang.nativeLabel}</span>
                </div>
                {isSelected && <Check className="size-3.5 text-brand-600 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
