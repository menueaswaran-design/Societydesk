"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Power,
  CreditCard,
  QrCode,
  Building,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Sparkles,
} from "lucide-react";
import Button, { IconButton } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Table, { Tr, Td, RowActions } from "@/components/ui/Table";
import StatusBadge from "@/components/ui/StatusBadge";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/Input";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { api, fieldErrors } from "@/lib/client/api";
import { CALCULATION_TYPE, CHARGE_TYPE, FREQUENCY } from "@/lib/constants";
import { formatMoney, titleCase } from "@/lib/format";

const EMPTY = {
  name: "",
  type: "MAINTENANCE",
  calculationType: "FIXED",
  amount: "",
  rate: "",
  frequency: "MONTHLY",
  appliesToParkingOnly: false,
  active: true,
  flatTypeAmountsText: "",
};

export default function FeeConfigClient({ configs = [], society = null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Bank & Property Details Modal State
  const [editBankOpen, setEditBankOpen] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState(null);
  const [bankForm, setBankForm] = useState({
    upiId: society?.upiId || "",
    bankName: society?.bankName || "",
    bankAccountNo: society?.bankAccountNo || "",
    bankIfsc: society?.bankIfsc || "",
    bankHolderName: society?.bankHolderName || "",
    address: society?.address || "",
    city: society?.city || "",
    state: society?.state || "",
    pincode: society?.pincode || "",
  });

  const isNew = editing === "new";

  const hasBankDetails = Boolean(society?.upiId || society?.bankAccountNo);
  const hasAddress = Boolean(society?.address && society?.city);

  function openNew() {
    setForm(EMPTY);
    setErrors({});
    setError(null);
    setEditing("new");
  }

  function openEdit(c) {
    setForm({
      name: c.name,
      type: c.type,
      calculationType: c.calculationType,
      amount: c.amount ?? "",
      rate: c.rate ?? "",
      frequency: c.frequency,
      appliesToParkingOnly: c.appliesToParkingOnly,
      active: c.active,
      flatTypeAmountsText: c.flatTypeAmounts
        ? Object.entries(c.flatTypeAmounts)
            .map(([k, v]) => `${k}=${v}`)
            .join("\n")
        : "",
    });
    setErrors({});
    setError(null);
    setEditing(c);
  }

  function set(key) {
    return (e) => {
      const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
      setForm({ ...form, [key]: value });
    };
  }

  function setBank(key) {
    return (e) => {
      setBankForm({ ...bankForm, [key]: e.target.value });
    };
  }

  function openEditBank() {
    setBankForm({
      upiId: society?.upiId || "",
      bankName: society?.bankName || "",
      bankAccountNo: society?.bankAccountNo || "",
      bankIfsc: society?.bankIfsc || "",
      bankHolderName: society?.bankHolderName || "",
      address: society?.address || "",
      city: society?.city || "",
      state: society?.state || "",
      pincode: society?.pincode || "",
    });
    setBankError(null);
    setEditBankOpen(true);
  }

  async function saveBankDetails() {
    if (!society?.id) return;
    setBankSaving(true);
    setBankError(null);
    try {
      await api.patch(`/api/societies/${society.id}`, bankForm);
      setEditBankOpen(false);
      router.refresh();
    } catch (err) {
      setBankError(err.message);
    } finally {
      setBankSaving(false);
    }
  }

  function parseFlatTypeAmounts() {
    const out = {};
    for (const line of form.flatTypeAmountsText.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      const idx = t.lastIndexOf("=");
      if (idx < 1) throw new Error(`"${t}" should look like 2 BHK=2500`);
      const key = t.slice(0, idx).trim();
      const value = Number(t.slice(idx + 1).trim());
      if (!key || !Number.isFinite(value) || value < 0) {
        throw new Error(`"${t}" should look like 2 BHK=2500`);
      }
      out[key] = Math.round(value);
    }
    return out;
  }

  async function save() {
    setSaving(true);
    setError(null);
    setErrors({});

    try {
      const payload = {
        name: form.name,
        type: form.type,
        calculationType: form.calculationType,
        amount: form.amount === "" ? 0 : Number(form.amount),
        rate: form.rate === "" ? null : Number(form.rate),
        frequency: form.frequency,
        appliesToParkingOnly: form.appliesToParkingOnly,
        active: form.active,
        flatTypeAmounts:
          form.calculationType === CALCULATION_TYPE.FLAT_TYPE ? parseFlatTypeAmounts() : null,
      };

      if (isNew) await api.post("/api/billing/configuration", payload);
      else await api.patch(`/api/billing/configuration/${editing.id}`, payload);

      setEditing(null);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setErrors(fieldErrors(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(c) {
    setError(null);
    try {
      if (c.active) await api.del(`/api/billing/configuration/${c.id}`);
      else await api.patch(`/api/billing/configuration/${c.id}`, { active: true });
      router.refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="stack space-y-6">
      {/* 1. Property Payout & Bank Destination Section */}
      {society && (
        <Card className="overflow-hidden border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/40">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/20">
                <QrCode className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-slate-900">
                    Rent Collection & UPI Payout Details
                  </h3>
                  {hasBankDetails ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                      <CheckCircle2 className="size-3" />
                      Ready for UPI
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/30">
                      <AlertTriangle className="size-3" />
                      Incomplete
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  These payout details are used to generate dynamic UPI payment QR codes and bank transfer instructions on resident invoices.
                </p>
              </div>
            </div>

            <Button onClick={openEditBank} variant="secondary" size="sm" className="shrink-0">
              <Pencil className="size-3.5" />
              Edit Payout Details
            </Button>
          </div>

          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                UPI ID / VPA
              </span>
              {society.upiId ? (
                <span className="font-mono text-sm font-bold text-slate-900">
                  {society.upiId}
                </span>
              ) : (
                <span className="text-xs text-amber-600 font-medium">
                  Not configured (Required for QR codes)
                </span>
              )}
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Bank Account
              </span>
              {society.bankAccountNo ? (
                <div className="text-xs">
                  <p className="font-mono font-bold text-slate-900">
                    {society.bankAccountNo}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {society.bankHolderName || "Account Holder"} {society.bankIfsc ? `· ${society.bankIfsc}` : ""}
                  </p>
                </div>
              ) : (
                <span className="text-xs text-amber-600 font-medium">
                  Not configured
                </span>
              )}
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Property Address
              </span>
              {society.address || society.city ? (
                <div className="text-xs text-slate-700">
                  <p className="font-medium text-slate-900 truncate">
                    {society.address || "Street address not set"}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {[society.city, society.state, society.pincode].filter(Boolean).join(", ")}
                  </p>
                </div>
              ) : (
                <span className="text-xs text-amber-600 font-medium">
                  Address missing
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 2. Fee Setup & Additional Charges Section */}
      <div>
        <PageHeader
          title="Fee Setup"
          description="Rules used to price every invoice. Only active rules are applied at generation time."
          meta={
            <span className="text-[11px] font-semibold text-slate-500">
              {configs.filter((c) => c.active).length} active of {configs.length}
            </span>
          }
          actions={
            <Button onClick={openNew}>
              <Plus />
              Add charge
            </Button>
          }
        />
        <div className="surface overflow-hidden">
          {configs.length === 0 ? (
            <EmptyState
              title="No charges configured"
              description="Add maintenance or utility charges - invoices cannot be generated until at least one active charge exists."
            />
          ) : (
            <Table
              head={[
                { label: "Charge" },
                { label: "Type" },
                { label: "Calculation" },
                { label: "Amount", align: "right" },
                { label: "Frequency" },
                { label: "Active" },
                { label: "", align: "right" },
              ]}
            >
              {configs.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <span className="font-medium text-slate-900">{c.name}</span>
                    {c.appliesToParkingOnly ? (
                      <span className="ml-1.5 text-xs text-slate-400">parking only</span>
                    ) : null}
                  </Td>
                  <Td>{titleCase(c.type)}</Td>
                  <Td>{titleCase(c.calculationType)}</Td>
                  <Td align="right" className="tabular">
                    {c.calculationType === CALCULATION_TYPE.PER_SQFT
                      ? `${formatMoney(c.rate)} / sq.ft`
                      : c.calculationType === CALCULATION_TYPE.FLAT_TYPE
                        ? `${Object.keys(c.flatTypeAmounts ?? {}).length} types`
                        : formatMoney(c.amount)}
                  </Td>
                  <Td>{titleCase(c.frequency)}</Td>
                  <Td>
                    <StatusBadge status={c.active ? "ACTIVE" : "INACTIVE"} />
                  </Td>
                  <Td align="right">
                    <RowActions>
                      <IconButton variant="brand" label={`Edit ${c.name}`} onClick={() => openEdit(c)}>
                        <Pencil />
                      </IconButton>
                      <IconButton
                        variant={c.active ? "danger" : "success"}
                        label={c.active ? `Deactivate ${c.name}` : `Activate ${c.name}`}
                        onClick={() => toggle(c)}
                      >
                        <Power />
                      </IconButton>
                    </RowActions>
                  </Td>
                </Tr>
              ))}
            </Table>
          )}
        </div>
      </div>

      {/* Edit Payout / Bank Modal */}
      <Modal
        open={editBankOpen}
        onClose={() => setEditBankOpen(false)}
        title="Edit Rent Payout & Bank Details"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditBankOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveBankDetails} loading={bankSaving}>
              Save Details
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <ErrorBanner error={bankError} />

          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 text-xs text-blue-900 leading-relaxed">
            <span className="font-bold">UPI QR Code Note:</span> Adding your UPI ID / VPA allows tenants to scan dynamic QR codes to pay rent directly via PhonePe, Google Pay, or Paytm.
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              id="bank-upi"
              label="UPI ID / VPA"
              value={bankForm.upiId}
              onChange={setBank("upiId")}
              placeholder="e.g. pgname@okaxis"
              hint="Tenants scan UPI QR code linked to this address"
            />
            <Input
              id="bank-account"
              label="Bank Account Number"
              value={bankForm.bankAccountNo}
              onChange={setBank("bankAccountNo")}
              placeholder="e.g. 50100234567890"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              id="bank-ifsc"
              label="IFSC Code"
              value={bankForm.bankIfsc}
              onChange={setBank("bankIfsc")}
              placeholder="e.g. HDFC0001234"
            />
            <Input
              id="bank-name"
              label="Bank Name"
              value={bankForm.bankName}
              onChange={setBank("bankName")}
              placeholder="e.g. HDFC Bank"
            />
            <Input
              id="bank-holder"
              label="Account Holder Name"
              value={bankForm.bankHolderName}
              onChange={setBank("bankHolderName")}
              placeholder="e.g. Sri Lakshmi PG"
            />
          </div>

          <div className="border-t border-slate-200/60 pt-4">
            <span className="text-xs font-bold text-slate-700 block mb-2">Property Address</span>
            <div className="grid grid-cols-1 gap-3">
              <Input
                id="prop-address"
                label="Street Address"
                value={bankForm.address}
                onChange={setBank("address")}
                placeholder="e.g. #42, 1st Cross, Koramangala"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  id="prop-city"
                  label="City"
                  value={bankForm.city}
                  onChange={setBank("city")}
                  placeholder="e.g. Bengaluru"
                />
                <Input
                  id="prop-state"
                  label="State"
                  value={bankForm.state}
                  onChange={setBank("state")}
                  placeholder="e.g. Karnataka"
                />
                <Input
                  id="prop-pincode"
                  label="Pincode"
                  value={bankForm.pincode}
                  onChange={setBank("pincode")}
                  placeholder="e.g. 560034"
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Charge Modal */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={isNew ? "Add charge" : `Edit ${editing?.name ?? ""}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <ErrorBanner error={error} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input id="name" label="Charge name" value={form.name} onChange={set("name")} error={errors.name} placeholder="Monthly Maintenance" required />
            <Select id="type" label="Category" value={form.type} onChange={set("type")}>
              {Object.values(CHARGE_TYPE).map((t) => (
                <option key={t} value={t}>
                  {titleCase(t)}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select id="calculationType" label="Calculation" value={form.calculationType} onChange={set("calculationType")}>
              {Object.values(CALCULATION_TYPE).map((t) => (
                <option key={t} value={t}>
                  {titleCase(t)}
                </option>
              ))}
            </Select>
            <Select id="frequency" label="Frequency" value={form.frequency} onChange={set("frequency")}>
              {Object.values(FREQUENCY).map((f) => (
                <option key={f} value={f}>
                  {titleCase(f)}
                </option>
              ))}
            </Select>
          </div>

          {form.calculationType === CALCULATION_TYPE.FIXED ? (
            <Input
              id="amount"
              label="Amount per room / tenant"
              type="number"
              min="0"
              value={form.amount}
              onChange={set("amount")}
              error={errors.amount}
              placeholder="2500"
              hint="Charged to tenant invoices"
            />
          ) : null}

          {form.calculationType === CALCULATION_TYPE.PER_SQFT ? (
            <Input
              id="rate"
              label="Rate per sq.ft"
              type="number"
              step="0.01"
              min="0"
              value={form.rate}
              onChange={set("rate")}
              error={errors.rate}
              placeholder="3"
              hint="Rate is multiplied by room area"
            />
          ) : null}

          {form.calculationType === CALCULATION_TYPE.FLAT_TYPE ? (
            <Textarea
              id="flatTypeAmounts"
              label="Amount per room type"
              mono
              rows={4}
              value={form.flatTypeAmountsText}
              onChange={set("flatTypeAmountsText")}
              placeholder={"SINGLE=1500\nDOUBLE=2500\nTRIPLE=3500"}
              error={errors.flatTypeAmounts}
              hint="One per line, as RoomType=Amount"
            />
          ) : null}

          <div className="flex flex-col gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-900/5">
            <Checkbox
              id="appliesToParkingOnly"
              checked={form.appliesToParkingOnly}
              onChange={set("appliesToParkingOnly")}
              label="Only charge tenants that have reserved parking"
            />
            <Checkbox
              id="active"
              checked={form.active}
              onChange={set("active")}
              label="Active"
              description="Inactive charges are skipped the next time invoices are generated."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
