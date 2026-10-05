"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Building2, Search, Inbox } from "lucide-react";
import Button, { IconButton } from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Table, { Tr, Td, RowActions } from "@/components/ui/Table";
import StatusBadge from "@/components/ui/StatusBadge";
import Badge from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState, ErrorBanner } from "@/components/ui/Feedback";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import { FilterChips } from "@/components/ui/FilterPills";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { api, fieldErrors } from "@/lib/client/api";
import { FLAT_STATUS } from "@/lib/constants";
import { titleCase } from "@/lib/format";

const EMPTY = {
  flatNumber: "",
  block: "",
  floor: "",
  flatType: "",
  sqFt: "",
  parkingSlot: "",
  status: "OCCUPIED",
};

export default function FlatsClient({ flats }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null); // flat object | "new"
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");

  const isNew = editing === "new";

  const occupied = flats.filter((f) => f.status === "OCCUPIED").length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return flats.filter((f) => {
      if (status !== "ALL" && f.status !== status) return false;
      if (!q) return true;
      return [f.flatNumber, f.block, f.parkingSlot, f.flatType, ...f.residents.map((r) => r.user.name)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [flats, query, status]);

  function openNew() {
    setForm(EMPTY);
    setErrors({});
    setError(null);
    setEditing("new");
  }

  function openEdit(flat) {
    setForm({
      flatNumber: flat.flatNumber,
      block: flat.block ?? "",
      floor: flat.floor ?? "",
      flatType: flat.flatType ?? "",
      sqFt: flat.sqFt ?? "",
      parkingSlot: flat.parkingSlot ?? "",
      status: flat.status,
    });
    setErrors({});
    setError(null);
    setEditing(flat);
  }

  function set(key) {
    return (e) => setForm({ ...form, [key]: e.target.value });
  }

  async function save() {
    setSaving(true);
    setError(null);
    setErrors({});

    const payload = {
      ...form,
      sqFt: form.sqFt === "" ? null : Number(form.sqFt),
      block: form.block || null,
      floor: form.floor || null,
      flatType: form.flatType || null,
      parkingSlot: form.parkingSlot || null,
    };

    try {
      if (isNew) await api.post("/api/flats", payload);
      else await api.patch(`/api/flats/${editing.id}`, payload);
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
      await api.del(`/api/flats/${confirmDelete.id}`);
      setConfirmDelete(null);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setConfirmDelete(null);
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Flats"
        description="Flats are the billing unit for your society. Add them before raising invoices."
        meta={
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
              {occupied} occupied
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
              {flats.length - occupied} vacant
            </span>
            <span className="text-slate-400">{flats.length} total</span>
          </span>
        }
        actions={
          <Button onClick={openNew}>
            <Plus />
            Add flat
          </Button>
        }
      />

      <div className="surface overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search flat, block or resident"
            className="w-full sm:max-w-xs"
          />
          <FilterChips
            value={status}
            onChange={setStatus}
            options={[
              { value: "ALL", label: `All ${flats.length}` },
              { value: FLAT_STATUS.OCCUPIED, label: `Occupied ${occupied}` },
              {
                value: FLAT_STATUS.VACANT,
                label: `Vacant ${flats.length - occupied}`,
              },
            ]}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={flats.length === 0 ? Building2 : Search}
            title={flats.length === 0 ? "No flats yet" : "No matching flats"}
            description={
              flats.length === 0
                ? "Add your first flat to start billing residents."
                : "Try a different search term or clear the status filter."
            }
            action={
              flats.length === 0 ? (
                <Button onClick={openNew}>
                  <Plus />
                  Add flat
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setStatus("ALL");
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <Table
            dense
            head={[
              { label: "Flat" },
              { label: "Block / Floor", className: "hidden md:table-cell" },
              { label: "Type", className: "hidden lg:table-cell" },
              { label: "Area", align: "right", className: "hidden lg:table-cell" },
              { label: "Parking", className: "hidden xl:table-cell" },
              { label: "Primary resident" },
              { label: "Status" },
              { label: "Invoices", align: "right", className: "hidden sm:table-cell" },
              { label: "", align: "right" },
            ]}
          >
            {filtered.map((f) => {
              const primary = f.residents[0];
              return (
                <Tr key={f.id}>
                  <Td className="font-semibold text-slate-900">
                    <span className="flex items-center gap-2">
                      <span className="inline-flex size-7 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-500">
                        {String(f.flatNumber).slice(0, 2)}
                      </span>
                      {f.block ? `${f.block}-${f.flatNumber}` : f.flatNumber}
                    </span>
                  </Td>
                  <Td className="hidden md:table-cell">
                    {f.block ?? "-"}
                    {f.floor ? ` · Floor ${f.floor}` : ""}
                  </Td>
                  <Td className="hidden lg:table-cell">{f.flatType ? <Badge>{f.flatType}</Badge> : "-"}</Td>
                  <Td align="right" className="tabular hidden lg:table-cell">
                    {f.sqFt ? `${f.sqFt} sq.ft` : "-"}
                  </Td>
                  <Td className="hidden xl:table-cell">{f.parkingSlot ?? "-"}</Td>
                  <Td>
                    {primary ? (
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-slate-800">{primary.user.name}</span>
                        <Badge tone={primary.residentType === "OWNER" ? "brand" : "slate"}>
                          {primary.residentType === "OWNER" ? "Owner" : "Tenant"}
                        </Badge>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-400">
                        <Inbox className="size-3.5" />
                        Unoccupied
                      </span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={f.status} />
                  </Td>
                  <Td align="right" className="tabular hidden sm:table-cell">
                    {f._count.invoices}
                  </Td>
                  <Td align="right">
                    <RowActions>
                      <IconButton variant="brand" label={`Edit ${f.flatNumber}`} onClick={() => openEdit(f)}>
                        <Pencil />
                      </IconButton>
                      <IconButton
                        variant="danger"
                        label={`Delete ${f.flatNumber}`}
                        onClick={() => {
                          setError(null);
                          setConfirmDelete(f);
                        }}
                      >
                        <Trash2 />
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
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={isNew ? "Add flat" : `Edit ${editing?.flatNumber ?? ""}`}
        description={isNew ? "Flats are the billing unit for this society." : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving}>
              {isNew ? "Add flat" : "Save changes"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <ErrorBanner error={error} />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="flatNumber"
              label="Flat number"
              value={form.flatNumber}
              onChange={set("flatNumber")}
              error={errors.flatNumber}
              placeholder="A101"
              required
            />
            <Input
              id="block"
              label="Block"
              value={form.block}
              onChange={set("block")}
              error={errors.block}
              placeholder="A"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="floor"
              label="Floor"
              value={form.floor}
              onChange={set("floor")}
              error={errors.floor}
              placeholder="1"
            />
            <Input
              id="flatType"
              label="Flat type"
              value={form.flatType}
              onChange={set("flatType")}
              error={errors.flatType}
              placeholder="2 BHK"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="sqFt"
              label="Area (sq.ft)"
              type="number"
              min="0"
              value={form.sqFt}
              onChange={set("sqFt")}
              error={errors.sqFt}
              placeholder="1050"
              hint="Needed for per sq.ft billing"
            />
            <Input
              id="parkingSlot"
              label="Parking slot"
              value={form.parkingSlot}
              onChange={set("parkingSlot")}
              error={errors.parkingSlot}
              placeholder="P-101"
            />
          </div>

          <Select id="status" label="Status" value={form.status} onChange={set("status")} error={errors.status}>
            {Object.values(FLAT_STATUS).map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </Select>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={remove}
        title="Delete this flat?"
        confirmLabel="Delete flat"
        description={
          <>
            <strong className="font-semibold text-slate-800">
              {confirmDelete?.block ? `${confirmDelete.block}-` : ""}
              {confirmDelete?.flatNumber}
            </strong>{" "}
            will be removed. Flats that already have invoices cannot be deleted - mark those as vacant
            instead so the billing history is preserved.
            {error ? <ErrorBanner className="mt-3" error={error} /> : null}
          </>
        }
      />
    </div>
  );
}