"use client";
import { useEffect, useMemo, useState } from "react";
import CabinetShell from "@/components/cabinet/CabinetShell";

// Code pénal du cabinet : texte des articles et Livret des peines. Lecture seule ici, édition dans l'admin.
export default function Page() {
  return (
    <CabinetShell title="Code pénal" icon="📕" desc="Articles de référence" perms={["avocat"]}>
      {() => <CodePenal />}
    </CabinetShell>
  );
}

function CodePenal() {
  const [onglet, setOnglet] = useState<"texte" | "livret">("texte");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
        <button className={onglet === "texte" ? "btn btn-sm" : "btn btn-outline btn-sm"} onClick={() => setOnglet("texte")}>Code pénal (articles)</button>
        <button className={onglet === "livret" ? "btn btn-sm" : "btn btn-outline btn-sm"} onClick={() => setOnglet("livret")}>Livret des peines</button>
      </div>
      {onglet === "texte" ? <TexteCodePenal /> : <LivretPeines />}
    </div>
  );
}

function TexteCodePenal() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/cabinet/cabinet_code_penal_texte").then(r => r.json()).then(d => setRows(d.rows || []));
  }, []);

  if (rows === null) return <div style={{ color: "var(--text-dim)" }}>Chargement...</div>;

  const t = q.trim().toLowerCase();
  const filtres = rows.filter(r => !t || [r.numero, r.titre_rubrique, r.chapitre, r.texte].some(v => String(v || "").toLowerCase().includes(t)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
      <input placeholder="Rechercher (numéro d'article, mot du texte)" value={q} onChange={e => setQ(e.target.value)} />
      <div className="cab-muted" style={{ fontSize: ".8rem" }}>{filtres.length} article(s)</div>
      {filtres.map(a => (
        <div key={a.id} className="cab-card">
          <div style={{ fontSize: ".75rem", color: "var(--text-dim)" }}>{a.titre_rubrique}{a.chapitre ? " · " + a.chapitre : ""}</div>
          <div style={{ margin: ".4rem 0", whiteSpace: "pre-line", fontSize: ".9rem" }}>
            {a.numero !== "Préambule" && <strong>Article {a.numero}. </strong>}{a.texte}
          </div>
          {a.applicable && <div style={{ fontSize: ".78rem", color: "var(--gold-light)" }}>{a.applicable}</div>}
        </div>
      ))}
    </div>
  );
}

function LivretPeines() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  useEffect(() => {
    fetch("/api/cabinet/cabinet_code_penal").then(r => r.json()).then(d => setRows(d.rows || []));
  }, []);

  const categories = useMemo(() => [...new Set((rows || []).map(r => r.categorie_id))], [rows]);

  if (rows === null) return <div style={{ color: "var(--text-dim)" }}>Chargement...</div>;

  const filtres = rows.filter(r => {
    if (cat && r.categorie_id !== cat) return false;
    if (!q.trim()) return true;
    const t = q.toLowerCase();
    return [r.article, r.titre, r.contenu, r.autres_sanctions].some(v => String(v || "").toLowerCase().includes(t));
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
        <input placeholder="Rechercher une infraction (article, titre, texte)" value={q} onChange={e => setQ(e.target.value)} style={{ flex: "1 1 260px" }} />
        <select value={cat} onChange={e => setCat(e.target.value)} style={{ flex: "0 1 220px" }}>
          <option value="">Toutes les catégories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="cab-muted" style={{ fontSize: ".8rem" }}>{filtres.length} infraction(s)</div>
      {filtres.map(a => (
        <div key={a.id} className="cab-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: ".5rem", flexWrap: "wrap" }}>
            <strong>{a.article} {a.titre}</strong>
            <span className="cab-muted" style={{ fontSize: ".78rem" }}>{a.categorie_id}</span>
          </div>
          {a.contenu && <p className="cab-muted" style={{ margin: ".4rem 0", fontSize: ".82rem" }}>{a.contenu}</p>}
          <div className="cab-muted" style={{ fontSize: ".8rem", display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: ".3rem" }}>
            {a.amende && <span>Amende : {a.amende}</span>}
            {a.detention && <span>Détention : {a.detention}</span>}
            {a.procureur && <span>Procureur obligatoire</span>}
            {a.bracelet && <span>Bracelet</span>}
          </div>
          {a.autres_sanctions && <div style={{ fontSize: ".82rem", marginTop: ".4rem" }}>{a.autres_sanctions}</div>}
        </div>
      ))}
    </div>
  );
}
