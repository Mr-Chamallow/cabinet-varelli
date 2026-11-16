// Logique de permissions PURE (aucun import, aucun accès réseau) : testable sans Supabase.
// lib/auth.ts réexporte ces fonctions, donc le reste de l'app ne change pas.

export type PermLevel = "none" | "read" | "write";

// Sujet de permission : tout objet portant une liste `permissions`, ou un nom de rôle, ou rien.
export type PermSubject = { permissions?: string[] | null } | string | null | undefined;

// --- Niveaux d'accès par permission (onglet) ---
// Une entrée de permission peut s'écrire "perm" (= écriture, comportement
// historique) ou "perm:read" (lecture seule). Rien ne casse pour les rôles
// non migrés : toute entrée sans suffixe reste en écriture comme avant.

function parsePermEntry(entry: string): { key: string; level: PermLevel } {
  if (entry.endsWith(":read")) return { key: entry.slice(0, -5), level: "read" };
  if (entry.endsWith(":write")) return { key: entry.slice(0, -6), level: "write" };
  return { key: entry, level: "write" };
}


export function getPermLevel(userOrRole: PermSubject, permission: string): PermLevel {
  if (!userOrRole) return "none";
  // Seule source de vérité : les permissions stockées dans la table `roles` (et les overrides).
  const all = typeof userOrRole === "string" ? [] : (userOrRole.permissions || []);
  if (all.includes("admin")) return "write";
  let level: PermLevel = "none";
  for (const entry of all) {
    const { key, level: l } = parsePermEntry(entry);
    if (key !== permission) continue;
    if (l === "write") return "write"; // l'écriture l'emporte si les deux existent
    level = l;
  }
  return level;
}

export function hasPermission(userOrRole: PermSubject, permission: string): boolean {
  return getPermLevel(userOrRole, permission) !== "none";
}

// Accès en écriture (création/édition/suppression) sur un onglet donné.
export function hasWriteAccess(userOrRole: PermSubject, permission: string): boolean {
  return getPermLevel(userOrRole, permission) === "write";
}

export function isReadOnlyRole(userOrRole: PermSubject): boolean {
  return getPermLevel(userOrRole, "carte-enqueteur") === "read";
}
