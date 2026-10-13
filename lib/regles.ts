// Regles FlashBackFA (organisation illegale) utilisees par les alertes de l'app.
// Source : https://sites.google.com/view/reglement-flashback-fa (pages Illegal, Gang / Orga, Catalogue illegal, Aide dossier)
// Les alertes sont INFORMATIVES : elles ne bloquent jamais la saisie.
import { VEH_LIST, Veh, normV, vehExact } from "@/lib/vehicules";

export const REGLES_VU_LE = "11/10/2026";
export const REGLES_LIENS = {
  illegal: "https://sites.google.com/view/reglement-flashback-fa/illégal/illégal",
  gangOrga: "https://sites.google.com/view/reglement-flashback-fa/illégal/gang-orga",
  catalogue: "https://sites.google.com/view/reglement-flashback-fa/illégal/catalogue-illégal",
  dossier: "https://sites.google.com/view/reglement-flashback-fa/général/aide-dossier",
};

// ---- Chiffres cles (modifiables dans la page Reglement quand c'est un reglage) ----
export const DEFAUTS = { effectifMax: 25, effectifGdt: 20, effectifDiscord: 25, dossierMin: 15, kevlarMax: 5, productionMax: 3, revendicationMax: 2 };
export const DROGUES_ORGA = ["Cocaïne", "Tranq", "Meth Bleue", "Mexicana"];
export const PRODUIT_DEFAUT = ["Cocaïne", "Tranq", "Mexicana"];
export const REVENDIQUE_DEFAUT = ["Cocaïne", "Mexicana"];
export const RANCON_MAX_OTAGE = 5000;
export const RANCON_MAX_PRISE = 15000;
export const TAXE_REVENTE_MAX_PCT = 80;
export const TAXE_RECOLTE_MAX_SEMAINE = 50000;
export const DELAI_INTERORGA_JOURS = 4;
export const HEURES_MIN = 50;
export const HEURES_ARME_LOURDE = 200;
export const TREVE_JOURS = 7;
export const COOLDOWN_ZONE_JOURS = 5;
export const COOLDOWN_BUSINESS_JOURS = 7;
export const EVENTS_PAR_MOIS = 2;

const n = (s: string) => normV(s);
export function drogueAutorisee(nom: string): boolean {
  const x = n(nom);
  return /cocaine|tranq|meth bleue|meth blue|mexicana/.test(x);
}
export function drogueFamille(nom: string): string | null {
  const x = n(nom);
  if (/cocaine/.test(x)) return "Cocaïne";
  if (/tranq/.test(x)) return "Tranq";
  if (/meth bleue|meth blue/.test(x)) return "Meth Bleue";
  if (/mexicana/.test(x)) return "Mexicana";
  return null;
}

// ---- Armes interdites a la vente aux petites frappes / independants ----
export function armeLourdeOuAuto(nom: string): boolean {
  return /(\bump\b|\bsmg\b|mitrailleur|\buzi\b|\bmp5\b|mac ?10|tec ?9|carabine|fusil d.assaut|\bak\b|\bm4\b|\bscar\b|minigun|\brpg\b|lance.?roquette|sniper|fusil lourd|automatique|assaut)/i.test(nom || "");
}

// ---- Vehicules ----
export type VehNiveau = "interdit" | "attention" | "info";
export interface VehNote { niveau: VehNiveau; texte: string }

