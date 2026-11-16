// Types partagés du projet.
// Ligne brute de base de données : colonnes variables selon la table, donc volontairement souple.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

// Utilisateur connecté (session NextAuth) : tout optionnel, car la session peut être partielle.
export type UserLike = {
  discord_id?: string | null;
  discord_name?: string | null;
  nom_perso?: string | null;
  site_role?: string | null;
  role?: string | null;
  permissions?: string[] | null;
  banned?: boolean;
  ban_reason?: string | null;
} | null | undefined;

// Réponse standard d'une requête API côté client.
export type ApiResult<T = unknown> = { ok: boolean; status: number; data: T; error?: string };
