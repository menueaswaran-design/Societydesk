"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Plus,
  UserCheck,
  MessagesSquare,
  Paperclip,
  Send,
} from "lucide-react";
import Button, { TextAction } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Table, { Tr, Td, RowActions } from "@/components/ui/Table";
import StatusBadge from "@/components/ui/StatusBadge";
import Badge from "@/components/ui/Badge";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { EmptyState, ErrorBanner, Loading } from "@/components/ui/Feedback";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import FilterPills from "@/components/ui/FilterPills";
import { api, fieldErrors } from "@/lib/client/api";
import {
  COMPLAINT_CATEGORY,
  COMPLAINT_PRIORITY,
  COMPLAINT_STATUS,
  COMPLAINT_TRANSITIONS,
} from "@/lib/constants";
import { formatDateTime, titleCase } from "@/lib/format";

export default function ComplaintsClient({ complaints, assignees, flats, filters }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return complaints;
    return complaints.filter((c) =>
      [c.title, c.description, c.flat?.flatNumber, c.flat?.block, c.createdBy?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [complaints, query]);

  const openComplaint = openId ? complaints.find((c) => c.id === openId) : null;

  return (
    <div className="stack">
      <PageHeader
        title="Complaints"
        description="Complaints raised by residents, with a full timeline on every one."
        meta={
          <span className="text-[11px] font-semibold text-slate-500">
            {visible.length}
            {complaints.length !== visible.length ? ` of ${complaints.length}` : ""} shown
            {filters.status ? ` · ${titleCase(filters.status)}` : ""}
          </span>
        }
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus />
            Log complaint
          </Button>
        }
      />

      <StatusFilter active={filters.status} />

      <div className="surface overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search title, flat or resident"
            className="w-full sm:max-w-sm"
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No complaints"
            description="Complaints raised by residents land here."
          />
        ) : (
          <Table
            dense
            head={[
              { label: "Complaint" },
              { label: "Flat" },
              { label: "Category", className: "hidden lg:table-cell" },
              { label: "Priority" },
              { label: "Raised by", className: "hidden md:table-cell" },
              { label: "Assigned to" },
              { label: "Status" },
              { label: "", align: "right" },
            ]}
          >
            {visible.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <button
                    onClick={() => setOpenId(c.id)}
                    className="text-left font-semibold text-slate-900 transition-colors hover:text-brand-700"
                  >
                    {c.title}
                  </button>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    {formatDateTime(c.createdAt)}
                    {c._count?.comments ? ` · ${c._count.comments} updates` : ""}
                  </span>
                </Td>
                <Td className="tabular">
                  {c.flat?.block ? `${c.flat.block}-` : ""}
                  {c.flat?.flatNumber}
                </Td>
                <Td className="hidden lg:table-cell">
                  <Badge>{titleCase(c.category)}</Badge>
                </Td>
                <Td>
                  <StatusBadge status={c.priority} />
                </Td>
                <Td className="hidden md:table-cell">{c.createdBy?.name}</Td>
                <Td>
                  {c.assignedTo?.name ? (
                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                      <UserCheck className="size-3.5 text-emerald-500" />
                      {c.assignedTo.name}
                    </span>
                  ) : (
                    <Badge tone="slate">Unassigned</Badge>
                  )}
                </Td>
                <Td>
                  <StatusBadge status={c.status} />
                </Td>
                <Td align="right">
                  <RowActions>
                    <TextAction onClick={() => setOpenId(c.id)}>Open</TextAction>
                  </RowActions>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </div>

      <ComplaintDetail
        summary={openComplaint}
        assignees={assignees}
        onClose={() => setOpenId(null)}
      />
      <CreateModal open={creating} onClose={() => setCreating(false)} flats={flats} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function StatusFilter({ active }) {
  return (
    <FilterPills
      options={[
        { value: "ALL", label: "All", href: "/admin/complaints", active: !active },
        ...Object.values(COMPLAINT_STATUS).map((s) => ({
          value: s,
          label: titleCase(s),
          href: `/admin/complaints?status=${s}`,
          active: active === s,
        })),
      ]}
    />
  );
}

// ---------------------------------------------------------------------------

function ComplaintDetail({ summary, assignees, onClose }) {
  const router = useRouter();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [assignTo, setAssignTo] = useState("");

  const id = summary?.id ?? null;

  // The list row carries no timeline, so pull the full record on open.
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/api/complaints/${id}`);
      setDetail(data);
      setAssignTo(data.assignedToId ?? "");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      setDetail(null);
      return;
    }
    setComment("");
    load();
  }, [id, load]);

  async function act(fn, after) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
      router.refresh();
      after?.();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const transitions = detail ? (COMPLAINT_TRANSITIONS[detail.status] ?? []) : [];

  return (
    <Modal
      open={Boolean(summary)}
      onClose={onClose}
      size="xl"
      title={summary?.title ?? ""}
      description={
        summary
          ? `${summary.flat?.block ? `${summary.flat.block}-` : ""}${summary.flat?.flatNumber} · ${titleCase(summary.category)} · ${titleCase(summary.priority)}`
          : ""
      }
    >
      {loading && !detail ? (
        <Loading label="Loading complaint" />
      ) : detail ? (
        <div className="space-y-5">
          <ErrorBanner error={error} onRetry={load} />

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={detail.status} />
            <StatusBadge status={detail.priority} />
            <span className="text-xs text-slate-500">
              Raised by {detail.createdBy?.name} on {formatDateTime(detail.createdAt)}
            </span>
          </div>

          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm whitespace-pre-wrap text-slate-700 ring-1 ring-slate-900/5">
            {detail.description}
          </p>

          {detail.attachments?.length ? (
            <div className="flex flex-wrap gap-2">
              {detail.attachments.map((a) => (
                <a
                  key={a.id}
                  href={a.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  <Paperclip className="size-3.5" />
                  {a.fileName}
                </a>
              ))}
            </div>
          ) : null}

          {/* ---------------------------------------------------- assignment */}
          <div className="overflow-hidden rounded-xl ring-1 ring-slate-900/5">
            <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
              <Select
                id="assignTo"
                label="Assigned to"
                className="min-w-52"
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
              >
                <option value="">Unassigned</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({titleCase(a.role)})
                  </option>
                ))}
              </Select>
              <Button
                variant="secondary"
                size="sm"
                loading={busy}
                disabled={assignTo === (detail.assignedToId ?? "")}
                onClick={() =>
                  act(() =>
                    api.post(`/api/complaints/${detail.id}/assign`, {
                      assignedToId: assignTo || null,
                    })
                  )
                }
              >
                <UserCheck />
                Save assignment
              </Button>
            </div>

            {/* ----------------------------------------------------- status */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
              <span className="text-xs font-semibold text-slate-600">Move to</span>
              {transitions.length === 0 ? (
                <span className="text-xs text-slate-400">No further transitions</span>
              ) : (
                transitions.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={s === "RESOLVED" ? "primary" : "secondary"}
                    disabled={busy}
                    onClick={() => act(() => api.post(`/api/complaints/${detail.id}/status`, { status: s }))}
                  >
                    {titleCase(s)}
                  </Button>
                ))
              )}
            </div>

            {/* --------------------------------------------------- timeline */}
            <div className="px-4 py-3">
              <p className="label-xs mb-3 flex items-center gap-1.5">
                <MessagesSquare className="size-3.5 text-brand-500" />
                Timeline
              </p>
              <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                {detail.comments.length === 0 ? (
                  <li className="text-sm text-slate-400">No entries yet.</li>
                ) : (
                  detail.comments.map((c) => (
                    <li key={c.id} className="relative">
                      <span className="absolute top-1.5 -left-[26px] size-2.5 rounded-full bg-brand-400 ring-4 ring-white" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-700">{c.comment}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {c.user?.name} · {titleCase(c.eventType)} ·{" "}
                          {formatDateTime(c.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ol>

              {detail.status !== "CLOSED" ? (
                <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4">
                  <Textarea
                    id="comment"
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add an update for the resident"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      disabled={comment.trim().length === 0}
                      loading={busy}
                      onClick={() =>
                        act(() =>
                          api.post(`/api/complaints/${detail.id}/comments`, {
                            comment: comment.trim(),
                          })
                        ).then(() => setComment(""))
                      }
                    >
                      <Send />
                      Post update
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <ErrorBanner error={error} onRetry={load} />
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------

function CreateModal({ open, onClose, flats }) {
  const router = useRouter();
  const [form, setForm] = useState({
    flatId: "",
    category: "PLUMBING",
    title: "",
    description: "",
    priority: "MEDIUM",
  });
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function set(key) {
    return (e) => setForm({ ...form, [key]: e.target.value });
  }

  async function submit() {
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      await api.post("/api/complaints", form);
      router.refresh();
      setForm({ flatId: "", category: "PLUMBING", title: "", description: "", priority: "MEDIUM" });
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
      open={open}
      onClose={onClose}
      title="Log a complaint"
      description="Record a complaint on behalf of a resident."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            Create complaint
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <ErrorBanner error={error} />

        <Select
          id="flatId"
          label="Flat"
          value={form.flatId}
          onChange={set("flatId")}
          error={errors.flatId}
          required
        >
          <option value="">Select a flat</option>
          {flats.map((f) => (
            <option key={f.id} value={f.id}>
              {f.block ? `${f.block}-` : ""}
              {f.flatNumber}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select id="category" label="Category" value={form.category} onChange={set("category")} error={errors.category}>
            {Object.values(COMPLAINT_CATEGORY).map((c) => (
              <option key={c} value={c}>
                {titleCase(c)}
              </option>
            ))}
          </Select>
          <Select id="priority" label="Priority" value={form.priority} onChange={set("priority")} error={errors.priority}>
            {Object.values(COMPLAINT_PRIORITY).map((p) => (
              <option key={p} value={p}>
                {titleCase(p)}
              </option>
            ))}
          </Select>
        </div>

        <Input
          id="title"
          label="Title"
          value={form.title}
          onChange={set("title")}
          error={errors.title}
          required
        />
        <Textarea
          id="description"
          label="Description"
          rows={4}
          value={form.description}
          onChange={set("description")}
          error={errors.description}
          required
        />

        <Badge tone="slate">Created as OPEN. Assign it from the complaint detail view.</Badge>
      </div>
    </Modal>
  );
}