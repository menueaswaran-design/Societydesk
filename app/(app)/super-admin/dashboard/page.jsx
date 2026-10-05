import Link from "next/link";
import { getServerSession } from "@/lib/auth/server";
import { requirePageRole } from "@/lib/auth/guard";
import { getPlatformDashboard } from "@/lib/queries/dashboard";
import { formatDate } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/Feedback";
import PageHeader from "@/components/ui/PageHeader";
import Table, { Tr, Td, RowActions } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import {
  Building2,
  Users,
  Home,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Plus,
} from "lucide-react";

export const metadata = { title: "Platform" };
export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  const user = await getServerSession();
  requirePageRole(user, "SUPER_ADMIN");

  const data = await getPlatformDashboard();
  const { cards } = data;

  return (
    <div className="stack">
      <PageHeader
        title="Platform"
        description="Cross-society counts only. Resident financial data stays inside each society."
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
            <ShieldCheck className="size-3.5" />
            Platform owner
          </span>
        }
        actions={
          <Button as="a" href="/super-admin/societies" variant="secondary" size="sm">
            <Plus />
            New society
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Societies"
          value={cards.societies}
          hint={`${cards.activeSocieties} active · ${cards.inactiveSocieties} inactive`}
          icon={Building2}
          tone="brand"
        />
        <StatCard
          label="Residents"
          value={cards.usersByRole.RESIDENT ?? 0}
          hint="Resident accounts on the platform"
          icon={Users}
        />
        <StatCard
          label="Admins"
          value={(cards.usersByRole.SOCIETY_ADMIN ?? 0) + (cards.usersByRole.SUPER_ADMIN ?? 0)}
          hint="Society admins + platform owners"
          icon={ShieldCheck}
        />
        <StatCard label="Flats" value={cards.flats} hint="Across every society" icon={Home} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Invoices raised" value={cards.invoices} icon={FileText} tone="blue" />
        <StatCard label="Complaints raised" value={cards.complaints} icon={AlertTriangle} tone="violet" />
      </div>

      <Card>
        <CardHeader
          title="Societies"
          subtitle="Newest first"
          icon={Building2}
          action={
            <Link
              href="/super-admin/societies"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50"
            >
              Manage societies
              <ArrowUpRight className="size-3.5" />
            </Link>
          }
        />
        {data.societies.length === 0 ? (
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
            {data.societies.map((s) => (
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