// Catalogue illegal : "Interdit Organisation" (et toute mention qui contient Organisation) + "Interdit pour tous"
const INTERDIT_ORGA = new Set("exemplar buffalo5 dominator7 buffalo buffalo2 buffalo3 drifttampa gb200 omnis sentinel3 sentinel4 streiter sultan2 sultan3 baller baller7 gresley huntley seminole2 contender hellion guardian esskey bf400 manchez sanchez sanchez2 draugur".split(" "));
const LORE_JAP = new Set("elegy elegy2 euros kuruma sugoi".split(" "));
const MC_AMERICAIN = new Set("avarus bagger chimera daemon daemon2 enduro hexer innovation ratbike sanctus sovereign thrust vindicator wolfsbane zombiea zombieb".split(" "));
const MC_JAPONAIS = new Set("akuma bati bati2 carbonrs defiler diablous diablous2 double hakuchou hakuchou2 powersurge reever ruffian shinobi stryder vortex".split(" "));
const MC_SEUL = new Set(["issi7"]);
// Page Illegal : vehicules interdits pour toute action illegale (liste du reglement, correspondance par modele)
const INTERDIT_ACTION = new Set("schlagen comet6 comet7 niobe tenf tenf2 seven70 tempesta turismor turismo3 coquette4 vagrant draugur".split(" "));
// Transactions : seuls les vans, sauf ces exceptions
const VANS_EXCLUS = new Set("bison bison2 bison3 bobcatxl burrito burrito2 burrito3 burrito4 burrito5 gburrito gburrito2".split(" "));
// Laboratoires : 4x4/SUV autorises sauf ceux-ci
const LABO_EXCLUS = new Set("dune dune2 kalahari outlaw trophytruck trophytruck2 vagrant verus winky astron habanero radi serrano toros rebla novak jubilee gresley".split(" "));

export function vehNote(saisie: string): VehNote | null {
  const v = vehExact(saisie);
  if (!v) return saisie.trim() ? { niveau: "info", texte: "hors liste" } : null;
  const c = v.code;
  if (INTERDIT_ORGA.has(c)) return { niveau: "interdit", texte: "interdit aux organisations (catalogue FA)" };
  if (INTERDIT_ACTION.has(c)) return { niveau: "interdit", texte: "interdit pour toute action illégale (règlement)" };
  if (LORE_JAP.has(c)) return { niveau: "interdit", texte: "réservé lore japonais" };
  if (MC_AMERICAIN.has(c) || MC_JAPONAIS.has(c) || MC_SEUL.has(c)) return { niveau: "interdit", texte: "réservé aux MC" };
  if (v.cat === "Motos") return { niveau: "attention", texte: "motos : interdites en braquage/vente de drogue (sauf MC)" };
  if (v.cat === "Supercars") return { niveau: "attention", texte: "supersportive : 1 max par scène avec police, interdite en petite scène" };
  return null;
}

export function vehUsageNote(saisie: string, usage: string): VehNote | null {
  const v = vehExact(saisie); if (!v) return null;
  if (usage === "Transaction" && (v.cat !== "Vans" || VANS_EXCLUS.has(v.code))) return { niveau: "interdit", texte: "transaction : seuls les vans sont autorisés (hors Bison, Bobcat XL, Burrito, Guardian)" };
  if (usage === "Laboratoire" && LABO_EXCLUS.has(v.code)) return { niveau: "interdit", texte: "ce véhicule est interdit pour les laboratoires" };
  return null;
}

export const USAGES = ["Standard", "Transaction", "Convoi", "Laboratoire"];

// Liste des vehicules sans interdiction pour nous (organisation, lore mixte)
export function vehAutorises(): Veh[] {
  return VEH_LIST.filter(v => { const t = vehNote(v.nom); return !t || t.niveau !== "interdit"; });
}
export function vehInterdits(): { v: Veh; note: VehNote }[] {
  return VEH_LIST.map(v => ({ v, note: vehNote(v.nom) as VehNote })).filter(x => x.note && x.note.niveau === "interdit");
}

// ---- Kevlar ----
export function estKevlar(s: { nom?: string; categorie?: string }): boolean {
  return (s.categorie || "").toLowerCase() === "kev" || /kevlar|gilet|gpb|pare.?balle/i.test(s.nom || "");
}

// ---- Dates ----
export function addDays(d: string | Date, days: number): Date { const x = new Date(d); x.setDate(x.getDate() + days); return x; }
export function joursRestants(fin: Date | string | null): number {
  if (!fin) return 0; return Math.ceil((new Date(fin).getTime() - Date.now()) / 86400_000);
}
export function debutMois(d = new Date()): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
