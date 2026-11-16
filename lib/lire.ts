// Lecture d'une table protégée via le serveur (/api/lecture).
// Même forme de réponse que Supabase : { data, error, count }.
// Exemple : await lire("obsidian_taxes", { order: [["created_at", false]] })

export type Lecture = {
  select?: string;
  eq?: [string, any][];
  ilike?: [string, string][];
  order?: [string, boolean][]; // [colonne, ascendant ?]
  range?: [number, number];
  limit?: number;
  count?: boolean;
  head?: boolean;
};

export async function lire(table: string, opts: Lecture = {}): Promise<{ data: any[] | null; error: { message: string } | null; count: number | null }> {
  try {
    const r = await fetch("/api/lecture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, ...opts }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) return { data: null, error: { message: j.error || "Erreur" }, count: null };
    return { data: j.data, error: null, count: j.count ?? null };
  } catch (e: any) {
    return { data: null, error: { message: String(e?.message || e) }, count: null };
  }
}
