"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";

interface Result {
  type: "client" | "dossier" | "facture" | "casier" | "page";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: string;
}

const QUICK_PAGES: Result[] = [
  { type:"page", id:"p1", title:"Tableau de bord", subtitle:"Accueil", href:"/", icon:"◈" },
  { type:"page", id:"p2", title:"Clients",   subtitle:"Liste des clients", href:"/clients", icon:"◉" },
  { type:"page", id:"p3", title:"Dossiers",  subtitle:"Tous les dossiers", href:"/dossiers", icon:"◫" },
  { type:"page", id:"p4", title:"Factures",  subtitle:"Facturation", href:"/factures", icon:"◳" },
  { type:"page", id:"p5", title:"Simulateur",subtitle:"Calcul des honoraires", href:"/simulateur", icon:"◐" },
  { type:"page", id:"p6", title:"Audiences", subtitle:"Calendrier partagé", href:"/audiences", icon:"◷" },
  { type:"page", id:"p7", title:"Casiers",   subtitle:"Casiers judiciaires", href:"/casier", icon:"◪" },
  { type:"page", id:"p8", title:"Modèles",   subtitle:"Modèles de plaidoirie", href:"/modeles", icon:"◧" },
  { type:"page", id:"p9", title:"Code pénal",subtitle:"Référence juridique", href:"/juridique", icon:"◎" },
];

const TYPE_COLORS: Record<string,string> = {
  client:"var(--success)", dossier:"var(--info)", facture:"var(--gold)",
  casier:"var(--danger)", page:"var(--text-dim)",
};

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);

  // Raccourci Cmd/Ctrl+K
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
    if (!supabase) return;
    const user = getUser();
    if (!user) return;

    if (!q.trim()) {
      setResults(QUICK_PAGES);
      return;
    }

    setLoading(true);
    const like = `%${q}%`;
    const [{ data: clients }, { data: dossiers }, { data: factures }, { data: casiers }] = await Promise.all([
      supabase.from("clients").select("id,nom_rp,organisation").eq("created_by", user.nom).ilike("nom_rp", like).limit(5),
      supabase.from("dossiers").select("id,reference,client,type_affaire").eq("created_by", user.nom).or(`reference.ilike.${like},client.ilike.${like}`).limit(5),
      supabase.from("factures").select("id,numero,client,montant").eq("created_by", user.nom).or(`numero.ilike.${like},client.ilike.${like}`).limit(5),
      supabase.from("casier").select("id,client_nom,infraction").eq("created_by", user.nom).or(`client_nom.ilike.${like},infraction.ilike.${like}`).limit(5),
    ]);

    const r: Result[] = [
      ...(clients||[]).map((c:any) => ({ type:"client" as const, id:c.id, title:c.nom_rp, subtitle:c.organisation||"Client", href:"/clients", icon:"◉" })),
      ...(dossiers||[]).map((d:any) => ({ type:"dossier" as const, id:d.id, title:d.reference, subtitle:`${d.client} · ${d.type_affaire}`, href:`/dossiers/${d.id}`, icon:"◫" })),
      ...(factures||[]).map((f:any) => ({ type:"facture" as const, id:f.id, title:f.numero, subtitle:`${f.client} · ${f.montant?.toLocaleString("fr-FR")}$`, href:"/factures", icon:"◳" })),
      ...(casiers||[]).map((c:any) => ({ type:"casier" as const, id:c.id, title:c.client_nom, subtitle:c.infraction, href:"/casier", icon:"◪" })),
    ];

    // Inclure les pages qui matchent aussi
    const pageMatches = QUICK_PAGES.filter(p => p.title.toLowerCase().includes(q.toLowerCase()));
    setResults([...r, ...pageMatches]);
    setLoading(false);
  }, []);

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
  const sectionLabels: Record<string,string> = { client:"Clients", dossier:"Dossiers", facture:"Factures", casier:"Casiers", page:"Pages" };

  let flatIndex = 0;

  return (
    <div className="cmdk-overlay" onClick={e => e.target === e.currentTarget && setOpen(false)}>
      <div className="cmdk-box">
        <div className="cmdk-input-row">
          <span style={{ color:"var(--text-dim)" }}>🔍</span>
          <input
            autoFocus
            placeholder="Rechercher clients, dossiers, factures, casiers…"
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
