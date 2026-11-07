import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSessionOrNull } from "@/lib/auth/server";
import { homeForRole } from "@/lib/routing";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign In | Bedy",
  description: "Sign in to your Bedy owner, manager, or resident portal.",
  alternates: {
    canonical: "/login",
  },
};

export default async function LoginPage({ searchParams }) {
  const user = await getServerSessionOrNull();
  if (user) redirect(homeForRole(user.role));

  const params = await searchParams;

  return (
    <section className="relative isolate flex flex-1 flex-col justify-between overflow-hidden bg-[radial-gradient(ellipse_at_top,rgba(49,84,217,0.06),transparent_55%),linear-gradient(180deg,#F8FAFF_0%,#FFFFFF_100%)] px-4 py-4 sm:px-6">
      {/* Subtle ambient lighting */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-96 -translate-x-1/2 rounded-full bg-brand-100/40 blur-3xl" />

      {/* Perfectly Centered Auth Card */}
      <div className="my-auto w-full max-w-[420px] mx-auto py-2">
        <LoginForm
          next={typeof params?.next === "string" ? params.next : null}
          initialEmail={typeof params?.email === "string" ? params.email.trim() : ""}
        />
      </div>

      {/* Clean minimal auth footer - guarantees zero vertical scroll */}
      <div className="py-2 text-center text-[11px] text-neutral-400 flex items-center justify-center gap-3">
        <span>© {new Date().getFullYear()} Bedy Technologies</span>
        <span>·</span>
        <Link href="/privacy" className="hover:text-brand-600 hover:underline">
          Privacy
        </Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-brand-600 hover:underline">
          Terms
        </Link>
        <span>·</span>
        <Link href="/contact" className="hover:text-brand-600 hover:underline">
          Support
        </Link>
      </div>
    </section>
  );
}
