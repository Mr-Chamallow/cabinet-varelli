"use client";

import { useState } from "react";

// ─── DONNÉES ────────────────────────────────────────────────────────────────

const VEHICULES = {
  compacts: ["Asbo", "Blista", "Brioso", "Brioso 300", "Brioso 300 large", "Club", "Issi", "Issi Classic", "Kanjo", "Panto", "Rhapsody", "Weevil"],
  scooters: ["Faggio", "Faggio Sport", "Faggio Mod"],
};

const PROCEDURES = [
  {
    key: "faute", badge: "Disciplinaire", title: "Faute professionnelle", color: "#ef4444",
    desc: "Manquement d'un agent aux règles et aux devoirs. Comportement inapproprié, négligence ou oubli avantageant l'individu.",
    items: [
      "Non-arrestation d'un individu ayant un mandat d'arrêt",
      "Non-palpation d'une personne avant de la mettre dans le véhicule",
      "Lecture des Droits Miranda sur un individu masqué",
      "Non-saisie de la totalité des objets illégaux",
      "Comportement inadapté",
      "Lorsque l'agent ne peut expliquer les chefs d'inculpation",
      "Oubli de la fouille du véhicule",
      "Oubli d'un chef d'inculpation (à partir d'un délit mineur et contravention sur les possessions)",
      "Mensonge (hors procédure) ou insubordination",
    ],
  },
  {
    key: "procedure", badge: "Procédure", title: "Vice de procédure", color: "#eab308",
    desc: "Lorsqu'un agent ne respecte pas les étapes d'une arrestation, impactant les droits du citoyen ou invalidant une mesure prise contre une personne.",
    items: [
      "Arrestation abusive (palpation, coffre ou individu fouillé sans raison)",
      "Palpation/fouille d'un individu du sexe opposé sans son accord explicite et avant la lecture des droits Miranda (fouille)",
      "Droits Miranda dépassés (15 min, identité mal citée, formulation incorrecte, absence de confirmation)",
      "Oubli de l'un des trois droits fondamentaux (soins, avocat, nourriture) avant la fin de la procédure",
      "Oubli d'appel au Procureur/Juge/CS lorsque cela est nécessaire (ne pas dépasser 20 minutes sur un seul chef d'inculpation)",
      "Non-respect d'une consigne donnée par un membre de la justice",
      "Faire payer une amende alors que la procédure est en attente de jugement ou absence de procureur/juge",
      "3 vices de forme = 1 vice de procédure",
      "Bavure policière",
      "Parjure avéré (mentir sous serment)",
      "Inculpation à tort d'un individu lors de l'arrestation initiale, entraînant un abandon des charges",
    ],
    bracelet: [
      "Non-création du dossier",
      "Rapport incomplet entraînant un abandon des charges",
    ],
    note: "Une procédure est considérée comme terminée lorsque l'amende est appliquée.",
  },
  {
    key: "forme", badge: "Administratif", title: "Vice de forme", color: "#3b82f6",
    desc: "Erreur visuelle ou administrative figurant sur un casier ou rapport d'arrestation.",
    items: [
      "Identité mal orthographiée du prévenu ou informations erronées (nom, prénom, numéro, ID, matricule...)",
      "Identité des avocats, procureurs/juges ou CS non mentionnée ou mal orthographiée dans la fiche de calcul (\"Non présent\" s'ils sont absents)",
      "Oubli de cocher des cases (hors chefs d'inculpation)",
      "Photo/carte d'identité non conforme : accessoires, masques, lunettes, bijoux...",
    ],
  },
];

