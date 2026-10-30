"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Power,
  Users,
  BedSingle,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Table, { Td } from "@/components/ui/Table";
import StatusBadge from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { Input, Select } from "@/components/ui/Input";
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
  adminPhone: "",
  adminRole: "MANAGER",
  bankName: "",
  bankAccountNo: "",
  bankIfsc: "",
  bankHolderName: "",
  upiId: "",
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
    return societies.filter((s) => {
      const managerName = s.users?.[0]?.name || "";
      const managerEmail = s.users?.[0]?.email || "";
      return [s.name, s.code, s.city, s.email, managerName, managerEmail]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [societies, query]);

  async function toggleStatus(society) {
    const next = society.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    if (
      next === "INACTIVE" &&
      !window.confirm(
        `Deactivate "${society.name}"? Its managers and residents will not be able to sign in. Financial records remain safe.`
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
      setError(err?.message || "Failed to update status");
    } finally {
      setBusyId(null);
    }
  }

  const active = societies.filter((s) => s.status === "ACTIVE").length;
  const totalRooms = societies.reduce((sum, s) => sum + (s._count?.units || 0), 0);
  const totalBeds = societies.reduce((sum, s) => sum + (s._count?.beds || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            PG & Coliving Properties
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Onboard PG properties, hostels, assign managers, and manage banking details
          </p>
        </div>
        <Button onClick={() => setEditor({ ...BLANK })}>
          <Plus className="size-4" />
          Onboard PG Property
        </Button>
      </header>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Properties" value={societies.length} icon={Building2} />
        <StatCard label="Active Properties" value={active} tone="green" />
        <StatCard
          label="Total Capacity"
          value={`${totalRooms} Rooms · ${totalBeds} Beds`}
          icon={BedSingle}
        />
      </div>

      <ErrorBanner error={error} />

      {/* Main Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {/* Search Bar */}
        <div className="border-b border-slate-100 p-3 sm:p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search property, manager, code, city..."
              className="w-full rounded-xl border border-slate-200 py-2 pr-3 pl-9 text-xs sm:text-sm placeholder:text-slate-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={societies.length === 0 ? "No PG properties onboarded yet" : "No matching properties"}
            description={
              societies.length === 0
                ? "Click Onboard PG Property above to create your first PG property with its manager."
                : "Try searching with a different property name, manager, or code."
            }
            action={
              societies.length === 0 ? (
                <Button onClick={() => setEditor({ ...BLANK })}>
                  <Plus className="size-4" />
                  Onboard PG Property
                </Button>
              ) : null
            }
          />
        ) : (
          <Table
            head={[
              { label: "PG Property" },
              { label: "Code" },
              { label: "Manager / Owner" },
              { label: "Capacity" },
              { label: "Bank / UPI" },
              { label: "Status" },
              { label: "", align: "right" },
            ]}
          >
            {visible.map((s) => {
              const busy = busyId === s.id;
              const manager = s.users?.[0];
              const hasBank = Boolean(s.upiId || s.bankAccountNo);

              return (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <Td>
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>{s.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="size-3 text-slate-400" />
                      <span>{[s.city, s.state].filter(Boolean).join(", ") || "Address pending"}</span>
                      <span>·</span>
                      <span>Added {formatDate(s.createdAt)}</span>
                    </div>
                  </Td>

                  <Td className="font-mono text-xs font-bold text-slate-700">
                    <span className="bg-slate-100 rounded px-1.5 py-0.5 border border-slate-200">
                      {s.code}
                    </span>
                  </Td>

                  <Td>
                    {manager ? (
                      <div>
                        <div className="font-medium text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{manager.name}</span>
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[9.5px] font-bold ${
                              manager.role === "OWNER"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {manager.role === "OWNER" ? "Owner" : "Manager"}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {manager.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No manager assigned</span>
                    )}
                  </Td>

                  <Td className="tabular text-xs font-medium text-slate-800">
                    <div>
                      <span className="font-bold text-slate-900">{s._count?.units || 0}</span> Rooms
                    </div>
                    <div className="text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700">{s._count?.beds || 0}</span> Beds
                    </div>
                  </Td>

                  <Td>
                    {hasBank ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                        <CheckCircle2 className="size-3" />
                        {s.upiId ? s.upiId : "Bank Configured"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-600/20">
                        <AlertTriangle className="size-3" />
                        Pending
                      </span>
                    )}
                  </Td>

                  <Td>
                    <StatusBadge status={s.status} />
                  </Td>

                  <Td align="right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setEditor(s)}
                        aria-label="Edit PG property"
                        disabled={busy}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50"
                        title="Edit PG property"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => toggleStatus(s)}
                        disabled={busy}
                        title={
                          s.status === "ACTIVE"
                            ? "Deactivate PG property"
                            : "Reactivate PG property"
                        }
                        className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${
                          s.status === "ACTIVE"
                            ? "text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                            : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                        }`}
                      >
                        <Power className="size-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>

      <PropertyEditor society={editor} onClose={() => setEditor(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// PG Property & Manager Onboarding Modal
// ---------------------------------------------------------------------------

function PropertyEditor({ society, onClose }) {
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
            adminPhone: "",
            adminRole: "MANAGER",
            bankName: society.bankName ?? "",
            bankAccountNo: society.bankAccountNo ?? "",
            bankIfsc: society.bankIfsc ?? "",
            bankHolderName: society.bankHolderName ?? "",
            upiId: society.upiId ?? "",
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

  async function submit(e) {
    e?.preventDefault?.();
    setSaving(true);
    setError(null);
    setErrors({});

    try {
      if (isEdit) {
        const payload = {
          name: form.name,
          code: form.code || undefined,
          address: form.address || null,
          city: form.city || null,
          state: form.state || null,
          pincode: form.pincode || null,
          phone: form.phone || null,
          email: form.email || null,
          bankName: form.bankName || null,
          bankAccountNo: form.bankAccountNo || null,
          bankIfsc: form.bankIfsc || null,
          bankHolderName: form.bankHolderName || null,
          upiId: form.upiId || null,
          status,
        };
        await api.patch(`/api/societies/${society.id}`, payload);
      } else {
        await api.post("/api/societies", {
          ...form,
          code: form.code?.trim() || undefined,
        });
      }
      router.refresh();
      setLastKey(undefined);
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to save property");
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
      title={isEdit ? "Edit PG Property" : "Onboard New PG Property"}
      description={
        isEdit
          ? "Update property details, address, or bank/UPI information."
          : "Add property details and create the login for the PG Manager / Owner. Address and bank details can be filled now or left for the manager to complete."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving} loading={saving}>
            {saving ? "Saving..." : isEdit ? "Save changes" : "Onboard PG Property"}
          </Button>
        </>
      }
    >
      {society ? (
        <form onSubmit={submit} className="flex flex-col gap-4 text-xs">
          <ErrorBanner error={error} />

          {/* Section 1: Property Profile */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              <Building2 className="size-4 text-brand-600" />
              <span>1. PG Property Profile</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="name"
                label="PG / Property Name"
                value={form.name}
                onChange={set("name")}
                error={errors.name}
                required
                placeholder="e.g. Sri Lakshmi Luxury PG"
              />
              <Input
                id="code"
                label="Property Code (optional)"
                value={form.code}
                onChange={set("code")}
                error={errors.code}
                placeholder="Auto-generated if empty (e.g. SLPG)"
                hint="Used on rent receipts and invoice identifiers"
              />
            </div>
          </div>

          {/* Section 2: Address & Location (Optional) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <MapPin className="size-4 text-slate-500" />
                <span>2. Property Address (Optional)</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Can be filled later</span>
            </div>

            <Input
              id="address"
              label="Street Address"
              value={form.address}
              onChange={set("address")}
              placeholder="e.g. 12, 4th Cross, Electronic City Phase 1"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                id="city"
                label="City"
                value={form.city}
                onChange={set("city")}
                placeholder="e.g. Bengaluru"
              />
              <Input
                id="state"
                label="State"
                value={form.state}
                onChange={set("state")}
                placeholder="e.g. Karnataka"
              />
              <Input
                id="pincode"
                label="Pincode"
                value={form.pincode}
                onChange={set("pincode")}
                placeholder="560100"
              />
            </div>
          </div>

          {/* Section 3: Manager / Owner Account (Onboard new) */}
          {!isEdit ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                <ShieldCheck className="size-4 text-indigo-600" />
                <span>3. PG Manager / Owner Sign-In Account</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  id="adminName"
                  label="Manager / Owner Name"
                  value={form.adminName}
                  onChange={set("adminName")}
                  error={errors.adminName}
                  required
                  placeholder="e.g. Suresh Reddy"
                />
                <Select
                  id="adminRole"
                  label="Role"
                  value={form.adminRole}
                  onChange={set("adminRole")}
                >
                  <option value="MANAGER">PG Manager (Daily operations & check-in)</option>
                  <option value="OWNER">PG Owner (Full control & financials)</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  id="adminEmail"
                  label="Manager Email (Login ID)"
                  type="email"
                  value={form.adminEmail}
                  onChange={set("adminEmail")}
                  error={errors.adminEmail}
                  required
                  placeholder="manager@pgproperty.com"
                />
                <Input
                  id="adminPhone"
                  label="Phone Number (optional)"
                  value={form.adminPhone}
                  onChange={set("adminPhone")}
                  placeholder="9876543210"
                />
              </div>

              <Input
                id="adminPassword"
                label="Initial Sign-In Password"
                type="text"
                value={form.adminPassword}
                onChange={set("adminPassword")}
                error={errors.adminPassword}
                required
                placeholder="Minimum 6 characters"
                hint="Share this temporary password with the manager for their first sign-in"
              />
            </div>
          ) : null}

          {/* Section 4: Bank & UPI Details (Optional) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <CreditCard className="size-4 text-emerald-600" />
                <span>{isEdit ? "2" : "4"}. Bank & UPI Details (Optional)</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Optional at creation</span>
            </div>

            <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-2.5 text-[11.5px] text-amber-900 flex items-start gap-2">
              <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                If bank and UPI details are not provided now, a warning will appear in the Manager dashboard prompting them to configure bank details before issuing invoices.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="upiId"
                label="UPI ID / VPA (for instant QR & rent links)"
                value={form.upiId}
                onChange={set("upiId")}
                placeholder="e.g. srilakshmipg@okaxis or 9876543210@upi"
              />
              <Input
                id="bankHolderName"
                label="Account Holder Name"
                value={form.bankHolderName}
                onChange={set("bankHolderName")}
                placeholder="e.g. Suresh Reddy"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                id="bankAccountNo"
                label="Account Number"
                value={form.bankAccountNo}
                onChange={set("bankAccountNo")}
                placeholder="e.g. 50100234567890"
              />
              <Input
                id="bankIfsc"
                label="IFSC Code"
                value={form.bankIfsc}
                onChange={set("bankIfsc")}
                placeholder="e.g. HDFC0001234"
              />
              <Input
                id="bankName"
                label="Bank Name"
                value={form.bankName}
                onChange={set("bankName")}
                placeholder="e.g. HDFC Bank"
              />
            </div>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
