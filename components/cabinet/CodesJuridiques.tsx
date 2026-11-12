"use client";
import { useEffect, useMemo, useState } from "react";
import { CODES, TAGS, LIBELLE_TAG, type CodeInfo } from "@/lib/codesJuridiques";

type Row = Record<string, any>;

export default function CodesJuridiques() {
  const [onglet, setOnglet] = useState<"codes" | "tags">("codes");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
        <button className={onglet === "codes" ? "btn btn-sm" : "btn btn-outline btn-sm"} onClick={() => setOnglet("codes")}>Par code</button>
        <button className={onglet === "tags" ? "btn btn-sm" : "btn btn-outline btn-sm"} onClick={() => setOnglet("tags")}># Recherche par thème</button>
      </div>
      {onglet === "codes" ? <ParCode /> : <ParTag />}
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

// Affiche une ligne selon le type de code
function Entree({ row, code }: { row: Row; code: CodeInfo }) {
  const tags: string[] = row.tags || [];
  const titre = code.kind === "livret" ? `${row.article} ${row.titre}` : `${code.kind === "articles" ? "Article " : ""}${row.numero}`;
  const corps = code.kind === "livret"
    ? [row.categorie_id, row.amende && `Amende : ${row.amende}`, row.detention && `Détention : ${row.detention} min`, row.procureur && "Procureur obligatoire", row.bracelet && "Bracelet électronique", row.autres_sanctions].filter(Boolean).join(" · ")
    : row.texte;
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 4, padding: ".8rem 1rem", background: "var(--surface)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: ".5rem", flexWrap: "wrap" }}>
        <strong>{titre}</strong>
        {row.applicable && <span style={{ fontSize: ".75rem", color: "var(--gold)" }}>{row.applicable}</span>}
      </div>
      {row.chapitre && <div style={{ fontSize: ".78rem", opacity: 0.7 }}>{row.chapitre}</div>}
      <div style={{ whiteSpace: "pre-line", marginTop: ".4rem", fontSize: ".92rem" }}>{corps}</div>
      {tags.length > 0 && (
        <div style={{ display: "flex", gap: ".3rem", flexWrap: "wrap", marginTop: ".5rem" }}>
          {tags.map((t) => (
            <span key={t} style={{ fontSize: ".7rem", padding: "1px 6px", border: "1px solid var(--border)", borderRadius: 2 }}>#{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ParCode() {
  const [slug, setSlug] = useState(CODES[0].slug);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const code = CODES.find((c) => c.slug === slug) || CODES[0];

  useEffect(() => {
    let vivant = true;
    setRows(null);
    charger(code.table).then((r) => vivant && setRows(r));
    return () => { vivant = false; };
  }, [code.table]);

  const filtres = useMemo(() => {
    if (!rows) return [];
    const mot = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (tag && !(r.tags || []).includes(tag)) return false;
      if (!mot) return true;
      return JSON.stringify(r).toLowerCase().includes(mot);
    });
  }, [rows, q, tag]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".8rem" }}>
      <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
        {CODES.map((c) => (
          <button key={c.slug} className={c.slug === slug ? "btn btn-sm" : "btn btn-outline btn-sm"} onClick={() => setSlug(c.slug)}>{c.titre}</button>
        ))}
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans ce code…"
        style={{ width: "100%", padding: ".55rem .7rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, color: "inherit" }} />
      <div style={{ display: "flex", gap: ".3rem", flexWrap: "wrap" }}>
        <button className={!tag ? "btn btn-sm" : "btn btn-outline btn-sm"} onClick={() => setTag(null)}>Tous</button>
        {TAGS.map((t) => (
          <button key={t.slug} className={tag === t.slug ? "btn btn-sm" : "btn btn-outline btn-sm"} onClick={() => setTag(t.slug)}>#{t.label}</button>
        ))}
      </div>
      {rows === null ? <p>Chargement…</p> : (
        <>
          <div style={{ fontSize: ".8rem", opacity: 0.7 }}>{filtres.length} entrée(s)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
            {filtres.map((r, i) => <Entree key={r.id || i} row={r} code={code} />)}
          </div>
        </>
      )}
    </div>
  );
}

function ParTag() {
  const [tag, setTag] = useState(TAGS[0].slug);
  const [donnees, setDonnees] = useState<Record<string, Row[]> | null>(null);

  useEffect(() => {
    let vivant = true;
    Promise.all(CODES.map((c) => charger(c.table).then((r) => [c.slug, r] as const))).then((paires) => {
      if (vivant) setDonnees(Object.fromEntries(paires));
    });
    return () => { vivant = false; };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".8rem" }}>
      <div style={{ display: "flex", gap: ".3rem", flexWrap: "wrap" }}>
        {TAGS.map((t) => (
          <button key={t.slug} className={tag === t.slug ? "btn btn-sm" : "btn btn-outline btn-sm"} onClick={() => setTag(t.slug)}>#{t.label}</button>
        ))}
      </div>
      {donnees === null ? <p>Chargement…</p> : (
        <>
          <div style={{ fontSize: ".85rem" }}>Thème : <strong>#{LIBELLE_TAG[tag]}</strong></div>
          {CODES.map((c) => {
            const liste = (donnees[c.slug] || []).filter((r) => (r.tags || []).includes(tag));
            if (liste.length === 0) return null;
            return (
              <section key={c.slug} style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
                <h3 style={{ fontSize: "1rem", color: "var(--gold)" }}>{c.titre} ({liste.length})</h3>
                {liste.map((r, i) => <Entree key={r.id || i} row={r} code={c} />)}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
