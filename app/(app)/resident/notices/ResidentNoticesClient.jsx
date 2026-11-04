"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Megaphone,
  Paperclip,
  Check,
  CheckCheck,
  ExternalLink,
  AlertCircle,
  Wrench,
  PartyPopper,
  ShieldAlert,
  Users,
  Info,
  Calendar,
  Sparkles,
  Inbox,
  BellRing,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import { FilterChips } from "@/components/ui/FilterPills";
import { api } from "@/lib/client/api";
import { formatDate, titleCase } from "@/lib/format";

const CATEGORY_CONFIG = {
  URGENT: {
    label: "Urgent",
    tone: "red",
    icon: AlertCircle,
    cardBg: "from-rose-50/60 to-white",
    cardBorder: "border-rose-200/90 hover:border-rose-300",
    iconBox: "bg-rose-100/80 text-rose-700 ring-rose-500/20",
    accentBar: "bg-linear-to-r from-rose-500 via-rose-400 to-amber-500",
  },
  MAINTENANCE: {
    label: "Maintenance",
    tone: "amber",
    icon: Wrench,
    cardBg: "from-amber-50/40 to-white",
    cardBorder: "border-amber-200/80 hover:border-amber-300",
    iconBox: "bg-amber-100/80 text-amber-700 ring-amber-500/20",
    accentBar: "bg-linear-to-r from-amber-500 to-yellow-500",
  },
  EVENT: {
    label: "Event",
    tone: "violet",
    icon: PartyPopper,
    cardBg: "from-violet-50/40 to-white",
    cardBorder: "border-violet-200/80 hover:border-violet-300",
    iconBox: "bg-violet-100/80 text-violet-700 ring-violet-500/20",
    accentBar: "bg-linear-to-r from-violet-500 to-fuchsia-500",
  },
  RULES: {
    label: "Rules & Policy",
    tone: "blue",
    icon: ShieldAlert,
    cardBg: "from-blue-50/40 to-white",
    cardBorder: "border-blue-200/80 hover:border-blue-300",
    iconBox: "bg-sky-100/80 text-sky-700 ring-sky-500/20",
    accentBar: "bg-linear-to-r from-blue-500 to-cyan-500",
  },
  MEETING: {
    label: "Meeting",
    tone: "violet",
    icon: Users,
    cardBg: "from-indigo-50/40 to-white",
    cardBorder: "border-indigo-200/80 hover:border-indigo-300",
    iconBox: "bg-indigo-100/80 text-indigo-700 ring-indigo-500/20",
    accentBar: "bg-linear-to-r from-indigo-500 to-blue-500",
  },
  GENERAL: {
    label: "General",
    tone: "slate",
    icon: Info,
    cardBg: "from-slate-50/60 to-white",
    cardBorder: "border-slate-200/80 hover:border-slate-300",
    iconBox: "bg-slate-100 text-slate-700 ring-slate-900/10",
    accentBar: "bg-linear-to-r from-brand-500 to-accent-500",
  },
};

function getCategoryConfig(category) {
  return CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.GENERAL;
}

const READ_STATUS_OPTIONS = [
  { value: "ALL", label: "All notices" },
  { value: "UNREAD", label: "Unread" },
  { value: "READ", label: "Read" },
];

