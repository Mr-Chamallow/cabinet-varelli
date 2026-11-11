"use client";
// Appel de la suppression définitive : demande la confirmation SUPPRIMER
export async function supprimerDefinitivement(corps: { type: string; id?: string }, quoi: string): Promise<{ ok: boolean; message: string }> {
  const saisie = window.prompt(`Suppression définitive : ${quoi}\nCette action est irréversible. Tape SUPPRIMER pour confirmer.`);
  if (saisie !== "SUPPRIMER") return { ok: false, message: "Suppression annulée" };
  const r = await fetch("/api/cabinet/suppression", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...corps, confirmation: "SUPPRIMER" }) });
  const d = await r.json();
  if (!r.ok || d.error) return { ok: false, message: d.error || "Erreur" };
  return { ok: true, message: `${d.supprimes} élément(s) supprimé(s) définitivement` };
}
