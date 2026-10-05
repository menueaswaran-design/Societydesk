"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck, Mail, Send } from "lucide-react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ui/Feedback";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState({ status: "idle", error: null });

  async function submit(e) {
    e.preventDefault();
    setState({ status: "working", error: null });

    try {
      const { getFirebaseClient, sendPasswordResetEmail } = await import("@/lib/firebase/client");
      const auth = getFirebaseClient();
      if (!auth) throw new Error("Password reset needs Firebase to be configured");

      await sendPasswordResetEmail(auth, email);
      setState({ status: "sent", error: null });
    } catch (err) {
      setState({
        status: "idle",
        error:
          err?.code?.includes("invalid-email")
            ? "Enter a valid email address"
            : (err?.message ?? "Could not send the reset email"),
      });
    }
  }

  if (state.status === "sent") {
    return (
      <div className="surface p-6 text-center">
        <span className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <MailCheck className="size-5" />
        </span>
        <p className="text-[15px] text-slate-700">
          If an account exists for <span className="font-semibold text-slate-900">{email}</span>, a
          reset link is on its way.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
        >
          <Send className="size-3.5" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="surface p-6">
      <ErrorBanner error={state.error} />

      <div className="mt-1 flex flex-col gap-4">
        <Input
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          prefix={<Mail />}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" size="lg" loading={state.status === "working"} className="w-full">
          Send reset link
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        The link expires after a while. Request a new one if it no longer works.
      </p>
    </form>
  );
}
