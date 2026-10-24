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
  Building,
  BedSingle,
  DoorOpen,
  MessageCircle,
  QrCode,
  Shield,
  Zap,
  TrendingUp,
  FileSpreadsheet,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/client/api";
import { homeForRole } from "@/lib/routing";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useTranslation } from "@/components/i18n/LanguageProvider";

export default function HomePageClient({ user = null }) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [loggingIn, setLoggingIn] = useState(null);
  const [demoTab, setDemoTab] = useState("whatsapp"); // "whatsapp" | "beds" | "deposit" | "maintenance"

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
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans overflow-x-hidden antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Session Banner if user is already logged in */}
      {user ? (
        <aside
          aria-label="Active session banner"
          className="bg-slate-950 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-semibold border-b border-slate-800"
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
                  : user.role === "OWNER" || user.role === "MANAGER" || user.role === "SOCIETY_ADMIN"
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

      {/* Modern Clean Header */}
      <header className="border-b border-slate-200/80 bg-white/95 sticky top-0 z-30 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex h-14 sm:h-16 items-center justify-between px-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white text-base font-black tracking-tight shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              B
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-950 leading-tight">
                  Bedy
                </span>
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 uppercase tracking-wide">
                  PG & Hostel
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium leading-tight hidden xs:block">
                Smart Operations OS
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#live-preview" className="hover:text-slate-950 transition-colors">
              {isTa ? "நேரடி மாதிரி" : "Live Showcase"}
            </a>
            <a href="#why-bedy" className="hover:text-slate-950 transition-colors">
              {isTa ? "ஏன் Bedy?" : "Why Bedy"}
            </a>
            <a href="#features" className="hover:text-slate-950 transition-colors">
              {isTa ? "வசதிகள்" : "Features"}
            </a>
            <a href="#demo-portals" className="hover:text-slate-950 transition-colors">
              {isTa ? "மாதிரி கணக்குகள்" : "Demo Logins"}
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Switcher */}
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
                className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl bg-slate-950 px-3 sm:px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <span>{isTa ? "டாஷ்போர்டு" : "Dashboard"}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 sm:px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
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
        <section className="py-10 sm:py-16 lg:py-20 border-b border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/70">
          <div className="mx-auto max-w-6xl px-3.5 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Authentic, punchy messaging */}
              <div className="lg:col-span-6 space-y-4 sm:space-y-6 text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-[11px] sm:text-xs font-bold text-emerald-800">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {isTa
                      ? "பிஜி & விடுதிகளுக்கான நவீன மென்பொருள்"
                      : "Purpose-Built for PGs, Hostels & Co-Living Spaces"}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
                  {isTa ? (
                    <>
                      வாடகை வசூல் தானியங்கி முறையில்.{" "}
                      <span className="text-emerald-700">கணக்கு நோட்டுகள் தேவையில்லை.</span>
                    </>
                  ) : (
                    <>
                      Rent Collection on Autopilot.{" "}
                      <span className="text-emerald-700">Zero Notebook Chasing.</span>
                    </>
                  )}
                </h1>

                <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-relaxed max-w-xl">
                  {isTa
                    ? "கணக்கு நோட்டுகள், எக்செல் தாள்கள் மற்றும் வாட்ஸ்அப் குழப்பங்களுக்கு முற்றுப்புள்ளி வையுங்கள். படுக்கை வாரியான ஆக்கிரமிப்பு, 1-கிளிக் வாட்ஸ்அப் யுபிஐ நினைவூட்டல், பாதுகாப்புக் கட்டணக் கணக்கு மற்றும் பராமரிப்புப் புகார்கள் அனைத்தும் ஒரே இடத்தில்."
                    : "Bedy replaces paper registers, Excel sheets, and awkward rent phone calls. Track bed occupancy live, send 1-click WhatsApp payment reminders with instant UPI links, settle security deposits with itemized deductions, and resolve tenant complaints digitally."}
                </p>

                {/* 1-Click Public Demo Action Buttons */}
                <div className="pt-2 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {isTa ? "நேரடி மாதிரி கணக்குகள் (1-கிளிக்):" : "Try live demo instantly (No password needed):"}
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Ready to test
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 w-full">
                    {/* PG Owner Demo Button */}
                    <button
                      type="button"
                      onClick={() => quickLogin("owner@srilakshmipg.local", "/admin/dashboard")}
                      disabled={Boolean(loggingIn)}
                      className="flex items-center justify-between gap-2 rounded-xl bg-slate-950 px-3.5 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 active:scale-[0.99] transition-all disabled:opacity-50 shadow-2xs cursor-pointer min-h-[46px]"
                    >
                      <div className="flex items-center gap-2.5">
                        {loggingIn === "owner@srilakshmipg.local" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Building2 className="size-4 shrink-0 text-emerald-400" />
                        )}
                        <div className="text-left">
                          <div className="font-bold">{isTa ? "பிஜி உரிமையாளர்" : "PG Owner Portal"}</div>
                          <div className="text-[10px] text-slate-400 font-normal">Sri Lakshmi Luxury PG (42 Beds)</div>
                        </div>
                      </div>
                      <ArrowRight className="size-3.5 opacity-80" />
                    </button>

                    {/* PG Manager Demo Button */}
                    <button
                      type="button"
                      onClick={() => quickLogin("manager@srilakshmipg.local", "/admin/dashboard")}
                      disabled={Boolean(loggingIn)}
                      className="flex items-center justify-between gap-2 rounded-xl bg-emerald-700 px-3.5 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-800 active:scale-[0.99] transition-all disabled:opacity-50 shadow-2xs cursor-pointer min-h-[46px]"
                    >
                      <div className="flex items-center gap-2.5">
                        {loggingIn === "manager@srilakshmipg.local" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="size-4 shrink-0 text-emerald-200" />
                        )}
                        <div className="text-left">
                          <div className="font-bold">{isTa ? "பிஜி மேலாளர்" : "PG Manager Portal"}</div>
                          <div className="text-[10px] text-emerald-100 font-normal">Check-in, deposits & rent</div>
                        </div>
                      </div>
                      <ArrowRight className="size-3.5 opacity-80" />
                    </button>

                    {/* PG Resident Demo Button */}
                    <button
                      type="button"
                      onClick={() => quickLogin("resident@srilakshmipg.local", "/resident/dashboard")}
                      disabled={Boolean(loggingIn)}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50 active:scale-[0.99] transition-all disabled:opacity-50 shadow-2xs cursor-pointer min-h-[46px]"
                    >
                      <div className="flex items-center gap-2.5">
                        {loggingIn === "resident@srilakshmipg.local" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <User className="size-4 shrink-0 text-indigo-600" />
                        )}
                        <div className="text-left">
                          <div className="font-bold">{isTa ? "குடியிருப்பாளர்" : "Resident / Tenant"}</div>
                          <div className="text-[10px] text-slate-500 font-normal">Karthik Raja · Room 201</div>
                        </div>
                      </div>
                      <ArrowRight className="size-3.5 text-slate-400" />
                    </button>

                    {/* Society Admin Demo Button */}
                    <button
                      type="button"
                      onClick={() => quickLogin("admin@greenvalley.local", "/admin/dashboard")}
                      disabled={Boolean(loggingIn)}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50 active:scale-[0.99] transition-all disabled:opacity-50 shadow-2xs cursor-pointer min-h-[46px]"
                    >
                      <div className="flex items-center gap-2.5">
                        {loggingIn === "admin@greenvalley.local" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <KeyRound className="size-4 text-slate-600 shrink-0" />
                        )}
                        <div className="text-left">
                          <div className="font-bold">{isTa ? "அடுக்குமாடி நிர்வாகி" : "Apartment Society"}</div>
                          <div className="text-[10px] text-slate-500 font-normal">Green Valley (100 Flats)</div>
                        </div>
                      </div>
                      <ArrowRight className="size-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Key value checkmarks */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 font-medium border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>{isTa ? "1-கிளிக் வாட்ஸ்அப் வசூல்" : "1-Click WhatsApp Pay"}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>{isTa ? "நேரடி படுக்கை ஆக்கிரமிப்பு" : "Live Bed Matrix"}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span>{isTa ? "வைப்புத்தொகை & ரசீது" : "Deposit Settlements"}</span>
                  </span>
                </div>
              </div>

              {/* Right Column: Modern Interactive Live Showcase */}
              <div id="live-preview" className="lg:col-span-6 w-full lg:max-w-xl mx-auto lg:ml-auto">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-200/50 overflow-hidden">
                  {/* Top Bar with PG Brand */}
                  <div className="bg-slate-950 text-white px-4 py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="font-bold text-xs truncate">Sri Lakshmi Luxury PG & Coliving</span>
                      <span className="text-slate-400 text-[10px] hidden sm:inline">· Live Bedy OS</span>
                    </div>

                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      84% Full
                    </span>
                  </div>

                  {/* 4 Feature Tab Selectors */}
                  <div className="flex items-center gap-1 bg-slate-100/90 p-1.5 border-b border-slate-200/80 overflow-x-auto no-scrollbar text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setDemoTab("whatsapp")}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer text-[11px] ${
                        demoTab === "whatsapp"
                          ? "bg-white text-emerald-800 shadow-2xs font-bold ring-1 ring-emerald-600/20"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <MessageCircle className="size-3.5 text-emerald-600" />
                      <span>{isTa ? "வாட்ஸ்அப் வசூல்" : "WhatsApp Pay"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDemoTab("beds")}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer text-[11px] ${
                        demoTab === "beds"
                          ? "bg-white text-slate-900 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <BedSingle className="size-3.5 text-indigo-600" />
                      <span>{isTa ? "படுக்கை ஆக்கிரமிப்பு" : "Bed Matrix"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDemoTab("deposit")}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer text-[11px] ${
                        demoTab === "deposit"
                          ? "bg-white text-slate-900 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <Receipt className="size-3.5 text-amber-600" />
                      <span>{isTa ? "வைப்புத்தொகை கழிவு" : "Deposit Refund"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDemoTab("maintenance")}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer text-[11px] ${
                        demoTab === "maintenance"
                          ? "bg-white text-slate-900 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <AlertTriangle className="size-3.5 text-rose-600" />
                      <span>{isTa ? "பழுது மேஜை" : "Repairs Desk"}</span>
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 min-h-[300px] flex flex-col justify-between">
                    {/* View 1: 1-Click WhatsApp Rent Collection Showcase */}
                    {demoTab === "whatsapp" && (
                      <div className="space-y-3">
                        {/* WhatsApp Message Preview Bubble */}
                        <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-3 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-emerald-800 font-bold border-b border-emerald-200/60 pb-1.5">
                            <span className="flex items-center gap-1.5">
                              <MessageCircle className="size-3.5 text-emerald-600" />
                              WhatsApp Auto-Reminder to Karthik Raja
                            </span>
                            <span className="text-[10px] text-emerald-600 font-normal">Delivered 10:02 AM</span>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed font-mono">
                            &quot;Hi Karthik, your Room 201 (Bed A) rent for Oct (₹14,000) is due by 5th. Tap to pay via UPI: <strong className="text-emerald-700 underline">https://bedy.in/pay/inv_123</strong>. Thank you! — Sri Lakshmi Luxury PG&quot;
                          </p>
                        </div>

                        {/* Frictionless Public Pay Sheet Result */}
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400">Public 1-Click Pay</span>
                              <div className="font-bold text-slate-900 text-sm">Room 201 · Bed A</div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block">Amount Due</span>
                              <span className="font-extrabold text-emerald-700 text-base">₹14,000</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <div className="flex-1 rounded-lg bg-emerald-600 text-white font-bold text-center py-2 text-xs shadow-sm flex items-center justify-center gap-1.5">
                              <Smartphone className="size-3.5" />
                              <span>1-Tap UPI (GPay / PhonePe)</span>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-slate-700 flex items-center gap-1 font-semibold text-[11px]">
                              <QrCode className="size-3.5 text-slate-500" />
                              <span>QR</span>
                            </div>
                          </div>

                          <div className="rounded-lg bg-slate-50 p-1.5 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
                            <CheckCheck className="size-3 text-emerald-600" />
                            <span>Instant PDF receipt delivered straight back to tenant WhatsApp</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* View 2: Live Room & Bed Occupancy Matrix */}
                    {demoTab === "beds" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">Live Bed Status Roster</span>
                          <span className="text-[11px] text-slate-500">35 Occupied · 6 Vacant · 1 Reserved</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {/* Room 101 */}
                          <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50/50 space-y-1.5">
                            <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                              <span>Room 101 (2-Sharing)</span>
                              <span className="text-[10px] font-semibold text-emerald-700">₹7,500/mo</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between rounded bg-white p-1.5 border border-slate-200/70 text-[11px]">
                                <span className="font-semibold text-slate-800">Bed A: Rahul Sharma</span>
                                <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">PAID</span>
                              </div>
                              <div className="flex items-center justify-between rounded bg-emerald-50/60 p-1.5 border border-dashed border-emerald-300 text-[11px]">
                                <span className="font-bold text-emerald-800">Bed B: VACANT</span>
                                <span className="text-[9.5px] font-semibold text-emerald-700 underline">Check-in</span>
                              </div>
                            </div>
                          </div>

                          {/* Room 201 */}
                          <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50/50 space-y-1.5">
                            <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                              <span>Room 201 (3-Sharing AC)</span>
                              <span className="text-[10px] font-semibold text-emerald-700">₹14,000/mo</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between rounded bg-white p-1.5 border border-slate-200/70 text-[11px]">
                                <span className="font-semibold text-slate-800">Bed A: Karthik Raja</span>
                                <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">DUE 5th</span>
                              </div>
                              <div className="flex items-center justify-between rounded bg-white p-1.5 border border-slate-200/70 text-[11px]">
                                <span className="font-semibold text-slate-800">Bed B: Suresh M</span>
                                <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">PAID</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg bg-indigo-50/70 p-2 text-indigo-900 text-[11px] font-medium flex items-center justify-between">
                          <span>Auto-calculated mid-month join pro-rata rent supported</span>
                          <span className="font-bold text-indigo-700">✓ Enabled</span>
                        </div>
                      </div>
                    )}

                    {/* View 3: Deposit Tracking & Check-Out Settlement */}
                    {demoTab === "deposit" && (
                      <div className="space-y-2.5 text-xs">
                        <div className="rounded-xl border border-slate-200 p-3 bg-white space-y-2">
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

                        <div className="rounded-lg bg-slate-50 p-2 text-[10px] text-slate-500 flex items-center justify-between">
                          <span>Written to immutable audit log with deduction reasons</span>
                          <span className="font-semibold text-slate-700">Bed vacated auto</span>
                        </div>
                      </div>
                    )}

                    {/* View 4: Maintenance & Repairs Desk */}
                    {demoTab === "maintenance" && (
                      <div className="space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full ring-1 ring-rose-200">
                            Ticket #CMP-104 · AC Cooling Leak
                          </span>
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full ring-1 ring-amber-200">
                            Technician Assigned
                          </span>
                        </div>

                        <div>
                          <p className="font-bold text-slate-900">Room 201 AC leaking water inside room</p>
                          <p className="text-[10px] text-slate-500">Raised by Karthik Raja · Photo attached</p>
                        </div>

                        <div className="relative pl-5 space-y-2 border-l-2 border-emerald-300 ml-1 py-0.5 text-xs">
                          <div className="relative">
                            <span className="absolute -left-[25px] top-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                            <p className="font-semibold text-slate-900 text-[11px]">Ticket Created by Tenant · 09:30 AM</p>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[25px] top-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                            <p className="font-semibold text-slate-900 text-[11px]">Manager Assigned AC Tech (Manoj) · 09:45 AM</p>
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[25px] top-0.5 size-3 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
                            <p className="font-semibold text-amber-800 text-[11px]">Service Scheduled · Today 2:00 PM</p>
                          </div>
                        </div>

                        <div className="rounded-lg bg-slate-50 p-2 border border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-600">Assigned Technician: <strong>Manoj (+91 98450-11223)</strong></span>
                          <span className="text-[10px] text-emerald-700 font-bold">In Progress</span>
                        </div>
                      </div>
                    )}

                    {/* Bottom Link to Full Live Evaluation */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate">
                        {isTa ? "நேரடி மாதிரி கணக்கில் நுழைய:" : "Want to test live features yourself?"}
                      </span>
                      <a href="#demo-portals" className="text-emerald-700 font-bold hover:underline shrink-0 ml-2">
                        {isTa ? "மாதிரி கணக்குகள் →" : "Demo Logins →"}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Bedy: Pain vs Solution (Clean & Modern Table) */}
        <section id="why-bedy" className="py-12 sm:py-16 border-b border-slate-200/70 bg-white">
          <div className="mx-auto max-w-6xl px-3.5 sm:px-6">
            <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                The Bedy Advantage
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
                {isTa ? "பழைய நோட்டுகளுக்கு விடை கொடுங்கள்" : "Why PG Owners Are Ditching Excel & Notebooks"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {isTa
                  ? "வாடகை பாக்கியைத் துரத்துவதைத் தவிர்த்து, உங்கள் விடுதியை எளிதாக வளருங்கள்."
                  : "Collect rent 3x faster with zero stress. Here is how Bedy transforms your daily routine."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Old Way */}
              <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-5 sm:p-6 space-y-3.5">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  <XCircle className="size-4.5" />
                  <span>The Old Way (Notebooks, Excel & Calls)</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>Calling tenants 10 times to chase overdue rent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>Double-booking beds or forgetting who stayed in Bed B</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>Arguments over security deposit deductions at check-out</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span>Lost paper receipts and manual calculations for mid-month joins</span>
                  </li>
                </ul>
              </div>

              {/* Bedy Way */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 sm:p-6 space-y-3.5 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="size-4.5 text-emerald-600" />
                  <span>The Bedy Way (Effortless Autopilot)</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>1-Click WhatsApp Reminders</strong> with instant UPI pay links</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Real-time bed matrix</strong> with instant vacant & occupied status</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Itemized deposit refund calculator</strong> logged to audit trail</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Official PDF receipts</strong> sent to tenant WhatsApp automatically</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars: 6 Clean Minimalist Feature Cards */}
        <section id="features" className="py-12 sm:py-16 border-b border-slate-200/70 bg-slate-50/40">
          <div className="mx-auto max-w-6xl px-3.5 sm:px-6">
            <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
                {isTa ? "முக்கிய வசதிகள்" : "Everything You Need to Run 10 to 60+ Beds"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {isTa
                  ? "வீண் குழப்பங்கள் இல்லாத எளிய வடிவமைப்பு."
                  : "No complex software training required. Built for quick daily phone or laptop usage."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs hover:border-slate-300 transition-colors">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 mb-4">
                  <MessageCircle className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isTa ? "1-கிளிக் வாட்ஸ்அப் வசூல்" : "1-Click WhatsApp Rent Collection"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {isTa
                    ? "ஒவ்வொரு மாதமும் தானாக பில் உருவாகும். வாட்ஸ்அப்பில் ஒரே கிளிக்கில் யுபிஐ கட்டண இணைப்பை அனுப்பி உடனடி ரசீது வழங்குங்கள்."
                    : "Generate monthly rent with 1 tap. Send pre-filled personalized WhatsApp reminders with direct UPI payment links."}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs hover:border-slate-300 transition-colors">
                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 mb-4">
                  <BedSingle className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isTa ? "நேரடி படுக்கை ஆக்கிரமிப்பு" : "Live Bed-by-Bed Matrix"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {isTa
                    ? "ஒற்றை, இரட்டை மற்றும் மூன்று பகிர்வு அறைகளில் காலியாக உள்ள படுக்கைகளை உடனே தெரிந்துகொள்ளுங்கள்."
                    : "Track Vacant, Occupied, Reserved, and Maintenance beds across floors and sharing categories with real-time occupancy rates."}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs hover:border-slate-300 transition-colors">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 mb-4">
                  <Receipt className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isTa ? "வைப்புத்தொகை & காசோலை" : "Security Deposits & Check-Out"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {isTa
                    ? "ஆதார் ஆவணம் சேமிப்பு மற்றும் வெளியேறும் போது துல்லியமான கழிவுகள் கணக்கிட்டு பணத்தைத் திருப்பியளித்தல்."
                    : "Secure KYC document uploads at check-in. Auto-calculate net refunds on check-out after deducting cleaning, repairs, or pro-rata stay."}
                </p>
              </div>

              {/* Feature 4 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs hover:border-slate-300 transition-colors">
                <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700 mb-4">
                  <Clock className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isTa ? "நிலுவைத் தொகை & அபராதம்" : "Defaulters & Due Reminders"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {isTa
                    ? "வாடகை செலுத்தாதவர்களை உடனே கண்டறிந்து நினைவூட்டல் அனுப்புங்கள். தாமதக் கட்டணங்களை சுலபமாக நிர்வகியுங்கள்."
                    : "Instant defaulter list showing overdue days and outstanding amounts. Send 1-tap WhatsApp overdue notices with zero friction."}
                </p>
              </div>

              {/* Feature 5 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs hover:border-slate-300 transition-colors">
                <div className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 mb-4">
                  <AlertTriangle className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isTa ? "பழுது மற்றும் புகார் மேஜை" : "Repairs & Maintenance Desk"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {isTa
                    ? "மின்சாரம், குடிநீர், ஏசி பழுதுகளைப் புகைப்படத்துடன் பதிவு செய்து பணியாளர்களை நியமிக்கவும்."
                    : "Tenants report WiFi, AC, or plumbing issues with photos. Assign technicians and let tenants track the step-by-step resolution."}
                </p>
              </div>

              {/* Feature 6 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs hover:border-slate-300 transition-colors">
                <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800 mb-4">
                  <Building className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {isTa ? "பிஜி & அடுக்குமாடி ஆதரவு" : "Dual PG & Society Workspaces"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {isTa
                    ? "பிஜி விடுதிகள் மற்றும் அடுக்குமாடி குடியிருப்புகள் இரண்டிற்கும் ஒரே மென்பொருளில் தனித்தனி வசதிகள்."
                    : "One unified platform supporting both PG/hostel bed-level billing and apartment society flat maintenance on the same architecture."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Public Demo Portals Section */}
        <section id="demo-portals" className="py-12 sm:py-16 bg-white">
          <div className="mx-auto max-w-6xl px-3.5 sm:px-6">
            <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {isTa ? "நேரடி மாதிரி" : "Live Demo Accounts"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
                {isTa ? "ஒரே கிளிக்கில் சோதித்துப் பாருங்கள்" : "Test Bedy Roles in 1-Click"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {isTa
                  ? "கீழே உள்ள ஏதேனும் ஒரு பாத்திரத்தைத் தேர்ந்தெடுத்து மாதிரித் தகவல்களை உடனே பார்வையிடுங்கள்."
                  : "Click any account below to jump straight into their portal with real seeded PG data."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {/* Card 1: PG Owner */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-white font-bold">
                      <Building2 className="size-5" />
                    </span>
                    <span className="text-[11px] font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full uppercase">
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
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    <span>Open PG Owner Portal</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2: PG Manager */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <ShieldCheck className="size-5" />
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase">
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
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    <span>Open PG Manager Portal</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 3: Resident Tenant */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                      <User className="size-5" />
                    </span>
                    <span className="text-[11px] font-bold text-indigo-800 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase">
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
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    <span>Open Resident Portal</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-3.5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-600 text-white font-black text-xs">
              B
            </span>
            <span className="font-bold text-slate-900 text-sm">Bedy</span>
            <span>·</span>
            <span>
              {isTa
                ? "பிஜி மற்றும் விடுதி நிர்வாக மென்பொருள்"
                : "Smart PG, Hostel & Co-Living Operations"}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-5 gap-y-2 font-medium text-slate-600">
            <Link href="/features" className="hover:text-slate-950 transition-colors">
              {isTa ? "அம்சங்கள்" : "Features"}
            </Link>
            <Link href="/pricing" className="hover:text-slate-950 transition-colors">
              {isTa ? "கட்டணம்" : "Pricing"}
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
      </footer>
    </div>
  );
}
