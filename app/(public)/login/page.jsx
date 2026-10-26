import { redirect } from "next/navigation";
import { getServerSessionOrNull } from "@/lib/auth/server";
import { homeForRole } from "@/lib/routing";
import LoginForm from "./LoginForm";
import { LoginHeader, LoginFooter } from "./LoginHeader";

export const metadata = { title: "Sign in — Bedy" };

export default async function LoginPage({ searchParams }) {
  const user = await getServerSessionOrNull();
  if (user) redirect(homeForRole(user.role));

  const params = await searchParams;

  return (
    <div className="w-full max-w-md mx-auto py-12 px-4 sm:px-6 animate-rise">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <LoginHeader />
        <LoginForm next={typeof params?.next === "string" ? params.next : null} />
        <LoginFooter />
      </div>
    </div>
  );
}
