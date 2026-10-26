"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  ArrowRight,
  Receipt,
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
  Zap,
  TrendingUp,
  XCircle,
  IndianRupee,
  BarChart3,
  Bell,
  FileText,
  Shield,
  Clock,
  Star,
  ArrowUpRight,
  Play,
  ChevronDown,
  Layers,
  Globe,
  Headphones,
} from "lucide-react";
import { api } from "@/lib/client/api";
import { homeForRole } from "@/lib/routing";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useTranslation } from "@/components/i18n/LanguageProvider";

/* ── Scroll-reveal hook (CSS-only IntersectionObserver) ─────────────────── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── Animated counter ───────────────────────────────────────────────────── */
function Counter({ target, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useReveal(0.3);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target, duration]);
  return <span ref={ref}>{count.toLocaleString("en-IN")}{suffix}</span>;
}

/* ── Reveal wrapper ─────────────────────────────────────────────────────── */
function Reveal({ children, className = "", delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ── Staggered children wrapper ─────────────────────────────────────────── */
function StaggerReveal({ children, className = "", stagger = 100 }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(24px)",
                transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${i * stagger}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${i * stagger}ms`,
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}

export default function HomePageClient({ user = null }) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [loggingIn, setLoggingIn] = useState(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Auto-cycle features in showcase
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature((p) => (p + 1) % 4);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const isTa = locale === "ta";

  const features = [
    {
      icon: MessageCircle,
      color: "emerald",
      title: "1-Click WhatsApp Collection",
      desc: "Send personalized rent reminders with direct UPI payment links. Tenants pay in one tap — you get instant confirmation.",
    },
    {
      icon: BedSingle,
      color: "indigo",
      title: "Live Bed Occupancy Matrix",
      desc: "Real-time visual dashboard showing every room and bed status. Know exactly who's in, who's out, and where vacancies are.",
    },
    {
      icon: Receipt,
      color: "amber",
      title: "Smart Deposit Settlements",
      desc: "Itemized deductions with full audit trail. No more arguments — transparent settlements that both parties trust.",
    },
    {
      icon: BarChart3,
      color: "violet",
      title: "Revenue Analytics & Reports",
      desc: "Track collections, outstanding dues, occupancy rates. Export monthly reports. Make data-driven decisions.",
    },
    {
      icon: Bell,
      color: "rose",
      title: "Maintenance Ticket System",
      desc: "Tenants raise complaints from their phone. Auto-assign technicians. Track resolution with photo proof.",
    },
    {
      icon: FileText,
      color: "cyan",
      title: "Auto Invoice & PDF Receipts",
      desc: "Generate bulk invoices monthly. Branded PDF receipts auto-sent to tenant WhatsApp after payment.",
    },
  ];

  const colorMap = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", iconBg: "bg-emerald-100" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", iconBg: "bg-indigo-100" },
    amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", iconBg: "bg-amber-100" },
    violet: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", iconBg: "bg-violet-100" },
    rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", iconBg: "bg-rose-100" },
    cyan: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", iconBg: "bg-cyan-100" },
  };

  const showcaseTabs = [
    { key: "rent", icon: IndianRupee, label: "Rent Collection" },
    { key: "beds", icon: BedSingle, label: "Bed Matrix" },
    { key: "deposit", icon: Receipt, label: "Deposit Refund" },
    { key: "complaints", icon: Bell, label: "Complaints" },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans overflow-x-hidden antialiased selection:bg-emerald-200 selection:text-emerald-950">
      {/* ── Session Banner ─────────────────────────────────────────────── */}
      {user ? (
        <aside className="bg-slate-950 text-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold border-b border-slate-800">
          <div className="mx-auto max-w-7xl flex flex-row items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">
                Logged in as <strong>{user.name}</strong> ({user.role})
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white hover:bg-white/20 transition-colors shrink-0"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </aside>
      ) : null}

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white text-base font-black tracking-tight shadow-lg shadow-emerald-600/25 group-hover:shadow-emerald-600/40 group-hover:scale-105 transition-all duration-300">
              B
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-950 leading-tight">
                Bedy
              </span>
              <span className="text-[9px] text-slate-400 font-semibold leading-tight tracking-wider uppercase hidden sm:block">
                PG & Hostel OS
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-slate-500">
            <a href="#features" className="hover:text-slate-950 transition-colors duration-200">
              Features
            </a>
            <a href="#showcase" className="hover:text-slate-950 transition-colors duration-200">
              Live Preview
            </a>
            <a href="#why-bedy" className="hover:text-slate-950 transition-colors duration-200">
              Why Bedy
            </a>
            <a href="#demo-portals" className="hover:text-slate-950 transition-colors duration-200">
              Demo
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
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
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-950/20"
              >
                Dashboard
                <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all duration-200 shadow-lg shadow-slate-950/20"
              >
                <LogIn className="size-3.5" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── HERO ────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-50" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-50 via-transparent to-transparent rounded-full opacity-60" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-indigo-50 via-transparent to-transparent rounded-full opacity-40" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 lg:pt-28 pb-16 sm:pb-24 lg:pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Copy */}
              <div className="space-y-6 sm:space-y-8">
                <Reveal>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-emerald-800">
                    <Sparkles className="size-3.5 text-emerald-600" />
                    <span>Purpose-Built for PGs, Hostels & Co-Living</span>
                  </div>
                </Reveal>

                <Reveal delay={100}>
                  <h1 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold tracking-tight text-slate-950 leading-[1.12]">
                    Stop chasing rent.
                    <br />
                    <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                      Start collecting it.
                    </span>
                  </h1>
                </Reveal>

                <Reveal delay={200}>
                  <p className="text-sm sm:text-base lg:text-lg text-slate-500 leading-relaxed max-w-lg">
                    Bedy replaces paper registers, Excel sheets, and awkward phone calls.
                    Automated WhatsApp reminders, instant UPI payments, live bed tracking,
                    and transparent deposit settlements — all in one place.
                  </p>
                </Reveal>

                <Reveal delay={300}>
                  <div className="flex flex-col sm:flex-row items-start gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => quickLogin("owner@srilakshmipg.local", "/admin/dashboard")}
                      disabled={Boolean(loggingIn)}
                      className="group inline-flex items-center gap-2.5 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 shadow-xl shadow-emerald-600/25 hover:shadow-emerald-600/40 cursor-pointer"
                    >
                      {loggingIn === "owner@srilakshmipg.local" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Play className="size-4 fill-current" />
                      )}
                      <span>Try Live Demo — Free</span>
                      <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                    >
                      <LogIn className="size-4" />
                      Sign In
                    </Link>
                  </div>
                </Reveal>

                <Reveal delay={400}>
                  <div className="flex items-center gap-6 pt-4 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-emerald-500" /> No credit card
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-emerald-500" /> Setup in 2 minutes
                    </span>
                    <span className="flex items-center gap-1.5 hidden sm:flex">
                      <Check className="size-3.5 text-emerald-500" /> Works on phone
                    </span>
                  </div>
                </Reveal>
              </div>

              {/* Right: Stats + Mini Dashboard Preview */}
              <Reveal delay={200}>
                <div className="relative">
                  {/* Glow behind card */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-emerald-100/50 via-indigo-100/30 to-violet-100/50 rounded-[32px] blur-2xl opacity-60" />

                  <div className="relative rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden">
                    {/* Dashboard Top Bar */}
                    <div className="bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-black">B</span>
                        <div>
                          <div className="font-bold text-xs">Sri Lakshmi Luxury PG</div>
                          <div className="text-[10px] text-slate-400">Bedy Dashboard · Live</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-semibold text-emerald-400">Online</span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-px bg-slate-100">
                      <div className="bg-white p-4 text-center">
                        <div className="text-2xl font-extrabold text-slate-900 tabular">
                          <Counter target={42} />
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Total Beds</div>
                      </div>
                      <div className="bg-white p-4 text-center">
                        <div className="text-2xl font-extrabold text-emerald-600 tabular">
                          <Counter target={84} suffix="%" />
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Occupancy</div>
                      </div>
                      <div className="bg-white p-4 text-center">
                        <div className="text-2xl font-extrabold text-slate-900 tabular">
                          ₹<Counter target={492000} duration={2500} />
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Collected</div>
                      </div>
                    </div>

                    {/* Mini room list */}
                    <div className="p-4 space-y-2">
                      {[
                        { room: "101", beds: "2S", tenants: ["Rahul S.", "Priya M."], status: "PAID", color: "emerald" },
                        { room: "201", beds: "3S AC", tenants: ["Karthik R.", "Suresh M."], status: "DUE", color: "amber" },
                        { room: "301", beds: "2S", tenants: ["Arun K."], status: "VACANT", color: "slate" },
                      ].map((r) => (
                        <div key={r.room} className="flex items-center justify-between rounded-xl bg-slate-50/80 border border-slate-100 px-3.5 py-2.5 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-white text-[10px] font-bold">{r.room}</span>
                            <div>
                              <div className="font-bold text-slate-800 text-[11px]">Room {r.room} ({r.beds})</div>
                              <div className="text-[10px] text-slate-400">{r.tenants.join(" · ")}</div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            r.color === "emerald" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            r.color === "amber" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Bottom action */}
                    <div className="px-4 pb-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-xl bg-emerald-600 text-white font-bold text-center py-2.5 text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20">
                          <MessageCircle className="size-3.5" />
                          Send WhatsApp Reminders
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 flex items-center gap-1">
                          <QrCode className="size-3.5" />
                          UPI
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Trusted By / Social Proof Bar ────────────────────────────── */}
        <section className="py-8 border-y border-slate-100 bg-slate-50/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trusted by PG owners across India</div>
                <div className="flex items-center gap-8 sm:gap-12">
                  <div className="text-center">
                    <div className="text-xl font-extrabold text-slate-900"><Counter target={500} suffix="+" /></div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Beds Managed</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="text-center">
                    <div className="text-xl font-extrabold text-slate-900">₹<Counter target={25} suffix="L+" /></div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Rent Collected</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="text-center">
                    <div className="text-xl font-extrabold text-emerald-600"><Counter target={98} suffix="%" /></div>
                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">On-time Pay</div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Features Grid ───────────────────────────────────────────── */}
        <section id="features" className="py-16 sm:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="text-center max-w-2xl mx-auto mb-14">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-4">
                  <Layers className="size-3.5" />
                  Everything You Need
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-950">
                  Run 10 to 100+ beds without the chaos
                </h2>
                <p className="mt-3 text-sm sm:text-base text-slate-500">
                  No complex training. Built for quick daily usage on phone or laptop.
                </p>
              </div>
            </Reveal>

            <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" stagger={80}>
              {features.map((f, i) => {
                const c = colorMap[f.color];
                return (
                  <div
                    key={i}
                    className="group rounded-2xl border border-slate-200/80 bg-white p-6 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100/80 transition-all duration-300 cursor-default"
                  >
                    <div className={`flex size-11 items-center justify-center rounded-xl ${c.iconBg} ${c.text} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <f.icon className="size-5" />
                    </div>
                    <h3 className="text-[15px] font-bold text-slate-900">{f.title}</h3>
                    <p className="mt-2 text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </StaggerReveal>
          </div>
        </section>

        {/* ── Interactive Showcase ─────────────────────────────────────── */}
        <section id="showcase" className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-white border-y border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-950">
                  See it in action
                </h2>
                <p className="mt-3 text-sm sm:text-base text-slate-500">
                  Real interface, real data. Click through the tabs to explore.
                </p>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="max-w-4xl mx-auto">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
                  {/* Tab bar */}
                  <div className="flex items-center gap-1 bg-slate-50 p-1.5 border-b border-slate-100 overflow-x-auto">
                    {showcaseTabs.map((tab, i) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveFeature(i)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 cursor-pointer ${
                          activeFeature === i
                            ? "bg-white text-slate-900 shadow-md shadow-slate-200/60 ring-1 ring-slate-200/80"
                            : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
                        }`}
                      >
                        <tab.icon className={`size-4 ${activeFeature === i ? "text-emerald-600" : "text-slate-400"}`} />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6 min-h-[340px]">
                    {/* Rent Collection */}
                    {activeFeature === 0 && (
                      <div className="space-y-4 animate-rise">
                        <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/60 p-4 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                              <MessageCircle className="size-3.5" /> WhatsApp Auto-Reminder
                            </span>
                            <span className="text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">Delivered ✓</span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed bg-white rounded-lg p-3 border border-emerald-100 font-mono">
                            &quot;Hi Karthik, your Room 201 (Bed A) rent for October (₹14,000) is due by 5th.
                            <br />Tap to pay: <strong className="text-emerald-700">bedy.in/pay/inv_123</strong>
                            <br />— Sri Lakshmi Luxury PG&quot;
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">1-Click Pay Page</div>
                              <div className="font-bold text-slate-900 text-sm">Room 201 · Bed A · Karthik</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-slate-400">Amount Due</div>
                              <div className="font-extrabold text-emerald-700 text-xl">₹14,000</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 rounded-xl bg-emerald-600 text-white font-bold text-center py-2.5 text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2">
                              <Smartphone className="size-4" /> Pay with UPI (GPay / PhonePe)
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-500">
                              <QrCode className="size-5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bed Matrix */}
                    {activeFeature === 1 && (
                      <div className="space-y-4 animate-rise">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">Live Bed Status</span>
                          <span className="text-slate-500">35 Occupied · 6 Vacant · 1 Reserved</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { room: "101", type: "2-Sharing", rent: "₹7,500", beds: [{ label: "A", name: "Rahul Sharma", status: "PAID" }, { label: "B", name: "VACANT", status: "VACANT" }] },
                            { room: "201", type: "3-Sharing AC", rent: "₹14,000", beds: [{ label: "A", name: "Karthik Raja", status: "DUE 5th" }, { label: "B", name: "Suresh M", status: "PAID" }] },
                            { room: "301", type: "Single AC", rent: "₹18,000", beds: [{ label: "A", name: "Deepak R", status: "PAID" }] },
                            { room: "102", type: "2-Sharing", rent: "₹7,500", beds: [{ label: "A", name: "Arun Kumar", status: "NOTICE" }, { label: "B", name: "Vikram S", status: "PAID" }] },
                          ].map((r) => (
                            <div key={r.room} className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 text-xs">Room {r.room} ({r.type})</span>
                                <span className="text-[10px] font-semibold text-emerald-700">{r.rent}/mo</span>
                              </div>
                              {r.beds.map((b) => (
                                <div key={b.label} className={`flex items-center justify-between rounded-lg p-2 text-[11px] ${
                                  b.status === "VACANT" ? "bg-emerald-50 border border-dashed border-emerald-300" : "bg-white border border-slate-200/70"
                                }`}>
                                  <span className={`font-semibold ${b.status === "VACANT" ? "text-emerald-800" : "text-slate-800"}`}>
                                    Bed {b.label}: {b.name}
                                  </span>
                                  <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                                    b.status === "PAID" ? "text-emerald-700 bg-emerald-50" :
                                    b.status === "VACANT" ? "text-emerald-700" :
                                    b.status === "NOTICE" ? "text-rose-700 bg-rose-50" :
                                    "text-amber-700 bg-amber-50"
                                  }`}>
                                    {b.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deposit */}
                    {activeFeature === 2 && (
                      <div className="space-y-4 animate-rise">
                        <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                              <div className="font-bold text-slate-900 text-sm">Arun Kumar · Check-Out</div>
                              <div className="text-[10px] text-slate-500">Room 102 (Bed A) · Notice: 30 Days</div>
                            </div>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">SETTLING</span>
                          </div>
                          <div className="space-y-2 text-xs text-slate-600">
                            <div className="flex justify-between"><span>Security Deposit Held:</span><span className="font-bold text-slate-900">₹15,000</span></div>
                            <div className="flex justify-between text-rose-600"><span>Less: Room Cleaning:</span><span className="font-bold">−₹1,000</span></div>
                            <div className="flex justify-between text-rose-600"><span>Less: Electricity Arrears:</span><span className="font-bold">−₹1,200</span></div>
                            <div className="flex justify-between text-rose-600"><span>Less: Pro-rata (10 days):</span><span className="font-bold">−₹2,500</span></div>
                            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                              <span>Net Refund Payable:</span>
                              <span className="text-emerald-700 text-base">₹10,300</span>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-[10px] text-slate-500 flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><Shield className="size-3 text-slate-400" /> Written to immutable audit log</span>
                          <span className="font-semibold text-slate-600">Bed auto-vacated</span>
                        </div>
                      </div>
                    )}

                    {/* Complaints */}
                    {activeFeature === 3 && (
                      <div className="space-y-4 animate-rise">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full ring-1 ring-rose-200">
                            Ticket #CMP-104 · AC Cooling Leak
                          </span>
                          <span className="font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full ring-1 ring-amber-200">
                            Technician Assigned
                          </span>
                        </div>
                        <div className="text-xs">
                          <p className="font-bold text-slate-900">Room 201 AC leaking water inside room</p>
                          <p className="text-slate-500 mt-0.5">Raised by Karthik Raja · Photo attached</p>
                        </div>
                        <div className="relative pl-6 space-y-3 border-l-2 border-emerald-300 ml-1 py-1">
                          {[
                            { text: "Ticket Created by Tenant", time: "09:30 AM", done: true },
                            { text: "Manager Assigned AC Tech (Manoj)", time: "09:45 AM", done: true },
                            { text: "Service Scheduled", time: "Today 2:00 PM", done: false },
                          ].map((step, i) => (
                            <div key={i} className="relative">
                              <span className={`absolute -left-[25px] top-0.5 size-3 rounded-full ring-2 ring-white ${step.done ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                              <p className={`font-semibold text-[11px] ${step.done ? "text-slate-800" : "text-amber-800"}`}>
                                {step.text} · {step.time}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 flex items-center justify-between text-xs">
                          <span className="text-slate-600">Technician: <strong>Manoj (+91 98450-11223)</strong></span>
                          <span className="text-emerald-700 font-bold">In Progress</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Why Bedy (Old vs New) ───────────────────────────────────── */}
        <section id="why-bedy" className="py-16 sm:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="text-center max-w-2xl mx-auto mb-14">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-4">
                  <Zap className="size-3.5" />
                  The Bedy Advantage
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-950">
                  Why PG owners are switching
                </h2>
                <p className="mt-3 text-sm text-slate-500">
                  Collect rent 3× faster with zero stress. Here&apos;s how Bedy transforms your daily routine.
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Reveal>
                <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/50 to-white p-6 sm:p-7 space-y-4 h-full">
                  <div className="flex items-center gap-2.5 text-rose-700 font-bold text-sm">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-rose-100">
                      <XCircle className="size-4" />
                    </div>
                    <span>The Old Way</span>
                  </div>
                  <ul className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {[
                      "Calling tenants 10 times to chase overdue rent",
                      "Double-booking beds or forgetting occupancy",
                      "Arguments over deposit deductions at check-out",
                      "Lost receipts and manual mid-month calculations",
                      "Zero visibility into pending collections",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="text-rose-400 font-bold mt-0.5">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={150}>
                <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 to-white p-6 sm:p-7 space-y-4 shadow-lg shadow-emerald-100/30 h-full">
                  <div className="flex items-center gap-2.5 text-emerald-800 font-bold text-sm">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    </div>
                    <span>The Bedy Way</span>
                  </div>
                  <ul className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {[
                      "1-Click WhatsApp reminders with instant UPI pay links",
                      "Real-time bed matrix — always know who's where",
                      "Itemized deposit calculator logged to audit trail",
                      "Auto PDF receipts sent to tenant WhatsApp",
                      "Live revenue dashboard with collection analytics",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────────────── */}
        <section className="py-16 sm:py-24 bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="text-center max-w-2xl mx-auto mb-14">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                  Up and running in <span className="text-emerald-400">3 steps</span>
                </h2>
                <p className="mt-3 text-sm text-slate-400">
                  No installation. No training. Just sign up and go.
                </p>
              </div>
            </Reveal>

            <StaggerReveal className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto" stagger={150}>
              {[
                {
                  step: "01",
                  title: "Add Your PG",
                  desc: "Enter your PG name, rooms, and bed layout. Takes 2 minutes.",
                  icon: Building2,
                },
                {
                  step: "02",
                  title: "Check In Tenants",
                  desc: "Add tenant details, set rent amount, and upload ID proofs.",
                  icon: Users,
                },
                {
                  step: "03",
                  title: "Collect Rent",
                  desc: "Generate invoices, send WhatsApp reminders. Money flows in automatically.",
                  icon: IndianRupee,
                },
              ].map((s) => (
                <div key={s.step} className="relative rounded-2xl border border-slate-800 bg-slate-900/50 p-6 hover:border-slate-700 transition-colors duration-300">
                  <span className="absolute -top-3 left-6 bg-emerald-600 text-white text-xs font-black px-3 py-1 rounded-full">
                    {s.step}
                  </span>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-slate-800 text-emerald-400 mb-4 mt-2">
                    <s.icon className="size-5" />
                  </div>
                  <h3 className="text-base font-bold">{s.title}</h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </StaggerReveal>
          </div>
        </section>

        {/* ── Demo Portals ────────────────────────────────────────────── */}
        <section id="demo-portals" className="py-16 sm:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="text-center max-w-2xl mx-auto mb-14">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-4">
                  <Play className="size-3.5" />
                  Live Demo Accounts
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-950">
                  Try every role — no signup needed
                </h2>
                <p className="mt-3 text-sm text-slate-500">
                  Click any card below to log in instantly with real seeded PG data.
                </p>
              </div>
            </Reveal>

            <StaggerReveal className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto" stagger={100}>
              {/* PG Owner */}
              <div className="group rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-50 transition-all duration-300">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white font-bold shadow-lg">
                      <Building2 className="size-5" />
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">Owner</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Sri Lakshmi Luxury PG</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">42 Beds · 18 Rooms · Calendar Cycle</p>
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    Full owner controls: bed occupancy, batch rent, WhatsApp reminders, defaulter tracking, revenue analytics.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => quickLogin("owner@srilakshmipg.local", "/admin/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 text-xs font-bold text-white hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-slate-950/15 min-h-[44px]"
                  >
                    {loggingIn === "owner@srilakshmipg.local" ? <Loader2 className="size-4 animate-spin" /> : null}
                    <span>Open Owner Portal</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* PG Manager */}
              <div className="group rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-50 transition-all duration-300">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <ShieldCheck className="size-5" />
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Manager</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Suresh Kumar</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Manager · On-site Operations</p>
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    Check-in tenants, upload ID proofs, record payments, assign complaints, and settle deposits.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => quickLogin("manager@srilakshmipg.local", "/admin/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-600/15 min-h-[44px]"
                  >
                    {loggingIn === "manager@srilakshmipg.local" ? <Loader2 className="size-4 animate-spin" /> : null}
                    <span>Open Manager Portal</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Resident */}
              <div className="group rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                      <User className="size-5" />
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Tenant</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Karthik Raja</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Room 201 (Bed A) · Active Occupant</p>
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    View rent breakdown, pay with UPI/QR, download PDF receipts, and file repair requests.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => quickLogin("resident@srilakshmipg.local", "/resident/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/15 min-h-[44px]"
                  >
                    {loggingIn === "resident@srilakshmipg.local" ? <Loader2 className="size-4 animate-spin" /> : null}
                    <span>Open Tenant Portal</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </StaggerReveal>
          </div>
        </section>

        {/* ── CTA Banner ──────────────────────────────────────────────── */}
        <section className="py-16 sm:py-24 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <Reveal>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
                Ready to stop chasing rent and start growing your PG?
              </h2>
              <p className="mt-4 text-sm sm:text-base text-emerald-100 max-w-lg mx-auto">
                Join hundreds of PG owners who&apos;ve already made the switch. Free to start, no credit card required.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => quickLogin("owner@srilakshmipg.local", "/admin/dashboard")}
                  disabled={Boolean(loggingIn)}
                  className="group inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-4 text-sm font-bold text-emerald-700 hover:bg-emerald-50 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 shadow-xl shadow-emerald-900/20 cursor-pointer"
                >
                  {loggingIn === "owner@srilakshmipg.local" ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4 fill-current" />}
                  <span>Start Free Demo</span>
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 backdrop-blur px-6 py-4 text-sm font-semibold text-white hover:bg-white/20 transition-all duration-200"
                >
                  <LogIn className="size-4" />
                  Sign In to Your Account
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-slate-950 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-black text-sm">B</span>
                <span className="font-bold text-white text-lg">Bedy</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Smart PG, Hostel & Co-Living Operations Platform. Made with ❤️ in India.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Product</h4>
              <div className="space-y-2">
                <Link href="/features" className="block text-xs text-slate-400 hover:text-white transition-colors">Features</Link>
                <Link href="/pricing" className="block text-xs text-slate-400 hover:text-white transition-colors">Pricing</Link>
                <a href="#demo-portals" className="block text-xs text-slate-400 hover:text-white transition-colors">Live Demo</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Legal</h4>
              <div className="space-y-2">
                <Link href="/terms" className="block text-xs text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="block text-xs text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/refund-policy" className="block text-xs text-slate-400 hover:text-white transition-colors">Refund Policy</Link>
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Support</h4>
              <div className="space-y-2">
                <Link href="/login" className="block text-xs text-slate-400 hover:text-white transition-colors">Sign In</Link>
                <a href="mailto:support@bedy.in" className="block text-xs text-slate-400 hover:text-white transition-colors">support@bedy.in</a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>© {new Date().getFullYear()} Bedy Technologies. All rights reserved.</span>
            <span className="flex items-center gap-1.5">
              <Globe className="size-3" />
              <span>bedy.in</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
