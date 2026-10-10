"use client";
import { useEffect, useState } from "react";

const KEY = "obs-mode";
export function applyMode(m: "dark" | "light") { document.documentElement.setAttribute("data-theme", m); }

// Bascule mode sombre / clair (mémorisé sur l'appareil).
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<"dark" | "light">("dark");
  useEffect(() => { try { setMode(localStorage.getItem(KEY) === "light" ? "light" : "dark"); } catch {} }, []);
  function toggle() {
    const n = mode === "dark" ? "light" : "dark"; setMode(n); applyMode(n);
    try { localStorage.setItem(KEY, n); } catch {}
  }
  return (
    <button type="button" className={compact ? "mobile-topbar-btn" : "theme-toggle"} onClick={toggle} title={mode === "dark" ? "Passer en mode clair" : "Passer en mode sombre"} aria-label="Changer de mode">
      {mode === "dark" ? "☀️" : "🌙"}{!compact && <span>{mode === "dark" ? "Mode clair" : "Mode sombre"}</span>}
    </button>
  );
}
