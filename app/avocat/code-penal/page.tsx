"use client";
import { useEffect, useMemo, useState } from "react";
import CabinetShell from "@/components/cabinet/CabinetShell";

// Code pénal du cabinet : recherche et filtre par catégorie. Lecture seule ici, édition dans l'admin.
export default function Page() {
  return (
    <CabinetShell title="Code pénal" icon="📕" desc="Articles de référence" perms={["avocat"]}>
      {() => <CodePenal />}
    </CabinetShell>
  );
}

function CodePenal() {
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
    return [r.id, r.titre, r.contenu].some(v => String(v || "").toLowerCase().includes(t));
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
        <input placeholder="Rechercher un article (numéro, titre, texte)" value={q} onChange={e => setQ(e.target.value)} style={{ flex: "1 1 260px" }} />
        <select value={cat} onChange={e => setCat(e.target.value)} style={{ flex: "0 1 220px" }}>
          <option value="">Toutes les catégories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="cab-muted" style={{ fontSize: ".8rem" }}>{filtres.length} article(s)</div>
      {filtres.map(a => (
        <div key={a.id} className="cab-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: ".5rem", flexWrap: "wrap" }}>
            <strong>{a.id} : {a.titre}</strong>
            <span className="cab-muted" style={{ fontSize: ".78rem" }}>{a.categorie_id}</span>
          </div>
          <p style={{ margin: ".5rem 0" }}>{a.contenu}</p>
          <div className="cab-muted" style={{ fontSize: ".8rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {a.amende && <span>Amende : {a.amende}</span>}
            {a.detention && <span>Détention : {a.detention}</span>}
            {a.niveau && <span>Niveau : {a.niveau}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
