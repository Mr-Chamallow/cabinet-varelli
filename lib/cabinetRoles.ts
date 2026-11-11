import { hasPermission } from "@/lib/auth";

// Rôles des employés du cabinet. Le client a le rôle "Clients Varelli & Associés" : il n'est jamais employé.
export const ROLE_SECRETAIRE = "Secrétaire juridique";
export const CABINET_STAFF_ROLES = ["Secrétaire juridique", "Collaborateur", "Associé", "Associé Sénior", "Associé Gérant", "Associé / Patron"];

// Fonctionne côté serveur (site_role) et côté client (role)
const roleDe = (user: any): string => user?.site_role || user?.role || "";

export function estStaffUser(user: any): boolean {
  if (!user) return false;
  if (CABINET_STAFF_ROLES.includes(roleDe(user))) return true;
  return hasPermission({ role: roleDe(user), permissions: user.permissions || [] } as any, "admin");
}

export function estSecretaireUser(user: any): boolean {
  return roleDe(user) === ROLE_SECRETAIRE;
}
