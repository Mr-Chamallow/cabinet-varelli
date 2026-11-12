"use client";
import { useEffect, useState } from "react";

// Initiales d'un membre (ex : "Marco Varelli" -> "MV")
const initiales = (nom: string) => nom.split(/\s+/).filter(Boolean).slice(0, 2).map(m => m[0]?.toUpperCase()).join("") || "?";

// Style de la section : cartes à bordure hachurée, photo carrée, grille 1 / 2 / 3 colonnes
const CSS = `
.og-titre { font-size: clamp(1.8rem, 3.5vw, 2.6rem); font-weight: 700; line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 0.6rem; color: var(--text); max-width: 34rem; }
.og-intro { color: var(--text-dim); max-width: 38rem; line-height: 1.6; margin: 0 0 2.2rem; font-size: 0.95rem; }
.og-grille { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
@media (min-width: 640px) { .og-grille { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .og-grille { grid-template-columns: repeat(3, 1fr); } }
.og-carte { position: relative; padding: 0.9rem; border-radius: 14px; border: 1px solid var(--border); background-color: rgba(255,255,255,0.015); background-image: repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 9px); }
.og-carte.vacant { border-style: dashed; opacity: 0.6; }
.og-photo { position: relative; aspect-ratio: 1 / 1; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); background: linear-gradient(160deg, rgba(176,138,62,0.25), rgba(255,255,255,0.03)); display: grid; place-items: center; }
.og-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.og-initiales { font-size: 3rem; font-weight: 700; color: var(--gold); letter-spacing: 0.04em; }
.og-texte { padding: 1rem 0.3rem 0.3rem; }
.og-nom { font-size: 1.15rem; font-weight: 700; color: var(--text); margin: 0; }
.og-poste { font-size: 0.9rem; color: var(--text-dim); margin-top: 0.2rem; }
.og-slogan { font-style: italic; color: var(--gold); font-size: 0.85rem; margin-top: 0.6rem; }
.og-bio { font-size: 0.85rem; color: var(--text-dim); line-height: 1.55; margin: 0.6rem 0 0; }
.og-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.7rem; }
.og-tags span { font-size: 0.66rem; padding: 0.15rem 0.5rem; border-radius: 999px; border: 1px solid var(--border); color: var(--text-dim); letter-spacing: 0.06em; text-transform: uppercase; }
.og-contact { font-size: 0.78rem; color: var(--text-dim); margin-top: 0.8rem; padding-top: 0.6rem; border-top: 1px solid var(--border); }
`;

interface Props { titre?: string; intro?: string; limite?: number; sansTitre?: boolean; }

// Organigramme complet : une carte par membre du cabinet (données de la table cabinet_membres)
export default function OrganigrammeEquipe({
  titre = "Des avocats indépendants, une seule exigence.",
  intro = "Chaque membre du cabinet suit ses propres dossiers, avec la même exigence de rigueur et de discrétion.",
  limite,
  sansTitre = false,
}: Props) {
  const [rows, setRows] = useState<any[] | null>(null);

  useEffect(() => {
    fetch("/api/cabinet/cabinet_membres").then(r => r.json()).then(d => setRows(d.rows || []));
  }, []);

  if (rows === null) return <div style={{ color: "var(--text-dim)" }}>Chargement...</div>;
  if (rows.length === 0) return <div className="empty-state"><div className="empty-title">Organigramme vide</div></div>;
  const affiches = limite ? rows.slice(0, limite) : rows;

  return (
    <section>
      <style>{CSS}</style>
      {!sansTitre && <h2 className="og-titre">{titre}</h2>}
      {!sansTitre && <p className="og-intro">{intro}</p>}

      <div className="og-grille">
        {affiches.map(m => {
          const vacant = /pourvoir/i.test(m.nom_rp || "");
          return (
            <article key={m.id} className={`og-carte${vacant ? " vacant" : ""}`}>
              <div className="og-photo">
                {!vacant && m.photo_url
                  ? <img src={m.photo_url} alt={m.nom_rp} referrerPolicy="no-referrer" />
                  : <span className="og-initiales">{vacant ? "?" : initiales(m.nom_rp || "")}</span>}
              </div>
              <div className="og-texte">
                <h3 className="og-nom">{m.nom_rp}</h3>
                {m.poste && <div className="og-poste">{m.poste}</div>}
                {m.slogan && <div className="og-slogan">« {m.slogan} »</div>}
                {m.description && <p className="og-bio">{m.description}</p>}
                {m.specialites && (
                  <div className="og-tags">
                    {String(m.specialites).split(",").map(s => s.trim()).filter(Boolean).map(s => <span key={s}>{s}</span>)}
                  </div>
                )}
                {(m.telephone || m.email) && (
                  <div className="og-contact">
                    {m.telephone && <div>Tél : {m.telephone}</div>}
                    {m.email && <div>Email : {m.email}</div>}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
