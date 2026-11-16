import type { Row } from "@/lib/types";
// Lecture d'une table protégée via le serveur (/api/lecture).
// Même forme de réponse que Supabase : { data, error, count }.
// Exemple : await lire("obsidian_taxes", { order: [["created_at", false]] })

export type Lecture = {
  select?: string;
  eq?: [string, unknown][];
  ilike?: [string, string][];
  gte?: [string, unknown][]; // colonne >= valeur
  gt?: [string, unknown][]; // colonne > valeur
  in?: [string, unknown[]][]; // colonne dans la liste
  contains?: [string, unknown][]; // tableau contient
  is?: [string, null][]; // colonne IS NULL
  or?: string; // filtre PostgREST, ex: "nom.ilike.%x%,prenom.ilike.%x%"
  order?: [string, boolean][]; // [colonne, ascendant ?]
  range?: [number, number];
  limit?: number;
  count?: boolean;
  head?: boolean;
};

export async function lire(table: string, opts: Lecture = {}): Promise<{ data: Row[] | null; error: { message: string } | null; count: number | null }> {
  try {
    const r = await fetch("/api/lecture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, ...opts }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) return { data: null, error: { message: j.error || "Erreur" }, count: null };
    return { data: j.data, error: null, count: j.count ?? null };
  } catch (e: unknown) {
    return { data: null, error: { message: e instanceof Error ? e.message : String(e) }, count: null };
  }
}

// Comme lire(), mais renvoie une seule ligne (ou null) : remplace maybeSingle().
export async function lireUn(table: string, opts: Lecture = {}) {
  const r = await lire(table, { ...opts, limit: 1 });
  return { data: r.data?.[0] ?? null, error: r.error };
}
