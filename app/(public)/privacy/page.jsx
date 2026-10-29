import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Bedy",
  description:
    "Learn how Bedy securely handles, protects, and encrypts your property and resident data.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors mb-4"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-neutral-500">Last updated: October 2026 · Committed to your data privacy</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-neutral-600 divide-y divide-neutral-100">
          <section className="pt-2 space-y-2">
            <h2 className="text-base font-bold text-neutral-900">1. Information We Collect</h2>
            <p>
              We collect information provided directly by users during registration and property management operations, including contact information (name, email, phone number), property occupancy details, rent invoices, and tenant verification documents when submitted.
            </p>
          </section>

          <section className="pt-6 space-y-2">
            <h2 className="text-base font-bold text-neutral-900">2. How We Use Information</h2>
            <p>
              Information is used exclusively to deliver property management functionality, generate rent reminders, issue official payment receipts, provide notifications, and maintain platform security.
            </p>
          </section>

          <section className="pt-6 space-y-2">
            <h2 className="text-base font-bold text-neutral-900">3. Data Sharing & Third Parties</h2>
            <p>
              We do not sell, rent, or trade your personal or business information to third-party advertisers. Data is shared only with verified cloud infrastructure providers necessary to operate the platform securely.
            </p>
          </section>

          <section className="pt-6 space-y-2">
            <h2 className="text-base font-bold text-neutral-900">4. Your Rights</h2>
            <p>
              Users may request access to, correction of, or deletion of their personal data by contacting us at{" "}
              <a href="mailto:support@bedy.in" className="text-brand-600 font-semibold underline hover:text-brand-700">
                support@bedy.in
              </a>
              .
            </p>
          </section>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5 flex items-center justify-between text-xs text-neutral-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-brand-600 shrink-0" />
            <span>Your property and resident data is always private and never monetized.</span>
          </div>
          <Link href="/terms" className="text-brand-600 font-semibold hover:underline">
            Terms of Service →
          </Link>
        </div>
      </div>
    </div>
  );
}
