"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { gangTypeLabel } from "@/components/carte-enqueteur/types";
import { hasPermission, hasWriteAccess } from "@/lib/auth";

// Garde d'accès + droit d'écriture pour une page du Consortium.
export function useGmAccess(perm: string) {
  const { user, loading } = useCurrentUser();
  useEffect(() => { if (!loading && (!user || !hasPermission(user, perm))) window.location.href = "/"; }, [user, loading, perm]);
  return { user, loading, canWrite: !!user && hasWriteAccess(user, perm) };
}

// Référentiel UNIQUE des groupes illégaux : Base de données → onglet « Groupes » (table carte_gangs).
export interface Groupe { id: string; nom: string; type: string }
export function useGroupes(reload?: number) {
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  useEffect(() => {
    if (!supabase) return;
    supabase.from("carte_gangs").select("id,nom,type,sort_order").order("sort_order", { ascending: true }).order("nom").then(({ data }) => setGroupes((data || []) as Groupe[]));
  }, [reload]);
  return groupes;
}
export function useOrgs(reload?: number) { return useGroupes(reload).map(g => g.nom); }

// Liste déroulante des groupes (pas de saisie libre : on pointe vers le référentiel).
export function GroupeSelect({ value, onChange, groupes, placeholder = "— Choisir un groupe —" }: { value: string; onChange: (nom: string) => void; groupes: Groupe[]; placeholder?: string }) {
  const known = !value || groupes.some(g => g.nom === value);
  return (
    <div>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {!known && <option value={value}>{value} (hors référentiel)</option>}
        {groupes.map(g => <option key={g.id} value={g.nom}>{g.nom} · {gangTypeLabel(g.type)}</option>)}
      </select>
      <div style={{ fontSize: "0.65rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>Absent ? Crée-le dans <a href="/base-de-donnees" style={{ color: "var(--gold)" }}>Base de données → Groupes</a>.</div>
    </div>
  );
}

export const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick} style={{ padding: "0.25rem 0.75rem", borderRadius: 999, cursor: "pointer", fontSize: "0.75rem", fontFamily: "'Inter',sans-serif",
    border: `1px solid ${active ? "rgba(var(--gold-rgb),0.5)" : "var(--border)"}`, background: active ? "rgba(var(--gold-rgb),0.12)" : "transparent",
    color: active ? "var(--gold)" : "var(--text-muted)", fontWeight: active ? 600 : 400 }}>{children}</button>
);

export const Badge = ({ color, children }: { color: string; children: React.ReactNode }) => (
  <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.55rem", borderRadius: 999, fontWeight: 700, color, background: `color-mix(in srgb, ${color} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 35%, transparent)` }}>{children}</span>
);

export const fmtDT = (s?: string | null) => (s ? new Date(s).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");
export function toLocalInput(s?: string | null) {
  if (!s) return "";
  const d = new Date(s); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
export const fromLocalInput = (s: string) => (s ? new Date(s).toISOString() : null);
export const usd = (n: number) => (n || 0).toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
