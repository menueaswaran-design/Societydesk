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
  UserCheck,
  LogOut,
  Building,
  Menu,
  X,
  ChevronDown,
  ChevronsUpDown,
  Check,
  Loader2,
  BedSingle,
  DoorOpen,
  TrendingUp,
  Plus,
} from "lucide-react";
import { api } from "@/lib/client/api";
import { titleCase } from "@/lib/format";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import { useTranslation } from "@/components/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import PushNotificationPrompt from "@/components/notifications/PushNotificationPrompt";
import NotificationBellToggle from "@/components/notifications/NotificationBellToggle";
import AddPropertyModal from "@/components/properties/AddPropertyModal";

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
        { href: "/admin/billing/defaulters", label: "Overdue", icon: AlertTriangle },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: "/admin/team", label: "PG Managers", icon: UserCheck },
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
        { href: "/admin/billing/defaulters", label: "Overdue", icon: AlertTriangle },
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
        { href: "/admin/billing/defaulters", label: "Overdue", icon: AlertTriangle },
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

export default function AppShell({ user, society, flats, occupancies, accessibleSocieties = [], children }) {
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
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[11px] font-bold tracking-wider text-blue-200 uppercase">
            {group.label}
          </p>
          <ul className="space-y-1">
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
    <Link
      href={
        user.role === "RESIDENT"
          ? "/resident/dashboard"
          : user.role === "SUPER_ADMIN"
            ? "/super-admin/dashboard"
            : "/admin/dashboard"
      }
      className="flex items-center gap-2.5 px-4 py-3 w-full hover:opacity-90 transition-opacity"
    >
      <span className="relative inline-flex shrink-0">
        <img
          src="/logo.png"
          alt="Bedy"
          className="size-8 rounded-xl object-contain bg-white p-0.5 shadow-sm ring-1 ring-white/20"
        />
      </span>
      <span className="text-lg font-black tracking-tight text-white leading-none">
        Bedy
      </span>
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFF]">
      {isNavigating ? (
        <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-brand-500/10 pointer-events-none overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-brand-600 via-brand-500 to-[#6995FF] animate-progress shadow-[0_0_8px_rgba(49,84,217,0.5)]" />
        </div>
      ) : null}

      {/* Sidebar - Royal Cobalt Brand Blue from HTML Design System */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col self-start bg-gradient-to-b from-[#1E398A] to-[#172B68] text-white border-r border-[#1B326E] shadow-sm lg:flex">
        <div className="flex h-14 items-center border-b border-white/10 bg-transparent">{identity}</div>
        {nav}
        <PropertyPanel society={society} isPgWorkspace={isPgWorkspace} user={user} roomLabel={roomLabel} accessibleSocieties={accessibleSocieties} />
      </aside>

      {/* Mobile drawer */}
      {drawer ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setDrawer(false)}
            className="animate-fade-in absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <div className="animate-slide-left relative z-10 flex h-full w-64 max-w-[85vw] flex-col bg-gradient-to-b from-[#1E398A] to-[#172B68] text-white border-r border-[#1B326E] shadow-pop">
            <div className="flex h-14 items-center justify-between border-b border-white/10 pr-2">
              <div className="min-w-0 flex-1">{identity}</div>
              <button
                onClick={() => setDrawer(false)}
                aria-label="Close menu"
                className="inline-flex size-9 items-center justify-center rounded-lg text-blue-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            {nav}
            <PropertyPanel society={society} isPgWorkspace={isPgWorkspace} user={user} roomLabel={roomLabel} accessibleSocieties={accessibleSocieties} />
          </div>
        </div>
      ) : null}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[#E5EAF3] bg-white shadow-2xs">
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

            {accessibleSocieties && accessibleSocieties.length > 1 && (
              <div className="hidden lg:flex items-center">
                <TopHeaderPropertySwitcher
                  society={society}
                  accessibleSocieties={accessibleSocieties}
                />
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              <LanguageSwitcher />
              <NotificationBellToggle user={user} compact />

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
                    society={society}
                    accessibleSocieties={accessibleSocieties}
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

        <main className="min-w-0 flex-1 px-4 pt-4 pb-24 sm:px-6 sm:pt-6 sm:pb-24 lg:px-8 lg:py-7">
          <div className="mx-auto w-full max-w-[90rem]">{children}</div>
        </main>
      </div>

      {/* Push Notification Permission Card for Logged-in Users */}
      <PushNotificationPrompt user={user} />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        user={user}
        isPgWorkspace={isPgWorkspace}
        pathname={pathname}
        onNavigate={() => setIsNavigating(true)}
        t={t}
      />
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
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-150 ${
        active
          ? "bg-white text-brand-700 shadow-md font-bold"
          : "text-white/85 hover:bg-white/10 hover:text-white"
      }`}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white shadow-xs"
        />
      ) : null}
      <Icon
        className={`size-4.5 shrink-0 transition-colors ${active ? "text-brand-600" : "text-blue-200 group-hover:text-white"}`}
      />
      <span className="truncate">{label ?? item.label}</span>
    </Link>
  );
}

function TopHeaderPropertySwitcher({ society, accessibleSocieties = [] }) {
  const [open, setOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  async function handleSwitch(targetId) {
    if (targetId === society?.id || switchingId) return;
    setSwitchingId(targetId);
    try {
      await api.post("/api/auth/switch-society", { societyId: targetId });
      window.location.reload();
    } catch (err) {
      console.error("Failed to switch property:", err);
      setSwitchingId(null);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 px-2.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
        title="Switch active PG property"
      >
        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-brand-600 text-white shadow-2xs">
          <Building className="size-3" />
        </span>
        <span className="text-slate-400 font-medium hidden sm:inline">PG:</span>
        <span className="truncate max-w-[140px] sm:max-w-[200px]">{society?.name || "Select PG"}</span>
        <ChevronsUpDown className="size-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
      </button>

      {open && (
        <div className="animate-pop absolute left-0 mt-1.5 w-64 rounded-2xl bg-white shadow-xl border border-slate-200/90 overflow-hidden z-50 text-slate-800">
          <div className="bg-slate-50/90 px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              Select PG Property
            </span>
            <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded-full ring-1 ring-brand-600/20">
              {accessibleSocieties.length} PGs
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {accessibleSocieties.map((s) => {
              const isActive = s.id === society?.id;
              const isSwitching = switchingId === s.id;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSwitch(s.id)}
                  disabled={Boolean(switchingId) || isActive}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all ${
                    isActive
                      ? "bg-brand-50 text-brand-900 font-bold border border-brand-200 shadow-2xs"
                      : "hover:bg-slate-100/80 text-slate-700 font-medium cursor-pointer"
                  }`}
                >
                  <span
                    className={`flex size-6.5 shrink-0 items-center justify-center rounded-lg ${
                      isActive ? "bg-brand-600 text-white shadow-2xs" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isSwitching ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Building className="size-3" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs tracking-tight">{s.name}</p>
                    <p className="text-[10px] font-normal text-slate-400">{s.code || "PG"}</p>
                  </div>
                  {isActive && (
                    <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-2xs">
                      <Check className="size-3 stroke-[2.5]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PropertyPanel({ society, isPgWorkspace, user, roomLabel, accessibleSocieties = [] }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [addPropertyModalOpen, setAddPropertyModalOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState(null);
  const panelRef = useRef(null);

  const pgName =
    society?.name ||
    (user?.role === "SUPER_ADMIN"
      ? "Bedy Platform"
      : isPgWorkspace
        ? "Sri Lakshmi Luxury PG & Coliving"
        : "Bedy Property");

  const isOwner = user?.role === "OWNER";
  const hasMultiple = Array.isArray(accessibleSocieties) && accessibleSocieties.length > 1;
  const canInteract = hasMultiple || isOwner;

  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  async function handleSwitch(targetSocietyId) {
    if (targetSocietyId === society?.id || switchingId) return;
    setSwitchingId(targetSocietyId);
    try {
      await api.post("/api/auth/switch-society", { societyId: targetSocietyId });
      setDropdownOpen(false);
      window.location.reload();
    } catch (err) {
      console.error("Failed to switch property:", err);
      setSwitchingId(null);
    }
  }

  const listItems = hasMultiple
    ? accessibleSocieties
    : society
    ? [society]
    : [];

  return (
    <div className="relative border-t border-white/10 p-3 bg-transparent" ref={panelRef}>
      {/* Dropdown Popup Menu */}
      {dropdownOpen && canInteract && (
        <div className="animate-pop absolute bottom-full left-3 right-3 mb-2.5 z-50 rounded-2xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden text-slate-800">
          <div className="bg-slate-50/90 px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
                {hasMultiple ? "Switch Property" : "My Properties"}
              </p>
              <p className="text-xs font-semibold text-slate-700">
                {accessibleSocieties.length || 1} PG propert{(accessibleSocieties.length || 1) === 1 ? "y" : "ies"}
              </p>
            </div>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 ring-1 ring-brand-600/20">
              {hasMultiple ? "Multi-PG" : "PG"}
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {listItems.map((s) => {
              const isActive = s.id === society?.id;
              const isSwitching = switchingId === s.id;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSwitch(s.id)}
                  disabled={Boolean(switchingId) || isActive}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all ${
                    isActive
                      ? "bg-brand-50 text-brand-900 font-bold border border-brand-200/80 shadow-2xs"
                      : "hover:bg-slate-100/80 text-slate-700 font-medium cursor-pointer"
                  }`}
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
                      isActive ? "bg-brand-600 text-white shadow-sm" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isSwitching ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Building className="size-3.5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs tracking-tight">{s.name}</p>
                    <p className="text-[10px] font-normal text-slate-400">
                      {s.code || "PG Property"}
                    </p>
                  </div>
                  {isActive && (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-2xs">
                      <Check className="size-3 stroke-[2.5]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isOwner && (
            <div className="border-t border-slate-100 p-2 bg-slate-50/70 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  setAddPropertyModalOpen(true);
                }}
                className="flex w-full items-center justify-center gap-1.5 py-1.5 text-center text-xs font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Add New PG Property</span>
              </button>
              <Link
                href="/admin/team"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center justify-center gap-1.5 py-1 text-center text-[11.5px] font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                <UserCheck className="size-3.5" />
                <span>Manage PG Managers</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Property button */}
      {canInteract ? (
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          className="group flex w-full items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2.5 border border-white/15 transition-all hover:bg-white/15 hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 text-left cursor-pointer"
          title={hasMultiple ? "Click to switch between PG properties" : "Click to manage or add PG properties"}
        >
          <span className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white shadow-2xs group-hover:bg-white/20 transition-colors">
            <Building className="size-4 text-blue-100" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white tracking-tight leading-snug">
              {pgName}
            </p>
            <p className="text-[10px] font-medium text-blue-200/90 leading-none mt-0.5 flex items-center gap-1">
              <span>{hasMultiple ? "Switch property" : "PG Property"}</span>
              <span className="size-1 rounded-full bg-blue-300" />
              <span>{accessibleSocieties.length || 1} PG{(accessibleSocieties.length || 1) === 1 ? "" : "s"}</span>
            </p>
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-blue-200/90 group-hover:text-white transition-colors" />
        </button>
      ) : (
        <div className="flex items-center gap-2.5 rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2.5 border border-white/15 transition-colors">
          <span className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white shadow-2xs">
            <Building className="size-4 text-blue-100" />
          </span>
          <p className="min-w-0 flex-1 truncate text-xs font-bold text-white tracking-tight" title={pgName}>
            {pgName}
          </p>
        </div>
      )}

      {roomLabel ? (
        <p className="mt-1.5 truncate px-2 text-[10.5px] font-medium text-blue-200/80">
          {roomLabel}
        </p>
      ) : null}

      {isOwner && (
        <AddPropertyModal
          open={addPropertyModalOpen}
          onClose={() => setAddPropertyModalOpen(false)}
        />
      )}
    </div>
  );
}

function UserMenu({ user, society, accessibleSocieties = [], roomLabel, onSignOut, onClose, t: tProp }) {
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
        {accessibleSocieties?.length > 1 ? (
          <div className="flex items-center justify-between gap-3 py-1">
            <dt className="text-slate-500">Active PG</dt>
            <dd className="font-semibold text-brand-700 truncate max-w-36">{society?.name || "Selected"}</dd>
          </div>
        ) : null}
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

function MobileBottomNav({ user, isPgWorkspace, pathname, onNavigate, t }) {
  if (user.role === "SUPER_ADMIN") {
    const items = [
      { href: "/super-admin/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/super-admin/societies", label: "Properties", icon: Building },
      { href: "/super-admin/team", label: "Admins", icon: ShieldCheck },
    ];
    return (
      <nav
        aria-label="Super Admin Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E5EAF3] bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(49,84,217,0.06)] lg:hidden"
        style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="grid grid-cols-3 items-center px-3 pt-1.5 pb-1 max-w-md mx-auto">
          {items.map((it) => {
            const Icon = it.icon;
            const active =
              pathname === it.href ||
              (it.href !== "/super-admin/dashboard" && pathname.startsWith(`${it.href}/`));
            return (
              <Link
                key={it.href}
                href={it.href}
                prefetch={true}
                onClick={() => {
                  if (pathname !== it.href && !pathname.startsWith(`${it.href}/`)) {
                    onNavigate?.();
                  }
                }}
                className={`group flex flex-col items-center justify-center py-1 text-center transition-all ${
                  active ? "text-brand-600 font-semibold" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon
                  className={`size-5 transition-transform ${
                    active ? "scale-110 text-brand-600" : "text-slate-400"
                  }`}
                />
                <span className="text-[11px] mt-1 tracking-tight">{it.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  const isAdmin = ["OWNER", "MANAGER", "SOCIETY_ADMIN"].includes(user.role);
  if (isAdmin) {
    const items = [
      {
        href: "/admin/rooms",
        label: isPgWorkspace ? "Beds" : "Flats",
        icon: BedSingle,
        match: (p) =>
          p === "/admin/rooms" ||
          p.startsWith("/admin/rooms/") ||
          p.startsWith("/admin/residents"),
      },
      {
        href: "/admin/billing/payments",
        label: t("nav.payments", "Payments"),
        icon: CreditCard,
        match: (p) =>
          p === "/admin/billing/payments" || p.startsWith("/admin/billing/payments/"),
      },
      {
        href: "/admin/dashboard",
        label: t("nav.dashboard", "Dashboard"),
        icon: LayoutDashboard,
        isCenter: true,
        match: (p) => p === "/admin/dashboard",
      },
      {
        href: "/admin/billing/defaulters",
        label: t("nav.defaulters", "Overdue"),
        icon: AlertTriangle,
        match: (p) =>
          p === "/admin/billing/defaulters" || p.startsWith("/admin/billing/defaulters/"),
      },
      {
        href: "/admin/billing/invoices",
        label: t("nav.invoices", "Invoices"),
        icon: FileText,
        match: (p) =>
          p === "/admin/billing/invoices" || p.startsWith("/admin/billing/invoices/"),
      },
    ];

    return (
      <nav
        aria-label="Admin Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E5EAF3] bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(49,84,217,0.07)] lg:hidden"
        style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="grid grid-cols-5 items-center px-1 pt-1.5 pb-1 max-w-lg mx-auto">
          {items.map((it) => {
            const Icon = it.icon;
            const active = it.match(pathname);

            if (it.isCenter) {
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  prefetch={true}
                  onClick={() => {
                    if (pathname !== it.href) onNavigate?.();
                  }}
                  className="group flex flex-col items-center justify-center -mt-3.5 relative focus:outline-none"
                  aria-label={it.label}
                  aria-current={active ? "page" : undefined}
                >
                  <div
                    className={`flex size-11 items-center justify-center rounded-2xl transition-all duration-200 active:scale-95 ${
                      active
                        ? "bg-gradient-to-tr from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/35 ring-4 ring-white"
                        : "bg-white text-slate-600 border border-[#E5EAF3] shadow-md hover:text-brand-600 ring-4 ring-white"
                    }`}
                  >
                    <Icon className="size-5.5" />
                  </div>
                  <span
                    className={`text-[10px] mt-0.5 tracking-tight font-bold transition-colors ${
                      active ? "text-brand-600" : "text-slate-500 group-hover:text-slate-800"
                    }`}
                  >
                    {it.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={it.href}
                href={it.href}
                prefetch={true}
                onClick={() => {
                  if (!it.match(pathname)) onNavigate?.();
                }}
                className={`group flex flex-col items-center justify-center py-1 px-0.5 text-center transition-all active:scale-95 focus:outline-none ${
                  active ? "text-brand-600 font-semibold" : "text-slate-500 hover:text-slate-800"
                }`}
                aria-label={it.label}
                aria-current={active ? "page" : undefined}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`size-5 transition-transform duration-150 ${
                      active
                        ? "scale-105 text-brand-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 size-1 rounded-full bg-brand-600"
                    />
                  ) : null}
                </div>
                <span className="text-[10px] mt-1 tracking-tight truncate max-w-full">
                  {it.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  if (user.role === "RESIDENT") {
    const resident5 = [
      {
        href: "/resident/invoices",
        label: t("nav.invoices", "Invoices"),
        icon: FileText,
        match: (p) => p === "/resident/invoices" || p.startsWith("/resident/invoices/"),
      },
      {
        href: "/resident/vacate",
        label: "Notice",
        icon: DoorOpen,
        match: (p) => p === "/resident/vacate",
      },
      {
        href: "/resident/dashboard",
        label: t("nav.dashboard", "Home"),
        icon: LayoutDashboard,
        isCenter: true,
        match: (p) => p === "/resident/dashboard",
      },
      {
        href: "/resident/complaints",
        label: t("nav.complaints", "Complaints"),
        icon: AlertTriangle,
        match: (p) => p === "/resident/complaints" || p.startsWith("/resident/complaints/"),
      },
      {
        href: "/resident/profile",
        label: t("nav.profile", "Profile"),
        icon: UserCircle,
        match: (p) => p === "/resident/profile",
      },
    ];

    return (
      <nav
        aria-label="Resident Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E5EAF3] bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(49,84,217,0.07)] lg:hidden"
        style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="grid grid-cols-5 items-center px-1 pt-1.5 pb-1 max-w-lg mx-auto">
          {resident5.map((it) => {
            const Icon = it.icon;
            const active = it.match(pathname);

            if (it.isCenter) {
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  prefetch={true}
                  onClick={() => {
                    if (pathname !== it.href) onNavigate?.();
                  }}
                  className="group flex flex-col items-center justify-center -mt-3.5 relative focus:outline-none"
                  aria-label={it.label}
                  aria-current={active ? "page" : undefined}
                >
                  <div
                    className={`flex size-11 items-center justify-center rounded-2xl transition-all duration-200 active:scale-95 ${
                      active
                        ? "bg-gradient-to-tr from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/35 ring-4 ring-white"
                        : "bg-white text-slate-600 border border-[#E5EAF3] shadow-md hover:text-brand-600 ring-4 ring-white"
                    }`}
                  >
                    <Icon className="size-5.5" />
                  </div>
                  <span
                    className={`text-[10px] mt-0.5 tracking-tight font-bold transition-colors ${
                      active ? "text-brand-600" : "text-slate-500 group-hover:text-slate-800"
                    }`}
                  >
                    {it.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={it.href}
                href={it.href}
                prefetch={true}
                onClick={() => {
                  if (!it.match(pathname)) onNavigate?.();
                }}
                className={`group flex flex-col items-center justify-center py-1 px-0.5 text-center transition-all active:scale-95 focus:outline-none ${
                  active ? "text-brand-600 font-semibold" : "text-slate-500 hover:text-slate-800"
                }`}
                aria-label={it.label}
                aria-current={active ? "page" : undefined}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`size-5 transition-transform duration-150 ${
                      active
                        ? "scale-105 text-brand-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 size-1 rounded-full bg-brand-600"
                    />
                  ) : null}
                </div>
                <span className="text-[10px] mt-1 tracking-tight truncate max-w-full">
                  {it.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return null;
}
