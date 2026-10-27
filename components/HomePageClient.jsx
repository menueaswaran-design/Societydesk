"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  KeyRound,
  ArrowRight,
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
  Star,
  RefreshCw,
  Building,
} from "lucide-react";
import { api } from "@/lib/client/api";
import { homeForRole } from "@/lib/routing";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useTranslation } from "@/components/i18n/LanguageProvider";

const PRICING_TIERS = [
  {
    name: "Starter PG",
    nameTa: "தொடக்க பிஜி",
    tagline: "Ideal for small hostels and boutique PGs",
    taglineTa: "சிறிய விடுதிகள் மற்றும் தொடக்க பிஜிகளுக்கு ஏற்றது",
    price: "₹999",
    period: "/ month",
    periodTa: "/ மாதம்",
    beds: "Up to 30 Beds",
    bedsTa: "30 படுக்கைகள் வரை",
    features: [
      "Per-bed live occupancy grid",
      "Automated rent invoicing",
      "1-Click WhatsApp payment reminders",
      "Direct UPI payments (Zero gateway fees)",
      "Resident login portal & receipts",
      "Security deposit refund tracking",
      "Room sub-meter electricity support",
    ],
    featuresTa: [
      "படுக்கை வாரியான நேரடி வரைபடம்",
      "தானியங்கி வாடகை ரசீது உருவாக்கம்",
      "1-கிளிக் வாட்ஸ்அப் கட்டண நினைவூட்டல்",
      "நேரடி யுபிஐ (கட்டணக் கமிஷன் பூஜ்ஜியம்)",
      "குடியிருப்போருக்கான தனி இணையதள அணுகல்",
      "முன்பணம் திரும்ப அளித்தல் கண்காணிப்பு",
      "அறை வாரியான மின் மீட்டர்கள் ஆதரவு",
    ],
    cta: "Try Live Demo",
    ctaTa: "மாதிரி பார்க்க",
    ctaLink: "#demo-portals",
    popular: false,
  },
  {
    name: "Growth PG & Hostels",
    nameTa: "வளர்ச்சி பிஜி & விடுதிகள்",
    tagline: "For busy PGs looking to automate billing & maintenance",
    taglineTa: "விரைவான வாடகை வசூல் மற்றும் பராமரிப்புக்கு",
    price: "₹2,499",
    period: "/ month",
    periodTa: "/ மாதம்",
    beds: "Up to 100 Beds",
    bedsTa: "100 படுக்கைகள் வரை",
    features: [
      "All Starter PG features included",
      "Multi-floor room & bed matrix",
      "Automated daily rent penalty rules",
      "Maintenance & complaint ticketing desk",
      "Notice period vacate dashboard",
      "Resident Web Push notifications",
      "Excel & Tally exportable reports",
    ],
    featuresTa: [
      "அனைத்து தொடக்க பிஜி வசதிகளும் அடங்கும்",
      "பல தள அறை & படுக்கை கட்டமைப்பு",
      "தானியங்கி தாமதக் கட்டண விதிமுறைகள்",
      "பழுது மற்றும் பராமரிப்பு மேசை",
      "வெளியேறும் அறிவிப்பு மேலாண்மை",
      "குடியிருப்பாளர் புஷ் அறிவிப்புகள்",
      "எக்செல் மற்றும் கணக்கு அறிக்கைகள்",
    ],
    cta: "Start Free Trial",
    ctaTa: "இலவசமாகத் தொடங்குங்கள்",
    ctaLink: "#demo-portals",
    popular: true,
  },
  {
    name: "Enterprise & Chains",
    nameTa: "நிறுவனம் & கிளைகள்",
    tagline: "Multiple branches, hostels & co-living buildings",
    taglineTa: "பல கிளைகள் மற்றும் பெரு விடுதிகளுக்கு",
    price: "Custom",
    priceTa: "தனிப்பயன்",
    period: "",
    periodTa: "",
    beds: "Unlimited Beds",
    bedsTa: "வரம்பற்ற படுக்கைகள்",
    features: [
      "All Growth features included",
      "Multi-property owner dashboard",
      "Custom staff roles & access permissions",
      "Priority WhatsApp & phone support",
      "Dedicated account manager",
      "Custom domain & branding options",
    ],
    featuresTa: [
      "அனைத்து வளர்ச்சி வசதிகளும் அடங்கும்",
      "பல கிளைகளை ஒரே இடத்தில் நிர்வகிக்கும் மேடை",
      "தனிப்பயன் பணியாளர் அனுமதி நிலைகள்",
      "முன்னுரிமை வாட்ஸ்அப் & தொலைபேசி ஆதரவு",
      "தனி மேலாளர் உதவி",
      "தனிப்பயன் டொமைன் & வர்த்தகப் பெயர்",
    ],
    cta: "Contact Sales",
    ctaTa: "தொடர்பு கொள்ள",
    ctaLink: "/contact",
    popular: false,
  },
];

