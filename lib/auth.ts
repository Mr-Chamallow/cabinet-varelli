import { supabase } from "@/lib/supabase";

export interface AppUser {
  id: string;
  nom: string;
  role: string;
  couleur?: string;
  discord_id?: string;
  permissions?: string[];
}

export type User = AppUser;

export const ALL_PERMISSIONS = [
  "obsidian_dashboard", "obsidian_prix", "obsidian_stocks", "obsidian_armurerie",
  "obsidian_garage", "obsidian_comptabilite", "obsidian_rdv", "obsidian_contrats", "obsidian_stats", "cahier_vente", "obsidian_paie",
  "obsidian_employes", "admin", "supervision", "delete_all", "edit_all",
  "juridique", "carte-enqueteur", "utile_samp", "base_donnees", "obsidian_actions", "obsidian_arrestations",
  "obsidian_fiches", "gm_tribunal", "gm_pactes", "gm_audits", "gm_evenements", "gm_reputation", "organigramme", "gm_stats",
];

export const PERMISSION_LABELS: Record<string, string> = {
  obsidian_dashboard: "Dashboard",
  obsidian_prix: "Tableau des prix", obsidian_stocks: "Stocks",
  obsidian_armurerie: "Stocks (vue Armurerie)", obsidian_garage: "Garage",
  obsidian_comptabilite: "Comptabilité", obsidian_rdv: "Rendez-vous & calendrier",
  obsidian_contrats: "Contrats",
  obsidian_stats: "Statistiques", cahier_vente: "Transaction (vente, blanchiment, équivalent)",
  obsidian_paie: "Paie & Commissions", obsidian_employes: "Employés",
  admin: "Administration & Personnalisation", supervision: "Supervision",
  delete_all: "Suppression globale", edit_all: "Édition globale",
  juridique: "Code pénal", "carte-enqueteur": "San Andreas",
  utile_samp: "Utile SAMP", base_donnees: "Base de données",
  obsidian_actions: "Actions illégales", obsidian_arrestations: "Arrestations",
  obsidian_fiches: "Fiches & Profil central", gm_tribunal: "Tribunal de l'Ombre", gm_pactes: "Pactes d'Obsidienne", gm_audits: "Audits de conformité",
  gm_evenements: "Convois / Enchères / Alertes", gm_reputation: "Réputation des groupes", organigramme: "Organigramme", gm_stats: "Stats du Consortium",
};

export const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  "Associé / Patron":               [...ALL_PERMISSIONS], // LA CLÉ QUI MANQUAIT
  "CEO - Directeur général":        [...ALL_PERMISSIONS],
  "COO - Directrice opérationnel":  ALL_PERMISSIONS.filter(p => p !== "delete_all"),
  "Responsable juridique":          ["obsidian_dashboard","obsidian_rdv","obsidian_contrats","obsidian_stats","juridique","utile_samp","carte-enqueteur"],
  "Agent juridique":                ["obsidian_dashboard","obsidian_rdv","juridique","utile_samp","carte-enqueteur"],
  "Responsable logistique":         ["obsidian_dashboard","obsidian_prix","obsidian_stocks","obsidian_armurerie","obsidian_garage","obsidian_comptabilite","obsidian_rdv","obsidian_contrats","obsidian_stats","cahier_vente","obsidian_paie","obsidian_employes","carte-enqueteur","obsidian_actions","obsidian_arrestations"],
  "Agent logistique":               ["obsidian_dashboard","obsidian_prix","obsidian_stocks","obsidian_rdv","cahier_vente","carte-enqueteur","obsidian_actions","obsidian_arrestations"],
  "Responsable sécurité":           ["obsidian_dashboard","obsidian_armurerie","obsidian_rdv","carte-enqueteur","juridique","utile_samp","obsidian_arrestations","obsidian_stocks"],
  "Agent de sécurité":              ["obsidian_dashboard","obsidian_armurerie","obsidian_rdv","carte-enqueteur","obsidian_arrestations","obsidian_stocks"],
  "Opérateur":                      ["obsidian_dashboard","obsidian_rdv","carte-enqueteur","obsidian_actions","obsidian_arrestations"],
  "Opérateur stagiaire":            ["obsidian_dashboard"],
  // Rôle externe (site "Légal Service") - accès à la carte enquêteur uniquement, en lecture seule.
  "Légal Service":                  ["carte-enqueteur"],
};

// Rôles dont l'accès à la carte enquêteur est strictement en lecture seule
// (pas de création/édition/suppression de point, dossier, registre, catégories, groupes).
// Conservé pour compat, mais désormais doublé par le système de niveaux ci-dessous
// (une permission stockée en "perm:read" produit le même effet, rôle par rôle).
export const READONLY_ROLES = ["Légal Service"];

// --- Niveaux d'accès par permission (onglet) ---
// Une entrée de permission peut s'écrire "perm" (= écriture, comportement
// historique) ou "perm:read" (lecture seule). Rien ne casse pour les rôles
// non migrés : toute entrée sans suffixe reste en écriture comme avant.
export type PermLevel = "none" | "read" | "write";

