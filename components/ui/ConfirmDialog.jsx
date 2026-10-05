"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Power } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";

const ICONS = {
  danger: { Icon: AlertTriangle, chip: "bg-rose-50 text-rose-600" },
  warning: { Icon: Power, chip: "bg-amber-50 text-amber-600" },
  info: { Icon: Info, chip: "bg-brand-50 text-brand-600" },
  success: { Icon: CheckCircle2, chip: "bg-emerald-50 text-emerald-600" },
};

const BUTTONS = {
  danger: "danger",
  warning: "primary",
  info: "primary",
  success: "success",
};

/**
 * Confirmation dialog for destructive or irreversible actions. Returns nothing -
 * the caller passes an async `onConfirm` and the dialog manages the pending state
 * so buttons never double-fire.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
}) {
  const [busy, setBusy] = useState(false);
  const { Icon, chip } = ICONS[tone] ?? ICONS.danger;

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm?.();
      onClose?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={busy ? undefined : onClose}
      size="sm"
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={BUTTONS[tone] ?? "danger"} onClick={confirm} loading={busy}>
            {busy ? "Working" : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg ${chip}`}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1 text-sm leading-relaxed text-slate-600">
          {description}
          {children}
        </div>
      </div>
    </Modal>
  );
}
