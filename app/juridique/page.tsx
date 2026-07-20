"use client";

import { useState, useMemo } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
import { CHEFS_PENAL as ARTICLES } from "@/lib/code-penal";

const ONGLETS: { key: string; label: string; icon: string; color: string }[] = [
  { key: "constitution",          label: "Constitution",        icon: "🏛️", color: "#D4AF37" },
  { key: "penal_contravention",   label: "Contraventions",      icon: "📋", color: "#64748b" },
  { key: "penal_delit_mineur",    label: "Délits mineurs",      icon: "⚠️", color: "#f59e0b" },
  { key: "penal_delit_majeur",    label: "Délits majeurs",      icon: "🔴", color: "#ef4444" },
  { key: "penal_crime",           label: "Crimes",              icon: "💀", color: "#7c3aed" },
  { key: "procedure",             label: "Procédure pénale",    icon: "⚖️", color: "#3b82f6" },
  { key: "travail",               label: "Code du travail",     icon: "💼", color: "#84cc16" },
  { key: "commerce",              label: "Code du commerce",    icon: "🏪", color: "#f97316" },
  { key: "federal",               label: "Code fédéral",        icon: "🦅", color: "#06b6d4" },
  { key: "miranda",               label: "Droits Miranda",      icon: "🛡️", color: "#10b981" },
  { key: "ref_armes",  label: "🔫 Armes",   icon: "⚔️", color: "#ef4444" },
  { key: "ref_drogues",label: "💊 Drogues", icon: "💊", color: "#7c3aed" },
  { key: "ref_poisson",label: "🐟 Pêche",   icon: "🐟", color: "#0ea5e9" },
  { key: "ref_animaux",label: "🐾 Animaux", icon: "🐾", color: "#22c55e" },
];

const REF_ARMES={legales:["Batte de baseball","Club de golf","Clé anglaise","Couteau","Matraque","Haltère"],dm:["Pistolet","Pistolet Cal.50","Pistolet Mk II","Pistolet de combat","Revolver","Pistolet flare"],dmj:["Fusil d'assaut","Fusil d'assaut Mk II","Carabine de combat","Fusil à pompe","Fusil de sniper","Mitraillette","Mitraillette Mk II","Micro SMG","LMG","Machine pistol","Fusil de chasse"],crime:["Grenade","Cocktail Molotov","Lance-roquettes","Bombe sticky","C4","Lance-grenade","Minigun","Lance-flammes","ADP"]};
const REF_DROGUES={douces:["Cannabis","Weed Purple","Salvia","Spore X","Oyster Mushroom","Amanita","Psilocybe","Datura"],dures:["Héroïne","Cocaïne","Crack","Méthamphétamine","Opium","Ecstasy","Tranq","Mexicana","Lean","Purple Haze","Blacktrip","B-Magic","H-47"],prec:["Pseudoéphédrine","Phosphore rouge","Ammoniaque","Lithium","Éther","Xylazine"]};
const REF_POISSON={legaux:["Anguille","Esturgeon","Bar","Brochet","Carpe","Maquereau","Thon","Saumon","Dorade","Mérou"],ill:["Dauphin","Piranha","Requin","Tortue de mer","Espadon hors saison"]};
const REF_ANIMAUX={prot:["Puma de montagne","Ours noir","Biche","Vautour fauve","Renard","Hibou","Faucon pèlerin","Aigle royal"],chasse:["Lapin","Cerf","Sanglier","Coyote","Raton laveur","Lièvre"]};

export default function JuridiqueePage() {
  const [activeTab, setActiveTab] = useState<string>("constitution");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [subFilter, setSubFilter] = useState<string>("");

  const isSearching = search.trim().length > 0;

  // Sub-category filters only shown on penal_delit_mineur and penal_delit_majeur
  const SUB_FILTERS: Record<string, {key:string;label:string;icon:string}[]> = {
    penal_delit_mineur: [
      { key:"",        label:"Tous",    icon:"📋" },
      { key:"armes",   label:"Armes",   icon:"🔫" },
      { key:"drogues", label:"Drogues", icon:"💊" },
      { key:"poisson", label:"Pêche",   icon:"🐟" },
      { key:"animaux", label:"Animaux", icon:"🐾" },
    ],
    penal_delit_majeur: [
      { key:"",        label:"Tous",    icon:"📋" },
      { key:"armes",   label:"Armes",   icon:"🔫" },
      { key:"drogues", label:"Drogues", icon:"💊" },
    ],
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (isSearching) {
      // Mode recherche globale : on cherche dans TOUTES les catégories
      return ARTICLES.filter(a =>
        a.titre.toLowerCase().includes(q) ||
        a.contenu.toLowerCase().includes(q) ||
        (a.tags || []).some(t => t.includes(q)) ||
        a.id.toLowerCase().includes(q)
      );
    }
    return ARTICLES.filter(a => {
      if (a.categorie !== activeTab) return false;
      if (subFilter && !(a.tags || []).includes(subFilter)) return false;
      return true;
    });
  }, [activeTab, subFilter, search, isSearching]);

