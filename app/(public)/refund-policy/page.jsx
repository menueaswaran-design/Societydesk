import Link from "next/link";

export const metadata = {
  title: "Refund and Cancellation Policy — Bedy",
  description:
    "Official refund, cancellation, and security deposit settlement terms for Bedy subscriptions and managed properties.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs font-semibold text-emerald-400 hover:underline">
          ← Back to Bedy Home
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold text-white">Refund & Cancellation Policy</h1>
        <p className="mt-2 text-xs text-slate-400">Last updated: October 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="text-base font-bold text-white">1. Software Subscription Refunds</h2>
            <p className="mt-1.5">
              Bedy offers a 14-day risk-free trial on all PG & Hostel management software plans. If you are not satisfied with the platform during your initial 14-day period, you may request a full refund of your subscription fee with no questions asked.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">2. Subscription Cancellations</h2>
            <p className="mt-1.5">
              Property owners can cancel recurring subscriptions at any time from their account settings. Upon cancellation, your access remains active until the end of your prepaid billing cycle. No further charges will occur.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">3. Resident Security Deposit Refunds</h2>
            <p className="mt-1.5">
              Security deposits paid by PG/hostel residents are held by the respective property management. Bedy provides itemized settlement calculation tools to document damage repairs, unpaid utility dues, and notice-period adjustments. The final refund transfer is disbursed according to the property tenancy agreement.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">4. Contacting Support</h2>
            <p className="mt-1.5">
              For any refund inquiries or billing disputes, please contact us at{" "}
              <a href="mailto:support@bedy.in" className="text-emerald-400 underline">
                support@bedy.in
              </a>
              . Our billing team reviews and responds to all requests within 1-2 business days.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