export default function ResidentNoticesClient({ notices = [], readIds = [] }) {
  const router = useRouter();
  const [read, setRead] = useState(() => new Set(readIds));
  const [selectedCategory, setSelectedCategory] = useState("");
  const [readFilter, setReadFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  // Available distinct categories in this list
  const distinctCategories = useMemo(() => {
    return [...new Set(notices.map((n) => n.category).filter(Boolean))];
  }, [notices]);

  // Counts & stats
  const unreadCount = notices.filter((n) => !read.has(n.id)).length;
  const readCount = notices.length - unreadCount;
  const urgentCount = notices.filter((n) => n.category === "URGENT").length;

  // Filtered notices
  const visible = useMemo(() => {
    let result = notices;

    // 1. Search Query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (n) =>
          n.title?.toLowerCase().includes(q) ||
          n.body?.toLowerCase().includes(q) ||
          n.postedBy?.name?.toLowerCase().includes(q)
      );
    }

    // 2. Category Filter
    if (selectedCategory) {
      result = result.filter((n) => n.category === selectedCategory);
    }

    // 3. Read / Unread Status Filter
    if (readFilter === "UNREAD") {
      result = result.filter((n) => !read.has(n.id));
    } else if (readFilter === "READ") {
      result = result.filter((n) => read.has(n.id));
    }

    return result;
  }, [notices, searchQuery, selectedCategory, readFilter, read]);

  // Mark single notice as read
  async function markRead(notice, e) {
    if (e) e.stopPropagation();
    if (read.has(notice.id)) return;

    setBusyId(notice.id);
    setError(null);
    try {
      await api.post(`/api/notices/${notice.id}/read`);
      setRead((prev) => new Set(prev).add(notice.id));
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  // Mark all unread notices as read
  async function markAllRead() {
    const targets = notices.filter((n) => !read.has(n.id));
    if (targets.length === 0) return;

    setMarkingAll(true);
    setError(null);
    try {
      await Promise.all(targets.map((n) => api.post(`/api/notices/${n.id}/read`)));
      setRead((prev) => new Set([...prev, ...targets.map((n) => n.id)]));
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="stack">
      {/* 1. Page Header */}
      <PageHeader
        title="Notice Board"
        description="Official property updates, building maintenance schedules, and important community announcements."
        meta={
          unreadCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11.5px] font-bold text-brand-700 ring-1 ring-brand-500/20 shadow-2xs">
              <span className="size-1.5 rounded-full bg-brand-600 animate-pulse" />
              {unreadCount} unread {unreadCount === 1 ? "notice" : "notices"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
              <Check className="size-3.5 text-emerald-600" />
              All caught up
            </span>
          )
        }
        actions={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              loading={markingAll}
              onClick={markAllRead}
              className="gap-1.5 shadow-2xs"
            >
              <CheckCheck className="size-4 text-slate-500" />
              <span>Mark all read</span>
            </Button>
          ) : null
        }
      />

      <ErrorBanner error={error} />

      {/* 2. Top Summary KPI Cards (App Design Style) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Total Notices */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Notices
            </p>
            <span className="inline-flex size-8 sm:size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200/80">
              <Megaphone className="size-4 sm:size-4.5" />
            </span>
          </div>
          <p className="tabular mt-2 text-2xl sm:text-[26px] font-extrabold tracking-tight text-slate-900">
            {notices.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 font-medium">Published by management</p>
        </div>

        {/* Unread Announcements */}
        <div className="group relative overflow-hidden rounded-2xl border border-brand-100/90 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Unread
            </p>
            <span className="inline-flex size-8 sm:size-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-500/20">
              <BellRing className="size-4 sm:size-4.5" />
            </span>
          </div>
          <p className="tabular mt-2 text-2xl sm:text-[26px] font-extrabold tracking-tight text-brand-700">
            {unreadCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 font-medium">Awaiting your review</p>
        </div>

        {/* Urgent Actions */}
        <div className="group relative overflow-hidden rounded-2xl border border-rose-100/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Urgent / Alerts
            </p>
            <span className="inline-flex size-8 sm:size-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700 ring-1 ring-rose-500/20">
              <AlertCircle className="size-4 sm:size-4.5" />
            </span>
          </div>
          <p className="tabular mt-2 text-2xl sm:text-[26px] font-extrabold tracking-tight text-rose-700">
            {urgentCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 font-medium">High priority updates</p>
        </div>

        {/* Read Archive */}
        <div className="group relative overflow-hidden rounded-2xl border border-emerald-100/80 bg-white p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Completed
            </p>
            <span className="inline-flex size-8 sm:size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20">
              <Check className="size-4 sm:size-4.5" />
            </span>
          </div>
          <p className="tabular mt-2 text-2xl sm:text-[26px] font-extrabold tracking-tight text-emerald-700">
            {readCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 font-medium">Notices marked as read</p>
        </div>
      </div>

      {/* 3. Controls Toolbar: Search & Read Status Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search announcements..."
          />
        </div>

        <FilterChips
          options={READ_STATUS_OPTIONS}
          value={readFilter}
          onChange={setReadFilter}
        />
      </div>

      {/* 4. Category Filter Chips */}
      {distinctCategories.length > 1 && (
        <FilterChips
          options={[
            { value: "", label: "All categories" },
            ...distinctCategories.map((c) => ({
              value: c,
              label: titleCase(c),
            })),
          ]}
          value={selectedCategory}
          onChange={setSelectedCategory}
        />
      )}

      {/* 5. Notices List / Empty State */}
      {visible.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={Inbox}
            title={notices.length === 0 ? "No notices posted yet" : "No matching notices"}
            description={
              notices.length === 0
                ? "Announcements from your PG/hostel management will be displayed here."
                : "Try adjusting your search query or selected category filter."
            }
            action={
              searchQuery || selectedCategory || readFilter !== "ALL" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                    setReadFilter("ALL");
                  }}
                >
                  Show all notices
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {visible.map((n) => {
            const isRead = read.has(n.id);
            const isUrgent = n.category === "URGENT";
            const cfg = getCategoryConfig(n.category);
            const CatIcon = cfg.icon;
            const isBusy = busyId === n.id;

            return (
              <li
                key={n.id}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-5 shadow-2xs transition-all duration-200 ${
                  !isRead
                    ? isUrgent
                      ? "border-rose-200/90 shadow-sm ring-1 ring-rose-200/70"
                      : "border-brand-200/90 shadow-sm ring-1 ring-brand-200/70"
                    : "border-slate-200/80 hover:border-slate-300/80 hover:shadow-xs"
                }`}
              >
                {/* Unread Top Highlight Gradient Bar */}
                {!isRead && (
                  <span
                    className={`absolute inset-x-0 top-0 h-1 ${cfg.accentBar}`}
                  />
                )}

                {/* Main Card Content */}
                <div>
                  {/* Card Header: Category Icon Box, Category Badge, Read Badge, Mark Read Button */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Icon Pill */}
                      <span
                        className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 shadow-2xs ${cfg.iconBox}`}
                      >
                        <CatIcon className="size-4" />
                      </span>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone={cfg.tone} className="px-2 py-0.5 text-[11px] font-bold">
                            {cfg.label}
                          </Badge>
                          {!isRead ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 ring-1 ring-emerald-500/20">
                              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              New
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-medium text-slate-500">
                              <Check className="size-3 text-slate-400" />
                              Read
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isRead ? (
                      <Button
                        size="xs"
                        variant="secondary"
                        loading={isBusy}
                        onClick={(e) => markRead(n, e)}
                        className="shadow-2xs text-slate-700 hover:text-slate-900"
                        title="Mark notice as read"
                      >
                        <Check className="size-3 text-slate-500" />
                        <span>Mark read</span>
                      </Button>
                    ) : null}
                  </div>

                  {/* Notice Title */}
                  <h2
                    className={`mt-3.5 text-base leading-snug tracking-tight ${
                      !isRead
                        ? "font-bold text-slate-900"
                        : "font-semibold text-slate-800"
                    }`}
                  >
                    {n.title}
                  </h2>

                  {/* Notice Full Body */}
                  <div className="mt-2.5 rounded-xl bg-slate-50/70 p-3.5 border border-slate-100">
                    <p className="text-[13.5px] leading-relaxed text-slate-700 whitespace-pre-wrap font-normal">
                      {n.body}
                    </p>
                  </div>
                </div>

                {/* Card Footer: Metadata (Author Avatar, Published Date) & Attachment */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  {/* Author & Date */}
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar
                      name={n.postedBy?.name || "Management"}
                      size="xs"
                      tone="slate"
                    />
                    <div className="min-w-0 text-[11.5px] text-slate-500">
                      <span className="font-semibold text-slate-700 truncate block">
                        {n.postedBy?.name || "Management"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="size-3" />
                        {n.publishedAt
                          ? formatDate(n.publishedAt)
                          : formatDate(n.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Attachment Button (if available) */}
                  {n.attachmentUrl && (
                    <a
                      href={n.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-colors"
                    >
                      <Paperclip className="size-3.5 text-brand-600" />
                      <span className="truncate max-w-[130px]">
                        {n.attachmentName || "Attachment"}
                      </span>
                      <ExternalLink className="size-3 text-slate-400" />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
