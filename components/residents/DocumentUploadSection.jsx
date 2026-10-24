"use client";

import { useState, useRef } from "react";
import {
  UploadCloud,
  FileCheck2,
  FileText,
  Trash2,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Plus,
  Eye,
  CheckCircle2,
  X,
  CreditCard,
  FileBadge,
} from "lucide-react";
import Button, { Spinner } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { ErrorBanner, SuccessBanner } from "@/components/ui/Feedback";
import { formatDate } from "@/lib/format";

export const DOC_TYPES = {
  AADHAAR: { label: "Aadhaar Card / Govt ID", required: true, desc: "Aadhaar card or any valid government-issued ID proof" },
  PAN: { label: "PAN Card", required: true, desc: "Income Tax PAN card document" },
  PASSPORT: { label: "Passport", required: false, desc: "Valid international passport" },
  VOTER_ID: { label: "Voter ID", required: false, desc: "Election commission identity card" },
  DRIVING_LICENSE: { label: "Driving License", required: false, desc: "State driving license" },
  OTHER: { label: "Other Document", required: false, desc: "College ID, office ID or other proof" },
};

/**
 * Tenant KYC Document Upload & Verification Section
 * Supports single and multiple document uploads to Cloudinary/server storage.
 */
export default function DocumentUploadSection({
  userId,
  initialDocuments = [],
  readOnly = false,
  title = "Tenant Verification Documents (KYC)",
  description = "Government ID proof and PAN card verification required for tenancy.",
  onDocumentsChange,
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState("AADHAAR");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const fileInputRef = useRef(null);

  const aadhaarDocs = documents.filter((d) => d.docType === "AADHAAR");
  const panDocs = documents.filter((d) => d.docType === "PAN");
  const otherDocs = documents.filter((d) => d.docType !== "AADHAAR" && d.docType !== "PAN");

  const hasAadhaar = aadhaarDocs.length > 0;
  const hasPan = panDocs.length > 0;
  const isKycComplete = hasAadhaar && hasPan;

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);
    setSuccess(null);
    setUploading(true);

    try {
      const uploadedDocs = [];

      for (const file of files) {
        // 1. Upload to /api/uploads
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "kyc_documents");

        const uploadRes = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData?.error?.message || `Failed to upload ${file.name}`);
        }

        const { fileUrl, publicId, resourceType } = uploadData.data;

        // 2. Attach document reference to resident
        const attachRes = await fetch(`/api/residents/${userId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            docType: selectedType,
            fileUrl,
            cloudinaryPublicId: publicId,
            resourceType,
          }),
        });

        const attachData = await attachRes.json();
        if (!attachRes.ok || !attachData.success) {
          throw new Error(attachData?.error?.message || "Failed to record document details");
        }

        uploadedDocs.push(attachData.data);
      }

      const updated = [...uploadedDocs, ...documents];
      setDocuments(updated);
      onDocumentsChange?.(updated);
      setSuccess(`Successfully uploaded ${files.length} document${files.length > 1 ? "s" : ""}!`);

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId) {
    if (!confirm("Are you sure you want to remove this document?")) return;
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/residents/${userId}/documents?docId=${encodeURIComponent(docId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to delete document");
      }

      const updated = documents.filter((d) => d.id !== docId);
      setDocuments(updated);
      onDocumentsChange?.(updated);
      setSuccess("Document removed.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-4">
      {/* KYC Status Header Card */}
      <div
        className={`rounded-2xl p-4 sm:p-5 border transition-all ${
          isKycComplete
            ? "border-emerald-200 bg-emerald-50/60 text-emerald-950"
            : "border-amber-200 bg-amber-50/60 text-amber-950"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                isKycComplete ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
              }`}
            >
              {isKycComplete ? <FileCheck2 className="size-5" /> : <AlertCircle className="size-5" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">
                  {isKycComplete ? "KYC Verification Complete" : "Tenant KYC Incomplete"}
                </h3>
                <Badge tone={isKycComplete ? "green" : "amber"} dot>
                  {isKycComplete ? "Verified" : "Pending Action"}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-slate-600">
                {isKycComplete
                  ? "Both Aadhaar Card and PAN Card have been submitted and verified."
                  : "Both Aadhaar Card (or valid Govt ID) and PAN Card are mandatory for verification."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 ${
                hasAadhaar ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}
            >
              {hasAadhaar ? "✓ Aadhaar Card" : "✕ Aadhaar Card"}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 ${
                hasPan ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}
            >
              {hasPan ? "✓ PAN Card" : "✕ PAN Card"}
            </span>
          </div>
        </div>
      </div>

      <ErrorBanner error={error} />
      {success ? <SuccessBanner title={success} /> : null}

      {/* Upload Action Section */}
      {!readOnly ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Upload Verification Document
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Select document category, then choose single or multiple photos / PDF files.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:border-brand-500 focus:outline-none"
              >
                <option value="AADHAAR">Aadhaar Card / Govt ID *</option>
                <option value="PAN">PAN Card *</option>
                <option value="PASSPORT">Passport</option>
                <option value="VOTER_ID">Voter ID</option>
                <option value="DRIVING_LICENSE">Driving License</option>
                <option value="OTHER">Other Proof / College / Office ID</option>
              </select>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
                className="hidden"
                id={`file-upload-${userId}`}
                onChange={handleFileSelect}
                disabled={uploading}
              />

              <Button
                size="sm"
                variant="primary"
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="size-4" />
                {uploading ? "Uploading..." : `Upload ${DOC_TYPES[selectedType]?.label || "File"}`}
              </Button>
            </div>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center hover:border-brand-400 hover:bg-brand-50/30 transition-all cursor-pointer"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-white shadow-2xs group-hover:scale-110 transition-transform">
              <UploadCloud className="size-5 text-brand-600" />
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-800">
              Click to select or capture multiple documents
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Supports Aadhaar Card (Front/Back), PAN Card, Photos or PDFs up to 10MB each
            </p>
          </div>
        </div>
      ) : null}

      {/* Documents List Grid */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Uploaded Documents ({documents.length})
        </p>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <FileText className="mx-auto size-8 text-slate-300" />
            <p className="mt-1.5 text-xs font-semibold text-slate-700">No documents uploaded yet</p>
            <p className="text-[11px] text-slate-400">
              Upload Aadhaar Card and PAN Card to satisfy tenant verification requirements.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {documents.map((doc) => {
              const typeInfo = DOC_TYPES[doc.docType] || DOC_TYPES.OTHER;
              const isPdf = doc.fileUrl?.endsWith(".pdf") || doc.resourceType === "raw";

              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      onClick={() => setPreviewDoc(doc)}
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 overflow-hidden border border-slate-200/80 cursor-pointer hover:opacity-80"
                    >
                      {isPdf ? (
                        <FileText className="size-5 text-rose-600" />
                      ) : (
                        <img
                          src={doc.fileUrl}
                          alt={typeInfo.label}
                          className="size-full object-cover"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 truncate">{typeInfo.label}</p>
                        {typeInfo.required ? (
                          <span className="rounded bg-brand-50 px-1.5 py-0.2 text-[9px] font-bold text-brand-700 uppercase">
                            Required
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Uploaded {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setPreviewDoc(doc)}
                      title="Preview document"
                    >
                      <Eye className="size-3.5 text-slate-600" />
                    </Button>

                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
                      title="Open full size in new tab"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>

                    {!readOnly ? (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleDelete(doc.id)}
                        className="text-rose-600 hover:bg-rose-50"
                        title="Delete document"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                <p className="text-sm font-bold text-slate-900">
                  {DOC_TYPES[previewDoc.docType]?.label || "Document Preview"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  <ExternalLink className="size-3" />
                  Full Screen
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-slate-900/5 p-4 flex items-center justify-center min-h-[300px]">
              {previewDoc.fileUrl?.endsWith(".pdf") || previewDoc.resourceType === "raw" ? (
                <iframe
                  src={previewDoc.fileUrl}
                  title="PDF Preview"
                  className="size-full min-h-[500px] rounded-lg border border-slate-200 bg-white"
                />
              ) : (
                <img
                  src={previewDoc.fileUrl}
                  alt="KYC Document Preview"
                  className="max-h-[70vh] rounded-lg object-contain shadow-soft"
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
