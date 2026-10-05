"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Power } from "lucide-react";
import Button, { IconButton } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Table, { Tr, Td, RowActions } from "@/components/ui/Table";
import StatusBadge from "@/components/ui/StatusBadge";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/Input";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import PageHeader from "@/components/ui/PageHeader";
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

export default function FeeConfigClient({ configs }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const isNew = editing === "new";

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
    <div className="stack">
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
            description="Add maintenance first - invoices cannot be generated until at least one active charge exists."
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
              label="Amount per flat"
              type="number"
              min="0"
              value={form.amount}
              onChange={set("amount")}
              error={errors.amount}
              placeholder="2500"
              hint="Every occupied flat is charged this amount"
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
              hint="Rate is multiplied by the flat's recorded area"
            />
          ) : null}

          {form.calculationType === CALCULATION_TYPE.FLAT_TYPE ? (
            <Textarea
              id="flatTypeAmounts"
              label="Amount per flat type"
              mono
              rows={4}
              value={form.flatTypeAmountsText}
              onChange={set("flatTypeAmountsText")}
              placeholder={"1 BHK=1500\n2 BHK=2500\n3 BHK=3500"}
              error={errors.flatTypeAmounts}
              hint="One per line, as FlatType=Amount"
            />
          ) : null}

          <div className="flex flex-col gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-900/5">
            <Checkbox
              id="appliesToParkingOnly"
              checked={form.appliesToParkingOnly}
              onChange={set("appliesToParkingOnly")}
              label="Only charge flats that have a parking slot"
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