function parsePermEntry(entry: string): { key: string; level: PermLevel } {
  if (entry.endsWith(":read")) return { key: entry.slice(0, -5), level: "read" };
  if (entry.endsWith(":write")) return { key: entry.slice(0, -6), level: "write" };
  return { key: entry, level: "write" };
}

export function getPermLevel(userOrRole: AppUser | string | null, permission: string): PermLevel {
  if (!userOrRole) return "none";
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole.role;
  const supaPerms = typeof userOrRole === "string" ? [] : (userOrRole.permissions || []);
  const defaultPerms = DEFAULT_PERMISSIONS[role] || [];
  const all = [...new Set([...supaPerms, ...defaultPerms])];
  if (all.includes("admin")) return "write";
  let level: PermLevel = "none";
  for (const entry of all) {
    const { key, level: l } = parsePermEntry(entry);
    if (key !== permission) continue;
    if (l === "write") return "write"; // l'écriture l'emporte si les deux existent
    level = l;
  }
  return level;
}

export function hasPermission(userOrRole: AppUser | string | null, permission: string): boolean {
  return getPermLevel(userOrRole, permission) !== "none";
}

// Accès en écriture (création/édition/suppression) sur un onglet donné.
export function hasWriteAccess(userOrRole: AppUser | string | null, permission: string): boolean {
  return getPermLevel(userOrRole, permission) === "write";
}

export function isReadOnlyRole(userOrRole: AppUser | string | null): boolean {
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole?.role;
  if (!!role && READONLY_ROLES.includes(role)) return true;
  return getPermLevel(userOrRole, "carte-enqueteur") === "read";
}

export const canAccess = hasPermission;

// Ordre de priorité des pages d'atterrissage après connexion, utilisé quand
// l'utilisateur n'a pas accès au Dashboard (ex: rôle "Légal Service" limité à la
// carte enquêteur). Avant ce correctif, ces rôles étaient renvoyés vers /login,
// qui les renvoyait vers /, qui les renvoyait vers /login... boucle infinie.
const LANDING_PRIORITY: { path: string; permission: string }[] = [
  { path: "/", permission: "obsidian_dashboard" },
  { path: "/obsidian/prix", permission: "obsidian_prix" },
  { path: "/obsidian/stocks", permission: "obsidian_stocks" },
  { path: "/obsidian/armurerie", permission: "obsidian_armurerie" },
  { path: "/obsidian/garage", permission: "obsidian_garage" },
  { path: "/obsidian/comptabilite", permission: "obsidian_comptabilite" },
  { path: "/obsidian/rdv", permission: "obsidian_rdv" },
  { path: "/obsidian/contrats", permission: "obsidian_contrats" },
  { path: "/obsidian/actions-illegales", permission: "obsidian_actions" },
  { path: "/obsidian/arrestations", permission: "obsidian_arrestations" },
  { path: "/obsidian/stats", permission: "obsidian_stats" },
  { path: "/obsidian/fiches", permission: "obsidian_fiches" },
  { path: "/cahier-vente", permission: "cahier_vente" },
  { path: "/obsidian/paie", permission: "obsidian_paie" },
  { path: "/obsidian/employes", permission: "obsidian_employes" },
  { path: "/juridique", permission: "juridique" },
  { path: "/utile-samp", permission: "utile_samp" },
  { path: "/carte-enqueteur", permission: "carte-enqueteur" },
  { path: "/base-de-donnees", permission: "base_donnees" },
  { path: "/obsidian/organigramme", permission: "organigramme" },
  { path: "/obsidian/tribunal", permission: "gm_tribunal" },
  { path: "/obsidian/pactes", permission: "gm_pactes" },
  { path: "/obsidian/audits", permission: "gm_audits" },
  { path: "/obsidian/evenements", permission: "gm_evenements" },
  { path: "/obsidian/reputation", permission: "gm_reputation" },
  { path: "/obsidian/consortium", permission: "gm_stats" },
  { path: "/admin", permission: "admin" },
  { path: "/supervision", permission: "supervision" },
];

// Renvoie la première page à laquelle l'utilisateur a réellement accès.
// Ne renvoie JAMAIS "/login" pour un utilisateur déjà authentifié : ça créerait
// la même boucle infinie que celle qu'on corrige ici.
export function firstAccessiblePath(user: AppUser): string {
  for (const { path, permission } of LANDING_PRIORITY) {
    if (hasPermission(user, permission)) return path;
  }
  return "/no-access";
}

export function getMemberColor(roleOrName?: string, customColor?: string): string {
  if (customColor) return customColor;
  switch (roleOrName) {
    case "CEO - Directeur général": return "#8b5cf6";
    case "COO - Directrice opérationnel": return "#6366f1";
    case "Responsable juridique": return "#a78bfa";
    case "Agent juridique": return "#a0916d";
    case "Responsable logistique": return "#ef4444";
    case "Agent logistique": return "#f97316";
    case "Responsable sécurité": return "#64748b";
    case "Agent de sécurité": return "#475569";
    default: return "#334155";
  }
}

export async function loadRolesFromSupabase(): Promise<any[]> {
  try {
    if (!supabase) return [];
    const { data, error } = await supabase.from("roles").select("*");
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}