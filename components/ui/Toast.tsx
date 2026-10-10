"use client";
import { useEffect, useState } from "react";
import type { ToastVariant } from "@/lib/useToast";

// Notification « télex » : le texte s'imprime lettre par lettre sur une bande de papier.
export function Toast({ toast }: { toast: { message: string; variant: ToastVariant } | null }) {
  const [n, setN] = useState(0);
  const msg = toast?.message || "";
  useEffect(() => {
    setN(0); if (!msg) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setN(msg.length); return; }
    const id = setInterval(() => setN(x => { if (x >= msg.length) { clearInterval(id); return x; } return x + 1; }), 22);
    return () => clearInterval(id);
  }, [msg]);
  if (!toast) return null;
  return (
    <div className="toast-container">
      <div className={`toast toast-${toast.variant} telex`}>
        <span className="tx-h">{toast.variant === "success" ? "▣ MESSAGE REÇU" : "▲ ALERTE"}</span>
        <span className="tx-b">{msg.slice(0, n)}<i className="tx-c" /></span>
      </div>
    </div>
  );
}
