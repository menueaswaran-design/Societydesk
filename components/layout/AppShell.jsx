"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  SlidersHorizontal,
  FileText,
  CreditCard,
  AlertTriangle,
  Megaphone,
  Receipt,
  ShieldCheck,
  UserCircle,
  LogOut,
  Building,
  Menu,
  X,
  ChevronDown,
  BedSingle,
  DoorOpen,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/client/api";
import { titleCase } from "@/lib/format";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import PushNotificationPrompt from "@/components/notifications/PushNotificationPrompt";
import NotificationBellToggle from "@/components/notifications/NotificationBellToggle";

const NAV = {
  OWNER: [
    {
      label: "Overview",
      items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      label: "Rooms & Beds",
      items: [
        { href: "/admin/rooms", label: "Rooms & Beds", icon: BedSingle },
        { href: "/admin/residents", label: "Occupants & Check-in", icon: Users },
        { href: "/admin/deposits", label: "Security Deposits", icon: Receipt },
      ],
    },
    {
      label: "Rent & Billing",
      items: [
        { href: "/admin/billing/invoices", label: "Rent Invoices", icon: FileText },
        { href: "/admin/billing/payments", label: "Payments", icon: CreditCard },
        { href: "/admin/billing/defaulters", label: "Defaulters", icon: AlertTriangle },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: "/admin/complaints", label: "Complaints", icon: AlertTriangle },
        { href: "/admin/notices", label: "Notices", icon: Megaphone },
      ],
    },
    {
      label: "Analytics & Logs",
      items: [
        { href: "/admin/reports", label: "Occupancy & Revenue", icon: TrendingUp },
        { href: "/admin/activity", label: "Activity Log", icon: ShieldCheck },
      ],
    },
  ],
  MANAGER: [
    {
      label: "Overview",
      items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      label: "Rooms & Beds",
      items: [
        { href: "/admin/rooms", label: "Rooms & Beds", icon: BedSingle },
        { href: "/admin/residents", label: "Occupants & Check-in", icon: Users },
        { href: "/admin/deposits", label: "Security Deposits", icon: Receipt },
      ],
    },
    {
      label: "Rent & Billing",
      items: [
        { href: "/admin/billing/invoices", label: "Rent Invoices", icon: FileText },
        { href: "/admin/billing/payments", label: "Payments", icon: CreditCard },
        { href: "/admin/billing/defaulters", label: "Defaulters", icon: AlertTriangle },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: "/admin/complaints", label: "Complaints", icon: AlertTriangle },
        { href: "/admin/notices", label: "Notices", icon: Megaphone },
      ],
    },
  ],
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
        { href: "/admin/team", label: "Flat admins", icon: ShieldCheck },
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
  SECURITY_ADMIN: [
    {
      label: "Security",
      items: [{ href: "/admin/complaints", label: "Complaints", icon: AlertTriangle }],
    },
  ],
  FLAT_ADMIN: [
    {
      label: "My flat",
      items: [
        { href: "/admin/residents", label: "Residents", icon: Users },
        { href: "/admin/billing/payments", label: "Flat Payments", icon: CreditCard },
      ],
    },
    {
      label: "Community",
      items: [
        { href: "/admin/complaints", label: "Complaints", icon: AlertTriangle },
        { href: "/admin/notices", label: "Notices", icon: Megaphone },
      ],
    },
  ],
  RESIDENT: [
    {
      label: "Overview",
      items: [{ href: "/resident/dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      label: "Rent & Dues",
      items: [
        { href: "/resident/invoices", label: "My Invoices & Receipts", icon: CreditCard },
        { href: "/resident/complaints", label: "Complaints", icon: AlertTriangle },
        { href: "/resident/notices", label: "Notices", icon: Megaphone },
        { href: "/resident/vacate", label: "Vacate / Notice Period", icon: DoorOpen },
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
        { href: "/super-admin/societies", label: "Properties & PGs", icon: Building },
        { href: "/super-admin/team", label: "Owners & Admins", icon: ShieldCheck },
      ],
    },
  ],
};

const ROLE_TONE = {
  SUPER_ADMIN: "violet",
  OWNER: "brand",
  MANAGER: "blue",
  SOCIETY_ADMIN: "brand",
  SECURITY_ADMIN: "amber",
  FLAT_ADMIN: "blue",
  RESIDENT: "emerald",
};

export default function AppShell({ user, society, flats, occupancies, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { t } = useTranslation();

  const isPgWorkspace = society?.type !== "SOCIETY"; // PG is primary!

  let groups = NAV[user.role];
  if (!groups) {
    groups = isPgWorkspace ? NAV.OWNER : NAV.SOCIETY_ADMIN;
  } else if (user.role === "SOCIETY_ADMIN" && isPgWorkspace) {
    groups = NAV.OWNER;
  }

  const roomLabel = occupancies?.length
    ? occupancies.map((o) => `Room ${o.unit?.unitNumber || "-"}${o.bed ? ` (${o.bed.bedLabel})` : ""}`).join(", ")
    : flats?.length
      ? flats.map((f) => (f.block ? `${f.block}-${f.flatNumber}` : f.flatNumber)).join(", ")
      : null;

  useEffect(() => {
    setDrawer(false);
    setMenu(false);
    setIsNavigating(false);
  }, [pathname]);

  async function signOut() {
    try {
      const { getFirebaseClient, signOut: firebaseSignOut } = await import("@/lib/firebase/client");
      const auth = getFirebaseClient();
      if (auth?.currentUser) await firebaseSignOut(auth);
    } catch {
      /* ignore */
    }

    try {
      await api.post("/api/auth/logout");
    } catch {
      /* ignore */
    }

    router.push("/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-white/40 uppercase">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  label={item.label}
                  pathname={pathname}
                  onNavigate={() => setIsNavigating(true)}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const identity = (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="relative inline-flex">
        <img
          src="/logo.png"
          alt="Bedy"
          className="size-8.5 rounded-lg object-contain bg-white p-0.5 shadow-sm"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {society?.name ?? (user.role === "SUPER_ADMIN" ? "Bedy Platform" : isPgWorkspace ? "Bedy PG" : "Bedy")}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="rounded bg-white/10 px-1.5 py-0.2 text-[9.5px] font-semibold text-white/80">
            {user.role === "SUPER_ADMIN" ? "SUPER ADMIN" : isPgWorkspace ? "PG / HOSTEL" : "SOCIETY"}
          </span>
          <p className="truncate text-[11px] text-white/50">
            {titleCase(user.role)}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {isNavigating ? (
        <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-brand-500/10">
          <div className="h-full w-full bg-linear-to-r from-brand-500 via-indigo-600 to-sky-400 animate-progress" />
        </div>
      ) : null}

      {/* Sidebar */}
      <aside className="brand-canvas sticky top-0 hidden h-screen w-64 shrink-0 flex-col lg:flex">
        <div className="border-b border-white/10">{identity}</div>
        {nav}
        <UserPanel user={user} roomLabel={roomLabel} onSignOut={signOut} />
      </aside>

      {/* Mobile drawer */}
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
            <UserPanel user={user} roomLabel={roomLabel} onSignOut={signOut} />
          </div>
        </div>
      ) : null}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-2xs">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              className="-ml-1 inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-900/5 hover:text-slate-900 lg:hidden"
            >
              <Menu className="size-4.5" />
            </button>

            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <img
                src="/logo.png"
                alt="Bedy"
                className="size-7.5 rounded-md object-contain bg-white p-0.5"
              />
              <span className="truncate text-xs font-semibold text-slate-800">
                {society?.name ?? "Bedy"}
              </span>
            </div>

            <div className="hidden min-w-0 items-center gap-2 lg:flex">
              <Building className="size-4 shrink-0 text-primary-500" />
              <p className="truncate text-xs text-slate-500">
                {society ? (
                  <>
                    <span className="font-semibold text-slate-700">{society.name}</span>
                    {roomLabel ? ` · ${roomLabel}` : ""}
                  </>
                ) : (
                  "Platform console"
                )}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <LanguageSwitcher />
              <NotificationBellToggle user={user} compact />
              <Badge tone={ROLE_TONE[user.role] ?? "slate"} className="hidden sm:inline-flex text-[11px] py-0.5 px-2">
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
                  <span className="hidden max-w-32 truncate text-xs font-semibold text-slate-700 sm:block">
                    {user.name}
                  </span>
                  <ChevronDown
                    className={`size-3.5 text-slate-400 transition-transform duration-200 ${menu ? "rotate-180" : ""}`}
                  />
                </button>

                {menu ? (
                  <UserMenu
                    user={user}
                    roomLabel={roomLabel}
                    onSignOut={signOut}
                    onClose={() => setMenu(false)}
                    t={t}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          <div className="mx-auto w-full max-w-[90rem]">{children}</div>
        </main>
      </div>

      {/* Push Notification Permission Card for Logged-in Users */}
      <PushNotificationPrompt user={user} />
    </div>
  );
}

function NavLink({ item, label, pathname, onNavigate }) {
  const Icon = item.icon;
  const active = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(`${item.href}/`));

  return (
    <Link
      href={item.href}
      prefetch={true}
      onClick={() => {
        if (pathname !== item.href && !pathname.startsWith(`${item.href}/`)) {
          onNavigate?.();
        }
      }}
      className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 ${
        active
          ? "bg-white/10 text-white font-semibold shadow-2xs"
          : "text-white/70 hover:bg-white/5 hover:text-white"
      }`}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute top-1/2 -left-2.5 h-5 w-1 -translate-y-1/2 rounded-r-full bg-emerald-400"
        />
      ) : null}
      <Icon
        className={`size-4.5 shrink-0 transition-colors ${active ? "text-emerald-400" : "text-white/45 group-hover:text-white/80"}`}
      />
      {label ?? item.label}
    </Link>
  );
}

function UserPanel({ user, roomLabel, onSignOut }) {
  const { t } = useTranslation();
  return (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-2.5 rounded-lg bg-white/5 px-2.5 py-2 ring-1 ring-white/8">
        <Avatar name={user.name} size="sm" ring />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">{user.name}</p>
          <p className="truncate text-[11px] text-white/45">{titleCase(user.role)}</p>
        </div>
        <button
          onClick={onSignOut}
          aria-label={t("common.signOut", "Sign out")}
          title={t("common.signOut", "Sign out")}
          className="inline-flex size-7.5 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
      {roomLabel ? <p className="mt-2 truncate px-2.5 text-[11px] text-white/35">{roomLabel}</p> : null}
    </div>
  );
}

function UserMenu({ user, roomLabel, onSignOut, onClose, t: tProp }) {
  const { t: tContext } = useTranslation();
  const t = tProp || tContext;
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

  return (
    <div
      ref={ref}
      role="menu"
      className="animate-pop absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl bg-white shadow-pop border border-slate-200/80"
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
        {roomLabel ? (
          <div className="flex items-center justify-between gap-3 py-1">
            <dt className="text-slate-500">Assignment</dt>
            <dd className="font-semibold text-slate-800 truncate max-w-32">{roomLabel}</dd>
          </div>
        ) : null}
      </dl>

      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 text-xs">
        <span className="font-medium text-slate-600">{t("common.language", "Language")}</span>
        <LanguageSwitcher />
      </div>

      <div className="p-2">
        <button
          role="menuitem"
          onClick={onSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
        >
          <LogOut className="size-4" />
          {t("common.signOut", "Sign out")}
        </button>
      </div>
    </div>
  );
}
