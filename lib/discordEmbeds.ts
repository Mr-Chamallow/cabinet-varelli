import { NotifyEmbed } from "@/lib/notifyDiscord";

const v = (x: any) => (x === null || x === undefined || x === "" ? "—" : String(x));
const fmtUSD = (n: number) => (n || 0).toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const PRIO_COLOR: Record<string, number> = {
  Basse: 0x4c5470, Normale: 0x64b5f6, Haute: 0xeab308, Critique: 0xff5470, "Neutralisé": 0x22c55e,
};

export function buildFicheEmbed(f: any): NotifyEmbed {
  return {
    title: `🗂️ ${f.nom}`,
    color: PRIO_COLOR[f.priorite] ?? 0xa48fff,
    fields: [
      { name: "Type", value: v(f.type), inline: true },
      { name: "Priorité", value: v(f.priorite), inline: true },
      { name: "Statut", value: v(f.statut), inline: true },
      { name: "Organisation", value: v(f.organisation), inline: true },
      { name: "Occupation", value: v(f.occupation), inline: true },
      { name: "Origine", value: v(f.origine), inline: true },
      { name: "Âge", value: v(f.age), inline: true },
      { name: "Téléphone", value: v(f.telephone), inline: true },
      { name: "Discord", value: v(f.discord), inline: true },
      { name: "Tags", value: f.tags?.length ? f.tags.join(", ") : "—", inline: false },
      { name: "Adresses", value: v(f.adresses), inline: false },
      { name: "Véhicules", value: v(f.vehicules), inline: false },
      { name: "Comptes bancaires RP", value: v(f.comptes_bancaires), inline: false },
      { name: "Relations", value: v(f.relations), inline: false },
      { name: "Notes", value: v(f.notes_publiques), inline: false },
    ],
  };
}

const STATUT_CONTRAT_COLOR: Record<string, number> = {
  "En attente": 0x4c5470, "En cours": 0xeab308, "Terminé": 0x22c55e, "Échoué": 0xff5470, "Annulé": 0x555566,
};

export function buildContratEmbed(c: any): NotifyEmbed {
  return {
    title: `📋 ${c.titre}`,
    color: STATUT_CONTRAT_COLOR[c.statut] ?? 0xa48fff,
    fields: [
      { name: "Type", value: v(c.type), inline: true },
      { name: "Difficulté", value: v(c.difficulte), inline: true },
      { name: "Statut", value: v(c.statut), inline: true },
      { name: "Récompense", value: fmtUSD(c.recompense), inline: true },
      { name: "Date cible", value: v(c.date_cible), inline: true },
      { name: "Membres affectés", value: c.membres_affectes?.length ? c.membres_affectes.join(", ") : "—", inline: false },
      { name: "Description", value: v(c.description), inline: false },
      ...(c.rapport ? [{ name: "Rapport", value: v(c.rapport), inline: false }] : []),
    ],
  };
}

export function buildRdvEmbed(r: any): NotifyEmbed {
  return {
    title: `📅 ${r.titre}`,
    color: 0xa48fff,
    fields: [
      { name: "Client", value: v(r.client), inline: true },
      { name: "Date", value: v(r.date), inline: true },
      { name: "Heure", value: v(r.heure), inline: true },
      { name: "Lieu", value: v(r.lieu), inline: true },
      { name: "Type", value: v(r.type), inline: true },
      { name: "Contrat lié", value: v(r.contrat_ref), inline: true },
      { name: "Notes", value: v(r.notes), inline: false },
    ],
  };
}
