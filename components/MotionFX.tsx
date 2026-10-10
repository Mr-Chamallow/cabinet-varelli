"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Effets globaux : balayage doré à chaque changement de page + inclinaison 3D des cartes (.stat-card, [data-tilt]).
export function MotionFX() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia?.("(hover: none), (prefers-reduced-motion: reduce)").matches) return;
    let el: HTMLElement | null = null;
    const move = (e: MouseEvent) => {
      const t = (e.target as HTMLElement)?.closest?.(".stat-card, [data-tilt]") as HTMLElement | null;
      if (el && el !== t) { el.style.removeProperty("--tx"); el.style.removeProperty("--ty"); }
      el = t; if (!t || t.closest(".no-fx")) return;
      const r = t.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      t.style.setProperty("--tx", `${(0.5 - y) * 7}deg`); t.style.setProperty("--ty", `${(x - 0.5) * 9}deg`);
      t.style.setProperty("--gx", `${x * 100}%`); t.style.setProperty("--gy", `${y * 100}%`);
    };
    document.addEventListener("mousemove", move); return () => document.removeEventListener("mousemove", move);
  }, []);
  return <div key={pathname} className="route-sweep" aria-hidden="true" />;
}
