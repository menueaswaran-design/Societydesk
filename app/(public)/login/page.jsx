import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSessionOrNull } from "@/lib/auth/server";
import { homeForRole } from "@/lib/routing";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }) {
  const user = await getServerSessionOrNull();
  if (user) redirect(homeForRole(user.role));

  const params = await searchParams;

  return (
    <div className="animate-rise">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-2 text-[15px] text-slate-500">
          Sign in to manage billing, complaints and notices for your society.
        </p>
      </div>

      <LoginForm next={typeof params?.next === "string" ? params.next : null} />

      <p className="mt-6 text-center text-[13px] text-slate-500">
        Trouble signing in?{" "}
        <Link
          href="/forgot-password"
          className="rounded font-semibold text-brand-700 transition-colors hover:text-brand-800"
        >
          Reset your password
        </Link>
      </p>
    </div>
  );
}
