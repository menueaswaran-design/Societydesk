import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ShieldCheck,
  Zap,
  HelpCircle,
  Building2,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export const metadata = {
  title: "Pricing — Simple & Transparent PG Management Software | Bedy",
  description:
    "Affordable per-bed and monthly plans for PGs, hostels, and student co-living properties. 100% digital rent collection with zero hidden charges.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing — Simple & Transparent PG Management Software | Bedy",
    description:
      "Affordable per-bed and monthly plans for PGs, hostels, and student co-living properties. 100% digital rent collection with zero hidden charges.",
    url: "https://bedy.in/pricing",
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
      "name": "Pricing",
      "item": "https://bedy.in/pricing",
    },
  ],
};

const tiers = [
  {
    name: "Starter Property",
    badge: "Solo PGs",
    priceMonthly: "₹499",
    priceAnnual: "₹399",
    description:
      "Perfect for single-building PG owners and independent hostel operators managing up to 25 beds.",
    features: [
      "Up to 25 beds capacity",
      "Live Bed & Room visual occupancy grid",
      "1-Click WhatsApp rent invoices with UPI QR",
      "Direct tenant-to-bank UPI transfers (0% cut)",
      "Digital receipt auto-generation",
      "1 Property Manager account",
    ],
    popular: false,
    cta: "Start Free 14-Day Trial",
  },
  {
    name: "Growth & Co-Living",
    badge: "Most Popular",
    priceMonthly: "₹1,199",
    priceAnnual: "₹959",
    description:
      "Designed for growing PGs and multi-floor hostels wanting automated electricity splits and deposit settlements.",
    features: [
      "Up to 80 beds capacity",
      "Everything in Starter, plus:",
      "Room Sub-Meter electricity billing engine",
      "Security deposit settlement & deduction vouchers",
      "Overdue tracking & automatic daily penalty rules",
      "Resident maintenance ticketing portal",
      "3 Manager & Caretaker accounts",
      "Tally & Excel accounting export",
    ],
    popular: true,
    cta: "Start Free 14-Day Trial",
  },
  {
    name: "Multi-Branch Enterprise",
    badge: "Portfolios",
    priceMonthly: "₹2,499",
    priceAnnual: "₹1,999",
    description:
      "For hostel networks, student housing chains, and owners operating multiple buildings across cities.",
    features: [
      "Unlimited beds across all branches",
      "Multi-property unified executive dashboard",
      "Role-based access (Owner, Branch Manager, Staff)",
      "Police verification ready digital KYC exports",
      "Dedicated account onboarding manager",
      "Priority 24/7 phone & WhatsApp support",
      "Custom SLA agreements",
    ],
    popular: false,
    cta: "Contact Enterprise Sales",
  },
];

const faqs = [
  {
    q: "Does Bedy charge any transaction fee on rent payments?",
    a: "No! Bedy provides direct UPI VPA payment links (Google Pay, PhonePe, Paytm, BHIM). Rent is paid directly into your own bank account. Bedy charges exactly 0% commission on rent collection.",
  },
  {
    q: "Can I add more beds or upgrade my plan as my PG expands?",
    a: "Yes. You can upgrade or downgrade your plan at any time. When you add a new floor or expand your property, your account adjusts seamlessly.",
  },
  {
    q: "How does the sub-meter electricity splitting feature work?",
    a: "You simply enter the starting and ending kWh meter readings for each room at the end of the billing cycle. Bedy computes total units consumed, applies your per-unit tariff rate, and evenly distributes the electricity share directly into each roommate's rent invoice.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes, every new property gets full access for 14 days without entering credit card information. You can test bed allocation, WhatsApp billing, and resident registration immediately.",
  },
];

export default function PricingPage() {
  return (
    <div className="w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Header */}
        <div className="text-left sm:text-center max-w-3xl mx-auto space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors mb-2"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Home</span>
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-200/80 px-3 py-1 text-[11px] font-bold text-brand-700">
            <Sparkles className="size-3.5 text-brand-600" />
            <span>Simple, Transparent Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-950 leading-tight">
            Pricing — Simple & Transparent PG Management Software
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed">
            Affordable per-bed and monthly plans for PGs, hostels, and student co-living properties. 100% digital rent collection with zero hidden charges.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border p-6 sm:p-7 flex flex-col justify-between transition-all ${
                tier.popular
                  ? "border-brand-600 bg-white shadow-xl ring-2 ring-brand-600/15 relative"
                  : "border-[#E5EAF3] bg-white shadow-2xs hover:shadow-md hover:border-neutral-300"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
                  Recommended
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    {tier.badge}
                  </span>
                  <span className="text-xs font-semibold text-neutral-500">Per Month</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-neutral-950">{tier.name}</h2>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950">
                      {tier.priceMonthly}
                    </span>
                    <span className="text-xs font-medium text-neutral-500">/ property / mo</span>
                  </div>
                  <span className="inline-block mt-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    or {tier.priceAnnual}/mo billed yearly (Save 20%)
                  </span>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">{tier.description}</p>

                <div className="border-t border-[#E5EAF3] pt-4 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                    Includes:
                  </span>
                  {tier.features.map((f, fi) => (
                    <div key={fi} className="flex items-start gap-2 text-xs text-neutral-700">
                      <Check className="size-3.5 text-brand-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E5EAF3]">
                <Link
                  href={tier.name.includes("Enterprise") ? "/contact" : "/login"}
                  className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition shadow-xs ${
                    tier.popular
                      ? "bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/20"
                      : "border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-900"
                  }`}
                >
                  <span>{tier.cta}</span>
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* 0% Commission Guarantee */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
              <ShieldCheck className="size-6" />
            </span>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-emerald-950">
                100% Direct UPI Settlement Guarantee — 0% Commission
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed max-w-2xl">
                Unlike third-party booking platforms that deduct 2% to 5% on every rent transaction, Bedy never touches your funds. Residents scan your own UPI QR or click your VPA link, depositing 100% of the rent straight into your bank account.
              </p>
            </div>
          </div>
          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-xs font-bold transition shadow-xs"
          >
            Calculate Your Savings
          </Link>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6 pt-6 border-t border-[#E5EAF3]">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
              Got Questions?
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-950">
              Frequently Asked Questions About Bedy Pricing
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#E5EAF3] bg-white p-5 space-y-2 shadow-2xs"
              >
                <div className="flex items-start gap-2">
                  <HelpCircle className="size-4 text-brand-600 shrink-0 mt-0.5" />
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900">{faq.q}</h4>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