const ARMEMENT = [
  { section: "Corps Exécutif", grades: [
    { nom: "Rookie", color: "#a78bfa", items: ["Pistolet de combat + Lampe"] },
    { nom: "Officier Probatoire", color: "#22d3ee", items: ["Pistolet de combat + Lampe"] },
    { nom: "Officier I", color: "#3b82f6", items: ["Pistolet de combat + Lampe"] },
    { nom: "Officier II", color: "#3b82f6", items: ["Pistolet de combat + Lampe"] },
    { nom: "Officier III", color: "#3b82f6", items: ["Pistolet de combat + Lampe", "Bombe lacrymogène"] },
    { nom: "Senior Lead Officer", color: "#60a5fa", items: ["Pistolet de combat + Lampe", "Bean-Bag", "Bombe lacrymogène"] },
  ]},
  { section: "Supervision", grades: [
    { nom: "Sergeant I", color: "#22c55e", items: ["Pistolet en céramique", "Bean-Bag", "Bombe lacrymogène"] },
    { nom: "Sergeant II", color: "#22c55e", items: ["MP5", "Pistolet en céramique", "Bean-Bag", "Bombe lacrymogène"] },
  ]},
  { section: "Command Staff", grades: [
    { nom: "Lieutenant", color: "#ef4444", items: ["M4A1", "Remington", "Pistolet en céramique", "Bean-Bag", "Bombe lacrymogène"] },
    { nom: "Lieutenant-Chef", color: "#ef4444", items: ["Fusil bullbump", "Toutes les autres accréditations"] },
  ]},
  { section: "Capitanat / Direction", grades: [
    { nom: "Capitaine", color: "#a78bfa", items: ["Fusil lourd", "Toutes les autres accréditations"] },
    { nom: "Commandant", color: "#ef4444", items: ["Toutes les accréditations"] },
    { nom: "Chief of Police", color: "#ef4444", items: ["Toutes les accréditations"] },
  ]},
];

const VEHICULE_X_GRADE = [
  { grade: "Rookie / Officier Probatoire", vehicules: "Stanier" },
  { grade: "Officier I", vehicules: "Stanier / Scout / Torrence" },
  { grade: "Officier II", vehicules: "Stanier / Scout / Torrence / Buffalo STX / Alamo" },
  { grade: "Officier III", vehicules: "Stanier / Scout / Torrence / Buffalo STX / Alamo / Buffalo S" },
  { grade: "Sergent et +", vehicules: "Gauntlet + All Véhicules" },
];

const EQUIPEMENT_COMMUN = ["PIE (Tazer)", "Radio", "Menottes", "Matraque", "Lampe Torche", "Test de poudre x5", "Ethylotest x5", "Munitions correspondant à l'armement"];

const SPECIALISATIONS_COLS = ["P.P.A", "Procédure", "Radio", "Premiers soins", "10.20", "Fusillade", "A.S.D", "Mary", "Chef d'opération théorique", "Chef d'opération pratique", "Négociateur"];
const SPECIALISATIONS_DIVISIONS = ["Primaires", "Secondaires"];
const SPECIALISATIONS_ROWS: { grade: string; formations: boolean[]; divisions: boolean[] }[] = [
  { grade: "Rookie", formations: [true, true, true, true, false, false, false, false, false, false, false], divisions: [false, false] },
  { grade: "Officier I", formations: [true, true, true, true, true, true, false, false, false, false, false], divisions: [false, true] },
  { grade: "Officier II", formations: [true, true, true, true, true, true, true, true, true, true, true], divisions: [false, true] },
  { grade: "Officier III et +", formations: [true, true, true, true, true, true, true, true, true, true, true], divisions: [true, true] },
];

const NOOSE_CRITERES = [
  { icon: "🔫", title: "Présence d'une arme lourde", desc: "Si un ou plusieurs individus sont en possession d'une arme lourde (voir la liste ci-jointe)." },
  { icon: "💣", title: "Présence d'un engin explosif", desc: "Toute situation impliquant une bombe ou un engin explosif." },
  { icon: "👥", title: "Prise d'otages de représentants de l'État", desc: "Lorsqu'au moins 3 représentants de l'État sont retenus en otage." },
];

