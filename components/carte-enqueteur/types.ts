export interface Category {
  id: string;
  slug: string;
  label: string;
  color: string;
  sort_order?: number;
}

export interface CartePoint {
  id: string;
  x: number; // coordonnée jeu (X)
  y: number; // coordonnée jeu (Y)
  z?: number | null; // altitude (facultative, issue du format Vector3 du jeu)
  heading?: number | null; // orientation (facultative, issue du format Vector3 du jeu)
  category: string; // slug d'une catégorie (voir Category)
  groupe_id?: string | null; // gang/orga rattaché (voir Gang)
  personne_ids?: string[]; // personnes du registre liées à ce point
  title: string;
  icon_url?: string | null; // icône personnalisée (facultative) ; sinon pastille de couleur par catégorie
  created_at?: string;
  drogue_liee?: string | null;
}

export interface Gang {
  id: string;
  nom: string;
  type: 'orga' | 'pf' | 'inde';
  sort_order?: number;
}

export function gangTypeLabel(type: string): string {
  return type === 'pf' ? 'PF' : type === 'inde' ? 'Indé' : 'Orga';
}

// Parse le format Vector3 du jeu, ex :
// { pos: new Vector3(-116.460, -1137.269, 24.280), heading: 90.261}
export function parseVector3(input: string): { x: number; y: number; z: number; heading?: number } | null {
  const posMatch = input.match(/Vector3\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/);
  if (!posMatch) return null;
  const headingMatch = input.match(/heading\s*:\s*(-?[\d.]+)/);
  return {
    x: parseFloat(posMatch[1]),
    y: parseFloat(posMatch[2]),
    z: parseFloat(posMatch[3]),
    heading: headingMatch ? parseFloat(headingMatch[1]) : undefined,
  };
}

export interface DossierPiece {
  label: string;
  url: string;
}

export interface ChecklistItem {
  label: string;
  done: boolean;
}

export type DossierStatut = 'actif' | 'resolu' | 'archive';

export const STATUT_CONFIG: Record<DossierStatut, { label: string; icon: string; color: string }> = {
  actif:   { label: 'Actif',   icon: '🔴', color: '#ef4444' },
  resolu:  { label: 'Résolu',  icon: '🟢', color: '#22c55e' },
  archive: { label: 'Archivé', icon: '⚪', color: '#64748b' },
};

export interface Dossier {
  id: string;
  point_id: string;
  description: string;
  tags: string[];
  pieces: DossierPiece[];
  statut?: DossierStatut; // absent = 'actif' (comportement par défaut)
  checklist?: ChecklistItem[];
  updated_at?: string;
}

export function categoryColor(categories: Category[], slug: string): string {
  return categories.find((c) => c.slug === slug)?.color ?? '#8A93A6';
}

export function categoryLabel(categories: Category[], slug: string): string {
  return categories.find((c) => c.slug === slug)?.label ?? slug;
}

export function slugify(label: string): string {
  return (
    label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `tag-${Date.now()}`
  );
}

export interface Personne {
  id: string;
  nom: string;
  prenom?: string;
  notes?: string;
  created_at?: string;
}

export interface Plaque {
  id: string;
  plaque: string;
  personne_id?: string | null;
  notes?: string;
  created_at?: string;
}

export interface Preset {
  id: string;
  groupe: string; // 'composant' | 'drogue'
  nom: string;
  icon_url: string;
  sort_order?: number;
}
