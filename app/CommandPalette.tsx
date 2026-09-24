"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";

interface Result {
  type: "client" | "dossier" | "facture" | "casier" | "page";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: string;
}

const QUICK_PAGES: Result[] = [
  { type:"page", id:"p1", title:"Dashboard", subtitle:"Accueil", href:"/", icon:"🏠" },
  { type:"page", id:"p2", title:"Stocks",   subtitle:"Inventaire", href:"/obsidian/stocks", icon:"📦" },
  { type:"page", id:"p3", title:"Armurerie",  subtitle:"Armes & munitions", href:"/obsidian/armurerie", icon:"🔫" },
  { type:"page", id:"p4", title:"Comptabilité",  subtitle:"Recettes & dépenses", href:"/obsidian/comptabilite", icon:"🧾" },
  { type:"page", id:"p5", title:"Garage",subtitle:"Véhicules", href:"/obsidian/garage", icon:"🚗" },
  { type:"page", id:"p6", title:"RDV", subtitle:"Rendez-vous", href:"/obsidian/rdv", icon:"🗓️" },
  { type:"page", id:"p7", title:"Contrats",   subtitle:"Missions", href:"/obsidian/contrats", icon:"📜" },
  { type:"page", id:"p8", title:"Fiches",   subtitle:"Personnes / orgas", href:"/obsidian/fiches", icon:"🗂️" },
];

const TYPE_COLORS: Record<string,string> = {
  client:"var(--success)", dossier:"var(--info)", facture:"var(--gold)",
  casier:"var(--danger)", page:"var(--text-dim)",
};

export default function CommandPalette() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!supabase || !user) { setResults(QUICK_PAGES); return; }

    if (!q.trim()) {
      setResults(QUICK_PAGES);
      return;
    }

    setLoading(true);
    const like = `%${q}%`;
    const [{ data: fiches }, { data: contrats }] = await Promise.all([
      supabase.from("obsidian_fiches").select("id,nom,organisation").ilike("nom", like).limit(5),
      supabase.from("obsidian_contrats").select("id,titre,type").ilike("titre", like).limit(5),
    ]);

    const r: Result[] = [
      ...(fiches||[]).map((f:any) => ({ type:"client" as const, id:f.id, title:f.nom, subtitle:f.organisation||"Fiche", href:"/obsidian/fiches", icon:"🗂️" })),
      ...(contrats||[]).map((c:any) => ({ type:"dossier" as const, id:c.id, title:c.titre, subtitle:c.type, href:"/obsidian/contrats", icon:"📜" })),
    ];

    const pageMatches = QUICK_PAGES.filter(p => p.title.toLowerCase().includes(q.toLowerCase()));
    setResults([...r, ...pageMatches]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => search(query), 200);
      return () => clearTimeout(t);
    }
  }, [query, open, search]);

  useEffect(() => {
    if (open) { setQuery(""); setResults(QUICK_PAGES); setSelected(0); }
  }, [open]);

  function navigate(r: Result) {
    setOpen(false);
    router.push(r.href);
  }

  function handleKeyNav(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s+1, results.length-1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s-1, 0)); }
    if (e.key === "Enter" && results[selected]) { e.preventDefault(); navigate(results[selected]); }
  }

  if (!open) return null;

  const grouped: Record<string, Result[]> = {};
  results.forEach(r => { if (!grouped[r.type]) grouped[r.type] = []; grouped[r.type].push(r); });
  const sectionLabels: Record<string,string> = { client:"Fiches", dossier:"Contrats", facture:"Factures", casier:"Casiers", page:"Pages" };

  let flatIndex = 0;

  return (
    <div className="cmdk-overlay" onClick={e => e.target === e.currentTarget && setOpen(false)}>
      <div className="cmdk-box">
        <div className="cmdk-input-row">
          <span style={{ color:"var(--text-dim)" }}>🔍</span>
          <input
            autoFocus
            placeholder="Rechercher fiches, contrats, pages…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyNav}
          />
          <span className="cmdk-kbd">esc</span>
        </div>

        <div className="cmdk-results">
          {loading && (
            <div style={{ padding:"1rem", textAlign:"center", color:"var(--text-dim)", fontSize:"0.8rem" }}>Recherche…</div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ padding:"2rem", textAlign:"center", color:"var(--text-dim)", fontSize:"0.85rem" }}>Aucun résultat</div>
          )}
          {!loading && Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <div className="cmdk-section-label">{sectionLabels[type]}</div>
              {items.map(r => {
                const isSelected = flatIndex === selected;
                const idx = flatIndex++;
                return (
                  <div key={r.type+r.id} className={`cmdk-item ${isSelected?"selected":""}`}
                    onClick={() => navigate(r)}
                    onMouseEnter={() => setSelected(idx)}>
                    <div className="cmdk-item-icon" style={{ background:TYPE_COLORS[r.type]+"18", color:TYPE_COLORS[r.type] }}>
                      {r.icon}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:"0.85rem", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.title}</div>
                      <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.subtitle}</div>
                    </div>
                    {isSelected && <span className="cmdk-kbd">↵</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}