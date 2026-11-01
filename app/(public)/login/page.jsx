import { redirect } from "next/navigation";
import { getServerSessionOrNull } from "@/lib/auth/server";
import { homeForRole } from "@/lib/routing";
import LoginForm from "./LoginForm";
import { LoginHeader, LoginFooter } from "./LoginHeader";

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
    <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden bg-[radial-gradient(ellipse_at_15%_20%,rgba(59,91,219,.09),transparent_38%),linear-gradient(180deg,#F8FAFF_0%,#FFFFFF_72%)] px-4 py-10 sm:px-6 sm:py-14 lg:flex lg:items-center lg:py-16">
      <div className="pointer-events-none absolute -right-28 top-16 -z-10 size-80 rounded-full bg-blue-100/40 blur-3xl" />
      <div className="mx-auto grid w-full max-w-6xl items-start gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(520px,1.2fr)] lg:items-center lg:gap-16">
        <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
            <span className="size-2 rounded-full bg-blue-600" />
            PG &amp; Hostel Operations
          </div>
          <LoginHeader />
          <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-slate-500 lg:mx-0">
            One place for your team to manage residents, rooms, rent, and everyday requests.
          </p>
          <div className="mt-8 hidden grid-cols-3 gap-3 text-left lg:grid">
            {[["01", "Residents", "Keep resident details together"], ["02", "Operations", "Stay on top of daily tasks"], ["03", "Payments", "Track rent and dues clearly"]].map(([n, title, copy]) => (
              <div key={n} className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm">
                <span className="text-[10px] font-bold tracking-widest text-blue-600">{n}</span>
                <h2 className="mt-3 text-sm font-bold text-slate-900">{title}</h2>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">{copy}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto w-full max-w-2xl rounded-[1.75rem] border border-slate-200/90 bg-white p-5 shadow-[0_24px_80px_-36px_rgba(30,55,120,.28)] sm:p-8 lg:p-9">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Choose your portal</h2>
              <p className="mt-1 text-xs text-slate-500">Sign in with your account or explore a demo role.</p>
            </div>
            <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-[10px] font-semibold text-blue-700 sm:inline-flex">Secure access</span>
          </div>
          <LoginForm next={typeof params?.next === "string" ? params.next : null} />
          <LoginFooter />
        </div>
      </div>
    </section>
  );
}
