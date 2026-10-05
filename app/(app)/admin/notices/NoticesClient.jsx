"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Megaphone,
  Plus,
  Send,
  Archive,
  Pencil,
  Trash2,
  Eye,
  Paperclip,
  Users,
} from "lucide-react";
import Button, { IconButton } from "@/components/ui/Button";
import { RowActions } from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import Badge from "@/components/ui/Badge";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import FilterPills from "@/components/ui/FilterPills";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Progress } from "@/components/ui/Progress";
import { api, fieldErrors } from "@/lib/client/api";
import { NOTICE_CATEGORY, NOTICE_STATUS } from "@/lib/constants";
import { formatDateTime, titleCase } from "@/lib/format";

const BLANK = {
  title: "",
  body: "",
  category: "GENERAL",
  status: "DRAFT",
  attachmentUrl: "",
  attachmentName: "",
};

export default function NoticesClient({ notices, memberCount, filters }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [removing, setRemoving] = useState(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notices;
    return notices.filter((n) =>
      [n.title, n.body].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    );
  }, [notices, query]);

  async function setStatus(notice, status) {
    setBusyId(notice.id);
    setError(null);
    try {
      await api.patch(`/api/notices/${notice.id}`, { status });
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove() {
    const isDraft = removing?.status === "DRAFT";
    setError(null);
    try {
      await api.del(`/api/notices/${removing.id}`);
      setRemoving(null);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setRemoving(null);
    }
  }

  const published = notices.filter((n) => n.status === "PUBLISHED").length;

  return (
    <div className="stack">
      <PageHeader
        title="Notices"
        description="Announcements reach every resident the moment you publish them."
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
            <Users />
            {memberCount} {memberCount === 1 ? "resident" : "residents"}
          </span>
        }
        actions={
          <Button onClick={() => setEditor({ ...BLANK, id: null })}>
            <Plus />
            New notice
          </Button>
        }
      />

      <StatusFilter active={filters.status} />

      <ErrorBanner error={error} />

      <div className="surface overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search title or body"
            className="w-full sm:max-w-sm"
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No notices"
            description="Post an announcement to reach every resident."
            action={
              <Button onClick={() => setEditor({ ...BLANK, id: null })}>
                <Plus />
                New notice
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {visible.map((n) => {
              const busy = busyId === n.id;
              const readPct = memberCount > 0 ? Math.round((n.readCount / memberCount) * 100) : 0;
              return (
                <li
                  key={n.id}
                  className={`group px-5 py-4 transition-colors hover:bg-slate-50/60 ${busy ? "opacity-60" : ""}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-slate-900">{n.title}</h3>
                        <StatusBadge status={n.status} />
                        <Badge>{titleCase(n.category)}</Badge>
                      </div>

                      <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{n.body}</p>

                      {n.attachmentName ? (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                          <Paperclip className="size-3.5" />
                          {n.attachmentName}
                        </p>
                      ) : null}

                      <p className="mt-2 text-xs text-slate-400">
                        {n.postedBy?.name} ·{" "}
                        {n.publishedAt
                          ? formatDateTime(n.publishedAt)
                          : `drafted ${formatDateTime(n.createdAt)}`}
                      </p>

                      {n.status === "PUBLISHED" ? (
                        <div className="mt-2.5 max-w-xs">
                          <Progress
                            value={readPct}
                            size="xs"
                            label={`${n.readCount}/${memberCount} read`}
                          />
                        </div>
                      ) : null}
                    </div>

                    <RowActions>
                      <IconButton
                        variant="brand"
                        label="Edit notice"
                        disabled={busy}
                        onClick={() => setEditor({ ...n, attachmentUrl: n.attachmentUrl ?? "" })}
                      >
                        <Pencil />
                      </IconButton>

                      {n.status !== "PUBLISHED" ? (
                        <Button size="xs" disabled={busy} onClick={() => setStatus(n, "PUBLISHED")}>
                          <Send />
                          Publish
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => setStatus(n, "ARCHIVED")}
                        >
                          <Archive />
                          Archive
                        </Button>
                      )}

                      <IconButton
                        variant="danger"
                        label={n.status === "DRAFT" ? "Delete notice" : "Archive notice"}
                        disabled={busy}
                        onClick={() => {
                          setError(null);
                          setRemoving(n);
                        }}
                      >
                        <Trash2 />
                      </IconButton>
                    </RowActions>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        title={removing?.status === "DRAFT" ? "Delete this draft?" : "Delete this notice?"}
        confirmLabel={removing?.status === "DRAFT" ? "Delete draft" : "Delete notice"}
        description={
          <>
            <strong className="font-semibold text-slate-800">{removing?.title}</strong> will be
            removed from the society. This cannot be undone.
            {error ? <ErrorBanner className="mt-3" error={error} /> : null}
          </>
        }
      />

      <NoticeEditor notice={editor} onClose={() => setEditor(null)} />

      {published === 0 && notices.length > 0 ? (
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <Eye className="size-3.5" />
          Nothing is live for residents yet — publish a draft to get started.
        </p>
      ) : null}
    </div>
  );
}

function StatusFilter({ active }) {
  return (
    <FilterPills
      options={[
        { value: "ALL", label: "All", href: "/admin/notices", active: !active },
        ...Object.values(NOTICE_STATUS).map((s) => ({
          value: s,
          label: titleCase(s),
          href: `/admin/notices?status=${s}`,
          active: active === s,
        })),
      ]}
    />
  );
}

// ---------------------------------------------------------------------------

function NoticeEditor({ notice, onClose }) {
  const router = useRouter();
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [lastId, setLastId] = useState(undefined);

  const key = notice ? notice.id ?? "new" : null;
  if (key !== lastId) {
    setLastId(key);
    setForm(
      notice
        ? {
            title: notice.title ?? "",
            body: notice.body ?? "",
            category: notice.category ?? "GENERAL",
            status: notice.status ?? "DRAFT",
            attachmentUrl: notice.attachmentUrl ?? "",
            attachmentName: notice.attachmentName ?? "",
          }
        : BLANK
    );
    setError(null);
    setErrors({});
  }

  function set(keyName) {
    return (e) => setForm({ ...form, [keyName]: e.target.value });
  }

  async function submit(publish) {
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      const payload = {
        title: form.title,
        body: form.body,
        category: form.category,
        status: publish ? "PUBLISHED" : form.status,
        attachmentUrl: form.attachmentUrl || null,
        attachmentName: form.attachmentName || null,
      };
      if (notice?.id) await api.patch(`/api/notices/${notice.id}`, payload);
      else await api.post("/api/notices", payload);
      router.refresh();
      setLastId(undefined);
      onClose();
    } catch (err) {
      setError(err.message);
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={Boolean(notice)}
      onClose={onClose}
      size="lg"
      title={notice?.id ? "Edit notice" : "New notice"}
      description="Residents only see notices with the Published status."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {form.status === "PUBLISHED" ? (
            <Button onClick={() => submit(false)} loading={saving}>
              Save changes
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => submit(false)} loading={saving}>
                Save draft
              </Button>
              <Button onClick={() => submit(true)} loading={saving}>
                <Send />
                Publish now
              </Button>
            </>
          )}
        </>
      }
    >
      {notice ? (
        <div className="flex flex-col gap-4">
          <ErrorBanner error={error} />

          <Input
            id="title"
            label="Title"
            value={form.title}
            onChange={set("title")}
            error={errors.title}
            required
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              id="category"
              label="Category"
              value={form.category}
              onChange={set("category")}
              error={errors.category}
            >
              {Object.values(NOTICE_CATEGORY).map((c) => (
                <option key={c} value={c}>
                  {titleCase(c)}
                </option>
              ))}
            </Select>
            <Select
              id="status"
              label="Status"
              value={form.status}
              onChange={set("status")}
              error={errors.status}
            >
              {Object.values(NOTICE_STATUS).map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            id="body"
            label="Body"
            rows={7}
            value={form.body}
            onChange={set("body")}
            error={errors.body}
            required
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              id="attachmentUrl"
              label="Attachment URL"
              placeholder="https://..."
              value={form.attachmentUrl}
              onChange={set("attachmentUrl")}
              error={errors.attachmentUrl}
              hint="Optional"
            />
            <Input
              id="attachmentName"
              label="Attachment name"
              value={form.attachmentName}
              onChange={set("attachmentName")}
              error={errors.attachmentName}
              hint="Shown to residents"
            />
          </div>
        </div>
      ) : null}
    </Modal>
  );
}