import Link from "next/link";
import { Mail, Phone, MapPin, Clock, MessageCircle, ArrowRight, ShieldCheck, Send } from "lucide-react";

export const metadata = {
  title: "Contact Us — Bedy PG & Hostel OS",
  description: "Get in touch with Bedy team for inquiries, product demos, or technical support for your PG or hostel.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-16 text-slate-900 bg-white min-h-screen">
      <div className="w-full max-w-lg mx-auto space-y-8">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 mb-3">
            <MessageCircle className="size-3.5 text-emerald-600" />
            Support & Inquiries
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
            Get in touch with Bedy
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Have questions about managing your PG or hostel with Bedy? Our team is here to assist you with onboarding, custom setups, or billing inquiries.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 p-4.5 bg-slate-50/50 space-y-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Mail className="size-4.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Email Us</h3>
            <a
              href="mailto:support@bedy.in"
              className="text-sm font-semibold text-emerald-700 hover:underline block"
            >
              support@bedy.in
            </a>
            <p className="text-[11px] text-slate-500">Typical reply within 2 business hours</p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4.5 bg-slate-50/50 space-y-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <Clock className="size-4.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Support Hours</h3>
            <div className="text-sm font-semibold text-slate-900">
              Mon – Sat: 9 AM – 7 PM IST
            </div>
            <p className="text-[11px] text-slate-500">Bangalore & Chennai Support Desks</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Send us a direct message</h2>
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Your Name</label>
              <input
                type="text"
                placeholder="e.g. Rajesh Kumar"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-emerald-600 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email or Phone</label>
              <input
                type="text"
                placeholder="e.g. rajesh@gmail.com or +91 98765-43210"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-emerald-600 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Property Name / Beds Operated</label>
              <input
                type="text"
                placeholder="e.g. Sri Balaji Luxury PG (35 Beds)"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-emerald-600 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Message</label>
              <textarea
                rows={3}
                placeholder="Tell us what you need help with..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-emerald-600 bg-white"
              />
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
            >
              <Send className="size-3.5" />
              <span>Send Message</span>
            </button>
          </form>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
          <Link href="/" className="hover:text-slate-900 font-semibold flex items-center gap-1">
            ← Back to Home
          </Link>
          <Link href="/pricing" className="text-emerald-700 hover:underline font-semibold">
            View Pricing Plans →
          </Link>
        </div>
      </div>
    </div>
  );
}

