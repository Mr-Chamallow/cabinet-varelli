"use client";
// Ecriture via l'API serveur (controle des permissions + journal d'audit). Meme forme de retour que supabase : { data, error }.
type R<T = any> = Promise<{ data: T | null; error: { message: string } | null }>;
async function call(table: string, method: string, body: any): R {
  try {
    const res = await fetch(`/api/db/${table}`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) return { data: null, error: { message: out?.error || `Erreur ${res.status}` } };
    return { data: out.data ?? null, error: null };
  } catch (e: any) { return { data: null, error: { message: e?.message || "Erreur reseau" } }; }
}
export const dbw = {
  insert: (table: string, row: any): R => call(table, "POST", { row }),
  insertMany: (table: string, rows: any[]): R<any[]> => call(table, "POST", { rows }),
  update: (table: string, id: string, patch: any): R => call(table, "PATCH", { id, patch }),
  remove: (table: string, id: string): R => call(table, "DELETE", { id }),
  removeAll: (table: string): R => call(table, "DELETE", { all: true }),
  upsert: (table: string, row: any, onConflict = "id"): R => call(table, "PUT", { row, onConflict }),
};
