"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  UserMinus,
  ShieldCheck,
  Building2,
  Building,
  Search,
  Crown,
  Mail,
  Pencil,
  Check,
  Filter,
} from "lucide-react";
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
import AddPropertyModal from "@/components/properties/AddPropertyModal";
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

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: ROLES.MANAGER,
  societyId: "",
  societyIds: [],
  flatId: "",
};

/**
 * TeamClient manages:
 * - PG Managers & assignments across multiple PGs (mode === "pg")
 * - Platform admins (mode === "super")
 * - Apartment flat admins (mode === "society")
 */
export default function TeamClient({
  mode = "super",
  staff = [],
  societies = [],
  flats = [],
  userRole,
  currentSocietyId,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState("");
  const [removing, setRemoving] = useState(null);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);

  const isSuper = mode === "super";
  const isPg = mode === "pg";

  const filtered = useMemo(() => {
    let list = staff;

    // Filter by PG property if selected
    if (isPg && selectedPropertyFilter) {
      list = list.filter((s) => {
        const assignedIds =
          s.assignedSocieties?.map((as) => as.id) ||
          (s.societyId ? [s.societyId] : []);
        return assignedIds.includes(selectedPropertyFilter);
      });
    }

    const q = query.trim().toLowerCase();
    if (!q) return list;

    return list.filter((s) => {
      const assignedNames =
        s.assignedSocieties?.map((as) => as.name).join(" ") ||
        s.society?.name ||
        "";
      return [
        s.name,
        s.email,
        s.phone,
        assignedNames,
        s.society?.name,
        s.flatResidents?.[0]?.flat?.flatNumber,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [staff, query, isPg, selectedPropertyFilter]);

  function openNew() {
    setEditing(null);
    const initialSocietyIds = currentSocietyId
      ? [currentSocietyId]
      : societies[0]?.id
      ? [societies[0].id]
      : [];

    setForm({
      ...EMPTY,
      role: isSuper ? ROLES.MANAGER : isPg ? ROLES.MANAGER : ROLES.FLAT_ADMIN,
      societyId: isSuper ? societies[0]?.id ?? "" : "",
      societyIds: isPg ? initialSocietyIds : [],
      flatId: isSuper || isPg ? "" : flats[0]?.id ?? "",
    });
    setErrors({});
    setError(null);
    setOpen(true);
  }

  function openEdit(manager) {
    setEditing(manager);
    const assignedIds =
      manager.assignedSocieties?.map((s) => s.id) ||
      (manager.societyId ? [manager.societyId] : []);

    setForm({
      name: manager.name || "",
      email: manager.email || "",
      phone: manager.phone || "",
      password: "",
      role: manager.role || ROLES.MANAGER,
      societyId: manager.societyId || "",
      societyIds: assignedIds.length ? assignedIds : (currentSocietyId ? [currentSocietyId] : []),
      flatId: "",
    });
    setErrors({});
    setError(null);
    setOpen(true);
  }

  function set(key) {
    return (e) => setForm({ ...form, [key]: e.target.value });
  }

  function toggleSociety(societyId) {
    setForm((prev) => {
      const current = prev.societyIds || [];
      const exists = current.includes(societyId);
      const updated = exists
        ? current.filter((id) => id !== societyId)
        : [...current, societyId];
      return { ...prev, societyIds: updated };
    });
  }

  function toggleAllSocieties() {
    setForm((prev) => {
      const allIds = societies.map((s) => s.id);
      const isAll = (prev.societyIds || []).length === allIds.length;
      return {
        ...prev,
        societyIds: isAll ? (societies[0]?.id ? [societies[0].id] : []) : allIds,
      };
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    setErrors({});

    if (isPg && (!form.societyIds || !form.societyIds.length)) {
      setError("Please assign this manager to at least one PG property");
      setSaving(false);
      return;
    }

    try {
      if (editing) {
        // Update manager assignments & info
        await api.patch(`/api/staff/${editing.id}`, {
          name: form.name,
          phone: form.phone || null,
          societyIds: form.societyIds,
        });
      } else {
        // Create new manager / admin
        const payload = {
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          password: form.password,
          role: form.role,
          societyId:
            isSuper && form.role !== ROLES.SUPER_ADMIN
              ? form.societyId
              : isPg
              ? form.societyIds[0]
              : null,
          societyIds: isPg ? form.societyIds : undefined,
          flatId: isSuper || isPg ? null : form.flatId,
        };
        await api.post("/api/staff", payload);
      }
      setOpen(false);
      setEditing(null);
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
        title={isPg ? "PG Managers" : isSuper ? "PG Managers & Admins" : "Flat Admins"}
        description={
          isPg
            ? "Add and manage PG Managers for your properties. Managers can oversee rooms, residents, rent invoices, and complaints."
            : isSuper
            ? "Manage PG Managers, property owners, and platform super administrators."
            : "Flat admins manage the residents of their assigned flat. Each gets their own sign-in."
        }
        meta={
          isPg ? (
            <span className="text-[11.5px] font-semibold text-slate-500">
              <span className="text-brand-700 font-bold">
                {staff.length} manager{staff.length === 1 ? "" : "s"}
              </span>{" "}
              across{" "}
              <span className="text-slate-800 font-bold">
                {societies.length} PG propert{societies.length === 1 ? "y" : "ies"}
              </span>
            </span>
          ) : isSuper ? (
            <span className="text-[11px] font-semibold text-slate-500">
              <span className="text-brand-700">
                {staff.length} admin / manager{staff.length === 1 ? "" : "s"}
              </span>{" "}
              total
            </span>
          ) : null
        }
        actions={
          <div className="flex items-center gap-2">
            {isPg && (userRole === "OWNER" || !userRole) && (
              <Button variant="secondary" onClick={() => setPropertyModalOpen(true)}>
                <Building className="size-4" />
                Add PG Property
              </Button>
            )}
            <Button onClick={openNew}>
              <Plus />
              {isPg ? "Add PG Manager" : isSuper ? "Add Manager / Admin" : "Add flat admin"}
            </Button>
          </div>
        }
      />

      <ErrorBanner error={error} />

      <div className="surface overflow-hidden">
        {/* Search & Property Filter Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={
              isPg
                ? "Search manager name, email, phone, or PG property"
                : "Search name, email or society"
            }
            className="w-full sm:max-w-md"
          />

          {isPg && societies.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Filter className="size-3.5 text-slate-400" />
                Filter by PG:
              </span>
              <select
                value={selectedPropertyFilter}
                onChange={(e) => setSelectedPropertyFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">All PG Properties ({staff.length})</option>
                {societies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={staff.length === 0 ? ShieldCheck : Search}
            title={
              staff.length === 0
                ? isPg
                  ? "No PG managers yet"
                  : isSuper
                  ? "No admins yet"
                  : "No flat admins yet"
                : "No matches found"
            }
            description={
              staff.length === 0
                ? "Add your first PG manager to manage rooms, residents, and collections."
                : "Try a different search term or property filter."
            }
            action={
              staff.length === 0 ? (
                <Button onClick={openNew}>
                  <Plus />
                  {isPg ? "Add PG Manager" : isSuper ? "Add admin" : "Add flat admin"}
                </Button>
              ) : null
            }
          />
        ) : (
          <Table
            dense
            head={[
              { label: isPg ? "Manager" : "Admin" },
              { label: "Role" },
              isPg
                ? { label: "Assigned PG Properties" }
                : isSuper
                ? { label: "Assigned Property" }
                : { label: "Flat" },
              { label: "Status" },
              { label: "", align: "right" },
            ]}
          >
            {filtered.map((s) => {
              const flat = s.flatResidents?.[0]?.flat;
              const assignedProps = s.assignedSocieties || (s.society ? [s.society] : []);

              return (
                <Tr key={s.id}>
                  <Td>
                    <span className="flex items-center gap-3">
                      <Avatar name={s.name} size="sm" />
                      <span className="min-w-0">
                        <span className="block font-semibold text-slate-900 truncate">
                          {s.name}
                        </span>
                        <span className="block text-xs text-slate-500 truncate">{s.email}</span>
                        {s.phone ? (
                          <span className="block text-[11px] text-slate-400">{s.phone}</span>
                        ) : null}
                      </span>
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={ROLE_TONE[s.role] ?? "slate"}>
                      {s.role === "MANAGER" ? "PG Manager" : titleCase(s.role)}
                    </Badge>
                  </Td>
                  <Td>
                    {isPg ? (
                      assignedProps.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5 max-w-sm">
                          {assignedProps.map((prop) => (
                            <span
                              key={prop.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50/80 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-600/20 shadow-2xs"
                              title={prop.name}
                            >
                              <Building className="size-3 text-brand-600 shrink-0" />
                              <span className="truncate max-w-[140px]">{prop.name}</span>
                            </span>
                          ))}
                          {assignedProps.length > 1 ? (
                            <span className="text-[10.5px] font-bold text-slate-400">
                              ({assignedProps.length} PGs)
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )
                    ) : isSuper ? (
                      s.role === "SUPER_ADMIN" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-500/20">
                          <Crown className="size-3 text-violet-600 shrink-0" />
                          <span>All Properties (Platform)</span>
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
                      {isPg && (
                        <IconButton
                          label={`Edit ${s.name}`}
                          onClick={() => openEdit(s)}
                          disabled={s.status !== "ACTIVE"}
                        >
                          <Pencil className="size-3.5" />
                        </IconButton>
                      )}
                      <IconButton
                        variant="warning"
                        label={`Remove ${s.name}`}
                        onClick={() => setRemoving(s)}
                        disabled={s.status !== "ACTIVE"}
                      >
                        <UserMinus className="size-3.5" />
                      </IconButton>
                    </RowActions>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        )}
      </div>

      {/* Add / Edit PG Manager Modal */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={
          editing
            ? "Edit PG Manager"
            : isPg
            ? "Add PG Manager"
            : isSuper
            ? form.role === ROLES.SUPER_ADMIN
              ? "Add Super Admin"
              : "Add PG Manager / Owner"
            : "Add flat admin"
        }
        description={
          editing
            ? `Update property assignments and profile details for ${editing.name}.`
            : isPg
            ? "Create a login account for a PG manager to oversee rooms, occupants, and billing across your properties."
            : isSuper
            ? form.role === ROLES.SUPER_ADMIN
              ? "Create a new Super Admin account with full platform-level privileges."
              : "Create a login account for a PG Manager or Owner to manage their property."
            : "They sign in with this email and password. The account is linked to Firebase immediately."
        }
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false);
                setEditing(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {editing
                ? "Save Changes"
                : isPg
                ? "Create PG Manager"
                : isSuper
                ? form.role === ROLES.SUPER_ADMIN
                  ? "Create Super Admin"
                  : "Create PG Manager"
                : "Add flat admin"}
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
              disabled={Boolean(editing)}
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

          {/* Multi-PG Property Assignment Section */}
          {isPg ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800">
                    Assign to PG Properties <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Select which properties this manager can switch between and manage
                  </p>
                </div>
                {societies.length > 1 && (
                  <button
                    type="button"
                    onClick={toggleAllSocieties}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer"
                  >
                    {form.societyIds?.length === societies.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-52 overflow-y-auto pr-1">
                {societies.map((s) => {
                  const isChecked = form.societyIds?.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer transition-all ${
                        isChecked
                          ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500 shadow-2xs"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSociety(s.id)}
                        className="size-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-900">{s.name}</p>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">
                          {s.code || "PG Property"}
                        </p>
                      </div>
                      {isChecked && (
                        <Check className="size-3.5 text-brand-600 stroke-[2.5] shrink-0" />
                      )}
                    </label>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Managers assigned to multiple PGs can switch between properties anytime using the
                Property Switcher in the sidebar.
              </p>
            </div>
          ) : isSuper ? (
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
                    <div className="flex items-center gap-1.5">
                      <Crown className="size-3.5 text-violet-600 shrink-0" />
                      <span>Platform-wide administrator with access to all properties & analytics.</span>
                    </div>
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

          {!editing && (
            <div className="rounded-xl border border-blue-200/80 bg-blue-50/70 p-3 text-xs text-blue-900 flex items-start gap-2.5">
              <Mail className="size-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Auto-Generated Sign-In Password</span>
                <p className="text-[11.5px] text-blue-700 mt-0.5 leading-relaxed">
                  A secure temporary password will be automatically generated and emailed to{" "}
                  <strong className="text-blue-950 font-semibold">
                    {form.email || "their email address"}
                  </strong>{" "}
                  with direct portal login instructions.
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        tone="warning"
        title={isPg ? "Remove / Unassign Manager?" : "Remove this admin?"}
        confirmLabel="Deactivate / Unassign"
        description={
          <>
            <strong className="font-semibold text-slate-800">{removing?.name}</strong> will no
            longer be able to manage this property. Their activity history will remain intact.
            {error ? <ErrorBanner className="mt-3" error={error} /> : null}
          </>
        }
      />

      {isPg && (
        <AddPropertyModal
          open={propertyModalOpen}
          onClose={() => setPropertyModalOpen(false)}
          managers={staff}
        />
      )}
    </div>
  );
}
