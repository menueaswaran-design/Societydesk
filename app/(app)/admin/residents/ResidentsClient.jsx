"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Upload, Search, Pencil, LogOut, Users, CheckCircle2, FileSpreadsheet, ShieldCheck, ArrowRight, Wallet } from "lucide-react";
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
import RecordPaymentModal from "@/components/billing/RecordPaymentModal";
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

export default function ResidentsClient({
  residents,
  flats,
  userRole = "SOCIETY_ADMIN",
  totalSocietyFlats = 1,
}) {
  const router = useRouter();
  const isSocietyAdmin = userRole === "SOCIETY_ADMIN";
  const isFlatAdmin = userRole === "FLAT_ADMIN";
  const hasMultipleFlats = totalSocietyFlats > 1;
  const canDirectlyManageResidents = true; // Both Society Admin & Flat Admin can add and manage residents

  const [tab, setTab] = useState("list");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [vacating, setVacating] = useState(null);
  const [paymentResident, setPaymentResident] = useState(null);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const [filterBlock, setFilterBlock] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const blocks = useMemo(() => {
    const bSet = new Set();
    flats.forEach((f) => {
      if (f.block) bSet.add(f.block);
    });
    return Array.from(bSet).sort();
  }, [flats]);

  const activeCount = residents.filter((r) => r.status === "ACTIVE").length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return residents.filter((r) => {
      if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
      const primaryLink = r.flatResidents?.[0];
      if (filterType !== "ALL" && primaryLink?.residentType !== filterType) return false;
      if (filterBlock !== "ALL" && primaryLink?.flat?.block !== filterBlock) return false;
      if (!q) return true;
      return [r.name, r.email, r.phone, primaryLink?.flat?.flatNumber, primaryLink?.flat?.block]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [residents, query, filterStatus, filterType, filterBlock]);

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
      if (editingId) {
        await api.patch(`/api/residents/${editingId}`, payload);
        setOpen(false);
      } else {
        const res = await api.post("/api/residents", payload);
        setOpen(false);
        if (res?.temporaryPassword) {
          setCreatedCredentials({
            name: form.name,
            email: form.email,
            password: res.temporaryPassword,
          });
        }
      }
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
        title={isFlatAdmin ? "My Flat Residents" : "Residents"}
        description={
          isFlatAdmin
            ? "Manage residents occupying your assigned flat."
            : "Directory of residents across your society. Onboarded residents automatically receive login credentials."
        }
        meta={
          <span className="text-[11px] font-semibold text-slate-500">
            <span className="text-emerald-700">{activeCount} active</span> · {residents.length} total
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            {isSocietyAdmin && hasMultipleFlats ? (
              <Button variant="secondary" as="a" href="/admin/team">
                <ShieldCheck />
                Flat Admins
              </Button>
            ) : null}
            <Button onClick={openNew}>
              <Plus />
              Add resident
            </Button>
          </div>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        className="self-start"
        tabs={[
          { key: "list", label: "Residents", icon: Users, count: filtered.length },
          { key: "import", label: "Bulk import", icon: Upload },
        ]}
      />

      {tab === "import" ? (
        <ImportPanel onDone={() => { setTab("list"); router.refresh(); }} />
      ) : (
        <div className="surface overflow-hidden">
          <div className="border-b border-slate-100 p-4 flex flex-wrap items-center justify-between gap-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search name, email, phone or flat"
              className="w-full sm:max-w-xs"
            />

            <div className="flex flex-wrap items-center gap-2">
              {blocks.length > 0 ? (
                <select
                  value={filterBlock}
                  onChange={(e) => setFilterBlock(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="ALL">All Blocks</option>
                  {blocks.map((b) => (
                    <option key={b} value={b}>Block {b}</option>
                  ))}
                </select>
              ) : null}

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ALL">All Types</option>
                <option value="OWNER">Owners</option>
                <option value="TENANT">Tenants</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
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
            <>
              {/* Mobile Cards for Residents */}
              <div className="divide-y divide-slate-100 sm:hidden">
                {filtered.map((r) => {
                  const link = r.flatResidents[0];
                  return (
                    <div key={r.id} className="p-4 space-y-3 transition-colors hover:bg-slate-50/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={r.name} size="sm" />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 text-sm truncate">{r.name}</div>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                              {link ? (
                                <>
                                  <span className="font-medium text-slate-800">
                                    Flat {link.flat.block ? `${link.flat.block}-` : ""}{link.flat.flatNumber}
                                  </span>
                                  <span>•</span>
                                  <Badge tone={link.residentType === "OWNER" ? "brand" : "slate"} size="xs">
                                    {titleCase(link.residentType)}
                                  </Badge>
                                </>
                              ) : (
                                <span className="text-slate-400">No flat assigned</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                        <span className="truncate max-w-[200px] text-slate-700">{r.email}</span>
                        {r.phone ? (
                          <a href={`tel:${r.phone}`} className="font-mono font-medium text-brand-700 hover:underline">
                            {r.phone}
                          </a>
                        ) : (
                          <span className="text-slate-400">No phone</span>
                        )}
                      </div>

                      {canDirectlyManageResidents ? (
                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => setPaymentResident(r)}
                            className="text-xs h-7 px-2"
                          >
                            <Wallet className="size-3 text-emerald-600" />
                            Record Pay
                          </Button>
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => openEdit(r)}
                            className="text-xs h-7 px-2"
                          >
                            <Pencil className="size-3 text-slate-500" />
                            Edit
                          </Button>
                          {r.status === "ACTIVE" ? (
                            <IconButton
                              variant="warning"
                              size="xs"
                              label={`Vacate ${r.name}`}
                              onClick={() => setVacating(r)}
                            >
                              <LogOut className="size-3.5" />
                            </IconButton>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-[11px] font-medium text-slate-400 italic text-right">
                          Managed by Flat Admin
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table for Residents */}
              <div className="hidden sm:block">
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
                            <span className="tabular font-medium text-slate-800 whitespace-nowrap">
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
                          {canDirectlyManageResidents ? (
                            <RowActions>
                              <IconButton
                                variant="success"
                                label={`Record payment received from ${r.name}`}
                                onClick={() => setPaymentResident(r)}
                              >
                                <Wallet />
                              </IconButton>
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
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400 italic">Managed by Flat Admin</span>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </Table>
              </div>
            </>
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

      {paymentResident ? (
        <RecordPaymentModal
          open={Boolean(paymentResident)}
          onClose={() => setPaymentResident(null)}
          flatId={paymentResident.flatResidents[0]?.flat.id}
          flatLabel={
            paymentResident.flatResidents[0]?.flat
              ? `${paymentResident.flatResidents[0].flat.block ? `${paymentResident.flatResidents[0].flat.block}-` : ""}${paymentResident.flatResidents[0].flat.flatNumber}`
              : ""
          }
          residentName={paymentResident.name}
        />
      ) : null}

      {/* Account Created & Credentials Modal */}
      {createdCredentials ? (
        <Modal
          open={Boolean(createdCredentials)}
          onClose={() => setCreatedCredentials(null)}
          title="Resident Account Created"
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-emerald-950">
              <p className="font-semibold text-sm">Account Created in Firebase & Database!</p>
              <p className="text-xs text-emerald-800 mt-1">
                A welcome email with login details and password reset option was sent to <strong>{createdCredentials.email}</strong>.
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Resident:</span>
                <span className="font-semibold text-slate-800">{createdCredentials.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Email / Login ID:</span>
                <span className="font-semibold text-slate-800">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Temporary Password:</span>
                <span className="font-mono font-bold text-brand-700 text-sm select-all">{createdCredentials.password}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-normal">
              The resident can sign in using this temporary password or use the <strong>Forgot password</strong> link on the login page anytime.
            </p>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setCreatedCredentials(null)}>Done</Button>
            </div>
          </div>
        </Modal>
      ) : null}
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