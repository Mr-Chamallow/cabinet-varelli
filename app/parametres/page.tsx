"use client";

import { useState } from "react";

interface Config {
  cabinet_nom: string;
  cabinet_devise: string;
  cabinet_ville: string;
  avocat_nom: string;
  avocat_titre: string;
  taux_gang: number;
  taux_petite_frappe: number;
  taux_independant: number;
  tarif_crime: number;
  tarif_delit_majeur: number;
  tarif_delit_mineur: number;
}

const DEFAULT_CONFIG: Config = {
  cabinet_nom: "Cabinet Varelli",
  cabinet_devise: "Seul Dieu peut juger",
  cabinet_ville: "Los Santos, San Andreas",
  avocat_nom: "Marco Varelli",
  avocat_titre: "Associé Junior",
  taux_gang: 20,
  taux_petite_frappe: 25,
  taux_independant: 30,
  tarif_crime: 15000,
  tarif_delit_majeur: 8000,
  tarif_delit_mineur: 3000,
};

export default function ParametresPage() {
  const [config, setConfig] = useState<Config>({ ...DEFAULT_CONFIG });
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("cabinet");

  function handleChange(key: keyof Config, value: string | number) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    // Dans une vraie app, sauvegarder en base ou localStorage
    // Ici simulation
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleReset() {
    setConfig({ ...DEFAULT_CONFIG });
    setSaved(false);
  }

  const sections = [
    { key: "cabinet", label: "Cabinet", icon: "⚖️" },
    { key: "avocat", label: "Avocat principal", icon: "👤" },
    { key: "blanchiment", label: "Taux blanchiment", icon: "🔄" },
    { key: "simulateur", label: "Tarifs simulateur", icon: "⚙️" },
    { key: "danger", label: "Zone dangereuse", icon: "⚠️" },
  ];

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Paramètres</h1>
          <p className="page-subtitle">Configuration du Cabinet Varelli</p>
          <div className="gold-line" />
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-outline" onClick={handleReset}>Réinitialiser</button>
          <button className="btn btn-gold" onClick={handleSave}>
            {saved ? "✅ Sauvegardé" : "Sauvegarder"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "1.5rem" }}>
        {/* Sidebar nav */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius)",
                background: activeSection === s.key ? "var(--gold-muted)" : "transparent",
                border: `1px solid ${activeSection === s.key ? "rgba(212,175,55,0.35)" : "transparent"}`,
                color: activeSection === s.key ? "var(--gold)" : "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.875rem",
                fontWeight: activeSection === s.key ? 600 : 400,
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>

          {/* Cabinet */}
          {activeSection === "cabinet" && (
            <div className="card">
              <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Informations du cabinet</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="form-group">
                  <label>Nom du cabinet</label>
                  <input
                    value={config.cabinet_nom}
                    onChange={(e) => handleChange("cabinet_nom", e.target.value)}
                    placeholder="Cabinet Varelli"
                  />
                </div>
                <div className="form-group">
                  <label>Devise / Slogan</label>
                  <input
                    value={config.cabinet_devise}
                    onChange={(e) => handleChange("cabinet_devise", e.target.value)}
                    placeholder="Seul Dieu peut juger"
                  />
                  <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.3rem" }}>
                    Apparaît sur les factures PDF et en bas du tableau de bord.
                  </div>
                </div>
                <div className="form-group">
                  <label>Ville / Localisation</label>
                  <input
                    value={config.cabinet_ville}
                    onChange={(e) => handleChange("cabinet_ville", e.target.value)}
                    placeholder="Los Santos, San Andreas"
                  />
                </div>

                {/* Aperçu */}
                <div style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "1.25rem",
                  textAlign: "center",
                  marginTop: "0.5rem",
                }}>
                  <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "0.75rem" }}>
                    Aperçu en-tête facture
                  </div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 700, color: "var(--gold)", marginBottom: "0.25rem" }}>
                    {config.cabinet_nom || "—"}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", fontStyle: "italic" }}>
                    « {config.cabinet_devise || "—"} »
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
                    {config.cabinet_ville || "—"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Avocat */}
          {activeSection === "avocat" && (
            <div className="card">
              <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Avocat principal</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="form-group">
                  <label>Nom RP</label>
                  <input
                    value={config.avocat_nom}
                    onChange={(e) => handleChange("avocat_nom", e.target.value)}
                    placeholder="Marco Varelli"
                  />
                </div>
                <div className="form-group">
                  <label>Titre / Grade</label>
                  <input
                    value={config.avocat_titre}
                    onChange={(e) => handleChange("avocat_titre", e.target.value)}
                    placeholder="Associé Junior"
                  />
                </div>

                {/* Card preview */}
                <div style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  marginTop: "0.5rem",
                }}>
                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    background: "var(--gold-muted)",
                    border: "1.5px solid rgba(212,175,55,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 700,
                    fontSize: "1.2rem",
                    color: "var(--gold)",
                  }}>
                    {config.avocat_nom?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "0.2rem" }}>{config.avocat_nom || "—"}</div>
                    <span className="badge badge-gold">{config.avocat_titre || "—"}</span>
                  </div>
                </div>

                <div className="card" style={{ background: "rgba(59,130,246,0.05)", borderColor: "rgba(59,130,246,0.25)", padding: "1rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    <span>💡</span>
                    <span>Ces informations seront utilisées dans les futures fonctionnalités de signature de documents et d'authentification (V8).</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Blanchiment */}
          {activeSection === "blanchiment" && (
            <div className="card">
              <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Taux de commission — Blanchiment</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {[
                  { key: "taux_gang" as keyof Config, label: "Gang / Famille / Organisation", desc: "Tarif préférentiel pour les organisations structurées" },
                  { key: "taux_petite_frappe" as keyof Config, label: "Petite frappe", desc: "Tarif intermédiaire pour les opérateurs mineurs" },
                  { key: "taux_independant" as keyof Config, label: "Indépendant", desc: "Tarif plein pour les clients sans affiliation" },
                ].map(({ key, label, desc }) => (
                  <div key={key} style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: "0.2rem" }}>{label}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>{desc}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={config[key] as number}
                        onChange={(e) => handleChange(key, Number(e.target.value))}
                        style={{ width: 70, textAlign: "center" }}
                      />
                      <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>%</span>
                    </div>
                  </div>
                ))}

                {/* Tableau récap */}
                <div style={{
                  background: "var(--surface)",
                  border: "1px solid rgba(212,175,55,0.25)",
                  borderRadius: "var(--radius)",
                  padding: "1rem 1.25rem",
                }}>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", marginBottom: "0.75rem" }}>
                    Exemple sur $100 000
                  </div>
                  {[
                    { label: "Gang", taux: config.taux_gang },
                    { label: "Petite frappe", taux: config.taux_petite_frappe },
                    { label: "Indépendant", taux: config.taux_independant },
                  ].map(({ label, taux }) => {
                    const net = 100000 * (1 - taux / 100);
                    return (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid var(--border)", fontSize: "0.875rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>{label} ({taux}%)</span>
                        <span style={{ color: "var(--success)", fontWeight: 600 }}>
                          {net.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} nets
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Simulateur */}
          {activeSection === "simulateur" && (
            <div className="card">
              <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Tarifs de base — Simulateur</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[
                  { key: "tarif_crime" as keyof Config, label: "Crime", icon: "🔴" },
                  { key: "tarif_delit_majeur" as keyof Config, label: "Délit majeur", icon: "🟠" },
                  { key: "tarif_delit_mineur" as keyof Config, label: "Délit mineur", icon: "🟡" },
                ].map(({ key, label, icon }) => (
                  <div key={key} style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    padding: "1rem 1.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "1rem",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "1.1rem" }}>{icon}</span>
                      <span style={{ fontWeight: 600 }}>{label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>$</span>
                      <input
                        type="number"
                        min={0}
                        value={config[key] as number}
                        onChange={(e) => handleChange(key, Number(e.target.value))}
                        style={{ width: 100, textAlign: "right" }}
                      />
                    </div>
                  </div>
                ))}

                <div className="card" style={{ background: "rgba(59,130,246,0.05)", borderColor: "rgba(59,130,246,0.25)", padding: "1rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    <span>💡</span>
                    <span>Ces tarifs de base sont multipliés par les modificateurs de risque et d'options dans le simulateur.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Zone dangereuse */}
          {activeSection === "danger" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="card" style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.03)" }}>
                <h2 className="section-title" style={{ marginBottom: "1.25rem", color: "var(--danger)" }}>
                  ⚠️ Zone dangereuse
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                  Les actions ci-dessous sont irréversibles. Elles affectent définitivement les données du cabinet.
                </p>

                {[
                  {
                    titre: "Réinitialiser les paramètres",
                    desc: "Remet tous les paramètres aux valeurs par défaut. Les données Supabase ne sont pas affectées.",
                    action: handleReset,
                    label: "Réinitialiser",
                  },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1.25rem",
                    background: "var(--surface)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: "var(--radius)",
                    gap: "1rem",
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{item.titre}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{item.desc}</div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={item.action} style={{ flexShrink: 0 }}>
                      {item.label}
                    </button>
                  </div>
                ))}
              </div>

              {/* V8 preview */}
              <div className="card" style={{ borderColor: "rgba(212,175,55,0.25)" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.5rem" }}>🚀</span>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--gold)", marginBottom: "0.5rem" }}>V8 — Fonctionnalités à venir</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      {[
                        "🔐 Authentification (Patron / Avocat / Employé)",
                        "📅 Calendrier des audiences",
                        "📊 Graphiques & statistiques avancées",
                        "📤 Export CSV des dossiers et factures",
                        "🔔 Notifications en temps réel",
                        "🔗 Intégration Google Sheets",
                        "🔍 Recherche globale",
                      ].map((f, i) => (
                        <div key={i} style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{f}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Save bar sticky */}
      {!saved && (
        <div style={{
          position: "fixed",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--card)",
          border: "1px solid rgba(212,175,55,0.3)",
          borderRadius: "var(--radius)",
          padding: "0.75rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          fontSize: "0.875rem",
          color: "var(--text-muted)",
          zIndex: 50,
          animation: "slideUp 0.2s ease",
        }}>
          Modifications non sauvegardées
          <button className="btn btn-gold btn-sm" onClick={handleSave}>Sauvegarder</button>
        </div>
      )}

      {saved && (
        <div className="toast-container">
          <div className="toast toast-success">✅ Paramètres sauvegardés</div>
        </div>
      )}
    </div>
  );
}
