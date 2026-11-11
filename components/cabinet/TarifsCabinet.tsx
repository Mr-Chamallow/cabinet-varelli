"use client";
import { useEffect, useMemo, useState } from "react";

// Grille des honoraires : une section par catégorie, une carte par prestation
export default function TarifsCabinet() {
  const [rows, setRows] = useState<any[]>([]);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    fetch("/api/cabinet/cabinet_tarifs")
      .then(r => r.json())
      .then(d => { if (d.error) setErreur(d.error); else setRows(d.rows || []); })
      .finally(() => setChargement(false));
  }, []);

  // Regroupe par catégorie, dans l'ordre d'affichage
  const categories = useMemo(() => {
    const map = new Map<string, any[]>();
    [...rows].sort((a, b) => (a.ordre || 0) - (b.ordre || 0)).forEach(t => {
      const c = t.categorie || "Général";
      if (!map.has(c)) map.set(c, []);
      map.get(c)!.push(t);
    });
    return Array.from(map.entries());
  }, [rows]);

  if (chargement) return <div className="cab-muted">Chargement de la grille...</div>;
  if (erreur) return <div style={{ color: "#f87171" }}>{erreur}</div>;

  return (
    <div>
      {/* Bandeau d'introduction */}
      <div style={{
        border: "1px solid var(--gold)", borderRadius: "var(--radius)", padding: "1rem 1.2rem", marginBottom: "2rem",
        background: "linear-gradient(135deg, rgba(176,138,62,0.12), rgba(176,138,62,0.02))",
      }}>
        <div style={{ fontFamily: "'Cinzel', serif", color: "var(--gold)", letterSpacing: "0.12em", fontSize: "0.78rem", textTransform: "uppercase", marginBottom: "0.3rem" }}>
          Honoraires
        </div>
        <div style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
          Chaque prestation est présentée à titre indicatif. Les montants peuvent évoluer selon les éléments extérieurs au cabinet.
        </div>
      </div>

      {categories.length === 0 && <div className="empty-state"><div className="empty-title">Grille en cours de mise à jour</div></div>}

      {categories.map(([categorie, items]) => (
        <section key={categorie} style={{ marginBottom: "2.2rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.8rem", marginBottom: "0.9rem", borderBottom: "1px solid var(--border, #333)", paddingBottom: "0.4rem" }}>
            <h2 style={{ fontFamily: "'Cinzel', serif", color: "var(--gold)", fontSize: "1.15rem", margin: 0, letterSpacing: "0.06em" }}>{categorie}</h2>
            <span className="cab-muted" style={{ fontSize: "0.75rem" }}>{items.length} prestation{items.length > 1 ? "s" : ""}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "0.9rem" }}>
            {items.map(t => {
              const surDevis = !t.prix || !/\d/.test(t.prix);
              return (
                <article key={t.id} style={{
                  position: "relative", overflow: "hidden", borderRadius: "var(--radius)", padding: "1.1rem 1.1rem 1rem",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                  border: "1px solid var(--border, #2a2a2a)",
                }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--gold), transparent)" }} />
                  <h3 style={{ fontWeight: 700, fontSize: "1rem", margin: "0 0 0.5rem" }}>{t.nom}</h3>
                  <div style={{
                    fontFamily: "'Cinzel', serif", fontSize: surDevis ? "0.95rem" : "1.35rem", fontWeight: 700,
                    color: surDevis ? "var(--text-dim)" : "var(--gold)", fontStyle: surDevis ? "italic" : "normal", marginBottom: t.description ? "0.6rem" : 0,
                  }}>
                    {t.prix || "Sur devis"}
                  </div>
                  {t.description && <div className="cab-muted" style={{ fontSize: "0.82rem", lineHeight: 1.55 }}>{t.description}</div>}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
