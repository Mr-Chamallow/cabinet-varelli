"use client";

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
  "dashboard", "clients", "dossiers", "factures", "casier", "simulateur", "audiences",
  "juridique", "calculatrice", "supervision", "admin", "delete_all", "edit_all",
  "comptabilite", "h47",
  "obsidian_dashboard", "obsidian_prix", "obsidian_stocks", "obsidian_armurerie",
  "obsidian_garage", "obsidian_comptabilite", "obsidian_rdv", "obsidian_contrats",
  "obsidian_planification", "obsidian_stats", "cahier_vente"
];

export const PERMISSION_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord", clients: "Gestion clients", dossiers: "Dossiers juridiques",
  factures: "Facturation", casier: "Casier judiciaire", simulateur: "Simulateur",
  audiences: "Audiences", juridique: "Espace juridique", calculatrice: "Calculatrice",
  supervision: "Supervision", admin: "Administration", delete_all: "Suppression globale",
  edit_all: "Édition globale", comptabilite: "Comptabilité (Cabinet)", h47: "H-47 (Tracker de vente)",
  obsidian_dashboard: "Obsidian - Dashboard",
  obsidian_prix: "Obsidian - Prix", obsidian_stocks: "Obsidian - Stocks",
  obsidian_armurerie: "Obsidian - Armurerie", obsidian_garage: "Obsidian - Garage",
  obsidian_comptabilite: "Obsidian - Comptabilité", obsidian_rdv: "Obsidian - Rendez-vous",
  obsidian_contrats: "Obsidian - Contrats", obsidian_planification: "Obsidian - Planification",
  obsidian_stats: "Obsidian - Statistiques", cahier_vente: "Cahier de vente",
};

export const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  "Associé / Patron":               [...ALL_PERMISSIONS],
  "Associé":                        ALL_PERMISSIONS.filter(p => p !== "admin"),
  "Avocat Senior":                  ["dashboard","clients","dossiers","factures","casier","simulateur","audiences","juridique","calculatrice","supervision"],
  "Avocat":                         ["dashboard","clients","dossiers","factures","casier","simulateur","audiences","juridique","calculatrice"],
  "Avocat Stagiaire":               ["dashboard","clients","dossiers","factures","casier","simulateur","audiences","juridique"],
  "Secrétaire":                     ["dashboard","clients","dossiers","factures","audiences","juridique"],
  "CEO - Directeur général":        [...ALL_PERMISSIONS],
  "COO - Directrice opérationnel":  ALL_PERMISSIONS.filter(p => p !== "delete_all"),
  "Responsable juridique":          ["dashboard","clients","dossiers","factures","casier","simulateur","audiences","juridique","calculatrice","obsidian_dashboard","obsidian_rdv"],
  "Agent juridique":                ["dashboard","clients","dossiers","factures","casier","simulateur","audiences","juridique","obsidian_dashboard"],
  "Responsable logistique":         ["dashboard","obsidian_dashboard","obsidian_prix","obsidian_stocks","obsidian_armurerie","obsidian_garage","obsidian_comptabilite","obsidian_rdv","obsidian_contrats","obsidian_planification","obsidian_stats","cahier_vente","h47"],
  "Agent logistique":               ["dashboard","obsidian_dashboard","obsidian_prix","obsidian_stocks","obsidian_rdv","cahier_vente","h47"],
  "Responsable sécurité":           ["dashboard","obsidian_dashboard","obsidian_armurerie","obsidian_rdv","obsidian_planification"],
  "Agent de sécurité":              ["dashboard","obsidian_dashboard","obsidian_armurerie","obsidian_rdv"],
  "Opérateur":                      ["dashboard","obsidian_dashboard","obsidian_rdv"],
  "Opérateur stagiaire":            ["dashboard","obsidian_dashboard"],
};

export function hasPermission(userOrRole: AppUser | string | null, permission: string): boolean {
  if (!userOrRole) return false;
  if (typeof userOrRole === "string") {
    const perms = DEFAULT_PERMISSIONS[userOrRole] || [];
    return perms.includes(permission) || perms.includes("admin");
  }
  const perms = userOrRole.permissions || DEFAULT_PERMISSIONS[userOrRole.role] || [];
  return perms.includes(permission) || perms.includes("admin");
}

export const canAccess = hasPermission;

export function getMemberColor(roleOrName?: string, customColor?: string): string {
  if (customColor) return customColor;
  switch (roleOrName) {
    case "CEO - Directeur général": return "#7c3aed";
    case "COO - Directrice opérationnel": return "#6366f1";
    case "Responsable juridique": return "#c9a84c";
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
    const { data, error } = await supabase.from("roles").select("*");
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}
