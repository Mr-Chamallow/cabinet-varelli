"use client";
import { useEffect, useState } from "react";

// Initiales d'un membre (ex : "Marco Varelli" -> "MV")
const initiales = (nom: string) => nom.split(/\s+/).filter(Boolean).slice(0, 2).map(m => m[0]?.toUpperCase()).join("") || "?";

interface Props { limite?: number; }

// Organigramme en cartes de type diplôme : photo, poste, barreau, spécialités
export default function CartesMembres({ limite }: Props) {
  const [rows, setRows] = useState<any[] | null>(null);

  useEffect(() => {
    fetch("/api/cabinet/cabinet_membres").then(r => r.json()).then(d => setRows(d.rows || []));
  }, []);

  if (rows === null) return <div style={{ color: "var(--text-dim)" }}>Chargement...</div>;
  if (rows.length === 0) return <div className="empty-state"><div className="empty-title">Organigramme vide</div></div>;
  const liste = limite ? rows.slice(0, limite) : rows;

  return (
    <div className="cab-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "1rem" }}>
      {liste.map(m => {
        const vacant = /pourvoir/i.test(m.nom_rp || "");
        const specialites = (m.specialites || "").split(",").map((x: string) => x.trim()).filter(Boolean);
        const detailBarreau = [
          m.barreau ? `Barreau ${m.barreau}` : "",
          m.numero_barreau ? `N° ${m.numero_barreau}` : "",
          m.annee_inscription ? `inscrit en ${m.annee_inscription}` : "",
        ].filter(Boolean).join(" · ");
        return (
          <div key={m.id} className={`cab-diplome${vacant ? " cab-vacant" : ""}`}>
            <div className="cab-diplome-entete">Cabinet Varelli & Associés</div>
            {!vacant && m.photo_url
              ? <img className="cab-photo" src={m.photo_url} alt={m.nom_rp} />
              : <div className="cab-avatar">{vacant ? "?" : initiales(m.nom_rp || "")}</div>}
            <div className="cab-title cab-nom">{m.nom_rp}</div>
            {m.poste && <div className="cab-poste">{m.poste}</div>}
            {detailBarreau && <div className="cab-barreau">{detailBarreau}</div>}
            {specialites.length > 0 && (
              <div className="cab-chips">{specialites.map((x: string) => <span key={x} className="cab-chip">{x}</span>)}</div>
            )}
            {m.description && <p className="cab-muted" style={{ margin: 0 }}>{m.description}</p>}
            <div className="cab-sceau">CV</div>
          </div>
        );
      })}
    </div>
  );
}
