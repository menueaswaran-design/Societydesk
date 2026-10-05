"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, Search, Pencil, LogOut, Users, CheckCircle2, FileSpreadsheet } from "lucide-react";
import Button, { IconButton } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Table, { Tr, Td, RowActions } from "@/components/ui/Table";
import StatusBadge from "@/components/ui/StatusBadge";
import Badge from "@/components/ui/Badge";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/Input";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import { Card, CardNote } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import Tabs from "@/components/ui/Tabs";
import Avatar from "@/components/ui/Avatar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { api, fieldErrors } from "@/lib/client/api";
import { RESIDENT_TYPE } from "@/lib/constants";
import { titleCase } from "@/lib/format";

const CSV_TEMPLATE = `Flat,Block,Name,Phone,Email,Type
A101,A,Ravi Kumar,9876543210,ravi@email.com,OWNER
A102,A,Kumar,9876543211,kumar@email.com,OWNER
A103,A,Arun Prasad,9876543212,arun@email.com,TENANT`;

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  flatId: "",
  residentType: "OWNER",
  isPrimary: true,
};

export default function ResidentsClient({ residents, flats }) {
  const router = useRouter();
  const [tab, setTab] = useState("list");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [vacating, setVacating] = useState(null);

  const activeCount = residents.filter((r) => r.status === "ACTIVE").length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return residents;
    return residents.filter((r) =>
      [r.name, r.email, r.phone, ...r.flatResidents.map((f) => f.flat.flatNumber)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [residents, query]);

  function openNew() {
    setForm({ ...EMPTY, flatId: flats[0]?.id ?? "" });
    setEditingId(null);
    setErrors({});
    setError(null);
    setOpen(true);
  }

  function openEdit(r) {
    const link = r.flatResidents[0];
    setForm({
      name: r.name,
      email: r.email,
      phone: r.phone ?? "",
      flatId: link?.flat.id ?? "",
      residentType: link?.residentType ?? "OWNER",
      isPrimary: link?.isPrimary ?? true,
    });
    setEditingId(r.id);
    setErrors({});
    setError(null);
    setOpen(true);
  }

  function set(key) {
    return (e) => {
      const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm({ ...form, [key]: value });
    };
  }

  async function save() {
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      const payload = { ...form, phone: form.phone || null };
      if (editingId) await api.patch(`/api/residents/${editingId}`, payload);
      else await api.post("/api/residents", payload);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  async function vacate() {
    setError(null);
    try {
      await api.del(`/api/residents/${vacating.id}`);
      setVacating(null);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setVacating(null);
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Residents"
        description="Everyone who lives in your society. They sign in with the email you record here."
        meta={
          <span className="text-[11px] font-semibold text-slate-500">
            <span className="text-emerald-700">{activeCount} active</span> · {residents.length} total
          </span>
        }
        actions={
          <Button onClick={openNew}>
            <Plus />
            Add resident
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        className="self-start"
        tabs={[
          { key: "list", label: "Residents", icon: Users, count: residents.length },
          { key: "import", label: "Bulk import", icon: Upload },
        ]}
      />

      {tab === "import" ? (
        <ImportPanel onDone={() => { setTab("list"); router.refresh(); }} />
      ) : (
        <div className="surface overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search name, email, phone or flat"
              className="w-full sm:max-w-sm"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={residents.length === 0 ? Users : Search}
              title={residents.length === 0 ? "No residents yet" : "No matching residents"}
              description={
                residents.length === 0
                  ? "Add residents one by one, or import a CSV."
                  : "Try a different search term."
              }
              action={
                residents.length === 0 ? (
                  <div className="flex gap-2">
                    <Button onClick={openNew}>
                      <Plus />
                      Add resident
                    </Button>
                    <Button variant="secondary" onClick={() => setTab("import")}>
                      <Upload />
                      Import CSV
                    </Button>
                  </div>
                ) : (
                  <Button variant="secondary" onClick={() => setQuery("")}>
                    Clear search
                  </Button>
                )
              }
            />
          ) : (
            <Table
              dense
              head={[
                { label: "Resident" },
                { label: "Contact", className: "hidden sm:table-cell" },
                { label: "Flat" },
                { label: "Type", className: "hidden md:table-cell" },
                { label: "Status" },
                { label: "", align: "right" },
              ]}
            >
              {filtered.map((r) => {
                const link = r.flatResidents[0];
                return (
                  <Tr key={r.id}>
                    <Td>
                      <span className="flex items-center gap-3">
                        <Avatar name={r.name} size="sm" />
                        <span className="font-semibold text-slate-900">{r.name}</span>
                      </span>
                    </Td>
                    <Td className="hidden sm:table-cell">
                      <span className="block truncate text-slate-700">{r.email}</span>
                      {r.phone ? (
                        <span className="tabular block text-xs text-slate-500">{r.phone}</span>
                      ) : null}
                    </Td>
                    <Td>
                      {link ? (
                        <span className="tabular font-medium text-slate-800">
                          {link.flat.block ? `${link.flat.block}-` : ""}
                          {link.flat.flatNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </Td>
                    <Td className="hidden md:table-cell">
                      {link ? (
                        <Badge tone={link.residentType === "OWNER" ? "brand" : "slate"} dot>
                          {titleCase(link.residentType)}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </Td>
                    <Td>
                      <StatusBadge status={r.status} />
                    </Td>
                    <Td align="right">
                      <RowActions>
                        <IconButton variant="brand" label={`Edit ${r.name}`} onClick={() => openEdit(r)}>
                          <Pencil />
                        </IconButton>
                        {r.status === "ACTIVE" ? (
                          <IconButton
                            variant="warning"
                            label={`Vacate ${r.name}`}
                            onClick={() => setVacating(r)}
                          >
                            <LogOut />
                          </IconButton>
                        ) : null}
                      </RowActions>
                    </Td>
                  </Tr>
                );
              })}
            </Table>
          )}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Edit resident" : "Add resident"}
        description="They sign in with this email and are linked automatically on first login."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {editingId ? "Save changes" : "Add resident"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <ErrorBanner error={error} />

          <Input
            id="name"
            label="Full name"
            value={form.name}
            onChange={set("name")}
            error={errors.name}
            required
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={set("email")}
              error={errors.email}
              required
            />
            <Input
              id="phone"
              label="Phone"
              value={form.phone}
              onChange={set("phone")}
              error={errors.phone}
              placeholder="9876543210"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              id="flatId"
              label="Flat"
              value={form.flatId}
              onChange={set("flatId")}
              error={errors.flatId}
            >
              <option value="">Select a flat</option>
              {flats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.block ? `${f.block}-` : ""}
                  {f.flatNumber}
                </option>
              ))}
            </Select>
            <Select
              id="residentType"
              label="Resident type"
              value={form.residentType}
              onChange={set("residentType")}
            >
              {Object.values(RESIDENT_TYPE).map((t) => (
                <option key={t} value={t}>
                  {titleCase(t)}
                </option>
              ))}
            </Select>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-900/5">
            <Checkbox
              id="isPrimary"
              checked={form.isPrimary}
              onChange={set("isPrimary")}
              label="Primary contact for this flat"
              description="Only one primary per flat receives payment reminders."
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(vacating)}
        onClose={() => setVacating(null)}
        onConfirm={vacate}
        tone="warning"
        title="Mark this resident as vacated?"
        confirmLabel="Mark vacated"
        description={
          <>
            <strong className="font-semibold text-slate-800">{vacating?.name}</strong> will stop
            appearing on new invoices. Their billing history stays intact.
            {error ? <ErrorBanner className="mt-3" error={error} /> : null}
          </>
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function ImportPanel({ onDone }) {
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  function parse() {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      setError("Include a header row and at least one data row");
      setRows([]);
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const required = ["flat", "name", "email"];
    const missing = required.filter((r) => !headers.some((h) => h.startsWith(r)));
    if (missing.length) {
      setError(`Missing column(s): ${missing.join(", ")}`);
      setRows([]);
      return;
    }

    const idx = {
      flat: headers.findIndex((h) => h.startsWith("flat")),
      block: headers.findIndex((h) => h.startsWith("block")),
      name: headers.findIndex((h) => h.startsWith("name")),
      phone: headers.findIndex((h) => h.startsWith("phone")),
      email: headers.findIndex((h) => h.startsWith("email")),
      type: headers.findIndex((h) => h.startsWith("type")),
    };

    const parsed = lines.slice(1).map((line) => {
      const cells = line.split(",").map((c) => c.trim());
      return {
        flatNumber: cells[idx.flat] ?? "",
        block: idx.block >= 0 ? cells[idx.block] || null : null,
        name: cells[idx.name] ?? "",
        phone: idx.phone >= 0 ? cells[idx.phone] || null : null,
        email: cells[idx.email] ?? "",
        residentType:
          (idx.type >= 0 ? (cells[idx.type] || "").toUpperCase() : "") === "TENANT" ? "TENANT" : "OWNER",
      };
    });

    const blank = parsed.findIndex((p) => !p.flatNumber || !p.name || !p.email);
    if (blank >= 0) {
      setError(`Row ${blank + 2}: flat, name and email are all required`);
      setRows([]);
      return;
    }

    setError(null);
    setRows(parsed);
  }

  async function runImport() {
    setSaving(true);
    setError(null);
    try {
      await api.post("/api/residents/import", { rows });
      onDone();
    } catch (err) {
      // The server rejects the whole batch and returns per-row problems.
      const first = Array.isArray(err.details) ? err.details[0]?.message : null;
      setError(first ? `${err.message} ${first}` : err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <FileSpreadsheet className="size-4.5" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Bulk import</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Paste CSV rows. The import is all-or-nothing — if any row fails validation, nothing is
              written.
            </p>
          </div>
        </div>

        <details className="group mt-4">
          <summary className="cursor-pointer text-xs font-semibold text-brand-700 hover:text-brand-800">
            Expected format
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-900/5">
            {CSV_TEMPLATE}
          </pre>
        </details>

        <Textarea
          className="mt-4"
          label="CSV data"
          mono
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={CSV_TEMPLATE}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={parse} disabled={!text.trim()}>
            <Search />
            Validate &amp; preview
          </Button>
          <Button onClick={runImport} disabled={!rows.length} loading={saving}>
            {rows.length ? `Import ${rows.length} resident${rows.length === 1 ? "" : "s"}` : "Import"}
          </Button>
        </div>

        {error ? <ErrorBanner className="mt-4" error={error} /> : null}
      </Card>

      {rows.length ? (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
            <CheckCircle2 className="size-4 text-emerald-500" />
            <p className="text-sm font-semibold text-slate-800">
              {rows.length} row{rows.length === 1 ? "" : "s"} ready to import
            </p>
          </div>
          <Table
            dense
            head={[
              { label: "Flat" },
              { label: "Block" },
              { label: "Name" },
              { label: "Email", className: "hidden sm:table-cell" },
              { label: "Type", align: "right" },
            ]}
          >
            {rows.map((r, i) => (
              <Tr key={i}>
                <Td className="tabular font-semibold text-slate-900">{r.flatNumber}</Td>
                <Td>{r.block ?? "-"}</Td>
                <Td>{r.name}</Td>
                <Td className="hidden truncate sm:table-cell">{r.email}</Td>
                <Td align="right">
                  <Badge tone={r.residentType === "OWNER" ? "brand" : "slate"}>
                    {titleCase(r.residentType)}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Table>
        </Card>
      ) : (
        <CardNote tone="slate" icon={Upload}>
          Nothing to preview yet. Paste your CSV above and choose <strong>Validate &amp; preview</strong>.
        </CardNote>
      )}
    </div>
  );
}