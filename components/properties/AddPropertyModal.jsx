"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Building, MapPin, Users, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ErrorBanner } from "@/components/ui/Feedback";
import { api, fieldErrors } from "@/lib/client/api";

const BLANK_PROPERTY = {
  name: "",
  code: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  managerIds: [],
  setAsActive: true,
};

export default function AddPropertyModal({ open, onClose, managers = [] }) {
  const router = useRouter();
  const [form, setForm] = useState(BLANK_PROPERTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  function toggleManager(managerId) {
    setForm((prev) => {
      const current = prev.managerIds || [];
      const updated = current.includes(managerId)
        ? current.filter((id) => id !== managerId)
        : [...current, managerId];
      return { ...prev, managerIds: updated };
    });
  }

  async function submit(e) {
    e?.preventDefault?.();
    setSaving(true);
    setError(null);
    setErrors({});

    try {
      const payload = {
        name: form.name.trim(),
        code: form.code?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        email: form.email?.trim() || undefined,
        address: form.address?.trim() || undefined,
        city: form.city?.trim() || undefined,
        state: form.state?.trim() || undefined,
        pincode: form.pincode?.trim() || undefined,
        managerIds: form.managerIds?.length ? form.managerIds : undefined,
        setAsActive: Boolean(form.setAsActive),
      };

      await api.post("/api/societies", payload);

      setForm(BLANK_PROPERTY);
      onClose();

      if (form.setAsActive) {
        // Reload to immediately activate new PG workspace
        window.location.reload();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err?.message || "Failed to add PG property");
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Add New PG Property"
      description="Create a new PG or coliving property. You will automatically be assigned as its owner."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            Create PG Property
          </Button>
        </>
      }
    >
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
              id="pg_name"
              label="PG / Property Name"
              value={form.name}
              onChange={set("name")}
              error={errors.name}
              required
              placeholder="e.g. Sri Lakshmi Luxury PG"
            />
            <Input
              id="pg_code"
              label="Property Code (optional)"
              value={form.code}
              onChange={set("code")}
              error={errors.code}
              placeholder="Auto-generated if empty (e.g. SLPG)"
              hint="Used on rent receipts and invoice identifiers"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="pg_phone"
              label="Contact Phone (optional)"
              value={form.phone}
              onChange={set("phone")}
              error={errors.phone}
              placeholder="e.g. 9876543210"
            />
            <Input
              id="pg_email"
              label="Contact Email (optional)"
              type="email"
              value={form.email}
              onChange={set("email")}
              error={errors.email}
              placeholder="e.g. contact@pgname.com"
            />
          </div>
        </div>

        {/* Section 2: Address (Optional) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <MapPin className="size-4 text-slate-500" />
              <span>2. Address & Location (Optional)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Can be filled later</span>
          </div>

          <Input
            id="pg_address"
            label="Street Address"
            value={form.address}
            onChange={set("address")}
            placeholder="e.g. 12, 4th Cross, Electronic City Phase 1"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              id="pg_city"
              label="City"
              value={form.city}
              onChange={set("city")}
              placeholder="e.g. Bengaluru"
            />
            <Input
              id="pg_state"
              label="State"
              value={form.state}
              onChange={set("state")}
              placeholder="e.g. Karnataka"
            />
            <Input
              id="pg_pincode"
              label="Pincode"
              value={form.pincode}
              onChange={set("pincode")}
              placeholder="560100"
            />
          </div>
        </div>

        {/* Section 3: Assign Existing Managers (Optional) */}
        {managers && managers.length > 0 && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-100 pb-1.5">
              <Users className="size-4 text-indigo-600" />
              <span>3. Assign PG Managers (Optional)</span>
            </div>

            <p className="text-[11.5px] text-slate-500">
              Select existing managers who should also manage this new PG property:
            </p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-40 overflow-y-auto pr-1">
              {managers.map((m) => {
                const isChecked = form.managerIds?.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-2.5 rounded-xl border p-2 cursor-pointer transition-all ${
                      isChecked
                        ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-500 shadow-2xs"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleManager(m.id)}
                      className="size-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-900">{m.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{m.email}</p>
                    </div>
                    {isChecked && (
                      <Check className="size-3.5 text-brand-600 stroke-[2.5] shrink-0" />
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick preference: Switch to new property immediately */}
        <label className="flex items-center gap-2.5 pt-2 cursor-pointer border-t border-slate-100">
          <input
            type="checkbox"
            checked={form.setAsActive}
            onChange={(e) => setForm({ ...form, setAsActive: e.target.checked })}
            className="size-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
          />
          <span className="text-xs font-medium text-slate-700">
            Switch to this PG property immediately after creating
          </span>
        </label>
      </form>
    </Modal>
  );
}