const ARMES = {
  automatique: ["Mitraillette légère", "Pistolet mitrailleur", "Phantom-10", "MX Tactic", "Vesper 9", "Pistolet Automatique", "Tactical SMG", "Mitraillette Mk II", "Vortex"],
  lourde: [
    "PDW de combat", "Mitraillette", "Mitraillette d'assaut", "Sulfateuse Gusenberg", "Carabine", "Carabine Mk II",
    "Carabine spéciale", "Carabine spéciale Mk II", "Fusil amélioré", "Fusil compact", "Fusil d'assaut", "Fusil d'assaut Bullpup",
    "Fusil d'assaut Bullpup Mk II", "Fusil d'assaut Mk II", "Fusil militaire", "SMG-45", "SBR-52",
    "Fusil Tactique", "Fusil Lourd", "Fusil à pompe lourd", "Fusil à pompe", "Fusil à pompe Mk II", "Fusil à pompe d'assaut",
    "Fusil à pompe de combat", "Fusil à canon scié", "Fusil à double canon", "Spas 12", "AR7", "Mk pris",
    "Fusils à Pompe Bullpup", "Fusils Bartle Rifle",
  ],
};

const FREQUENCES = {
  districts: [
    { hz: "1–9 Hz", label: "Radio Commune" }, { hz: "10 Hz", label: "Mission Row" }, { hz: "11–19 Hz", label: "Privé Mission Row" },
    { hz: "20 Hz", label: "Vespucci" }, { hz: "21–29 Hz", label: "Privé Vespucci" }, { hz: "30 Hz", label: "Alta" },
    { hz: "31–39 Hz", label: "Privé Alta" }, { hz: "40 Hz", label: "Sandy Shores" }, { hz: "41–49 Hz", label: "Privé Sandy Shores" },
    { hz: "50 Hz", label: "RoxWood" }, { hz: "51–59 Hz", label: "Privé RoxWood" },
  ],
  divisions: [
    { hz: "60 Hz", label: "F.T.O" }, { hz: "61-63 Hz", label: "Libre" }, { hz: "64 Hz", label: "L.S" },
    { hz: "65 Hz", label: "N.O.O.S.E" }, { hz: "66 Hz", label: "D.O.A" }, { hz: "67 Hz", label: "W.H.S.P" },
    { hz: "68-70 Hz", label: "N.O.O.S.E x DOA" },
  ],
  samp: [
    { hz: "71–75 Hz", label: "SAMP × EMS × LS Army × LSFD" }, { hz: "76–79 Hz", label: "SAMP × EMS × LS Army × LSFD × Gouvernement" },
    { hz: "80 Hz", label: "Code Rouge" }, { hz: "100–110 Hz", label: "LS Army" }, { hz: "132 Hz", label: "Milicia de Cayo" },
  ],
};

