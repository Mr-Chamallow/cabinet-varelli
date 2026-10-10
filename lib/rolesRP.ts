// Vocabulaire RP du Consortium (d'après la doc « Game Master ») : surnom, sigle et pôle de chaque rôle.
// Les NOMS de rôle restent ceux de la base (clés) ; seul l'affichage change.
export interface RoleRP { surnom: string; sigle?: string; pole: "Directoire" | "Juridique" | "Logistique" | "Sécurité" | "Opérations"; titre: string; fonction: string }
export const ROLE_RP: Record<string, RoleRP> = {
  "Associé / Patron": { surnom: "L'Arbitre Suprême", sigle: "CEO", pole: "Directoire", titre: "Directeur général", fonction: "Visage public du consortium. Ne tranche que les litiges que personne d'autre ne peut régler. Juge suprême du Tribunal de l'Ombre." },
  "CEO - Directeur général": { surnom: "L'Arbitre Suprême", sigle: "CEO", pole: "Directoire", titre: "Directeur général", fonction: "Visage public du consortium. Ne tranche que les litiges que personne d'autre ne peut régler. Juge suprême du Tribunal de l'Ombre." },
  "COO - Directrice opérationnel": { surnom: "Le Maître du Jeu", sigle: "COO", pole: "Directoire", titre: "Directeur Opérationnel", fonction: "Gère les événements sur le terrain : contacte les groupes pour les convois, organise les ventes aux enchères." },
  "Responsable juridique": { surnom: "L'Inquisiteur", sigle: "CLO", pole: "Juridique", titre: "Responsable juridique", fonction: "Ancien procureur général corrompu. Applique le cadre légal du crime, lit l'acte d'accusation au Tribunal de l'Ombre." },
  "Agent juridique": { surnom: "Les Spectres", pole: "Juridique", titre: "Agent juridique (Enquêteur)", fonction: "Yeux et oreilles d'Obsidian : infiltrent les scènes, observent les flux, notent qui respecte les pactes." },
  "Avocat": { surnom: "La Défense d'office", pole: "Juridique", titre: "Avocat", fonction: "Désigné d'office pour défendre l'accusé au Tribunal de l'Ombre." },
  "Responsable logistique": { surnom: "L'Intendant", sigle: "HoL", pole: "Logistique", titre: "Responsable logistique", fonction: "Contrôle les ressources physiques : hangars de Blaine County, cargaisons de Cayo Perico." },
  "Agent logistique": { surnom: "Les Transporteurs", pole: "Logistique", titre: "Agent logistique (Transporteur)", fonction: "Chauffeurs et pilotes : conduite irréprochable, discrétion absolue." },
  "Responsable sécurité": { surnom: "Le Prévôt", sigle: "CSO", pole: "Sécurité", titre: "Responsable sécurité", fonction: "Ancien haut gradé militaire. Gardien de la neutralité : nettoie la zone de façon chirurgicale si un coup de feu éclate." },
  "Agent de sécurité": { surnom: "Les Exécuteurs", pole: "Sécurité", titre: "Agent de sécurité (Security Operator)", fonction: "Gardes et exécuteurs : sécurisent les convois et capturent les cibles condamnées." },
  "Opérateur": { surnom: "L'Opérateur", pole: "Opérations", titre: "Opérateur", fonction: "Membre confirmé, intégré aux opérations de son pôle." },
  "Opérateur stagiaire": { surnom: "Le Novice", pole: "Opérations", titre: "Opérateur stagiaire", fonction: "En période de test, sous la surveillance de sa hiérarchie." },
  "Légal Service": { surnom: "Le Service légal", pole: "Juridique", titre: "Légal Service", fonction: "Support juridique du consortium." },
};
export const roleRP = (role?: string | null): RoleRP | null => (role ? ROLE_RP[role] || null : null);
// « CEO · L'Arbitre Suprême »
export const roleTag = (role?: string | null) => { const r = roleRP(role); return r ? `${r.sigle ? r.sigle + " · " : ""}${r.surnom}` : role || ""; };

// -- Réputation : échelle nommée --
export interface Palier { min: number; label: string; color: string; effet: string }
export const PALIERS: Palier[] = [
  { min: 85, label: "Partenaire du Directoire", color: "var(--success)", effet: "Contrats d'importation exclusifs, invitation prioritaire aux Enchères de Grand Senora." },
  { min: 70, label: "Allié reconnu", color: "#4ade80", effet: "Accès aux convois et enchères, médiation favorable." },
  { min: 55, label: "Partenaire de confiance", color: "#84cc16", effet: "Peut signer un Pacte d'Obsidienne et recevoir des contrats standards." },
  { min: 40, label: "Neutre", color: "var(--info)", effet: "Aucun avantage ni sanction. Observé par les Spectres." },
  { min: 25, label: "Sous surveillance", color: "var(--warning)", effet: "Audit possible, contrats restreints, Spectres dédiés." },
  { min: 10, label: "Sanctionné", color: "#f97316", effet: "Embargo (armes 48h), exclu des enchères, convocation du Directoire." },
  { min: 0, label: "Banni du Consortium", color: "var(--danger)", effet: "Hors pactes. Tribunal de l'Ombre : exécution possible du verdict." },
];
export const palierOf = (score: number): Palier => PALIERS.find(p => score >= p.min) || PALIERS[PALIERS.length - 1];