const catColors: Record<string, string> = {
  constitution: "#D4AF37",
  penal_contravention: "#64748b",
  penal_delit_mineur: "#f59e0b",
  penal_delit_majeur: "#ef4444",
  penal_crime: "#7c3aed",
  procedure: "#3b82f6",
  civil: "#06b6d4",
  travail: "#84cc16",
  commerce: "#f97316",
  federal: "#06b6d4",
  miranda: "#10b981",
};

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Base juridique</h1>
          <p className="page-subtitle">Codes de l'État de San Andreas · FlashBackFA</p>
          <div className="gold-line" />
        </div>
      </div>

      {/* Barre de recherche globale — prioritaire, cherche dans TOUS les codes */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div className="search-bar" style={{ padding: "0 1rem" }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher dans tous les codes (Constitution, Pénal, Travail, Commerce, Fédéral, Miranda)…"
            value={search}
            onChange={e => { setSearch(e.target.value); setExpanded(null); }}
            style={{ fontSize: "0.875rem" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1rem", flexShrink: 0 }}>×</button>
          )}
        </div>
      </div>

      {/* Onglets — désactivés visuellement pendant une recherche globale */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem", opacity: isSearching ? 0.4 : 1, transition: "opacity var(--t-fast) var(--ease)", pointerEvents: isSearching ? "none" : "auto" }}>
        {ONGLETS.map(o => (
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

      {/* Sous-filtres par catégorie (Armes / Drogues / Pêche / Animaux) */}
      {SUB_FILTERS[activeTab] && !isSearching && (
        <div style={{ display:"flex", gap:"0.35rem", marginBottom:"0.75rem", flexWrap:"wrap" }}>
          {SUB_FILTERS[activeTab].map(sf => (
            <button key={sf.key||"all"} onClick={()=>setSubFilter(sf.key)} style={{
              padding:"0.25rem 0.75rem", borderRadius:999, cursor:"pointer",
              fontFamily:"'Inter',sans-serif", fontSize:"0.75rem",
              fontWeight: subFilter===sf.key ? 700 : 400,
              background: subFilter===sf.key ? "var(--gold-muted)" : "var(--surface)",
              border: `1px solid ${subFilter===sf.key ? "rgba(201,168,76,0.4)" : "var(--border)"}`,
              color: subFilter===sf.key ? "var(--gold)" : "var(--text-muted)",
              display:"flex", alignItems:"center", gap:"0.3rem",
            }}>
              <span>{sf.icon}</span>{sf.label}
            </button>
          ))}
        </div>
      )}

      {/* Compteur */}
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

      {/* Articles */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filtered.length === 0 && (
          <div className="card" style={{ textAlign: "center", color: "var(--text-dim)", padding: "3rem" }}>
            Aucun article trouvé
          </div>
        )}
        {filtered.map(article => {
          const isOpen = expanded === article.id;
          const color = catColors[article.categorie];
          return (
            <div
              key={article.id}
              style={{
                background: "var(--card)",
                border: `1px solid ${isOpen ? color + "40" : "var(--border)"}`,
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
                    letterSpacing: "0.05em",
                    color,
                    background: color + "15",
                    padding: "0.2rem 0.55rem",
                    borderRadius: 4,
                    border: `1px solid ${color}30`,
                  }}>{article.id}</span>
                  <span style={{ fontWeight: 500, fontSize: "0.875rem", flex: 1 }}>{article.titre}</span>
                  {isSearching && (
                    <span style={{
                      flexShrink: 0, fontSize: "0.65rem", fontWeight: 600,
                      color, background: color + "12", border: `1px solid ${color}28`,
                      padding: "0.15rem 0.5rem", borderRadius: 999,
                    }}>
                      {ONGLETS.find(o => o.key === article.categorie)?.icon} {ONGLETS.find(o => o.key === article.categorie)?.label || article.categorie}
                    </span>
                  )}
                  {article.amende && (
                    <span style={{ flexShrink: 0, fontSize: "0.78rem", color: "var(--gold)", fontWeight: 600 }}>
                      {article.amende}
                    </span>
                  )}
                </div>
                <span style={{ marginLeft: "0.75rem", color: "var(--text-dim)", transform: isOpen ? "rotate(90deg)" : "none", transition: "0.15s" }}>›</span>
              </button>

              {isOpen && (
                <div style={{ padding: "0 1.25rem 1.25rem 1.25rem" }}>
                  <div style={{ height: 1, background: "var(--border)", marginBottom: "1rem" }} />

                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.65, marginBottom: "1rem" }}>
                    {article.contenu}
                  </p>

                  {(article.amende || article.detention) && (
                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      {article.amende && (
                        <div style={{
                          background: "rgba(212,175,55,0.08)",
                          border: "1px solid rgba(212,175,55,0.25)",
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

                  {article.tags && article.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.875rem" }}>
                      {article.tags.map(t => (
                        <button
                          key={t}
                          onClick={() => setSearch(t)}
                          style={{
                            fontSize: "0.7rem", padding: "0.2rem 0.55rem",
                            borderRadius: 999, background: "var(--surface)",
                            border: "1px solid var(--border)",
                            color: "var(--text-dim)", cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >#{t}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
