"use client";
import { useMemo, useState } from "react";

export interface CreneauRdv { date_rdv: string; statut: string; libelle?: string; }

interface Props {
  rdvs: CreneauRdv[];
  staff: boolean;                    // true = employé : voit les libellés (client, motif, avocat)
  onPick?: (iso: string) => void;    // client : clic sur un créneau libre
}

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const pad = (n: number) => String(n).padStart(2, "0");
const cle = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}`;

// Lundi de la semaine d'une date
function lundi(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const jour = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - jour);
  return x;
}

const STYLE: Record<string, { fond: string; txt: string }> = {
  libre: { fond: "rgba(95,184,120,0.18)", txt: "Libre" },
  attente: { fond: "rgba(224,176,80,0.28)", txt: "En attente" },
  occupe: { fond: "rgba(217,83,79,0.28)", txt: "Occupé" },
  passe: { fond: "rgba(255,255,255,0.03)", txt: "" },
};

// Calendrier hebdomadaire 24h/24, créneaux d'une heure. Couleurs : vert libre, orange en attente, rouge occupé.
export default function CalendrierRdv({ rdvs, staff, onPick }: Props) {
  const [decalage, setDecalage] = useState(0);
  const debut = useMemo(() => { const d = lundi(new Date()); d.setDate(d.getDate() + decalage * 7); return d; }, [decalage]);
  const jours = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(debut); d.setDate(debut.getDate() + i); return d; }), [debut]);
  const maintenant = new Date();

  // Index des créneaux : un créneau occupé l'emporte sur une demande en attente
  const index = useMemo(() => {
    const m: Record<string, CreneauRdv[]> = {};
    for (const r of rdvs) {
      if (r.statut === "annule" || r.statut === "termine") continue;
      const k = String(r.date_rdv).slice(0, 13);
      (m[k] = m[k] || []).push(r);
    }
    return m;
  }, [rdvs]);

  const etat = (d: Date) => {
    const liste = index[cle(d)] || [];
    if (liste.some(r => ["attribue", "confirme"].includes(r.statut))) return "occupe";
    if (d < maintenant) return "passe";
    if (liste.length) return "attente";
    return "libre";
  };

  const libelle = (d: Date) => {
    const liste = index[cle(d)] || [];
    if (!staff || liste.length === 0) return "";
    const r = liste.find(x => ["attribue", "confirme"].includes(x.statut)) || liste[0];
    return r.libelle || "";
  };

  const titre = `${jours[0].toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} au ${jours[6].toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`;

  return (
    <div className="cab-card" style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
        <button className="btn btn-outline btn-sm" onClick={() => setDecalage(decalage - 1)}>Semaine précédente</button>
        <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{titre}</div>
        <button className="btn btn-outline btn-sm" onClick={() => setDecalage(decalage + 1)}>Semaine suivante</button>
      </div>

      <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap", fontSize: "0.75rem", marginBottom: "0.6rem" }}>
        <span><span style={{ display: "inline-block", width: 12, height: 12, background: STYLE.libre.fond, border: "1px solid var(--border)", marginRight: 4 }} />Libre</span>
        <span><span style={{ display: "inline-block", width: 12, height: 12, background: STYLE.attente.fond, border: "1px solid var(--border)", marginRight: 4 }} />En attente</span>
        <span><span style={{ display: "inline-block", width: 12, height: 12, background: STYLE.occupe.fond, border: "1px solid var(--border)", marginRight: 4 }} />Occupé</span>
        <span><span style={{ display: "inline-block", width: 12, height: 12, background: STYLE.passe.fond, border: "1px solid var(--border)", marginRight: 4 }} />Passé</span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 620, borderCollapse: "separate", borderSpacing: 3, fontSize: "0.72rem" }}>
          <thead>
            <tr>
              <th style={{ width: 44 }} />
              {jours.map((d, i) => (
                <th key={i} style={{ color: "var(--text-dim)", fontWeight: 600, paddingBottom: 4 }}>
                  {JOURS[i]} {pad(d.getDate())}/{pad(d.getMonth() + 1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 24 }, (_, h) => (
              <tr key={h}>
                <td style={{ color: "var(--text-dim)", textAlign: "right", paddingRight: 6, whiteSpace: "nowrap" }}>{pad(h)}h</td>
                {jours.map((jour, i) => {
                  const d = new Date(jour); d.setHours(h, 0, 0, 0);
                  const e = etat(d);
                  const texte = libelle(d);
                  const libre = e === "libre" && !!onPick;
                  return (
                    <td key={i}
                      onClick={() => { if (libre && onPick) onPick(`${cle(d)}:00`); }}
                      title={STYLE[e].txt}
                      style={{
                        background: STYLE[e].fond,
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        height: 30,
                        minWidth: 80,
                        padding: "2px 4px",
                        cursor: libre ? "pointer" : "default",
                        color: e === "passe" ? "var(--text-dim)" : "var(--text)",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                      }}>
                      {texte || (e === "passe" ? "" : STYLE[e].txt)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onPick && <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>Clique sur une case verte pour choisir ce créneau.</div>}
    </div>
  );
}
