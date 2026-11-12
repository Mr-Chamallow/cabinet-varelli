"use client";
import { useEffect, useState } from "react";

// Initiales d'un membre (ex : "Marco Varelli" -> "MV")
const initiales = (nom: string) => nom.split(/\s+/).filter(Boolean).slice(0, 2).map(m => m[0]?.toUpperCase()).join("") || "?";

interface Props { limite?: number; }

// Organigramme : une carte par membre (photo, nom, poste, slogan, bio, spécialisations, coordonnées). Pas de logo CV ni de diplôme.
export default function CartesMembres({ limite }: Props) {
  const [rows, setRows] = useState<any[] | null>(null);

  useEffect(() => {
    fetch("/api/cabinet/cabinet_membres").then(r => r.json()).then(d => setRows(d.rows || []));
  }, []);

  if (rows === null) return <div style={{ color: "var(--text-dim)" }}>Chargement...</div>;
  if (rows.length === 0) return <div className="empty-state"><div className="empty-title">Organigramme vide</div></div>;
  const liste = limite ? rows.slice(0, limite) : rows;

  // Carte sobre : fond discret, filet doré en haut, pas d'effet décoratif
  const carte: React.CSSProperties = { padding: "1.6rem 1.2rem 1.3rem", borderRadius: 4, background: "var(--surface)", border: "1px solid var(--border)", borderTop: "2px solid var(--gold)", boxShadow: "0 10px 24px -18px rgba(0,0,0,.6)", textAlign: "center" };

  return (
    <div className="cab-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "1rem" }}>
      {liste.map(m => {
        const vacant = /pourvoir/i.test(m.nom_rp || "");
        return (
          <div key={m.id} style={{ ...carte, ...(vacant ? { borderStyle: "dashed", opacity: 0.6 } : {}) }}>
            {!vacant && m.photo_url
              ? <img className="cab-photo" src={m.photo_url} alt={m.nom_rp} style={{ boxShadow: "none", borderColor: "var(--border)" }} />
              : <div className="cab-avatar">{vacant ? "?" : initiales(m.nom_rp || "")}</div>}
            <div className="cab-title cab-nom">{m.nom_rp}</div>
            {m.poste && <div className="cab-poste">{m.poste}</div>}
            {m.slogan && <div style={{ fontStyle: "italic", color: "var(--gold-light)", margin: ".5rem 0", fontSize: ".85rem" }}>« {m.slogan} »</div>}
            {m.description && <p className="cab-muted" style={{ margin: "0 0 .6rem" }}>{m.description}</p>}
            {m.specialites && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: ".35rem", justifyContent: "center", margin: "0 0 .6rem" }}>
                {String(m.specialites).split(",").map(s => s.trim()).filter(Boolean).map(s => (
                  <span key={s} style={{ fontSize: ".66rem", padding: ".12rem .45rem", borderRadius: 2, border: "1px solid var(--border)", color: "var(--text-muted)", letterSpacing: ".06em", textTransform: "uppercase" }}>{s}</span>
                ))}
              </div>
            )}
            {(m.telephone || m.email) && (
              <div className="cab-muted" style={{ fontSize: ".8rem", borderTop: "1px solid var(--border)", paddingTop: ".6rem" }}>
                {m.telephone && <div>Tél : {m.telephone}</div>}
                {m.email && <div>Email : {m.email}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
