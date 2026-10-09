"use client";

import { useEffect, useRef, useState } from "react";

// Compteur animé : le nombre "monte" jusqu'à sa valeur (ease-out). Respecte
// prefers-reduced-motion (affiche directement la valeur finale).
export function CountUp({ value, format, duration = 900 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const first = useRef(true);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const start = first.current ? 0 : from.current;
    first.current = false;
    if (reduce || start === value) { setShown(value); from.current = value; return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = start + (value - start) * eased;
      setShown(cur);
      from.current = cur;
      if (p < 1) raf = requestAnimationFrame(tick);
      else { setShown(value); from.current = value; }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{format ? format(shown) : Math.round(shown).toLocaleString("fr-FR")}</>;
}