/* ── Lightweight Scroll Reveal Hook ─────────────────────────────────────── */
function useScrollReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fallback if browser doesn't support IntersectionObserver
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, isVisible];
}

/* ── Scroll Animated Container Component ────────────────────────────────── */
function Reveal({ children, className = "", delay = 0 }) {
  const [ref, isVisible] = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(24px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function HomePageClient({ user = null }) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const isTa = locale === "ta";

  // Login action loading state (stores email being logged in)
  const [loggingIn, setLoggingIn] = useState(null);

  // Interactive Showcase Active Tab
  const [activeTab, setActiveTab] = useState("whatsapp"); // "whatsapp" | "beds" | "submeter" | "deposit"

  // Simulator state in Showcase
  const [simState, setSimState] = useState("IDLE"); // "IDLE" | "PROCESSING" | "PAID"

  // Interactive Profit & Time Saved Calculator
  const [calcBeds, setCalcBeds] = useState(36);
  const [calcRent, setCalcRent] = useState(8500);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  // Quick 1-click dev-login function for authentic seeded accounts
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

  // Simulate Payment Click
  const handleSimulatePayment = () => {
    if (simState === "PAID") {
      setSimState("IDLE");
      return;
    }
    setSimState("PROCESSING");
    setTimeout(() => {
      setSimState("PAID");
    }, 900);
  };

  // Calculated operational insights based on real formula
  const calculatedMonthlyRevenue = useMemo(() => calcBeds * calcRent, [calcBeds, calcRent]);
  const estimatedHoursSaved = useMemo(() => Math.round((calcBeds / 10) * 4.5 + 4), [calcBeds]);
  const estimatedLeakagePrevented = useMemo(() => Math.round(calculatedMonthlyRevenue * 0.04), [calculatedMonthlyRevenue]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden antialiased">
      {/* ── Active Session Banner if already signed in ──────────────────── */}
      {user ? (
        <aside
          aria-label="Active session banner"
          className="bg-slate-950 text-white px-4 py-2 text-xs font-medium border-b border-slate-800 z-50 sticky top-0"
        >
          <div className="mx-auto max-w-7xl flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex size-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
              </span>
              <span className="truncate">
                {isTa ? "செயலில் உள்ள கணக்கு: " : "Signed in as "}
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1 text-xs text-white transition-all shrink-0 font-semibold"
            >
              <span>{isTa ? "டாஷ்போர்டுக்குச் செல்க" : "Go to Dashboard"}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </aside>
      ) : null}

      {/* ── Crisp, Modern Floating Header ───────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="mx-auto max-w-7xl flex h-16 sm:h-18 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
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
              <span className="text-[10px] text-slate-500 font-medium leading-none hidden xs:block">
                Operations Management OS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#showcase" className="hover:text-emerald-700 transition-colors">
              {isTa ? "நேரடி மாதிரி" : "Live Terminal"}
            </a>
            <a href="#features" className="hover:text-emerald-700 transition-colors">
              {isTa ? "வசதிகள்" : "Features"}
            </a>
            <a href="#pricing" className="hover:text-emerald-700 transition-colors">
              {isTa ? "விலை விவரம்" : "Pricing"}
            </a>
            <a href="#calculator" className="hover:text-emerald-700 transition-colors">
              {isTa ? "கணிப்பான்" : "Calculator"}
            </a>
            <a href="#demo-portals" className="hover:text-emerald-700 transition-colors">
              {isTa ? "டெமோ கணக்குகள்" : "Demo Logins"}
            </a>
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2.5">
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-sm"
              >
                <span>{isTa ? "டாஷ்போர்டு" : "Dashboard"}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-all shadow-2xs"
                >
                  <LogIn className="size-3.5 text-slate-500" />
                  <span>{isTa ? "உள்நுழை" : "Sign In"}</span>
                </Link>

                <a
                  href="#demo-portals"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white px-3.5 sm:px-4 py-2 text-xs font-bold transition-all shadow-sm shadow-emerald-600/20"
                >
                  <Sparkles className="size-3.5" />
                  <span>{isTa ? "மாதிரி கணக்குகள்" : "Try Free Demo"}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION (LIGHT & CRISP) ─────────────────────────────────── */}
      <main className="flex-1">
        <section className="relative pt-8 sm:pt-14 lg:pt-18 pb-14 sm:pb-20 overflow-hidden bg-gradient-to-b from-white via-white to-slate-50/70 border-b border-slate-200/70">
          {/* Subtle decorative background gradient circles */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-b from-emerald-100/50 via-teal-50/30 to-transparent blur-3xl pointer-events-none -z-10" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-5 sm:space-y-6">
              {/* Innovation Pill */}
              <Reveal delay={0}>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200/90 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {isTa
                      ? "பிஜி & விடுதிகளுக்கான நவீன மென்பொருள்"
                      : "Purpose-Built for PGs, Hostels & Co-Living Spaces"}
                  </span>
                </div>
              </Reveal>

              {/* High-Impact Hero Headline */}
              <Reveal delay={100}>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.12]">
                  {isTa ? (
                    <>
                      வாடகை வசூல் தானியங்கி முறையில்.{" "}
                      <span className="text-emerald-600">கணக்கு நோட்டுகள் தேவையில்லை.</span>
                    </>
                  ) : (
                    <>
                      Rent Collection on Autopilot.{" "}
                      <span className="text-emerald-600">Zero Notebook Chasing.</span>
                    </>
                  )}
                </h1>
              </Reveal>

              {/* Value Proposition Subtitle */}
              <Reveal delay={200}>
                <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
                  {isTa
                    ? "கணக்கு நோட்டுகள், எக்செல் தாள்கள் மற்றும் வாட்ஸ்அப் குழப்பங்களுக்கு முற்றுப்புள்ளி வையுங்கள். படுக்கை வாரியான ஆக்கிரமிப்பு, 1-கிளிக் வாட்ஸ்அப் யுபிஐ நினைவூட்டல், அறை மின் கணக்கீடு மற்றும் வைப்புத்தொகைத் தீர்வு."
                    : "Bedy replaces paper registers, Excel sheets, and awkward rent phone calls. Track bed occupancy live, send 1-click WhatsApp payment reminders with instant UPI links, split room sub-meter electricity, and settle security deposits digitally."}
                </p>
              </Reveal>

              {/* Action Buttons */}
              <Reveal delay={300}>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 w-full max-w-md">
                  <button
                    type="button"
                    onClick={() => quickLogin("owner@srilakshmipg.local", "/admin/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-800 active:scale-[0.98] text-white px-5 py-3 text-xs sm:text-sm font-bold transition-all shadow-md shadow-slate-950/20 cursor-pointer min-h-[46px]"
                  >
                    {loggingIn === "owner@srilakshmipg.local" ? (
                      <Loader2 className="size-4 animate-spin text-white" />
                    ) : (
                      <Building2 className="size-4 text-emerald-400" />
                    )}
                    <span>{isTa ? "பிஜி உரிமையாளர் நேரடி மாதிரி" : "Open Owner Portal"}</span>
                    <ArrowRight className="size-4" />
                  </button>

                  <a
                    href="#showcase"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-800 px-5 py-3 text-xs sm:text-sm font-semibold transition-all shadow-2xs min-h-[46px]"
                  >
                    <span>{isTa ? "மாதிரி திரை காண்க" : "Explore Interactive Demo"}</span>
                    <ChevronDown className="size-4 text-slate-500" />
                  </a>
                </div>
              </Reveal>

              {/* Micro-spec checkmarks */}
              <Reveal delay={400}>
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500 font-medium pt-1">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>1-Tap UPI (GPay / PhonePe)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Room Sub-Meter Memory</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Instant PDF WhatsApp Receipts</span>
                  </span>
                </div>
              </Reveal>
            </div>

            {/* ── INTERACTIVE APPLICATION TERMINAL (SHOWCASE) ────────────────── */}
            <div id="showcase" className="mt-10 sm:mt-14 max-w-5xl mx-auto">
              <Reveal delay={200}>
                <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
                  {/* Top Application Bar */}
                  <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-rose-500/90" />
                        <span className="size-2.5 rounded-full bg-amber-500/90" />
                        <span className="size-2.5 rounded-full bg-emerald-500/90" />
                      </div>
                      <div className="h-4 w-px bg-slate-700" />
                      <div className="flex items-center gap-2">
                        <Building2 className="size-3.5 text-emerald-400" />
                        <span className="font-bold text-white text-xs truncate">
                          Sri Lakshmi Luxury PG & Co-Living
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline font-mono">
                          · Live Bedy Terminal
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        86% Occupied
                      </span>
                    </div>
                  </div>

                  {/* 4 Feature Tab Selectors */}
                  <div className="flex items-center gap-1 bg-slate-100/90 p-1.5 border-b border-slate-200/80 overflow-x-auto text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setActiveTab("whatsapp")}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 cursor-pointer text-xs ${
                        activeTab === "whatsapp"
                          ? "bg-white text-emerald-800 shadow-2xs font-bold ring-1 ring-emerald-600/20"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <MessageCircle className="size-4 text-emerald-600" />
                      <span>{isTa ? "வாட்ஸ்அப் வசூல்" : "WhatsApp Pay"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("beds")}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 cursor-pointer text-xs ${
                        activeTab === "beds"
                          ? "bg-white text-slate-900 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <BedSingle className="size-4 text-indigo-600" />
                      <span>{isTa ? "படுக்கை ஆக்கிரமிப்பு" : "Bed Matrix"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("submeter")}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 cursor-pointer text-xs ${
                        activeTab === "submeter"
                          ? "bg-white text-slate-900 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <Zap className="size-4 text-amber-600" />
                      <span>{isTa ? "மின் கட்டணப் பகிர்வு" : "Sub-Meter Splitting"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("deposit")}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all shrink-0 cursor-pointer text-xs ${
                        activeTab === "deposit"
                          ? "bg-white text-slate-900 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <Receipt className="size-4 text-cyan-600" />
                      <span>{isTa ? "வைப்புத்தொகைத் தீர்வு" : "Deposit Refund"}</span>
                    </button>
                  </div>

                  {/* Terminal Body Content */}
                  <div className="p-4 sm:p-6 min-h-[320px]">
                    {/* TAB 1: WhatsApp Pay & Instant UPI Simulation */}
                    {activeTab === "whatsapp" && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center animate-fade-slide-up">
                        {/* WhatsApp Message Preview */}
                        <div className="md:col-span-6 space-y-3">
                          <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between text-[11px] text-emerald-800 font-bold border-b border-emerald-200/60 pb-1.5">
                              <span className="flex items-center gap-1.5">
                                <MessageCircle className="size-3.5 text-emerald-600" />
                                WhatsApp Auto-Reminder to Karthik Raja
                              </span>
                              <span className="text-[10px] text-emerald-600 font-normal">Delivered 10:02 AM</span>
                            </div>
                            <p className="text-xs text-slate-800 leading-relaxed font-mono">
                              &quot;Hi Karthik, your Room 201 (Bed A) rent for Oct (₹13,000) + electricity (₹600) is due by 5th.
                              <br />
                              <br />
                              Tap to pay via UPI:
                              <br />
                              <strong className="text-emerald-700 underline">https://bedy.in/pay/inv_sllp_201</strong>
                              <br />
                              — Sri Lakshmi Luxury PG&quot;
                            </p>
                          </div>

                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <CheckCheck className="size-3.5 text-emerald-600" />
                            <span>1-click batch sending to all tenants with zero manual typing.</span>
                          </div>
                        </div>

                        {/* Public 1-Click Pay Sheet Simulator */}
                        <div className="md:col-span-6 space-y-3">
                          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 text-xs">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400">
                                  Tenant Pay Sheet
                                </span>
                                <div className="font-bold text-slate-900 text-sm">Room 201 · Bed A</div>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block">Total Due</span>
                                <span className="font-extrabold text-emerald-700 text-base">₹13,600</span>
                              </div>
                            </div>

                            {/* Interactive simulation button */}
                            <div>
                              <button
                                type="button"
                                onClick={handleSimulatePayment}
                                disabled={simState === "PROCESSING"}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  simState === "PAID"
                                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                }`}
                              >
                                {simState === "PROCESSING" ? (
                                  <>
                                    <Loader2 className="size-4 animate-spin text-white" />
                                    <span>Simulating UPI Processing...</span>
                                  </>
                                ) : simState === "PAID" ? (
                                  <>
                                    <CheckCircle2 className="size-4 text-emerald-700" />
                                    <span>Paid via PhonePe · Click to Reset</span>
                                  </>
                                ) : (
                                  <>
                                    <Smartphone className="size-4" />
                                    <span>Test 1-Tap UPI Payment (Click Here)</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Resulting PDF receipt auto-generation */}
                            {simState === "PAID" ? (
                              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-[11px] text-emerald-900 font-medium space-y-1 animate-fade-slide-up">
                                <div className="flex items-center justify-between font-bold">
                                  <span>✓ Reconciled & Receipt Auto-Generated</span>
                                  <span className="text-[10px] bg-emerald-100 px-1.5 py-0.2 rounded text-emerald-800">
                                    INV-2026-10-001
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-600">
                                  Official PDF payment receipt delivered straight back to tenant WhatsApp automatically.
                                </p>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-[11px] text-slate-500 bg-white p-2 rounded-md border border-slate-200">
                                <span className="flex items-center gap-1">
                                  <QrCode className="size-3.5 text-slate-400" /> Supports GPay, PhonePe & Paytm
                                </span>
                                <span className="text-emerald-700 font-semibold font-mono">Zero Fee</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: Live Room & Bed Occupancy Matrix */}
                    {activeTab === "beds" && (
                      <div className="space-y-3 text-xs animate-fade-slide-up">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">Live Bed Status Roster</span>
                          <span className="text-[11px] text-slate-500">35 Occupied · 6 Vacant · 1 Reserved</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Room 101 */}
                          <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-2">
                            <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                              <span>Room 101 (2-Sharing)</span>
                              <span className="text-[10px] font-semibold text-emerald-700">₹7,500/bed</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between rounded bg-white p-2 border border-slate-200 text-[11px]">
                                <span className="font-semibold text-slate-800">Bed A: Rahul Sharma</span>
                                <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  PAID
                                </span>
                              </div>
                              <div className="flex items-center justify-between rounded bg-emerald-50/70 p-2 border border-dashed border-emerald-300 text-[11px]">
                                <span className="font-bold text-emerald-800">Bed B: VACANT</span>
                                <span className="text-[9.5px] font-semibold text-emerald-700 underline">
                                  Check-in
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Room 201 */}
                          <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-2">
                            <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                              <span>Room 201 (3-Sharing AC)</span>
                              <span className="text-[10px] font-semibold text-emerald-700">₹13,000/bed</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between rounded bg-white p-2 border border-slate-200 text-[11px]">
                                <span className="font-semibold text-slate-800">Bed A: Karthik Raja</span>
                                <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                  DUE (5th)
                                </span>
                              </div>
                              <div className="flex items-center justify-between rounded bg-white p-2 border border-slate-200 text-[11px]">
                                <span className="font-semibold text-slate-800">Bed B: Suresh M</span>
                                <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  PAID
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg bg-indigo-50/80 p-2 text-indigo-950 text-[11px] font-medium flex items-center justify-between border border-indigo-100">
                          <span>Auto-calculated mid-month join pro-rata rent supported</span>
                          <span className="font-bold text-indigo-700">✓ Enabled</span>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: Room Sub-Meter Electricity Engine */}
                    {activeTab === "submeter" && (
                      <div className="space-y-3 text-xs animate-fade-slide-up">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">Stored Room Sub-Meter Reading Engine</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Zero Manual Math
                          </span>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/60 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-center sm:text-left">
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-400 block font-semibold">Previous Reading</span>
                              <span className="text-sm font-bold text-slate-900">1,420 units</span>
                              <span className="text-[9px] text-emerald-700 block">Pre-filled auto</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-400 block font-semibold">Current Reading</span>
                              <span className="text-sm font-bold text-emerald-700">1,540 units</span>
                              <span className="text-[9px] text-slate-500 block">Entered on 1st</span>
                            </div>
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-400 block font-semibold">Units Consumed</span>
                              <span className="text-sm font-bold text-slate-900">120 u @ ₹10 = ₹1,200</span>
                              <span className="text-[9px] text-slate-500 block">Room Total</span>
                            </div>
                            <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                              <span className="text-[10px] text-emerald-800 block font-semibold">Per-Bed Split</span>
                              <span className="text-base font-black text-emerald-800">₹600 / bed</span>
                              <span className="text-[9px] text-emerald-700 block">Divided across 2 beds</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                            <span>
                              Supports 3 modes: <strong>Meter Readings (Start → End)</strong>, <strong>Direct Units Consumed</strong>, or <strong>Fixed Amount</strong>.
                            </span>
                            <span className="font-semibold text-emerald-700">100% Optional</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: Deposit Refund Settlement */}
                    {activeTab === "deposit" && (
                      <div className="space-y-3 text-xs animate-fade-slide-up max-w-xl mx-auto">
                        <div className="rounded-xl border border-slate-200 p-3.5 bg-white space-y-2.5">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div>
                              <div className="font-bold text-slate-900">Arun Kumar · Check-out Settlement</div>
                              <div className="text-[10px] text-slate-500">Room 102 (Bed A) · Notice Period: 30 Days</div>
                            </div>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              SETTLING
                            </span>
                          </div>

                          <div className="space-y-1.5 text-[11px] text-slate-600">
                            <div className="flex justify-between">
                              <span>Security Deposit Held:</span>
                              <span className="font-bold text-slate-900">₹15,000</span>
                            </div>
                            <div className="flex justify-between text-rose-600">
                              <span>Less: Room Repainting / Cleaning:</span>
                              <span className="font-bold">-₹1,000</span>
                            </div>
                            <div className="flex justify-between text-rose-600">
                              <span>Less: Electricity & Water arrears:</span>
                              <span className="font-bold">-₹1,200</span>
                            </div>
                            <div className="flex justify-between text-rose-600">
                              <span>Less: Mid-month stay (10 days pro-rata):</span>
                              <span className="font-bold">-₹2,500</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-1.5 text-xs font-bold text-slate-900">
                              <span>Net Refund Payable to Tenant:</span>
                              <span className="text-emerald-700 text-sm">₹10,300</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-2 text-[10px] text-slate-500 flex items-center justify-between border border-slate-200">
                          <span>Written to immutable audit log with deduction reasons</span>
                          <span className="font-semibold text-slate-700">Bed vacated auto</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── BENTO GRID: 6 CORE OPERATIONAL CAPABILITIES ─────────────────── */}
        <section id="features" className="py-14 sm:py-20 bg-white border-b border-slate-200/70">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Core Capabilities
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                Everything required to run 10 to 60+ beds smoothly
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                No complex training required. Built for quick daily phone or laptop usage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Feature 1 */}
              <Reveal delay={0} className="rounded-2xl border border-slate-200/80 bg-slate-50/30 p-5 sm:p-6 hover:border-slate-300 hover:shadow-md transition-all">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 mb-4">
                  <MessageCircle className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isTa ? "1-கிளிக் வாட்ஸ்அப் வசூல்" : "1-Click WhatsApp Invoicing"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Generate rent bills for all occupied rooms in one tap. Send personalized WhatsApp reminders with direct UPI deep-links that open GPay, PhonePe, or Paytm.
                </p>
              </Reveal>

              {/* Feature 2 */}
              <Reveal delay={100} className="rounded-2xl border border-slate-200/80 bg-slate-50/30 p-5 sm:p-6 hover:border-slate-300 hover:shadow-md transition-all">
                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 mb-4">
                  <BedSingle className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isTa ? "நேரடி படுக்கை ஆக்கிரமிப்பு" : "Real-Time Bed Matrix"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Visual floor map showing occupied, due, and vacant beds. Automatic pro-rata rent calculation for mid-month check-ins and zero double-booking.
                </p>
              </Reveal>

              {/* Feature 3 (Sub-meter) */}
              <Reveal delay={200} className="rounded-2xl border border-slate-200/80 bg-slate-50/30 p-5 sm:p-6 hover:border-slate-300 hover:shadow-md transition-all">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 mb-4">
                  <Zap className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isTa ? "அறை மின் கணக்கீடு" : "Stored Room Sub-Meters"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Automatically remembers last month&apos;s meter reading. Enter the current reading and Bedy splits consumed units equally only among room roommates.
                </p>
              </Reveal>

              {/* Feature 4 */}
              <Reveal delay={300} className="rounded-2xl border border-slate-200/80 bg-slate-50/30 p-5 sm:p-6 hover:border-slate-300 hover:shadow-md transition-all">
                <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 mb-4">
                  <Receipt className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isTa ? "வைப்புத்தொகைத் தீர்வு" : "Itemized Deposit Refunds"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Zero arguments at move-out. Deduct repair damages, unpaid electricity, and notice period shortages with an itemized summary written to audit logs.
                </p>
              </Reveal>

              {/* Feature 5 */}
              <Reveal delay={400} className="rounded-2xl border border-slate-200/80 bg-slate-50/30 p-5 sm:p-6 hover:border-slate-300 hover:shadow-md transition-all">
                <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700 mb-4">
                  <AlertTriangle className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isTa ? "பழுது நீக்கல் மேசை" : "Maintenance Ticket Tracker"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Tenants raise repair tickets directly with photos. Managers assign technicians, monitor progress, and verify fixes without WhatsApp confusion.
                </p>
              </Reveal>

              {/* Feature 6 */}
              <Reveal delay={500} className="rounded-2xl border border-slate-200/80 bg-slate-50/30 p-5 sm:p-6 hover:border-slate-300 hover:shadow-md transition-all">
                <div className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 mb-4">
                  <FileText className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isTa ? "தானியங்கி ரசீதுகள் & அறிக்கை" : "Official PDF Receipts & Export"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Official branded payment receipts sent automatically to tenant WhatsApp. One-click Excel downloads for monthly accounting and tax audits.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── PRICING SECTION (COMBINED FULL MODERN SAAS PRICING) ─────────── */}
        <section id="pricing" className="py-14 sm:py-20 bg-slate-50/50 border-b border-slate-200/70 scroll-mt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-emerald-800">
                <Sparkles className="size-3.5 text-emerald-600" />
                {isTa ? "வெளிப்படையான கட்டணம் · மறைமுகக் கட்டணங்கள் இல்லை" : "Transparent Pricing · Zero Hidden Commissions"}
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-950">
                {isTa ? "உங்கள் பிஜி படுக்கை எண்ணிக்கைக்கு ஏற்ற எளிய கட்டணம்" : "Simple pricing that scales with your PG occupancy"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
                {isTa
                  ? "குடியிருப்போரைத் துரத்தாமல் 100% வாடகையை சரியான நேரத்தில் வசூலியுங்கள். உங்கள் விடுதிக்கு ஏற்ற திட்டத்தைத் தேர்ந்தெடுங்கள்."
                  : "Collect 100% of your rent on time without chasing residents. Pick a plan suited for your property size with zero transaction fees on UPI."}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto">
              {PRICING_TIERS.map((tier, idx) => (
                <Reveal key={tier.name} delay={idx * 100}>
                  <div
                    className={`relative rounded-2xl p-6 sm:p-7 flex flex-col justify-between h-full transition-all ${
                      tier.popular
                        ? "bg-white border-2 border-emerald-500 shadow-md shadow-emerald-500/10 scale-[1.02]"
                        : "bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    {tier.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-xs">
                        {isTa ? "மிகவும் பிரபலமானது" : "Most Popular"}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">
                          {isTa ? tier.nameTa : tier.name}
                        </h3>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {isTa ? tier.bedsTa : tier.beds}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {isTa ? tier.taglineTa : tier.tagline}
                      </p>

                      <div className="mt-5 flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-black text-slate-950">
                          {isTa && tier.priceTa ? tier.priceTa : tier.price}
                        </span>
                        <span className="text-xs text-slate-500">
                          {isTa ? tier.periodTa : tier.period}
                        </span>
                      </div>

                      <div className="mt-6 pt-5 border-t border-slate-100">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                          {isTa ? "சேர்க்கப்பட்டுள்ளவை:" : "What's included:"}
                        </p>
                        <ul className="space-y-2.5 text-xs text-slate-600">
                          {(isTa ? tier.featuresTa : tier.features).map((feat) => (
                            <li key={feat} className="flex items-start gap-2.5">
                              <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="leading-tight">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-8 pt-5 border-t border-slate-100">
                      <a
                        href={tier.ctaLink}
                        className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition shadow-2xs ${
                          tier.popular
                            ? "bg-slate-950 text-white hover:bg-slate-800"
                            : "bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        <span>{isTa ? tier.ctaTa : tier.cta}</span>
                        <ArrowRight className="size-3.5" />
                      </a>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <div className="text-center text-xs text-slate-500 pt-2">
              <p>
                {isTa
                  ? "150-க்கும் மேற்பட்ட படுக்கைகள் கொண்ட கிளைகள் உள்ளதா? "
                  : "Have more than 150 beds across multiple branches? "}
                <Link href="/contact" className="text-emerald-700 font-semibold underline underline-offset-4 hover:text-emerald-800">
                  {isTa ? "எங்கள் குழுவைத் தொடர்பு கொள்ளவும்" : "Talk to our enterprise team"}
                </Link>
                {isTa ? " தனிப்பயன் அமைப்புக்கு." : " for custom setups."}
              </p>
            </div>
          </div>
        </section>

        {/* ── INTERACTIVE OPERATIONAL CALCULATOR ───────────────────────────── */}
        <section id="calculator" className="py-14 sm:py-20 bg-slate-50/60 border-b border-slate-200/70">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Operational Calculator
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                Estimate your monthly time & revenue savings
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Move the sliders to match your property size.
              </p>
            </div>

            <Reveal delay={100}>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Slider 1: Beds */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700">Total Beds Operated</span>
                      <span className="text-emerald-700 font-mono text-sm font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        {calcBeds} Beds
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      step="2"
                      value={calcBeds}
                      onChange={(e) => setCalcBeds(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>10 Beds</span>
                      <span>75 Beds</span>
                      <span>150 Beds</span>
                    </div>
                  </div>

                  {/* Slider 2: Rent */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700">Average Rent Per Bed</span>
                      <span className="text-emerald-700 font-mono text-sm font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        ₹{calcRent.toLocaleString()} / mo
                      </span>
                    </div>
                    <input
                      type="range"
                      min="4000"
                      max="20000"
                      step="500"
                      value={calcRent}
                      onChange={(e) => setCalcRent(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>₹4,000</span>
                      <span>₹12,000</span>
                      <span>₹20,000</span>
                    </div>
                  </div>
                </div>

                {/* Calculation Outputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center">
                  <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">
                      Monthly Rent Turnover
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                      ₹{calculatedMonthlyRevenue.toLocaleString()}
                    </span>
                  </div>

                  <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 uppercase tracking-wider font-bold block">
                      Estimated Time Saved
                    </span>
                    <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
                      ~{estimatedHoursSaved} Hours / mo
                    </span>
                    <span className="text-[9.5px] text-emerald-600 block mt-0.5">
                      No chasing rent calls or register notes
                    </span>
                  </div>

                  <div className="rounded-xl bg-teal-50 p-4 border border-teal-200">
                    <span className="text-[10px] text-teal-800 uppercase tracking-wider font-bold block">
                      Leakage Prevented
                    </span>
                    <span className="text-xl font-extrabold text-teal-700 mt-1 block">
                      ~₹{estimatedLeakagePrevented.toLocaleString()} / mo
                    </span>
                    <span className="text-[9.5px] text-teal-600 block mt-0.5">
                      Unbilled sub-meters & delayed dues
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── AUTHENTIC SEEDED DEMO LOGINS (TEST DRIVE) ───────────────────── */}
        <section id="demo-portals" className="py-14 sm:py-20 bg-white border-b border-slate-200/70">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                1-Click Test Drive
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                {isTa ? "மாதிரி கணக்குகளில் உள்நுழையுங்கள்" : "Try Every Role Instantly"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Click any account below to jump straight into their portal with real seeded PG data. No password or signup required.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
              {/* Card 1: PG Owner */}
              <Reveal delay={0} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-white font-bold">
                      <Building2 className="size-5" />
                    </span>
                    <span className="text-[10px] font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      PG Owner
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Sri Lakshmi Luxury PG</h3>
                  <p className="text-xs text-slate-500 mt-0.5">42 Beds · 18 Rooms · Calendar Month Cycle</p>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    Full owner controls: view bed occupancy, generate batch rent, send WhatsApp reminders, track defaulters, and view revenue analytics.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => quickLogin("owner@srilakshmipg.local", "/admin/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-2xs min-h-[44px]"
                  >
                    {loggingIn === "owner@srilakshmipg.local" ? (
                      <Loader2 className="size-4 animate-spin text-white" />
                    ) : null}
                    <span>Open PG Owner Portal</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </Reveal>

              {/* Card 2: PG Manager */}
              <Reveal delay={150} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <ShieldCheck className="size-5" />
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      PG Manager
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Suresh Kumar</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manager · On-site Operations</p>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    Check-in new tenants, upload ID proofs, record cash/UPI payments, assign maintenance complaints, and settle check-out deposits.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => quickLogin("manager@srilakshmipg.local", "/admin/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-800 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-2xs min-h-[44px]"
                  >
                    {loggingIn === "manager@srilakshmipg.local" ? (
                      <Loader2 className="size-4 animate-spin text-white" />
                    ) : null}
                    <span>Open PG Manager Portal</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </Reveal>

              {/* Card 3: Resident Tenant */}
              <Reveal delay={300} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                      <User className="size-5" />
                    </span>
                    <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Tenant / Resident
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Karthik Raja</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Room 201 (Bed A) · Active Occupant</p>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    View rent breakdown, pay instantly with UPI QR/Cards, download official PDF receipts, and file repair requests.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => quickLogin("resident@srilakshmipg.local", "/resident/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-2xs min-h-[44px]"
                  >
                    {loggingIn === "resident@srilakshmipg.local" ? (
                      <Loader2 className="size-4 animate-spin text-white" />
                    ) : null}
                    <span>Open Resident Portal</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── OPERATOR FAQ ACCORDION ───────────────────────────────────────── */}
        <section className="py-14 sm:py-20 bg-slate-50/60 border-b border-slate-200/70">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                FAQ
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                Common Operator Questions
              </h2>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  q: "Do tenants have to download an app or create a password?",
                  a: "No! Tenants receive a WhatsApp reminder with a direct payment link that opens GPay, PhonePe, or Paytm on their phone. Once paid, the receipt is sent directly back to their WhatsApp.",
                },
                {
                  q: "How does the room-wise electricity sub-meter feature work?",
                  a: "Each room's starting meter reading is remembered automatically from the previous month. On the 1st of the month, enter the current reading. Bedy multiplies units by your rate per unit and divides the total bill equally only among active occupants of that room.",
                },
                {
                  q: "What happens if a tenant moves in the middle of the month?",
                  a: "Bedy automatically computes pro-rata rent based on the exact move-in date and remaining days in the calendar month, so you never have to calculate fractions manually.",
                },
                {
                  q: "How are security deposits settled at check-out?",
                  a: "You enter itemized deductions (e.g. repainting, unbilled electricity units, notice period shortage). The system calculates the net refund and saves a timestamped record to the audit log.",
                },
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                    className="w-full flex items-center justify-between p-4 text-left text-xs sm:text-sm font-bold text-slate-800 hover:text-emerald-700 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`size-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
                        openFaq === idx ? "rotate-180 text-emerald-600" : ""
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── CLEAN MINIMALIST FOOTER ──────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-10 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Bedy" className="size-7 object-contain rounded-lg" />
              <span className="font-bold text-slate-900 text-sm">Bedy</span>
              <span>·</span>
              <span>
                {isTa
                  ? "பிஜி மற்றும் விடுதி நிர்வாக மென்பொருள்"
                  : "Smart PG, Hostel & Co-Living Operations"}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-5 gap-y-2 font-medium text-slate-600">
              <a href="#features" className="hover:text-slate-950 transition-colors">
                {isTa ? "அம்சங்கள்" : "Features"}
              </a>
              <a href="#pricing" className="hover:text-slate-950 transition-colors">
                {isTa ? "கட்டணம்" : "Pricing"}
              </a>
              <a href="#demo-portals" className="hover:text-slate-950 transition-colors">
                {isTa ? "டெமோ" : "Demo"}
              </a>
              <Link href="/contact" className="hover:text-slate-950 transition-colors">
                {isTa ? "தொடர்பு" : "Contact"}
              </Link>
              <Link href="/refund-policy" className="hover:text-slate-950 transition-colors">
                {isTa ? "திருப்பி அளித்தல்" : "Refund Policy"}
              </Link>
              <Link href="/terms" className="hover:text-slate-950 transition-colors">
                {isTa ? "விதிமுறைகள்" : "Terms"}
              </Link>
              <Link href="/privacy" className="hover:text-slate-950 transition-colors">
                {isTa ? "தனியுரிமை" : "Privacy"}
              </Link>
              <Link href="/login" className="hover:text-slate-950 transition-colors font-semibold text-emerald-600">
                {isTa ? "உள்நுழை" : "Sign In"}
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>© {new Date().getFullYear()} Bedy Technologies. All rights reserved.</span>
            <span>Made with ❤️ for PG & Hostel Operators in India</span>
          </div>
        </div>
      </footer>
    </div>
  );
}