"use client";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { CODES, TAGS, LIBELLE_TAG, type CodeInfo } from "@/lib/codesJuridiques";

type Row = Record<string, any>;

const GROUPES: { label: string; slugs: string[] }[] = [
  { label: "Fondamentaux", slugs: ["constitution_usa", "constitution_sa"] },
  { label: "Codes", slugs: ["penal", "livret", "procedure_penale", "route", "civil", "electoral", "gouvernemental", "impots", "travail", "environnemental", "aviation", "maritime"] },
  { label: "Règlements et décrets", slugs: ["armes_reglementation", "etat_urgence", "autres_lois"] },
];

const CSS = `
.cj { display: flex; flex-direction: column; gap: 1.2rem; }
.cj-seg { display: inline-flex; border: 1px solid var(--border); border-radius: 999px; padding: 3px; background: var(--card); align-self: flex-start; }
.cj-seg button { border: 0; background: transparent; color: var(--text-dim); padding: .45rem 1rem; border-radius: 999px; cursor: pointer; font-size: .85rem; }
.cj-seg button.on { background: var(--gold-muted); color: var(--gold-light); }
.cj-layout { display: grid; grid-template-columns: 260px 1fr; gap: 1.4rem; align-items: start; }
.cj-menu { position: sticky; top: 1rem; display: flex; flex-direction: column; gap: 1rem; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1rem; background: var(--card); }
.cj-groupe-titre { font-family: 'Cinzel', serif; font-size: .7rem; letter-spacing: .14em; text-transform: uppercase; color: var(--gold); margin: 0 0 .4rem; }
.cj-lien { display: block; width: 100%; text-align: left; border: 0; background: transparent; color: var(--text-muted); padding: .45rem .6rem; border-radius: 6px; cursor: pointer; font-size: .88rem; }
.cj-lien:hover { background: var(--card-hover); }
.cj-lien.on { background: var(--gold-muted); color: var(--gold-light); box-shadow: inset 2px 0 0 var(--gold); }
.cj-entete { border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 1.2rem 1.4rem; background: linear-gradient(180deg, var(--card), var(--bg)); border-top: 2px solid var(--gold); }
.cj-entete h2 { font-family: 'Cinzel', serif; color: var(--gold); letter-spacing: .06em; font-size: 1.25rem; margin: 0 0 .3rem; }
.cj-meta { font-size: .8rem; color: var(--text-dim); }
.cj-outils { display: flex; flex-direction: column; gap: .7rem; }
.cj-recherche { width: 100%; padding: .7rem .9rem; background: var(--card); border: 1px solid var(--border); border-radius: 8px; color: inherit; font-size: .95rem; }
.cj-recherche:focus { outline: none; border-color: var(--gold); }
.cj-pills { display: flex; gap: .4rem; flex-wrap: wrap; }
.cj-pill { border: 1px solid var(--border); background: var(--card); color: var(--text-muted); padding: .3rem .7rem; border-radius: 999px; font-size: .78rem; cursor: pointer; }
.cj-pill.on { background: var(--gold); color: #111; border-color: var(--gold); }
.cj-liste { display: flex; flex-direction: column; gap: .6rem; }
.cj-carte { border: 1px solid var(--border); border-left: 3px solid var(--gold); border-radius: 8px; padding: .9rem 1.1rem; background: var(--card); }
.cj-carte-tete { display: flex; align-items: baseline; justify-content: space-between; gap: .6rem; flex-wrap: wrap; }
.cj-num { font-family: 'JetBrains Mono', monospace; font-size: .82rem; color: var(--gold-light); letter-spacing: .04em; }
.cj-chap { font-size: .75rem; color: var(--text-dim); margin-top: .15rem; }
.cj-texte { white-space: pre-line; line-height: 1.6; font-size: .95rem; margin-top: .6rem; }
.cj-appl { font-size: .72rem; padding: 2px 8px; border-radius: 999px; border: 1px solid rgba(var(--gold-rgb),.45); color: var(--gold-light); }
.cj-tags { display: flex; gap: .3rem; flex-wrap: wrap; margin-top: .6rem; }
.cj-tag { font-size: .7rem; padding: 2px 8px; border-radius: 4px; background: var(--gold-muted); color: var(--gold-light); }
.cj-etats { display: flex; gap: .4rem; flex-wrap: wrap; margin-top: .5rem; }
.cj-etat { font-size: .75rem; padding: 3px 9px; border-radius: 4px; border: 1px solid var(--border); color: var(--text-dim); }
.cj-etat.oui { border-color: #3f9d6a; color: #7fd1a3; background: rgba(63,157,106,.12); }
.cj-etat.non { opacity: .55; }
.cj-vide { padding: 2rem; text-align: center; color: var(--text-dim); border: 1px dashed var(--border); border-radius: 8px; }
.cj-groupe { display: flex; flex-direction: column; gap: .6rem; }
.cj-groupe > h3 { font-family: 'Cinzel', serif; color: var(--gold); font-size: 1rem; letter-spacing: .06em; margin: .4rem 0 0; }
.cj-mobile-menu { display: none; }
@media (max-width: 820px) {
  .cj-layout { grid-template-columns: 1fr; }
  .cj-menu { position: static; }
  .cj-menu-liste { display: none; }
  .cj-menu.ouvert .cj-menu-liste { display: flex; flex-direction: column; gap: 1rem; }
  .cj-mobile-menu { display: block; width: 100%; padding: .7rem; border: 1px solid var(--border); border-radius: 8px; background: var(--card); color: inherit; text-align: left; cursor: pointer; }
}
`;

