"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Risque = "Aucun" | "Faible" | "Moyen" | "Élevé" | "Extrême";

const TARIFS_BASE = {
  crime: 15000,
  delit_majeur: 8000,
  delit_mineur: 3000,
};

const MODIFICATEURS_RISQUE: Record<Risque, number> = {
  Aucun: 1.0,
  Faible: 1.15,
  Moyen: 1.3,
  Élevé: 1.5,
  Extrême: 1.8,
};

const RISQUES: Risque[] = ["Aucun", "Faible", "Moyen", "Élevé", "Extrême"];

interface Option {
  key: string;
  label: string;
  modif: number;
  desc: string;
  icon: string;
}

const OPTIONS: Option[] = [
  { key: "bon_boulot", label: "Bon boulot", modif: 1.15, desc: "+15% — client fidèle ou affaire bien préparée", icon: "⭐" },
  { key: "proces", label: "Procès", modif: 1.25, desc: "+25% — nécessite audience et plaidoirie", icon: "⚖️" },
  { key: "plante_verte", label: "Plante verte", modif: 0.85, desc: "−15% — client régulier / réduction accordée", icon: "🌿" },
];

interface HistEntry {
  crimes: number;
  delits_majeurs: number;
  delits_mineurs: number;
  risque: Risque;
  options: string[];
  total: number;
  date: string;
}

function genNumeroFacture() {
  return `FAC-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`;
}

