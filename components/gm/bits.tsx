"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission, hasWriteAccess } from "@/lib/auth";

// Garde d'accès + droit d'écriture pour une page du Consortium.
export function useGmAccess(perm: string) {
  const { user, loading } = useCurrentUser();
  useEffect(() => { if (!loading && (!user || !hasPermission(user, perm))) window.location.href = "/"; }, [user, loading, perm]);
  return { user, loading, canWrite: !!user && hasWriteAccess(user, perm) };
}

// Liste des organisations (pour les listes déroulantes / suggestions).
export function useOrgs(reload?: number) {
  const [orgs, setOrgs] = useState<string[]>([]);
  useEffect(() => {
    if (!supabase) return;
    supabase.from("gm_organisations").select("nom").order("nom").then(({ data }) => setOrgs((data || []).map((o: any) => o.nom)));
  }, [reload]);
  return orgs;
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
