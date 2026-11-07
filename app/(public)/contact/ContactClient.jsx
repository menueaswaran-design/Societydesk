"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Clock, MessageCircle, Send, CheckCircle2, Headphones } from "lucide-react";

export default function ContactClient() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", property: "", message: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="w-full max-w-xl mx-auto py-12 sm:py-16 px-4 sm:px-6 space-y-8">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-bold text-brand-700 mb-3">
          <MessageCircle className="size-3.5 text-brand-600" />
          Support & Inquiries
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-950">
          Get in touch with Bedy
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
          Have questions about managing your PG or hostel with Bedy? Our team is here to assist you with onboarding, custom setups, or billing inquiries.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* General Contact Email */}
        <div className="rounded-2xl border border-[#E5EAF3] p-4 bg-white space-y-2 shadow-2xs">
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Mail className="size-4.5" />
          </div>
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Contact & Inquiries</h3>
          <a
            href="mailto:contact@quadrid.in"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline block break-all"
          >
            contact@quadrid.in
          </a>
          <p className="text-[11px] text-neutral-500">Sales, product demos & general queries</p>
        </div>

        {/* Customer Support Email */}
        <div className="rounded-2xl border border-[#E5EAF3] p-4 bg-white space-y-2 shadow-2xs">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Headphones className="size-4.5" />
          </div>
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Customer Support</h3>
          <a
            href="mailto:support@quadrid.in"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline block break-all"
          >
            support@quadrid.in
          </a>
          <p className="text-[11px] text-neutral-500">Dedicated helpdesk for active operators</p>
        </div>
      </div>

      {/* Support Hours Banner */}
      <div className="rounded-xl border border-[#E5EAF3] px-4 py-3 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-800">
          <Clock className="size-4 text-brand-600 shrink-0" />
          <span>Support Hours: Mon – Sat, 9:00 AM – 7:00 PM IST</span>
        </div>
        <span className="text-[11px] text-neutral-400">Bangalore & Chennai Desks</span>
      </div>

      <div className="rounded-2xl border border-[#E5EAF3] p-6 sm:p-7 bg-white shadow-sm space-y-4">
        <h2 className="text-base font-bold text-neutral-900">Send us a direct message</h2>

        {submitted ? (
          <div className="rounded-xl border border-success-200 bg-success-50 p-4 text-center space-y-2 text-xs text-success-900">
            <CheckCircle2 className="size-8 text-success-600 mx-auto" />
            <h3 className="font-bold text-sm">Message received!</h3>
            <p className="text-neutral-600">
              Thank you for reaching out. Our property onboarding team will contact you shortly via email or phone.
            </p>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">Your Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Rajesh Kumar"
                className="w-full rounded-xl border border-[#D2D9E6] px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-brand-600 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">Email or Phone</label>
              <input
                type="text"
                required
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="e.g. rajesh@gmail.com or +91 98765-43210"
                className="w-full rounded-xl border border-[#D2D9E6] px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-brand-600 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">Property Name / Beds</label>
              <input
                type="text"
                value={form.property}
                onChange={(e) => setForm({ ...form, property: e.target.value })}
                placeholder="e.g. Sri Lakshmi PG (48 beds)"
                className="w-full rounded-xl border border-[#D2D9E6] px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-brand-600 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">Message</label>
              <textarea
                rows={3}
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="How can our team help you?"
                className="w-full rounded-xl border border-[#D2D9E6] px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-brand-600 bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-xs font-bold text-white shadow-xs hover:bg-brand-700 active:scale-98 transition-all cursor-pointer"
            >
              <Send className="size-3.5" />
              <span>Submit Message</span>
            </button>
          </form>
        )}
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
        >
          ← Return to Bedy Home
        </Link>
      </div>
    </div>
  );
}
