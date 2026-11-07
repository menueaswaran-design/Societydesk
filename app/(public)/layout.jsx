import Link from "next/link";
import PublicHeaderActions from "@/components/layout/PublicHeaderActions";
import PublicFooter from "@/components/layout/PublicFooter";

/**
 * Clean, full-page modern layout for public pages (Features, Pricing, Terms, Privacy, Refund, Contact, Login):
 * - No dark mood or split-screen side panels
 * - Full-width, airy, crisp light aesthetic
 * - Clean top navigation and responsive actions
 */
export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F8FAFF] text-[#10192E] flex flex-col font-sans selection:bg-brand-100 selection:text-brand-900 antialiased">
      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5EAF3]">
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
                <span className="text-lg font-black tracking-tight text-neutral-950 leading-tight">
                  Bedy
                </span>
                <span className="rounded-full bg-brand-50 border border-brand-200/80 px-2 py-0.2 text-[9px] font-bold text-brand-700 uppercase tracking-wide">
                  PG & Hostel
                </span>
              </div>
              <span className="text-[10px] text-neutral-500 font-medium leading-none hidden xs:block">
                Operations Management OS
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-neutral-600">
            <Link href="/" className="hover:text-brand-600 transition-colors">
              Home
            </Link>
            <Link href="/features" className="hover:text-brand-600 transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-brand-600 transition-colors">
              Pricing Plans
            </Link>
            <Link href="/services" className="hover:text-brand-600 transition-colors">
              Services
            </Link>
            <Link href="/about" className="hover:text-brand-600 transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-brand-600 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right Action Cluster (Language Switcher, Sign In, Back to Home) */}
          <PublicHeaderActions />
        </div>
      </header>

      {/* ── Full Page Content ─────────────────────────────────────────── */}
      <main className="flex-1 w-full flex flex-col">{children}</main>

      {/* ── Clean Light Footer (Hidden on /login & /forgot-password) ─── */}
      <PublicFooter />
    </div>
  );
}
