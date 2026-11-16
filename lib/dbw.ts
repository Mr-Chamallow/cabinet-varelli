"use client";
import type { Row } from "@/lib/types";
// Ecriture via l'API serveur (controle des permissions + journal d'audit). Meme forme de retour que supabase : { data, error }.
type R<T = Row> = Promise<{ data: T | null; error: { message: string } | null }>;
async function call<T = Row>(table: string, method: string, body: Row): R<T> {
  try {
    const res = await fetch(`/api/db/${table}`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) return { data: null, error: { message: out?.error || `Erreur ${res.status}` } };
    return { data: out.data ?? null, error: null };
  } catch (e: unknown) { return { data: null, error: { message: e instanceof Error ? e.message : "Erreur reseau" } }; }
}
export const dbw = {
  insert: (table: string, row: Row): R => call(table, "POST", { row }),
  insertMany: (table: string, rows: Row[]): R<Row[]> => call<Row[]>(table, "POST", { rows }),
  update: (table: string, id: string, patch: Row): R => call(table, "PATCH", { id, patch }),
  remove: (table: string, id: string): R => call(table, "DELETE", { id }),
  removeAll: (table: string): R => call(table, "DELETE", { all: true }),
  upsert: (table: string, row: Row, onConflict = "id"): R => call(table, "PUT", { row, onConflict }),
};
