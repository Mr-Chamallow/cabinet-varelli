// Tampon qui « claque » : CAPTURÉ, CLASSÉ, PAYÉ…
const COL: Record<string, string> = { green: "#2e9e5b", red: "#c4262e", blue: "#2f6fb0", gold: "#b8892a" };
export function Stamp({ children, color = "red", size = "md", rotate = -8, style }: { children: React.ReactNode; color?: keyof typeof COL; size?: "sm" | "md" | "lg"; rotate?: number; style?: React.CSSProperties }) {
  const c = COL[color] || color;
  return <span className={`obs-stamp ${size}`} style={{ color: c, borderColor: c, ["--rot" as any]: `${rotate}deg`, ...style }}>{children}</span>;
}
