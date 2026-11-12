"use client";
import { useEffect, useState } from "react";
import { montant } from "@/lib/montant";
import { Stat, champ, dateFr } from "@/components/compta/commun";

// Factures hebdomadaires au gouvernement : générer, voir/imprimer, marquer payée
export default function FacturesGouvernement({ semaine }: { semaine: string }) {
  const [factures, setFactures] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const charger = () =>
    fetch("/api/cabinet/compta/facture-gouvernement").then(r => r.json()).then(d => setFactures(d.rows || [])).catch(() => {});

  useEffect(() => { charger(); }, []);

  const generer = async () => {
    setMessage("");
    const r = await fetch(`/api/cabinet/compta/facture-gouvernement?semaine=${semaine}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ semaine }) });
    const d = await r.json();
    setMessage(d.error || d.message || `Facture ${d.facture?.numero} créée.`);
    charger();
  };

  const marquerPayee = async (id: string) => {
    await fetch(`/api/cabinet/compta/facture-gouvernement?id=${id}`, { method: "PATCH" });
    charger();
  };

  const aPayer = factures.filter(f => f.statut !== "payee").reduce((s, f) => s + Number(f.total || 0), 0);

  return (
    <div className="cab-card">
      <div className="cab-section-titre" style={{ fontSize: "0.9rem" }}>Factures au gouvernement</div>
      <div className="cab-muted" style={{ fontSize: "0.8rem", marginBottom: "0.5rem" }}>Créée automatiquement chaque lundi pour la semaine précédente. Bouton ci-dessous pour la semaine affichée.</div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn btn-gold btn-sm" onClick={generer}>Générer la facture de cette semaine</button>
        {message && <span className="cab-muted">{message}</span>}
      </div>
      <div style={{ marginTop: "0.75rem" }}>
        <Stat label="Reste à encaisser" valeur={montant(aPayer)} />
      </div>
      <div style={{ marginTop: "0.5rem", overflowX: "auto" }}>
        {factures.length === 0 && <div className="cab-muted">Aucune facture pour l&apos;instant.</div>}
        {factures.map(f => (
          <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0", borderBottom: "1px solid #eee", flexWrap: "wrap" }}>
            <div>
              <strong>{f.numero}</strong> · semaine du {dateFr(f.semaine)} · {f.nb_comparutions} comparution(s) · {montant(f.total)}
              <div className="cab-muted" style={{ fontSize: "0.8rem" }}>{f.statut === "payee" ? `Payée le ${dateFr(f.payee_at)}` : "À régler"}</div>
            </div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <a className="btn btn-gold btn-sm" href={`/api/cabinet/compta/facture-gouvernement/${f.id}`} target="_blank" rel="noreferrer">Voir / imprimer</a>
              {f.statut !== "payee" && <button className="btn btn-sm" onClick={() => marquerPayee(f.id)}>Marquer payée</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
