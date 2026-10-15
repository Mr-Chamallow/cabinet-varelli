import { DELAI_INTERORGA_JOURS, HEURES_MIN, HEURES_ARME_LOURDE, HEURES_ARME_AUTO, addDays } from "@/lib/regles";

export const STATUTS_RECRUTEMENT: Record<string, { label: string; color: string }> = {
  candidat: { label: "Candidat", color: "var(--info)" },
  valide: { label: "Validé", color: "var(--success)" },
  dossier: { label: "Dans le dossier", color: "var(--gold)" },
  refuse: { label: "Refusé", color: "var(--danger)" },
};
// Controle des conditions du reglement (gang / orga). Retourne la liste des points a regler.
export function problemes(f: any): string[] {
  const p: string[] = [];
  if (!f.age_ok) p.push("Âge 18 ans non confirmé");
  if (!f.wipe_fait) p.push("Wipe obligatoire avant de rejoindre un groupe officiel");
  if (Number(f.heures_jeu) < HEURES_MIN) p.push(`Moins de ${HEURES_MIN} h de jeu`);
  if (f.date_depart_ancien) {
    const ok = addDays(f.date_depart_ancien, DELAI_INTERORGA_JOURS).getTime() <= Date.now();
    if (!ok) p.push(`Délai interorga de ${DELAI_INTERORGA_JOURS} jours non écoulé (jusqu'au ${addDays(f.date_depart_ancien, DELAI_INTERORGA_JOURS).toLocaleDateString("fr-FR")})`);
  }
  if (!f.sanctions_verifiees) p.push("Historique des sanctions non vérifié");
  if (!(f.discord_id || "").trim() || !(f.unique_id || "").trim()) p.push("ID unique / ID Discord manquant (requis dans le dossier)");
  return p;
}
const yn = (b: boolean) => (b ? "✅" : "❌");
export function formatDiscord(f: any): string {
  const pr = problemes(f);
  return [
    `📝 **Fiche de recrutement : ${f.nom_rp}**`,
    `• Poste visé : ${f.poste || "-"}`,
    `• ID unique : ${f.unique_id || "-"}`,
    `• Discord : ${f.discord || "-"}${f.discord_id ? ` (${f.discord_id})` : ""}`,
    `• 18 ans ou plus : ${yn(f.age_ok)}`,
    `• Wipe effectué : ${yn(f.wipe_fait)}`,
    `• Heures de jeu : ${Number(f.heures_jeu) || 0} h (min. ${HEURES_MIN} h, armes automatiques ${HEURES_ARME_AUTO} h, armes lourdes ${HEURES_ARME_LOURDE} h)`,
    `• Ancien groupe : ${f.ancien_groupe || "aucun"}${f.date_depart_ancien ? ` (départ le ${new Date(f.date_depart_ancien).toLocaleDateString("fr-FR")})` : ""}`,
    `• Sanctions vérifiées : ${yn(f.sanctions_verifiees)}${f.sanctions_notes ? ` (${f.sanctions_notes})` : ""}`,
    f.gdoc_url ? `• Gdoc : ${f.gdoc_url}` : "",
    f.histoire ? `• Histoire : ${String(f.histoire).slice(0, 300)}${String(f.histoire).length > 300 ? "..." : ""}` : "",
    `• Statut : ${(STATUTS_RECRUTEMENT[f.statut] || { label: f.statut }).label}`,
    pr.length ? `⚠️ À régler : ${pr.join(" ; ")}` : "✅ Conditions du règlement remplies",
  ].filter(Boolean).join("\n");
}

