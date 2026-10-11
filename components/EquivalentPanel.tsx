"use client";
import { money } from "@/lib/money";
import { useEffect, useMemo, useState } from "react";
import { loadPriceTable, PriceRef } from "@/lib/fournisseurs";

const fmt = (n: number) => money(n);
const fmtN = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

// Onglet « Équivalent » (Transaction) : combien d'unités on peut ACHETER avec un montant d'argent propre.
// Base = prix d'achat de reference du Tableau des prix (fournisseur prefere, sinon le moins cher). Sans fournisseur : prix de vente moyen (estimation).
export function EquivalentPanel() {
  const [table, setTable] = useState<PriceRef[]>([]);
  const [montant, setMontant] = useState(0);
  useEffect(() => { let off = false; loadPriceTable().then(t => { if (!off) setTable(t.filter(x => x.categorie === "drogue")); }); return () => { off = true; }; }, []);
  const eq = useMemo(() => table.map(d => {
    const base = d.achat > 0 ? d.achat : d.vente;
    const units = base > 0 ? Math.floor(montant / base) : 0;
    return { ...d, base, units, estime: !(d.achat > 0), revente: units * d.vente, gain: units * (d.vente - base) };
  }), [table, montant]);
  const maxU = Math.max(...eq.map(e => e.units), 1);
  return (
    <>
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Montant en argent propre ($)</label>
          <input type="number" min={0} value={montant || ""} placeholder="Ex: 500 000" onChange={e => setMontant(Math.max(0, parseInt(e.target.value) || 0))} style={{ fontSize: "1rem", fontWeight: 600 }} />
          <small style={{ color: "var(--text-dim)" }}>Unités achetables au prix d'achat de référence (fournisseur préféré, sinon le moins cher). Sans fournisseur : prix de vente moyen, marqué « estimé ».</small>
        </div>
      </div>
      {eq.length === 0 && <div style={{ color: "var(--text-dim)" }}>Aucun produit dans le Tableau des prix.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "0.75rem" }}>
        {eq.map(d => (
          <div key={d.nom} className="card" style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, height: 2, width: `${(d.units / maxU) * 100}%`, background: "var(--gold)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.4rem" }}>{d.emoji}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{d.nom}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>
                  {d.achat > 0 ? <>Achat {fmt(d.achat)}/u</> : <>Achat inconnu · vente moy. {fmt(d.vente)}/u (estimé)</>}
                </div>
              </div>
            </div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "1.75rem", color: montant > 0 && d.units > 0 ? "var(--gold)" : "var(--text-dim)" }}>
              {montant > 0 ? fmtN(d.units) : " - "}{montant > 0 && <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-dim)", marginLeft: 4 }}>unités{d.estime ? " (estimé)" : ""}</span>}
            </div>
            {d.fournisseur && <div style={{ fontSize: "0.66rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>🛒 {d.fournisseur.qui}{d.fournisseur.groupe ? ` · ${d.fournisseur.groupe}` : ""}{d.fournisseur.telephone ? ` · 📞 ${d.fournisseur.telephone}` : ""}</div>}
            {montant > 0 && d.units > 0 && !d.estime && d.vente > 0 && (
              <div style={{ fontSize: "0.66rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
                Revente PNJ : {fmt(d.revente)} · gain <b style={{ color: d.gain >= 0 ? "var(--success)" : "var(--danger)" }}>{fmt(d.gain)}</b>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
