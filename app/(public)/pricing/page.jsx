import Link from "next/link";
import { Check, ArrowRight, ShieldCheck, Zap, Sparkles } from "lucide-react";

export const metadata = {
  title: "Pricing — Simple & Transparent PG Management Software",
  description:
    "Affordable per-bed and monthly plans for PGs, hostels, and student co-living properties. 100% digital rent collection with zero hidden charges.",
};

const tiers = [
  {
    name: "Starter PG",
    tagline: "Ideal for small hostels and boutique PGs",
    price: "₹999",
    period: "/ month",
    beds: "Up to 30 Beds",
    features: [
      "Per-bed live occupancy grid",
      "Automated rent invoicing",
      "1-Click WhatsApp payment reminders",
      "Direct UPI payments (Zero gateway fees)",
      "Resident login portal & receipts",
      "Security deposit refund tracking",
      "Room sub-meter electricity support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Growth PG & Hostels",
    tagline: "For busy PGs looking to automate billing & maintenance",
    price: "₹2,499",
    period: "/ month",
    beds: "Up to 100 Beds",
    features: [
      "All Starter PG features included",
      "Multi-floor room & bed matrix",
      "Automated daily rent penalty rules",
      "Maintenance & complaint ticketing",
      "Notice period vacate dashboard",
      "Resident Web Push notifications",
      "Excel & Tally exportable reports",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Enterprise & Chains",
    tagline: "Multiple branches, hostels & co-living buildings",
    price: "Custom",
    period: "",
    beds: "Unlimited Beds",
    features: [
      "All Growth features included",
      "Multi-property owner dashboard",
      "Custom staff roles & access permissions",
      "Priority WhatsApp & phone support",
      "Dedicated account manager",
      "Custom domain & branding options",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold text-emerald-800">
            <Sparkles className="size-3.5 text-emerald-600" />
            Transparent Pricing · No Hidden Commissions
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
            Pricing that scales with your PG occupancy
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Collect 100% of your rent on time without chasing residents. Pick a plan suited for your property size.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-7 flex flex-col justify-between transition-all ${
                tier.popular
                  ? "bg-emerald-50/40 border-2 border-emerald-500 shadow-md shadow-emerald-500/10 scale-[1.02]"
                  : "bg-slate-50/40 border border-slate-200"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  Most Popular
                </span>
              )}
              <div>
                <h2 className="text-lg font-bold text-slate-900">{tier.name}</h2>
                <p className="mt-1 text-xs text-slate-500">{tier.tagline}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-950">{tier.price}</span>
                  <span className="text-xs text-slate-500">{tier.period}</span>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-emerald-700">{tier.beds}</p>

                <ul className="mt-6 space-y-3 text-xs sm:text-sm text-slate-600">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200/80">
                <Link
                  href={tier.cta === "Contact Sales" ? "/contact" : "/login"}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition shadow-2xs ${
                    tier.popular
                      ? "bg-slate-950 text-white hover:bg-slate-800"
                      : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{tier.cta}</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Enterprise Callout */}
        <div className="text-center text-xs text-slate-500 pt-4">
          <p>
            Have more than 150 beds across multiple branches?{" "}
            <Link href="/contact" className="text-emerald-700 font-semibold underline underline-offset-4">
              Talk to our team
            </Link>{" "}
            for custom enterprise setups.
          </p>
        </div>
      </div>
    </div>
  );
}
