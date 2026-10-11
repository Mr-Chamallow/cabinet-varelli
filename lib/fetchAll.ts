// Supabase renvoie 1000 lignes maximum par requete, meme avec .limit(10000). Ce helper lit TOUT, page par page.
// Usage : const rows = await fetchAll((a, b) => supabase.from("t").select("*").order("created_at").order("id").range(a, b));
export async function fetchAll<T = any>(build: (from: number, to: number) => PromiseLike<{ data: any[] | null; error: any }>, page = 1000, max = 100000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < max; from += page) {
    const { data, error } = await build(from, from + page - 1);
    if (error) throw new Error(error.message || "Erreur de lecture");
    const rows = data || [];
    out.push(...(rows as T[]));
    if (rows.length < page) break;
  }
  return out;
}
