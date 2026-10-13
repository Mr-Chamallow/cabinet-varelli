"use client";
export const norm = (s: any) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export const matchQ = (q: string, ...vals: any[]) => { const n = norm(q).trim(); return !n || n.split(/\s+/).every(w => vals.some(v => norm(v).includes(w))); };
export default function SearchBox({ value, onChange, placeholder = "Rechercher...", style }: { value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ position: "relative", maxWidth: 360, flex: "1 1 220px", ...style }}>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={"🔍 " + placeholder} style={{ width: "100%", paddingRight: value ? "2rem" : undefined }} />
      {value && <button type="button" onClick={() => onChange("")} aria-label="Effacer" style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1rem" }}>×</button>}
    </div>
  );
}
