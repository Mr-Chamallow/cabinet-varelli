"use client";
import { useEffect, useState } from "react";
import { montant } from "@/lib/montant";
import { semaineCourante } from "@/lib/compta";
import { weekStartOf } from "@/lib/weekStart";
import { Stat, champ, dateFr } from "@/components/compta/commun";

// Bilan hebdomadaire : encaissements, charges, TVA, résultat net
export default function ComptaBilan() {
  const [semaine, setSemaine] = useState(() => semaineCourante());
  const [resume, setResume] = useState<any>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    fetch(`/api/cabinet/compta/resume?semaine=${semaine}`).then(r => r.json()).then(d => d.error ? setErreur(d.error) : (setErreur(""), setResume(d)));
  }, [semaine]);

  if (erreur) return <div style={{ color: "#f87171" }}>{erreur}</div>;
  if (!resume) return <div className="cab-muted">Chargement...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
        <input type="date" style={{ ...champ, width: "auto" }} value={semaine} onChange={e => e.target.value && setSemaine(weekStartOf(e.target.value))} />
        <span className="cab-muted" style={{ fontSize: "0.85rem" }}>Semaine du lundi {dateFr(semaine)} au dimanche</span>
        <a className="btn btn-gold btn-sm" href={`/api/cabinet/compta/resume?semaine=${semaine}&format=csv`}>Relevé CSV</a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "0.7rem" }}>
        <Stat label="Encaissé (paiements reçus)" valeur={montant(resume.encaisse)} couleur="#5fb878" />
        <Stat label="Dépenses" valeur={montant(resume.depenses)} couleur="#f87171" />
        <Stat label="Commissions (salaires)" valeur={montant(resume.commissions)} couleur="#e0b050" />
        <Stat label="TVA collectée" valeur={montant(resume.tva)} />
        <Stat label="Résultat net" valeur={montant(resume.resultatNet)} couleur={resume.resultatNet >= 0 ? "#5fb878" : "#f87171"} />
      </div>

      <div className="cab-card">
        <div className="cab-section-titre" style={{ fontSize: "0.9rem" }}>Comparutions immédiates (payées par le gouvernement)</div>
        <div className="cab-muted" style={{ fontSize: "0.8rem", marginBottom: "0.5rem" }}>Hors encaissements clients et hors résultat net. Les parts sont ajoutées au salaire des avocats.</div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0" }}><span>Total à transmettre au gouvernement ({resume.ciSemaineListe.length})</span><strong>{montant(resume.ciSemaine)}</strong></div>
        <a className="btn btn-gold btn-sm" style={{ marginTop: "0.5rem" }} href={`/api/cabinet/compta/resume?semaine=${semaine}&format=ci-csv`}>Détail des comparutions (CSV)</a>
      </div>

      <div className="cab-card">
        <div className="cab-section-titre" style={{ fontSize: "0.9rem" }}>Encaissements par moyen de paiement</div>
        {Object.keys(resume.parMode).length === 0 && <div className="cab-muted">Aucun paiement cette semaine.</div>}
        {Object.entries(resume.parMode).map(([mode, m]: any) => (
          <div key={mode} style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0" }}><span>{mode}</span><strong>{montant(m)}</strong></div>
        ))}
      </div>

      <div className="cab-card">
        <div className="cab-section-titre" style={{ fontSize: "0.9rem" }}>Avoirs de la semaine</div>
        {resume.avoirs.length === 0 && <div className="cab-muted">Aucun avoir.</div>}
        {resume.avoirs.map((a: any) => (
          <div key={a.id} style={{ padding: "0.3rem 0", fontSize: "0.85rem" }}>{a.numero} · {dateFr(a.created_at)} · {montant(Number(a.montant))} · {a.motif}</div>
        ))}
      </div>

      <div className="cab-muted" style={{ fontSize: "0.8rem" }}>
        Commissions et TVA : calculées sur les factures soldées dans la semaine. Résultat net = encaissé − dépenses − commissions.
      </div>
    </div>
  );
}
