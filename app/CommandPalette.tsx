"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission } from "@/lib/auth";
import { CODE_COMPLET } from "@/lib/code-penal";

interface Result {
  type: "client" | "dossier" | "stock" | "employe" | "article" | "page";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: string;
}

interface PageEntry {
  title: string;
  subtitle: string;
  href: string;
  icon: string;
  permission: string;
}

// Reflète l'intégralité des pages de la Sidebar (+ Calculatrice, orpheline : accessible
// par URL directe mais absente du menu — la recherche est la seule façon de la trouver).
const ALL_PAGES: PageEntry[] = [
  { title: "Dashboard", subtitle: "Accueil", href: "/", icon: "🏠", permission: "obsidian_dashboard" },
  { title: "Tableau des prix", subtitle: "Drogues, armes, accessoires", href: "/obsidian/prix", icon: "🏷️", permission: "obsidian_prix" },
  { title: "Stocks", subtitle: "Inventaire", href: "/obsidian/stocks", icon: "📦", permission: "obsidian_stocks" },
  { title: "Armurerie", subtitle: "Armes & munitions", href: "/obsidian/armurerie", icon: "🔫", permission: "obsidian_armurerie" },
  { title: "Garage", subtitle: "Véhicules", href: "/obsidian/garage", icon: "🚗", permission: "obsidian_garage" },
  { title: "Comptabilité", subtitle: "Recettes & dépenses", href: "/obsidian/comptabilite", icon: "🧾", permission: "obsidian_comptabilite" },
  { title: "Rendez-vous", subtitle: "Planning opérations", href: "/obsidian/rdv", icon: "🗓️", permission: "obsidian_rdv" },
  { title: "Contrats", subtitle: "Missions", href: "/obsidian/contrats", icon: "📜", permission: "obsidian_contrats" },
  { title: "Statistiques", subtitle: "Chiffres clés", href: "/obsidian/stats", icon: "📊", permission: "obsidian_stats" },
  { title: "Fiches", subtitle: "Personnes / organisations", href: "/obsidian/fiches", icon: "🗂️", permission: "obsidian_stats" },
  { title: "Cahier de vente", subtitle: "Transactions", href: "/cahier-vente", icon: "🧮", permission: "cahier_vente" },
  { title: "Paie & Commissions", subtitle: "Salaires", href: "/obsidian/paie", icon: "💰", permission: "obsidian_paie" },
  { title: "Employés", subtitle: "Membres du personnel", href: "/obsidian/employes", icon: "🧑‍💼", permission: "obsidian_employes" },
  { title: "Code pénal", subtitle: "Articles de loi", href: "/juridique", icon: "📖", permission: "juridique" },
  { title: "Utile SAMP", subtitle: "Intel police", href: "/utile-samp", icon: "🐈", permission: "utile_samp" },
  { title: "Carte enquêteur", subtitle: "Points chauds, dossiers", href: "/carte-enqueteur", icon: "🗺️", permission: "carte-enqueteur" },
  { title: "Calculatrice", subtitle: "Blanchiment", href: "/calculatrice", icon: "🧮", permission: "calculatrice" },
  { title: "Personnalisation", subtitle: "Thème, logo, couleurs", href: "/settings", icon: "🎨", permission: "admin" },
  { title: "Supervision", subtitle: "Vue d'ensemble", href: "/supervision", icon: "📡", permission: "supervision" },
  { title: "Admin", subtitle: "Membres, rôles, diagnostic", href: "/admin", icon: "🛡️", permission: "admin" },
];

const TYPE_COLORS: Record<string,string> = {
  client:"var(--success)", dossier:"var(--info)", stock:"var(--warning)",
  employe:"var(--gold)", article:"#7c3aed", page:"var(--text-dim)",
};
const SECTION_LABELS: Record<string,string> = {
  client:"Fiches", dossier:"Contrats", stock:"Stocks", employe:"Employés",
  article:"Code pénal", page:"Pages",
};

