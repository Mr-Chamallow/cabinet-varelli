"use client";

import { useState } from "react";

interface Article {
  code: string;
  titre: string;
  categorie: string;
  peine_min: string;
  peine_max: string;
  amende: string;
  description: string;
}

const ARTICLES: Article[] = [
  // Crimes
  { code: "C-01", titre: "Meurtre au premier degré", categorie: "Crime", peine_min: "30 ans", peine_max: "Perpétuité", amende: "$50 000", description: "Homicide volontaire avec préméditation." },
  { code: "C-02", titre: "Meurtre au second degré", categorie: "Crime", peine_min: "15 ans", peine_max: "30 ans", amende: "$30 000", description: "Homicide volontaire sans préméditation." },
  { code: "C-03", titre: "Tentative de meurtre", categorie: "Crime", peine_min: "10 ans", peine_max: "20 ans", amende: "$20 000", description: "Acte délibéré visant à ôter la vie sans succès." },
  { code: "C-04", titre: "Braquage de banque", categorie: "Crime", peine_min: "10 ans", peine_max: "25 ans", amende: "$40 000", description: "Vol à main armée dans un établissement bancaire." },
  { code: "C-05", titre: "Trafic de stupéfiants (gros)", categorie: "Crime", peine_min: "15 ans", peine_max: "25 ans", amende: "$35 000", description: "Trafic organisé à grande échelle." },
  { code: "C-06", titre: "Enlèvement / séquestration", categorie: "Crime", peine_min: "10 ans", peine_max: "20 ans", amende: "$25 000", description: "Privation illégale de liberté d'une personne." },
  { code: "C-07", titre: "Terrorisme", categorie: "Crime", peine_min: "20 ans", peine_max: "Perpétuité", amende: "$100 000", description: "Acte visant à déstabiliser l'État ou semer la terreur." },
  { code: "C-08", titre: "Évasion de prison", categorie: "Crime", peine_min: "5 ans", peine_max: "15 ans", amende: "$15 000", description: "Fuite illégale d'un établissement pénitentiaire." },

  // Délits majeurs
  { code: "DM-01", titre: "Vol à main armée", categorie: "Délit majeur", peine_min: "5 ans", peine_max: "10 ans", amende: "$15 000", description: "Vol commis avec usage ou menace d'une arme." },
  { code: "DM-02", titre: "Coups et blessures graves", categorie: "Délit majeur", peine_min: "3 ans", peine_max: "8 ans", amende: "$10 000", description: "Violences ayant causé une ITT supérieure à 30 jours." },
  { code: "DM-03", titre: "Trafic de stupéfiants (mineur)", categorie: "Délit majeur", peine_min: "3 ans", peine_max: "7 ans", amende: "$12 000", description: "Trafic de drogues à petite échelle." },
  { code: "DM-04", titre: "Corruption d'agent public", categorie: "Délit majeur", peine_min: "3 ans", peine_max: "7 ans", amende: "$20 000", description: "Offre ou réception d'avantages indus à un fonctionnaire." },
  { code: "DM-05", titre: "Recel de véhicule volé", categorie: "Délit majeur", peine_min: "2 ans", peine_max: "5 ans", amende: "$8 000", description: "Détention de bien issu d'un vol de véhicule." },
  { code: "DM-06", titre: "Fuite après accident", categorie: "Délit majeur", peine_min: "2 ans", peine_max: "5 ans", amende: "$7 500", description: "Délit de fuite après avoir causé un accident." },
  { code: "DM-07", titre: "Port d'arme illégal", categorie: "Délit majeur", peine_min: "2 ans", peine_max: "6 ans", amende: "$10 000", description: "Port ou détention d'arme sans permis valide." },
  { code: "DM-08", titre: "Résistance armée aux forces de l'ordre", categorie: "Délit majeur", peine_min: "4 ans", peine_max: "8 ans", amende: "$12 000", description: "Opposition violente à une arrestation légale." },

  // Délits mineurs
  { code: "dm-01", titre: "Vol simple", categorie: "Délit mineur", peine_min: "6 mois", peine_max: "2 ans", amende: "$2 000", description: "Soustraction frauduleuse sans violence ni arme." },
  { code: "dm-02", titre: "Conduite en état d'ivresse", categorie: "Délit mineur", peine_min: "3 mois", peine_max: "1 an", amende: "$3 000", description: "Conduite avec un taux d'alcoolémie supérieur au seuil légal." },
  { code: "dm-03", titre: "Outrage à agent", categorie: "Délit mineur", peine_min: "1 mois", peine_max: "6 mois", amende: "$1 500", description: "Insultes ou provocations envers un représentant de l'autorité." },
  { code: "dm-04", titre: "Trouble à l'ordre public", categorie: "Délit mineur", peine_min: "1 mois", peine_max: "3 mois", amende: "$1 000", description: "Comportement perturbant la tranquillité publique." },
  { code: "dm-05", titre: "Possession de stupéfiants", categorie: "Délit mineur", peine_min: "6 mois", peine_max: "18 mois", amende: "$2 500", description: "Détention pour usage personnel de substances illicites." },
  { code: "dm-06", titre: "Dégradation de bien", categorie: "Délit mineur", peine_min: "1 mois", peine_max: "6 mois", amende: "$1 500", description: "Destruction ou dégradation volontaire de bien appartenant à autrui." },
  { code: "dm-07", titre: "Non-présentation à convocation", categorie: "Délit mineur", peine_min: "1 mois", peine_max: "3 mois", amende: "$500", description: "Absence injustifiée à une convocation judiciaire ou policière." },
];

