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
  "obsidian_dashboard", "obsidian_prix", "obsidian_stocks", "obsidian_armurerie",
  "obsidian_garage", "obsidian_comptabilite", "obsidian_rdv", "obsidian_contrats",
  "obsidian_planification", "obsidian_stats", "cahier_vente", "obsidian_paie",
  "obsidian_employes", "h47", "admin", "supervision", "delete_all", "edit_all",
  "juridique", "calculatrice", "carte-enqueteur",
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
};

export const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  "Associé / Patron":               [...ALL_PERMISSIONS], // ← LA CLÉ QUI MANQUAIT
  "CEO - Directeur général":        [...ALL_PERMISSIONS],
  "COO - Directrice opérationnel":  ALL_PERMISSIONS.filter(p => p !== "delete_all"),
  "Responsable juridique":          ["obsidian_dashboard","obsidian_rdv","obsidian_contrats","obsidian_stats","juridique","carte-enqueteur"],
  "Agent juridique":                ["obsidian_dashboard","obsidian_rdv","juridique","carte-enqueteur"],
  "Responsable logistique":         ["obsidian_dashboard","obsidian_prix","obsidian_stocks","obsidian_armurerie","obsidian_garage","obsidian_comptabilite","obsidian_rdv","obsidian_contrats","obsidian_planification","obsidian_stats","cahier_vente","h47","obsidian_paie","obsidian_employes","calculatrice","carte-enqueteur"],
  "Agent logistique":               ["obsidian_dashboard","obsidian_prix","obsidian_stocks","obsidian_rdv","cahier_vente","h47","carte-enqueteur"],
  "Responsable sécurité":           ["obsidian_dashboard","obsidian_armurerie","obsidian_rdv","obsidian_planification","carte-enqueteur","juridique"],
  "Agent de sécurité":              ["obsidian_dashboard","obsidian_armurerie","obsidian_rdv","carte-enqueteur"],
  "Opérateur":                      ["obsidian_dashboard","obsidian_rdv","carte-enqueteur"],
  "Opérateur stagiaire":            ["obsidian_dashboard"],
};

export function hasPermission(userOrRole: AppUser | string | null, permission: string): boolean {
  if (!userOrRole) return false;
  if (typeof userOrRole === "string") {
    const perms = DEFAULT_PERMISSIONS[userOrRole] || [];
    return perms.includes(permission) || perms.includes("admin");
  }
  // Fallback : si les permissions Supabase sont vides/absentes, on retombe sur les defaults du code
  const perms = (userOrRole.permissions && userOrRole.permissions.length > 0)
    ? userOrRole.permissions
    : (DEFAULT_PERMISSIONS[userOrRole.role] || []);
  return perms.includes(permission) || perms.includes("admin");
}

export const canAccess = hasPermission;

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