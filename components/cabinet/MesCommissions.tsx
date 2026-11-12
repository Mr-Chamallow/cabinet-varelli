"use client";
import { useEffect, useState } from "react";
import { montant } from "@/lib/montant";
import { semaineCourante } from "@/lib/compta";
import { weekStartOf } from "@/lib/weekStart";

const dateFr = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

// Espace employé : ses commissions de la semaine, son solde et ses versements. Lecture seule.
export default function MesCommissions() {
  const [semaine, setSemaine] = useState(() => semaineCourante());
  const [data, setData] = useState<any>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    setErreur("");
    fetch(`/api/cabinet/compta/mes-commissions?semaine=${semaine}`).then(r => r.json()).then(d => d.error ? setErreur(d.error) : setData(d));
  }, [semaine]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="form-group" style={{ maxWidth: 220, marginBottom: 0 }}>
        <label>Semaine (une date de la semaine)</label>
        <input type="date" value={semaine} onChange={e => e.target.value && setSemaine(weekStartOf(e.target.value))} />
      </div>
      {erreur && <div style={{ color: "#f87171" }}>{erreur}</div>}
      {!data && !erreur && <div style={{ color: "var(--text-dim)" }}>Chargement...</div>}
      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "1rem" }}>
            <div className="cab-card"><div className="cab-muted">Commissions de la semaine</div><div className="cab-title" style={{ fontSize: "1.6rem" }}>{montant(data.commission_semaine)}</div></div>
            <div className="cab-card"><div className="cab-muted">Commissions cumulées</div><div className="cab-title" style={{ fontSize: "1.6rem" }}>{montant(data.commission_cumul)}</div></div>
            <div className="cab-card"><div className="cab-muted">Déjà versé</div><div className="cab-title" style={{ fontSize: "1.6rem" }}>{montant(data.versements_cumul)}</div></div>
            <div className="cab-card" style={{ borderLeft: "3px solid var(--gold, #b08a3e)" }}><div className="cab-muted">Solde restant dû</div><div className="cab-title" style={{ fontSize: "1.6rem" }}>{montant(data.solde)}</div></div>
          </div>

          <div className="cab-card">
            <div className="cab-card"><div className="cab-muted">Comparutions immédiates : votre part (semaine)</div><div className="cab-title" style={{ fontSize: "1.3rem" }}>{montant(data.comparutions_semaine_total)}</div></div>
            <div className="cab-section-titre" style={{ fontSize: "0.9rem" }}>Prestations de la semaine</div>
            {data.prestations_semaine.length === 0 && <div className="cab-muted">Aucune prestation soldée cette semaine.</div>}
            {data.prestations_semaine.map((p: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap", padding: "0.4rem 0", borderBottom: "1px solid var(--border, #333)", fontSize: "0.88rem" }}>
                <span>{p.description} <span className="cab-muted">· {p.facture} · {p.client}</span></span>
                <span>{montant(p.total)} → <b>{montant(p.commission)}</b> ({p.pct}%)</span>
              </div>
            ))}
          </div>

          <div className="cab-card">
            <div className="cab-section-titre" style={{ fontSize: "0.9rem" }}>Mes versements</div>
            {data.versements.length === 0 && <div className="cab-muted">Aucun versement pour le moment.</div>}
            {data.versements.map((v: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0", fontSize: "0.88rem" }}>
                <span>{dateFr(v.date_versement)} · {v.moyen || "-"}</span>
                <b>{montant(Number(v.montant))}</b>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
