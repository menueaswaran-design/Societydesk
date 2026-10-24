import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Bedy",
  description: "Terms and conditions governing the use of Bedy PG & Hostel management software.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs font-semibold text-emerald-400 hover:underline">
          ← Back to Bedy Home
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold text-white">Terms of Service</h1>
        <p className="mt-2 text-xs text-slate-400">Last updated: October 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="text-base font-bold text-white">1. Agreement to Terms</h2>
            <p className="mt-1.5">
              By accessing or using Bedy software, websites, and services, you agree to be bound by these Terms of Service. If you are using the service on behalf of a PG, hostel, or rental property, you represent that you have authority to bind that entity.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">2. User Accounts & Responsibilities</h2>
            <p className="mt-1.5">
              Property managers are responsible for maintaining the accuracy of room allocations, fee schedules, and tenant records. You are responsible for safeguarding your login credentials and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">3. Payment Terms & Processing</h2>
            <p className="mt-1.5">
              Bedy facilitates digital payment recording, automated invoicing, and third-party payment gateway integration. Direct UPI transactions are settled directly between residents and property owners with zero platform deduction.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">4. Data Privacy & Security</h2>
            <p className="mt-1.5">
              All resident data, KYC identification records, and financial transaction histories are encrypted in transit and at rest. We adhere strictly to applicable Indian data protection regulations.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

