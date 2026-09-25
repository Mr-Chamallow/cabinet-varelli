"use client";

import type { ToastVariant } from "@/lib/useToast";
export function Toast({ toast }: { toast: { message: string; variant: ToastVariant } | null }) {
  if (!toast) return null;
  return (
    <div className="toast-container">
      <div className={`toast toast-${toast.variant}`}>
        {toast.variant === "success" ? "✅" : "❌"} {toast.message}
      </div>
    </div>
  );
}
