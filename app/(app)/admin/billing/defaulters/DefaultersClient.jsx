"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Search, PartyPopper, Clock, Wallet, Flame, FileText } from "lucide-react";
import Table, { Tr, Td, RowActions } from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/Feedback";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import { FilterChips } from "@/components/ui/FilterPills";
import { TextAction } from "@/components/ui/Button";
import { formatDate, formatMoney } from "@/lib/format";

const BANDS = [
  { key: "all", label: "All", test: () => true },
  { key: "1-30", label: "1-30 days", test: (d) => d.daysOverdue > 0 && d.daysOverdue <= 30 },
  { key: "31-60", label: "31-60 days", test: (d) => d.daysOverdue > 30 && d.daysOverdue <= 60 },
  { key: "60+", label: "60+ days", test: (d) => d.daysOverdue > 60 },
];

const OVERDUE_TONE = {
  red: "text-rose-600",
  amber: "text-amber-600",
  blue: "text-sky-600",
};

const OVERDUE_BADGE = {
  red: "red",
  amber: "amber",
  blue: "blue",
};

function overdueTone(days) {
  if (days > 60) return "red";
  if (days > 30) return "amber";
  return "blue";
}

export default function DefaultersClient({ defaulters, summary }) {
  const [query, setQuery] = useState("");
  const [bandKey, setBandKey] = useState("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const bandTest = BANDS.find((b) => b.key === bandKey)?.test ?? (() => true);
    return defaulters.filter((d) => {
      if (!bandTest(d)) return false;
      if (!q) return true;
      return [d.flatNumber, d.block, d.residentName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [defaulters, query, bandKey]);

  const bandCounts = useMemo(() => {
    const counts = { all: defaulters.length };
    for (const b of BANDS) counts[b.key] = defaulters.filter((d) => b.test(d)).length;
    return counts;
  }, [defaulters]);

  return (
    <div className="stack">
      <PageHeader
        title="Defaulters"
        description="Unpaid invoices past their due date, one row per flat."
        meta={
          <span className="text-[11px] font-semibold text-slate-500">
            {visible.length} of {defaulters.length} flats
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Flats in arrears" value={summary.flatCount} tone="red" icon={AlertTriangle} />
        <StatCard label="Invoices unpaid" value={summary.invoiceCount} icon={FileText} />
        <StatCard
          label="Total outstanding"
          value={formatMoney(summary.totalOutstanding)}
          tone="amber"
          icon={Wallet}
        />
        <StatCard
          label="Worst overdue"
          value={`${summary.worstDays} days`}
          hint="Oldest unpaid invoice"
          tone={summary.worstDays > 60 ? "red" : "default"}
          icon={Flame}
        />
      </div>

      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <FilterChips
            value={bandKey}
            onChange={setBandKey}
            options={BANDS.map((b) => ({ value: b.key, label: `${b.label} ${bandCounts[b.key]}` }))}
          />
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search flat or resident"
            className="w-full lg:ml-auto lg:max-w-xs"
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={defaulters.length === 0 ? PartyPopper : Search}
            title={defaulters.length === 0 ? "Nobody is in arrears" : "No matching flats"}
            description={
              defaulters.length === 0
                ? "Every issued invoice is within its due date or already settled."
                : "Try a different filter or search term."
            }
          />
        ) : (
          <Table
            dense
            head={[
              { label: "Flat" },
              { label: "Primary resident" },
              { label: "Oldest due" },
              { label: "Invoices", align: "right", className: "hidden sm:table-cell" },
              { label: "Days overdue", align: "right" },
              { label: "Outstanding", align: "right" },
              { label: "", align: "right" },
            ]}
          >
            {visible.map((d) => (
              <Tr key={d.flatId}>
                <Td className="font-semibold text-slate-900">
                  {d.block ? `${d.block}-` : ""}
                  {d.flatNumber}
                </Td>
                <Td>{d.residentName ?? <span className="text-slate-400">Vacant</span>}</Td>
                <Td className="whitespace-nowrap">{formatDate(d.oldestDueDate)}</Td>
                <Td align="right" className="tabular hidden sm:table-cell">
                  {d.invoiceCount}
                </Td>
                <Td align="right">
                  <Badge tone={OVERDUE_BADGE[overdueTone(d.daysOverdue)]}>
                    <Clock />
                    {d.daysOverdue} days
                  </Badge>
                </Td>
                <Td align="right" className="tabular font-semibold text-rose-600">
                  {formatMoney(d.outstanding)}
                </Td>
                <Td align="right">
                  <RowActions>
                    <Link href="/admin/billing/invoices?status=OVERDUE">
                      <TextAction>Open invoices</TextAction>
                    </Link>
                  </RowActions>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
}