const CODES_RADIO = {
  patrouille: [
    ["10-06", "Occupé"], ["10-07", "Hors service (MAX 30 min)"], ["10-08", "Prise de service"], ["10-10", "Fin de service"],
    ["10-12", "En attente de dispatch"], ["10-15", "En route avec suspect"], ["10-19", "En route vers"], ["10-41", "Prise de patrouille"],
    ["10-42", "Fin de patrouille"], ["10-50", "Accident"], ["10-56", "Refus d'obtempérer"], ["10-57", "Délit de fuite"],
    ["10-70", "Refus d'obtempérer à pied"],
  ],
  communication: [
    ["10-00", "Changement de fréquence"], ["10-03", "Silence radio"], ["10-04", "Reçu"], ["10-05", "Négatif"],
    ["10-09", "Répéter transmission"], ["10-20", "Demande de localisation"], ["10-22", "Annuler transmission"], ["10-23", "Standby / Attente"],
    ["10-25", "Rapport de situation"], ["10-26", "Demande changement de juridiction"], ["10-35", "Demande de renfort"],
  ],
  interventions: [
    ["10-31", "Tirs d'armes à feu"], ["10-37", "Cambriolage en cours"], ["10-39", "Braquage de supérette / LTD"],
    ["10-40", "Braquage d'armurerie"], ["10-48", "Contrôle routier"], ["10-58", "Braquage d'ATM"], ["10-60", "Vente de drogue"],
    ["10-90", "Braquage bijouterie"], ["10-91", "Braquage de banque"],
  ],
  autres: [
    { code: "CODE 3", label: "Agent en détresse / Pris en otage", color: "#eab308" },
    { code: "CODE Rouge", label: "Agent en danger de mort", color: "#ef4444" },
    { code: "CODE EMS", label: "Plusieurs individus ou agents blessés", color: "#3b82f6" },
    { code: "CODE Army", label: "Besoin urgent de déploiement du LS Army", color: "#22c55e" },
    { code: "CODE Media", label: "Demande de média sur zone", color: "#94a3b8" },
    { code: "CODE LSFD", label: "Besoin de pompier suite à un départ de feu", color: "#f97316" },
    { code: "CODE NOOSE/DOA", label: "Besoin d'unité NOOSE/DOA sur zone", color: "#eab308" },
    { code: "CODE Operation", label: "(Supervision et +) Passage fréquence 80 pour tous les agents & ne pas se rendre sur place", color: "#a78bfa" },
  ],
};

const ONGLETS = [
  { key: "vehicules", label: "Véhicules sans permis", icon: "🚗" },
  { key: "procedures", label: "Procédures", icon: "⚖️" },
  { key: "armement", label: "Armement", icon: "🔫" },
  { key: "specialisations", label: "Spécialisations", icon: "🎯" },
  { key: "noose", label: "NOOSE", icon: "🛡️" },
  { key: "armes", label: "Liste des armes", icon: "💥" },
  { key: "frequences", label: "Fréquences radio", icon: "📡" },
  { key: "codes", label: "Codes radio", icon: "🔟" },
];

// ─── PAGE ───────────────────────────────────────────────────────────────────

