// lib/auth.ts — Cabinet Varelli V12
// Rôles dynamiques depuis Supabase (table: roles)

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
  "delete_all", "edit_all", "modeles",
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
};

// Cache des permissions roles en mémoire
let _rolesCache: Record<string, string[]> = {};

export function setRolesCache(roles: Record<string, string[]>) {
  _rolesCache = roles;
}

export function canAccess(role: Role, permission: string): boolean {
  if (_rolesCache[role]) return _rolesCache[role].includes(permission);
  // Fallback par défaut
  if (role === "Patron") return true;
  if (role === "Avocat") return ["dashboard","clients","dossiers","factures","simulateur","audiences","juridique","modeles"].includes(permission);
  return ["dashboard","clients","juridique","audiences"].includes(permission);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("varelli_user");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
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
    "#c9a84c","#6366f1","#22c55e","#ef4444","#f97316",
    "#06b6d4","#ec4899","#a855f7","#14b8a6","#f59e0b",
  ];
  let hash = 0;
  for (let i = 0; i < nom.length; i++) hash = nom.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// Rôles par défaut si Supabase pas dispo
export const DEFAULT_ROLE_COLORS: Record<string, string> = {
  Patron: "#c9a84c",
  Avocat: "#6366f1",
  Employé: "#22c55e",
};

export const ROLE_BADGES: Record<string, string> = {
  Patron: "badge-gold",
  Avocat: "badge-info",
  Employé: "badge-success",
};
