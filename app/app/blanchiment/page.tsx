"use client";

import { useState } from "react";

type TypeClient = "Gang / Famille / Organisation" | "Petite frappe" | "Indépendant";

const TAUX: Record<TypeClient, number> = {
  "Gang / Famille / Organisation": 0.20,
  "Petite frappe": 0.25,
  "Indépendant": 0.30,
};

const INFOS: Record<TypeClient, string> = {
  "Gang / Famille / Organisation": "20% de commission — tarif préférentiel pour les organisations structurées",
  "Petite frappe": "25% de commission — tarif standard pour les opérateurs indépendants mineurs",
  "Indépendant": "30% de commission — tarif plein pour les clients sans affiliation",
};

interface HistEntry {
  type: TypeClient;
  montantSale: number;
  commission: number;
  montantNet: number;
  date: string;
}

export default function BlanchimentPage() {
  const [typeClient, setTypeClient] = useState<TypeClient>("Gang / Famille / Organisation");
  const [montantSale, setMontantSale] = useState<number>(0);
  const [historique, setHistorique] = useState<HistEntry[]>([]);

  const taux = TAUX[typeClient];
  const commission = Math.round(montantSale * taux);
  const montantNet = montantSale - commission;

  const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  function addToHistorique() {
    if (montantSale <= 0) return;
    setHistorique([
      {
        type: typeClient,
        montantSale,
        commission,
        montantNet,
        date: new Date().toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      },
      ...historique,
    ].slice(0, 20));
  }

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Blanchiment</h1>
          <p className="page-subtitle">Conversion argent sale → argent propre</p>
          <div className="gold-line" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Calculateur */}
        <div className="card" style={{ gridColumn: "1" }}>
          <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Calculateur</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Type client */}
            <div className="form-group">
              <label>Profil client</label>
              <select
                value={typeClient}
                onChange={(e) => setTypeClient(e.target.value as TypeClient)}
              >
                {(Object.keys(TAUX) as TypeClient[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.3rem" }}>
                {INFOS[typeClient]}
              </div>
            </div>

            {/* Montant */}
            <div className="form-group">
              <label>Montant sale ($)</label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={montantSale || ""}
                onChange={(e) => setMontantSale(Number(e.target.value))}
                style={{ fontSize: "1.1rem" }}
              />
            </div>

            {/* Taux badge */}
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "0.75rem 1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Taux de commission</span>
              <span className="badge badge-danger" style={{ fontSize: "0.9rem", padding: "0.3rem 0.75rem" }}>
                {(taux * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Résultat */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Commission */}
          <div className="card" style={{ borderColor: "rgba(239,68,68,0.3)", flex: 1 }}>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--danger)", marginBottom: "0.5rem" }}>
              Commission cabinet
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, color: "var(--danger)" }}>
              {fmt(commission)}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
              {montantSale > 0 ? `${(taux * 100).toFixed(0)}% de ${fmt(montantSale)}` : "—"}
            </div>
          </div>

          {/* Net client */}
          <div className="card" style={{ borderColor: "rgba(16,185,129,0.35)", flex: 1 }}>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--success)", marginBottom: "0.5rem" }}>
              Restitué au client
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, color: "var(--success)" }}>
              {fmt(montantNet)}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
              Argent propre · immédiatement disponible
            </div>
          </div>

          {/* Bouton */}
          <button
            className="btn btn-gold"
            onClick={addToHistorique}
            disabled={montantSale <= 0}
            style={{ opacity: montantSale <= 0 ? 0.5 : 1, width: "100%", justifyContent: "center", padding: "0.875rem" }}
          >
            Enregistrer l'opération
          </button>
        </div>
      </div>

      {/* Résumé centré si montant */}
      {montantSale > 0 && (
        <div style={{
          background: "var(--card)",
          border: "1px solid rgba(212,175,55,0.3)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
          marginBottom: "2rem",
          textAlign: "center",
        }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "0.5rem" }}>
            RÉCAPITULATIF
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: "0.2rem" }}>Argent sale</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--text-muted)" }}>{fmt(montantSale)}</div>
            </div>
            <div style={{ fontSize: "1.5rem", color: "var(--border)" }}>→</div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--danger)", marginBottom: "0.2rem" }}>Commission {(taux * 100).toFixed(0)}%</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--danger)" }}>−{fmt(commission)}</div>
            </div>
            <div style={{ fontSize: "1.5rem", color: "var(--border)" }}>=</div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--success)", marginBottom: "0.2rem" }}>Argent propre</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 900, color: "var(--success)" }}>{fmt(montantNet)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Historique */}
      {historique.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 className="section-title">Historique de session</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setHistorique([])}>Effacer</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Profil</th>
                  <th>Montant sale</th>
                  <th>Commission</th>
                  <th>Net client</th>
                </tr>
              </thead>
              <tbody>
                {historique.map((h, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{h.date}</td>
                    <td><span className="badge badge-muted" style={{ fontSize: "0.72rem" }}>{h.type}</span></td>
                    <td style={{ color: "var(--text-muted)" }}>{fmt(h.montantSale)}</td>
                    <td style={{ color: "var(--danger)", fontWeight: 600 }}>−{fmt(h.commission)}</td>
                    <td style={{ color: "var(--success)", fontWeight: 700 }}>{fmt(h.montantNet)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
