import { redirect } from "next/navigation";
import { getServerSessionOrNull } from "@/lib/auth/server";
import { homeForRole } from "@/lib/routing";
import LoginForm from "./LoginForm";
import { LoginHeader, LoginFooter } from "./LoginHeader";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }) {
  const user = await getServerSessionOrNull();
  if (user) redirect(homeForRole(user.role));

  const params = await searchParams;

  return (
    <div className="animate-rise">
      <LoginHeader />
      <LoginForm next={typeof params?.next === "string" ? params.next : null} />
      <LoginFooter />
    </div>
  );
}