export default function SimulateurPage() {
  const router = useRouter();

  // Quantités
  const [qCrimes, setQCrimes] = useState(0);
  const [qDelitsMajeurs, setQDelitsMajeurs] = useState(0);
  const [qDelitsMineurs, setQDelitsMineurs] = useState(0);

  // Modificateurs
  const [risque, setRisque] = useState<Risque>("Moyen");
  const [selectedOpts, setSelectedOpts] = useState<string[]>([]);

  // Client pour facture
  const [clientName, setClientName] = useState("");
  const [showFactureForm, setShowFactureForm] = useState(false);
  const [creatingFacture, setCreatingFacture] = useState(false);
  const [factureCreated, setFactureCreated] = useState<string | null>(null);

  // Historique
  const [historique, setHistorique] = useState<HistEntry[]>([]);

  // Calculs
  const baseCrimes = qCrimes * TARIFS_BASE.crime;
  const baseDelitsMajeurs = qDelitsMajeurs * TARIFS_BASE.delit_majeur;
  const baseDelitsMineurs = qDelitsMineurs * TARIFS_BASE.delit_mineur;
  const baseTotal = baseCrimes + baseDelitsMajeurs + baseDelitsMineurs;

  const modRisque = MODIFICATEURS_RISQUE[risque];
  const modOptions = selectedOpts.reduce((acc, key) => {
    const opt = OPTIONS.find(o => o.key === key);
    return opt ? acc * opt.modif : acc;
  }, 1);

  const honoraires = Math.round(baseTotal * modRisque * modOptions);
  const totalMod = ((modRisque * modOptions) - 1) * 100;

  const toggleOpt = (key: string) => {
    setSelectedOpts(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  function addHistorique() {
    if (honoraires <= 0) return;
    setHistorique([{
      crimes: qCrimes,
      delits_majeurs: qDelitsMajeurs,
      delits_mineurs: qDelitsMineurs,
      risque,
      options: [...selectedOpts],
      total: honoraires,
      date: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    }, ...historique].slice(0, 15));
  }

  async function creerFacture() {
    if (!supabase || !clientName.trim() || honoraires <= 0) return;
    setCreatingFacture(true);

    const lignes = [];
    if (qCrimes > 0) lignes.push(`${qCrimes} crime${qCrimes > 1 ? "s" : ""} (${fmt(TARIFS_BASE.crime)} × ${qCrimes})`);
    if (qDelitsMajeurs > 0) lignes.push(`${qDelitsMajeurs} délit${qDelitsMajeurs > 1 ? "s" : ""} majeur${qDelitsMajeurs > 1 ? "s" : ""} (${fmt(TARIFS_BASE.delit_majeur)} × ${qDelitsMajeurs})`);
    if (qDelitsMineurs > 0) lignes.push(`${qDelitsMineurs} délit${qDelitsMineurs > 1 ? "s" : ""} mineur${qDelitsMineurs > 1 ? "s" : ""} (${fmt(TARIFS_BASE.delit_mineur)} × ${qDelitsMineurs})`);
    if (selectedOpts.length > 0) {
      const labels = selectedOpts.map(k => OPTIONS.find(o => o.key === k)?.label).filter(Boolean);
      lignes.push(`Modificateurs : ${labels.join(", ")}`);
    }
    lignes.push(`Risque : ${risque}`);

    const description = lignes.join(" · ");
    const numero = genNumeroFacture();

    const { error } = await supabase.from("factures").insert([{
      numero,
      client: clientName.trim(),
      montant: honoraires,
      description,
      statut: "En attente",
      created_by: supabase ? (await import("@/lib/auth")).getUser()?.nom || "" : "",
    }]);

    setCreatingFacture(false);
    if (!error) {
      setFactureCreated(numero);
      setShowFactureForm(false);
      addHistorique();
      setTimeout(() => setFactureCreated(null), 5000);
    }
  }

  const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const badgeRisque: Record<Risque, string> = {
    Aucun: "#64748b",
    Faible: "#10b981",
    Moyen: "#f59e0b",
    Élevé: "#ef4444",
    Extrême: "#7c3aed",
  };

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Simulateur juridique</h1>
          <p className="page-subtitle">Calcul des honoraires · Code pénal FlashBackFA</p>
          <div className="gold-line" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Quantités */}
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: "1.25rem" }}>Chefs d'inculpation</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>

              {[
                { label: "Crimes", key: "crimes", value: qCrimes, set: setQCrimes, tarif: TARIFS_BASE.crime, color: "#7c3aed", icon: "🔴" },
                { label: "Délits majeurs", key: "majeurs", value: qDelitsMajeurs, set: setQDelitsMajeurs, tarif: TARIFS_BASE.delit_majeur, color: "#ef4444", icon: "🟠" },
                { label: "Délits mineurs", key: "mineurs", value: qDelitsMineurs, set: setQDelitsMineurs, tarif: TARIFS_BASE.delit_mineur, color: "#f59e0b", icon: "🟡" },
              ].map(({ label, value, set, tarif, color, icon }) => (
                <div key={label} style={{
                  background: "var(--surface)",
                  border: `1px solid ${value > 0 ? color + "40" : "var(--border)"}`,
                  borderRadius: "var(--radius)",
                  padding: "1rem 1.25rem",
                  transition: "all 0.15s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span>{icon}</span>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{label}</span>
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>{fmt(tarif)} / unité</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <button
                      onClick={() => set(Math.max(0, value - 1))}
                      style={{
                        width: 36, height: 36,
                        borderRadius: 8,
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                        cursor: "pointer",
                        fontSize: "1.2rem",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'Inter', sans-serif",
                        flexShrink: 0,
                      }}
                    >−</button>
                    <input
                      type="number"
                      min={0}
                      value={value || ""}
                      placeholder="0"
                      onChange={(e) => set(Math.max(0, Number(e.target.value) || 0))}
                      style={{ textAlign: "center", flex: 1, fontWeight: 700, fontSize: "1.1rem" }}
                    />
                    <button
                      onClick={() => set(value + 1)}
                      style={{
                        width: 36, height: 36,
                        borderRadius: 8,
                        background: value > 0 ? color + "20" : "var(--card)",
                        border: `1px solid ${value > 0 ? color + "50" : "var(--border)"}`,
                        color: value > 0 ? color : "var(--text)",
                        cursor: "pointer",
                        fontSize: "1.2rem",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'Inter', sans-serif",
                        flexShrink: 0,
                      }}
                    >+</button>
                    {value > 0 && (
                      <span style={{ minWidth: 80, textAlign: "right", fontWeight: 600, color, fontSize: "0.9rem" }}>
                        = {fmt(value * tarif)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Sous-total base */}
            {baseTotal > 0 && (
              <div style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                background: "var(--card)",
                borderRadius: "var(--radius)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderLeft: "3px solid var(--gold)",
              }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Sous-total ({(qCrimes + qDelitsMajeurs + qDelitsMineurs)} chef{(qCrimes + qDelitsMajeurs + qDelitsMineurs) !== 1 ? "s" : ""})
                </span>
                <span style={{ fontWeight: 700, color: "var(--gold)" }}>{fmt(baseTotal)}</span>
              </div>
            )}
          </div>

          {/* Risque */}
          <div className="card">
            <h2 className="section-title" style={{ marginBottom: "1rem" }}>Niveau de risque</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {RISQUES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRisque(r)}
                  style={{
                    background: risque === r ? badgeRisque[r] + "20" : "var(--surface)",
                    border: `1px solid ${risque === r ? badgeRisque[r] + "60" : "var(--border)"}`,
                    borderRadius: 8,
                    padding: "0.5rem 1rem",
                    cursor: "pointer",
                    color: risque === r ? badgeRisque[r] : "var(--text-muted)",
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
              {OPTIONS.map((opt) => {
                const active = selectedOpts.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    onClick={() => toggleOpt(opt.key)}
                    style={{
                      background: active ? "var(--gold-muted)" : "var(--surface)",
                      border: `1px solid ${active ? "rgba(212,175,55,0.5)" : "var(--border)"}`,
                      borderRadius: "var(--radius)",
                      padding: "0.875rem 1rem",
                      cursor: "pointer",
                      color: active ? "var(--gold)" : "var(--text-muted)",
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "flex-start",
                      transition: "all 0.15s",
                      textAlign: "left",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>{opt.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.15rem" }}>{opt.label}</div>
                      <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT */}
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
              position: "absolute", inset: 0,
              background: "radial-gradient(ellipse at top, rgba(212,175,55,0.06) 0%, transparent 60%)",
              pointerEvents: "none",
            }} />

            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.68rem", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "0.75rem" }}>
              HONORAIRES ESTIMÉS
            </div>

            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: honoraires > 999999 ? "2.2rem" : "3rem",
              fontWeight: 900,
              color: honoraires > 0 ? "var(--gold)" : "var(--text-dim)",
              lineHeight: 1,
              marginBottom: "0.5rem",
            }}>
              {honoraires > 0 ? fmt(honoraires) : "—"}
            </div>

            {baseTotal > 0 && (
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                Base {fmt(baseTotal)} · {totalMod >= 0 ? "+" : ""}{totalMod.toFixed(0)}% de modificateurs
              </div>
            )}

            {/* Décomposition */}
            {(qCrimes > 0 || qDelitsMajeurs > 0 || qDelitsMineurs > 0) && (
              <div style={{
                background: "var(--surface)",
                borderRadius: "var(--radius)",
                padding: "1rem",
                textAlign: "left",
                marginBottom: "1.5rem",
              }}>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", marginBottom: "0.75rem" }}>
                  Décomposition
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {qCrimes > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>🔴 {qCrimes} crime{qCrimes > 1 ? "s" : ""}</span>
                      <span style={{ color: "#7c3aed", fontWeight: 600 }}>{fmt(baseCrimes)}</span>
                    </div>
                  )}
                  {qDelitsMajeurs > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>🟠 {qDelitsMajeurs} délit{qDelitsMajeurs > 1 ? "s" : ""} majeur{qDelitsMajeurs > 1 ? "s" : ""}</span>
                      <span style={{ color: "#ef4444", fontWeight: 600 }}>{fmt(baseDelitsMajeurs)}</span>
                    </div>
                  )}
                  {qDelitsMineurs > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>🟡 {qDelitsMineurs} délit{qDelitsMineurs > 1 ? "s" : ""} mineur{qDelitsMineurs > 1 ? "s" : ""}</span>
                      <span style={{ color: "#f59e0b", fontWeight: 600 }}>{fmt(baseDelitsMineurs)}</span>
                    </div>
                  )}
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.4rem", display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Sous-total</span>
                    <span style={{ fontWeight: 600 }}>{fmt(baseTotal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>Risque {risque}</span>
                    <span style={{ color: modRisque > 1 ? "var(--warning)" : "var(--text-muted)" }}>×{modRisque.toFixed(2)}</span>
                  </div>
                  {selectedOpts.map(key => {
                    const opt = OPTIONS.find(o => o.key === key);
                    if (!opt) return null;
                    return (
                      <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>{opt.icon} {opt.label}</span>
                        <span style={{ color: opt.modif > 1 ? "var(--warning)" : "var(--success)" }}>×{opt.modif.toFixed(2)}</span>
                      </div>
                    );
                  })}
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.4rem", display: "flex", justifyContent: "space-between", fontWeight: 700, color: "var(--gold)", fontSize: "0.95rem" }}>
                    <span>Total honoraires</span>
                    <span>{fmt(honoraires)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <button
                className="btn btn-gold"
                onClick={() => { addHistorique(); setShowFactureForm(true); }}
                disabled={honoraires <= 0}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "0.9rem",
                  fontSize: "0.95rem",
                  opacity: honoraires <= 0 ? 0.4 : 1,
                }}
              >
                🧾 Créer une facture
              </button>
              <button
                className="btn btn-outline"
                onClick={addHistorique}
                disabled={honoraires <= 0}
                style={{ width: "100%", justifyContent: "center", opacity: honoraires <= 0 ? 0.4 : 1 }}
              >
                📋 Sauvegarder dans l'historique
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => { setQCrimes(0); setQDelitsMajeurs(0); setQDelitsMineurs(0); setRisque("Moyen"); setSelectedOpts([]); }}
                style={{ width: "100%", justifyContent: "center", fontSize: "0.8rem" }}
              >
                Réinitialiser
              </button>
            </div>
          </div>

          {/* Badges actifs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", padding: "0.2rem 0.65rem",
              borderRadius: 999, fontSize: "0.72rem", fontWeight: 600,
              background: badgeRisque[risque] + "18", color: badgeRisque[risque],
              border: `1px solid ${badgeRisque[risque]}40`,
            }}>Risque : {risque}</span>
            {qCrimes > 0 && <span className="badge badge-muted">{qCrimes} crime{qCrimes > 1 ? "s" : ""}</span>}
            {qDelitsMajeurs > 0 && <span className="badge badge-muted">{qDelitsMajeurs} délit{qDelitsMajeurs > 1 ? "s" : ""} majeur{qDelitsMajeurs > 1 ? "s" : ""}</span>}
            {qDelitsMineurs > 0 && <span className="badge badge-muted">{qDelitsMineurs} délit{qDelitsMineurs > 1 ? "s" : ""} mineur{qDelitsMineurs > 1 ? "s" : ""}</span>}
            {selectedOpts.map(key => {
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
            <h2 className="section-title">Historique de session</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => setHistorique([])}>Effacer</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Crimes</th>
                  <th>Délits majeurs</th>
                  <th>Délits mineurs</th>
                  <th>Risque</th>
                  <th>Options</th>
                  <th style={{ textAlign: "right" }}>Honoraires</th>
                </tr>
              </thead>
              <tbody>
                {historique.map((h, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{h.date}</td>
                    <td style={{ textAlign: "center" }}>{h.crimes || "—"}</td>
                    <td style={{ textAlign: "center" }}>{h.delits_majeurs || "—"}</td>
                    <td style={{ textAlign: "center" }}>{h.delits_mineurs || "—"}</td>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", padding: "0.15rem 0.55rem",
                        borderRadius: 999, fontSize: "0.72rem", fontWeight: 600,
                        background: badgeRisque[h.risque] + "18", color: badgeRisque[h.risque],
                        border: `1px solid ${badgeRisque[h.risque]}40`,
                      }}>{h.risque}</span>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {h.options.map(k => OPTIONS.find(o => o.key === k)?.label).filter(Boolean).join(", ") || "—"}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--gold)" }}>{fmt(h.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal création facture */}
      {showFactureForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowFactureForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Créer une facture</h2>
              <button className="modal-close" onClick={() => setShowFactureForm(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Récap */}
              <div style={{
                background: "var(--surface)",
                border: "1px solid rgba(212,175,55,0.3)",
                borderRadius: "var(--radius)",
                padding: "1rem 1.25rem",
                marginBottom: "1.25rem",
              }}>
                <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", marginBottom: "0.5rem" }}>
                  Récapitulatif du calcul
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.85rem" }}>
                  {qCrimes > 0 && <div style={{ color: "var(--text-muted)" }}>🔴 {qCrimes} crime{qCrimes > 1 ? "s" : ""} — {fmt(baseCrimes)}</div>}
                  {qDelitsMajeurs > 0 && <div style={{ color: "var(--text-muted)" }}>🟠 {qDelitsMajeurs} délit{qDelitsMajeurs > 1 ? "s" : ""} majeur{qDelitsMajeurs > 1 ? "s" : ""} — {fmt(baseDelitsMajeurs)}</div>}
                  {qDelitsMineurs > 0 && <div style={{ color: "var(--text-muted)" }}>🟡 {qDelitsMineurs} délit{qDelitsMineurs > 1 ? "s" : ""} mineur{qDelitsMineurs > 1 ? "s" : ""} — {fmt(baseDelitsMineurs)}</div>}
                  <div style={{ color: "var(--text-muted)" }}>⚠️ Risque {risque} × {modRisque.toFixed(2)}</div>
                  {selectedOpts.map(k => {
                    const opt = OPTIONS.find(o => o.key === k);
                    return opt ? <div key={k} style={{ color: "var(--text-muted)" }}>{opt.icon} {opt.label} × {opt.modif.toFixed(2)}</div> : null;
                  })}
                  <div style={{
                    paddingTop: "0.5rem",
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                    color: "var(--gold)",
                    fontSize: "1rem",
                  }}>
                    <span>Total honoraires</span>
                    <span>{fmt(honoraires)}</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Nom du client *</label>
                <input
                  placeholder="Nom RP du client"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && creerFacture()}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowFactureForm(false)}>Annuler</button>
              <button
                className="btn btn-gold"
                onClick={creerFacture}
                disabled={creatingFacture || !clientName.trim()}
                style={{ opacity: creatingFacture ? 0.7 : 1 }}
              >
                {creatingFacture ? "Création…" : "🧾 Émettre la facture"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast facture créée */}
      {factureCreated && (
        <div className="toast-container">
          <div className="toast toast-success" style={{ cursor: "pointer" }} onClick={() => router.push("/factures")}>
            ✅ Facture {factureCreated} créée — <span style={{ color: "var(--gold)", textDecoration: "underline" }}>Voir les factures</span>
          </div>
        </div>
      )}
    </div>
  );
}
