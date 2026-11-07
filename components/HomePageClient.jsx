"use client";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BedDouble, Check, ChevronDown, ChevronRight, CircleHelp, ClipboardCheck, FileCheck2, FileText, LayoutDashboard, Loader2, Menu, ReceiptText, ShieldCheck, Smartphone, Users, Wrench, X, Zap } from "lucide-react";
import { api } from "@/lib/client/api";
import { homeForRole } from "@/lib/routing";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useTranslation } from "@/components/i18n/LanguageProvider";

const PLANS = [
  { name: "Starter PG", badge: "For one property", monthly: "\u20B9699", annual: "\u20B9499", desc: "The essentials for independent PG owners and boutique hostels.", features: ["Up to 30 beds", "Room and bed occupancy", "WhatsApp invoices with UPI", "Direct UPI payments", "Digital receipts", "1 manager account"], popular: false },
  { name: "Growth & Co-Living", badge: "For growing properties", monthly: "\u20B91,499", annual: "\u20B91,199", desc: "More control over billing, deposits and daily operations.", features: ["Up to 90 beds", "Everything in Starter", "Room sub-meter billing", "Deposit settlements", "Overdue payment tracking", "Resident requests", "3 staff accounts", "Excel and Tally exports"], popular: true },
  { name: "Multi-Branch Enterprise", badge: "For multiple properties", monthly: "\u20B92,999", annual: "\u20B92,399", desc: "A single view across properties, teams and branches.", features: ["Unlimited beds", "Unified property dashboard", "Role-based permissions", "Digital resident records", "Dedicated onboarding", "Priority support"], popular: false },
];
const FAQS = [
  { q: "Does Bedy take a cut from UPI rent payments?", a: "Bedy supports direct UPI payment links so rent goes to the property's own UPI account. Bedy does not charge a transaction commission on those direct UPI payments." },
  { q: "How are room electricity bills split?", a: "Enter a room's previous and current meter readings and your per-unit tariff. Bedy calculates usage and adds the room's share to resident invoices." },
  { q: "Can I manage more than one property?", a: "Yes. Owners can switch between properties from one account. Staff access can be limited to their assigned property." },
  { q: "Do residents need an app?", a: "Residents can use the mobile web portal for invoices, receipts and maintenance requests. Rent invoices can also be shared through WhatsApp." },
  { q: "How does move-out settlement work?", a: "Record deductions such as unpaid utilities or agreed room repairs against the security deposit. Bedy generates a settlement statement for the resident." },
];
const TABS = [
  { id: "rooms", label: "Rooms & beds", icon: BedDouble },
  { id: "billing", label: "Rent & receipts", icon: ReceiptText },
  { id: "utilities", label: "Utilities", icon: Zap },
  { id: "requests", label: "Resident requests", icon: Wrench },
];
const ROLES = [
  { role: "owner", email: "owner@srilakshmipg.local", title: "Owner", detail: "Property-wide operations and financial controls.", icon: LayoutDashboard },
  { role: "manager", email: "manager@srilakshmipg.local", title: "Manager", detail: "Room allocation, billing and daily tasks.", icon: ClipboardCheck },
  { role: "resident", email: "resident@srilakshmipg.local", title: "Resident", detail: "Invoices, receipts and the resident portal.", icon: Smartphone },
];

