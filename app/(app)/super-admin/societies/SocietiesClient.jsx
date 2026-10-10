"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building, Plus, Search, Pencil, Power, Lock } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Table, { Td } from "@/components/ui/Table";
import StatusBadge from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { Input } from "@/components/ui/Input";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import { api, fieldErrors } from "@/lib/client/api";
import { formatDate } from "@/lib/format";

const BLANK = {
  name: "",
  code: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  email: "",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
};

export default function SocietiesClient({ societies, admins }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return societies;
    return societies.filter((s) =>
      [s.name, s.code, s.city, s.email].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    );
  }, [societies, query]);

  async function toggleStatus(society) {
    const next = society.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (
      next === "INACTIVE" &&
      !window.confirm(
        `Deactivate "${society.name}"? Its admins and residents will no longer be able to sign in. Financial records are kept.`
      )
    ) {
      return;
    }
    setBusyId(society.id);
    setError(null);
    try {
      await api.del(`/api/societies/${society.id}`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const active = societies.filter((s) => s.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Societies</h1>
          <p className="text-sm text-slate-500">
            Each society is an isolated tenant with its own data
          </p>
        </div>
        <Button onClick={() => setEditor({ ...BLANK })}>
          <Plus className="h-4 w-4" />
          New society
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={societies.length} icon={Building} />
        <StatCard label="Active" value={active} tone="green" />
        <StatCard label="Inactive" value={societies.length - active} />
      </div>

      <ErrorBanner error={error} />

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, code or city"
              className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-8 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={Building}
            title={societies.length === 0 ? "No societies yet" : "Nothing matches"}
            description={
              societies.length === 0
                ? "Create a society to onboard its flats, residents and billing."
                : "Try a different search term."
            }
            action={
              societies.length === 0 ? (
                <Button onClick={() => setEditor({ ...BLANK })}>
                  <Plus className="h-4 w-4" />
                  Create society
                </Button>
              ) : null
            }
          />
        ) : (
          <Table
            head={[
              { label: "Society" },
              { label: "Code" },
              { label: "Location" },
              { label: "Admins" },
              { label: "Flats" },
              { label: "Invoices" },
              { label: "Status" },
              { label: "", align: "right" },
            ]}
          >
            {visible.map((s) => {
              const busy = busyId === s.id;
              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <Td>
                    <span className="font-medium text-slate-900">{s.name}</span>
                    <span className="block text-xs text-slate-400">
                      Created {formatDate(s.createdAt)}
                    </span>
                  </Td>
                  <Td className="font-mono text-xs">{s.code}</Td>
                  <Td className="text-xs text-slate-500">
                    {[s.city, s.state].filter(Boolean).join(", ") || "-"}
                  </Td>
                  <Td className="tabular">{s._count.users}</Td>
                  <Td className="tabular">{s._count.flats}</Td>
                  <Td className="tabular">{s._count.invoices}</Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditor(s)}
                        aria-label="Edit society"
                        disabled={busy}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleStatus(s)}
                        disabled={busy}
                        title={
                          s.status === "ACTIVE" ? "Deactivate society" : "Reactivate society"
                        }
                        className={`rounded-md p-1.5 disabled:opacity-50 ${
                          s.status === "ACTIVE"
                            ? "text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                            : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                        }`}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>

      {admins.length === 0 ? (
        <p className="text-xs text-slate-500">
          No society admins exist yet. Set an admin name, email and password when creating a
          society and the login account is created with it.
        </p>
      ) : (
        <p className="text-xs text-slate-500">{admins.length} society admins across all tenants.</p>
      )}

      <SocietyEditor society={editor} onClose={() => setEditor(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------

function SocietyEditor({ society, onClose }) {
  const router = useRouter();
  const [form, setForm] = useState(BLANK);
  const [status, setStatus] = useState("ACTIVE");
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [lastKey, setLastKey] = useState(undefined);

  const isEdit = Boolean(society?.id);
  const key = society ? (society.id ?? "new") : null;
  if (key !== lastKey) {
    setLastKey(key);
    setForm(
      society
        ? {
            name: society.name ?? "",
            code: society.code ?? "",
            address: society.address ?? "",
            city: society.city ?? "",
            state: society.state ?? "",
            pincode: society.pincode ?? "",
            phone: society.phone ?? "",
            email: society.email ?? "",
            adminName: "",
            adminEmail: "",
            adminPassword: "",
          }
        : BLANK
    );
    setStatus(society?.status ?? "ACTIVE");
    setError(null);
    setErrors({});
  }

  function set(keyName) {
    return (e) => setForm({ ...form, [keyName]: e.target.value });
  }

  async function submit() {
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      if (isEdit) {
        const payload = {
          name: form.name,
          code: form.code,
          address: form.address || null,
          city: form.city || null,
          state: form.state || null,
          pincode: form.pincode || null,
          phone: form.phone || null,
          email: form.email,
          status,
        };
        await api.patch(`/api/societies/${society.id}`, payload);
      } else {
        await api.post("/api/societies", form);
      }
      router.refresh();
      setLastKey(undefined);
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
      open={Boolean(society)}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Edit society" : "New society"}
      description={
        isEdit
          ? "Changing the code affects new invoice and receipt numbers."
            : "Create the society and its first admin. The email and password you set here become the admin's sign-in credentials."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving" : isEdit ? "Save changes" : "Create society"}
          </Button>
        </>
      }
    >
      {society ? (
        <div className="flex flex-col gap-4">
          <ErrorBanner error={error} />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="name"
              label="Society name"
              value={form.name}
              onChange={set("name")}
              error={errors.name}
              required
            />
            <Input
              id="code"
              label="Code"
              value={form.code}
              onChange={set("code")}
              error={errors.code}
              placeholder="GVA"
              hint="Used in invoice numbers"
              required
            />
          </div>

          <Input
            id="address"
            label="Address"
            value={form.address}
            onChange={set("address")}
            error={errors.address}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input id="city" label="City" value={form.city} onChange={set("city")} error={errors.city} />
            <Input id="state" label="State" value={form.state} onChange={set("state")} error={errors.state} />
            <Input id="pincode" label="Pincode" value={form.pincode} onChange={set("pincode")} error={errors.pincode} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input id="phone" label="Phone" value={form.phone} onChange={set("phone")} error={errors.phone} />
            <Input
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={set("email")}
              error={errors.email}
            />
          </div>

          {isEdit ? (
            <div>
              <p className="mb-1 block text-xs font-medium text-slate-700">Status</p>
              <div className="flex gap-2">
                {["ACTIVE", "INACTIVE"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                      status === s
                        ? "bg-brand-50 text-brand-700 ring-brand-200"
                        : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {s === "ACTIVE" ? "Active" : "Inactive"}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="border-t border-slate-200 pt-4">
                <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  First admin (optional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    id="adminName"
                    label="Admin name"
                    value={form.adminName}
                    onChange={set("adminName")}
                    error={errors.adminName}
                  />
                  <Input
                    id="adminEmail"
                    label="Admin email"
                    type="email"
                    value={form.adminEmail}
                    onChange={set("adminEmail")}
                    error={errors.adminEmail}
                    hint="They sign in with this"
                  />
                </div>
                <div className="mt-3">
                  <Input
                    id="adminPassword"
                    label="Admin password"
                    type="password"
                    autoComplete="new-password"
                    value={form.adminPassword}
                    onChange={set("adminPassword")}
                    error={errors.adminPassword}
                    hint="Min 6 characters — this becomes their login"
                    prefix={<Lock />}
                  />
                </div>
              </div>

              <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                All three admin fields are needed to create the login. Leave them blank to add an
                admin later.
              </p>
            </>
          )}
        </div>
      ) : null}
    </Modal>
  );
}