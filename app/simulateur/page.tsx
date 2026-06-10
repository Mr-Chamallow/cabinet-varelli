"use client";

import { useState } from "react";

type TypeAffaire = "Crime" | "Délit majeur" | "Délit mineur";
type Risque = "Aucun" | "Faible" | "Moyen" | "Élevé" | "Extrême";

const TARIFS_BASE: Record<TypeAffaire, number> = {
  Crime: 15000,
  "Délit majeur": 8000,
  "Délit mineur": 3000,
};

const MODIFICATEURS_RISQUE: Record<Risque, number> = {
  Aucun: 1.0,
  Faible: 1.15,
  Moyen: 1.3,
  Élevé: 1.5,
  Extrême: 1.8,
};

interface Option {
  label: string;
  key: string;
  modif: number;
  desc: string;
  icon: string;
}

const OPTIONS: Option[] = [
  { key: "bon_boulot", label: "Bon boulot", modif: 1.15, desc: "+15% (client fidèle ou affaire bien préparée)", icon: "⭐" },
  { key: "proces", label: "Procès", modif: 1.25, desc: "+25% (nécessite audience et plaidoirie)", icon: "⚖️" },
  { key: "plante_verte", label: "Plante verte", modif: 0.85, desc: "−15% (client régulier / réduction accordée)", icon: "🌿" },
];

interface HistEntry {
  type: TypeAffaire;
  risque: Risque;
  options: string[];
  base: number;
  final: number;
  date: string;
}

