import Link from "next/link";
import {
  ArrowLeft,
  BedDouble,
  Smartphone,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  FileText,
  Building,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export const metadata = {
  title: "Features — Complete PG & Hostel Management Software | Bedy",
  description:
    "Explore Bedy features: Live bed occupancy matrix, automated WhatsApp rent reminders with UPI, security deposit settlement, room sub-meter electricity engine, and resident maintenance.",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "Features — Complete PG & Hostel Management Software | Bedy",
    description:
      "Explore Bedy features: Live bed occupancy matrix, automated WhatsApp rent reminders with UPI, security deposit settlement, and resident maintenance.",
    url: "https://bedy.in/features",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://bedy.in",
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Features",
      "item": "https://bedy.in/features",
    },
  ],
};

const featureList = [
  {
    icon: Smartphone,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    badge: "Most Popular",
    title: "1-Click WhatsApp Invoicing & UPI Rent Pay Sheet",
    description:
      "Send pre-composed, polite WhatsApp rent invoices with direct UPI payment links (GPay, PhonePe, Paytm). Money settles straight into your bank account with zero intermediate gateway deductions.",
    highlights: [
      "Direct VPA UPI payment links without 2% gateway commissions",
      "Automated digital receipt generated instantly upon confirmation",
      "Personalized tenant name, bed number, and itemized rent break-up",
    ],
  },
  {
    icon: BedDouble,
    color: "bg-blue-50 text-blue-600 border-blue-200",
    badge: "Core Operations",
    title: "Live Bed Occupancy & Visual Room Matrix",
    description:
      "Interactive, color-coded floor map displaying every room and bed (Bed A, Bed B, Bed C). Spot vacancies in seconds and prevent double-booking across Single, Double, Triple, and Dormitory rooms.",
    highlights: [
      "Color-coded badges: Vacant (Green), Occupied (Blue), Notice (Amber)",
      "Instant 1-click resident check-in and room re-allocation",
      "Floor-by-floor occupancy analytics and capacity utilization",
    ],
  },
  {
    icon: Zap,
    color: "bg-amber-50 text-amber-600 border-amber-200",
    badge: "Utility Billing",
    title: "Room Sub-Meter Electricity Engine",
    description:
      "Eliminate roommate friction over AC and geyser electricity bills. Log monthly kWh meter readings per room and let Bedy automatically calculate the consumption and split it evenly among active roommates.",
    highlights: [
      "Previous vs current kWh unit calculation with customizable state tariffs",
      "Automatic fair split between active roommates on rent invoices",
      "Supports shared sub-meters, private meters, and common area adjustments",
    ],
  },
  {
    icon: ShieldCheck,
    color: "bg-purple-50 text-purple-600 border-purple-200",
    badge: "Settlement Audit",
    title: "Security Deposit Settlement & Move-Out Audits",
    description:
      "Itemized deduction vouchers for room painting, deep cleaning, pending electricity arrears, and notice shortfall. Settle refunds with complete clarity and issue formal digital exit clearance receipts.",
    highlights: [
      "30-day notice period countdown tracking with move-out alarms",
      "Itemized repair, maintenance, and unpaid utility deductions",
      "Full digital audit trail to eliminate security deposit disputes",
    ],
  },
  {
    icon: AlertTriangle,
    color: "bg-rose-50 text-rose-600 border-rose-200",
    badge: "Cash Flow Protection",
    title: "Defaulter Tracking & Daily Penalty Rules",
    description:
      "Keep cash flow healthy with an automated overdue dashboard. Set grace periods and automatic daily late penalty fees (e.g. ₹100/day after the 5th) that seamlessly attach to pending tenant invoices.",
    highlights: [
      "Real-time defaulter roster sorted by highest outstanding balance",
      "Automated daily late penalty calculations with customizable grace periods",
      "Batch WhatsApp reminders to all overdue tenants in under 30 seconds",
    ],
  },
  {
    icon: Wrench,
    color: "bg-sky-50 text-sky-600 border-sky-200",
    badge: "Resident Experience",
    title: "Resident Maintenance & Grievance Desk",
    description:
      "Residents submit plumbing, Wi-Fi, or AC complaints with photos directly from their self-service portal. Managers assign internal staff, track resolution SLAs, and maintain accountability.",
    highlights: [
      "Tenant photo uploads and categorized complaint logging",
      "Staff assignment with status transitions (Open, In Progress, Resolved)",
      "Average turnaround time tracking and historical maintenance logs",
    ],
  },
  {
    icon: FileText,
    color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    badge: "Compliance",
    title: "Digital Resident Register & KYC Vault",
    description:
      "Replace physical paper registers with a secure digital database. Securely store Aadhaar cards, work/college IDs, emergency guardian contacts, and lease agreements in the cloud.",
    highlights: [
      "Government ID and emergency contact storage for local compliance",
      "Instant search by name, room, phone number, or workplace",
      "Exportable tenant registers ready for police verification audits",
    ],
  },
  {
    icon: Building,
    color: "bg-slate-50 text-slate-700 border-slate-200",
    badge: "Multi-Branch",
    title: "Multi-Property & Multi-Branch Management",
    description:
      "Oversee one PG or an entire portfolio of hostels across multiple locations from a single master dashboard. Granular role-based permissions for Owners, Property Managers, and Caretakers.",
    highlights: [
      "Switch between branches in 1 click without separate logins",
      "Consolidated financial reporting across all properties",
      "Role-based permissions restricting sensitive bank details to owners",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Top Header */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors mb-4"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-brand-50 border border-brand-200/80 px-2.5 py-0.5 text-[10px] font-bold text-brand-700 uppercase tracking-wide">
              Product Deep Dive
            </span>
            <span className="text-xs text-neutral-400">·</span>
            <span className="text-xs text-neutral-500 font-medium">Bedy Platform v2.4</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950 leading-tight">
            Features — Complete PG & Hostel Management Software
          </h1>
          <p className="mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed max-w-3xl">
            Explore Bedy features: Live bed occupancy matrix, automated WhatsApp rent reminders with UPI, security deposit settlement, room sub-meter electricity engine, and resident maintenance ticketing.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 text-xs font-bold transition shadow-xs"
            >
              <span>Explore Interactive Live Showcase</span>
              <ExternalLink className="size-3.5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-neutral-700 transition"
            >
              <span>View Pricing Plans</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featureList.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="rounded-2xl border border-[#E5EAF3] bg-white p-6 sm:p-7 shadow-2xs hover:shadow-md hover:border-brand-200 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`flex size-11 items-center justify-center rounded-xl border ${f.color}`}>
                      <Icon className="size-5" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-md">
                      {f.badge}
                    </span>
                  </div>
                  <h2 className="text-lg font-extrabold text-neutral-950 leading-snug">
                    {f.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                    {f.description}
                  </p>
                </div>

                <div className="border-t border-[#E5EAF3] pt-4 space-y-2">
                  {f.highlights.map((h, hi) => (
                    <div key={hi} className="flex items-start gap-2 text-xs text-neutral-700">
                      <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-base sm:text-lg font-bold text-brand-950">
              Ready to see Bedy in action on your properties?
            </h3>
            <p className="text-xs sm:text-sm text-brand-800 leading-relaxed">
              Experience the 1-click demo terminal or talk with our team for an onboarding plan tailored to your rooms and bed capacity.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 hover:bg-brand-700 px-4 py-2.5 text-xs font-bold text-white transition shadow-xs"
            >
              Test Live Simulator
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-brand-200 bg-white hover:bg-neutral-50 px-4 py-2.5 text-xs font-semibold text-brand-900 transition"
            >
              Contact Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
