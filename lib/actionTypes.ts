export interface ActionType { nom: string; icon: string; delaiMin: number; ordre: number; actif: boolean; }

// Valeurs de secours si la table n'existe pas encore (migration non exécutée).
export const DEFAULT_ACTION_TYPES: ActionType[] = [
  { nom: "Vente de drogue", icon: "💊", delaiMin: 0, ordre: 1, actif: true },
  { nom: "Go fast", icon: "🏎️", delaiMin: 1440, ordre: 2, actif: true },
  { nom: "LTD", icon: "🏪", delaiMin: 0, ordre: 3, actif: true },
  { nom: "ATM", icon: "🏧", delaiMin: 0, ordre: 4, actif: true },
  { nom: "Cambriolage", icon: "🏚️", delaiMin: 0, ordre: 5, actif: true },
  { nom: "Human Labs", icon: "🧪", delaiMin: 0, ordre: 6, actif: true },
  { nom: "Pacific Bank", icon: "🏦", delaiMin: 0, ordre: 7, actif: true },
];

export function rowToType(r: any): ActionType {
  return { nom: r.nom, icon: r.icon || "🕶️", delaiMin: Number(r.delai_minutes) || 0, ordre: Number(r.ordre) || 0, actif: r.actif !== false };
}

export function fmtDelai(min: number): string {
  if (!min) return "Sans délai";
  if (min % 1440 === 0) return `${min / 1440} j`;
  if (min % 60 === 0) return `${min / 60} h`;
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}
