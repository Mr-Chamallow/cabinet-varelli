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

// Accès au bureau : comptabilité, factures, devis, tableau de bord (lecture seule pour la secrétaire), journal (patron seul)
// Le patron du bureau = Associé Gérant (compta, journal, suppression des comparutions)
export const ROLE_PATRON = "Associé Gérant";
export const ROLES_BUREAU = [ROLE_PATRON, ROLE_SECRETAIRE];
export const roleDeUser = (user: any): string => roleDe(user);
export const estPatronUser = (user: any): boolean => roleDe(user) === ROLE_PATRON;
export const estBureauUser = (user: any): boolean => ROLES_BUREAU.includes(roleDe(user));
// Permissions techniques larges : la vraie règle est le rôle (estBureauUser), contrôlé juste après
export const PERMS_BUREAU = ["avocat", "cabinet_compta", "cabinet_dossiers", "cabinet_rdv", "cabinet_attribution", "cabinet_facturation", "cabinet_depenses", "cabinet_commissions", "cabinet_bilan", "cabinet_direction", "cabinet_journal"];
