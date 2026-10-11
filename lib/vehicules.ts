// Liste des vehicules GTA (categorie, nom, code spawn). Source : liste fournie.
export const normV = (s: string) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const lev = (a: string, b: string) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };

export interface Veh { cat: string; nom: string; code: string }
import { CATALOGUE } from "@/lib/vehiculesCatalogue";
export interface VehInfo { prix: number; vitesse: number; coffre: number; places: number; carb: "T" | "E" | "H"; nouveau: boolean }
// Liste = uniquement les deux catalogues (site Elite Vinewood + motos/bateaux/velos)
export const VEH_LIST: Veh[] = CATALOGUE.map(c => ({ cat: c[0], nom: c[1], code: c[2] }));
const INFO = new Map<string, VehInfo>(CATALOGUE.map(c => [c[2], { prix: c[3], vitesse: c[4], coffre: c[5], places: c[6], carb: c[7] as "T" | "E" | "H", nouveau: !!c[8] }]));
export const vehInfo = (code: string): VehInfo | undefined => INFO.get(code);
export const fmtPrix = (n: number) => n.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ") + " $";

// Vehicule exact (nom ou code spawn)
export function vehExact(saisie: string): Veh | null {
  const a = normV(saisie); if (!a) return null;
  return VEH_LIST.find(v => normV(v.nom) === a || v.code === a.replace(/ /g, "")) || null;
}
// Suggestions classees par ressemblance (contient, commence par, faute de frappe)
export function vehSuggest(saisie: string, max = 4): Veh[] {
  const a = normV(saisie); if (a.length < 2) return [];
  const sc = VEH_LIST.map(v => {
    const b = normV(v.nom); const c = v.code;
    let s = 99;
    if (b === a) s = -1; else if (b.startsWith(a)) s = 0; else if (b.includes(a) || c.includes(a.replace(/ /g, ""))) s = 1;
    else { const d = Math.min(lev(a, b), ...b.split(" ").map(w => lev(a, w))); if (d <= (a.length > 6 ? 3 : a.length > 3 ? 2 : 1)) s = 2 + d; }
    return { v, s };
  }).filter(x => x.s < 99).sort((x, y) => x.s - y.s || x.v.nom.length - y.v.nom.length);
  return sc.slice(0, max).map(x => x.v);
}
