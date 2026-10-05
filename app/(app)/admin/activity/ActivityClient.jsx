"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ChevronDown, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import Table, { Tr, Td, RowActions } from "@/components/ui/Table";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/Feedback";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import { IconButton } from "@/components/ui/Button";
import { formatDateTime, titleCase } from "@/lib/format";

export default function ActivityClient({ logs, entityTypes, filters }) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.q ?? "");
  const [expanded, setExpanded] = useState(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) =>
      [l.action, l.entityType, l.entityId, l.user?.name, l.reason]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [logs, query]);

  // URL is the source of truth so the server does the real filtering.
  function push(next) {
    const params = new URLSearchParams();
    const qv = next.q ?? query.trim();
    if (qv) params.set("q", qv);
    const ev = next.entityType === undefined ? filters.entityType : next.entityType;
    if (ev) params.set("entityType", ev);
    const qs = params.toString();
    router.push(qs ? `/admin/activity?${qs}` : "/admin/activity", { scroll: false });
  }

  function entityFilter(value) {
    push({ entityType: value || undefined });
  }

  const hasFilters = Boolean(filters.q || filters.entityType);
  const todayCount = logs.filter(
    (l) => new Date(l.createdAt).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="stack">
      <PageHeader
        title="Activity"
        description="Every administrative change, newest first. Records cannot be edited or removed."
        meta={
          <span className="text-[11px] font-semibold text-slate-500">
            {logs.length} {logs.length === 1 ? "entry" : "entries"}
            {logs.length >= 300 ? " · capped at 300" : ""}
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Entries" value={logs.length} icon={ShieldCheck} />
        <StatCard label="Today" value={todayCount} tone="blue" />
        <StatCard
          label="People involved"
          value={new Set(logs.map((l) => l.userId).filter(Boolean)).size}
        />
      </div>

      <div className="surface flex flex-wrap items-center gap-2 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            push({});
          }}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
        >
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search action, user or reason"
            className="min-w-52 flex-1"
          />

          <label className="relative inline-flex items-center">
            <span className="sr-only">Entity type</span>
            <SlidersHorizontal className="pointer-events-none absolute left-3 size-4 text-slate-400" />
            <select
              value={filters.entityType ?? ""}
              onChange={(e) => entityFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-900/10 bg-white pr-3 pl-9 text-sm text-slate-700 shadow-soft transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
            >
              <option value="">All entities</option>
              {entityTypes.map((t) => (
                <option key={t} value={t}>
                  {titleCase(t)}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="sr-only">
            Search
          </button>
        </form>

        {hasFilters ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              router.push("/admin/activity", { scroll: false });
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-900/5 hover:text-slate-900"
          >
            <X className="size-3.5" />
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="surface overflow-hidden">
        {visible.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No activity"
            description="Actions taken in flats, billing, complaints and notices show up here."
          />
        ) : (
          <Table
            dense
            head={[
              { label: "When" },
              { label: "Action" },
              { label: "Entity", className: "hidden sm:table-cell" },
              { label: "By" },
              { label: "Reason", className: "hidden lg:table-cell" },
              { label: "", align: "right" },
            ]}
          >
            {visible.map((l) => {
              const isOpen = expanded === l.id;
              const hasDiff = Boolean(l.oldValue || l.newValue);
              const Chevron = isOpen ? ChevronDown : ChevronRight;
              return (
                <Fragment key={l.id}>
                  <Tr>
                    <Td dense className="tabular whitespace-nowrap text-xs text-slate-500">
                      {formatDateTime(l.createdAt)}
                    </Td>
                    <Td dense className="font-semibold text-slate-900">
                      {titleCase(l.action)}
                    </Td>
                    <Td dense className="hidden sm:table-cell">
                      <span className="text-slate-600">{titleCase(l.entityType)}</span>
                      <span className="block font-mono text-[10px] text-slate-400">
                        {String(l.entityId).slice(-8)}
                      </span>
                    </Td>
                    <Td dense>
                      {l.user?.name ?? <span className="text-slate-400">System</span>}
                    </Td>
                    <Td dense className="hidden max-w-48 truncate text-xs text-slate-500 lg:table-cell">
                      {l.reason ?? "-"}
                    </Td>
                    <Td dense align="right">
                      {hasDiff ? (
                        <RowActions>
                          <IconButton
                            size="xs"
                            label={isOpen ? "Hide change detail" : "Show change detail"}
                            aria-expanded={isOpen}
                            onClick={() => setExpanded(isOpen ? null : l.id)}
                          >
                            <Chevron />
                          </IconButton>
                        </RowActions>
                      ) : null}
                    </Td>
                  </Tr>
                  {isOpen && hasDiff ? (
                    <Tr className="hover:bg-transparent">
                      <Td colSpan={6} dense className="bg-slate-50/80">
                        <Diff oldValue={l.oldValue} newValue={l.newValue} />
                      </Td>
                    </Tr>
                  ) : null}
                </Fragment>
              );
            })}
          </Table>
        )}
      </div>

      <p className="text-xs text-slate-400">Showing the most recent 300 entries.</p>
    </div>
  );
}

function Diff({ oldValue, newValue }) {
  return (
    <div className="grid gap-4 py-1 lg:grid-cols-2">
      <div>
        <p className="label-xs mb-1">Before</p>
        <pre className="scroll-fade-x overflow-x-auto rounded-xl bg-white p-3 text-xs whitespace-pre-wrap text-slate-600 ring-1 ring-slate-900/5">
          {oldValue ? JSON.stringify(oldValue, null, 2) : "No prior value"}
        </pre>
      </div>
      <div>
        <p className="label-xs mb-1 text-brand-700">After</p>
        <pre className="scroll-fade-x overflow-x-auto rounded-xl bg-brand-50/40 p-3 text-xs whitespace-pre-wrap text-slate-800 ring-1 ring-brand-200/60">
          {newValue ? JSON.stringify(newValue, null, 2) : "No new value"}
        </pre>
      </div>
    </div>
  );
}