// Pas de "use client" ici : ce module est utilisé aussi bien par des Client Components
// (Sidebar, pages) que par du code serveur (lib/serverAuth.ts, dans les routes API).
// Marquer ce fichier "use client" transforme ses exports en "Client References" côté
// serveur : appeler hasPermission() depuis une route API plante avec
// "Attempted to call hasPermission() from the server but hasPermission is on the client."
// Ce module ne contient que des fonctions pures / constantes — aucune API navigateur,
// aucun hook React — donc il n'a jamais eu besoin de cette directive.
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
  "obsidian_employes", "h47", "admin", "supervision", "delete_all", "edit_all",
  "juridique", "calculatrice", "carte-enqueteur", "utile_samp",
];

export const PERMISSION_LABELS: Record<string, string> = {
  obsidian_dashboard: "Dashboard",
  obsidian_prix: "Tableau des prix", obsidian_stocks: "Stocks",
  obsidian_armurerie: "Armurerie", obsidian_garage: "Garage",
  obsidian_comptabilite: "Comptabilité", obsidian_rdv: "Planning opérations",
  obsidian_contrats: "Contrats", obsidian_planification: "Planification",
  obsidian_stats: "Statistiques", cahier_vente: "Cahier de vente",
  obsidian_paie: "Paie & Commissions", obsidian_employes: "Employés",
  h47: "H-47", admin: "Administration", supervision: "Supervision",
  delete_all: "Suppression globale", edit_all: "Édition globale",
  juridique: "Code pénal", calculatrice: "Calculatrice", "carte-enqueteur": "Carte enquêteur",
  utile_samp: "Utile SAMP",
};

export const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  "Associé / Patron":               [...ALL_PERMISSIONS], // ← LA CLÉ QUI MANQUAIT
  "CEO - Directeur général":        [...ALL_PERMISSIONS],
  "COO - Directrice opérationnel":  ALL_PERMISSIONS.filter(p => p !== "delete_all"),
  "Responsable juridique":          ["obsidian_dashboard","obsidian_rdv","obsidian_contrats","obsidian_stats","juridique","utile_samp","carte-enqueteur"],
  "Agent juridique":                ["obsidian_dashboard","obsidian_rdv","juridique","utile_samp","carte-enqueteur"],
  "Responsable logistique":         ["obsidian_dashboard","obsidian_prix","obsidian_stocks","obsidian_armurerie","obsidian_garage","obsidian_comptabilite","obsidian_rdv","obsidian_contrats","obsidian_planification","obsidian_stats","cahier_vente","h47","obsidian_paie","obsidian_employes","calculatrice","carte-enqueteur"],
  "Agent logistique":               ["obsidian_dashboard","obsidian_prix","obsidian_stocks","obsidian_rdv","cahier_vente","h47","carte-enqueteur"],
  "Responsable sécurité":           ["obsidian_dashboard","obsidian_armurerie","obsidian_rdv","obsidian_planification","carte-enqueteur","juridique","utile_samp"],
  "Agent de sécurité":              ["obsidian_dashboard","obsidian_armurerie","obsidian_rdv","carte-enqueteur"],
  "Opérateur":                      ["obsidian_dashboard","obsidian_rdv","carte-enqueteur"],
  "Opérateur stagiaire":            ["obsidian_dashboard"],
  // Rôle externe (site "Légal Service") — accès à la carte enquêteur uniquement, en lecture seule.
  "Légal Service":                  ["carte-enqueteur"],
};

// Rôles dont l'accès à la carte enquêteur est strictement en lecture seule
// (pas de création/édition/suppression de point, dossier, registre, catégories, groupes).
export const READONLY_ROLES = ["Légal Service"];

export function isReadOnlyRole(userOrRole: AppUser | string | null): boolean {
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole?.role;
  return !!role && READONLY_ROLES.includes(role);
}

export function hasPermission(userOrRole: AppUser | string | null, permission: string): boolean {
  if (!userOrRole) return false;
  if (typeof userOrRole === "string") {
    const perms = DEFAULT_PERMISSIONS[userOrRole] || [];
    return perms.includes(permission) || perms.includes("admin");
  }
  const supaPerms = userOrRole.permissions || [];
  const defaultPerms = DEFAULT_PERMISSIONS[userOrRole.role] || [];
  const perms = [...new Set([...supaPerms, ...defaultPerms])]; // union — toujours à jour même si Supabase pas migré
  return perms.includes(permission) || perms.includes("admin");
}

export const canAccess = hasPermission;

// Ordre de priorité des pages d'atterrissage après connexion, utilisé quand
// l'utilisateur n'a pas accès au Dashboard (ex: rôle "Légal Service" limité à la
// carte enquêteur). Avant ce correctif, ces rôles étaient renvoyés vers /login,
// qui les renvoyait vers /, qui les renvoyait vers /login... boucle infinie.
const LANDING_PRIORITY: { path: string; permission: string }[] = [
  { path: "/", permission: "obsidian_dashboard" },
  { path: "/carte-enqueteur", permission: "carte-enqueteur" },
  { path: "/juridique", permission: "juridique" },
  { path: "/utile-samp", permission: "utile_samp" },
  { path: "/obsidian/prix", permission: "obsidian_prix" },
  { path: "/cahier-vente", permission: "cahier_vente" },
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