"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";

export default function PublicFooter() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/forgot-password";

  // Hide the marketing footer on auth pages so the card fits within 100vh with zero unwanted scroll
  if (isAuthPage) {
    return null;
  }

  return (
    <footer className="border-t border-[#E5EAF3] bg-white py-10 text-xs text-neutral-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Bedy" className="size-7 object-contain rounded-lg" />
            <span className="font-bold text-neutral-900 text-sm">Bedy</span>
            <span>·</span>
            <span>Smart PG, Hostel & Co-Living Operations</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-5 gap-y-2 font-medium text-neutral-600">
            <Link href="/features" className="hover:text-brand-600 transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-brand-600 transition-colors">
              Pricing
            </Link>
            <Link href="/services" className="hover:text-brand-600 transition-colors">
              Services
            </Link>
            <Link href="/about" className="hover:text-brand-600 transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-brand-600 transition-colors">
              Contact
            </Link>
            <Link href="/refund-policy" className="hover:text-brand-600 transition-colors">
              Refund Policy
            </Link>
            <Link href="/terms" className="hover:text-brand-600 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-brand-600 transition-colors">
              Privacy
            </Link>
            <Link href="/login" className="hover:text-brand-700 transition-colors font-bold text-brand-600">
              Sign In
            </Link>
          </div>
        </div>

        <div className="border-t border-[#E5EAF3] pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-400">
          <span>© {new Date().getFullYear()} Bedy Technologies. All rights reserved.</span>
          <span className="inline-flex items-center gap-1">
            Made with <Heart className="size-3 text-rose-500 fill-rose-500 shrink-0" /> for PG & Hostel Operators in India
          </span>
        </div>
      </div>
    </footer>
  );
}

