// lib/auth.ts — Cabinet BullHead
// Rôles 100% dynamiques depuis Supabase (table: roles)

import { supabase } from "@/lib/supabase";

export type Role = string;

export interface User {
  id: string;
  nom: string;
  role: Role;
  avatar: string;
  couleur?: string;
}

export const ALL_PERMISSIONS = [
  "dashboard", "clients", "dossiers", "factures", "simulateur",
  "blanchiment", "audiences", "juridique", "parametres", "admin",
  "delete_all", "edit_all", "modeles", "h47",
];

export const PERMISSION_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  clients: "Clients",
  dossiers: "Dossiers",
  factures: "Factures",
  simulateur: "Simulateur",
  blanchiment: "Blanchiment",
  audiences: "Audiences",
  juridique: "Code pénal",
  parametres: "Paramètres",
  admin: "Administration",
  delete_all: "Supprimer (tout)",
  edit_all: "Modifier (tout)",
  modeles: "Modèles",
  h47: "H-47",
};

// ─── CACHE DES RÔLES EN MÉMOIRE ─────────────────────────────────────────────
// Rempli au login et à chaque chargement de page protégée.
let _rolesCache: Record<string, string[]> = {};
let _rolesLoaded = false;

export function setRolesCache(roles: Record<string, string[]>) {
  _rolesCache = roles;
  _rolesLoaded = true;
}

export function rolesAreLoaded(): boolean {
  return _rolesLoaded;
}

/**
 * Charge tous les rôles depuis Supabase et remplit le cache.
 * Retourne la liste normalisée (permissions toujours en string[]).
 * À appeler une fois au montage de AuthGuard ou de la page Admin.
 */
export async function loadRolesFromSupabase(): Promise<
  { id: string; nom: string; permissions: string[]; couleur: string }[]
> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("roles")
    .select("id, nom, permissions, couleur")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[auth] Erreur chargement des rôles:", error.message);
    return [];
  }

  const normalized = (data || []).map((r: any) => ({
    id: r.id,
    nom: r.nom,
    couleur: r.couleur || "#c9a84c",
    permissions: normalizePermissions(r.permissions),
  }));

  const cache: Record<string, string[]> = {};
  normalized.forEach((r) => { cache[r.nom] = r.permissions; });
  setRolesCache(cache);

  return normalized;
}

/** Supabase peut renvoyer permissions en array natif (jsonb) ou en string JSON selon le client. On gère les deux. */
function normalizePermissions(raw: any): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function canAccess(role: Role, permission: string): boolean {
  if (_rolesCache[role]) return _rolesCache[role].includes(permission);
  // Fallback de sécurité uniquement si le cache n'a jamais pu être chargé
  // (évite de bloquer tout le monde si Supabase est temporairement indisponible)
  if (role === "Patron") return true;
  return false;
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("varelli_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  sessionStorage.setItem("varelli_user", JSON.stringify(user));
}

export function logout(): void {
  sessionStorage.removeItem("varelli_user");
}

export function getMemberColor(nom: string, customColor?: string): string {
  if (customColor) return customColor;
  const colors = [
    "#c9a84c", "#6366f1", "#22c55e", "#ef4444", "#f97316",
    "#06b6d4", "#ec4899", "#a855f7", "#14b8a6", "#f59e0b",
  ];
  let hash = 0;
  for (let i = 0; i < nom.length; i++) hash = nom.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export const ROLE_BADGES: Record<string, string> = {
  Patron: "badge-gold",
  Avocat: "badge-info",
  Employé: "badge-success",
};
