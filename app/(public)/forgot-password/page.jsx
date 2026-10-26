import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata = { title: "Reset password — Bedy" };

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md mx-auto py-12 px-4 sm:px-6 animate-rise">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Reset your password</h1>
          <p className="mt-1.5 text-xs text-slate-500">
            Enter the email you sign in with and we will send a link to choose a new password.
          </p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  );
}
