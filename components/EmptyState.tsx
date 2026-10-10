// État vide illustré (SVG animé, aux couleurs du thème).
type Kind = "fiche" | "wanted" | "arrest" | "search" | "box" | "generic";
const ART: Record<Kind, React.ReactNode> = {
  fiche: <><rect x="22" y="30" width="76" height="56" rx="5" /><path d="M22 40h30l6-10h40" /><circle cx="46" cy="62" r="8" /><path d="M36 80c2-8 18-8 20 0M66 58h22M66 68h16" /></>,
  wanted: <><rect x="30" y="18" width="60" height="78" rx="4" /><circle cx="60" cy="52" r="12" /><path d="M42 82c3-12 33-12 36 0M40 30h40" /><path d="M24 24l8 8M96 24l-8 8" className="es-x" /></>,
  arrest: <><path d="M60 18l34 12v26c0 20-14 34-34 44-20-10-34-24-34-44V30z" /><path d="M46 56l10 10 20-22" /></>,
  search: <><circle cx="52" cy="52" r="24" /><path d="M70 70l26 26" /><path d="M42 52h20" /></>,
  box: <><path d="M60 20l38 18v42L60 98 22 80V38z" /><path d="M22 38l38 18 38-18M60 56v42" /></>,
  generic: <><circle cx="60" cy="58" r="32" /><path d="M60 40v20l14 8" /></>,
};
export function EmptyState({ kind = "generic", title, hint }: { kind?: Kind; title: string; hint?: string }) {
  return (
    <div className="empty-state es-ill">
      <svg viewBox="0 0 120 112" width="132" height="124" className="es-svg" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">{ART[kind]}</svg>
      <div className="empty-title">{title}</div>
      {hint && <div style={{ fontSize: "0.78rem", marginTop: 6, color: "var(--text-dim)" }}>{hint}</div>}
    </div>
  );
}
