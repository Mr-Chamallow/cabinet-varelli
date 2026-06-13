// lib/auth.ts — Cabinet Varelli V10
// Comptes stockés en Supabase (table: membres)
// Plus de comptes hardcodés

export type Role = "Patron" | "Avocat" | "Employé";

export interface User {
  id: string;
  nom: string;
  role: Role;
  avatar: string;
}

export const PERMISSIONS: Record<Role, string[]> = {
  Patron: [
    "dashboard", "clients", "dossiers", "factures", "operations",
    "comptabilite", "blanchiment", "simulateur", "juridique",
    "parametres", "admin", "delete_all", "edit_all",
  ],
  Avocat: [
    "dashboard", "clients", "dossiers", "factures", "simulateur",
    "juridique", "operations",
  ],
  Employé: [
    "dashboard", "clients", "juridique",
  ],
};

export function canAccess(role: Role, page: string): boolean {
  return PERMISSIONS[role]?.includes(page) ?? false;
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

export const ROLE_COLORS: Record<Role, string> = {
  Patron: "var(--gold)",
  Avocat: "var(--info)",
  Employé: "var(--success)",
};

export const ROLE_BADGES: Record<Role, string> = {
  Patron: "badge-gold",
  Avocat: "badge-info",
  Employé: "badge-success",
};

export const ALL_PERMISSIONS = [
  "dashboard", "clients", "dossiers", "factures", "operations",
  "comptabilite", "blanchiment", "simulateur", "juridique",
  "parametres", "admin", "delete_all", "edit_all",
];
