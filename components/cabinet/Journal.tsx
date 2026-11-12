"use client";
import { useEffect, useState } from "react";

// Journal d'activité du cabinet (direction)
export default function Journal() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [erreur, setErreur] = useState("");
  useEffect(() => {
    fetch("/api/cabinet/journal").then(r => r.json()).then(d => d.error ? setErreur(d.error) : setRows(d.rows));
  }, []);
  if (erreur) return <div style={{ color: "var(--danger)" }}>{erreur}</div>;
  if (!rows) return <div className="cab-muted">Chargement...</div>;
  if (rows.length === 0) return <div className="cab-muted">Aucune action enregistrée pour le moment.</div>;
  return (
    <div className="cab-card" style={{ padding: 0, overflow: "hidden" }}>
      {rows.map(r => (
        <div key={r.id} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "0.8rem", padding: "0.7rem 1rem", borderBottom: "1px solid var(--border, #333)", fontSize: "0.88rem" }}>
          <div className="cab-muted">{new Date(r.created_at).toLocaleString("fr-FR")}</div>
          <div><b>{r.auteur_nom || "Inconnu"}</b> : {r.action}{r.cible ? ` · ${r.cible}` : ""}{r.details ? ` (${r.details})` : ""}</div>
        </div>
      ))}
    </div>
  );
}
