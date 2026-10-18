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
  Layers,
  MailCheck,
  ShieldCheck,
  Users,
  Smartphone,
  ChevronRight
} from "lucide-react";
import { api } from "@/lib/client/api";
import { homeForRole } from "@/lib/routing";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useTranslation } from "@/components/i18n/LanguageProvider";

export default function HomePageClient({ user = null }) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [loggingIn, setLoggingIn] = useState(null);
  const [paid, setPaid] = useState(false);
  const [activeTab, setActiveTab] = useState("bill"); // bill | complaint | notice

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
    <div className="min-h-screen bg-slate-50/40 text-slate-900 flex flex-col font-sans">
      {/* Top Session Banner if user is already logged in */}
      {user ? (
        <aside aria-label="Active session banner" className="bg-slate-900 text-white px-4 py-2.5 text-xs font-semibold">
          <div className="mx-auto max-w-6xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20 transition-colors"
            >
              <span>{isTa ? "டாஷ்போர்டுக்குச் செல்க" : "Go to Dashboard"}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </aside>
      ) : null}

      {/* Modern Minimalist Header */}
      <header className="border-b border-slate-200/80 bg-white/95 sticky top-0 z-30 backdrop-blur-md">
        <div className="mx-auto max-w-6xl flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white text-xs font-bold tracking-tight shadow-2xs">
              SD
            </span>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">SocietyDesk</span>
              <span className="text-[10px] text-slate-500 font-medium block leading-tight">Housing Society OS</span>
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

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher />

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
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <span>{isTa ? "டாஷ்போர்டு" : "Dashboard"}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
                >
                  <LogIn className="size-3.5" />
                  <span>{isTa ? "உள்நுழை" : "Sign In"}</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-12 sm:py-18 border-b border-slate-200/70 bg-gradient-to-b from-white to-slate-50/60">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Authentic, clear messaging */}
              <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 border border-slate-200/80 px-3.5 py-1 text-xs font-semibold text-slate-700">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {isTa ? "குடியிருப்பு & அடுக்குமாடி நிர்வாக மென்பொருள்" : "Purpose-Built for Indian Apartment Societies & RWAs"}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight sm:leading-tight">
                  {isTa
                    ? "அடுக்குமாடி நிர்வாகம், எளிமையாகவும் நேர்த்தியாகவும்."
                    : "Apartment operations, clear and stress-free."}
                </h1>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  {isTa
                    ? "வாட்ஸ்அப் குழு குழப்பங்கள் மற்றும் கணக்குப் பதிவேடுகளுக்கு முற்றுப்புள்ளி வையுங்கள். தானியங்கி மாதாந்திர பில், யுபிஐ கட்டணம், புகார் கண்காணிப்பு மற்றும் முக்கிய அறிவிப்புகளை ஒரே இடத்தில் நிர்வகியுங்கள்."
                    : "Replace chaotic WhatsApp messages and manual spreadsheets. Automated monthly maintenance billing, instant 1-click UPI payments with PDF receipts, repair ticket tracking, and digital broadcast notices."}
                </p>

                {/* 1-Click Public Demo Buttons (Super Admin is completely excluded) */}
                <div className="pt-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                    {isTa ? "1-கிளிக் மாதிரி கணக்குகளை சோதிக்கவும்:" : "Try live demo instantly (No password needed):"}
                  </p>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => quickLogin("ravi@greenvalley.local", "/resident/dashboard")}
                      disabled={Boolean(loggingIn)}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-2xs"
                    >
                      {loggingIn === "ravi@greenvalley.local" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <User className="size-4" />
                      )}
                      <span>{isTa ? "குடியிருப்பாளர் (Resident)" : "Test as Resident"}</span>
                      <ArrowRight className="size-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => quickLogin("admin@greenvalley.local", "/admin/dashboard")}
                      disabled={Boolean(loggingIn)}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-2xs"
                    >
                      {loggingIn === "admin@greenvalley.local" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Building2 className="size-4" />
                      )}
                      <span>{isTa ? "நிர்வாகி (Society Admin)" : "Test as Society Admin"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => quickLogin("priya@greenvalley.local", "/admin/residents")}
                      disabled={Boolean(loggingIn)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-2xs"
                    >
                      {loggingIn === "priya@greenvalley.local" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <KeyRound className="size-4 text-amber-600" />
                      )}
                      <span>{isTa ? "வீட்டு நிர்வாகி (Flat Admin)" : "Test as Flat Admin"}</span>
                    </button>
                  </div>
                </div>

                {/* Key feature pills */}
                <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-5 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    {isTa ? "தானியங்கி பில்லிங் (Fixed / Sq.Ft / BHK)" : "Batch Maintenance Invoicing"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    {isTa ? "உடனடி யுபிஐ & பிடிஎஃப் ரசீது" : "UPI QR & Official Receipts"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    {isTa ? "தானியங்கி மின்னஞ்சல் கடவுச்சொல்" : "Firebase Auto-Provisioning"}
                  </span>
                </div>
              </div>

              {/* Right Column: Live Interactive Card */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
                  {/* Tabs */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab("bill")}
                        className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                          activeTab === "bill" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {isTa ? "பில்" : "Bill"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("complaint")}
                        className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                          activeTab === "complaint" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {isTa ? "புகார்" : "Complaint"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("notice")}
                        className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                          activeTab === "notice" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {isTa ? "அறிவிப்பு" : "Notice"}
                      </button>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">
                      {isTa ? "முன்னோட்டம்" : "Live Preview"}
                    </span>
                  </div>

                  {/* Tab 1: Maintenance Bill */}
                  {activeTab === "bill" && (
                    <div className="pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Green Valley · Flat A-101</p>
                          <h2 className="text-base font-bold text-slate-900">Ravi Kumar</h2>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            paid ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300" : "bg-amber-50 text-amber-700 ring-1 ring-amber-300"
                          }`}
                        >
                          {paid ? (isTa ? "செலுத்தப்பட்டது" : "PAID") : (isTa ? "5 நாட்களில் செலுத்த வேண்டும்" : "DUE IN 5 DAYS")}
                        </span>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3.5 space-y-2 text-xs border border-slate-100">
                        <div className="flex justify-between text-slate-600">
                          <span>{isTa ? "மாதாந்திர பராமரிப்பு (2 BHK)" : "Monthly Maintenance (2 BHK)"}</span>
                          <span className="font-semibold text-slate-900">₹2,500</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>{isTa ? "வாகன நிறுத்துமிடம் (P-101)" : "Parking Slot (P-101)"}</span>
                          <span className="font-semibold text-slate-900">₹500</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>{isTa ? "குடிநீர் கட்டணம்" : "Water Charges"}</span>
                          <span className="font-semibold text-slate-900">₹200</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm">
                          <span className="text-slate-900">{isTa ? "மொத்தத் தொகை" : "Total Due"}</span>
                          <span className="text-indigo-700">₹3,200</span>
                        </div>
                      </div>

                      {paid ? (
                        <div className="rounded-xl bg-emerald-50 p-3 text-center ring-1 ring-emerald-200">
                          <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="size-4 text-emerald-600" />
                            <span>{isTa ? "யுபிஐ மூலம் செலுத்தப்பட்டது" : "Settled via UPI"}</span>
                          </p>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            {isTa ? "ரசீது #REC-GVA-0081 உடனடியாக உருவாக்கப்பட்டது." : "Official Receipt #REC-GVA-0081 generated and saved."}
                          </p>
                          <button
                            type="button"
                            onClick={() => setPaid(false)}
                            className="mt-2 text-[11px] text-emerald-800 underline font-semibold cursor-pointer"
                          >
                            {isTa ? "மீட்டமை" : "Reset demo"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPaid(true)}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Wallet className="size-4" />
                          <span>{isTa ? "யுபிஐ கட்டணத்தை உருவகப்படுத்துக" : "Simulate 1-Click UPI Payment"}</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Complaint */}
                  {activeTab === "complaint" && (
                    <div className="pt-4 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                          {isTa ? "குழாய் வேலை · அவசரம்" : "Plumbing · High Priority"}
                        </span>
                        <h2 className="text-sm font-bold text-slate-900">
                          {isTa ? "சமையலறை குழாயில் நீர் கசிவு" : "Water leakage in kitchen sink"}
                        </h2>
                      </div>

                      <div className="relative pl-5 space-y-3 border-l-2 border-indigo-200 ml-1 py-1 text-xs">
                        <div className="relative">
                          <span className="absolute -left-[25px] top-1 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                          <p className="font-semibold text-slate-900">{isTa ? "புகார் பதிவு செய்யப்பட்டது" : "Complaint Raised by Ravi"}</p>
                          <p className="text-[11px] text-slate-500">29 Sep 10:00 AM</p>
                        </div>
                        <div className="relative">
                          <span className="absolute -left-[25px] top-1 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                          <p className="font-semibold text-slate-900">{isTa ? "பிளம்பரிடம் ஒப்படைக்கப்பட்டது (குமார்)" : "Assigned to Plumber (Kumar)"}</p>
                          <p className="text-[11px] text-slate-500">29 Sep 10:15 AM</p>
                        </div>
                        <div className="relative">
                          <span className="absolute -left-[25px] top-1 size-3 rounded-full bg-amber-500 ring-2 ring-white" />
                          <p className="font-semibold text-amber-800">{isTa ? "வேலை நடைபெற்று வருகிறது" : "In Progress — Work Underway"}</p>
                          <p className="text-[11px] text-slate-500">30 Sep 03:00 PM</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Notice */}
                  {activeTab === "notice" && (
                    <div className="pt-4 space-y-3">
                      <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          {isTa ? "பராமரிப்பு அறிவிப்பு" : "MAINTENANCE"}
                        </span>
                        <h2 className="text-xs font-bold text-slate-900 mt-1.5">
                          {isTa ? "ஞாயிற்றுக்கிழமை மேல்நிலை தொட்டி சுத்தம் செய்தல்" : "Water Supply Maintenance on Sunday"}
                        </h2>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {isTa
                            ? "ஞாயிறு காலை 9 மணி முதல் மதியம் 1 மணி வரை நீர் வழங்கல் இருக்காது. தயவுசெய்து தேவையான தண்ணீரை முன்னதாகவே சேமித்து வைக்கவும்."
                            : "No water supply on Sunday 9 AM to 1 PM for overhead tank cleaning. Please store water in advance."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                        <span>{isTa ? "பார்த்த குடியிருப்பாளர்கள்:" : "Read by Residents:"}</span>
                        <span className="font-bold text-indigo-700">87 of 120 flats (72%)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* Core Pillars: 3 Clean Minimalist Cards */}
        <section id="features" className="py-16 border-b border-slate-200/70 bg-slate-50/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
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

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
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
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
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
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
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
        <section id="demo-portals" className="py-16 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
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

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Resident */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                      <User className="size-5" />
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
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
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    {loggingIn === "ravi@greenvalley.local" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : null}
                    <span>{isTa ? "குடியிருப்பாளர் பக்கம் செல்" : "Open Resident Portal"}</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2: Society Admin */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                      <Building2 className="size-5" />
                    </span>
                    <span className="text-[11px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
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
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    {loggingIn === "admin@greenvalley.local" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : null}
                    <span>{isTa ? "நிர்வாகி பக்கம் செல்" : "Open Admin Portal"}</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 3: Flat Admin (Priya Sharma - Replaces Super Admin) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <KeyRound className="size-5" />
                    </span>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full uppercase">
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
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    {loggingIn === "priya@greenvalley.local" ? (
                      <Loader2 className="size-3.5 animate-spin" />
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
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">SocietyDesk</span>
            <span>·</span>
            <span>{isTa ? "அடுக்குமாடி மற்றும் குடியிருப்பு நிர்வாக மென்பொருள்" : "Apartment & Housing Society Management"}</span>
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
