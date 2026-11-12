// Prestations groupées par catégorie, sans prix dans le nom, sans doublon
export function tarifsGroupes(tarifs: any[]): [string, { id: string; nom: string }[]][] {
  const groupes: Record<string, { id: string; nom: string }[]> = {};
  const vus = new Set<string>();
  for (const t of tarifs || []) {
    const cle = `${t.categorie}|${String(t.nom).trim().toLowerCase()}`;
    if (vus.has(cle)) continue;
    vus.add(cle);
    (groupes[t.categorie || "Autres"] = groupes[t.categorie || "Autres"] || []).push({ id: t.id, nom: String(t.nom).trim() });
  }
  return Object.entries(groupes);
}
