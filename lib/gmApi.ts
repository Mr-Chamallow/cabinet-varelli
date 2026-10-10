"use client";
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
export function scoreLabel(s: number): { label: string; color: string } {
  if (s >= 75) return { label: "Allié", color: "var(--success)" };
  if (s >= 55) return { label: "Bien noté", color: "#84cc16" };
  if (s >= 40) return { label: "Neutre", color: "var(--info)" };
  if (s >= 20) return { label: "Surveillé", color: "var(--warning)" };
  return { label: "Hostile", color: "var(--danger)" };
}
