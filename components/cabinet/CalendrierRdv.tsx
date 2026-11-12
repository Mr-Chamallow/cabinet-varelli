"use client";
import { Fragment, useMemo, useState } from "react";

export interface CreneauRdv { date_rdv: string; statut: string; libelle?: string; }

interface Props {
  rdvs: CreneauRdv[];
  staff: boolean;                    // true = employé : voit les libellés (client, motif, avocat)
  onPick?: (iso: string) => void;    // client : clic sur un créneau libre
}

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const pad = (n: number) => String(n).padStart(2, "0");
const cle = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}`;
const memeJour = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Lundi de la semaine d'une date
function lundi(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const jour = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - jour);
  return x;
}

// Styles du planning (une seule feuille, classes préfixées "cal-")
const CSS = `
.cal { background: var(--card, #161616); border: 1px solid var(--border); border-radius: 14px; padding: 1.1rem 1.1rem 0.9rem; }
.cal-entete { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.9rem; }
.cal-titre { font-family: 'Playfair Display', serif; font-size: 1.15rem; letter-spacing: 0.01em; }
.cal-titre small { display: block; font-family: inherit; font-size: 0.72rem; color: var(--text-dim); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 2px; }
.cal-nav { display: flex; gap: 0.4rem; align-items: center; }
.cal-btn { background: transparent; border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 0.3rem 0.65rem; font-size: 0.8rem; cursor: pointer; transition: border-color .15s, color .15s; }
.cal-btn:hover { border-color: var(--gold); color: var(--gold); }
.cal-legende { display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.74rem; color: var(--text-dim); margin-bottom: 0.9rem; }
.cal-legende span { display: inline-flex; align-items: center; gap: 0.4rem; }
.cal-pastille { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
.cal-grille { width: 100%; min-width: 640px; border-collapse: separate; border-spacing: 5px; table-layout: fixed; }
.cal-jour { text-align: center; padding: 0 0 6px; font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
.cal-jour b { display: block; font-size: 0.95rem; color: var(--text); font-weight: 600; letter-spacing: 0; margin-top: 2px; }
.cal-jour.aujourdhui b { color: var(--gold); }
.cal-jour.aujourdhui b::after { content: ""; display: block; width: 18px; height: 2px; background: var(--gold); margin: 3px auto 0; border-radius: 2px; }
.cal-heure { text-align: right; padding-right: 8px; font-size: 0.68rem; color: var(--text-dim); white-space: nowrap; width: 46px; vertical-align: middle; }
.cal-case { height: 34px; border-radius: 7px; font-size: 0.7rem; padding: 0 7px; vertical-align: middle; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; transition: transform .12s, box-shadow .12s; }
.cal-libre { background: rgba(95,184,120,0.12); color: #7fd196; border: 1px solid rgba(95,184,120,0.28); cursor: pointer; }
.cal-libre:hover { background: rgba(95,184,120,0.24); transform: translateY(-1px); box-shadow: 0 3px 10px rgba(95,184,120,0.18); }
.cal-libre-fixe { background: rgba(95,184,120,0.12); color: #7fd196; border: 1px solid rgba(95,184,120,0.28); }
.cal-attente { background: rgba(224,176,80,0.14); color: #e7c06e; border: 1px solid rgba(224,176,80,0.3); }
.cal-pris { background: rgba(217,83,79,0.14); color: #e88a86; border: 1px solid rgba(217,83,79,0.3); }
.cal-passe { background: rgba(255,255,255,0.025); color: var(--text-dim); border: 1px solid transparent; opacity: 0.45; }
.cal-vide { background: transparent; border: 1px dashed rgba(255,255,255,0.06); }
.cal-aide { font-size: 0.72rem; color: var(--text-dim); margin-top: 0.7rem; }
@media (max-width: 720px) { .cal-grille { min-width: 560px; } }
`;

const LEGENDE = [
  { cls: "cal-libre-fixe", label: "Libre" },
  { cls: "cal-pris", label: "Déjà pris" },
  { cls: "cal-attente", label: "Demande en attente" },
  { cls: "cal-passe", label: "Passé" },
];

// Calendrier hebdomadaire 24h/24, créneaux d'une heure.
export default function CalendrierRdv({ rdvs, staff, onPick }: Props) {
  const [decalage, setDecalage] = useState(0);
  const debut = useMemo(() => { const d = lundi(new Date()); d.setDate(d.getDate() + decalage * 7); return d; }, [decalage]);
  const jours = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(debut); d.setDate(debut.getDate() + i); return d; }), [debut]);
  const maintenant = new Date();

  // Index des créneaux (un créneau pris l'emporte sur une demande en attente)
  const index = useMemo(() => {
    const m: Record<string, CreneauRdv[]> = {};
    for (const r of rdvs) {
      if (r.statut === "annule" || r.statut === "termine") continue;
      const k = String(r.date_rdv).slice(0, 13);
      (m[k] = m[k] || []).push(r);
    }
    return m;
  }, [rdvs]);

  const etat = (d: Date): "libre" | "attente" | "occupe" | "passe" => {
    const liste = index[cle(d)] || [];
    if (liste.some(r => ["attribue", "confirme", "en_cours", "reporte"].includes(r.statut))) return "occupe";
    if (d < maintenant) return "passe";
    if (liste.length) return "attente";
    return "libre";
  };

  const libelle = (d: Date) => {
    const liste = index[cle(d)] || [];
    if (!staff || liste.length === 0) return "";
    const r = liste.find(x => ["attribue", "confirme", "en_cours", "reporte"].includes(x.statut)) || liste[0];
    return r.libelle || "";
  };

  const titre = `${jours[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${jours[6].toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;

  const rendreCase = (d: Date, e: string) => {
    const texte = libelle(d);
    const libre = e === "libre" && !!onPick;
    const classe =
      e === "libre" ? (libre ? "cal-case cal-libre" : "cal-case cal-libre-fixe") :
      e === "occupe" ? "cal-case cal-pris" :
      e === "attente" ? "cal-case cal-attente" : "cal-case cal-passe";
    const contenu = texte || (e === "libre" ? (libre ? "Réserver" : "Libre") : e === "occupe" ? "Pris" : e === "attente" ? "En attente" : "");
    return (
      <td
        className={classe}
        onClick={() => { if (libre && onPick) onPick(`${cle(d)}:00`); }}
        title={`${pad(d.getHours())}h · ${e === "libre" ? "Libre" : e === "occupe" ? "Déjà pris" : e === "attente" ? "Demande en attente" : "Passé"}`}
      >
        {contenu}
      </td>
    );
  };

  return (
    <div className="cal">
      <style>{CSS}</style>

      <div className="cal-entete">
        <div className="cal-titre">
          Planning
          <small>{titre}</small>
        </div>
        <div className="cal-nav">
          <button className="cal-btn" onClick={() => setDecalage(decalage - 1)} aria-label="Semaine précédente">‹ Précédente</button>
          <button className="cal-btn" onClick={() => setDecalage(0)}>Aujourd&apos;hui</button>
          <button className="cal-btn" onClick={() => setDecalage(decalage + 1)} aria-label="Semaine suivante">Suivante ›</button>
        </div>
      </div>

      <div className="cal-legende">
        {LEGENDE.map(l => (
          <span key={l.label}><i className={`cal-pastille ${l.cls}`} />{l.label}</span>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="cal-grille">
          <thead>
            <tr>
              <th style={{ width: 46 }} />
              {jours.map((d, i) => (
                <th key={i} className={`cal-jour${memeJour(d, maintenant) ? " aujourdhui" : ""}`}>
                  {JOURS[i]}
                  <b>{d.getDate()}</b>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 24 }, (_, h) => (
              <tr key={h}>
                <td className="cal-heure">{pad(h)}:00</td>
                {jours.map((jour, i) => {
                  const d = new Date(jour); d.setHours(h, 0, 0, 0);
                  return <Fragment key={i}>{rendreCase(d, etat(d))}</Fragment>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {onPick && <div className="cal-aide">Clique sur un créneau libre pour le réserver.</div>}
    </div>
  );
}
