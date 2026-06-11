// lib/auth.ts
// Système d'authentification V8 — Cabinet Varelli
// Rôles : Patron > Avocat > Employé

export type Role = "Patron" | "Avocat" | "Employé";

export interface User {
  id: string;
  nom: string;
  role: Role;
  avatar: string;
}

// Comptes de démonstration RP
// En V8 production : remplacer par Supabase Auth
export const DEMO_ACCOUNTS: Array<User & { password: string }> = [
  { id: "1", nom: "Marco Varelli", role: "Patron", avatar: "M", password: "varelli2026" },
  { id: "2", nom: "Sofia Benedetti", role: "Avocat", avatar: "S", password: "avocat2026" },
  { id: "3", nom: "Lucas Moretti", role: "Employé", avatar: "L", password: "employe2026" },
];

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
