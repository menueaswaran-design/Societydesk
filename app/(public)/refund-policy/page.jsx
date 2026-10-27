import Link from "next/link";
import { ArrowLeft, ShieldCheck, Mail } from "lucide-react";

export const metadata = {
  title: "Refund Policy | Bedy",
  description:
    "Read Bedy's refund and cancellation policies for software subscriptions and resident security deposit processing.",
  alternates: {
    canonical: "/refund-policy",
  },
};

export default function RefundPolicyPage() {
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
            Refund & Cancellation Policy
          </h1>
          <p className="mt-2 text-xs text-slate-500">Last updated: October 2026 · Effective immediately</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-slate-600 divide-y divide-slate-100">
          <section className="pt-2 space-y-2">
            <h2 className="text-base font-bold text-slate-900">1. Software Subscription Refunds</h2>
            <p>
              Bedy offers a 14-day risk-free trial on all PG & Hostel management software plans. If you are not satisfied with the platform during your initial 14-day period, you may request a full refund of your subscription fee with no questions asked.
            </p>
          </section>

          <section className="pt-6 space-y-2">
            <h2 className="text-base font-bold text-slate-900">2. Subscription Cancellations</h2>
            <p>
              Property owners can cancel recurring subscriptions at any time from their account settings. Upon cancellation, your access remains active until the end of your prepaid billing cycle. No further charges will occur.
            </p>
          </section>

          <section className="pt-6 space-y-2">
            <h2 className="text-base font-bold text-slate-900">3. Resident Security Deposit Refunds</h2>
            <p>
              Security deposits paid by PG/hostel residents are held by the respective property management. Bedy provides itemized settlement calculation tools to document damage repairs, unpaid utility dues, and notice-period adjustments. The final refund transfer is disbursed according to the property tenancy agreement.
            </p>
          </section>

          <section className="pt-6 space-y-2">
            <h2 className="text-base font-bold text-slate-900">4. Contacting Billing Support</h2>
            <p>
              For any refund inquiries or billing disputes, please contact us at{" "}
              <a href="mailto:support@bedy.in" className="text-emerald-700 font-semibold underline">
                support@bedy.in
              </a>
              . Our billing team reviews and responds to all requests within 1-2 business days.
            </p>
          </section>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
            <span>Transparent terms with zero hidden penalties.</span>
          </div>
          <Link href="/contact" className="text-emerald-700 font-semibold hover:underline">
            Contact Support →
          </Link>
        </div>
      </div>
    </div>
  );
}
