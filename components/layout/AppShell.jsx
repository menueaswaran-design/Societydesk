"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  SlidersHorizontal,
  FileText,
  CreditCard,
  AlertTriangle,
  Megaphone,
  ShieldCheck,
  UserCircle,
  LogOut,
  Building,
  Menu,
  X,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/client/api";
import { titleCase } from "@/lib/format";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";

const NAV = {
  SOCIETY_ADMIN: [
    {
      label: "Overview",
      items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      label: "Directory",
      items: [
        { href: "/admin/flats", label: "Flats", icon: Building2 },
        { href: "/admin/residents", label: "Residents", icon: Users },
      ],
    },
    {
      label: "Billing",
      items: [
        { href: "/admin/billing/configuration", label: "Fee Setup", icon: SlidersHorizontal },
        { href: "/admin/billing/invoices", label: "Invoices", icon: FileText },
        { href: "/admin/billing/payments", label: "Payments", icon: CreditCard },
        { href: "/admin/billing/defaulters", label: "Defaulters", icon: AlertTriangle },
      ],
    },
    {
      label: "Community",
      items: [
        { href: "/admin/complaints", label: "Complaints", icon: AlertTriangle },
        { href: "/admin/notices", label: "Notices", icon: Megaphone },
      ],
    },
    {
      label: "Governance",
      items: [{ href: "/admin/activity", label: "Activity Log", icon: ShieldCheck }],
    },
  ],
  RESIDENT: [
    {
      label: "Overview",
      items: [{ href: "/resident/dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      label: "My account",
      items: [
        { href: "/resident/invoices", label: "Invoices", icon: FileText },
        { href: "/resident/payments", label: "Payments", icon: CreditCard },
        { href: "/resident/complaints", label: "Complaints", icon: AlertTriangle },
        { href: "/resident/notices", label: "Notices", icon: Megaphone },
      ],
    },
    {
      label: "Settings",
      items: [{ href: "/resident/profile", label: "Profile", icon: UserCircle }],
    },
  ],
  SUPER_ADMIN: [
    {
      label: "Platform",
      items: [
        { href: "/super-admin/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/super-admin/societies", label: "Societies", icon: Building },
      ],
    },
  ],
};

const ROLE_TONE = {
  SUPER_ADMIN: "violet",
  SOCIETY_ADMIN: "brand",
  RESIDENT: "blue",
};

export default function AppShell({ user, society, flats, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);

  const groups = NAV[user.role] ?? NAV.SOCIETY_ADMIN;
  const flatLabel = flats?.length
    ? flats.map((f) => (f.block ? `${f.block}-${f.flatNumber}` : f.flatNumber)).join(", ")
    : null;

  // Close the drawer whenever navigation happens.
  useEffect(() => {
    setDrawer(false);
    setMenu(false);
  }, [pathname]);

  // Firebase and the dev cookie are two independent sessions, so clear both.
  // /api/auth/dev-login only 403s outside the dev bypass, which is why logout
  // has its own endpoint.
  async function signOut() {
    try {
      const { getFirebaseClient, signOut: firebaseSignOut } = await import("@/lib/firebase/client");
      const auth = getFirebaseClient();
      if (auth?.currentUser) await firebaseSignOut(auth);
    } catch {
      /* Firebase not configured or already signed out - fall through */
    }

    try {
      await api.post("/api/auth/logout");
    } catch {
      /* the endpoint is best-effort; still send them to login */
    }

    router.push("/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.08em] text-white/40 uppercase">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <NavLink item={item} pathname={pathname} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const identity = (
    <div className="flex items-center gap-3 px-4 py-4">
      <span className="relative inline-flex">
        <span className="relative inline-flex size-9 items-center justify-center rounded-lg bg-white text-xs font-bold tracking-tight text-primary-900">
          SD
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {society?.name ?? "SocietyDesk"}
        </p>
        <p className="truncate text-[11px] text-white/45">
          {society?.code ? `${society.code} · ` : ""}
          {titleCase(user.role)}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* ------------------------------------------------------------ sidebar */}
      <aside className="brand-canvas sticky top-0 hidden h-screen w-64 shrink-0 flex-col lg:flex xl:w-64">
        <div className="border-b border-white/10">{identity}</div>
        {nav}
        <UserPanel user={user} flats={flatLabel} onSignOut={signOut} />
      </aside>

      {/* -------------------------------------------------------- mobile drawer */}
      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setDrawer(false)}
            className="animate-fade-in absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <div className="animate-slide-left brand-canvas relative z-10 flex h-full w-64 max-w-[85vw] flex-col shadow-pop">
            <div className="flex items-center justify-between border-b border-white/10 pr-2">
              <div className="min-w-0 flex-1">{identity}</div>
              <button
                onClick={() => setDrawer(false)}
                aria-label="Close menu"
                className="inline-flex size-9 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            {nav}
            <UserPanel user={user} flats={flatLabel} onSignOut={signOut} />
          </div>
        </div>
      ) : null}

      {/* --------------------------------------------------------------- main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              className="-ml-1 inline-flex size-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-900/5 hover:text-slate-900 lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary-800 text-[11px] font-bold text-white">
                SD
              </span>
              <span className="truncate text-sm font-semibold text-slate-800">
                {society?.name ?? "SocietyDesk"}
              </span>
            </div>

            <div className="hidden min-w-0 items-center gap-2 lg:flex">
              <Building className="size-4 shrink-0 text-primary-500" />
              <p className="truncate text-sm text-slate-500">
                {society ? (
                  <>
                    <span className="font-semibold text-slate-700">{society.name}</span>
                    {flatLabel ? ` · ${flatLabel}` : ""}
                  </>
                ) : (
                  "Platform console"
                )}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Badge tone={ROLE_TONE[user.role] ?? "slate"} className="hidden sm:inline-flex">
                {titleCase(user.role)}
              </Badge>

              <div className="relative">
                <button
                  onClick={() => setMenu((v) => !v)}
                  aria-expanded={menu}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-lg py-1 pr-2 pl-1 transition-colors hover:bg-slate-900/5 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                >
                  <Avatar name={user.name} size="sm" />
                  <span className="hidden max-w-32 truncate text-sm font-semibold text-slate-700 sm:block">
                    {user.name}
                  </span>
                  <ChevronDown
                    className={`size-4 text-slate-400 transition-transform duration-200 ${menu ? "rotate-180" : ""}`}
                  />
                </button>

                {menu ? (
                  <UserMenu
                    user={user}
                    flats={flatLabel}
                    onSignOut={signOut}
                    onClose={() => setMenu(false)}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-[140rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function NavLink({ item, pathname }) {
  const Icon = item.icon;
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
                className={`group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute top-1/2 -left-3 h-6 w-1 -translate-y-1/2 rounded-r-full bg-linear-to-b from-brand-300 to-accent-400"
        />
      ) : null}
      <Icon
        className={`size-4.5 shrink-0 transition-colors ${active ? "text-brand-200" : "text-white/45 group-hover:text-white/80"}`}
      />
      {item.label}
    </Link>
  );
}

// ---------------------------------------------------------------------------

function UserPanel({ user, flats, onSignOut }) {
  return (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5 ring-1 ring-white/8">
        <Avatar name={user.name} size="sm" ring />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-white">{user.name}</p>
          <p className="truncate text-[11px] text-white/45">{titleCase(user.role)}</p>
        </div>
        <button
          onClick={onSignOut}
          aria-label="Sign out"
          title="Sign out"
          className="inline-flex size-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
        >
          <LogOut className="size-4" />
        </button>
      </div>
      {flats ? <p className="mt-2 truncate px-3 text-[11px] text-white/35">{flats}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

function UserMenu({ user, flats, onSignOut, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function onPointer(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const content = (
    <div
      ref={ref}
      role="menu"
      className="animate-pop absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg bg-white shadow-pop ring-1 ring-slate-900/5"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
        <Avatar name={user.name} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>
      </div>

      <dl className="border-b border-slate-100 px-4 py-3 text-xs">
        <div className="flex items-center justify-between gap-3 py-1">
          <dt className="text-slate-500">Role</dt>
          <dd className="font-semibold text-slate-800">{titleCase(user.role)}</dd>
        </div>
        {flats ? (
          <div className="flex items-center justify-between gap-3 py-1">
            <dt className="text-slate-500">Flat</dt>
            <dd className="font-semibold text-slate-800">{flats}</dd>
          </div>
        ) : null}
      </dl>

      <div className="p-2">
        <button
          role="menuitem"
          onClick={onSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return typeof document === "undefined" ? content : createPortal(content, document.body);
}