const CATEGORIES = ["Tous", "Crime", "Délit majeur", "Délit mineur"];

const BADGE_CAT: Record<string, string> = {
  Crime: "badge-danger",
  "Délit majeur": "badge-warning",
  "Délit mineur": "badge-info",
};

const DROITS_MIRANDA = [
  "Vous avez le droit de garder le silence.",
  "Tout ce que vous direz pourra être utilisé contre vous devant un tribunal.",
  "Vous avez le droit à un avocat. Si vous n'en avez pas les moyens, un avocat commis d'office vous sera désigné.",
  "Vous pouvez mettre fin à cet interrogatoire à tout moment et demander à consulter votre avocat.",
];

const PRINCIPES = [
  { titre: "Présomption d'innocence", texte: "Toute personne accusée est présumée innocente jusqu'à ce que sa culpabilité ait été légalement établie. La charge de la preuve incombe à l'accusation." },
  { titre: "Non bis in idem", texte: "Nul ne peut être poursuivi ou condamné pénalement deux fois pour les mêmes faits. Une affaire définitivement jugée ne peut être rejugée." },
  { titre: "Légalité des peines", texte: "Nul ne peut être puni pour un fait qui ne constitue pas une infraction au regard de la loi en vigueur au moment où il a été commis." },
  { titre: "Droit à un procès équitable", texte: "Tout accusé a droit à un procès équitable devant un tribunal impartial, dans un délai raisonnable, avec la possibilité de se défendre pleinement." },
  { titre: "Droit au silence", texte: "Tout suspect ou accusé a le droit de ne pas s'auto-incriminer. Le silence ne peut être interprété comme un aveu de culpabilité." },
];

