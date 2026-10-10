"use client";
import { useEffect, useRef } from "react";

// Lit ?param=valeur dans l'URL et appelle `onValue` UNE fois quand `ready` est vrai (données chargées).
export function useDeepLink(param: string, ready: boolean, onValue: (v: string) => void) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !ready || typeof window === "undefined") return;
    const v = new URLSearchParams(window.location.search).get(param);
    done.current = true;
    if (v) onValue(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
}
