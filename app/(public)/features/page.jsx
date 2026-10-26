import Link from "next/link";
import { BedSingle, MessageSquare, Receipt, Wrench, Shield, Smartphone, ArrowRight, Zap, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Features — Complete PG & Hostel Management Software",
  description:
    "Explore Bedy features: Live bed occupancy matrix, automated WhatsApp rent reminders with UPI, security deposit settlement, and resident maintenance ticketing.",
};

const featureList = [
  {
    icon: BedSingle,
    title: "Visual Bed & Room Matrix",
    description: "Colour-coded room cards by floor showing available, occupied, and notice-period beds at a single glance.",
  },
  {
    icon: MessageSquare,
    title: "1-Click WhatsApp Reminders",
    description: "Send pre-formatted personalized rent dues with resident name, room number, amount, and direct UPI payment links.",
  },
  {
    icon: Receipt,
    title: "Automated Monthly Invoicing",
    description: "Cycle-based rent generation on the 1st or custom dates, with automated late-fee calculation and GST invoice support.",
  },
  {
    icon: Zap,
    title: "Stored Room Sub-Meters",
    description: "Pre-fills previous month meter readings, calculates consumed units at your custom rate, and divides it among room occupants.",
  },
  {
    icon: Shield,
    title: "Security Deposit Settlements",
    description: "Itemized damage deductions, unpaid rent adjustment, and 1-click refund vouchers when a resident vacates.",
  },
  {
    icon: Wrench,
    title: "Complaint & Maintenance Desk",
    description: "Residents file maintenance requests with photos. Track plumber, electrician, and Wi-Fi tickets to resolution.",
  },
  {
    icon: Smartphone,
    title: "Dedicated Resident Portal",
    description: "Zero app download needed. Tenants view invoices, download payment receipts, read notices, and raise tickets from any phone.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
            Platform Capabilities
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">
            Everything your PG needs to run on autopilot
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Say goodbye to paper registers, confusing Excel spreadsheets, and endless WhatsApp follow-ups.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureList.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-slate-50/40 p-6 hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 mb-4">
                <item.icon className="size-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-emerald-50/50 p-8 text-center space-y-4 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-slate-950">Ready to streamline your property operations?</h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Test drive Bedy with our pre-seeded live demo accounts right now. No sign-up or credit card required.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white px-5 py-3 text-xs font-bold transition shadow-sm"
            >
              <span>Explore Live Showcase</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-5 py-3 text-xs font-semibold transition"
            >
              <span>View Pricing Plans</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