export default function JuridiquePage() {
  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState("Tous");
  const [selected, setSelected] = useState<Article | null>(null);
  const [tab, setTab] = useState<"code" | "miranda" | "principes">("code");

  const filtered = ARTICLES.filter((a) => {
    const matchCat = categorie === "Tous" || a.categorie === categorie;
    const matchSearch =
      a.titre.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">Référentiel juridique</h1>
          <p className="page-subtitle">Code pénal FlashBackFA · Los Santos</p>
          <div className="gold-line" />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", borderBottom: "1px solid var(--border)", paddingBottom: "0" }}>
        {[
          { key: "code", label: "⚖️ Code pénal" },
          { key: "miranda", label: "🔔 Droits Miranda" },
          { key: "principes", label: "📜 Principes fondamentaux" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${tab === t.key ? "var(--gold)" : "transparent"}`,
              color: tab === t.key ? "var(--gold)" : "var(--text-muted)",
              padding: "0.75rem 1.25rem",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.9rem",
              fontWeight: tab === t.key ? 600 : 400,
              transition: "all 0.15s",
              marginBottom: "-1px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Code pénal */}
      {tab === "code" && (
        <>
          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                placeholder="Rechercher un article, une infraction…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: "1rem" }}>×</button>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategorie(c)}
                  className={`btn btn-sm ${categorie === c ? "btn-gold" : "btn-outline"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Stats rapides */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {["Crime", "Délit majeur", "Délit mineur"].map((cat) => {
              const count = ARTICLES.filter(a => a.categorie === cat).length;
              return (
                <span key={cat} className={`badge ${BADGE_CAT[cat]}`} style={{ padding: "0.3rem 0.85rem", fontSize: "0.8rem" }}>
                  {cat} · {count}
                </span>
              );
            })}
            <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--text-dim)" }}>
              {filtered.length} article{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Articles grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {filtered.map((a) => (
              <div
                key={a.code}
                className="card"
                style={{
                  padding: "1rem 1.25rem",
                  cursor: "pointer",
                  borderColor: selected?.code === a.code ? "rgba(212,175,55,0.5)" : undefined,
                  background: selected?.code === a.code ? "var(--card-hover)" : undefined,
                }}
                onClick={() => setSelected(selected?.code === a.code ? null : a)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--gold)", minWidth: 60 }}>
                    {a.code}
                  </span>
                  <span className={`badge ${BADGE_CAT[a.categorie]}`}>{a.categorie}</span>
                  <span style={{ fontWeight: 600, flex: 1 }}>{a.titre}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                    {a.peine_min} – {a.peine_max}
                  </span>
                  <span style={{ color: "var(--text-dim)", fontSize: "0.9rem" }}>
                    {selected?.code === a.code ? "▲" : "▼"}
                  </span>
                </div>

                {/* Détail expandable */}
                {selected?.code === a.code && (
                  <div style={{
                    marginTop: "1rem",
                    paddingTop: "1rem",
                    borderTop: "1px solid var(--border)",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "1rem",
                    animation: "slideUp 0.2s ease",
                  }}>
                    <div>
                      <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "0.3rem" }}>
                        Description
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", gridColumn: "1 / -1" }}>
                        {a.description}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "0.3rem" }}>
                        Peine minimale
                      </div>
                      <div style={{ fontWeight: 600, color: "var(--warning)" }}>{a.peine_min}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "0.3rem" }}>
                        Peine maximale
                      </div>
                      <div style={{ fontWeight: 600, color: "var(--danger)" }}>{a.peine_max}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "0.3rem" }}>
                        Amende
                      </div>
                      <div style={{ fontWeight: 600, color: "var(--gold)" }}>{a.amende}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📜</div>
              <div className="empty-title">Aucun article trouvé</div>
              <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>Modifiez votre recherche ou le filtre de catégorie.</p>
            </div>
          )}
        </>
      )}

      {/* TAB: Miranda */}
      {tab === "miranda" && (
        <div style={{ maxWidth: 700 }}>
          <div style={{
            background: "var(--card)",
            border: "1.5px solid rgba(212,175,55,0.4)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            marginBottom: "2rem",
          }}>
            {/* Header */}
            <div style={{
              background: "var(--surface)",
              borderBottom: "1px solid rgba(212,175,55,0.3)",
              padding: "1.5rem 2rem",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔔</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--gold)" }}>
                Droits Miranda
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
                À lire obligatoirement lors de toute arrestation
              </div>
            </div>

            <div style={{ padding: "1.5rem 2rem" }}>
              {DROITS_MIRANDA.map((droit, i) => (
                <div key={i} style={{
                  display: "flex",
                  gap: "1rem",
                  padding: "1rem 0",
                  borderBottom: i < DROITS_MIRANDA.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "var(--gold-muted)",
                    border: "1px solid rgba(212,175,55,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "var(--gold)",
                    flexShrink: 0,
                    marginTop: "0.1rem",
                  }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: "0.95rem", color: "var(--text)", lineHeight: 1.7 }}>{droit}</p>
                </div>
              ))}
            </div>

            <div style={{
              background: "var(--surface)",
              borderTop: "1px solid var(--border)",
              padding: "1rem 2rem",
              textAlign: "center",
              fontSize: "0.78rem",
              color: "var(--text-dim)",
              fontStyle: "italic",
            }}>
              Tout interrogatoire mené sans lecture préalable des droits Miranda est nul et non avenu.
            </div>
          </div>

          {/* Note défense */}
          <div className="card" style={{ borderColor: "rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.05)" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.3rem" }}>💡</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: "0.5rem", color: "var(--info)" }}>Note pour la défense</div>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  La non-lecture des droits Miranda constitue une violation procédurale grave. Toute déclaration obtenue
                  lors d'une telle arrestation est irrecevable comme preuve. Invoquez systématiquement ce vice de
                  procédure dès le stade de l'audience préliminaire.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Principes */}
      {tab === "principes" && (
        <div style={{ maxWidth: 800 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {PRINCIPES.map((p, i) => (
              <div key={i} className="card">
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "var(--gold-muted)",
                    border: "1px solid rgba(212,175,55,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "var(--gold)",
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 600, color: "var(--gold)", marginBottom: "0.5rem" }}>
                      {p.titre}
                    </div>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.7 }}>{p.texte}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Citation */}
          <div style={{
            marginTop: "2rem",
            textAlign: "center",
            padding: "2rem",
            borderTop: "1px solid var(--border)",
          }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.5rem",
              fontStyle: "italic",
              color: "var(--text-muted)",
              marginBottom: "0.75rem",
            }}>
              « Seul Dieu peut juger »
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", letterSpacing: "0.1em" }}>
              CABINET VARELLI · LOS SANTOS
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
