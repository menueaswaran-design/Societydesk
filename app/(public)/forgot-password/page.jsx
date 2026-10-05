import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <div className="animate-rise">
      <Link
        href="/login"
        className="mb-8 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="size-3.5" />
        Back to sign in
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Reset your password</h1>
        <p className="mt-2 text-[15px] text-slate-500">
          Enter the email you sign in with and we will send a link to choose a new password.
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}
