"use client";

interface ConfirmDialogProps {
  title: string;
  message: string;
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title, message, icon = "⚠️", confirmLabel = "Confirmer", cancelLabel = "Annuler",
  danger = true, onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <div className="confirm-icon">{icon}</div>
        <div className="confirm-title">{title}</div>
        <div className="confirm-msg">{message}</div>
        <div className="confirm-actions">
          <button className="btn btn-outline" onClick={onCancel}>{cancelLabel}</button>
          <button className={danger ? "btn btn-danger" : "btn btn-gold"} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
