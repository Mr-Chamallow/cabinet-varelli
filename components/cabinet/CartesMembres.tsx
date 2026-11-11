"use client";
import { useEffect, useState } from "react";

// Initiales d'un membre (ex : "Marco Varelli" -> "MV")
const initiales = (nom: string) => nom.split(/\s+/).filter(Boolean).slice(0, 2).map(m => m[0]?.toUpperCase()).join("") || "?";

// Organigramme : une carte par membre, les postes à pourvoir sont en pointillés
export default function CartesMembres() {
  const [rows, setRows] = useState<any[] | null>(null);

  useEffect(() => {
    fetch("/api/cabinet/cabinet_membres").then(r => r.json()).then(d => setRows(d.rows || []));
  }, []);

  if (rows === null) return <div style={{ color: "var(--text-dim)" }}>Chargement...</div>;
  if (rows.length === 0) return <div className="empty-state"><div className="empty-title">Organigramme vide</div></div>;

  return (
    <div className="cab-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: "1rem" }}>
      {rows.map(m => {
        const vacant = /pourvoir/i.test(m.nom_rp || "");
        return (
          <div key={m.id} className={`cab-card${vacant ? " cab-vacant" : ""}`} style={{ textAlign: "center" }}>
            <div className="cab-avatar">{vacant ? "?" : initiales(m.nom_rp || "")}</div>
            <div className="cab-title" style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>{m.nom_rp}</div>
            {m.poste && <span className="cab-badge">{m.poste}</span>}
            {m.description && <p className="cab-muted" style={{ marginTop: "0.8rem", marginBottom: 0 }}>{m.description}</p>}
          </div>
        );
      })}
    </div>
  );
}
