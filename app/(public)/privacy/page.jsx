import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Bedy",
  description: "Learn how Bedy collects, secures, and handles tenant and property management data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs font-semibold text-emerald-400 hover:underline">
          ← Back to Bedy Home
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold text-white">Privacy Policy</h1>
        <p className="mt-2 text-xs text-slate-400">Last updated: October 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-300">
          <section>
            <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
            <p className="mt-1.5">
              We collect information provided directly by users during registration and property management operations, including contact information (name, email, phone number), property occupancy details, rent invoices, and tenant verification documents when submitted.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">2. How We Use Information</h2>
            <p className="mt-1.5">
              Information is used exclusively to deliver property management functionality, generate rent reminders, issue official payment receipts, provide notifications, and maintain platform security.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">3. Data Sharing & Third Parties</h2>
            <p className="mt-1.5">
              We do not sell, rent, or trade your personal or business information to third-party advertisers. Data is shared only with verified cloud infrastructure providers (such as Supabase, Cloudinary) necessary to operate the platform securely.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-white">4. Your Rights</h2>
            <p className="mt-1.5">
              Users may request access to, correction of, or deletion of their personal data by contacting us at{" "}
              <a href="mailto:support@bedy.in" className="text-emerald-400 underline">
                support@bedy.in
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

