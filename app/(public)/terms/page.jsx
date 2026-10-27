import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Bedy",
  description:
    "Review the terms and conditions governing the use of Bedy's PG and hostel management platform.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors mb-4"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Terms of Service
          </h1>
          <p className="mt-2 text-xs text-slate-500">Last updated: October 2026 · Effective immediately</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-slate-600 divide-y divide-slate-100">
          <section className="pt-2 space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Agreement to Terms</h2>
            <p>
              By accessing or using Bedy software, websites, and services, you agree to be bound by these Terms of Service. If you are using the service on behalf of a PG, hostel, or rental property, you represent that you have authority to bind that entity.
            </p>
          </section>

          <section className="pt-6 space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. User Accounts & Responsibilities</h2>
            <p>
              Property managers are responsible for maintaining the accuracy of room allocations, fee schedules, and tenant records. You are responsible for safeguarding your login credentials and for all activities that occur under your account.
            </p>
          </section>

          <section className="pt-6 space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Payment Terms & Processing</h2>
            <p>
              Bedy facilitates digital payment recording, automated invoicing, and third-party payment gateway integration. Direct UPI transactions are settled directly between residents and property owners with zero platform deduction.
            </p>
          </section>

          <section className="pt-6 space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Data Privacy & Security</h2>
            <p>
              All resident data, KYC identification records, and financial transaction histories are encrypted in transit and at rest. We adhere strictly to applicable Indian data protection regulations.
            </p>
          </section>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
            <span>Bank-grade encryption protecting all tenant & property records.</span>
          </div>
          <Link href="/privacy" className="text-emerald-700 font-semibold hover:underline">
            Read Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}
