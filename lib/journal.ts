import type { Db } from "@/lib/serverAuth";
// Journal d'activité : une ligne par action importante. Échec silencieux, jamais bloquant.
export async function journaliser(db: Db, auteur: string, action: string, cible?: string | null, details?: string | null) {
  try {
    await db.from("cabinet_journal").insert([{ auteur_nom: auteur, action, cible: cible || null, details: details || null }]);
  } catch {
    // le journal ne doit jamais bloquer une action
  }
}
