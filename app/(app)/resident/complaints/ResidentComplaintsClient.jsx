"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Plus,
  MessagesSquare,
  Paperclip,
  CheckCircle,
  RotateCcw,
  Send,
  UserCheck,
} from "lucide-react";
import Button, { TextAction } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Table, { Tr, Td, RowActions } from "@/components/ui/Table";
import StatusBadge from "@/components/ui/StatusBadge";
import Badge from "@/components/ui/Badge";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { EmptyState, ErrorBanner, Loading } from "@/components/ui/Feedback";
import { CardNote } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import { api, fieldErrors } from "@/lib/client/api";
import { COMPLAINT_CATEGORY, COMPLAINT_PRIORITY } from "@/lib/constants";
import { formatDateTime, titleCase } from "@/lib/format";

export default function ResidentComplaintsClient({ complaints, flats = [], rooms = [] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return complaints;
    return complaints.filter((c) =>
      [c.title, c.description, c.flat?.flatNumber, c.flat?.block, c.unit?.unitNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [complaints, query]);

  const openCount = complaints.filter((c) => c.status !== "CLOSED").length;
  const awaitingYou = complaints.filter((c) => c.status === "RESOLVED").length;

  return (
    <div className="stack">
      <PageHeader
        title="My complaints"
        description="Report anything that needs fixing and follow it through to closure."
        meta={
          <span className="text-[11px] font-semibold text-slate-500">
            {complaints.length} raised · {openCount} in progress
          </span>
        }
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus />
            Raise complaint
          </Button>
        }
      />

      {awaitingYou > 0 ? (
        <CardNote tone="emerald" icon={CheckCircle} title="Waiting on your confirmation">
          The management marked {awaitingYou} {awaitingYou === 1 ? "complaint" : "complaints"} as
          resolved. Open {awaitingYou === 1 ? "it" : "them"} to confirm the fix or reopen.
        </CardNote>
      ) : null}

      <div className="surface overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search title, room or flat"
            className="w-full sm:max-w-sm"
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="No complaints raised"
            description="Report anything that needs fixing in your room or flat and track it here."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus />
                Raise your first complaint
              </Button>
            }
          />
        ) : (
          <>
            {/* Mobile Cards for Resident Complaints */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {visible.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setOpenId(c.id)}
                  className="p-4 space-y-2.5 transition-colors hover:bg-slate-50/50 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug hover:text-brand-700">
                      {c.title}
                    </h3>
                    <StatusBadge status={c.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <Badge tone="slate" size="xs">{titleCase(c.category)}</Badge>
                    {c.unit?.unitNumber ? (
                      <>
                        <span>•</span>
                        <span>Room {c.unit.unitNumber}</span>
                      </>
                    ) : c.flat?.flatNumber ? (
                      <>
                        <span>•</span>
                        <span>Flat {c.flat?.block ? `${c.flat.block}-` : ""}{c.flat.flatNumber}</span>
                      </>
                    ) : null}
                    <span>•</span>
                    <span>{formatDateTime(c.createdAt)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="text-slate-600">
                      {c.assignedTo?.name ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                          <UserCheck className="size-3.5 text-emerald-600" />
                          {c.assignedTo.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </div>
                    <span className="font-medium text-brand-700">
                      {c._count?.comments ? `${c._count.comments} updates` : "Details →"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table for Resident Complaints */}
            <div className="hidden sm:block">
              <Table
                dense
                head={[
                  { label: "Complaint" },
                  { label: "Unit / Room", className: "hidden sm:table-cell" },
                  { label: "Category", className: "hidden lg:table-cell" },
                  { label: "Raised", className: "hidden md:table-cell" },
                  { label: "Assigned to" },
                  { label: "Status" },
                  { label: "", align: "right" },
                ]}
              >
                {visible.map((c) => (
                  <Tr key={c.id}>
                    <Td dense>
                      <button
                        onClick={() => setOpenId(c.id)}
                        className="text-left font-semibold text-slate-900 transition-colors hover:text-brand-700"
                      >
                        {c.title}
                      </button>
                      <span className="mt-0.5 block text-xs text-slate-400">
                        {c._count?.comments ? `${c._count.comments} updates` : "No updates yet"}
                      </span>
                    </Td>
                    <Td dense className="hidden sm:table-cell whitespace-nowrap">
                      {c.unit?.unitNumber
                        ? `Room ${c.unit.unitNumber}`
                        : c.flat?.flatNumber
                        ? `${c.flat?.block ? `${c.flat.block}-` : ""}${c.flat?.flatNumber}`
                        : "—"}
                    </Td>
                    <Td dense className="hidden lg:table-cell">
                      <Badge>{titleCase(c.category)}</Badge>
                    </Td>
                    <Td dense className="hidden whitespace-nowrap text-xs text-slate-500 md:table-cell">
                      {formatDateTime(c.createdAt)}
                    </Td>
                    <Td dense>
                      {c.assignedTo?.name ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
                          <UserCheck className="size-3.5 text-emerald-600" />
                          {c.assignedTo.name}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Unassigned</span>
                      )}
                    </Td>
                    <Td dense>
                      <StatusBadge status={c.status} />
                    </Td>
                    <Td dense align="right">
                      <RowActions>
                        <TextAction onClick={() => setOpenId(c.id)}>Open</TextAction>
                      </RowActions>
                    </Td>
                  </Tr>
                ))}
              </Table>
            </div>
          </>
        )}
      </div>

      <DetailModal
        id={openId}
        onClose={() => setOpenId(null)}
        summary={complaints.find((c) => c.id === openId)}
      />

      <RaiseModal
        open={creating}
        onClose={() => setCreating(false)}
        flats={flats}
        rooms={rooms}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function DetailModal({ id, onClose, summary }) {
  const router = useRouter();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/api/complaints/${id}`);
      setDetail(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      load();
      setComment("");
    } else {
      setDetail(null);
    }
  }, [id, load]);

  async function act(run, refreshDetailOnly = false) {
    setBusy(true);
    setError(null);
    try {
      await run();
      await load();
      if (!refreshDetailOnly) router.refresh();
      setComment("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const resolved = detail?.status === "RESOLVED";

  const locLabel = summary?.unit?.unitNumber
    ? `Room ${summary.unit.unitNumber}`
    : summary?.flat?.flatNumber
    ? `${summary.flat?.block ? `${summary.flat.block}-` : ""}${summary.flat.flatNumber}`
    : "";

  return (
    <Modal
      open={Boolean(id)}
      onClose={onClose}
      title={summary?.title ?? "Complaint"}
      description={
        summary
          ? `${locLabel ? `${locLabel} · ` : ""}${titleCase(summary.category)}`
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
            <span className="text-xs text-slate-500">Raised {formatDateTime(detail.createdAt)}</span>
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
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  <Paperclip className="size-3.5" />
                  {a.fileName}
                </a>
              ))}
            </div>
          ) : null}

          {resolved ? (
            <div className="rounded-xl bg-emerald-50/70 px-4 py-3 ring-1 ring-emerald-200/80">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-900">
                <CheckCircle className="size-4" />
                Management marked this as resolved
              </p>
              <p className="mt-1 text-xs text-emerald-800">
                If the issue is fixed, close it. If it is still there, reopen it.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  loading={busy}
                  onClick={() =>
                    act(() =>
                      api.post(`/api/complaints/${detail.id}/status`, { status: "CLOSED" })
                    )
                  }
                >
                  <CheckCircle />
                  Issue fixed, close it
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={busy}
                  onClick={() =>
                    act(() =>
                      api.post(`/api/complaints/${detail.id}/status`, { status: "IN_PROGRESS" })
                    )
                  }
                >
                  <RotateCcw />
                  Still an issue, reopen
                </Button>
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl ring-1 ring-slate-900/5">
            <div className="px-4 py-3">
              <p className="label-xs mb-3 flex items-center gap-1.5">
                <MessagesSquare className="size-3.5 text-brand-500" />
                Updates
              </p>
              <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                {detail.comments?.length === 0 ? (
                  <li className="text-sm text-slate-400">No updates yet.</li>
                ) : (
                  detail.comments?.map((c) => (
                    <li key={c.id} className="relative">
                      <span className="absolute top-1.5 -left-[26px] size-2.5 rounded-full bg-brand-400 ring-4 ring-white" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-700">{c.comment}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {c.user?.name} · {formatDateTime(c.createdAt)}
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
                    placeholder="Add a comment for management"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      disabled={comment.trim().length === 0}
                      loading={busy}
                      onClick={() =>
                        act(
                          () =>
                            api.post(`/api/complaints/${detail.id}/comments`, {
                              comment: comment.trim(),
                            }),
                          true
                        )
                      }
                    >
                      <Send />
                      Post comment
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                  This complaint is closed. Reopen it from management if the issue returns.
                </p>
              )}
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

function RaiseModal({ open, onClose, flats = [], rooms = [] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    flatId: flats[0]?.id ?? "",
    unitId: rooms[0]?.id ?? "",
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
      const payload = { ...form };
      if (!payload.flatId) delete payload.flatId;
      if (!payload.unitId) delete payload.unitId;
      await api.post("/api/complaints", payload);
      router.refresh();
      setForm({ ...form, title: "", description: "", priority: "MEDIUM" });
      onClose();
    } catch (err) {
      setError(err.message);
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  const hasAccommodation = flats.length > 0 || rooms.length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Raise a complaint"
      description="Management will be notified and pick this up."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving} disabled={!hasAccommodation}>
            Submit complaint
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <ErrorBanner error={error} />

        {!hasAccommodation ? (
          <CardNote tone="amber" title="No accommodation linked">
            No flat or PG room is linked to your account, so a complaint cannot be filed. Contact your management.
          </CardNote>
        ) : (
          <>
            {rooms.length > 0 && flats.length === 0 ? (
              rooms.length > 1 ? (
                <Select
                  id="unitId"
                  label="Room"
                  value={form.unitId}
                  onChange={set("unitId")}
                  error={errors.unitId}
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-100">
                  Reporting for: <span className="font-semibold text-slate-900">{rooms[0].label}</span>
                </div>
              )
            ) : flats.length > 1 ? (
              <Select
                id="flatId"
                label="Flat"
                value={form.flatId}
                onChange={set("flatId")}
                error={errors.flatId}
              >
                {flats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.block ? `${f.block}-` : ""}
                    {f.flatNumber}
                  </option>
                ))}
              </Select>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                id="category"
                label="Category"
                value={form.category}
                onChange={set("category")}
                error={errors.category}
              >
                {Object.values(COMPLAINT_CATEGORY).map((c) => (
                  <option key={c} value={c}>
                    {titleCase(c)}
                  </option>
                ))}
              </Select>
              <Select
                id="priority"
                label="Priority"
                value={form.priority}
                onChange={set("priority")}
                error={errors.priority}
              >
                {Object.values(COMPLAINT_PRIORITY).map((p) => (
                  <option key={p} value={p}>
                    {titleCase(p)}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              id="title"
              label="Short title"
              placeholder="e.g. Geyser not heating, AC water leak"
              value={form.title}
              onChange={set("title")}
              error={errors.title}
              required
            />
            <Textarea
              id="description"
              label="What is the problem?"
              rows={4}
              placeholder="Explain what is broken, when it started, and any details to help fix it."
              value={form.description}
              onChange={set("description")}
              error={errors.description}
              required
            />
          </>
        )}
      </div>
    </Modal>
  );
}
