// Correspondance rôle du cabinet -> grade de salaire (noms exacts de la table cabinet_grades)
const CORRESPONDANCE: Record<string, string> = {
  "Collaborateur": "Collaborateur",
  "Associé": "Associé",
  "Associé Sénior": "Associé Sénior",
  "Associé Gérant": "Secrétaire juridique & Associé Gérant",
  "Secrétaire juridique": "Secrétaire juridique & Associé Gérant",
};

export const gradeParRole = (role?: string | null): string | null => (role ? CORRESPONDANCE[role] || null : null);
