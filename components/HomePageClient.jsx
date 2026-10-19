"use client";

import { useState } from "react";
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
  Megaphone,
  CheckCircle2,
  Loader2,
  LogIn,
  Check,
  FileText,
  Sparkles,
  ShieldCheck,
  Users,
  Smartphone,
  ChevronRight,
  CheckCheck,
  Clock,
  Eye,
  Download,
  Building
} from "lucide-react";
import { api } from "@/lib/client/api";
import { homeForRole } from "@/lib/routing";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useTranslation } from "@/components/i18n/LanguageProvider";

export default function HomePageClient({ user = null }) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [loggingIn, setLoggingIn] = useState(null);
  const [demoTab, setDemoTab] = useState("billing"); // "billing" | "resident" | "complaints" | "notices"

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

  const isTa = locale === "ta";

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans overflow-x-hidden">
      {/* Top Session Banner if user is already logged in */}
      {user ? (
        <aside
          aria-label="Active session banner"
          className="bg-slate-900 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold border-b border-slate-800"
        >
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">
                {isTa ? "உள்நுழைந்துள்ள கணக்கு: " : "Logged in as "}
                <strong>{user.name}</strong> ({user.role})
              </span>
            </div>
            <Link
              href={
                user.role === "SUPER_ADMIN"
                  ? "/super-admin/dashboard"
                  : user.role === "SOCIETY_ADMIN"
                  ? "/admin/dashboard"
                  : user.role === "FLAT_ADMIN"
                  ? "/admin/residents"
                  : "/resident/dashboard"
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white hover:bg-white/20 transition-colors shrink-0"
            >
              <span>{isTa ? "டாஷ்போர்டுக்குச் செல்க" : "Go to Dashboard"}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </aside>
      ) : null}

      {/* Modern Responsive Header */}
      <header className="border-b border-slate-200/80 bg-white/95 sticky top-0 z-30 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-slate-900 text-white text-xs font-bold tracking-tight shadow-2xs">
              SD
            </span>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 leading-tight">
                SocietyDesk
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium leading-tight hidden xs:block">
                Housing Society OS
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-slate-950 transition-colors">
              {isTa ? "வசதிகள்" : "Features"}
            </a>
            <a href="#demo-portals" className="hover:text-slate-950 transition-colors">
              {isTa ? "மாதிரி கணக்குகள்" : "Demo Portals"}
            </a>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Language Switcher */}
            <div className="scale-90 sm:scale-100 origin-right">
              <LanguageSwitcher />
            </div>

            {user ? (
              <Link
                href={
                  user.role === "SUPER_ADMIN"
                    ? "/super-admin/dashboard"
                    : user.role === "SOCIETY_ADMIN"
                    ? "/admin/dashboard"
                    : user.role === "FLAT_ADMIN"
                    ? "/admin/residents"
                    : "/resident/dashboard"
                }
                className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl bg-slate-900 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <span>{isTa ? "டாஷ்போர்டு" : "Dashboard"}</span>
                <ArrowRight className="size-3 sm:size-3.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl bg-slate-900 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <LogIn className="size-3.5" />
                <span>{isTa ? "உள்நுழை" : "Sign In"}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-8 sm:py-16 border-b border-slate-200/70 bg-gradient-to-b from-white to-slate-50/70">
          <div className="mx-auto max-w-6xl px-3.5 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Left Column: Authentic, clear messaging */}
              <div className="lg:col-span-6 space-y-4 sm:space-y-5 text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 border border-slate-200/80 px-3 py-1 text-[11px] sm:text-xs font-semibold text-slate-700">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {isTa ? "குடியிருப்பு & அடுக்குமாடி நிர்வாக மென்பொருள்" : "Purpose-Built for Indian Apartment Societies & RWAs"}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  {isTa
                    ? "அடுக்குமாடி நிர்வாகம், எளிமையாகவும் நேர்த்தியாகவும்."
                    : "Apartment operations, clear and stress-free."}
                </h1>

                <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed max-w-xl">
                  {isTa
                    ? "வாட்ஸ்அப் குழப்பங்கள் மற்றும் கணக்குப் பதிவேடுகளுக்கு முற்றுப்புள்ளி வையுங்கள். தானியங்கி மாதாந்திர பில், யுபிஐ கட்டணம், புகார் கண்காணிப்பு மற்றும் முக்கிய அறிவிப்புகளை ஒரே இடத்தில் நிர்வகியுங்கள்."
                    : "Replace chaotic WhatsApp messages and manual spreadsheets. Automated monthly maintenance billing, instant 1-click UPI payments with PDF receipts, repair ticket tracking, and digital broadcast notices."}
                </p>

                {/* 1-Click Public Demo Action Buttons - 200% Mobile Optimized */}
                <div className="pt-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {isTa ? "நேரடி மாதிரி கணக்குகள் (1-கிளிக்):" : "Try live demo instantly (No password needed):"}
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full">
                    {/* Resident Demo Button */}
                    <button
                      type="button"
                      onClick={() => quickLogin("ravi@greenvalley.local", "/resident/dashboard")}
                      disabled={Boolean(loggingIn)}
                      className="flex items-center justify-between sm:justify-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-50 shadow-2xs cursor-pointer min-h-[44px]"
                    >
                      <div className="flex items-center gap-2">
                        {loggingIn === "ravi@greenvalley.local" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <User className="size-4 shrink-0" />
                        )}
                        <span>{isTa ? "குடியிருப்பாளர் (Resident)" : "Test as Resident"}</span>
                      </div>
                      <ArrowRight className="size-3.5 opacity-80" />
                    </button>

                    {/* Society Admin Demo Button */}
                    <button
                      type="button"
                      onClick={() => quickLogin("admin@greenvalley.local", "/admin/dashboard")}
                      disabled={Boolean(loggingIn)}
                      className="flex items-center justify-between sm:justify-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 active:scale-[0.99] transition-all disabled:opacity-50 shadow-2xs cursor-pointer min-h-[44px]"
                    >
                      <div className="flex items-center gap-2">
                        {loggingIn === "admin@greenvalley.local" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Building2 className="size-4 shrink-0" />
                        )}
                        <span>{isTa ? "நிர்வாகி (Society Admin)" : "Test as Society Admin"}</span>
                      </div>
                      <ArrowRight className="size-3.5 opacity-80" />
                    </button>

                    {/* Flat Admin Demo Button */}
                    <button
                      type="button"
                      onClick={() => quickLogin("priya@greenvalley.local", "/admin/residents")}
                      disabled={Boolean(loggingIn)}
                      className="flex items-center justify-between sm:justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50 active:scale-[0.99] transition-all disabled:opacity-50 shadow-2xs cursor-pointer min-h-[44px]"
                    >
                      <div className="flex items-center gap-2">
                        {loggingIn === "priya@greenvalley.local" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <KeyRound className="size-4 text-amber-600 shrink-0" />
                        )}
                        <span>{isTa ? "வீட்டு நிர்வாகி (Flat Admin)" : "Test as Flat Admin"}</span>
                      </div>
                      <ArrowRight className="size-3.5 opacity-60 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Key feature pills */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>{isTa ? "தானியங்கி மாதாந்திர பில்லிங்" : "Batch Maintenance Bills"}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>{isTa ? "உடனடி யுபிஐ & பிடிஎஃப் ரசீது" : "UPI QR & Instant Receipts"}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>{isTa ? "புகார் & அறிவிப்பு மேஜை" : "Repairs & Circulars Desk"}</span>
                  </span>
                </div>
              </div>

              {/* Right Column: Expanded, Crisp Product Showcase (4 Live Feature Views) */}
              <div className="lg:col-span-6 w-full lg:max-w-xl mx-auto lg:ml-auto">
                <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
                  {/* Clean Top Bar */}
                  <div className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="font-semibold text-xs truncate">Green Valley (GVA)</span>
                      <span className="text-slate-400 text-[10px] hidden sm:inline">· Live Demo Showcase</span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {isTa ? "4 காட்சிகள்" : "4 Views"}
                    </span>
                  </div>

                  {/* 4 Feature Tab Selectors */}
                  <div className="flex items-center gap-1 bg-slate-100/90 p-1.5 border-b border-slate-200/80 overflow-x-auto no-scrollbar text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setDemoTab("billing")}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer text-[11px] ${
                        demoTab === "billing"
                          ? "bg-white text-slate-900 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <Receipt className="size-3.5 text-indigo-600" />
                      <span>{isTa ? "பில்லிங் & ரசீது" : "Billing & Dues"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDemoTab("resident")}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer text-[11px] ${
                        demoTab === "resident"
                          ? "bg-white text-slate-900 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <Smartphone className="size-3.5 text-emerald-600" />
                      <span>{isTa ? "குடியிருப்பாளர்" : "Resident App"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDemoTab("complaints")}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer text-[11px] ${
                        demoTab === "complaints"
                          ? "bg-white text-slate-900 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <AlertTriangle className="size-3.5 text-amber-600" />
                      <span>{isTa ? "புகார் மேஜை" : "Complaints"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDemoTab("notices")}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer text-[11px] ${
                        demoTab === "notices"
                          ? "bg-white text-slate-900 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <Megaphone className="size-3.5 text-rose-600" />
                      <span>{isTa ? "அறிவிப்புகள்" : "Circulars"}</span>
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 sm:p-4 min-h-[260px] flex flex-col justify-between">
                    {/* View 1: Billing & Dues */}
                    {demoTab === "billing" && (
                      <div className="space-y-3">
                        {/* KPI Strip */}
                        <div className="rounded-xl bg-slate-50 p-2.5 sm:p-3 border border-slate-100">
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                {isTa ? "அக்டோபர் மாதாந்திர வசூல்" : "October 2026 Collections"}
                              </span>
                              <p className="font-extrabold text-slate-900 text-sm sm:text-base mt-0.5">
                                ₹3,12,000 <span className="text-[11px] font-semibold text-emerald-600">(91.7%)</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-semibold text-slate-500">
                                {isTa ? "செலுத்திய வீடுகள்" : "Settled"}
                              </span>
                              <p className="font-bold text-slate-900 text-xs sm:text-sm">
                                96 <span className="text-slate-400 font-normal">/ 100 Flats</span>
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full w-[91.7%]" />
                          </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between rounded-lg bg-white p-2 border border-slate-100">
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold text-slate-900 text-[11px] truncate">Flat A-101 · Ravi Kumar</p>
                              <p className="text-[10px] text-slate-500">2 BHK Maintenance · Instant UPI</p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 shrink-0">
                              <CheckCheck className="size-3" />
                              <span>₹3,200 Paid</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between rounded-lg bg-white p-2 border border-slate-100">
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold text-slate-900 text-[11px] truncate">Flat B-204 · Ananya Roy</p>
                              <p className="text-[10px] text-slate-500">3 BHK Maintenance · NetBanking</p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 shrink-0">
                              <CheckCheck className="size-3" />
                              <span>₹3,800 Paid</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between rounded-lg bg-white p-2 border border-slate-100">
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold text-slate-900 text-[11px] truncate">Flat C-102 · Priya Sharma</p>
                              <p className="text-[10px] text-slate-500">2 BHK Maintenance · Auto-Reconciled</p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 shrink-0">
                              <CheckCheck className="size-3" />
                              <span>₹3,200 Paid</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* View 2: Resident App View */}
                    {demoTab === "resident" && (
                      <div className="space-y-3">
                        <div className="rounded-xl bg-slate-50 p-2.5 sm:p-3 border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="size-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              RK
                            </div>
                            <div className="min-w-0 truncate">
                              <p className="text-xs font-bold text-slate-900 leading-tight truncate">Ravi Kumar</p>
                              <p className="text-[10px] text-slate-500 leading-tight">Flat A-101 (2 BHK) · Owner</p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200 shrink-0">
                            <CheckCheck className="size-3" />
                            <span>No Outstanding Dues</span>
                          </span>
                        </div>

                        {/* Invoice breakdown card */}
                        <div className="rounded-xl border border-slate-100 p-2.5 sm:p-3 text-xs space-y-1.5">
                          <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-100 pb-1.5">
                            <span className="text-[11px]">October 2026 Maintenance</span>
                            <span className="text-emerald-700 text-xs font-bold">PAID · ₹3,200</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-slate-600 text-[10px] pt-1">
                            <div>
                              <span className="text-slate-400 block">Base Rate:</span>
                              <span className="font-semibold text-slate-900">₹2,500</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Car Parking:</span>
                              <span className="font-semibold text-slate-900">₹500</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Water:</span>
                              <span className="font-semibold text-slate-900">₹200</span>
                            </div>
                          </div>
                        </div>

                        {/* PDF Receipt Banner */}
                        <div className="rounded-lg bg-emerald-50/70 p-2.5 border border-emerald-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <Receipt className="size-4 text-emerald-700 shrink-0" />
                            <span className="text-emerald-900 font-semibold text-[11px] truncate">
                              Official Receipt #REC-GVA-0081
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-700 font-bold underline cursor-pointer shrink-0">
                            Download PDF ↓
                          </span>
                        </div>
                      </div>
                    )}

                    {/* View 3: Complaints Desk Timeline */}
                    {demoTab === "complaints" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-rose-600 uppercase bg-rose-50 px-2 py-0.5 rounded-full ring-1 ring-rose-200">
                            Ticket #CMP-104 · Plumbing Repair
                          </span>
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full ring-1 ring-amber-200">
                            In Progress
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-900">Kitchen sink water pipe leakage</p>
                          <p className="text-[10px] text-slate-500">Raised by Ravi Kumar (Flat A-101)</p>
                        </div>

                        {/* Resolution Timeline */}
                        <div className="relative pl-5 space-y-2 border-l-2 border-indigo-200 ml-1 py-0.5 text-xs">
                          <div className="relative">
                            <span className="absolute -left-[25px] top-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                            <p className="font-semibold text-slate-900 text-[11px]">Complaint Filed · 10:00 AM</p>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[25px] top-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                            <p className="font-semibold text-slate-900 text-[11px]">Assigned to Plumber (Kumar) · 10:15 AM</p>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[25px] top-0.5 size-3 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
                            <p className="font-semibold text-amber-800 text-[11px]">Visit Scheduled · Today 3:00 PM</p>
                          </div>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-2 border border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-600">Assigned Technician: <strong>Kumar (+91 98765-43210)</strong></span>
                          <span className="text-[10px] text-indigo-700 font-semibold">Active</span>
                        </div>
                      </div>
                    )}

                    {/* View 4: Circulars & Notices */}
                    {demoTab === "notices" && (
                      <div className="space-y-3">
                        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              MAINTENANCE NOTICE
                            </span>
                            <span className="text-[10px] text-slate-400">Oct 15, 2026</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900">
                            Overhead Tank Cleaning & Pipeline Servicing
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            Water supply will be paused on Sunday 9:00 AM to 1:00 PM for scheduled descaling. Please store required water in advance.
                          </p>
                        </div>

                        {/* Read Counter Metric */}
                        <div className="rounded-lg bg-indigo-50/80 p-2.5 border border-indigo-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Eye className="size-4 text-indigo-700" />
                            <span className="text-slate-800 font-medium text-[11px]">Read Acknowledgments:</span>
                          </div>
                          <span className="text-[11px] font-bold text-indigo-800">87 of 120 Flats (72.5%)</span>
                        </div>
                      </div>
                    )}

                    {/* Bottom Status bar */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate">
                        {isTa ? "மாதிரித் தகவல்களை முழுமையாகச் சோதிக்க:" : "Experience live with full controls:"}
                      </span>
                      <a href="#demo-portals" className="text-indigo-600 font-semibold hover:underline shrink-0 ml-2">
                        {isTa ? "கணக்குகள் →" : "Demo Logins →"}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars: 3 Clean Minimalist Cards */}
        <section id="features" className="py-12 sm:py-16 border-b border-slate-200/70 bg-white">
          <div className="mx-auto max-w-6xl px-3.5 sm:px-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {isTa ? "அத்தியாவசியக் கருவிகள் மட்டுமே, வீண் குழப்பங்கள் இல்லை" : "Core Tools Without Bloatware"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {isTa
                  ? "நிர்வாகக் குழு மற்றும் குடியிருப்பாளர்கள் தினமும் பயன்படுத்தும் முக்கிய செயல்பாடுகள்."
                  : "Carefully engineered for committee secretaries, flat owners, and residents."}
              </p>
            </div>

            <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-5 sm:p-6 shadow-2xs hover:border-slate-300 transition-colors">
                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 mb-4">
                  <FileText className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isTa ? "பில்லிங் மற்றும் கட்டணங்கள்" : "Billing & Dues Reconciliation"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {isTa
                    ? "ஒவ்வொரு மாதமும் தானாக பில் உருவாக்குதல். யுபிஐ, நெப்ட் அல்லது ரொக்கப் பணத்தைக் குறித்துக்கொண்டு உடனடி பிடிஎஃப் ரசீது வழங்குதல்."
                    : "Generate monthly invoices in batch with fixed, per-sqft, or BHK rates. Settle online via UPI or record cash/cheque payments with instant PDF receipts."}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-5 sm:p-6 shadow-2xs hover:border-slate-300 transition-colors">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 mb-4">
                  <AlertTriangle className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isTa ? "புகார் மற்றும் பராமரிப்பு மேஜை" : "Complaints & Service Timeline"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {isTa
                    ? "குழாய், மின்சாரம், லிப்ட் பழுதுகளை குடியிருப்பாளர்கள் பதிவு செய்யலாம். செயலாளர்கள் ஊழியர்களை நியமித்து நிலவரத்தைக் கண்காணிக்கலாம்."
                    : "Residents file plumbing, electrical, or lift repairs with photos. The secretary assigns staff and both parties track the step-by-step resolution."}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-5 sm:p-6 shadow-2xs hover:border-slate-300 transition-colors">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 mb-4">
                  <Megaphone className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isTa ? "அறிவிப்பு பலகை மற்றும் முகவரி ஏடு" : "Notices & Member Directory"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {isTa
                    ? "பொதுக்கூட்டம் மற்றும் குடிநீர் பராமரிப்பு போன்ற முக்கிய தகவல்களைப் பகிருங்கள். எத்தனை பேர் பார்த்தார்கள் என்ற விவரத்தையும் தெரிந்துகொள்ளுங்கள்."
                    : "Publish emergency circulars and AGM announcements with real-time read receipts. Manage owner and tenant directory with one-click bulk CSV import."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Public Demo Portals Section: Strictly 3 Roles (Super Admin is NEVER listed here) */}
        <section id="demo-portals" className="py-12 sm:py-16 bg-slate-50/60">
          <div className="mx-auto max-w-6xl px-3.5 sm:px-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isTa ? "நேரடி மாதிரி" : "Live Demo"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {isTa ? "ஒரே கிளிக்கில் சோதித்துப் பாருங்கள்" : "Explore Public Roles with One Click"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {isTa
                  ? "கீழே உள்ள ஏதேனும் ஒரு பாத்திரத்தைத் தேர்ந்தெடுத்து மாதிரித் தகவல்களை உடனே பார்வையிடுங்கள்."
                  : "Click any account below to jump straight into their portal with pre-populated demo data."}
              </p>
            </div>

            <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Card 1: Resident */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                      <User className="size-5" />
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase">
                      Resident
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Ravi Kumar</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Flat A-101 · Green Valley Apartments</p>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {isTa
                      ? "மாதாந்திர கட்டண நிலுவைகளைப் பார்க்கவும், யுபிஐ மூலம் மாதிரி கட்டணம் செலுத்தவும், அதிகாரப்பூர்வ ரசீதுகளைப் பதிவிறக்கவும்."
                      : "Check monthly maintenance dues, make test UPI payments, download official receipts, and raise plumbing complaints."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => quickLogin("ravi@greenvalley.local", "/resident/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-2xs min-h-[44px]"
                  >
                    {loggingIn === "ravi@greenvalley.local" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    <span>{isTa ? "குடியிருப்பாளர் பக்கம் செல்" : "Open Resident Portal"}</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2: Society Admin */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <Building2 className="size-5" />
                    </span>
                    <span className="text-[11px] font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase">
                      Society Admin
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Lakshmi Iyer</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Secretary · Green Valley Apartments</p>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {isTa
                      ? "அனைத்து வீடுகளுக்கும் பில் உருவாக்குதல், பணம் செலுத்துதல் பதிவு, புகார்களைப் பணியாளர்களுக்குப் பிரித்து வழங்குதல், சுற்றறிக்கை வெளியிடுதல்."
                      : "Generate monthly invoices for all flats, record cash/cheque payments, assign complaints, view defaulters, and post notices."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => quickLogin("admin@greenvalley.local", "/admin/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-2xs min-h-[44px]"
                  >
                    {loggingIn === "admin@greenvalley.local" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    <span>{isTa ? "நிர்வாகி பக்கம் செல்" : "Open Admin Portal"}</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 3: Flat Admin (Priya Sharma - Replaces Super Admin) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <KeyRound className="size-5" />
                    </span>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full uppercase">
                      Flat Admin
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Priya Sharma</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Flat A-102 · Green Valley Apartments</p>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {isTa
                      ? "வீடு A-102 குடியிருப்பாளர்களை நிர்வகிக்கவும், புதிய வாடகைதாரர்களைச் சேர்க்கவும், பராமரிப்புக் கட்டண நிலுவைகளைப் பார்க்கவும்."
                      : "Manage Flat A-102 residents and tenants, track flat payments, view flat-level dues, and submit maintenance tickets."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => quickLogin("priya@greenvalley.local", "/admin/residents")}
                    disabled={Boolean(loggingIn)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-3 text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-50 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-2xs min-h-[44px]"
                  >
                    {loggingIn === "priya@greenvalley.local" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    <span>{isTa ? "வீட்டு நிர்வாகி பக்கம் செல்" : "Open Flat Admin Portal"}</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 sm:py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-3.5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">SocietyDesk</span>
            <span>·</span>
            <span>
              {isTa
                ? "அடுக்குமாடி மற்றும் குடியிருப்பு நிர்வாக மென்பொருள்"
                : "Apartment & Housing Society Management"}
            </span>
          </div>

          <div className="flex items-center gap-5 font-medium text-slate-600">
            <Link href="/login" className="hover:text-slate-950 transition-colors">
              {isTa ? "உள்நுழை" : "Sign In"}
            </Link>
            <Link href="/forgot-password" className="hover:text-slate-950 transition-colors">
              {isTa ? "கடவுச்சொல் மீட்பு" : "Reset Password"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
