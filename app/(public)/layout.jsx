import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

/**
 * Clean & modern split layout for public authentication:
 * - Left: Simple, attractive brand showcase with a focused live preview card.
 * - Right: Fast, secure authentication form.
 */
export default function PublicLayout({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr] bg-slate-950 text-slate-100">
      {/* ------------------------------------------------------- Left Brand Panel */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-10 py-12 lg:flex lg:flex-col justify-between xl:px-14 border-r border-slate-800/70">
        {/* Soft atmospheric gradient glow */}
        <div className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-primary-600/15 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 size-96 rounded-full bg-indigo-500/15 blur-[100px]" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-white to-slate-200 text-sm font-black tracking-tight text-slate-950 shadow-md">
            SD
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight">SocietyDesk</span>
              <span className="rounded-full bg-primary-500/15 px-2 py-0.5 text-[10px] font-semibold text-primary-300 border border-primary-500/25">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">Smart Society Management</p>
          </div>
        </div>

        {/* Hero & Single Clean Preview Card */}
        <div className="relative z-10 my-auto py-8 max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium text-slate-300 border border-white/10 mb-5">
            <Sparkles className="size-3 text-amber-400" />
            <span>Modern housing society operating system</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white xl:text-[44px] leading-[1.15]">
            Run your society{" "}
            <span className="bg-gradient-to-r from-primary-300 via-indigo-200 to-emerald-300 bg-clip-text text-transparent">
              with clarity & ease.
            </span>
          </h1>

          <p className="mt-4 text-[15px] leading-relaxed text-slate-300/90">
            Automated maintenance billing, instant WhatsApp payment slips, and tracked complaints — all in one simple, transparent hub.
          </p>

          {/* Simple, Attractive Live Preview Card */}
          <div className="mt-8 rounded-2xl border border-white/15 bg-white/[0.04] p-5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div>
                <p className="text-sm font-bold text-white">Green Valley Apartments</p>
                <p className="text-xs text-slate-400 mt-0.5">120 Flats · October Billing</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                98% Collected
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-white tracking-tight">₹4,25,000</span>
                  <span className="text-xs text-slate-400 ml-1.5">collected</span>
                </div>
                <span className="text-xs font-semibold text-emerald-400">118 / 120 Paid</span>
              </div>

              {/* Smooth progress bar */}
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  style={{ width: "98%" }}
                />
              </div>
            </div>

            {/* 3 Clean Highlight Pills */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
                <span>Auto UPI Invoicing</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
                <span>Instant Receipts</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
                <span>Zero Cash Leakage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Footer Trust Note */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400 font-medium border-t border-white/10 pt-5">
          <ShieldCheck className="size-4 text-emerald-400" />
          <span>Bank-grade 256-bit encryption · Built for Indian Housing Societies & RWAs</span>
        </div>
      </section>

      {/* ------------------------------------------------------- Right Form Column */}
      <section className="flex flex-col bg-slate-50 min-h-screen">
        {/* Top Navbar */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-8 py-3.5">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white">
              SD
            </span>
            <p className="text-sm font-bold text-slate-900">SocietyDesk</p>
          </div>

          {/* Desktop status pill */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Secure Sign-In Portal</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <a
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <span>←</span>
              <span className="hidden sm:inline">Back to website</span>
              <span className="sm:hidden">Home</span>
            </a>
          </div>
        </div>

        {/* Main form area */}
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </section>
    </div>
  );
}
