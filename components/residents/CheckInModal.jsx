"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Upload,
  FileCheck2,
  Eye,
  Trash2,
  CheckCircle2,
  Check,
} from "lucide-react";
import Button, { Spinner } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { DropdownSelect } from "@/components/ui/Dropdown";
import { ErrorBanner } from "@/components/ui/Feedback";
import { api } from "@/lib/client/api";

export const KYC_DOCUMENT_OPTIONS = [
  { value: "AADHAAR", label: "Aadhaar Card / Govt ID", required: true },
  { value: "PAN", label: "PAN Card", required: true },
  { value: "COLLEGE_ID", label: "College / Student ID" },
  { value: "WORK_ID", label: "Work / Employment ID" },
  { value: "RENTAL_AGREEMENT", label: "Rental Agreement" },
  { value: "OTHER", label: "Other Document" },
];

export const EMPTY_CHECKIN = {
  name: "",
  phone: "",
  email: "",
  unitId: "",
  bedId: "",
  monthlyRent: "",
  depositAmount: "",
  joinDate: new Date().toISOString().split("T")[0],
  noticePeriodDays: 30,
};

export default function CheckInModal({
  open,
  onClose,
  units: initialUnits = [],
  prefilledUnitId = "",
  prefilledBedId = "",
  onSuccess,
}) {
  const router = useRouter();
  const [units, setUnits] = useState(initialUnits);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [checkInForm, setCheckInForm] = useState(EMPTY_CHECKIN);
  const [checkInDocs, setCheckInDocs] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState(null);
  const [docTypeToUpload, setDocTypeToUpload] = useState("AADHAAR");
  const [checkInSaving, setCheckInSaving] = useState(false);
  const [checkInError, setCheckInError] = useState(null);

  // If units not passed, fetch them automatically
  useEffect(() => {
    if (!open) return;

    if (!initialUnits || initialUnits.length === 0) {
      setLoadingUnits(true);
      api
        .get("/api/units?pageSize=200")
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.units || res?.data || [];
          setUnits(list);
        })
        .catch(() => {
          setUnits([]);
        })
        .finally(() => setLoadingUnits(false));
    } else {
      setUnits(initialUnits);
    }
  }, [open, initialUnits]);

  // Set prefilled unit / bed if provided
  useEffect(() => {
    if (!open) {
      setCheckInForm(EMPTY_CHECKIN);
      setCheckInDocs([]);
      setCheckInError(null);
      setDocUploadError(null);
      return;
    }

    if (prefilledUnitId || prefilledBedId) {
      const u = units.find((x) => x.id === prefilledUnitId);
      const b = u?.beds?.find((x) => x.id === prefilledBedId);
      const rent = b?.rentAmount || u?.rentAmount || 7500;
      setCheckInForm((prev) => ({
        ...prev,
        unitId: prefilledUnitId || prev.unitId,
        bedId: prefilledBedId || prev.bedId,
        monthlyRent: rent,
        depositAmount: rent * 2,
      }));
    }
  }, [open, prefilledUnitId, prefilledBedId, units]);

  const selectedUnit = useMemo(() => {
    return units.find((u) => u.id === checkInForm.unitId);
  }, [units, checkInForm.unitId]);

  const availableBeds = useMemo(() => {
    if (!selectedUnit?.beds) return [];
    return selectedUnit.beds.filter((b) => {
      if (checkInForm.bedId && b.id === checkInForm.bedId) return true;
      const hasActiveOccupancy = b.occupancies?.some(
        (occ) => occ.status === "ACTIVE" || occ.status === "NOTICE"
      );
      if (hasActiveOccupancy) return false;
      return b.status === "VACANT" || !b.status || b.status !== "OCCUPIED";
    });
  }, [selectedUnit, checkInForm.bedId]);

  // Document upload in Check-in modal
  async function handleOnboardingDocUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadingDoc(true);
    setDocUploadError(null);

    try {
      const newDocs = [];
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is larger than 10 MB`);
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "kyc");

        const res = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data?.error?.message || `Failed to upload ${file.name}`);
        }

        newDocs.push({
          docType: docTypeToUpload,
          fileUrl: data.data.fileUrl,
          cloudinaryPublicId: data.data.publicId,
          resourceType: data.data.resourceType,
          fileName: file.name,
        });
      }

      setCheckInDocs((prev) => {
        const next = [...prev, ...newDocs];
        if (docTypeToUpload === "AADHAAR" && !next.some((d) => d.docType === "PAN")) {
          setDocTypeToUpload("PAN");
        }
        return next;
      });
    } catch (err) {
      setDocUploadError(err?.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
      e.target.value = "";
    }
  }

  // Check-in submit
  async function handleCheckInSubmit(e) {
    e.preventDefault();
    setCheckInSaving(true);
    setCheckInError(null);

    try {
      await api.post("/api/occupancies", {
        ...checkInForm,
        documents: checkInDocs,
        monthlyRent: Number(checkInForm.monthlyRent),
        depositAmount: Number(checkInForm.depositAmount),
        noticePeriodDays: Number(checkInForm.noticePeriodDays),
      });

      onClose();
      setCheckInForm(EMPTY_CHECKIN);
      setCheckInDocs([]);
      setDocUploadError(null);
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      setCheckInError(err?.message || "Failed to check-in resident");
    } finally {
      setCheckInSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-2 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-2xl animate-rise max-h-[92vh] sm:max-h-[90vh] overflow-y-auto [scrollbar-width:thin]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Check-in New Resident</h2>
            <p className="text-xs text-slate-500">
              Assign room & bed, set monthly rent, and record initial security deposit.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleCheckInSubmit} className="mt-4 space-y-4">
          <ErrorBanner error={checkInError} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              required
              placeholder="e.g. Rahul Sharma"
              value={checkInForm.name}
              onChange={(e) => setCheckInForm({ ...checkInForm, name: e.target.value })}
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="9876543210"
              value={checkInForm.phone}
              onChange={(e) => setCheckInForm({ ...checkInForm, phone: e.target.value })}
            />
          </div>

          <Input
            label="Email Address (Login ID)"
            type="email"
            required
            placeholder="rahul@example.com"
            value={checkInForm.email}
            onChange={(e) => setCheckInForm({ ...checkInForm, email: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label={loadingUnits ? "Loading Rooms..." : "Select Room"}
              required
              disabled={loadingUnits}
              value={checkInForm.unitId}
              onChange={(e) => {
                const uId = e.target.value;
                const u = units.find((x) => x.id === uId);
                const firstVacantBed = u?.beds?.find((b) => {
                  const hasActiveOccupancy = b.occupancies?.some(
                    (occ) => occ.status === "ACTIVE" || occ.status === "NOTICE"
                  );
                  return !hasActiveOccupancy && b.status !== "OCCUPIED";
                });
                const rent = firstVacantBed?.rentAmount || u?.rentAmount || checkInForm.monthlyRent;
                setCheckInForm({
                  ...checkInForm,
                  unitId: uId,
                  bedId: firstVacantBed?.id || "",
                  monthlyRent: rent,
                  depositAmount: rent * 2,
                });
              }}
            >
              <option value="">-- Choose Room --</option>
              {units.length === 0 && !loadingUnits ? (
                <option value="" disabled>No rooms configured yet</option>
              ) : (
                units.map((u) => {
                  const vacant =
                    u.beds?.filter((b) => {
                      const hasActiveOccupancy = b.occupancies?.some(
                        (occ) => occ.status === "ACTIVE" || occ.status === "NOTICE"
                      );
                      return !hasActiveOccupancy && b.status !== "OCCUPIED";
                    }).length || 0;
                  return (
                    <option key={u.id} value={u.id}>
                      Room {u.unitNumber} {u.unitType ? `(${u.unitType})` : ""} · {vacant} vacant
                    </option>
                  );
                })
              )}
            </Select>

            <Select
              label="Select Bed"
              value={checkInForm.bedId}
              disabled={!checkInForm.unitId}
              onChange={(e) => {
                const bId = e.target.value;
                const b = selectedUnit?.beds?.find((x) => x.id === bId);
                const rent = b?.rentAmount || selectedUnit?.rentAmount || checkInForm.monthlyRent;
                setCheckInForm({
                  ...checkInForm,
                  bedId: bId,
                  monthlyRent: rent,
                  depositAmount: rent * 2,
                });
              }}
            >
              <option value="">-- Choose Bed --</option>
              {!checkInForm.unitId ? (
                <option value="" disabled>Select a room first</option>
              ) : availableBeds.length === 0 ? (
                <option value="" disabled>No vacant beds in this room</option>
              ) : (
                availableBeds.map((b) => (
                  <option key={b.id} value={b.id}>
                    Bed {b.bedLabel} {b.rentAmount ? `(₹${b.rentAmount})` : ""}
                  </option>
                ))
              )}
            </Select>
          </div>
              {availableBeds.map((b) => (
                <option key={b.id} value={b.id}>
                  Bed {b.bedLabel} {b.rentAmount ? `(₹${b.rentAmount})` : ""}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Monthly Rent (₹)"
              type="number"
              min="0"
              step="500"
              required
              value={checkInForm.monthlyRent}
              onChange={(e) => setCheckInForm({ ...checkInForm, monthlyRent: e.target.value })}
            />
            <Input
              label="Security Deposit (₹)"
              type="number"
              min="0"
              step="500"
              value={checkInForm.depositAmount}
              onChange={(e) => setCheckInForm({ ...checkInForm, depositAmount: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Join Date"
              type="date"
              required
              value={checkInForm.joinDate}
              onChange={(e) => setCheckInForm({ ...checkInForm, joinDate: e.target.value })}
            />
            <Input
              label="Notice Period (Days)"
              type="number"
              min="0"
              value={checkInForm.noticePeriodDays}
              onChange={(e) => setCheckInForm({ ...checkInForm, noticePeriodDays: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-slate-800">
                  ID Proof & KYC Documents (Optional)
                </p>
                <p className="text-[11px] text-slate-500">
                  Upload Aadhaar, PAN, student or employee ID proof
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    checkInDocs.some((d) => d.docType === "AADHAAR")
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {checkInDocs.some((d) => d.docType === "AADHAAR") ? <Check className="size-3 text-emerald-600 shrink-0" /> : null}
                  <span>Aadhaar {checkInDocs.some((d) => d.docType === "AADHAAR") ? "Verified" : "Pending"}</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    checkInDocs.some((d) => d.docType === "PAN")
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {checkInDocs.some((d) => d.docType === "PAN") ? <Check className="size-3 text-emerald-600 shrink-0" /> : null}
                  <span>PAN {checkInDocs.some((d) => d.docType === "PAN") ? "Verified" : "Pending"}</span>
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Select Document Needed
                  </label>
                  <DropdownSelect
                    value={docTypeToUpload}
                    onChange={(e) => setDocTypeToUpload(e.target.value)}
                  >
                    {KYC_DOCUMENT_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label} {t.required ? "(Recommended)" : ""}
                      </option>
                    ))}
                  </DropdownSelect>
                </div>

                <div className="sm:col-span-6">
                  <label
                    className={`flex items-center justify-center gap-2 w-full rounded-lg border border-brand-600 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100 cursor-pointer ${
                      uploadingDoc ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {uploadingDoc ? (
                      <>
                        <Spinner className="size-3.5 text-brand-600" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="size-3.5" />
                        <span>Upload Document</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      multiple
                      disabled={uploadingDoc}
                      className="hidden"
                      onChange={handleOnboardingDocUpload}
                    />
                  </label>
                </div>
              </div>

              {docUploadError && (
                <p className="mt-2 text-[11px] font-medium text-rose-600">{docUploadError}</p>
              )}
            </div>

            {checkInDocs.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-600">
                  Uploaded Documents ({checkInDocs.length}):
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {checkInDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCheck2 className="size-4 shrink-0 text-emerald-600" />
                        <div className="truncate">
                          <span className="font-semibold text-slate-800">
                            {KYC_DOCUMENT_OPTIONS.find((t) => t.value === doc.docType)?.label || doc.docType}
                          </span>
                          <span className="ml-1.5 text-[11px] text-slate-400 truncate">
                            ({doc.fileName || "Uploaded file"})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-brand-600 hover:bg-brand-50 hover:underline"
                        >
                          <Eye className="size-3" />
                          View
                        </a>
                        <button
                          type="button"
                          onClick={() => setCheckInDocs((prev) => prev.filter((_, i) => i !== idx))}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Remove document"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" loading={checkInSaving}>
              Confirm Check-in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

