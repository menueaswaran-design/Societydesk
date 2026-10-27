import Link from "next/link";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

/**
 * Clean, full-page modern layout for public pages (Features, Pricing, Terms, Privacy, Refund, Contact, Login):
 * - No dark mood or split-screen side panels
 * - Full-width, airy, crisp light aesthetic
 * - Clean top navigation and footer
 */
export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-950 antialiased">
      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="Bedy"
              className="size-9 object-contain rounded-xl shadow-2xs group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-950 leading-tight">
                  Bedy
                </span>
                <span className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.2 text-[9px] font-bold text-emerald-800 uppercase tracking-wide">
                  PG & Hostel
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium leading-none hidden xs:block">
                Operations Management OS
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <Link href="/" className="hover:text-emerald-700 transition-colors">
              Home
            </Link>
            <Link href="/#features" className="hover:text-emerald-700 transition-colors">
              Features
            </Link>
            <Link href="/#pricing" className="hover:text-emerald-700 transition-colors">
              Pricing Plans
            </Link>
            <Link href="/contact" className="hover:text-emerald-700 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-3">
            <div className="scale-90 sm:scale-100 origin-right">
              <LanguageSwitcher />
            </div>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all shadow-2xs"
            >
              <span>Sign In</span>
            </Link>

            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1 rounded-xl bg-slate-950 hover:bg-slate-800 text-white px-3.5 py-2 text-xs font-bold transition-all shadow-sm"
            >
              <span>← Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Full Page Content ─────────────────────────────────────────── */}
      <main className="flex-1 w-full bg-white">{children}</main>

      {/* ── Clean Light Footer ────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-slate-50/70 py-10 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Bedy" className="size-7 object-contain rounded-lg" />
              <span className="font-bold text-slate-900 text-sm">Bedy</span>
              <span>·</span>
              <span>Smart PG, Hostel & Co-Living Operations</span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-5 gap-y-2 font-medium text-slate-600">
              <Link href="/features" className="hover:text-slate-900 transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="hover:text-slate-900 transition-colors">
                Pricing
              </Link>
              <Link href="/contact" className="hover:text-slate-900 transition-colors">
                Contact
              </Link>
              <Link href="/refund-policy" className="hover:text-slate-900 transition-colors">
                Refund Policy
              </Link>
              <Link href="/terms" className="hover:text-slate-900 transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-slate-900 transition-colors">
                Privacy
              </Link>
              <Link href="/login" className="hover:text-slate-900 transition-colors font-semibold text-emerald-700">
                Sign In
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} Bedy Technologies. All rights reserved.</span>
            <span>Made with ❤️ for PG & Hostel Operators in India</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