export default function SimulateurPage() {
  const [type, setType] = useState<TypeAffaire>("Crime");
  const [risque, setRisque] = useState<Risque>("Moyen");
  const [selectedOpts, setSelectedOpts] = useState<string[]>([]);
  const [historique, setHistorique] = useState<HistEntry[]>([]);

  const base = TARIFS_BASE[type];
  const modRisque = MODIFICATEURS_RISQUE[risque];

  const modOptions = selectedOpts.reduce((acc, key) => {
    const opt = OPTIONS.find(o => o.key === key);
    return opt ? acc * opt.modif : acc;
  }, 1);

  const honoraires = Math.round(base * modRisque * modOptions);

  const toggleOpt = (key: string) => {
    setSelectedOpts((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const addHistorique = () => {
    setHistorique([
      {
        type,
        risque,
        options: selectedOpts,
        base,
        final: honoraires,
        date: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      },
      ...historique,
    ].slice(0, 15));
  };

  const badgeRisque: Record<Risque, string> = {
    Aucun: "badge-muted",
    Faible: "badge-success",
    Moyen: "badge-warning",
    Élevé: "badge-danger",
    Extrême: "badge-danger",
  };

  const totalMod = (modRisque * modOptions - 1) * 100;

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Simulateur juridique</h1>
          <p className="page-subtitle">Calcul des honoraires selon le code pénal FlashBackFA</p>
          <div className="gold-line" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Left: config */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Type d'affaire */}
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: "1rem" }}>Type d'affaire</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {(Object.keys(TARIFS_BASE) as TypeAffaire[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  style={{
                    background: type === t ? "var(--gold-muted)" : "var(--surface)",
                    border: `1px solid ${type === t ? "rgba(212,175,55,0.5)" : "var(--border)"}`,
                    borderRadius: "var(--radius)",
                    padding: "0.875rem 1rem",
                    cursor: "pointer",
                    color: type === t ? "var(--gold)" : "var(--text-muted)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.15s",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.9rem",
                    fontWeight: type === t ? 600 : 400,
                    textAlign: "left",
                  }}
                >
                  <span>{t}</span>
                  <span style={{ fontSize: "0.85rem", color: type === t ? "var(--gold)" : "var(--text-dim)" }}>
                    {fmt(TARIFS_BASE[t])}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Risque */}
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: "1rem" }}>Niveau de risque</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {(Object.keys(MODIFICATEURS_RISQUE) as Risque[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRisque(r)}
                  style={{
                    background: risque === r ? "var(--gold-muted)" : "var(--surface)",
                    border: `1px solid ${risque === r ? "rgba(212,175,55,0.5)" : "var(--border)"}`,
                    borderRadius: 8,
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                    color: risque === r ? "var(--gold)" : "var(--text-muted)",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.85rem",
                    fontWeight: risque === r ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  {r} <span style={{ opacity: 0.6, fontSize: "0.75rem" }}>×{MODIFICATEURS_RISQUE[r].toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: "1rem" }}>Modificateurs</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => toggleOpt(opt.key)}
                  style={{
                    background: selectedOpts.includes(opt.key) ? "var(--gold-muted)" : "var(--surface)",
                    border: `1px solid ${selectedOpts.includes(opt.key) ? "rgba(212,175,55,0.5)" : "var(--border)"}`,
                    borderRadius: "var(--radius)",
                    padding: "0.875rem 1rem",
                    cursor: "pointer",
                    color: selectedOpts.includes(opt.key) ? "var(--gold)" : "var(--text-muted)",
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "flex-start",
                    transition: "all 0.15s",
                    textAlign: "left",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>{opt.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.2rem" }}>{opt.label}</div>
                    <div style={{ fontSize: "0.78rem", opacity: 0.7 }}>{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: résultat */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Résultat principal */}
          <div style={{
            background: "var(--card)",
            border: "2px solid rgba(212,175,55,0.4)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at top, rgba(212,175,55,0.06) 0%, transparent 60%)",
              pointerEvents: "none",
            }} />
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.68rem", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "0.75rem" }}>
              HONORAIRES ESTIMÉS
            </div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "3rem",
              fontWeight: 900,
              color: "var(--gold)",
              lineHeight: 1,
              marginBottom: "0.5rem",
            }}>
              {fmt(honoraires)}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Base {fmt(base)} · {totalMod >= 0 ? "+" : ""}{totalMod.toFixed(0)}% de modificateurs
            </div>

            {/* Détail des modifs */}
            <div style={{
              background: "var(--surface)",
              borderRadius: "var(--radius)",
              padding: "1rem",
              textAlign: "left",
              marginBottom: "1.5rem",
            }}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "0.75rem" }}>
                Décomposition
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Base ({type})</span>
                  <span>{fmt(base)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--text-muted)" }}>Risque {risque}</span>
                  <span style={{ color: modRisque > 1 ? "var(--warning)" : "var(--text-muted)" }}>
                    ×{modRisque.toFixed(2)}
                  </span>
                </div>
                {selectedOpts.map((key) => {
                  const opt = OPTIONS.find(o => o.key === key);
                  if (!opt) return null;
                  return (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>{opt.label}</span>
                      <span style={{ color: opt.modif > 1 ? "var(--warning)" : "var(--success)" }}>
                        ×{opt.modif.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.5rem", display: "flex", justifyContent: "space-between", fontWeight: 700, color: "var(--gold)" }}>
                  <span>Total</span>
                  <span>{fmt(honoraires)}</span>
                </div>
              </div>
            </div>

            <button className="btn btn-gold" onClick={addHistorique} style={{ width: "100%", justifyContent: "center" }}>
              Sauvegarder dans l'historique
            </button>
          </div>

          {/* Badges actifs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <span className={`badge ${badgeRisque[risque]}`}>Risque : {risque}</span>
            <span className="badge badge-muted">{type}</span>
            {selectedOpts.map((key) => {
              const opt = OPTIONS.find(o => o.key === key);
              return opt ? <span key={key} className="badge badge-gold">{opt.icon} {opt.label}</span> : null;
            })}
          </div>
        </div>
      </div>

      {/* Historique */}
      {historique.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 className="section-title">Historique</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setHistorique([])}>Effacer</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Type</th>
                  <th>Risque</th>
                  <th>Options</th>
                  <th>Base</th>
                  <th style={{ textAlign: "right" }}>Honoraires</th>
                </tr>
              </thead>
              <tbody>
                {historique.map((h, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{h.date}</td>
                    <td><span className="badge badge-muted">{h.type}</span></td>
                    <td><span className={`badge ${badgeRisque[h.risque]}`}>{h.risque}</span></td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{h.options.join(", ") || "—"}</td>
                    <td style={{ color: "var(--text-muted)" }}>{fmt(h.base)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--gold)" }}>{fmt(h.final)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
