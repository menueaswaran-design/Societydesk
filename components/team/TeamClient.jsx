"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Lock, UserMinus, ShieldCheck, Building2, Search } from "lucide-react";
import Button, { IconButton } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Table, { Tr, Td, RowActions } from "@/components/ui/Table";
import StatusBadge from "@/components/ui/StatusBadge";
import Badge from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import Avatar from "@/components/ui/Avatar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { api, fieldErrors } from "@/lib/client/api";
import { ROLES } from "@/lib/constants";
import { titleCase } from "@/lib/format";

const ROLE_TONE = {
  SUPER_ADMIN: "violet",
  OWNER: "brand",
  MANAGER: "blue",
  SOCIETY_ADMIN: "indigo",
  SECURITY_ADMIN: "amber",
  FLAT_ADMIN: "blue",
  RESIDENT: "slate",
};

const ROLE_OPTIONS = {
  super: [ROLES.MANAGER, ROLES.OWNER, ROLES.SUPER_ADMIN],
  society: [ROLES.FLAT_ADMIN],
};

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: ROLES.MANAGER,
  societyId: "",
  flatId: "",
};

/**
 * Admin onboarding UI shared by the platform console (super admin adds society
 * & security admins) and the society console (society admin adds flat admins).
 */
export default function TeamClient({ mode = "super", staff = [], societies = [], flats = [] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [removing, setRemoving] = useState(null);

  const isSuper = mode === "super";
  const roleOptions = ROLE_OPTIONS[isSuper ? "super" : "society"];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((s) =>
      [s.name, s.email, s.society?.name, s.flatResidents?.[0]?.flat?.flatNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [staff, query]);

  function openNew() {
    setForm({
      ...EMPTY,
      role: isSuper ? ROLES.MANAGER : ROLES.FLAT_ADMIN,
      societyId: isSuper ? (societies[0]?.id ?? "") : "",
      flatId: isSuper ? "" : (flats[0]?.id ?? ""),
    });
    setErrors({});
    setError(null);
    setOpen(true);
  }

  function set(key) {
    return (e) => setForm({ ...form, [key]: e.target.value });
  }

  async function save() {
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        password: form.password,
        role: form.role,
        societyId: isSuper && form.role !== ROLES.SUPER_ADMIN ? form.societyId : null,
        flatId: isSuper ? null : form.flatId,
      };
      await api.post("/api/staff", payload);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setError(null);
    try {
      await api.del(`/api/staff/${removing.id}`);
      setRemoving(null);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setRemoving(null);
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title={isSuper ? "PG Managers & Admins" : "Flat Admins"}
        description={
          isSuper
            ? "Manage PG Managers, property owners, and platform super administrators."
            : "Flat admins manage the residents of their assigned flat. Each gets their own sign-in."
        }
        meta={
          isSuper ? (
            <span className="text-[11px] font-semibold text-slate-500">
              <span className="text-brand-700">{staff.length} admin / manager{staff.length === 1 ? "" : "s"}</span> total
            </span>
          ) : null
        }
        actions={
          <Button onClick={openNew}>
            <Plus />
            {isSuper ? "Add Manager / Admin" : "Add flat admin"}
          </Button>
        }
      />

      <ErrorBanner error={error} />

      <div className="surface overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search name, email or society"
            className="w-full sm:max-w-sm"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={staff.length === 0 ? ShieldCheck : Search}
            title={staff.length === 0 ? (isSuper ? "No admins yet" : "No flat admins yet") : "No matches"}
            description={
              staff.length === 0
                ? "Use the button above to invite the first one."
                : "Try a different search term."
            }
            action={
              staff.length === 0 ? (
                <Button onClick={openNew}>
                  <Plus />
                  {isSuper ? "Add admin" : "Add flat admin"}
                </Button>
              ) : null
            }
          />
        ) : (
          <Table
            dense
            head={[
              { label: "Admin" },
              { label: "Role" },
              isSuper ? { label: "Assigned Property" } : { label: "Flat" },
              { label: "Status" },
              { label: "", align: "right" },
            ]}
          >
            {filtered.map((s) => {
              const flat = s.flatResidents?.[0]?.flat;
              return (
                <Tr key={s.id}>
                  <Td>
                    <span className="flex items-center gap-3">
                      <Avatar name={s.name} size="sm" />
                      <span>
                        <span className="block font-semibold text-slate-900">{s.name}</span>
                        <span className="block text-xs text-slate-500">{s.email}</span>
                      </span>
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={ROLE_TONE[s.role] ?? "slate"}>{titleCase(s.role)}</Badge>
                  </Td>
                  <Td>
                    {isSuper ? (
                      s.role === "SUPER_ADMIN" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-500/20">
                          👑 All Properties (Platform)
                        </span>
                      ) : s.society ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-800 font-medium text-xs">
                          <Building2 className="size-3.5 text-slate-400" />
                          {s.society.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )
                    ) : flat ? (
                      <span className="tabular font-medium text-slate-800">
                        {flat.block ? `${flat.block}-` : ""}
                        {flat.flatNumber}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>
                  <Td align="right">
                    <RowActions>
                      <IconButton
                        variant="warning"
                        label={`Remove ${s.name}`}
                        onClick={() => setRemoving(s)}
                        disabled={s.status !== "ACTIVE"}
                      >
                        <UserMinus />
                      </IconButton>
                    </RowActions>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isSuper ? (form.role === ROLES.SUPER_ADMIN ? "Add Super Admin" : "Add PG Manager / Owner") : "Add flat admin"}
        description={
          isSuper
            ? (form.role === ROLES.SUPER_ADMIN
                ? "Create a new Super Admin account with full platform-level privileges."
                : "Create a login account for a PG Manager or Owner to manage their property.")
            : "They sign in with this email and password. The account is linked to Firebase immediately."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {isSuper ? (form.role === ROLES.SUPER_ADMIN ? "Create Super Admin" : "Create PG Manager") : "Add flat admin"}
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
            placeholder="e.g. Ramesh Kumar"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              id="email"
              label="Email address"
              type="email"
              value={form.email}
              onChange={set("email")}
              error={errors.email}
              required
              placeholder="manager@pgname.com"
            />
            <Input
              id="phone"
              label="Phone number (optional)"
              value={form.phone}
              onChange={set("phone")}
              error={errors.phone}
              placeholder="9876543210"
            />
          </div>

          {isSuper ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                id="role"
                label="Account Role"
                value={form.role}
                onChange={set("role")}
                error={errors.role}
                required
              >
                <option value={ROLES.MANAGER}>PG Manager (Property Staff)</option>
                <option value={ROLES.OWNER}>PG Owner (Property Owner)</option>
                <option value={ROLES.SUPER_ADMIN}>Super Admin (Platform Administrator)</option>
              </Select>
              {form.role !== ROLES.SUPER_ADMIN ? (
                <Select
                  id="societyId"
                  label="Assigned PG Property"
                  value={form.societyId}
                  onChange={set("societyId")}
                  error={errors.societyId}
                  required
                >
                  <option value="">Select a PG property</option>
                  {societies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <div className="flex flex-col justify-end">
                  <div className="text-[11px] text-violet-800 bg-violet-50/80 p-2.5 rounded-lg border border-violet-200">
                    👑 Platform-wide administrator with access to all properties & analytics.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Select
              id="flatId"
              label="Flat this admin manages"
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
          )}

          <Input
            id="password"
            label="Temporary password"
            type="password"
            value={form.password}
            onChange={set("password")}
            error={errors.password}
            hint="Minimum 6 characters — share it with them to sign in."
            prefix={<Lock />}
            required
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        tone="warning"
        title="Remove this admin?"
        confirmLabel="Deactivate"
        description={
          <>
            <strong className="font-semibold text-slate-800">{removing?.name}</strong> will no
            longer be able to sign in. Their history stays intact.
            {error ? <ErrorBanner className="mt-3" error={error} /> : null}
          </>
        }
      />
    </div>
  );
}
