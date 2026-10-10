// Remplace les "Chargement…" bruts par des squelettes qui brillent (classe .skeleton existante).
export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }} aria-busy="true" aria-label="Chargement">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton sk-pole" style={{ height: 52, borderRadius: "var(--radius)", opacity: 1 - i * 0.18 }} />
      ))}
    </div>
  );
}
