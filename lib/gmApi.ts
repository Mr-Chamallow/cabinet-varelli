"use client";
import { palierOf } from "@/lib/rolesRP";
// Écriture des tables du Consortium via l'API serveur (contrôle des permissions + effets de bord).
export async function gmWrite(table: string, method: "POST" | "PATCH" | "DELETE", body: any): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch(`/api/gm/${table}`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error || `Erreur ${res.status}` };
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erreur réseau" };
  }
}

export const scoreOf = (deltas: number[]) => Math.max(0, Math.min(100, 50 + deltas.reduce((a, b) => a + b, 0)));
export function scoreLabel(s: number): { label: string; color: string; effet: string } {
  const p = palierOf(s); return { label: p.label, color: p.color, effet: p.effet };
}
