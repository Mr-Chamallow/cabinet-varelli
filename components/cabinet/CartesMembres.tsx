"use client";
import { useEffect, useState } from "react";

// Initiales d'un membre (ex : "Marco Varelli" -> "MV")
const initiales = (nom: string) => nom.split(/\s+/).filter(Boolean).slice(0, 2).map(m => m[0]?.toUpperCase()).join("") || "?";

interface Props { limite?: number; }

// Organigramme en cartes de type diplôme. Un clic ouvre le diplôme en grand.
export default function CartesMembres({ limite }: Props) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [ouvert, setOuvert] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/cabinet/cabinet_membres").then(r => r.json()).then(d => setRows(d.rows || []));
  }, []);

  // Fermer avec la touche Échap
  useEffect(() => {
    if (!ouvert) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOuvert(null); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [ouvert]);

  if (rows === null) return <div style={{ color: "var(--text-dim)" }}>Chargement...</div>;
  if (rows.length === 0) return <div className="empty-state"><div className="empty-title">Organigramme vide</div></div>;
  const liste = limite ? rows.slice(0, limite) : rows;

  const detailBarreau = (m: any) => [
    m.barreau ? `Barreau ${m.barreau}` : "",
    m.numero_barreau ? `N° ${m.numero_barreau}` : "",
    m.annee_inscription ? `inscrit en ${m.annee_inscription}` : "",
  ].filter(Boolean).join(" · ");
  const specialitesDe = (m: any) => (m.specialites || "").split(",").map((x: string) => x.trim()).filter(Boolean);

  return (
    <>
      <div className="cab-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "1rem" }}>
        {liste.map(m => {
          const vacant = /pourvoir/i.test(m.nom_rp || "");
          const specialites = specialitesDe(m);
          const ouvrir = () => { if (!vacant) setOuvert(m); };
          return (
            <div
              key={m.id}
              role={vacant ? undefined : "button"}
              tabIndex={vacant ? undefined : 0}
              onClick={ouvrir}
              onKeyDown={e => { if (e.key === "Enter") ouvrir(); }}
              className={`cab-diplome${vacant ? " cab-vacant" : " cab-cliquable"}`}
            >
              <div className="cab-diplome-entete">Cabinet Varelli & Associés</div>
              {!vacant && m.photo_url
                ? <img className="cab-photo" src={m.photo_url} alt={m.nom_rp} />
                : <div className="cab-avatar">{vacant ? "?" : initiales(m.nom_rp || "")}</div>}
              <div className="cab-title cab-nom">{m.nom_rp}</div>
              {m.poste && <div className="cab-poste">{m.poste}</div>}
              {detailBarreau(m) && <div className="cab-barreau">{detailBarreau(m)}</div>}
              {specialites.length > 0 && (
                <div className="cab-chips">{specialites.map((x: string) => <span key={x} className="cab-chip">{x}</span>)}</div>
              )}
              {m.description && <p className="cab-muted" style={{ margin: 0 }}>{m.description}</p>}
              {!vacant && <div className="cab-muted" style={{ fontSize: ".7rem", marginTop: ".8rem" }}>Cliquer pour voir le diplôme</div>}
              <div className="cab-sceau">CV</div>
            </div>
          );
        })}
      </div>

      {ouvert && (
        <div
          onClick={() => setOuvert(null)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", animation: "cabFade .3s ease both" }}
        >
          <div onClick={e => e.stopPropagation()} className="cab-diplome-grand" style={{ animation: "cabFade .45s cubic-bezier(.2,.7,.2,1) both" }}>
            <button className="cab-fermer" onClick={() => setOuvert(null)} aria-label="Fermer">×</button>
            <div className="cab-ornement">◆ ◆ ◆</div>
            <div className="cab-titre-diplome">Diplôme d'avocat</div>
            <div className="cab-decerne">Cabinet Varelli & Associés certifie que</div>
            {ouvert.photo_url && <img className="cab-photo" src={ouvert.photo_url} alt={ouvert.nom_rp} style={{ width: 120, height: 120 }} />}
            <div className="cab-nom-grand">{ouvert.nom_rp}</div>
            {ouvert.poste && <div className="cab-poste" style={{ fontSize: ".9rem" }}>{ouvert.poste}</div>}
            {detailBarreau(ouvert) && <div className="cab-texte-grand">Est inscrit au {detailBarreau(ouvert)}</div>}
            {specialitesDe(ouvert).length > 0 && (
              <div className="cab-chips" style={{ marginTop: "1rem" }}>{specialitesDe(ouvert).map((x: string) => <span key={x} className="cab-chip">{x}</span>)}</div>
            )}
            {ouvert.description && <p className="cab-texte-grand" style={{ fontStyle: "italic", marginTop: "1rem" }}>« {ouvert.description} »</p>}
            <div className="cab-ornement">◆ ◆ ◆</div>
            <div className="cab-sceau" style={{ width: 52, height: 52, fontSize: ".75rem" }}>CV</div>
            <div className="cab-signature">{ouvert.poste || "Cabinet Varelli & Associés"}</div>
          </div>
        </div>
      )}
    </>
  );
}
