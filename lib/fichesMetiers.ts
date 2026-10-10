// Métiers des fiches + sous-tags (ex-salons Discord info-civil, info-gouv, info-police...).
export const METIERS: { k: string; label: string; icon: string; sous: string[] }[] = [
  { k: "civil", label: "Civil", icon: "🪪", sous: [] },
  { k: "gouv", label: "Gouv", icon: "🏛️", sous: ["JUGE", "PROC", "MARIE", "SECU MARIE"] },
  { k: "police", label: "Police", icon: "👮", sous: ["LS", "DOA", "NOOSE", "SAHP", "WSHP"] },
  { k: "g6", label: "G6", icon: "🟢", sous: [] },
  { k: "lsfd", label: "LSFD", icon: "🚒", sous: [] },
  { k: "ems", label: "EMS", icon: "🧑‍⚕️", sous: [] },
  { k: "us_army", label: "US Army", icon: "🪖", sous: [] },
];
export const metierInfo = (k?: string) => METIERS.find(m => m.k === k) || METIERS[0];
