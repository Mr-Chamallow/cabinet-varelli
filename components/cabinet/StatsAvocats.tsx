"use client";
import { useEffect, useState } from "react";
import { montant } from "@/lib/montant";

// Statistiques par avocat : filtre mois ou tout
export default function StatsAvocats() {
  const [mois, setMois] = useState("all");
  const [rows, setRows] = useState<any[]>([]);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    fetch(`/api/cabinet/stats-avocats?mois=${mois}`).then(r => r.json()).then(d => {
      if (d.error) return setErreur(d.error);
      setErreur(""); setRows(d.rows || []);
    });
  }, [mois]);

  const moisOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return { v: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, l: d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) };
  });
  const th: React.CSSProperties = { textAlign: "right", padding: "0.5rem", fontSize: "0.72rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 };
  const td: React.CSSProperties = { padding: "0.6rem 0.5rem", textAlign: "right", borderTop: "1px solid var(--border)" };

  return (
    <div>
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
        <select value={mois} onChange={e => setMois(e.target.value)} style={{ padding: "0.5rem", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "inherit" }}>
          <option value="all">Depuis le début</option>
          {moisOptions.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
        </select>
      </div>
      {erreur && <div style={{ color: "#e88a86" }}>{erreur}</div>}
      <div className="cab-card" style={{ overflowX: "auto", padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: "left", paddingLeft: "1rem" }}>Avocat</th>
              <th style={th}>Dossiers</th>
              <th style={th}>Ouverts</th>
              <th style={th}>RDV terminés</th>
              <th style={th}>Comparutions</th>
              <th style={th}>Honoraires CI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.discord_id}>
                <td style={{ ...td, textAlign: "left", paddingLeft: "1rem" }}><b>{r.nom}</b><div className="cab-muted" style={{ fontSize: "0.72rem" }}>{r.role}</div></td>
                <td style={td}>{r.dossiers}</td>
                <td style={td}>{r.dossiersOuverts}</td>
                <td style={td}>{r.rdvTermines} <span className="cab-muted">/ {r.rdvTotal}</span></td>
                <td style={td}>{r.comparutions}</td>
                <td style={td}>{montant(r.honorairesCI)}</td>
              </tr>
            ))}
            {rows.length === 0 && !erreur && <tr><td colSpan={6} style={{ ...td, textAlign: "center" }} className="cab-muted">Aucune donnée.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="cab-muted" style={{ fontSize: "0.75rem", marginTop: "0.6rem" }}>Dossiers et RDV comptés par date de création ou de rendez-vous ; comparutions par date d&apos;audience.</p>
    </div>
  );
}
