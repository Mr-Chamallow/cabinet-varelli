// --- Types locaux (miroir des tables bdd_personnes / bdd_vehicules / bdd_activites) ---
export type Personne = {
  id: string; nom: string; prenom?: string; surnom?: string; telephone?: string;
  age?: number | null; origine?: string; occupation?: string; organisation?: string;
  groupe_id?: string | null; photo_identite?: string | null; photo_police?: string | null;
  statut?: string; priorite?: string; tags?: string[]; adresses?: string;
  comptes_bancaires?: string; relations?: string; notes_publiques?: string; notes_privees?: string;
  discord?: string; created_at?: string; liens_ids?: string[]; prime?: number | null;
};

export type Vehicule = {
  id: string; plaque: string; marque_modele?: string; couleur?: string;
  proprietaire_id?: string | null; groupe_id?: string | null; photos?: string[]; notes?: string; created_at?: string;
};

// --- Timeline d'activité (table bdd_activites) ---
export type Activite = { id: string; personne_id: string; type: string; description: string; created_at: string; created_by?: string };
export const ACT_ICON: Record<string, string> = { creation: "🆕", statut: "🔁", groupe: "🛡️", recensement: "📍", lien: "🔗", edition: "✏️" };

export const PRIOS = ["Basse", "Normale", "Haute", "Critique", "Neutralisé"];
export const PCOL: Record<string, string> = { Basse: "var(--text-dim)", Normale: "var(--info)", Haute: "var(--warning)", Critique: "var(--danger)", Neutralisé: "var(--success)" };

export const EMPTY_PERSONNE: Omit<Personne, "id"> = { nom: "", prenom: "", surnom: "", telephone: "", age: null, origine: "", occupation: "", organisation: "", groupe_id: null, photo_identite: null, photo_police: null, statut: "Actif", priorite: "Normale", tags: [], adresses: "", comptes_bancaires: "", relations: "", notes_publiques: "", notes_privees: "", discord: "", liens_ids: [] };
export const EMPTY_VEHICULE: Omit<Vehicule, "id"> = { plaque: "", marque_modele: "", couleur: "", proprietaire_id: null, groupe_id: null, photos: [], notes: "" };

export function fullName(p: Personne) {
  return [p.nom, p.prenom].filter(Boolean).join(" ") || p.nom;
}
