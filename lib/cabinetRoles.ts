import type { Row } from "@/lib/types";
import type { UserLike } from "@/lib/types";
import { hasPermission, hasWriteAccess, estAdminUser } from "@/lib/auth";

// Rôles des employés du cabinet. Le client a le rôle "Clients Varelli & Associés" : il n'est jamais employé.
export const ROLE_SECRETAIRE = "Secrétaire juridique";
export const CABINET_STAFF_ROLES = ["Secrétaire juridique", "Collaborateur", "Associé", "Associé Sénior", "Associé Gérant"];

// Fonctionne côté serveur (site_role) et côté client (role)
const roleDe = (user: UserLike): string => user?.site_role || user?.role || "";

// Employé du cabinet = a au moins une permission cabinet en ÉCRITURE (les clients n'ont que des :read).
const PERMS_STAFF_CABINET = ["avocat", "cabinet_dossiers", "cabinet_rdv", "cabinet_compta", "cabinet_tarifs", "cabinet_presentation", "cabinet_organigramme", "cabinet_facturation", "cabinet_attribution", "cabinet_direction"];
export function estStaffUser(user: UserLike): boolean {
  if (!user) return false;
  return PERMS_STAFF_CABINET.some(p => hasWriteAccess({ id: user.discord_id, nom: user.discord_name, role: roleDe(user), permissions: user.permissions || [] } as UserLike, p));
}

export function estSecretaireUser(user: UserLike): boolean {
  return roleDe(user) === ROLE_SECRETAIRE;
}

// Accès au bureau : comptabilité, factures, devis, tableau de bord (lecture seule pour la secrétaire), journal (patron seul)
// Le patron du bureau = Associé Gérant (compta, journal, suppression des comparutions)
export const ROLE_PATRON = "Associé Gérant";
export const ROLES_BUREAU = [ROLE_PATRON, ROLE_SECRETAIRE];
export const roleDeUser = (user: UserLike): string => roleDe(user);
// Patron = permission admin (table roles)
export const estPatronUser = (user: UserLike): boolean => estAdminUser(user);
// Bureau = accès compta en écriture (table roles)
export const estBureauUser = (user: UserLike): boolean => hasWriteAccess({ id: user?.discord_id, nom: user?.discord_name, role: roleDe(user), permissions: user?.permissions || [] } as UserLike, "cabinet_compta");
// Permissions techniques larges : la vraie règle est le rôle (estBureauUser), contrôlé juste après
export const PERMS_BUREAU = ["avocat", "cabinet_compta", "cabinet_dossiers", "cabinet_rdv", "cabinet_attribution", "cabinet_facturation", "cabinet_depenses", "cabinet_commissions", "cabinet_bilan", "cabinet_direction", "cabinet_journal"];
