"use client";

import { useState, useMemo } from "react";
import { CODE_COMPLET as ARTICLES, CATEGORIES_INFRACTIONS } from "@/lib/code-penal";

// ─── ONGLETS DYNAMIQUES, regroupés par section (Pénal / Route / Fédéral) ──────
const SECTION_LABELS: Record<string, string> = {
  penal: "⚖️ Code pénal",
  route: "🚦 Code de la route",
  federal: "🦅 Code fédéral",
};

function sectionOf(key: string): string {
  if (key.startsWith("route")) return "route";
  if (key === "federal") return "federal";
  return "penal";
}

const ONGLETS: { key: string; label: string; icon: string; color: string }[] =
  Object.entries(CATEGORIES_INFRACTIONS).map(([key, v]) => ({
    key,
    label: v.label,
    icon: v.icon,
    color: v.color,
  }));

const ONGLETS_PAR_SECTION: Record<string, typeof ONGLETS> = {};
for (const o of ONGLETS) {
  const s = sectionOf(o.key);
  (ONGLETS_PAR_SECTION[s] ??= []).push(o);
}

// ─── ONGLETS DE RÉFÉRENCE (données statiques, hors ARTICLES) ─────────────────
const REF_ONGLETS = [
  { key: "ref_armes", label: "🔫 Armes", icon: "⚔️", color: "#ef4444" },
  { key: "ref_drogues", label: "💊 Drogues", icon: "💊", color: "#7c3aed" },
  { key: "ref_poisson", label: "🐟 Pêche", icon: "🐟", color: "#0ea5e9" },
  { key: "ref_animaux", label: "🐾 Animaux", icon: "🐾", color: "#22c55e" },
];


const REF_ARMES = {
  legales: ["Batte de baseball", "Club de golf", "Clé anglaise", "Couteau", "Matraque", "Haltère"],
  dm: ["Pistolet", "Pistolet Cal.50", "Pistolet Mk II", "Pistolet de combat", "Revolver", "Pistolet flare"],
  dmj: ["Fusil d'assaut", "Fusil d'assaut Mk II", "Carabine de combat", "Fusil à pompe", "Fusil de sniper", "Mitraillette", "Mitraillette Mk II", "Micro SMG", "LMG", "Machine pistol", "Fusil de chasse"],
  crime: ["Grenade", "Cocktail Molotov", "Lance-roquettes", "Bombe sticky", "C4", "Lance-grenade", "Minigun", "Lance-flammes", "ADP"],
};
const REF_DROGUES = {
  douces: ["Cannabis", "Weed Purple", "Salvia", "Spore X", "Oyster Mushroom", "Amanita", "Psilocybe", "Datura"],
  dures: ["Héroïne", "Cocaïne", "Crack", "Méthamphétamine", "Opium", "Ecstasy", "Tranq", "Mexicana", "Lean", "Purple Haze", "Blacktrip", "B-Magic", "H-47"],
  prec: ["Pseudoéphédrine", "Phosphore rouge", "Ammoniaque", "Lithium", "Éther", "Xylazine"],
};
const REF_POISSON = {
  legaux: ["Anguille", "Esturgeon", "Bar", "Brochet", "Carpe", "Maquereau", "Thon", "Saumon", "Dorade", "Mérou"],
  ill: ["Dauphin", "Piranha", "Requin", "Tortue de mer", "Espadon hors saison"],
};
const REF_ANIMAUX = {
  prot: ["Puma de montagne", "Ours noir", "Biche", "Vautour fauve", "Renard", "Hibou", "Faucon pèlerin", "Aigle royal"],
  chasse: ["Lapin", "Cerf", "Sanglier", "Coyote", "Raton laveur", "Lièvre"],
};

const SUB_FILTERS: Record<string, { key: string; label: string; icon: string }[]> = {
  penal_delit_mineur: [
    { key: "", label: "Tous", icon: "📋" },
    { key: "armes", label: "Armes", icon: "🔫" },
    { key: "drogues", label: "Drogues", icon: "💊" },
    { key: "poisson", label: "Pêche", icon: "🐟" },
    { key: "animaux", label: "Animaux", icon: "🐾" },
  ],
  penal_delit_majeur: [
    { key: "", label: "Tous", icon: "📋" },
    { key: "armes", label: "Armes", icon: "🔫" },
    { key: "drogues", label: "Drogues", icon: "💊" },
  ],
};

const SUB_KEYWORDS: Record<string, string[]> = {
  armes: ["arme", "pistolet", "fusil", "revolver", "smg", "carabine", "munition", "grenade", "bombe", "gilet", "kevlar", "holster", "machette", "hache", "couteau", "dague"],
  drogues: ["drogue", "cannabis", "cocaïne", "heroïne", "meth", "crack", "opium", "ecstasy", "tranq", "salvia", "psilocybe", "amanita", "datura"],
  poisson: ["poisson", "pêche", "requin", "dauphin", "piranha", "tortue", "espadon"],
  animaux: ["animal", "chasse", "gibier", "faune"],
};

