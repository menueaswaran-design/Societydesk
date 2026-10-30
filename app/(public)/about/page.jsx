import Link from "next/link";
import { ArrowLeft, CheckCircle2, Shield, Sparkles, Building2, Users } from "lucide-react";

export const metadata = {
  title: "About Us | Bedy – Modern PG & Hostel Management Software",
  description:
    "Learn about Bedy's mission to digitize PG and hostel operations across India with automated rent collection, bed management, and low-friction resident living.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-12">
        {/* Navigation back */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors mb-4"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Home</span>
          </Link>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-brand-600 mb-2">
            About Bedy Technologies
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-950 leading-tight">
            Transforming PG & Hostel Living Across India
          </h1>
          <p className="mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl">
            Bedy is a modern, light-first operations platform designed specifically for paying guest (PG) owners, hostel managers, and coliving operators.
          </p>
        </div>

        {/* Mission Statement Callout */}
        <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2 text-brand-700 font-bold text-sm">
            <Sparkles className="size-4.5" />
            <span>Our Mission</span>
          </div>
          <p className="text-base font-semibold text-brand-950 leading-relaxed">
            Eliminate manual registers, uncomfortable payment chases, and room booking guesswork. We build intuitive, friction-free software that helps property managers collect 100% of their rent on time while giving residents a transparent, dignified living experience.
          </p>
        </div>

        {/* Why Bedy Matters */}
        <div className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-900">
            Why Property Managers Choose Bedy
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
                <CheckCircle2 className="size-4 text-success-600" />
                <span>Zero Commission Payouts</span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Rent is collected directly into your bank account or UPI VPA. Bedy does not deduct intermediate gateway cuts or hold your hard-earned funds.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
                <Building2 className="size-4 text-brand-600" />
                <span>Live Bed Matrix & Availability</span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Visual floor-by-floor color-coded grids clearly show which beds are vacant, occupied, or vacating soon, preventing double-bookings.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
                <Users className="size-4 text-info-600" />
                <span>Instant WhatsApp Reminders</span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Send professional, pre-composed rent reminders directly via WhatsApp with the exact outstanding amount and one-tap UPI pay links.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
                <Shield className="size-4 text-amber-600" />
                <span>Clean Notice & Deposit Settlement</span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Track move-out notices with countdowns, calculate utility and damage deductions automatically, and refund deposits with full audit receipts.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Strip */}
        <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Ready to simplify your property?</h3>
            <p className="text-xs text-neutral-500">Get started today or schedule a tailored walkthrough for your properties.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-700 transition"
            >
              Contact Our Team
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
            >
              View Pricing Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
