import Link from "next/link";
import { ArrowLeft, Wallet, BedSingle, BellRing, FileCheck, Wrench, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Services & Products | Bedy – PG & Hostel Management OS",
  description:
    "Explore Bedy products and services: Automated rent billing, live bed availability matrix, WhatsApp rent reminders, security deposit manager, and maintenance tracking.",
  alternates: {
    canonical: "/services",
  },
};

export default function ServicesPage() {
  const modules = [
    {
      icon: Wallet,
      color: "text-brand-600 bg-brand-50 border-brand-200",
      title: "Automated Rent Billing & Invoice Cycles",
      description:
        "Generate recurring monthly rent invoices in batch. Automatic prorating for mid-month move-ins, arrears carryover, late payment penalty rules, and printable digital receipts.",
    },
    {
      icon: BellRing,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      title: "One-Tap WhatsApp Rent Reminders & UPI QR",
      description:
        "Pre-filled personalized WhatsApp payment requests sent to tenants with single-click UPI deep links. Boost on-time rent recovery without friction or awkward calls.",
    },
    {
      icon: BedSingle,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      title: "Interactive Bed Matrix & Room Availability",
      description:
        "Real-time visual map of all rooms, floors, and sharing configurations (Single, Double, Triple). Instantly view live vacancies, check-in new occupants, and reassign beds.",
    },
    {
      icon: ShieldCheck,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      title: "Security Deposit & Notice Period Settlement",
      description:
        "Log initial security deposits, track upcoming departures with intelligent 2-day exit alerts, itemize repair or utility deductions, and issue settlement statements.",
    },
    {
      icon: Wrench,
      color: "text-rose-600 bg-rose-50 border-rose-200",
      title: "Resident Maintenance & Complaint Desk",
      description:
        "Residents report plumbing, electrical, or Wi-Fi grievances with photos from their portal. Managers assign staff, monitor urgent SLAs, and log resolutions.",
    },
    {
      icon: FileCheck,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      title: "KYC Onboarding & Digital Resident Registers",
      description:
        "Collect Aadhaar/ID documents, emergency contacts, and work details securely. Searchable digital database replaces bulky paper ledgers and audits.",
    },
  ];

  return (
    <div className="w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Navigation back */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors mb-4"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Home</span>
          </Link>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-brand-600 mb-2">
            Platform Capabilities & Services
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-950 leading-tight">
            Software Built for High-Occupancy Living Spaces
          </h1>
          <p className="mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed max-w-3xl">
            Everything you need to automate billing, minimize defaulters, track bed inventories, and keep tenants delighted across one or multiple properties.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xs hover:border-brand-200 hover:shadow-xs transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <span className={`flex size-10 items-center justify-center rounded-xl border ${m.color}`}>
                    <Icon className="size-5" />
                  </span>
                  <h2 className="text-base font-bold text-neutral-900 leading-snug">{m.title}</h2>
                  <p className="text-xs text-neutral-600 leading-relaxed">{m.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Integration Strip */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xs">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-lg font-bold text-neutral-900">Custom Multi-Property & Enterprise Rollouts</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Managing more than 100 beds or multiple branches across cities? We offer custom onboarding, staff training, and data migration from spreadsheets.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-700 transition"
          >
            Speak with an Expert
          </Link>
        </div>
      </div>
    </div>
  );
}