export default function CodesJuridiques() {
  const [onglet, setOnglet] = useState<"codes" | "tags">("codes");
  const [donnees, setDonnees] = useState<Record<string, Row[]> | null>(null);
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    let vivant = true;
    Promise.all(CODES.map((c) => charger(c.table).then((r) => [c.slug, r] as const))).then((paires) => {
      if (vivant) setDonnees(Object.fromEntries(paires));
    });
    return () => { vivant = false; };
  }, []);

  const mot = normaliser(recherche.trim());
  return (
    <div className="cj">
      <style>{CSS}</style>
      <input className="cj-recherche" value={recherche} onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher dans tout le code juridique (article, mot, infraction…)" />
      {mot ? (
        <Recherche donnees={donnees} mot={mot} />
      ) : (
        <>
          <div className="cj-seg">
            <button className={onglet === "codes" ? "on" : ""} onClick={() => setOnglet("codes")}>Par code</button>
            <button className={onglet === "tags" ? "on" : ""} onClick={() => setOnglet("tags")}># Par thème</button>
          </div>
          {onglet === "codes" ? <ParCode donnees={donnees} /> : <ParTag donnees={donnees} />}
        </>
      )}
    </div>
  );
}

// Met en minuscules et retire les accents, pour que « arme » trouve « Arme »
function normaliser(t: string) {
  return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Texte de recherche d'une ligne : seulement les valeurs, pas les noms de champs
function cherchable(r: Row) {
  return normaliser(Object.values(r).map((v) => (Array.isArray(v) ? v.join(" ") : String(v ?? ""))).join(" "));
}

function Recherche({ donnees, mot }: { donnees: Record<string, Row[]> | null; mot: string }) {
  if (donnees === null) return <p className="cj-meta">Chargement…</p>;
  const groupes = CODES.map((c) => ({ c, liste: (donnees[c.slug] || []).filter((r) => cherchable(r).includes(mot)) })).filter((g) => g.liste.length > 0);
  const total = groupes.reduce((n, g) => n + g.liste.length, 0);
  return (
    <div className="cj-groupe">
      <div className="cj-meta">{total} résultat(s) dans {groupes.length} code(s)</div>
      {total === 0 && <div className="cj-vide">Aucun résultat pour « {mot} ».</div>}
      {groupes.map(({ c, liste }) => (
        <div key={c.slug} className="cj-groupe">
          <h3>{c.titre} · {liste.length}</h3>
          <div className="cj-liste">
            {liste.map((r, i) => <Entree key={r.id || i} row={r} code={c} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

async function charger(table: string): Promise<Row[]> {
  try {
    const res = await fetch(`/api/cabinet/${table}`, { cache: "no-store" });
    const json = await res.json();
    return json.rows || [];
  } catch {
    return [];
  }
}

function Tags({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="cj-tags">
      {tags.map((t) => <span key={t} className="cj-tag">#{LIBELLE_TAG[t] || t}</span>)}
    </div>
  );
}

// Une entrée selon le type de code
function Entree({ row, code }: { row: Row; code: CodeInfo }) {
  const tags: string[] = row.tags || [];

  if (code.kind === "livret") {
    const etats = [
      row.procureur && { t: "Procureur obligatoire", oui: true },
      row.bracelet && { t: "Bracelet électronique", oui: true },
    ].filter(Boolean) as { t: string; oui: boolean }[];
    return (
      <div className="cj-carte">
        <div className="cj-carte-tete">
          <span className="cj-num">{row.article}</span>
          <span className="cj-meta">{row.categorie_id}</span>
        </div>
        <div style={{ fontWeight: 600, marginTop: ".3rem" }}>{row.titre}</div>
        <div className="cj-etats">
          {row.amende && <span className="cj-etat oui">Amende {row.amende}</span>}
          {row.detention && <span className="cj-etat oui">Détention {row.detention} min</span>}
          {etats.map((e) => <span key={e.t} className="cj-etat oui">{e.t}</span>)}
        </div>
        {row.autres_sanctions && <div className="cj-texte" style={{ fontSize: ".88rem" }}>{row.autres_sanctions}</div>}
        <Tags tags={tags} />
      </div>
    );
  }

  if (code.kind === "armes") {
    const m = String(row.texte || "").match(/Autorisée : (Oui|Non) · Collection : (Oui|Non) · Interdite : (Oui|Non)/);
    const etat = (libelle: string, valeur?: string) => (
      <span className={`cj-etat ${valeur === "Oui" ? "oui" : "non"}`}>{libelle}</span>
    );
    return (
      <div className="cj-carte">
        <div className="cj-carte-tete">
          <span style={{ fontWeight: 600 }}>{row.numero}</span>
          <span className="cj-meta">{row.chapitre}</span>
        </div>
        <div className="cj-etats">
          {m ? <>
            {etat("Autorisée", m[1])}
            {etat("Collection", m[2])}
            {etat("Interdite", m[3])}
          </> : <span className="cj-meta">{row.texte}</span>}
        </div>
      </div>
    );
  }

  // Articles, lignes de constitution, décrets, état d'urgence
  const estArticle = code.kind === "articles";
  return (
    <div className="cj-carte">
      <div className="cj-carte-tete">
        <span className="cj-num">{estArticle ? `Art. ${row.numero}` : row.numero}</span>
        {row.applicable && <span className="cj-appl">{row.applicable}</span>}
      </div>
      {row.chapitre && <div className="cj-chap">{row.chapitre}</div>}
      {row.partie && <div className="cj-chap">{row.partie}</div>}
      <div className="cj-texte">{row.texte}</div>
      {row.lien && (
        <a href={row.lien} target="_blank" rel="noopener noreferrer" className="cj-pill on" style={{ alignSelf: "flex-start", textDecoration: "none" }}>
          📎 Ouvrir le décret (Google Doc)
        </a>
      )}
      <Tags tags={tags} />
    </div>
  );
}

function ParCode({ donnees }: { donnees: Record<string, Row[]> | null }) {
  const [slug, setSlug] = useState(CODES[0].slug);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const code = CODES.find((c) => c.slug === slug) || CODES[0];
  const rows = donnees ? donnees[code.slug] || [] : null;

  const filtres = useMemo(() => {
    if (!rows) return [];
    const mot = normaliser(q.trim());
    return rows.filter((r) => {
      if (tag && !(r.tags || []).includes(tag)) return false;
      return !mot || cherchable(r).includes(mot);
    });
  }, [rows, q, tag]);

  return (
    <div className="cj-layout">
      <nav className={`cj-menu ${menuOuvert ? "ouvert" : ""}`}>
        <button className="cj-mobile-menu" onClick={() => setMenuOuvert((o) => !o)}>
          {code.titre} — choisir un autre code
        </button>
        <div className="cj-menu-liste" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {GROUPES.map((g) => (
            <div key={g.label}>
              <p className="cj-groupe-titre">{g.label}</p>
              {g.slugs.map((s) => {
                const c = CODES.find((x) => x.slug === s);
                if (!c) return null;
                return (
                  <button key={s} className={`cj-lien ${s === slug ? "on" : ""}`} onClick={() => { setSlug(s); setMenuOuvert(false); setTag(null); setQ(""); }}>
                    {c.titre}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </nav>

      <section className="cj-groupe" style={{ gap: "1rem" }}>
        <div className="cj-entete">
          <h2>{code.titre}</h2>
          <div className="cj-meta">{code.slug === "etat_urgence" ? "Image" : rows === null ? "Chargement…" : `${rows.length} entrée(s)`}</div>
        </div>

        <div className="cj-outils">
          <input className="cj-recherche" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer ce code…" />
          <div className="cj-pills">
            <button className={`cj-pill ${!tag ? "on" : ""}`} onClick={() => setTag(null)}>Tous</button>
            {TAGS.map((t) => (
              <button key={t.slug} className={`cj-pill ${tag === t.slug ? "on" : ""}`} onClick={() => setTag(t.slug)}>#{t.label}</button>
            ))}
          </div>
        </div>

        {code.slug === "etat_urgence" ? (
          <div className="cj-liste">
            <img src="/codes/etat-urgence.png" alt="Classification de l'état d'urgence" style={{ width: "100%", height: "auto", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }} />
          </div>
        ) : rows === null ? null : filtres.length === 0 ? (
          <div className="cj-vide">Aucune entrée trouvée.</div>
        ) : (
          <div className="cj-liste">
            {filtres.map((r, i) => <Entree key={r.id || i} row={r} code={code} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function ParTag({ donnees }: { donnees: Record<string, Row[]> | null }) {
  const [tag, setTag] = useState(TAGS[0].slug);

  const compte = (slugTag: string) =>
    donnees ? Object.values(donnees).reduce((n, rs) => n + rs.filter((r) => (r.tags || []).includes(slugTag)).length, 0) : 0;

  return (
    <div className="cj-groupe" style={{ gap: "1rem" }}>
      <div className="cj-entete">
        <h2>Recherche par thème</h2>
        <div className="cj-meta">Tous les articles et infractions liés à un même thème, tous codes confondus.</div>
      </div>
      <div className="cj-pills">
        {TAGS.map((t) => (
          <button key={t.slug} className={`cj-pill ${tag === t.slug ? "on" : ""}`} onClick={() => setTag(t.slug)}>
            #{t.label}{donnees ? ` (${compte(t.slug)})` : ""}
          </button>
        ))}
      </div>
      {donnees === null ? null : (
        <>
          <div className="cj-meta">Thème affiché : <strong style={{ color: "var(--gold-light)" }}>#{LIBELLE_TAG[tag]}</strong></div>
          {CODES.map((c) => {
            const liste = (donnees[c.slug] || []).filter((r) => (r.tags || []).includes(tag));
            if (!liste.length) return null;
            return (
              <div key={c.slug} className="cj-groupe">
                <h3>{c.titre} · {liste.length}</h3>
                <div className="cj-liste">
                  {liste.map((r, i) => <Entree key={r.id || i} row={r} code={c} />)}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
