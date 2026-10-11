"use client";
import { useEffect, useState } from "react";

// Logos des groupes : fichiers dans /public/groupes (remplis par scripts/telecharger-logos.mjs)
// + /public/groupes/manifest.json { slug: "fichier.ext" }. Sans logo : pastille avec les initiales.
export const slugGroupe = (nom: string) => (nom || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

let manifest: Record<string, string> | null = null;
let pending: Promise<Record<string, string>> | null = null;
function loadManifest(): Promise<Record<string, string>> {
  if (manifest) return Promise.resolve(manifest);
  if (!pending) pending = fetch("/groupes/manifest.json").then(r => (r.ok ? r.json() : {})).catch(() => ({})).then(m => (manifest = m || {}));
  return pending;
}
export function useGroupeLogos() {
  const [m, setM] = useState<Record<string, string>>(manifest || {});
  useEffect(() => { let off = false; loadManifest().then(x => { if (!off) setM(x); }); return () => { off = true; }; }, []);
  return m;
}

export const TYPE_COLOR: Record<string, string> = { orga: "#d4af37", gang: "#ef4444", pf: "#64b5f6", inde: "#9ca3af" };

export function GroupeLogo({ nom, type, size = 56 }: { nom: string; type?: string; size?: number }) {
  const logos = useGroupeLogos();
  const [bad, setBad] = useState(false);
  const file = logos[slugGroupe(nom)];
  const color = TYPE_COLOR[type || "pf"] || "#9ca3af";
  const initiales = (nom || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  if (file && !bad) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/groupes/${file}`} alt={nom} width={size} height={size} loading="lazy" onError={() => setBad(true)} style={{ width: size, height: size, objectFit: "contain", borderRadius: Math.round(size * 0.18), background: "rgba(255,255,255,.04)", flexShrink: 0 }} />;
  }
  return (
    <div aria-label={nom} style={{ width: size, height: size, borderRadius: Math.round(size * 0.18), flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.34, color, background: `${color}1f`, border: `1px solid ${color}55`, fontFamily: "'Playfair Display',serif" }}>{initiales}</div>
  );
}