export default function HomePageClient() {
  const router = useRouter();
  const { isTamil } = useTranslation();
  const [tab, setTab] = useState("rooms");
  const [reading, setReading] = useState(1480);
  const [annual, setAnnual] = useState(true);
  const [faq, setFaq] = useState(0);
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(null);
  const [menu, setMenu] = useState(false);
  const used = Math.max(0, reading - 1200);
  const bill = used * 10;
  const share = Math.round(bill / 2);

  useEffect(() => {
    const progress = document.getElementById("page-scroll-progress");
    let frame = 0;
    let observer = null;

    const updateProgress = () => {
      const range = document.documentElement.scrollHeight - window.innerHeight;
      const value = range > 0 ? Math.min(1, window.scrollY / range) : 0;
      progress?.style.setProperty("--page-scroll-progress", String(value));
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateProgress();
      });
    };

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });

    const selectors = [
      "main > section:not(:first-child) > div:not([aria-hidden])",
      "#how-it-works .grid > div",
      "#features [role='tab']",
      "#resident-journey [data-scroll-reveal]",
      "#demo-portals article",
      "#pricing article",
      "#faq .divide-y > div",
    ];
    const targets = new Set(selectors.flatMap((selector) => [...document.querySelectorAll(selector)]));
    targets.forEach((target, index) => {
      target.dataset.scrollReveal = "";
      if (target.matches("article, #features [role='tab'], #faq .divide-y > div, #how-it-works .grid > div")) {
        target.style.setProperty("--reveal-delay", `${(index % 4) * 70}ms`);
      }
    });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
    } else {
      document.documentElement.classList.add("motion-ready");
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer?.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -64px 0px" });
      targets.forEach((target) => observer.observe(target));
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      document.documentElement.classList.remove("motion-ready");
    };
  }, []);

  async function demo(role, email) {
    try {
      setLoading(role);
      const response = await api.post("/api/auth/login", { email, password: "password123" });
      if (response?.user) router.push(homeForRole(response.user.role || role));
    } catch (error) {
      console.error("Demo login:", error);
      router.push(role === "resident" ? "/resident/dashboard" : "/admin/dashboard");
    } finally { setLoading(null); }
  }

  return <div className="min-h-screen overflow-x-hidden bg-[#F8FAFF] text-[#10192E] antialiased selection:bg-brand-100 selection:text-brand-950">
    <div id="page-scroll-progress" aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-brand-700 via-brand-500 to-[#8BA8FF]" />
    <header className="sticky top-0 z-50 border-b border-[#E5EAF3]/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[70px] max-w-[1320px] items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="Bedy home" className="flex items-center gap-2.5"><img src="/logo.png" alt="" className="size-9 rounded-xl object-contain" /><span className="text-[21px] font-extrabold tracking-[-0.06em]">bedy</span></Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-8 text-[13px] font-semibold text-[#516078] md:flex"><a className="hover:text-brand-700" href="#features">Product</a><a className="hover:text-brand-700" href="#how-it-works">How it works</a><a className="hover:text-brand-700" href="#pricing">Pricing</a><a className="hover:text-brand-700" href="#faq">FAQ</a></nav>
        <div className="flex items-center gap-3"><div className="hidden sm:block"><LanguageSwitcher /></div><Link href="/login" className="hidden px-2 py-2 text-[13px] font-bold text-[#39475F] sm:block">Sign in</Link><a href="#demo-portals" className="hidden items-center gap-2 rounded-full bg-[#10192E] px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-800 sm:inline-flex">Explore demo <ArrowUpRight className="size-3.5" /></a><button type="button" className="inline-flex size-10 items-center justify-center rounded-full border border-[#E5EAF3] md:hidden" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X className="size-5" /> : <Menu className="size-5" />}</button></div>
      </div>
      {menu && <nav aria-label="Mobile navigation" className="flex flex-col gap-1 border-t border-[#E5EAF3] bg-white px-5 py-4 text-sm font-semibold md:hidden"><a onClick={() => setMenu(false)} className="rounded-lg p-3" href="#features">Product</a><a onClick={() => setMenu(false)} className="rounded-lg p-3" href="#how-it-works">How it works</a><a onClick={() => setMenu(false)} className="rounded-lg p-3" href="#pricing">Pricing</a><a onClick={() => setMenu(false)} className="rounded-lg p-3" href="#faq">FAQ</a><div className="flex items-center justify-between border-t pt-3"><LanguageSwitcher /><Link onClick={() => setMenu(false)} href="/login" className="rounded-full bg-brand-600 px-4 py-2.5 text-xs font-bold text-white">Sign in</Link></div></nav>}
    </header>

    <main>
      <section className="relative isolate overflow-hidden bg-[#F8FAFF]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"><div className="absolute -right-32 -top-64 size-[44rem] rounded-full bg-[#DCE6FF]/70 blur-3xl" /><div className="absolute -bottom-72 -left-40 size-[40rem] rounded-full bg-[#E9EEFF] blur-3xl" /></div>
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[.92fr_1.08fr] lg:gap-16 lg:py-24">
          <div className="animate-fade-slide-up max-w-[610px]">
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-brand-200 bg-white/80 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.13em] text-brand-800 shadow-xs"><span className="size-1.5 rounded-full bg-brand-600" />Built for PGs, hostels and co-living</div>
            <h1 className="max-w-[700px] text-[clamp(2.8rem,6vw,5.7rem)] font-extrabold leading-[.98] tracking-[-.075em]">{isTamil ? <>{"\u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD"} PG-{"\u0B90"} {"\u0BA8\u0B9F\u0BA4\u0BCD\u0BA4\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD."}<br /><span className="text-brand-600">{"\u0B95\u0BBE\u0B95\u0BBF\u0BA4"} {"\u0BB5\u0BC7\u0BB2\u0BC8\u0B95\u0BB3\u0BC8"} {"\u0B85\u0BB2\u0BCD\u0BB2."}</span></> : <>Run your property.<br /><span className="text-brand-600">Not the paperwork.</span></>}</h1>
            <p className="mt-7 max-w-[530px] text-base leading-7 text-[#516078] sm:text-lg sm:leading-8">{isTamil ? "\u0B85\u0BB1\u0BC8\u0B95\u0BB3\u0BCD, \u0BB5\u0BBE\u0B9F\u0B95\u0BC8, \u0BAE\u0BBF\u0BA9\u0BCD\u0B9A\u0BBE\u0BB0\u0BAE\u0BCD \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0B95\u0BCB\u0BB0\u0BBF\u0B95\u0BCD\u0B95\u0BC8\u0B95\u0BB3\u0BC8 \u0B92\u0BB0\u0BC7 \u0B87\u0B9F\u0BA4\u0BCD\u0BA4\u0BBF\u0BB2\u0BCD \u0BA8\u0BBF\u0BB0\u0BCD\u0BB5\u0B95\u0BBF\u0B95\u0BCD\u0B95\u0BB5\u0BC1\u0BAE\u0BCD." : "Rooms, rent, electricity and resident requests belong in one clear workflow. Bedy brings the everyday work of a PG or hostel into one place."}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#demo-portals" className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-brand-600 px-6 text-sm font-bold text-white shadow-[0_10px_24px_rgba(49,84,217,.22)] transition hover:-translate-y-0.5 hover:bg-brand-700">See Bedy in action <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></a><a href="#features" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#C9D3E5] bg-white/70 px-6 text-sm font-bold text-[#26344C] hover:border-brand-300 hover:bg-white">Explore the product <ArrowDownRight className="size-4" /></a></div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[#DCE4F2] pt-5 text-[11px] font-semibold text-[#516078] sm:text-xs"><span className="inline-flex items-center gap-2"><Check className="size-3.5 text-emerald-600" />Direct UPI payments</span><span className="inline-flex items-center gap-2"><Check className="size-3.5 text-emerald-600" />No resident app install</span><span className="inline-flex items-center gap-2"><Check className="size-3.5 text-emerald-600" />Room-level billing</span></div>
          </div>
          <div className="animate-fade-slide-up relative mx-auto w-full max-w-[700px] lg:ml-auto" style={{ animationDelay: "120ms" }}>
            <div className="absolute -inset-5 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-200/60 via-white/30 to-[#B8C9FF]/50 blur-2xl" />
            <div className="animate-float overflow-hidden rounded-[1.6rem] border border-[#D7E1F2] bg-white shadow-[0_35px_90px_rgba(31,51,91,.16)]">
              <div className="flex items-center justify-between border-b border-[#E5EAF3] px-4 py-3.5 sm:px-5"><div className="flex items-center gap-2"><span className="flex gap-1.5"><i className="size-2 rounded-full bg-[#F97066]" /><i className="size-2 rounded-full bg-[#FDB022]" /><i className="size-2 rounded-full bg-[#32D583]" /></span><span className="ml-2 text-[11px] font-bold text-[#39475F]">Property workspace</span></div><span className="rounded-full bg-[#F3F6FC] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#6C7890]">Illustrative preview</span></div>
              <div className="grid min-h-[340px] grid-cols-[118px_1fr] sm:grid-cols-[150px_1fr]">
                <aside className="border-r border-[#E5EAF3] bg-[#F9FAFD] p-3 sm:p-4"><div className="mb-7 flex items-center gap-2 rounded-lg bg-white px-2 py-2 shadow-xs"><span className="flex size-6 items-center justify-center rounded-md bg-brand-100 text-brand-700"><BuildingMark /></span><span className="truncate text-[9px] font-bold text-[#26344C]">My property</span><ChevronDown className="ml-auto size-3 text-[#9AA6BA]" /></div><div className="space-y-1 text-[9px] font-semibold text-[#6C7890]"><div className="flex items-center gap-2 rounded-lg bg-brand-50 px-2 py-2 text-brand-800"><LayoutDashboard className="size-3.5" />Overview</div><div className="flex items-center gap-2 px-2 py-2"><BedDouble className="size-3.5" />Rooms</div><div className="flex items-center gap-2 px-2 py-2"><Users className="size-3.5" />Residents</div><div className="flex items-center gap-2 px-2 py-2"><ReceiptText className="size-3.5" />Billing</div></div></aside>
                <div className="min-w-0 p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#9AA6BA]">Overview</p><h2 className="mt-1 text-base font-extrabold text-[#17213A] sm:text-xl">A clear view of today</h2></div><span className="rounded-lg border border-[#E5EAF3] px-2.5 py-1.5 text-[9px] font-semibold text-[#6C7890]">Example data</span></div>
                  <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3"><div className="rounded-xl border border-[#E5EAF3] p-3"><span className="text-[9px] font-semibold text-[#6C7890]">Beds</span><div className="mt-1 flex items-end justify-between"><strong className="text-base sm:text-lg">Room by room</strong><BedDouble className="size-4 text-brand-600" /></div><div className="mt-2 h-1 rounded-full bg-[#E9EEFF]"><div className="h-1 w-3/4 rounded-full bg-brand-600" /></div></div><div className="rounded-xl border border-[#E5EAF3] p-3"><span className="text-[9px] font-semibold text-[#6C7890]">Rent</span><div className="mt-1 flex items-end justify-between"><strong className="text-base sm:text-lg">Invoices</strong><ReceiptText className="size-4 text-emerald-600" /></div><div className="mt-2 text-[9px] text-[#6C7890]">Share · collect · receipt</div></div></div>
                  <div className="mt-3 overflow-hidden rounded-xl border border-[#E5EAF3] bg-white"><div className="flex items-center justify-between border-b border-[#EEF1F6] px-3.5 py-2.5"><span className="text-[10px] font-bold text-[#26344C]">Room 204 · Double sharing</span><span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-bold text-emerald-700">1 bed available</span></div><div className="grid grid-cols-2 gap-2 p-2.5"><div className="rounded-lg bg-[#F8FAFF] p-2.5"><span className="block text-[8px] font-bold uppercase text-[#9AA6BA]">Bed A</span><span className="mt-1 block text-[9px] font-bold">Occupied</span></div><div className="rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 p-2.5"><span className="block text-[8px] font-bold uppercase text-emerald-700">Bed B</span><span className="mt-1 block text-[9px] font-bold text-emerald-800">Ready to assign</span></div></div></div>
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#14234B] px-3.5 py-3 text-white"><span className="flex size-7 items-center justify-center rounded-lg bg-white/10"><Zap className="size-3.5 text-[#FEC84B]" /></span><span className="text-[9px] leading-4 text-white/75">Track readings, split electricity and add each share to rent invoices.</span><ArrowUpRight className="ml-auto size-3.5 shrink-0 text-white/60" /></div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 hidden rounded-xl border border-[#DCE4F2] bg-white px-4 py-3 shadow-lg sm:block"><div className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><ShieldCheck className="size-4" /></span><span><strong className="block text-[10px]">Your UPI. Your account.</strong><span className="text-[9px] text-[#6C7890]">Direct resident payments</span></span></div></div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-[#E5EAF3] bg-white"><div className="mx-auto grid max-w-[1320px] gap-8 px-5 py-9 sm:px-8 md:grid-cols-[220px_1fr] md:items-center"><p data-scroll-reveal className="text-[11px] font-extrabold uppercase tracking-[.16em] text-brand-700">One connected workflow</p><div className="grid gap-5 sm:grid-cols-4"><Workflow number="01" title="Set up rooms" text="Map buildings, rooms and beds." /><Workflow number="02" title="Add residents" text="Keep resident details and documents together." /><Workflow number="03" title="Share invoices" text="Send rent and utility bills through WhatsApp." /><Workflow number="04" title="Stay on top" text="Follow payments, requests and move-outs." /></div></div></section>

      <section id="features" className="relative overflow-hidden bg-[#10192E] px-5 py-20 text-white sm:px-8 sm:py-28"><div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-72 size-[44rem] rounded-full bg-brand-600/25 blur-[100px]" /><div className="relative mx-auto max-w-[1320px]">
        <div data-scroll-reveal className="grid gap-8 lg:grid-cols-[.78fr_1.22fr] lg:items-end"><div><p className="text-[11px] font-extrabold uppercase tracking-[.17em] text-[#9BB2FF]">Inside Bedy</p><h2 className="mt-4 max-w-[570px] text-4xl font-extrabold leading-[1.04] tracking-[-.06em] sm:text-6xl">The details that keep a property moving.</h2></div><p className="max-w-[510px] text-sm leading-7 text-white/65 lg:justify-self-end">Explore the everyday workflows in one place, from allocating a bed to collecting rent and resolving a resident request.</p></div>
        <div className="mt-10 grid gap-7 lg:mt-14 lg:grid-cols-[260px_1fr]">
          <div data-scroll-reveal role="tablist" aria-label="Product workflows" className="grid grid-cols-2 gap-2 lg:grid-cols-1">{TABS.map((item, index) => { const Icon = item.icon; const selected = tab === item.id; return <button key={item.id} type="button" role="tab" aria-selected={selected} aria-controls="product-preview" onClick={() => { setTab(item.id); setPreview(false); }} className={"group flex min-h-[66px] items-center gap-3 rounded-xl border px-3.5 text-left transition " + (selected ? "border-white/15 bg-white text-[#10192E] shadow-lg" : "border-white/10 bg-white/[.035] text-white/65 hover:bg-white/[.08] hover:text-white")}><span className={"flex size-9 shrink-0 items-center justify-center rounded-lg " + (selected ? "bg-brand-50 text-brand-700" : "bg-white/10 text-[#B5C5FF]")}><Icon className="size-4" /></span><span><span className="block text-[8px] font-bold uppercase tracking-[.14em] opacity-55">0{index + 1}</span><span className="mt-0.5 block text-[11px] font-bold sm:text-xs">{item.label}</span></span><ChevronRight className={"ml-auto hidden size-4 sm:block " + (selected ? "text-brand-600" : "text-white/35")} /></button>; })}</div>
          <div id="product-preview" data-scroll-reveal role="tabpanel" className="min-h-[340px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#F8FAFF] text-[#10192E] shadow-[0_24px_70px_rgba(0,0,0,.25)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5EAF3] bg-white px-4 py-3.5 sm:px-6"><div className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><TabIcon tab={tab} /></span><span className="text-xs font-extrabold">{TABS.find((item) => item.id === tab)?.label}</span></div><span className="text-[9px] font-semibold uppercase tracking-[.14em] text-[#9AA6BA]">Illustrative interface · Example data</span></div>
            <div key={tab} className="animate-fade-slide-up p-4 sm:p-7">
              {tab === "rooms" && <Rooms />}
              {tab === "billing" && <div className="grid gap-5 md:grid-cols-[1fr_.8fr] md:items-center"><div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-brand-700">Rent collection</p><h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">A clearer bill, ready to share.</h3><p className="mt-2 max-w-md text-xs leading-6 text-[#6C7890]">Itemized rent invoices with a direct UPI link and a digital receipt once payment is recorded.</p><button type="button" onClick={() => setPreview(!preview)} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-[11px] font-bold text-white hover:bg-brand-700"><WhatsAppIcon className="size-3.5" />{preview ? "Close invoice preview" : "Preview invoice message"}</button></div><div className="rounded-[1.2rem] border border-[#DCE4F2] bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between border-b border-[#EEF1F6] pb-3"><span className="text-xs font-extrabold">Monthly invoice · example</span><ReceiptText className="size-4 text-brand-600" /></div><div className="space-y-3 py-4 text-[11px]"><Line label="Monthly rent" amount={"\u20B98,500"} /><Line label="Room electricity" amount={"\u20B9380"} /><Line label="Total due" amount={"\u20B98,880"} strong /></div><div className="rounded-lg bg-emerald-50 px-3 py-2.5 text-center text-[10px] font-bold text-emerald-800">Direct UPI payment link</div>{preview && <p className="mt-3 rounded-lg bg-[#F8FAFF] p-3 text-[10px] leading-5 text-[#516078]">Invoice preview: itemized rent and room electricity with a payment link.</p>}</div></div>}
              {tab === "utilities" && <div className="grid gap-6 md:grid-cols-[1fr_.8fr] md:items-center"><div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-brand-700">Room sub-meter</p><h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">Split the bill by actual use.</h3><p className="mt-2 max-w-md text-xs leading-6 text-[#6C7890]">Adjust the example meter reading. The bill and per-resident share update with it.</p><label className="mt-5 block text-[10px] font-bold" htmlFor="preview-meter">Current reading <span className="ml-1 font-mono text-brand-700">{reading} kWh</span></label><input id="preview-meter" type="range" min="1220" max="1750" step="10" value={reading} onChange={(event) => setReading(Number(event.target.value))} className="mt-3 w-full accent-brand-600" /><div className="flex justify-between text-[9px] font-mono text-[#9AA6BA]"><span>1,220 kWh</span><span>1,750 kWh</span></div></div><div className="grid grid-cols-2 gap-2.5"><Metric label="Previous reading" value="1,200 kWh" /><Metric label="Units used" value={used + " kWh"} /><Metric label="Example tariff" value={"\u20B910 / unit"} /><Metric label="Each resident" value={"\u20B9" + share} accent /><div className="col-span-2 rounded-xl bg-[#14234B] p-4 text-white"><span className="text-[9px] font-bold uppercase tracking-[.15em] text-white/55">Example room bill</span><strong className="mt-1 block text-2xl">{"\u20B9" + bill}</strong></div></div></div>}
              {tab === "requests" && <div className="grid gap-5 md:grid-cols-[1fr_.8fr] md:items-center"><div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-brand-700">Resident portal</p><h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">From request to resolution.</h3><p className="mt-2 max-w-md text-xs leading-6 text-[#6C7890]">Residents can raise a maintenance request from the mobile portal. Staff can assign and follow its status.</p><a href="#demo-portals" className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold text-brand-700">Open the resident demo <ArrowRight className="size-3.5" /></a></div><div className="rounded-[1.2rem] border border-[#DCE4F2] bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between border-b border-[#EEF1F6] pb-3"><span className="text-xs font-extrabold">Maintenance request</span><Wrench className="size-4 text-brand-600" /></div><div className="mt-4 rounded-xl bg-[#F8FAFF] p-3.5"><span className="text-[9px] font-bold uppercase tracking-[.14em] text-[#9AA6BA]">Example request</span><p className="mt-1.5 text-xs font-bold">Room repair or service issue</p><div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-[#516078]"><span className="size-2 rounded-full bg-amber-500" />Open · ready for assignment</div></div><div className="mt-3 flex justify-between text-[9px] text-[#6C7890]"><span>Assigned staff</span><span className="font-bold">Manage in portal</span></div></div></div>}
            </div>
          </div>
        </div>
        </div>
      </section>

      <section id="resident-journey" className="resident-journey-surface relative overflow-hidden px-5 py-20 text-[#10192E] sm:px-8 sm:py-28">
        <div className="relative mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-20">
          <div data-scroll-reveal className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-brand-700">From move-in to move-out</p>
            <h2 className="mt-4 max-w-[520px] text-4xl font-extrabold leading-[1.04] tracking-[-.06em] sm:text-6xl">The whole stay, in one steady rhythm.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#516078]">A resident's experience touches every part of a property. Keep each handoff connected, from the first bed assignment to the final settlement.</p>
            <a href="#demo-portals" className="mt-7 inline-flex items-center gap-2 text-xs font-bold text-brand-700 transition hover:text-brand-900">Explore the role-based portals <ArrowRight className="size-4" /></a>
            <div className="mt-10 hidden h-px w-20 bg-brand-300 lg:block" />
            <p className="mt-3 hidden text-[9px] uppercase tracking-[.16em] text-[#9AA6BA] lg:block">One record, all the way through</p>
          </div>

          <div className="relative space-y-3 pl-5 before:absolute before:bottom-8 before:left-[7px] before:top-8 before:w-px before:bg-[#D4D9E3] sm:pl-8 sm:before:left-[11px]">
            <JourneyStep number="01 / ARRIVE" title="Make the room ready." description="See room and bed availability, assign a space, and keep resident documents with their record." tags={["Bed assignment", "Resident records"]}>
              <div className="rounded-xl border border-[#E5EAF3] bg-white p-3.5">
                <div className="mb-3 flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#6C7890]">Example room map</span><BedDouble className="size-4 text-brand-600" /></div>
                <div className="grid grid-cols-2 gap-2"><div className="rounded-lg bg-[#F3F6FC] p-2"><span className="block text-[8px] font-bold text-[#9AA6BA]">BED A</span><span className="mt-1 block text-[9px] font-bold text-[#39475F]">Occupied</span></div><div className="rounded-lg border border-dashed border-emerald-300 bg-emerald-50/60 p-2"><span className="block text-[8px] font-bold text-emerald-700">BED B</span><span className="mt-1 block text-[9px] font-bold text-emerald-800">Available</span></div></div>
              </div>
            </JourneyStep>
            <JourneyStep number="02 / BILL" title="Make monthly costs clear." description="Share itemized rent and electricity invoices through WhatsApp. Residents pay directly through the property's UPI link." tags={["Rent invoice", "Direct UPI"]} tone="invoice">
              <div className="rounded-xl border border-[#E2E8F5] bg-white p-3.5">
                <div className="mb-3 flex items-center justify-between border-b border-[#EEF1F6] pb-2"><span className="text-[9px] font-bold text-[#39475F]">Invoice preview</span><WhatsAppIcon className="size-3.5" /></div>
                <div className="space-y-2 text-[9px] text-[#6C7890]"><div className="flex justify-between"><span>Rent</span><span className="font-mono text-[#39475F]">Included</span></div><div className="flex justify-between"><span>Room electricity</span><span className="font-mono text-[#39475F]">Itemized</span></div></div>
                <div className="mt-3 rounded-md bg-emerald-50 px-2 py-1.5 text-center text-[8px] font-bold text-emerald-800">UPI link goes to property account</div>
              </div>
            </JourneyStep>
            <JourneyStep number="03 / CARE" title="Keep everyday issues moving." description="Residents can raise maintenance requests from the portal. Staff can assign work and follow its status." tags={["Resident request", "Staff assignment"]}>
              <div className="rounded-xl border border-[#E5EAF3] bg-white p-3.5">
                <div className="mb-3 flex items-center justify-between"><span className="text-[9px] font-bold text-[#39475F]">Request workflow</span><Wrench className="size-3.5 text-brand-600" /></div>
                <div className="flex items-center gap-1.5 text-[8px] font-bold text-[#516078]"><span className="rounded-md bg-amber-50 px-2 py-1 text-amber-800">Raised</span><ArrowRight className="size-3 text-[#9AA6BA]" /><span className="rounded-md bg-brand-50 px-2 py-1 text-brand-800">Assigned</span><ArrowRight className="size-3 text-[#9AA6BA]" /><span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-800">Resolved</span></div>
              </div>
            </JourneyStep>
            <JourneyStep number="04 / SETTLE" title="Close with a clear record." description="Record agreed deductions and outstanding bills, then provide a move-out settlement statement." tags={["Deposit deductions", "Settlement statement"]} tone="settlement">
              <div className="rounded-xl border border-white/10 bg-white/[.07] p-3.5 text-white">
                <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2"><span className="text-[9px] font-bold">Move-out summary</span><FileCheck2 className="size-3.5 text-[#B8C8FF]" /></div>
                <div className="space-y-2 text-[9px] text-white/65"><div className="flex justify-between"><span>Deposit</span><span>Recorded</span></div><div className="flex justify-between"><span>Deductions</span><span>Itemized</span></div></div>
                <div className="mt-3 rounded-md bg-white px-2 py-1.5 text-center text-[8px] font-bold text-[#14234B]">Settlement statement ready</div>
              </div>
            </JourneyStep>
          </div>
        </div>
      </section>

      <section className="bg-[#EEF2FA] px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
        <div className="max-w-lg"><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-brand-700">Move-outs & records</p><h2 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-[-.06em] sm:text-5xl">A fair finish. A better record.</h2><p className="mt-5 text-sm leading-7 text-[#516078]">Keep resident documents in one place. At checkout, record agreed deductions and outstanding bills in a settlement statement.</p><a href="#demo-portals" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-700">See the resident experience <ArrowRight className="size-4" /></a></div>
        <div className="grid overflow-hidden rounded-[1.5rem] border border-[#DCE4F2] bg-white shadow-[0_25px_60px_rgba(31,51,91,.10)] md:grid-cols-[1fr_.86fr]">
          <div className="p-5 sm:p-8"><div className="flex items-center justify-between border-b border-[#E5EAF3] pb-4"><div className="flex items-center gap-2.5"><span className="flex size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><FileCheck2 className="size-4" /></span><span><strong className="block text-xs">Move-out settlement</strong><span className="text-[9px] text-[#9AA6BA]">Illustrative statement</span></span></div><ArrowUpRight className="size-4 text-[#9AA6BA]" /></div><div className="space-y-4 py-5 text-[11px]"><Line label="Security deposit" amount={"\u20B915,000"} /><Line label="Utility balance" amount={"- \u20B9480"} /><Line label="Agreed room repair" amount={"- \u20B91,500"} /></div><div className="flex items-center justify-between border-t border-[#E5EAF3] pt-4"><span className="text-xs font-bold">Refund amount</span><strong className="text-lg font-extrabold text-emerald-700">{"\u20B913,020"}</strong></div></div>
          <div className="border-t border-[#E5EAF3] bg-[#F8FAFF] p-5 sm:p-8 md:border-l md:border-t-0"><p className="text-[9px] font-extrabold uppercase tracking-[.15em] text-brand-700">Resident records</p><h3 className="mt-2 text-xl font-extrabold">Documents, organized.</h3><p className="mt-2 text-[11px] leading-5 text-[#6C7890]">Keep identity, contact and tenancy documents with resident details.</p><div className="mt-5 space-y-2"><Doc icon={FileText} label="Identity document" /><Doc icon={Users} label="Emergency contact" /><Doc icon={ShieldCheck} label="Tenancy record" /></div></div>
        </div>
      </div></section>

      <section id="demo-portals" className="bg-white px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-[1320px]">
        <div className="flex flex-col justify-between gap-5 border-b border-[#E5EAF3] pb-8 sm:flex-row sm:items-end"><div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-brand-700">Try the product</p><h2 className="mt-3 text-4xl font-extrabold tracking-[-.06em] sm:text-5xl">Three views. One property.</h2></div><p className="max-w-md text-xs leading-6 text-[#6C7890]">Open a sample portal to see how owners, managers and residents use Bedy.</p></div>
        <div className="mt-8 grid overflow-hidden rounded-[1.5rem] border border-[#DCE4F2] bg-[#F8FAFF] md:grid-cols-3">{ROLES.map((item, index) => { const Icon = item.icon; return <article key={item.role} className={"flex min-h-[245px] flex-col justify-between p-6 sm:p-8 " + (index ? "border-t border-[#DCE4F2] md:border-l md:border-t-0" : "")}><div><div className="flex items-center justify-between"><span className="flex size-11 items-center justify-center rounded-xl bg-white text-brand-700 shadow-xs"><Icon className="size-5" /></span><span className="font-mono text-[10px] text-[#9AA6BA]">0{index + 1}</span></div><h3 className="mt-5 text-xl font-extrabold">{item.title}</h3><p className="mt-2 max-w-xs text-xs leading-5 text-[#6C7890]">{item.detail}</p></div><button type="button" onClick={() => demo(item.role, item.email)} disabled={loading === item.role} className="mt-7 inline-flex min-h-11 items-center justify-between rounded-xl bg-[#10192E] px-4 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60"><span>{loading === item.role ? "Opening portal..." : "Open " + item.title + " portal"}</span>{loading === item.role ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}</button></article>; })}</div>
      </div></section>

      <section id="pricing" className="bg-[#F8FAFF] px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-[1320px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div className="max-w-xl"><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-brand-700">Straightforward plans</p><h2 className="mt-3 text-4xl font-extrabold tracking-[-.06em] sm:text-5xl">Choose the size that fits.</h2><p className="mt-4 text-sm leading-6 text-[#6C7890]">Pricing per property, with direct UPI rent payments and no transaction commission.</p></div><div className="inline-flex w-fit items-center gap-3 rounded-full border border-[#DCE4F2] bg-white p-1.5"><span className={"px-2 text-[11px] font-bold " + (!annual ? "text-[#10192E]" : "text-[#9AA6BA]")}>Monthly</span><button type="button" role="switch" aria-label="Annual billing" aria-checked={annual} onClick={() => setAnnual(!annual)} className={"relative h-6 w-11 rounded-full " + (annual ? "bg-brand-600" : "bg-neutral-300")}><span className={"absolute top-1 size-4 rounded-full bg-white shadow-sm " + (annual ? "left-6" : "left-1")} /></button><span className={"px-2 text-[11px] font-bold " + (annual ? "text-[#10192E]" : "text-[#9AA6BA]")}>Annual <span className="text-emerald-700">- save 20%</span></span></div></div>
        <div className="mt-9 grid gap-4 lg:grid-cols-3">{PLANS.map((plan) => <article key={plan.name} className={"flex flex-col rounded-[1.35rem] border p-6 sm:p-7 " + (plan.popular ? "border-brand-600 bg-[#14234B] text-white shadow-[0_24px_60px_rgba(20,35,75,.22)]" : "border-[#DCE4F2] bg-white text-[#10192E]")}><span className={"mb-5 inline-flex w-fit rounded-full px-3 py-1 text-[9px] font-extrabold uppercase tracking-[.14em] " + (plan.popular ? "bg-white/10 text-[#C6D2FF]" : "text-brand-700")}>{plan.popular ? "Popular plan" : plan.badge}</span><h3 className="text-xl font-extrabold">{plan.name}</h3><p className={"mt-2 min-h-10 text-xs leading-5 " + (plan.popular ? "text-white/65" : "text-[#6C7890]")}>{plan.desc}</p><div className="mt-6 flex items-baseline gap-1"><strong className="text-4xl font-extrabold tracking-[-.06em]">{annual ? plan.annual : plan.monthly}</strong><span className={"text-[10px] " + (plan.popular ? "text-white/55" : "text-[#9AA6BA]")}>/ property / month</span></div><div className={"my-6 h-px " + (plan.popular ? "bg-white/15" : "bg-[#E5EAF3]")} /><ul className="flex-1 space-y-3">{plan.features.map((feature) => <li key={feature} className={"flex items-start gap-2.5 text-[11px] leading-5 " + (plan.popular ? "text-white/80" : "text-[#516078]")}><Check className={"mt-0.5 size-3.5 shrink-0 " + (plan.popular ? "text-[#94A9FF]" : "text-emerald-600")} /><span>{feature}</span></li>)}</ul><Link href={plan.name.includes("Enterprise") ? "/contact" : "/login"} className={"mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-bold " + (plan.popular ? "bg-white text-[#14234B] hover:bg-[#EEF2FA]" : "bg-brand-600 text-white hover:bg-brand-700")}>{plan.popular ? "Start your trial" : plan.name.includes("Enterprise") ? "Talk to our team" : "Start your trial"}<ArrowRight className="size-3.5" /></Link></article>)}</div>
      </div></section>

      <section id="faq" className="border-t border-[#E5EAF3] bg-white px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto grid max-w-[1100px] gap-10 lg:grid-cols-[.72fr_1.28fr]"><div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-brand-700">Good to know</p><h2 className="mt-3 text-4xl font-extrabold leading-[1.05] tracking-[-.06em] sm:text-5xl">A few practical answers.</h2><p className="mt-4 text-sm leading-6 text-[#6C7890]">Details about payments, room billing and the resident experience.</p><span className="mt-7 inline-flex size-12 items-center justify-center rounded-2xl bg-[#F3F6FC] text-brand-700"><CircleHelp className="size-5" /></span></div><div className="divide-y divide-[#E5EAF3] border-y border-[#E5EAF3]">{FAQS.map((item, index) => { const expanded = faq === index; return <div key={item.q}><h3><button type="button" id={"faq-trigger-" + index} aria-expanded={expanded} aria-controls={"faq-panel-" + index} onClick={() => setFaq(expanded ? -1 : index)} className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-bold text-[#26344C] hover:text-brand-700"><span>{item.q}</span><ChevronDown className={"size-4 shrink-0 text-[#9AA6BA] transition-transform " + (expanded ? "rotate-180 text-brand-700" : "")} /></button></h3>{expanded && <div id={"faq-panel-" + index} role="region" aria-labelledby={"faq-trigger-" + index} className="max-w-2xl pb-5 pr-8 text-xs leading-6 text-[#6C7890]">{item.a}</div>}</div>; })}</div></div></section>

      <section className="px-5 py-12 sm:px-8 sm:py-16"><div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[1.6rem] bg-brand-600 px-6 py-10 text-white sm:px-10 sm:py-14"><div aria-hidden="true" className="absolute -right-20 -top-40 size-[30rem] rounded-full border border-white/10" /><div aria-hidden="true" className="absolute -right-4 -top-24 size-[22rem] rounded-full border border-white/10" /><div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-end"><div className="max-w-2xl"><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-white/65">A more manageable day starts here</p><h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-.05em] sm:text-5xl">See how Bedy fits your property.</h2></div><a href="#demo-portals" className="inline-flex min-h-12 w-fit items-center gap-3 rounded-full bg-white px-6 text-xs font-extrabold text-brand-800 hover:bg-[#EEF2FA]">Explore the portals <ArrowRight className="size-4" /></a></div></div></section>
    </main>

    <footer className="border-t border-[#E5EAF3] bg-white px-5 py-10 sm:px-8"><div className="mx-auto max-w-[1320px]"><div className="flex flex-col justify-between gap-8 md:flex-row"><div className="max-w-xs"><Link href="/" className="inline-flex items-center gap-2"><img src="/logo.png" alt="" className="size-8 rounded-lg" /><span className="text-lg font-extrabold tracking-[-.06em]">bedy</span></Link><p className="mt-3 text-[11px] leading-5 text-[#6C7890]">A clearer way to manage rooms, rent and resident operations.</p></div><nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-3 text-[11px] font-semibold text-[#516078] sm:grid-cols-3"><Link className="hover:text-brand-700" href="/features">Features</Link><Link className="hover:text-brand-700" href="/pricing">Pricing</Link><Link className="hover:text-brand-700" href="/services">Services</Link><Link className="hover:text-brand-700" href="/about">About</Link><Link className="hover:text-brand-700" href="/contact">Contact</Link><Link className="hover:text-brand-700" href="/privacy">Privacy</Link><Link className="hover:text-brand-700" href="/terms">Terms</Link><Link className="hover:text-brand-700" href="/refund-policy">Refund policy</Link></nav></div><div className="mt-8 flex flex-col justify-between gap-2 border-t border-[#E5EAF3] pt-5 text-[10px] text-[#9AA6BA] sm:flex-row"><span>Copyright {new Date().getFullYear()} Bedy Technologies</span><span>PG, hostel and co-living operations</span></div></div></footer>
  </div>;
}

function Workflow({ number, title, text }) { return <div className="relative pl-10 sm:pl-0"><span className="absolute left-0 top-0.5 font-mono text-[10px] font-bold text-brand-600 sm:static">{number}</span><h3 className="text-xs font-extrabold text-[#17213A] sm:mt-3">{title}</h3><p className="mt-1 text-[10px] leading-4 text-[#6C7890]">{text}</p></div>; }
function TabIcon({ tab }) { if (tab === "billing") return <ReceiptText className="size-4" />; if (tab === "utilities") return <Zap className="size-4" />; if (tab === "requests") return <Wrench className="size-4" />; return <BedDouble className="size-4" />; }
function Rooms() { return <div className="grid gap-5 md:grid-cols-[1fr_.8fr] md:items-center"><div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-brand-700">Occupancy overview</p><h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">Know what is available.</h3><p className="mt-2 max-w-md text-xs leading-6 text-[#6C7890]">View room and bed assignments together, then assign an open bed when someone moves in.</p><div className="mt-5 flex gap-3 text-[9px] font-semibold text-[#6C7890]"><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-brand-600" />Occupied</span><span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-emerald-500" />Available</span></div></div><div className="rounded-[1.2rem] border border-[#DCE4F2] bg-white p-4 shadow-sm sm:p-5"><div className="flex justify-between border-b border-[#EEF1F6] pb-3"><span className="text-xs font-extrabold">Floor 2 · Room map</span><span className="text-[9px] text-[#9AA6BA]">Example layout</span></div><div className="mt-4 grid grid-cols-3 gap-2">{["201","202","203","204","205","206"].map((room) => <div key={room} className="rounded-lg border border-[#E5EAF3] p-2"><span className="block text-[8px] font-bold text-[#6C7890]">Room {room}</span><div className="mt-1.5 flex gap-1"><span className="flex size-6 items-center justify-center rounded-md bg-brand-50 text-[8px] font-extrabold text-brand-700">A</span><span className={"flex size-6 items-center justify-center rounded-md text-[8px] font-extrabold " + (room === "204" ? "bg-emerald-50 text-emerald-700" : "bg-brand-50 text-brand-700")}>B</span></div></div>)}</div></div></div>; }
function Line({ label, amount, strong = false }) { return <div className={"flex items-center justify-between gap-4 " + (strong ? "border-t border-[#E5EAF3] pt-3 font-extrabold text-[#17213A]" : "text-[#6C7890]")}><span>{label}</span><span className="shrink-0 font-mono">{amount}</span></div>; }
function Metric({ label, value, accent = false }) { return <div className="rounded-xl border border-[#E5EAF3] bg-white p-3"><span className="block text-[9px] font-semibold leading-4 text-[#6C7890]">{label}</span><strong className={"mt-1 block text-sm font-extrabold " + (accent ? "text-brand-700" : "text-[#26344C]")}>{value}</strong></div>; }
function Doc({ icon: Icon, label }) { return <div className="flex items-center gap-2.5 rounded-lg border border-[#E5EAF3] bg-white px-3 py-2.5"><span className="flex size-7 items-center justify-center rounded-md bg-brand-50 text-brand-700"><Icon className="size-3.5" /></span><span className="text-[10px] font-bold text-[#39475F]">{label}</span><Check className="ml-auto size-3.5 text-emerald-600" /></div>; }
function BuildingMark() { return <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none"><path d="M3 13V4.2L8 2l5 2.2V13M1.8 13h12.4M5.5 5.5h.1m4.8 0h.1m-5 2.3h.1m4.8 0h.1m-4.9 2.3h.1m4.8 0h.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }

function JourneyStep({ number, title, description, tags, tone = "default", children }) {
  const isDark = tone === "settlement";
  const surface = isDark
    ? "border-[#14234B] bg-[#14234B] text-white shadow-[0_16px_36px_rgba(20,35,75,.16)]"
    : tone === "invoice"
      ? "border-[#D5DFF4] bg-[#F5F7FC] text-[#10192E] shadow-[0_8px_28px_rgba(31,51,91,.045)]"
      : "border-[#E0E4EC] bg-white text-[#10192E] shadow-[0_8px_28px_rgba(31,51,91,.045)]";

  return (
    <article data-scroll-reveal className={"relative rounded-2xl border p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(31,51,91,.10)] sm:p-6 " + surface}>
      <span className={"absolute -left-[24px] top-7 size-2.5 rounded-full border-2 sm:-left-[27px] " + (isDark ? "border-[#F5F4EF] bg-[#14234B]" : "border-[#F5F4EF] bg-brand-600")} />
      <div className="grid gap-4 sm:grid-cols-[88px_1fr] sm:gap-5 lg:grid-cols-[76px_minmax(0,1fr)_190px] lg:items-center">
        <span className={"font-mono text-[9px] font-bold tracking-[.12em] " + (isDark ? "text-[#B8C8FF]" : "text-brand-700")}>{number}</span>
        <div>
          <h3 className="text-base font-extrabold tracking-tight sm:text-lg">{title}</h3>
          <p className={"mt-1.5 max-w-lg text-[11px] leading-5 " + (isDark ? "text-white/65" : "text-[#6C7890]")}>{description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => <span key={tag} className={"rounded-md px-2 py-1 text-[8px] font-semibold " + (isDark ? "bg-white/10 text-white/75" : "bg-white/80 text-[#516078]")}>{tag}</span>)}
          </div>
        </div>
        <div className="sm:col-span-2 lg:col-span-1">{children}</div>
      </div>
    </article>
  );
}