export default function UtileSampPage() {
  const [tab, setTab] = useState("vehicules");

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>

      <div className="page-header">
        <div>
          <h1 className="page-title">🐈 Utile SAMP</h1>
          <p className="page-subtitle">Intel récupérée sur les procédures internes du San Andreas Metropolitan Police</p>
          <div className="gold-line" />
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {ONGLETS.map((o) => (
          <button
            key={o.key}
            onClick={() => setTab(o.key)}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.5rem 1rem", borderRadius: 8,
              border: `1px solid ${tab === o.key ? "rgba(var(--gold-rgb),0.5)" : "var(--border)"}`,
              background: tab === o.key ? "var(--gold-muted)" : "var(--surface)",
              color: tab === o.key ? "var(--gold)" : "var(--text-muted)",
              cursor: "pointer", fontFamily: "'Inter',sans-serif", fontSize: "0.82rem",
              fontWeight: tab === o.key ? 600 : 400, transition: "all var(--t-fast) var(--ease)",
            }}
          >
            <span>{o.icon}</span>{o.label}
          </button>
        ))}
      </div>

      {tab === "vehicules" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="card">
            <div className="section-title" style={{ marginBottom: "0.75rem", color: "#ef4444" }}>Catégories Compacts</div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {VEHICULES.compacts.map((v) => (
                <li key={v} style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--border)", fontSize: "0.85rem", color: "var(--text-muted)" }}>➔ {v}</li>
              ))}
            </ul>
          </div>
          <div className="card">
            <div className="section-title" style={{ marginBottom: "0.75rem", color: "#3b82f6" }}>Catégories Scooters</div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {VEHICULES.scooters.map((v) => (
                <li key={v} style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--border)", fontSize: "0.85rem", color: "var(--text-muted)" }}>➔ {v}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "procedures" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {PROCEDURES.map((p) => (
            <div key={p.key} className="card" style={{ borderLeft: `3px solid ${p.color}` }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: p.color, background: p.color + "15", padding: "0.2rem 0.6rem", borderRadius: 999 }}>{p.badge}</span>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", fontWeight: 700, margin: "0.6rem 0" }}>{p.title}</div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "0.875rem" }}>{p.desc}</p>
              <ul style={{ margin: 0, paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {p.items.map((it, i) => <li key={i} style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{it}</li>)}
              </ul>
              {p.bracelet && (
                <>
                  <div style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-dim)", marginTop: "0.875rem", marginBottom: "0.4rem" }}>Procédure bracelet</div>
                  <ul style={{ margin: 0, paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {p.bracelet.map((it, i) => <li key={i} style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{it}</li>)}
                  </ul>
                </>
              )}
              {p.note && <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", fontStyle: "italic", marginTop: "0.875rem" }}>{p.note}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === "armement" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1rem", marginBottom: "1rem" }}>
            {ARMEMENT.map((section) => (
              <div key={section.section} className="card">
                <div className="section-title" style={{ marginBottom: "0.875rem" }}>{section.section}</div>
                {section.grades.map((g) => (
                  <div key={g.nom} style={{ marginBottom: "0.875rem" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", color: g.color, marginBottom: "0.25rem" }}>{g.nom}</div>
                    {g.items.map((it, i) => <div key={i} style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>• {it}</div>)}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <div className="section-title" style={{ marginBottom: "0.6rem", color: "var(--gold)" }}>Véhicule × Grade</div>
            {VEHICULE_X_GRADE.map((v) => (
              <div key={v.grade} style={{ fontSize: "0.8rem", padding: "0.35rem 0", borderBottom: "1px solid var(--border)" }}>
                <strong style={{ color: "var(--text)" }}>{v.grade}</strong> <span style={{ color: "var(--text-dim)" }}>→</span> <span style={{ color: "var(--text-muted)" }}>{v.vehicules}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="section-title" style={{ marginBottom: "0.6rem" }}>Équipement commun</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {EQUIPEMENT_COMMUN.map((e) => (
                <span key={e} style={{ fontSize: "0.76rem", padding: "0.3rem 0.7rem", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>{e}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "specialisations" && (
        <div className="card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem", minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-dim)", borderBottom: "1px solid var(--border)" }}>Grade</th>
                {SPECIALISATIONS_COLS.map((c) => <th key={c} style={{ padding: "0.5rem", color: "var(--text-dim)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{c}</th>)}
                {SPECIALISATIONS_DIVISIONS.map((c) => <th key={c} style={{ padding: "0.5rem", color: "var(--gold)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {SPECIALISATIONS_ROWS.map((row) => (
                <tr key={row.grade}>
                  <td style={{ padding: "0.5rem", fontWeight: 600, borderBottom: "1px solid var(--border)" }}>{row.grade}</td>
                  {row.formations.map((ok, i) => (
                    <td key={i} style={{ textAlign: "center", padding: "0.5rem", borderBottom: "1px solid var(--border)", color: ok ? "var(--success)" : "var(--danger)" }}>{ok ? "✓" : "✕"}</td>
                  ))}
                  {row.divisions.map((ok, i) => (
                    <td key={i} style={{ textAlign: "center", padding: "0.5rem", borderBottom: "1px solid var(--border)", color: ok ? "var(--success)" : "var(--danger)" }}>{ok ? "✓" : "✕"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: "0.76rem", color: "var(--text-dim)", marginTop: "1rem" }}>
            La formation 10.20 est obligatoire pour prétendre aux formations A.S.D et Mary. La priorité au grade est appliquée pour la formation Terrain.
            Divisions primaires : N.O.O.S.E – D.O.A. Divisions secondaires : F.T.O – L.S – W.H.S.P.
          </p>
        </div>
      )}

      {tab === "noose" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {NOOSE_CRITERES.map((c, i) => (
            <div key={i} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ fontSize: "2rem" }}>{c.icon}</div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: "0.2rem" }}>{i + 1}. {c.title}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "armes" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="card">
            <div className="section-title" style={{ marginBottom: "0.75rem", color: "#eab308" }}>Arme automatique</div>
            {ARMES.automatique.map((a) => <div key={a} style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "0.35rem 0", borderBottom: "1px solid var(--border)" }}>{a}</div>)}
          </div>
          <div className="card">
            <div className="section-title" style={{ marginBottom: "0.75rem", color: "#ef4444" }}>Arme lourde (appel NOOSE)</div>
            {ARMES.lourde.map((a) => <div key={a} style={{ fontSize: "0.8rem", color: "var(--text-muted)", padding: "0.35rem 0", borderBottom: "1px solid var(--border)" }}>{a}</div>)}
          </div>
        </div>
      )}

      {tab === "frequences" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "1rem" }}>
          <div className="card">
            <div className="section-title" style={{ marginBottom: "0.75rem" }}>Districts & Opérationnels</div>
            {FREQUENCES.districts.map((f) => (
              <div key={f.hz} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", padding: "0.4rem 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--gold)" }}>{f.hz}</span><span style={{ color: "var(--text-muted)" }}>{f.label}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="section-title" style={{ marginBottom: "0.75rem" }}>Divisions</div>
            {FREQUENCES.divisions.map((f) => (
              <div key={f.hz} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", padding: "0.4rem 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--gold)" }}>{f.hz}</span><span style={{ color: "var(--text-muted)" }}>{f.label}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="section-title" style={{ marginBottom: "0.75rem" }}>SAMP & Services publics</div>
            {FREQUENCES.samp.map((f) => (
              <div key={f.hz} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", padding: "0.4rem 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--gold)" }}>{f.hz}</span><span style={{ color: "var(--text-muted)" }}>{f.label}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ gridColumn: "1 / -1", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)" }}>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0, textAlign: "center" }}>
              L'utilisation de ces fréquences est strictement professionnelle. Tout manquement peut être sanctionné.
            </p>
          </div>
        </div>
      )}

      {tab === "codes" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "1rem" }}>
          <div className="card">
            <div className="section-title" style={{ marginBottom: "0.75rem" }}>Patrouille</div>
            {CODES_RADIO.patrouille.map(([code, label]) => (
              <div key={code} style={{ display: "flex", gap: "0.6rem", fontSize: "0.8rem", padding: "0.35rem 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--gold)", flexShrink: 0, width: 48 }}>{code}</span><span style={{ color: "var(--text-muted)" }}>{label}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="section-title" style={{ marginBottom: "0.75rem" }}>Communication</div>
            {CODES_RADIO.communication.map(([code, label]) => (
              <div key={code} style={{ display: "flex", gap: "0.6rem", fontSize: "0.8rem", padding: "0.35rem 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--gold)", flexShrink: 0, width: 48 }}>{code}</span><span style={{ color: "var(--text-muted)" }}>{label}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="section-title" style={{ marginBottom: "0.75rem" }}>Interventions</div>
            {CODES_RADIO.interventions.map(([code, label]) => (
              <div key={code} style={{ display: "flex", gap: "0.6rem", fontSize: "0.8rem", padding: "0.35rem 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--gold)", flexShrink: 0, width: 48 }}>{code}</span><span style={{ color: "var(--text-muted)" }}>{label}</span>
              </div>
            ))}
            <div style={{ fontSize: "0.74rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>+ ETA : temps estimé avant arrivée</div>
          </div>
          <div className="card">
            <div className="section-title" style={{ marginBottom: "0.75rem" }}>Autres codes</div>
            {CODES_RADIO.autres.map((c) => (
              <div key={c.code} style={{ padding: "0.4rem 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: c.color }}>{c.code}</span>
                <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
