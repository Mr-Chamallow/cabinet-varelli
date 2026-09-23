"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { deriveGoldPalette, applyThemeToDocument, DEFAULT_GOLD, isValidHex } from "@/lib/theme";

const SETTINGS_KEYS = [
  { key: "app_nom", label: "Nom du site", placeholder: "Obsidian Logistique" },
  { key: "app_sous_nom", label: "Sous-titre", placeholder: "Consortium · Opérations · Logistique" },
  { key: "logo_url", label: "URL du logo", placeholder: "https://..." },
  { key: "police", label: "Police principale", placeholder: "Inter" },
];

const PRESET_COLORS = [
  "#a78bfa", "#c9a84c", "#ef4444", "#3b82f6", "#22c55e",
  "#f97316", "#e11d48", "#06b6d4", "#ec4899", "#14b8a6",
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [gold, setGold] = useState(DEFAULT_GOLD);
  const [goldInput, setGoldInput] = useState(DEFAULT_GOLD);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from("app_settings").select("cle,valeur");
    const m: Record<string, string> = {};
    (data || []).forEach((r: any) => { m[r.cle] = r.valeur; });
    setSettings(m);
    const savedGold = m["couleur_gold"] && isValidHex(m["couleur_gold"]) ? m["couleur_gold"] : DEFAULT_GOLD;
    setGold(savedGold);
    setGoldInput(savedGold);
    setLoading(false);
  }

  function showToast(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 3000);
  }

  async function save(key: string, val: string) {
    if (!supabase) return;
    setSaving(true);
    await supabase.from("app_settings").upsert({ cle: key, valeur: val }, { onConflict: "cle" });
    setSettings((s) => ({ ...s, [key]: val }));
    showToast("Sauvegardé");
    setSaving(false);
  }

  async function applyGold(hex: string) {
    if (!isValidHex(hex)) return;
    setGold(hex);
    setGoldInput(hex);
    applyThemeToDocument(hex); // effet immédiat sur toute l'interface, sans recharger
    await save("couleur_gold", hex);
  }

  const palette = deriveGoldPalette(gold);
  const preview = {
    nom: settings["app_nom"] || "Obsidian Logistique",
    sous: settings["app_sous_nom"] || "Consortium · Opérations · Logistique",
    logo: settings["logo_url"] || "",
  };

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Personnalisation</h1>
          <p className="page-subtitle">Thème, couleurs et identité du site — appliqué instantanément, sans toucher au code</p>
          <div className="gold-line" />
        </div>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-dim)" }}>Chargement…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.5rem", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* ── Couleur du site ── */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: "1rem" }}>🎨 Couleur du site</div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "1rem" }}>
                Une seule couleur suffit — les variantes claires, foncées et translucides sont calculées automatiquement
                et appliquées partout (boutons, liens, bordures, badges) dès que tu cliques.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginBottom: "1rem" }}>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => applyGold(c)}
                    title={c}
                    style={{
                      width: 38, height: 38, borderRadius: "50%", background: c, cursor: "pointer",
                      border: `3px solid ${gold.toLowerCase() === c.toLowerCase() ? "#fff" : "transparent"}`,
                      boxShadow: gold.toLowerCase() === c.toLowerCase() ? `0 0 0 2px ${c}` : "none",
                      transition: "all 0.15s",
                    }}
                  />
                ))}
              </div>

              <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                <input
                  type="color"
                  value={gold}
                  onChange={(e) => applyGold(e.target.value)}
                  style={{ width: 44, height: 38, padding: 0, border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", background: "none" }}
                />
                <input
                  value={goldInput}
                  onChange={(e) => setGoldInput(e.target.value)}
                  onBlur={() => isValidHex(goldInput) && applyGold(goldInput)}
                  onKeyDown={(e) => e.key === "Enter" && isValidHex(goldInput) && applyGold(goldInput)}
                  placeholder="#a78bfa"
                  style={{ flex: 1, fontFamily: "monospace" }}
                />
                {saving && <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>…</span>}
              </div>
            </div>

            {/* ── Identité du site ── */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: "1.25rem" }}>Identité</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {SETTINGS_KEYS.map(({ key, label, placeholder }) => (
                  <div key={key} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      {label}
                    </label>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        value={settings[key] || ""}
                        onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                        placeholder={placeholder}
                        style={{ flex: 1 }}
                      />
                      <button className="btn btn-gold btn-sm" onClick={() => save(key, settings[key] || "")} disabled={saving}>
                        {saving ? "…" : "✓"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Aperçu ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="card" style={{ border: `2px solid ${palette.goldMuted}` }}>
              <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "0.875rem" }}>
                Aperçu en direct
              </div>
              {preview.logo && (
                <div style={{ marginBottom: "0.875rem", display: "flex", justifyContent: "center" }}>
                  <img src={preview.logo} alt="Logo" style={{ maxHeight: 64, maxWidth: 200, objectFit: "contain", borderRadius: "var(--radius)" }} />
                </div>
              )}
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: "1.1rem", fontWeight: 900, color: palette.gold, letterSpacing: "0.08em", marginBottom: "0.2rem" }}>
                {preview.nom}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginBottom: "1rem" }}>{preview.sous}</div>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0b0b12", background: palette.gold, padding: "0.3rem 0.75rem", borderRadius: "var(--radius)" }}>
                  Bouton
                </span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: palette.gold, background: palette.goldMuted, border: `1px solid ${palette.gold}40`, padding: "0.3rem 0.75rem", borderRadius: "var(--radius)" }}>
                  Badge
                </span>
                <span style={{ fontSize: "0.75rem", color: palette.gold, textDecoration: "underline" }}>Lien</span>
              </div>
            </div>

            <div className="card" style={{ background: "var(--surface)" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginBottom: "0.625rem", fontWeight: 600 }}>ℹ️ Note</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                La couleur change instantanément pour toi. Les autres utilisateurs la verront à leur prochain
                chargement de page (rien à redéployer).
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast-container"><div className="toast toast-success">✅ {toast}</div></div>}
    </div>
  );
}
