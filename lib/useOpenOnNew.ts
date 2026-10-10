"use client";
import { useEffect } from "react";

// Ouvre un formulaire une seule fois si l'URL contient ?new=1, puis nettoie l'URL.
export function useOpenOnNew(ready: boolean, open: () => void) {
  useEffect(() => {
    if (!ready) return;
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.get("new") === "1") {
        p.delete("new");
        const q = p.toString();
        window.history.replaceState(null, "", window.location.pathname + (q ? `?${q}` : ""));
        open();
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
}
