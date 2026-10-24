import Link from "next/link";
import { BedSingle, MessageSquare, Receipt, Wrench, Shield, Smartphone, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
            Everything your PG needs to run on autopilot
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            Say goodbye to paper registers, confusing Excel spreadsheets, and endless WhatsApp follow-ups.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featureList.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-slate-800 bg-slate-800/40 p-7 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <item.icon className="size-6" />
              </div>
              <h2 className="mt-5 text-lg font-bold text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition"
          >
            <span>Explore Live Demo</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

