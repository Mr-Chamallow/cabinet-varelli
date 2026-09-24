export const DEFAULT_GOLD = "#a48fff";
export const DEFAULT_LOGO_URL = "https://i.imgur.com/Shh0rIn.png";
export const DEFAULT_APP_NOM = "Obsidian Logistique";
export const THEME_STORAGE_KEY = "obsidian_theme_gold";
export const IDENTITY_STORAGE_KEY = "obsidian_identity";

export interface GoldPalette {
  gold: string;
  goldLight: string;
  goldDark: string;
  goldMuted: string;
  goldGlow: string;
  goldRgb: string; // "r,g,b" — pour composer des rgba(var(--gold-rgb), X) dynamiques
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  if (isNaN(num) || h.length !== 6) return [167, 139, 250]; // fallback violet par défaut
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mix(hex: string, target: [number, number, number], amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    r + (target[0] - r) * amount,
    g + (target[1] - g) * amount,
    b + (target[2] - b) * amount
  );
}

export function isValidHex(hex: string): boolean {
  return /^#?[0-9a-fA-F]{6}$/.test(hex.trim());
}

export function deriveGoldPalette(hex: string): GoldPalette {
  const base = isValidHex(hex) ? (hex.startsWith("#") ? hex : `#${hex}`) : DEFAULT_GOLD;
  const [r, g, b] = hexToRgb(base);
  return {
    gold: base,
    goldLight: mix(base, [255, 255, 255], 0.28),
    goldDark: mix(base, [0, 0, 0], 0.22),
    goldMuted: `rgba(${r},${g},${b},0.08)`,
    goldGlow: `rgba(${r},${g},${b},0.14)`,
    goldRgb: `${r},${g},${b}`,
  };
}

export function applyThemeToDocument(hex: string) {
  if (typeof document === "undefined") return;
  const p = deriveGoldPalette(hex);
  const root = document.documentElement.style;
  root.setProperty("--gold", p.gold);
  root.setProperty("--gold-light", p.goldLight);
  root.setProperty("--gold-dark", p.goldDark);
  root.setProperty("--gold-muted", p.goldMuted);
  root.setProperty("--gold-glow", p.goldGlow);
  root.setProperty("--gold-rgb", p.goldRgb);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, p.gold);
  } catch {
    // localStorage indisponible (navigation privée…) — pas bloquant
  }
}

// Applique instantanément la dernière couleur connue (cache local), avant même
// que la requête Supabase ne réponde — évite le flash de la couleur par défaut.
export function applyCachedThemeIfAny() {
  if (typeof window === "undefined") return;
  try {
    const cached = localStorage.getItem(THEME_STORAGE_KEY);
    if (cached && isValidHex(cached)) applyThemeToDocument(cached);
  } catch {
    // ignore
  }
}

export interface Identity {
  logoUrl: string;
  appNom: string;
}

export function getCachedIdentity(): Identity {
  if (typeof window === "undefined") return { logoUrl: DEFAULT_LOGO_URL, appNom: DEFAULT_APP_NOM };
  try {
    const raw = localStorage.getItem(IDENTITY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { logoUrl: DEFAULT_LOGO_URL, appNom: DEFAULT_APP_NOM };
}

export function cacheIdentity(identity: Identity) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // ignore
  }
}
