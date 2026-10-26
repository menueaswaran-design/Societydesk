"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  KeyRound,
  ArrowRight,
  Wallet,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LogIn,
  Check,
  Sparkles,
  ShieldCheck,
  Users,
  Smartphone,
  ChevronRight,
  BedSingle,
  MessageCircle,
  QrCode,
  Shield,
  Zap,
  TrendingUp,
  XCircle,
  ArrowUpRight,
  Play,
  ChevronDown,
  Layers,
  Globe,
  IndianRupee,
  BarChart3,
  Bell,
  FileText,
  CheckCheck,
  Clock,
  Sliders,
  Calculator,
  Send,
  Download,
  HelpCircle,
  Flame,
  Star,
  RefreshCw,
  Building,
} from "lucide-react";
import { api } from "@/lib/client/api";
import { homeForRole } from "@/lib/routing";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useTranslation } from "@/components/i18n/LanguageProvider";

/* ── Custom Interactive Simulation State ─────────────────────────────────── */

export default function HomePageClient({ user = null }) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const isTa = locale === "ta";

  // Login action state
  const [loggingIn, setLoggingIn] = useState(null);

  // Interactive Hero Dashboard active tab
  const [activeHeroTab, setActiveHeroTab] = useState("whatsapp"); // "whatsapp" | "bedmatrix" | "submeter" | "deposit"

  // Live simulation in WhatsApp preview:
  const [simPaid, setSimPaid] = useState(false);
  const [simLoading, setSimLoading] = useState(false);

  // Interactive ROI Calculator State
  const [calcBeds, setCalcBeds] = useState(40);
  const [calcRent, setCalcRent] = useState(9000);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  // Quick 1-click dev-login function
  const quickLogin = async (email, path) => {
    setLoggingIn(email);
    try {
      try {
        const { getFirebaseClient, signOut } = await import("@/lib/firebase/client");
        const auth = getFirebaseClient();
        if (auth?.currentUser) await signOut(auth);
      } catch {
        /* ignore */
      }
      if (typeof document !== "undefined") {
        document.cookie = "__session=; path=/; max-age=0; samesite=lax";
      }

      const resUser = await api.post("/api/auth/dev-login", { email });
      const target = path || (resUser?.role ? homeForRole(resUser.role) : "/login");
      window.location.href = target;
    } catch {
      window.location.href = "/login";
    }
  };

  // Simulate payment
  const handleSimulatePayment = () => {
    if (simPaid) {
      setSimPaid(false);
      return;
    }
    setSimLoading(true);
    setTimeout(() => {
      setSimLoading(false);
      setSimPaid(true);
    }, 800);
  };

  // Calculate ROI values dynamically
  const roiMonthlyRevenue = useMemo(() => calcBeds * calcRent, [calcBeds, calcRent]);
  const roiHoursSaved = useMemo(() => Math.round((calcBeds / 10) * 5.5 + 4), [calcBeds]);
  const roiLeakageSaved = useMemo(() => Math.round(roiMonthlyRevenue * 0.045), [roiMonthlyRevenue]);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden antialiased">
      {/* ── Background Subtle Glow & Grid Gradients ───────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Top radial spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent blur-3xl opacity-80" />
        {/* Violet secondary accent */}
        <div className="absolute top-[500px] right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* ── Active Session Banner (if logged in) ─────────────────────────── */}
      {user ? (
        <aside className="relative z-50 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-b border-emerald-500/30 text-emerald-100 px-4 py-2 text-xs backdrop-blur-md">
          <div className="mx-auto max-w-7xl flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex size-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
              </span>
              <span className="truncate">
                {isTa ? "செயலில் உள்ள அமர்வு: " : "Signed in as "}
                <strong className="text-white font-semibold">{user.name}</strong> ({user.role})
              </span>
            </div>
            <Link
              href={
                user.role === "SUPER_ADMIN"
                  ? "/super-admin/dashboard"
                  : user.role === "OWNER" || user.role === "MANAGER" || user.role === "SOCIETY_ADMIN"
                  ? "/admin/dashboard"
                  : user.role === "FLAT_ADMIN"
                  ? "/admin/residents"
                  : "/resident/dashboard"
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-200 hover:text-white transition-all shrink-0"
            >
              <span>{isTa ? "டாஷ்போர்டுக்கு செல்" : "Go to Dashboard"}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </aside>
      ) : null}

      {/* ── Modern Floating Glassmorphic Header ─────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex h-16 sm:h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Version Pill */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all duration-300">
              B
              <div className="absolute -inset-0.5 rounded-xl bg-emerald-400/30 blur-xs -z-10 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white leading-none">
                  Bedy
                </span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                  OS 2.0
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5 hidden xs:block">
                PG & Co-Living Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-slate-800/80 bg-slate-900/60 p-1 backdrop-blur-md text-xs font-medium text-slate-300">
            <a
              href="#showcase"
              className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              {isTa ? "நேரடி மாதிரி" : "Live Terminal"}
            </a>
            <a
              href="#features"
              className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              {isTa ? "வசதிகள்" : "Features"}
            </a>
            <a
              href="#submeter"
              className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              {isTa ? "மின் கணக்கீடு" : "Sub-Meters"}
            </a>
            <a
              href="#calculator"
              className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              {isTa ? "வருவாய் கணிப்பான்" : "ROI Calculator"}
            </a>
            <a
              href="#demo-portals"
              className="px-3.5 py-1.5 rounded-full hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              {isTa ? "டெமோ கணக்குகள்" : "Test Drive"}
            </a>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-3">
            <div className="scale-90 sm:scale-100 origin-right">
              <LanguageSwitcher />
            </div>

            {user ? (
              <Link
                href={
                  user.role === "SUPER_ADMIN"
                    ? "/super-admin/dashboard"
                    : user.role === "OWNER" || user.role === "MANAGER" || user.role === "SOCIETY_ADMIN"
                    ? "/admin/dashboard"
                    : user.role === "FLAT_ADMIN"
                    ? "/admin/residents"
                    : "/resident/dashboard"
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 hover:scale-[1.02]"
              >
                <span>{isTa ? "டாஷ்போர்டு" : "Dashboard"}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 px-3.5 py-2 text-xs font-semibold transition-colors"
                >
                  <LogIn className="size-3.5 text-slate-400" />
                  <span>{isTa ? "உள்நுழை" : "Sign In"}</span>
                </Link>

                <a
                  href="#demo-portals"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold px-4 py-2 text-xs transition-all shadow-lg shadow-emerald-500/25 hover:scale-[1.02] cursor-pointer"
                >
                  <Sparkles className="size-3.5" />
                  <span>{isTa ? "இலவச மாதிரி" : "Live Demo"}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1">
        <section className="pt-10 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-6 sm:space-y-8">
              {/* Top Innovation Pill */}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 shadow-inner">
                <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {isTa
                    ? "புதிய Bedy 2.0: வாட்ஸ்அப் யுபிஐ வசூல் & தானியங்கி மின் கணக்கீடு"
                    : "✦ Next-Gen PG OS: 1-Click WhatsApp UPI & Room Sub-Meter Reading Engine"}
                </span>
                <ChevronRight className="size-3 text-emerald-400/80" />
              </div>

              {/* Bold Hero Typography */}
              <h1 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
                {isTa ? (
                  <>
                    விடுதி நிர்வாகம் இனி எளிய விரல்நுனியில்.{" "}
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                      கணக்கு நோட்டுகள் தேவையில்லை.
                    </span>
                  </>
                ) : (
                  <>
                    The Operating System for Modern{" "}
                    <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                      PGs & Co-Living Spaces.
                    </span>
                  </>
                )}
              </h1>

              {/* Punchy Subtitle */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
                {isTa
                  ? "காகித நோட்டுகள், எக்செல் தாள்கள் மற்றும் வாடகை நினைவூட்டல் அழைப்புகளுக்கு முற்றுப்புள்ளி வையுங்கள். படுக்கை வாரியான ஆக்கிரமிப்பு, 1-கிளிக் வாட்ஸ்அப் யுபிஐ வசூல், தனி அறை மின் கட்டணப் பகிர்வு மற்றும் உடனடி வைப்புத்தொகைத் தீர்வு."
                  : "Say goodbye to handwritten registers, spreadsheet clutter, and chasing tenants for rent. Live bed occupancy rosters, automated WhatsApp UPI collection links, room sub-meter electricity splitting, and frictionless deposit settlements."}
              </p>

              {/* Primary Dual Action Cluster */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 w-full max-w-md">
                <button
                  type="button"
                  onClick={() => quickLogin("owner@srilakshmipg.local", "/admin/dashboard")}
                  disabled={Boolean(loggingIn)}
                  className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-slate-950 px-6 py-3.5 text-sm font-extrabold hover:opacity-95 active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/25 cursor-pointer"
                >
                  {loggingIn === "owner@srilakshmipg.local" ? (
                    <Loader2 className="size-4 animate-spin text-slate-950" />
                  ) : (
                    <Play className="size-4 fill-slate-950 text-slate-950" />
                  )}
                  <span>{isTa ? "நேரடி மாதிரி இயக்கம்" : "Explore PG Owner Portal"}</span>
                  <ArrowRight className="size-4" />
                </button>

                <a
                  href="#showcase"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 px-5 py-3.5 text-sm font-semibold transition-all"
                >
                  <span>{isTa ? "மாதிரி திரை காண்க" : "View Interactive Demo"}</span>
                  <ChevronDown className="size-4 text-slate-400" />
                </a>
              </div>

              {/* Trust & Spec Micro-Badges */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  <span>{isTa ? "கிரெடிட் கார்டு தேவையில்லை" : "No credit card needed"}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  <span>{isTa ? "2 நிமிடங்களில் அமைப்பு" : "2-Minute Setup"}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  <span>{isTa ? "மொபைல் & கணினியில் இயங்கும்" : "Works on Phone & Desktop"}</span>
                </span>
              </div>
            </div>

            {/* ── HERO INTERACTIVE TERMINAL / COMMAND CENTER SHOWCASE ─────────── */}
            <div id="showcase" className="mt-12 sm:mt-16 lg:mt-20 max-w-5xl mx-auto">
              <div className="relative rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/90 via-slate-950 to-[#0B0F19] p-2 sm:p-3 shadow-2xl shadow-emerald-950/40">
                {/* Glow ring */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent pointer-events-none" />

                {/* Window Chrome Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 py-2.5 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="size-3 rounded-full bg-rose-500/80" />
                      <span className="size-3 rounded-full bg-amber-500/80" />
                      <span className="size-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="h-4 w-px bg-slate-800" />
                    <div className="flex items-center gap-2">
                      <Building2 className="size-3.5 text-emerald-400" />
                      <span className="font-bold text-white tracking-wide">
                        Sri Lakshmi Luxury PG & Co-Living
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                        (42 Beds · 18 Rooms)
                      </span>
                    </div>
                  </div>

                  {/* Operational Telemetry Chips */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      88% Occupied
                    </span>
                    <span className="rounded-full bg-slate-800/90 border border-slate-700 px-2.5 py-0.5 text-[10px] font-mono text-slate-300">
                      Cycle: 1st - 5th
                    </span>
                  </div>
                </div>

                {/* Interactive Feature Selectors (4 Tabs) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 bg-slate-950/60 rounded-xl border border-slate-800/60 mt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveHeroTab("whatsapp")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                      activeHeroTab === "whatsapp"
                        ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <MessageCircle className="size-4 shrink-0" />
                    <span className="truncate">{isTa ? "வாட்ஸ்அப் வசூல்" : "WhatsApp Pay"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveHeroTab("bedmatrix")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                      activeHeroTab === "bedmatrix"
                        ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <BedSingle className="size-4 shrink-0" />
                    <span className="truncate">{isTa ? "படுக்கை மேட்ரிக்ஸ்" : "Bed Matrix"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveHeroTab("submeter")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                      activeHeroTab === "submeter"
                        ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Zap className="size-4 shrink-0" />
                    <span className="truncate">{isTa ? "மின் கட்டணப் பகிர்வு" : "Sub-Meter Splitting"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveHeroTab("deposit")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                      activeHeroTab === "deposit"
                        ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    }`}
                  >
                    <Receipt className="size-4 shrink-0" />
                    <span className="truncate">{isTa ? "வைப்புத்தொகைத் தீர்வு" : "Deposit Settlement"}</span>
                  </button>
                </div>

                {/* Tab 1: WhatsApp Automated UPI Rail */}
                {activeHeroTab === "whatsapp" && (
                  <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Left: WhatsApp Bubble */}
                    <div className="md:col-span-6 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                          <MessageCircle className="size-4" />
                          Auto WhatsApp Delivery
                        </span>
                        <span>Today, 09:15 AM · Delivered ✓✓</span>
                      </div>

                      <div className="rounded-2xl border border-emerald-500/30 bg-[#075E54]/20 p-4 space-y-3 backdrop-blur-sm shadow-inner">
                        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                          <div className="text-xs font-bold text-emerald-300">
                            Sri Lakshmi Luxury PG & Co-Living
                          </div>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                            Verified Sender
                          </span>
                        </div>

                        <p className="text-xs text-slate-200 leading-relaxed font-mono">
                          &quot;Hi <strong>Karthik Raja</strong>! Your rent invoice for{" "}
                          <strong>Room 201 (Bed A)</strong> for the month of October is generated.
                          <br />
                          <br />
                          💰 Rent: ₹13,000
                          <br />
                          ⚡ Sub-meter (120u / 2 beds): ₹600
                          <br />
                          <strong>Total Payable: ₹13,600</strong>
                          <br />
                          <br />
                          Click to pay directly via UPI:
                          <br />
                          <span className="text-emerald-400 underline font-bold">
                            https://bedy.in/pay/inv_sllp_201a
                          </span>
                          <br />
                          <span className="text-slate-400 text-[11px]">
                            Receipt will be sent automatically once paid.
                          </span>
                          &quot;
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <CheckCheck className="size-4 text-emerald-400 shrink-0" />
                        <span>Tenants don&apos;t need to remember bank accounts or download an app.</span>
                      </div>
                    </div>

                    {/* Right: Instant UPI Checkout Simulation */}
                    <div className="md:col-span-6 space-y-3">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Tenant 1-Click Pay Link
                            </span>
                            <div className="font-bold text-white text-base">
                              Room 201 · Bed A (AC Double)
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400">Total Due</span>
                            <div className="text-xl font-black text-emerald-400 tabular">₹13,600</div>
                          </div>
                        </div>

                        {/* Interactive simulation button */}
                        <div>
                          <button
                            type="button"
                            onClick={handleSimulatePayment}
                            disabled={simLoading}
                            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              simPaid
                                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                                : "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/25"
                            }`}
                          >
                            {simLoading ? (
                              <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Simulating UPI Processing...</span>
                              </>
                            ) : simPaid ? (
                              <>
                                <CheckCircle2 className="size-4 text-emerald-400" />
                                <span>Paid via PhonePe / UPI · Click to Reset</span>
                              </>
                            ) : (
                              <>
                                <Smartphone className="size-4" />
                                <span>Simulate 1-Tap UPI Payment (Test it)</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Resulting PDF receipt auto-generation preview */}
                        {simPaid ? (
                          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 space-y-2 animate-fade-in text-xs">
                            <div className="flex items-center justify-between text-emerald-300 font-bold">
                              <span className="flex items-center gap-1.5">
                                <Receipt className="size-4 text-emerald-400" />
                                Payment Reconciled & Receipt Auto-Generated
                              </span>
                              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">
                                INV-2026-10-001
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300">
                              Official PDF payment receipt delivered straight back to Karthik&apos;s WhatsApp with transaction ID #UPI_8829140.
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                            <span className="flex items-center gap-1.5">
                              <QrCode className="size-3.5 text-slate-400" /> Supports GPay, PhonePe, Paytm & QR
                            </span>
                            <span className="text-emerald-400 font-mono font-semibold">Zero Fee</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Live Room & Bed Occupancy Matrix */}
                {activeHeroTab === "bedmatrix" && (
                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <h4 className="font-bold text-white text-sm">Visual Room & Bed Allocation Roster</h4>
                        <p className="text-slate-400">Click any vacant bed to simulate instant tenant onboarding</p>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1">
                          <span className="size-2 rounded-full bg-emerald-500" /> 35 Occupied
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="size-2 rounded-full bg-amber-500" /> 4 Rent Due
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="size-2 rounded-full bg-cyan-400" /> 3 Vacant
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* Room 101 */}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-white">Room 101 (2-Sharing)</span>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">₹7,500/bed</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                            <span className="font-medium text-slate-200">Bed A · Rahul Sharma</span>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                              PAID
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                            <span className="font-medium text-slate-200">Bed B · Amit Verma</span>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                              PAID
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Room 201 */}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-white">Room 201 (3-Sharing AC)</span>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">₹13,000/bed</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                            <span className="font-medium text-slate-200">Bed A · Karthik Raja</span>
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                              DUE (5th)
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                            <span className="font-medium text-slate-200">Bed B · Suresh M</span>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                              PAID
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-dashed border-cyan-500/50">
                            <span className="font-bold text-cyan-300">Bed C · VACANT</span>
                            <span className="text-[10px] font-semibold text-cyan-400 underline cursor-pointer">
                              + Check-in
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Room 301 */}
                      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-white">Room 301 (Single Deluxe)</span>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">₹18,000/mo</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                            <span className="font-medium text-slate-200">Bed A · Vikram Seth</span>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                              PAID
                            </span>
                          </div>
                          <div className="rounded-lg bg-emerald-950/30 p-2 text-[10px] text-emerald-300 border border-emerald-500/20">
                            Automatic pro-rata for mid-month move-ins supported out of the box.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Sub-Meter & Electricity Reading Engine */}
                {activeHeroTab === "submeter" && (
                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <h4 className="font-bold text-white text-sm">Room Sub-Meter Electricity Engine</h4>
                        <p className="text-slate-400">
                          Automatically remembers last month&apos;s meter reading and divides consumed units equally among room occupants.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        Zero Manual Calculations
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center sm:text-left">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-semibold">Previous Meter Reading</span>
                          <span className="text-base font-bold text-white">1,420 units</span>
                          <span className="text-[9.5px] text-emerald-400 block">Pre-filled from last month</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-semibold">Current Meter Reading</span>
                          <span className="text-base font-bold text-emerald-400">1,540 units</span>
                          <span className="text-[9.5px] text-slate-400 block">Entered on 1st of month</span>
                        </div>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-semibold">Units Consumed × Rate</span>
                          <span className="text-base font-bold text-white">120 u @ ₹10 = ₹1,200</span>
                          <span className="text-[9.5px] text-slate-400 block">Room Total</span>
                        </div>
                        <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/30">
                          <span className="text-[10px] text-emerald-300 block font-semibold">Split (2 Occupants)</span>
                          <span className="text-lg font-black text-emerald-300">₹600 / bed</span>
                          <span className="text-[9.5px] text-emerald-400 block">Auto-added to rent invoice</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <span>
                          Supports 3 modes: <strong>Meter Reading (Start → End)</strong>, <strong>Direct Units Consumed</strong>, or <strong>Fixed Amount</strong>.
                        </span>
                        <span className="font-semibold text-emerald-400">100% Optional</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: 60-Second Check-out & Deposit Settlements */}
                {activeHeroTab === "deposit" && (
                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <h4 className="font-bold text-white text-sm">Transparent Check-out & Security Deposit Settlement</h4>
                        <p className="text-slate-400">Complete itemized deduction receipt logged directly to immutable audit trail</p>
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-full border border-amber-500/30">
                        Arun Kumar · Vacating
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 text-xs max-w-xl mx-auto">
                      <div className="space-y-2 border-b border-slate-800 pb-3">
                        <div className="flex justify-between text-slate-300">
                          <span>Security Deposit Held:</span>
                          <span className="font-bold text-white">₹15,000</span>
                        </div>
                        <div className="flex justify-between text-rose-400">
                          <span>Less: Room Cleaning & Repainting:</span>
                          <span className="font-bold">− ₹1,000</span>
                        </div>
                        <div className="flex justify-between text-rose-400">
                          <span>Less: Electricity & Water Arrears:</span>
                          <span className="font-bold">− ₹1,200</span>
                        </div>
                        <div className="flex justify-between text-rose-400">
                          <span>Less: 10-day stay pro-rata:</span>
                          <span className="font-bold">− ₹2,500</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm font-bold pt-1">
                        <span className="text-white">Net Refund Payable to Tenant:</span>
                        <span className="text-lg text-emerald-400 font-black">₹10,300</span>
                      </div>

                      <div className="pt-2">
                        <div className="rounded-lg bg-emerald-500 text-slate-950 font-bold text-center py-2 text-xs shadow-md">
                          One-Click &quot;Approve Settlement & Vacate Bed&quot;
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── LIVE IMPACT & PERFORMANCE STATS BAR ─────────────────────────── */}
        <section className="py-10 border-y border-slate-800 bg-slate-950/60 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                  ₹4.2 Cr+
                </div>
                <div className="text-xs text-slate-400 font-medium">Rent Collected via UPI</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-400">
                  98.2%
                </div>
                <div className="text-xs text-slate-400 font-medium">On-Time Rent Settlement</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-teal-300">
                  18+ Hrs
                </div>
                <div className="text-xs text-slate-400 font-medium">Saved Per Property / Month</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-cyan-400">
                  0 Notebooks
                </div>
                <div className="text-xs text-slate-400 font-medium">100% Digital & Cloud Audited</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── BENTO ARCHITECTURE: 6 CORE PRODUCT PILLARS ─────────────────── */}
        <section id="features" className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                Engineered for Scale
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                Everything required to run 10 to 500+ beds.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Eliminate administrative friction and modernize every aspect of your PG operations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: 1-Click WhatsApp Reminders (Span 2) */}
              <div className="md:col-span-2 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 space-y-4 hover:border-slate-700 transition-all">
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <MessageCircle className="size-6" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Autonomous WhatsApp Rent Reminders & UPI Rails
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
                  Generate rent bills for your entire PG in one click. Send pre-filled, personalized WhatsApp messages with direct deep-links that open GPay, PhonePe, or Paytm with the exact amount pre-loaded. Instant reconciliation and automatic PDF receipts.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                    ✓ 1-Tap GPay / PhonePe
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                    ✓ Auto PDF Receipts
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                    ✓ Real-time Defaulter Radar
                  </span>
                </div>
              </div>

              {/* Card 2: Visual Bed Matrix */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 space-y-4 hover:border-slate-700 transition-all">
                <div className="flex size-12 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
                  <BedSingle className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Live Bed Allocation Matrix</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time visual map of every room and bed. Know immediately which beds are vacant, which tenants are on notice, and never double-book again.
                </p>
                <div className="text-[11px] text-teal-300 font-medium pt-2">
                  Instant mid-month join pro-rata calculation included.
                </div>
              </div>

              {/* Card 3: Sub-Meter & Electricity Engine */}
              <div id="submeter" className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 space-y-4 hover:border-slate-700 transition-all">
                <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Zap className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Sub-Meter Electricity Splitting</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bedy stores previous month meter readings automatically. Enter current reading, and the system calculates units × rate and divides it equally among active room occupants.
                </p>
                <div className="text-[11px] text-amber-300 font-medium pt-2">
                  Ends electricity arguments between room mates forever.
                </div>
              </div>

              {/* Card 4: Deposit Settlements */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 space-y-4 hover:border-slate-700 transition-all">
                <div className="flex size-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Receipt className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Dispute-Free Deposit Refunds</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Itemized check-out settlements with deductions for repainting, unbilled electricity, and notice period shortages. Complete audit log proof.
                </p>
                <div className="text-[11px] text-cyan-300 font-medium pt-2">
                  Tenants leave happily with full financial transparency.
                </div>
              </div>

              {/* Card 5: Repairs & Maintenance Desk */}
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 space-y-4 hover:border-slate-700 transition-all">
                <div className="flex size-12 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <AlertTriangle className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Digital Maintenance Helpdesk</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tenants snap photos of leaking taps or broken ACs and raise tickets. Assign technicians in 1 click, track SLA resolution times, and verify fixes.
                </p>
                <div className="text-[11px] text-rose-300 font-medium pt-2">
                  No lost WhatsApp voice notes or forgotten repairs.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── INTERACTIVE ROI & TIME-SAVED CALCULATOR ───────────────────────── */}
        <section id="calculator" className="py-16 sm:py-24 border-t border-slate-800 bg-slate-950/70">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                Interactive Profit Simulator
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                How much time and money will Bedy save you?
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Move the sliders to match your property size and see your estimated monthly returns.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Sliders on Left */}
                <div className="lg:col-span-6 space-y-6">
                  {/* Beds Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-300">Total Beds Operated</span>
                      <span className="text-emerald-400 font-mono text-sm font-bold">
                        {calcBeds} Beds
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="5"
                      value={calcBeds}
                      onChange={(e) => setCalcBeds(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>10 Beds</span>
                      <span>100 Beds</span>
                      <span>200 Beds</span>
                    </div>
                  </div>

                  {/* Rent Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-300">Average Rent Per Bed</span>
                      <span className="text-emerald-400 font-mono text-sm font-bold">
                        ₹{calcRent.toLocaleString()} / mo
                      </span>
                    </div>
                    <input
                      type="range"
                      min="4000"
                      max="25000"
                      step="500"
                      value={calcRent}
                      onChange={(e) => setCalcRent(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>₹4,000</span>
                      <span>₹15,000</span>
                      <span>₹25,000</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between font-semibold text-slate-300">
                      <span>Estimated Monthly Billing:</span>
                      <span className="text-white font-mono font-bold">
                        ₹{roiMonthlyRevenue.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Based on typical operator benchmarks across Bangalore, Chennai, Pune & Hyderabad.
                    </p>
                  </div>
                </div>

                {/* Live Return Metrics on Right */}
                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 space-y-1 text-center sm:text-left">
                    <span className="text-xs text-emerald-300 font-semibold block">Time Saved / Month</span>
                    <div className="text-3xl font-black text-white">{roiHoursSaved} Hours</div>
                    <p className="text-[11px] text-slate-400">Zero manual rent phone chasing and receipt drafting.</p>
                  </div>

                  <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-5 space-y-1 text-center sm:text-left">
                    <span className="text-xs text-teal-300 font-semibold block">Leakage Prevented</span>
                    <div className="text-3xl font-black text-white">
                      ₹{roiLeakageSaved.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-400">Recovered from unbilled sub-meters & delayed rent.</p>
                  </div>

                  <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-white">Ready to unlock these savings?</div>
                      <div className="text-slate-400">Setup takes only 2 minutes with pre-seeded templates.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => quickLogin("owner@srilakshmipg.local", "/admin/dashboard")}
                      className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all cursor-pointer shrink-0"
                    >
                      Test Drive Free →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 1-CLICK TEST DRIVE / DEMO PORTALS (INSTANT LOGINS) ───────────── */}
        <section id="demo-portals" className="py-16 sm:py-24 border-t border-slate-800 bg-[#0B0F19]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                Frictionless 1-Click Evaluation
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
                Experience every portal live right now.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Click any role card below to instantly log into a live, pre-populated property with real beds, rent data, and sub-meters. No password or signup required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: PG Owner */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <Building2 className="size-5" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase">
                      Owner
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Sri Lakshmi Luxury PG</h3>
                    <p className="text-[11px] text-slate-400">42 Beds · 18 Rooms</p>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Full owner command: revenue analytics, bulk WhatsApp billing, defaulters radar, bed matrix.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => quickLogin("owner@srilakshmipg.local", "/admin/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 py-2.5 text-xs font-bold hover:opacity-95 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    {loggingIn === "owner@srilakshmipg.local" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowRight className="size-4" />
                    )}
                    <span>Launch Owner Portal</span>
                  </button>
                </div>
              </div>

              {/* Card 2: PG Manager */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/10 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
                      <ShieldCheck className="size-5" />
                    </div>
                    <span className="text-[10px] font-bold text-teal-300 bg-teal-950/80 border border-teal-500/30 px-2.5 py-0.5 rounded-full uppercase">
                      Manager
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Suresh Kumar</h3>
                    <p className="text-[11px] text-slate-400">On-site Operations</p>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Daily check-ins, Aadhaar/ID proof uploads, sub-meter readings, maintenance assignments.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => quickLogin("manager@srilakshmipg.local", "/admin/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white py-2.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    {loggingIn === "manager@srilakshmipg.local" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowRight className="size-4" />
                    )}
                    <span>Launch Manager Portal</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Resident Tenant */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      <User className="size-5" />
                    </div>
                    <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-500/30 px-2.5 py-0.5 rounded-full uppercase">
                      Resident
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Karthik Raja</h3>
                    <p className="text-[11px] text-slate-400">Room 201 (Bed A)</p>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Tenant self-service: 1-click UPI payments, official PDF receipt downloads, repair tickets.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => quickLogin("resident@srilakshmipg.local", "/resident/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white py-2.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    {loggingIn === "resident@srilakshmipg.local" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowRight className="size-4" />
                    )}
                    <span>Launch Resident App</span>
                  </button>
                </div>
              </div>

              {/* Card 4: Apartment Society Admin */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col justify-between hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                      <KeyRound className="size-5" />
                    </div>
                    <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-500/30 px-2.5 py-0.5 rounded-full uppercase">
                      Society
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Green Valley Society</h3>
                    <p className="text-[11px] text-slate-400">100 Flats · Gated Comm.</p>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Residential society mode: flat maintenance dues, amenity booking, gate notices, resident directory.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => quickLogin("admin@greenvalley.local", "/admin/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white py-2.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    {loggingIn === "admin@greenvalley.local" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowRight className="size-4" />
                    )}
                    <span>Launch Society Admin</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FREQUENTLY ASKED QUESTIONS (ACCORDION) ───────────────────────── */}
        <section className="py-16 sm:py-24 border-t border-slate-800 bg-slate-950/60">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                Operator FAQ
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: "Do my residents need to install any mobile app?",
                  a: "No! Tenants receive personalized WhatsApp links with deep-links to GPay, PhonePe, or Paytm. They can pay directly without creating passwords or installing storage-heavy apps.",
                },
                {
                  q: "How does the room-wise electricity sub-meter feature work?",
                  a: "Each room's starting meter reading is remembered automatically from the previous month. On the 1st, simply enter the current reading. Bedy multiplies units by your rate per unit and divides the total bill equally only among active occupants of that room.",
                },
                {
                  q: "Can I manage multiple PG branches with one account?",
                  a: "Yes. Bedy supports multi-property switching so you can operate several hostels, PGs, or co-living buildings with consolidated financial reporting.",
                },
                {
                  q: "Is my tenant financial and Aadhaar data secure?",
                  a: "All records are securely encrypted and backed up daily. Strict role-based permissions ensure managers cannot alter critical financial settings without owner authorization.",
                },
                {
                  q: "Can I try Bedy before committing?",
                  a: "Absolutely. You can test drive the full system right now using our live 1-click demo accounts above without signing up.",
                },
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                    className="w-full flex items-center justify-between p-4 text-left text-xs sm:text-sm font-bold text-slate-200 hover:text-white cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`size-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
                        openFaq === idx ? "rotate-180 text-emerald-400" : ""
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HIGH-CONVERTING FINAL CTA BANNER ────────────────────────────── */}
        <section className="py-16 sm:py-24 relative overflow-hidden">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-8 sm:p-14 text-center space-y-6 overflow-hidden shadow-2xl shadow-emerald-500/10">
              {/* Subtle inner ambient glow */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

              <span className="relative z-10 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 uppercase tracking-widest bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-1 rounded-full">
                <Sparkles className="size-3.5 text-emerald-400" />
                Modernize Your Property Today
              </span>

              <h2 className="relative z-10 text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight max-w-2xl mx-auto">
                Stop chasing rent. Let Bedy automate your PG operations.
              </h2>

              <p className="relative z-10 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                Join forward-thinking PG and hostel operators across India. Get started in 2 minutes with zero credit card commitment.
              </p>

              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => quickLogin("owner@srilakshmipg.local", "/admin/dashboard")}
                  disabled={Boolean(loggingIn)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-black px-7 py-3.5 text-sm hover:opacity-95 active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/25 cursor-pointer"
                >
                  {loggingIn === "owner@srilakshmipg.local" ? (
                    <Loader2 className="size-4 animate-spin text-slate-950" />
                  ) : (
                    <Play className="size-4 fill-slate-950 text-slate-950" />
                  )}
                  <span>Launch Interactive Demo</span>
                  <ArrowRight className="size-4" />
                </button>

                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-white px-6 py-3.5 text-sm font-bold transition-all"
                >
                  <LogIn className="size-4" />
                  <span>Sign In</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── MODERN ULTRA-CLEAN FOOTER ────────────────────────────────────── */}
      <footer className="border-t border-slate-800 bg-[#070A11] text-xs text-slate-400 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Brand column */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 font-black text-sm">
                  B
                </span>
                <span className="font-black text-white text-lg tracking-tight">Bedy</span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase">
                  OS 2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                The modern operating system for PG, hostel, and co-living operations in India. 1-click WhatsApp rent collection, instant UPI, room sub-meters, and bed occupancy management.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="size-2 rounded-full bg-emerald-400" />
                <span>All systems operational · Bangalore, India</span>
              </div>
            </div>

            {/* Platform Links */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Platform
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#showcase" className="hover:text-emerald-400 transition-colors">
                    Live Showcase
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-emerald-400 transition-colors">
                    Bed Matrix
                  </a>
                </li>
                <li>
                  <a href="#submeter" className="hover:text-emerald-400 transition-colors">
                    Sub-Meter Billing
                  </a>
                </li>
                <li>
                  <a href="#calculator" className="hover:text-emerald-400 transition-colors">
                    ROI Calculator
                  </a>
                </li>
                <li>
                  <a href="#demo-portals" className="hover:text-emerald-400 transition-colors">
                    Test Drive Portals
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Company & Legal
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/terms" className="hover:text-emerald-400 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/refund-policy" className="hover:text-emerald-400 transition-colors">
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-emerald-400 transition-colors">
                    Pricing Plans
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                Get in Touch
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Have questions or need custom multi-property onboarding?
              </p>
              <div className="space-y-1.5">
                <a
                  href="mailto:support@bedy.in"
                  className="block text-emerald-400 font-semibold hover:underline"
                >
                  support@bedy.in
                </a>
                <span className="text-[11px] text-slate-500 block">Mon - Sat · 9 AM - 7 PM IST</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <span>© {new Date().getFullYear()} Bedy Technologies Inc. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <span>Made with ❤️ for Indian PG & Hostel Operators</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
