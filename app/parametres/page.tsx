"use client";

import { useState, useEffect } from "react";
import { getUser, canAccess, type User } from "@/lib/auth";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<Config>({ ...DEFAULT_CONFIG });
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("cabinet");

  useEffect(() => {
    const u = getUser();
    if (!u || !canAccess(u.role, "parametres")) { router.replace("/"); return; }
    setUser(u);
    try {
      const stored = localStorage.getItem("varelli_config");
      if (stored) setConfig(JSON.parse(stored));
    } catch {}
  }, []);

  function handleChange(key: keyof Config, value: string | number) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    try { localStorage.setItem("varelli_config", JSON.stringify(config)); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleReset() { setConfig({ ...DEFAULT_CONFIG }); setSaved(false); }

  if (!user) return null;

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
          <button className="btn btn-gold" onClick={handleSave}>{saved ? "✅ Sauvegardé" : "Sauvegarder"}</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {sections.map((s) => (
            <button key={s.key} onClick={() => setActiveSection(s.key)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 1rem", borderRadius: "var(--radius)", background: activeSection === s.key ? "var(--gold-muted)" : "transparent", border: "1px solid " + (activeSection === s.key ? "rgba(212,175,55,0.35)" : "transparent"), color: activeSection === s.key ? "var(--gold)" : "var(--text-muted)", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", fontWeight: activeSection === s.key ? 600 : 400, textAlign: "left", transition: "all 0.15s" }}>
              <span>{s.icon}</span>{s.label}
            </button>
          ))}
          {canAccess(user.role, "admin") && (
            <>
              <div style={{ height: 1, background: "var(--border)", margin: "0.5rem 0" }} />
              <a href="/admin" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 1rem", borderRadius: "var(--radius)", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.875rem" }}>🛡️ Administration</a>
            </>
          )}
        </div>

        <div>
          {activeSection === "cabinet" && (
            <div className="card">
              <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Informations du cabinet</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="form-group"><label>Nom du cabinet</label><input value={config.cabinet_nom} onChange={(e) => handleChange("cabinet_nom", e.target.value)} /></div>
                <div className="form-group"><label>Devise / Slogan</label><input value={config.cabinet_devise} onChange={(e) => handleChange("cabinet_devise", e.target.value)} /></div>
                <div className="form-group"><label>Ville</label><input value={config.cabinet_ville} onChange={(e) => handleChange("cabinet_ville", e.target.value)} /></div>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "0.75rem" }}>Aperçu</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 700, color: "var(--gold)", marginBottom: "0.25rem" }}>{config.cabinet_nom}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", fontStyle: "italic" }}>« {config.cabinet_devise} »</div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "avocat" && (
            <div className="card">
              <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Avocat principal</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="form-group"><label>Nom RP</label><input value={config.avocat_nom} onChange={(e) => handleChange("avocat_nom", e.target.value)} /></div>
                <div className="form-group"><label>Titre / Grade</label><input value={config.avocat_titre} onChange={(e) => handleChange("avocat_titre", e.target.value)} /></div>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: 50, height: 50, borderRadius: "50%", background: "var(--gold-muted)", border: "1.5px solid rgba(212,175,55,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.2rem", color: "var(--gold)" }}>{config.avocat_nom?.[0]?.toUpperCase() || "?"}</div>
                  <div><div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{config.avocat_nom}</div><span className="badge badge-gold">{config.avocat_titre}</span></div>
                </div>
              </div>
            </div>
          )}

          {activeSection === "blanchiment" && (
            <div className="card">
              <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Taux de commission</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {([["taux_gang", "Gang / Famille / Organisation"], ["taux_petite_frappe", "Petite frappe"], ["taux_independant", "Indépendant"]] as [keyof Config, string][]).map(([key, label]) => (
                  <div key={key} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                    <span style={{ fontWeight: 500 }}>{label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input type="number" min={0} max={100} value={config[key] as number} onChange={(e) => handleChange(key, Number(e.target.value))} style={{ width: 70, textAlign: "center" }} />
                      <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "simulateur" && (
            <div className="card">
              <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Tarifs de base</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {([["tarif_crime", "Crime", "🔴"], ["tarif_delit_majeur", "Délit majeur", "🟠"], ["tarif_delit_mineur", "Délit mineur", "🟡"]] as [keyof Config, string, string][]).map(([key, label, icon]) => (
                  <div key={key} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}><span>{icon}</span><span style={{ fontWeight: 500 }}>{label}</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>$</span>
                      <input type="number" min={0} value={config[key] as number} onChange={(e) => handleChange(key, Number(e.target.value))} style={{ width: 100, textAlign: "right" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "danger" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="card" style={{ borderColor: "rgba(239,68,68,0.3)" }}>
                <h2 className="section-title" style={{ marginBottom: "1.25rem", color: "var(--danger)" }}>⚠️ Zone dangereuse</h2>
                <div style={{ background: "var(--surface)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius)", padding: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Réinitialiser les paramètres</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>Remet toutes les valeurs par défaut.</div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={handleReset}>Réinitialiser</button>
                </div>
              </div>
              <div className="card" style={{ borderColor: "rgba(212,175,55,0.25)" }}>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>🚀</span>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--gold)", marginBottom: "0.5rem" }}>V9 — Roadmap</div>
                    {["🔐 Supabase Auth complet", "📅 Calendrier des audiences", "📊 Graphiques recharts", "📤 Export CSV", "🔔 Notifications temps réel", "🔍 Recherche globale", "🔗 Google Sheets sync"].map((f, i) => (
                      <div key={i} style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>{f}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!saved && (
        <div style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", background: "var(--card)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "var(--radius)", padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", fontSize: "0.875rem", color: "var(--text-muted)", zIndex: 50 }}>
          Modifications non sauvegardées
          <button className="btn btn-gold btn-sm" onClick={handleSave}>Sauvegarder</button>
        </div>
      )}
      {saved && <div className="toast-container"><div className="toast toast-success">✅ Paramètres sauvegardés</div></div>}
    </div>
  );
}
