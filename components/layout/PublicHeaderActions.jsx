"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

export default function PublicHeaderActions() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      <LanguageSwitcher />

      {!isLoginPage && (
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#D2D9E6] bg-white hover:bg-brand-50 hover:text-brand-700 px-3.5 py-2 text-xs font-semibold text-neutral-700 transition-all shadow-2xs"
        >
          <span>Sign In</span>
        </Link>
      )}

      <Link
        href="/"
        className="inline-flex items-center gap-1 rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 text-xs font-bold transition-all shadow-sm shadow-brand-600/20 active:scale-98"
      >
        <span>← Back to Home</span>
      </Link>
    </div>
  );
}
