"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  ShieldCheck,
  ArrowRight,
  Wallet,
  Receipt,
  AlertTriangle,
  Megaphone,
  CheckCircle2,
  Loader2,
  LogIn,
  Check,
  FileText
} from "lucide-react";
import { api } from "@/lib/client/api";

export default function HomePageClient({ user = null }) {
  const router = useRouter();
  const [loggingIn, setLoggingIn] = useState(null);
  const [paid, setPaid] = useState(false);
  const [activeTab, setActiveTab] = useState("bill"); // bill | complaint | notice

  const quickLogin = async (email, path) => {
    setLoggingIn(email);
    try {
      await api.post("/api/auth/dev-login", { email });
      router.push(path);
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Top Session Banner if user is already logged in */}
      {user ? (
        <aside aria-label="Active session banner" className="bg-slate-900 text-white px-4 py-2 text-xs font-semibold">
          <div className="mx-auto max-w-6xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400" />
              <span>
                Logged in as <strong>{user.name}</strong> ({user.role})
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
              <span>Go to your Dashboard</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </aside>
      ) : null}

      {/* Modern Minimalist Header */}
      <header className="border-b border-slate-100 bg-white/95 sticky top-0 z-30 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-slate-900 text-white text-xs font-bold tracking-tight">
              SD
            </span>
            <span className="text-base font-bold tracking-tight text-slate-900">SocietyDesk</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-slate-950 transition-colors">
              Features
            </a>
            <a href="#demo-portals" className="hover:text-slate-950 transition-colors">
              Demo Portals
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <span>Dashboard</span>
                <ArrowRight className="size-3.5" />
              </Link>
            ) : (
              <>
                <a
                  href="#demo-portals"
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <span>Quick Demo</span>
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  <LogIn className="size-3.5" />
                  <span>Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-14 sm:py-20 border-b border-slate-100">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Headline and quick actions */}
              <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>Apartment Society Management · 30 to 300 Flats</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                  Apartment operations, simplified.
                </h1>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Replace spreadsheets and WhatsApp messages with a clean web platform for
                  maintenance billing, 1-click UPI payments, repair complaints, and resident notices.
                </p>

                {/* Direct 1-Click Launch Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <button
                    type="button"
                    onClick={() => quickLogin("ravi@greenvalley.local", "/resident/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-xs"
                  >
                    {loggingIn === "ravi@greenvalley.local" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <User className="size-4" />
                    )}
                    <span>Test as Resident</span>
                    <ArrowRight className="size-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => quickLogin("admin@greenvalley.local", "/admin/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-xs"
                  >
                    {loggingIn === "admin@greenvalley.local" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Building2 className="size-4" />
                    )}
                    <span>Test as Secretary</span>
                  </button>

                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span>Sign In</span>
                  </Link>
                </div>

                {/* Key feature pills */}
                <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-5 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Automated Invoicing
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    1-Click UPI & Cash Receipts
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Live Complaint Timeline
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
                          activeTab === "bill" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Maintenance Bill
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("complaint")}
                        className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                          activeTab === "complaint" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Complaint
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("notice")}
                        className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                          activeTab === "notice" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Notice
                      </button>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">Preview</span>
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
                          {paid ? "PAID" : "DUE IN 5 DAYS"}
                        </span>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3.5 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Maintenance (Fixed 2 BHK)</span>
                          <span className="font-semibold text-slate-900">₹2,500</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Parking Slot (P-101)</span>
                          <span className="font-semibold text-slate-900">₹500</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Water Charges</span>
                          <span className="font-semibold text-slate-900">₹200</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm">
                          <span className="text-slate-900">Total Due</span>
                          <span className="text-indigo-700">₹3,200</span>
                        </div>
                      </div>

                      {paid ? (
                        <div className="rounded-xl bg-emerald-50 p-3 text-center ring-1 ring-emerald-200">
                          <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="size-4 text-emerald-600" />
                            <span>Payment Settled via UPI</span>
                          </p>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            Official Receipt #REC-GVA-0081 generated and saved.
                          </p>
                          <button
                            type="button"
                            onClick={() => setPaid(false)}
                            className="mt-2 text-[11px] text-emerald-800 underline font-semibold"
                          >
                            Reset
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPaid(true)}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                        >
                          <Wallet className="size-4" />
                          <span>Simulate 1-Click UPI Payment</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Complaint */}
                  {activeTab === "complaint" && (
                    <div className="pt-4 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                          Plumbing · High Priority
                        </span>
                        <h2 className="text-sm font-bold text-slate-900">Water leakage in kitchen sink</h2>
                      </div>

                      <div className="relative pl-5 space-y-3 border-l-2 border-indigo-200 ml-1 py-1 text-xs">
                        <div className="relative">
                          <span className="absolute -left-[25px] top-1 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                          <p className="font-semibold text-slate-900">Complaint Raised by Ravi</p>
                          <p className="text-[11px] text-slate-500">29 Sep 10:00 AM</p>
                        </div>
                        <div className="relative">
                          <span className="absolute -left-[25px] top-1 size-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                          <p className="font-semibold text-slate-900">Assigned to Plumber (Kumar)</p>
                          <p className="text-[11px] text-slate-500">29 Sep 10:15 AM</p>
                        </div>
                        <div className="relative">
                          <span className="absolute -left-[25px] top-1 size-3 rounded-full bg-amber-500 ring-2 ring-white" />
                          <p className="font-semibold text-amber-800">In Progress — Work Underway</p>
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
                          MAINTENANCE
                        </span>
                        <h2 className="text-xs font-bold text-slate-900 mt-1.5">
                          Water Supply Maintenance on Sunday
                        </h2>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          No water supply on Sunday 9 AM to 1 PM for overhead tank cleaning. Please store water in advance.
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                        <span>Read by Residents:</span>
                        <span className="font-bold text-indigo-700">87 of 120 flats (72%)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features: 3 Clean Minimalist Pillars */}
        <section id="features" className="py-16 border-b border-slate-100 bg-slate-50/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Everything your committee and residents need
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Built strictly around the core society operations without bloated complexity.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 mb-4">
                  <FileText className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Billing & Payments</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Generate monthly invoices in batch with fixed, per-sqft, or BHK rates. Settle online via UPI or record cash/cheque payments with instant PDF receipts.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 mb-4">
                  <AlertTriangle className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Complaints Desk</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Residents file plumbing, electrical, or cleanliness repairs with photos. The secretary assigns staff and both parties track the step-by-step resolution.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 mb-4">
                  <Megaphone className="size-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Notices & Directory</h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Publish emergency circulars and AGM announcements with real-time read receipts. Manage owner and tenant directory with one-click bulk CSV import.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Roles Section */}
        <section id="demo-portals" className="py-16 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Explore with One Click
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Choose a role below to explore the seeded demo data immediately.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Resident Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                      <User className="size-5" />
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Resident</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Ravi Kumar</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Flat A-101 · Green Valley Apartments</p>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    Check monthly maintenance dues, make test UPI payments, download official receipts, and raise plumbing complaints.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => quickLogin("ravi@greenvalley.local", "/resident/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {loggingIn === "ravi@greenvalley.local" ? "Loading..." : "Open Resident Portal"}
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Secretary Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                      <Building2 className="size-5" />
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Society Admin</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Lakshmi Iyer</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Secretary · Green Valley Apartments</p>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    Generate monthly invoices for all flats, record cash/cheque payments, assign complaints, view defaulters, and post notices.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => quickLogin("admin@greenvalley.local", "/admin/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {loggingIn === "admin@greenvalley.local" ? "Loading..." : "Open Admin Portal"}
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Super Admin Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                      <ShieldCheck className="size-5" />
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Super Admin</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Kumar Vignesh</h3>
                  <p className="text-xs text-slate-500 mt-0.5">kumarvignesh865@gmail.com · Platform Super Admin</p>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    View platform statistics, provision new societies, and manage society admins across all housing societies.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => quickLogin("kumarvignesh865@gmail.com", "/super-admin/dashboard")}
                    disabled={Boolean(loggingIn)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {loggingIn === "kumarvignesh865@gmail.com" ? "Loading..." : "Open Super Admin"}
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-slate-100 py-8 bg-white text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">SocietyDesk</span>
            <span>·</span>
            <span>Apartment & Society Management</span>
          </div>

          <div className="flex items-center gap-5 font-medium text-slate-600">
            <Link href="/login" className="hover:text-slate-950 transition-colors">
              Sign In
            </Link>
            <Link href="/forgot-password" className="hover:text-slate-950 transition-colors">
              Reset Password
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

