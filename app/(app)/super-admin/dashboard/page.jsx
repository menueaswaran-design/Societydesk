import Link from "next/link";
import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { getPlatformDashboard } from "@/lib/queries/dashboard";
import { formatDate } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/Feedback";
import Table, { Tr, Td, RowActions } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Welcome from "@/components/dashboard/Welcome";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  Plus,
  Building2,
  Users,
  ShieldCheck,
  DoorOpen,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  MapPin,
  Phone,
} from "lucide-react";

export const metadata = { title: "PG Platform - Bedy" };
export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  const user = await getServerSession();
  requirePageRole(user, "SUPER_ADMIN");

  const data = await getPlatformDashboard();
  const cards = data.cards || {
    societies: data.totalSocieties || 0,
    activeSocieties: data.activeSocieties || 0,
    inactiveSocieties: 0,
    usersByRole: {},
    flats: data.totalFlats || 0,
    rooms: data.totalRooms || 0,
    beds: data.totalBeds || 0,
    invoices: 0,
    complaints: 0,
  };
  const usersByRole = cards.usersByRole || {};
  const managerCount =
    (usersByRole.MANAGER ?? 0) +
    (usersByRole.OWNER ?? 0) +
    (usersByRole.SOCIETY_ADMIN ?? 0);

  const snapshot = [
    {
      label: "PG Properties",
      value: cards.societies,
      hint: `${cards.activeSocieties} active · ${cards.inactiveSocieties} inactive`,
      icon: Building2,
    },
    {
      label: "Rooms & Beds",
      value: `${cards.rooms || cards.flats || 0} R · ${cards.beds || 0} B`,
      hint: "Platform bed capacity",
      icon: DoorOpen,
    },
    {
      label: "Residents",
      value: usersByRole.RESIDENT ?? 0,
      hint: "Checked-in tenants",
      icon: Users,
    },
    {
      label: "PG Managers",
      value: managerCount,
      hint: "Assigned staff accounts",
      icon: ShieldCheck,
    },
    {
      label: "Rent Invoices",
      value: cards.invoices,
      hint: "Total bills generated",
      icon: FileText,
    },
    {
      label: "Complaints",
      value: cards.complaints,
      hint: "Reported issues",
      icon: AlertTriangle,
    },
  ];

  const quickActions = [
    {
      href: "/super-admin/societies",
      title: "Onboard PG Property",
      caption: "Register PG, set rooms and assign manager",
      icon: Plus,
      tone: "brand",
    },
    {
      href: "/super-admin/societies",
      title: "Manage PG Properties",
      caption: `${cards.societies} properties on platform`,
      icon: Building2,
      tone: "sky",
    },
    {
      href: "/super-admin/team",
      title: "PG Managers & Admins",
      caption: `${managerCount} property managers`,
      icon: ShieldCheck,
      tone: "violet",
    },
  ];

  return (
    <div className="stack">
      <Welcome
        eyebrow="Platform Administration"
        title="PG & Coliving Platform"
        description="Onboard PG & hostel properties, configure rooms, assign PG managers, and monitor multi-property occupancy."
        badge={
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-brand-300" />
            Platform Super Admin
          </span>
        }
        actions={
          <Button as="a" href="/super-admin/societies" variant="primary" size="lg">
            <Plus />
            Onboard PG Property
          </Button>
        }
      />

      <Card className="p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3 xl:grid-cols-6">
          {snapshot.map((s) => (
            <div key={s.label}>
              <div className="flex items-center gap-1.5">
                <s.icon className="size-4 text-slate-400" />
                <p className="label-xs">{s.label}</p>
              </div>
              <p className="tabular mt-2 text-2xl font-bold tracking-tight text-slate-900">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{s.hint}</p>
            </div>
          ))}
        </div>
      </Card>

      <QuickActions items={quickActions} />

      <Card>
        <CardHeader
          title="PG & Coliving Properties"
          subtitle="All registered properties on Bedy"
          icon={Building2}
          action={
            <Link
              href="/super-admin/societies"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              View all
              <ArrowUpRight className="size-4" />
            </Link>
          }
        />
        {(data.societies || []).length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No PG properties yet"
            description="Onboard the first PG property to start managing rooms, beds, and residents."
            action={
              <Link href="/super-admin/societies" className="inline-block">
                <Button>
                  <Plus />
                  Onboard PG Property
                </Button>
              </Link>
            }
          />
        ) : (
          <Table
            dense
            head={[
              { label: "PG Property" },
              { label: "Location", className: "hidden md:table-cell" },
              { label: "PG Manager" },
              { label: "Capacity (Rooms · Beds)", align: "right" },
              { label: "Occupants", align: "right", className: "hidden sm:table-cell" },
              { label: "Invoices", align: "right", className: "hidden lg:table-cell" },
              { label: "Since", className: "hidden xl:table-cell" },
              { label: "Status" },
              { label: "", align: "right" },
            ]}
          >
            {(data.societies || []).map((s) => {
              const manager = s.users?.[0];
              const roomsCount = s._count?.units || s._count?.flats || 0;
              const bedsCount = s._count?.beds || 0;
              const occupantsCount = s._count?.occupancies || 0;

              return (
                <Tr key={s.id}>
                  <Td className="font-semibold text-slate-900">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{s.name}</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {s.code || "No code"}
                      </span>
                    </div>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <MapPin className="size-3 text-slate-400 shrink-0" />
                      <span>{s.city ? `${s.city}${s.state ? `, ${s.state}` : ""}` : "Not set"}</span>
                    </div>
                  </Td>
                  <Td>
                    {manager ? (
                      <div className="flex flex-col text-xs">
                        <span className="font-semibold text-slate-900">{manager.name}</span>
                        <span className="text-slate-400 text-[11px] font-mono">
                          {manager.phone || manager.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Unassigned</span>
                    )}
                  </Td>
                  <Td align="right" className="tabular font-medium text-slate-800">
                    <span className="font-bold text-slate-900">{roomsCount}</span>
                    <span className="text-slate-400 text-xs"> R</span>
                    <span className="text-slate-300 mx-1">·</span>
                    <span className="font-bold text-slate-900">{bedsCount}</span>
                    <span className="text-slate-400 text-xs"> B</span>
                  </Td>
                  <Td align="right" className="tabular hidden sm:table-cell font-medium text-slate-800">
                    {occupantsCount}
                  </Td>
                  <Td align="right" className="tabular hidden lg:table-cell">
                    {s._count?.invoices || 0}
                  </Td>
                  <Td className="hidden whitespace-nowrap xl:table-cell text-xs text-slate-500">
                    {formatDate(s.createdAt)}
                  </Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                  <Td align="right">
                    <RowActions>
                      <Link
                        href="/super-admin/societies"
                        aria-label={`Manage ${s.name}`}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-700"
                      >
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </RowActions>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        )}
      </Card>
    </div>
  );
}
