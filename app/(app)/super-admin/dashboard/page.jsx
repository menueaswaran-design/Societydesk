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
  Building,
  Users,
  ShieldCheck,
  Home,
  FileText,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";

export const metadata = { title: "Platform" };
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
    invoices: 0,
    complaints: 0,
  };
  const usersByRole = cards.usersByRole || {};
  const societyAdminCount = usersByRole.SOCIETY_ADMIN ?? usersByRole.OWNER ?? 0;

  const snapshot = [
    {
      label: "Societies",
      value: cards.societies,
      hint: `${cards.activeSocieties} active · ${cards.inactiveSocieties} inactive`,
      icon: Building,
    },
    {
      label: "Residents",
      value: usersByRole.RESIDENT ?? 0,
      hint: "Accounts on the platform",
      icon: Users,
    },
    {
      label: "Society Admins",
      value: societyAdminCount,
      hint: "Active society admins",
      icon: ShieldCheck,
    },
    {
      label: "Flats",
      value: cards.flats,
      hint: "Across every society",
      icon: Home,
    },
    {
      label: "Invoices raised",
      value: cards.invoices,
      hint: "Bills sent to residents",
      icon: FileText,
    },
    {
      label: "Complaints",
      value: cards.complaints,
      hint: "Raised by residents",
      icon: AlertTriangle,
    },
  ];

  const quickActions = [
    {
      href: "/super-admin/societies",
      title: "Create society",
      caption: "Onboard a new housing society",
      icon: Plus,
      tone: "brand",
    },
    {
      href: "/super-admin/societies",
      title: "Manage societies",
      caption: `${cards.societies} on the platform`,
      icon: Building2,
      tone: "sky",
    },
    {
      href: "/super-admin/team",
      title: "Society Admins",
      caption: `${societyAdminCount} across platform`,
      icon: ShieldCheck,
      tone: "violet",
    },
  ];

  return (
    <div className="stack">
      <Welcome
        eyebrow="Platform"
        title="Platform overview"
        description="Create societies and assign an admin to manage flats and residents."
        badge={
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-brand-300" />
            Platform owner
          </span>
        }
        actions={
          <Button as="a" href="/super-admin/societies" variant="secondary" size="lg">
            <Plus />
            New society
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
          title="Societies"
          subtitle="Newest first"
          icon={Building2}
          action={
            <Link
              href="/super-admin/societies"
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              Manage societies
              <ArrowUpRight className="size-4" />
            </Link>
          }
        />
        {(data.societies || []).length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No societies yet"
            description="Create the first tenant to start onboarding societies."
            action={
              <Link href="/super-admin/societies" className="inline-block">
                <Button>
                  <Plus />
                  Create society
                </Button>
              </Link>
            }
          />
        ) : (
          <Table
            dense
            head={[
              { label: "Society" },
              { label: "Code", className: "hidden md:table-cell" },
              { label: "Flats", align: "right" },
              { label: "Users", align: "right" },
              { label: "Invoices", align: "right", className: "hidden lg:table-cell" },
              { label: "Complaints", align: "right", className: "hidden lg:table-cell" },
              { label: "Since", className: "hidden xl:table-cell" },
              { label: "Status" },
              { label: "", align: "right" },
            ]}
          >
            {(data.societies || []).map((s) => (
              <Tr key={s.id}>
                <Td className="font-semibold text-slate-900">{s.name}</Td>
                <Td className="hidden md:table-cell">
                  <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                    {s.code}
                  </code>
                </Td>
                <Td align="right" className="tabular font-medium text-slate-800">
                  {s._count.flats}
                </Td>
                <Td align="right" className="tabular font-medium text-slate-800">
                  {s._count.users}
                </Td>
                <Td align="right" className="tabular hidden lg:table-cell">
                  {s._count.invoices}
                </Td>
                <Td align="right" className="tabular hidden lg:table-cell">
                  {s._count.complaints}
                </Td>
                <Td className="hidden whitespace-nowrap xl:table-cell">{formatDate(s.createdAt)}</Td>
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
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}