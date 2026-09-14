export type PinCategory = 'suspect' | 'preuve' | 'planque' | 'temoin' | 'autre';

export const PIN_CATEGORIES: { value: PinCategory; label: string; color: string }[] = [
  { value: 'suspect', label: 'Suspect', color: '#E2A63C' },
  { value: 'preuve', label: 'Preuve', color: '#C4453B' },
  { value: 'planque', label: 'Planque', color: '#7C6FD6' },
  { value: 'temoin', label: 'TÃ©moin', color: '#4FA9A2' },
  { value: 'autre', label: 'Autre', color: '#8A93A6' },
];

export interface CartePoint {
  id: string;
  x: number; // coordonnÃ©e pixel (colonne) dans l'image de la carte
  y: number; // coordonnÃ©e pixel (ligne) dans l'image de la carte
  category: PinCategory;
  title: string;
  icon_url?: string | null; // icÃ´ne personnalisÃ©e (facultative) ; sinon pastille de couleur par catÃ©gorie
  created_at?: string;
}

export interface DossierPiece {
  label: string;
  url: string;
}

export interface Dossier {
  id: string;
  point_id: string;
  description: string;
  tags: string[];
  pieces: DossierPiece[];
  updated_at?: string;
}

export function categoryColor(cat: PinCategory): string {
  return PIN_CATEGORIES.find((c) => c.value === cat)?.color ?? '#8A93A6';
}