function matchesSubFilter(article: any, sub: string) {
  if (!sub) return true;
  const kws = SUB_KEYWORDS[sub] || [];
  const haystack = (article.titre + " " + article.contenu).toLowerCase();
  return kws.some((k) => haystack.includes(k));
}

export default function JuridiqueePage() {
  const [activeTab, setActiveTab] = useState<string>(ONGLETS[0]?.key || "penal_contravention");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [subFilter, setSubFilter] = useState<string>("");

  const isSearching = search.trim().length > 0;
  const isRefTab = activeTab.startsWith("ref_");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (isSearching) {
      return ARTICLES.filter(
        (a) =>
          a.titre.toLowerCase().includes(q) ||
          String(a.contenu || "").toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q)
      );
    }
    if (isRefTab) return [];
    return ARTICLES.filter((a) => {
      if (String(a.categorieId) !== activeTab) return false;
      if (!matchesSubFilter(a, subFilter)) return false;
      return true;
    });
  }, [activeTab, search, isSearching, subFilter, isRefTab]);

  const catColors: Record<string, string> = Object.fromEntries(
    Object.entries(CATEGORIES_INFRACTIONS).map(([k, v]) => [k, v.color])
  );

  const renderRefList = () => {
    let data: Record<string, string[]> = {};
    let labels: Record<string, string> = {};
    if (activeTab === "ref_armes") {
      data = REF_ARMES;
      labels = { legales: "Armes légales", dm: "Délit mineur", dmj: "Délit majeur", crime: "Crime" };
    } else if (activeTab === "ref_drogues") {
      data = REF_DROGUES;
      labels = { douces: "Drogues douces", dures: "Drogues dures", prec: "Précurseurs" };
    } else if (activeTab === "ref_poisson") {
      data = REF_POISSON;
      labels = { legaux: "Espèces légales", ill: "Espèces illégales" };
    } else if (activeTab === "ref_animaux") {
      data = REF_ANIMAUX;
      labels = { prot: "Espèces protégées", chasse: "Gibier autorisé" };
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {Object.entries(data).map(([key, items]) => (
          <div key={key} className="card" style={{ padding: "1rem 1.25rem" }}>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", marginBottom: "0.6rem" }}>
              {labels[key] || key}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {items.map((item) => (
                <span
                  key={item}
                  style={{
                    fontSize: "0.8rem",
                    padding: "0.3rem 0.7rem",
                    borderRadius: 999,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">⚖️ Base juridique</h1>
          <p className="page-subtitle">
            Codes de l'État de San Andreas · FlashBackFA · {ARTICLES.length} articles au total
          </p>
          <div className="gold-line" />
        </div>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <div className="search-bar" style={{ padding: "0 1rem" }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher dans tous les codes (Pénal, Route, Fédéral)…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setExpanded(null); }}
            style={{ fontSize: "0.875rem" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1rem", flexShrink: 0 }}>×</button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem", opacity: isSearching ? 0.4 : 1, transition: "opacity var(--t-fast) var(--ease)", pointerEvents: isSearching ? "none" : "auto" }}>
        {(["penal", "route", "federal"] as const).map((sectionKey) => (
          <div key={sectionKey} style={{ marginBottom: "0.875rem" }}>
            <div style={{
              fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
              color: "var(--text-dim)", marginBottom: "0.45rem",
            }}>
              {SECTION_LABELS[sectionKey]}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {(ONGLETS_PAR_SECTION[sectionKey] || []).map((o) => (
                <button
                  key={o.key}
                  onClick={() => { setActiveTab(o.key); setSearch(""); setExpanded(null); setSubFilter(""); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    padding: "0.5rem 1rem",
                    borderRadius: 8,
                    border: `1px solid ${activeTab === o.key ? o.color + "60" : "var(--border)"}`,
                    background: activeTab === o.key ? o.color + "18" : "var(--surface)",
                    color: activeTab === o.key ? o.color : "var(--text-muted)",
                    cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.82rem",
                    fontWeight: activeTab === o.key ? 600 : 400,
                    transition: "all var(--t-fast) var(--ease)",
                  }}
                >
                  <span>{o.icon}</span>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ marginTop: "1.125rem", paddingTop: "0.875rem", borderTop: "1px solid var(--border)" }}>
          <div style={{
            fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
            color: "var(--text-dim)", marginBottom: "0.45rem",
          }}>
            📚 Références rapides
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {REF_ONGLETS.map((o) => (
              <button
                key={o.key}
                onClick={() => { setActiveTab(o.key); setSearch(""); setExpanded(null); setSubFilter(""); }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.5rem 1rem",
                  borderRadius: 8,
                  border: `1px solid ${activeTab === o.key ? o.color + "60" : "var(--border)"}`,
                  background: activeTab === o.key ? o.color + "18" : "var(--surface)",
                  color: activeTab === o.key ? o.color : "var(--text-muted)",
                  cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.82rem",
                  fontWeight: activeTab === o.key ? 600 : 400,
                  transition: "all var(--t-fast) var(--ease)",
                }}
              >
                <span>{o.icon}</span>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {SUB_FILTERS[activeTab] && !isSearching && (
        <div style={{ display: "flex", gap: "0.35rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          {SUB_FILTERS[activeTab].map((sf) => (
            <button key={sf.key || "all"} onClick={() => setSubFilter(sf.key)} style={{
              padding: "0.25rem 0.75rem", borderRadius: 999, cursor: "pointer",
              fontFamily: "'Inter',sans-serif", fontSize: "0.75rem",
              fontWeight: subFilter === sf.key ? 700 : 400,
              background: subFilter === sf.key ? "var(--gold-muted)" : "var(--surface)",
              border: `1px solid ${subFilter === sf.key ? "rgba(var(--gold-rgb), 0.4)" : "var(--border)"}`,
              color: subFilter === sf.key ? "var(--gold)" : "var(--text-muted)",
              display: "flex", alignItems: "center", gap: "0.3rem",
            }}>
              <span>{sf.icon}</span>{sf.label}
            </button>
          ))}
        </div>
      )}

      {!isRefTab && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
            {isSearching ? (
              <>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""} dans <strong style={{ color: "var(--gold)" }}>tous les codes</strong> pour « {search} »</>
            ) : (
              <>{filtered.length} article{filtered.length !== 1 ? "s" : ""}</>
            )}
          </span>
          {search && (
            <button className="btn btn-ghost btn-sm" onClick={() => setSearch("")}>Effacer</button>
          )}
        </div>
      )}

      {isRefTab && !isSearching ? (
        renderRefList()
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.length === 0 && (
            <div className="card" style={{ textAlign: "center", color: "var(--text-dim)", padding: "3rem" }}>
              Aucun article trouvé
            </div>
          )}
          {filtered.map((article) => {
            const isOpen = expanded === article.id;
            const color = catColors[article.categorieId] || "#94a3b8";
            return (
              <div
                key={article.id}
                style={{
                  background: "var(--card)",
                  border: `1px solid ${isOpen ? color + "45" : "var(--border)"}`,
                  borderLeft: `3px solid ${isOpen ? color : color + "50"}`,
                  borderRadius: "var(--radius)",
                  overflow: "hidden",
                  transition: "border-color 0.15s",
                }}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : article.id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "1rem 1.25rem",
                    background: "transparent",
                    border: "none", cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                    color: "var(--text)",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flex: 1, minWidth: 0 }}>
                    <span style={{
                      flexShrink: 0,
                      fontSize: "0.7rem",
                      fontFamily: "'Cinzel', serif",
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      color,
                      background: color + "15",
                      padding: "0.2rem 0.55rem",
                      borderRadius: 4,
                      border: `1px solid ${color}30`,
                    }}>{article.id}</span>
                    <span style={{ fontWeight: 500, fontSize: "0.9rem", flex: 1, color: isOpen ? color : "var(--text)" }}>{article.titre}</span>
                    {isSearching && (
                      <span style={{
                        flexShrink: 0, fontSize: "0.65rem", fontWeight: 600,
                        color, background: color + "12", border: `1px solid ${color}28`,
                        padding: "0.15rem 0.5rem", borderRadius: 999,
                      }}>
                        {CATEGORIES_INFRACTIONS[article.categorieId]?.icon} {CATEGORIES_INFRACTIONS[article.categorieId]?.label || article.categorieId}
                      </span>
                    )}
                    {article.amende && (
                      <span style={{ flexShrink: 0, fontSize: "0.78rem", color: "var(--gold)", fontWeight: 600, fontFamily: "monospace" }}>
                        {article.amende}
                      </span>
                    )}
                  </div>
                  <span style={{
                    marginLeft: "0.75rem", flexShrink: 0, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "50%", color: isOpen ? color : "var(--text-dim)", background: isOpen ? color + "15" : "transparent",
                    transform: isOpen ? "rotate(90deg)" : "none", transition: "all 0.15s",
                  }}>›</span>
                </button>

                {isOpen && (
                  <div style={{ padding: "0 1.375rem 1.375rem 1.375rem" }}>
                    <div style={{ height: 1, background: `linear-gradient(90deg, ${color}40, transparent)`, marginBottom: "1.125rem" }} />

                    <p style={{
                      fontSize: "0.92rem", color: "var(--text-muted)", lineHeight: 1.8,
                      marginBottom: "1.125rem", fontFamily: "'Georgia', 'Playfair Display', serif",
                    }}>
                      {article.contenu}
                    </p>

                    {(article.amende || article.detention) && (
                      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        {article.amende && (
                          <div style={{
                            background: "rgba(var(--gold-rgb), 0.08)",
                            border: "1px solid rgba(var(--gold-rgb), 0.25)",
                            borderRadius: 8, padding: "0.5rem 0.875rem",
                          }}>
                            <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "0.15rem" }}>Amende</div>
                            <div style={{ fontWeight: 700, color: "var(--gold)", fontSize: "0.9rem" }}>{article.amende}</div>
                          </div>
                        )}
                        {article.detention && (
                          <div style={{
                            background: "rgba(239,68,68,0.07)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: 8, padding: "0.5rem 0.875rem",
                          }}>
                            <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "0.15rem" }}>Détention</div>
                            <div style={{ fontWeight: 700, color: "#ef4444", fontSize: "0.9rem" }}>{article.detention}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