export default function CommandPalette() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);

  // Pages réellement accessibles à CET utilisateur — recalculé seulement quand il
  // change, pas à chaque frappe.
  const accessiblePages = useMemo<Result[]>(() => {
    if (!user) return [];
    return ALL_PAGES
      .filter(p => hasPermission(user, p.permission))
      .map((p, i) => ({ type: "page" as const, id: `page-${i}`, title: p.title, subtitle: p.subtitle, href: p.href, icon: p.icon }));
  }, [user]);

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
    if (!user) { setResults(accessiblePages); return; }

    if (!q.trim()) {
      setResults(accessiblePages);
      return;
    }

    setLoading(true);
    const like = `%${q}%`;
    const ql = q.toLowerCase();

    const queries: any[] = [];
    const sources: string[] = [];

    if (supabase && hasPermission(user, "obsidian_stats")) {
      queries.push(supabase.from("obsidian_fiches").select("id,nom,organisation").ilike("nom", like).limit(5));
      sources.push("client");
    }
    if (supabase && hasPermission(user, "obsidian_contrats")) {
      queries.push(supabase.from("obsidian_contrats").select("id,titre,type").ilike("titre", like).limit(5));
      sources.push("dossier");
    }
    if (supabase && hasPermission(user, "obsidian_stocks")) {
      queries.push(supabase.from("obsidian_stocks").select("id,nom,categorie").ilike("nom", like).limit(5));
      sources.push("stock");
    }
    if (supabase && hasPermission(user, "obsidian_employes")) {
      queries.push(supabase.from("obsidian_employes").select("id,nom,poste").ilike("nom", like).limit(5));
      sources.push("employe");
    }

    const responses = await Promise.all(queries);
    const r: Result[] = [];
    responses.forEach((res, i) => {
      const type = sources[i];
      const data = res.data || [];
      if (type === "client") r.push(...data.map((f: any) => ({ type: "client" as const, id: f.id, title: f.nom, subtitle: f.organisation || "Fiche", href: "/obsidian/fiches", icon: "🗂️" })));
      if (type === "dossier") r.push(...data.map((c: any) => ({ type: "dossier" as const, id: c.id, title: c.titre, subtitle: c.type, href: "/obsidian/contrats", icon: "📜" })));
      if (type === "stock") r.push(...data.map((s: any) => ({ type: "stock" as const, id: s.id, title: s.nom, subtitle: s.categorie || "Stock", href: "/obsidian/stocks", icon: "📦" })));
      if (type === "employe") r.push(...data.map((e: any) => ({ type: "employe" as const, id: e.id, title: e.nom, subtitle: e.poste || "Employé", href: "/obsidian/employes", icon: "🧑‍💼" })));
    });

    // Code pénal : recherche locale (pas de table, article statique) — seulement si accès
    if (hasPermission(user, "juridique")) {
      const articleMatches = CODE_COMPLET
        .filter(a => a.titre.toLowerCase().includes(ql) || a.contenu.toLowerCase().includes(ql))
        .slice(0, 5)
        .map(a => ({ type: "article" as const, id: a.id, title: a.titre, subtitle: "Code pénal", href: "/juridique", icon: "📖" }));
      r.push(...articleMatches);
    }

    const pageMatches = accessiblePages.filter(p => p.title.toLowerCase().includes(ql));
    setResults([...r, ...pageMatches]);
    setLoading(false);
  }, [user, accessiblePages]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => search(query), 200);
      return () => clearTimeout(t);
    }
  }, [query, open, search]);

  useEffect(() => {
    if (open) { setQuery(""); setResults(accessiblePages); setSelected(0); }
  }, [open, accessiblePages]);

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

  let flatIndex = 0;

  return (
    <div className="cmdk-overlay" onClick={e => e.target === e.currentTarget && setOpen(false)}>
      <div className="cmdk-box">
        <div className="cmdk-input-row">
          <span style={{ color:"var(--text-dim)" }}>🔍</span>
          <input
            autoFocus
            placeholder="Rechercher fiches, stocks, employés, code pénal, pages…"
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
              <div className="cmdk-section-label">{SECTION_LABELS[type]}</div>
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
