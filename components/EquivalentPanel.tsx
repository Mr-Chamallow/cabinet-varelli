"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Drogue { id: string; nom: string; emoji: string; prix_min: number; prix_max: number; semaines_revend: number; ordre?: number }
const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtN = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });

// Onglet « Équivalent » (Transaction) : combien d'unités de chaque produit pour un montant d'argent propre. Prix = Tableau des prix.
export function EquivalentPanel() {
  const [drogues, setDrogues] = useState<Drogue[]>([]);
  const [montant, setMontant] = useState(0);
  useEffect(() => { supabase?.from("obsidian_drogues").select("*").order("ordre").then(({ data }) => setDrogues((data || []) as Drogue[])); }, []);
  const eq = useMemo(() => drogues.map(d => { const mid = (d.prix_min + d.prix_max) / 2; return { ...d, mid, units: mid > 0 ? Math.floor(montant / mid) : 0 }; }), [drogues, montant]);
  const maxU = Math.max(...eq.map(e => e.units), 1);
  return (
    <>
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Montant en argent propre ($)</label>
          <input type="number" min={0} value={montant || ""} placeholder="Ex: 500 000" onChange={e => setMontant(Math.max(0, parseInt(e.target.value) || 0))} style={{ fontSize: "1rem", fontWeight: 600 }} />
          <small style={{ color: "var(--text-dim)" }}>Nombre d'unités achetables au prix moyen du Tableau des prix.</small>
        </div>
      </div>
      {eq.length === 0 && <div style={{ color: "var(--text-dim)" }}>Aucun produit dans le Tableau des prix.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "0.75rem" }}>
        {eq.map(d => (
          <div key={d.id} className="card" style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, height: 2, width: `${(d.units / maxU) * 100}%`, background: "var(--gold)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "1.4rem" }}>{d.emoji}</span>
              <div><div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{d.nom}</div><div style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>{fmt(d.prix_min)}–{fmt(d.prix_max)}/u</div></div>
            </div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "1.75rem", color: montant > 0 && d.units > 0 ? "var(--gold)" : "var(--text-dim)" }}>
              {montant > 0 ? fmtN(d.units) : "—"}{montant > 0 && <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-dim)", marginLeft: 4 }}>unités</span>}
            </div>
            {montant > 0 && d.units > 0 && <div style={{ fontSize: "0.65rem", color: "var(--text-dim)" }}>Valeur estimée : {fmt(d.units * d.mid)}</div>}
          </div>
        ))}
      </div>
    </>
  );
}
