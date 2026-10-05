"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Paperclip, Check, ExternalLink } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import PageHeader from "@/components/ui/PageHeader";
import { FilterChips } from "@/components/ui/FilterPills";
import { api } from "@/lib/client/api";
import { formatDate, titleCase } from "@/lib/format";

export default function ResidentNoticesClient({ notices, readIds }) {
  const router = useRouter();
  const [read, setRead] = useState(() => new Set(readIds));
  const [category, setCategory] = useState("");
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const visible = useMemo(
    () => (category ? notices.filter((n) => n.category === category) : notices),
    [notices, category]
  );

  const unread = notices.filter((n) => !read.has(n.id)).length;
  const categories = [...new Set(notices.map((n) => n.category))];

  // Section 31: opening a notice records the read. Idempotent server-side.
  async function markRead(notice) {
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

  async function markAllRead() {
    const targets = notices.filter((n) => !read.has(n.id));
    if (targets.length === 0) return;
    setError(null);
    try {
      await Promise.all(targets.map((n) => api.post(`/api/notices/${n.id}/read`)));
      setRead((prev) => new Set([...prev, ...targets.map((n) => n.id)]));
      router.refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Notices"
        description="Announcements from your society, newest first."
        meta={
          unread > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
              {unread} unread
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-600">All caught up</span>
          )
        }
        actions={
          unread > 0 ? (
            <Button variant="secondary" onClick={markAllRead}>
              <Check />
              Mark all read
            </Button>
          ) : null
        }
      />

      <ErrorBanner error={error} />

      {categories.length > 1 ? (
        <FilterChips
          options={[
            { value: "", label: "All categories" },
            ...categories.map((c) => ({ value: c, label: titleCase(c) })),
          ]}
          value={category}
          onChange={setCategory}
        />
      ) : null}

      {visible.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={Megaphone}
            title={notices.length === 0 ? "No notices yet" : "Nothing in this category"}
            description={
              notices.length === 0
                ? "Announcements from your society will appear here."
                : "Pick a different category."
            }
            action={
              notices.length > 0 && category ? (
                <Button variant="secondary" size="sm" onClick={() => setCategory("")}>
                  Show all categories
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {visible.map((n) => {
            const isRead = read.has(n.id);
            const busy = busyId === n.id;
            return (
              <li
                key={n.id}
                className={`card relative flex flex-col overflow-hidden p-5 transition-all duration-150 ${
                  isRead ? "ring-1 ring-slate-900/5" : "ring-1 ring-brand-200 shadow-soft"
                }`}
              >
                {!isRead ? (
                  <span className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-brand-500 to-accent-500" />
                ) : null}

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        className={`text-[15px] ${isRead ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}
                      >
                        {n.title}
                      </h2>
                      <Badge tone={n.category === "URGENT" ? "red" : "slate"}>
                        {titleCase(n.category)}
                      </Badge>
                      {isRead ? null : <Badge tone="blue">New</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {n.postedBy?.name} ·{" "}
                      {n.publishedAt ? formatDate(n.publishedAt) : formatDate(n.createdAt)}
                    </p>
                  </div>

                  {!isRead ? (
                    <Button
                      size="xs"
                      variant="secondary"
                      loading={busy}
                      onClick={() => markRead(n)}
                    >
                      <Check />
                      Mark read
                    </Button>
                  ) : null}
                </div>

                <p className="mt-3 flex-1 text-sm whitespace-pre-wrap text-slate-700">{n.body}</p>

                {n.attachmentUrl ? (
                  <a
                    href={n.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Paperclip className="size-3.5" />
                    {n.attachmentName ?? "Open attachment"}
                    <ExternalLink className="size-3 text-slate-400" />
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}