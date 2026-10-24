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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <Sparkles className="size-3.5" />
            Transparent Pricing · No Hidden Commissions
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
            Pricing that scales with your PG occupancy
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            Collect 100% of your rent on time without chasing residents. Pick a plan suited for your property size.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all ${
                tier.popular
                  ? "bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 scale-105"
                  : "bg-slate-800/60 border border-slate-700/60"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3.5 py-0.5 text-xs font-bold text-slate-950 uppercase tracking-wide">
                  Most Popular
                </span>
              )}
              <div>
                <h2 className="text-xl font-bold text-white">{tier.name}</h2>
                <p className="mt-1 text-xs text-slate-400">{tier.tagline}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                  <span className="text-sm text-slate-400">{tier.period}</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-emerald-400">{tier.beds}</p>

                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <Link
                  href="/login"
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition ${
                    tier.popular
                      ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold"
                      : "bg-slate-700 text-white hover:bg-slate-600"
                  }`}
                >
                  <span>{tier.cta}</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ snippet */}
        <div className="mt-16 text-center text-xs text-slate-400">
          <p>
            Have more than 300 beds across multiple branches?{" "}
            <Link href="/login" className="text-emerald-400 underline underline-offset-4">
              Talk to our team
            </Link>{" "}
            for custom enterprise migrations.
          </p>
        </div>
      </div>
    </div>
  );
}

