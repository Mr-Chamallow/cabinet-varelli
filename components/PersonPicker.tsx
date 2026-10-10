"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Choix d'une personne depuis la Base de données (+ Fiches) : plus de saisie libre.
export function usePersonnes() {
  const [list, setList] = useState<{ nom: string; source: string; href: string }[]>([]);
  useEffect(() => {
    if (!supabase) return; let off = false;
    Promise.all([supabase.from("bdd_personnes").select("id,nom,prenom"), supabase.from("obsidian_fiches").select("id,nom,type")]).then(([p, f]) => {
      if (off) return; const seen = new Set<string>(); const out: { nom: string; source: string; href: string }[] = [];
      (p.data || []).forEach((x: any) => { const n = `${x.prenom || ""} ${x.nom || ""}`.trim(); if (n && !seen.has(n.toLowerCase())) { seen.add(n.toLowerCase()); out.push({ nom: n, source: "Base de données", href: `/base-de-donnees?personne=${x.id}` }); } });
      (f.data || []).forEach((x: any) => { const n = (x.nom || "").trim(); if (n && !seen.has(n.toLowerCase())) { seen.add(n.toLowerCase()); out.push({ nom: n, source: "Fiches", href: `/obsidian/fiches?fiche=${x.id}` }); } });
      out.sort((a, b) => a.nom.localeCompare(b.nom)); setList(out);
    });
    return () => { off = true; };
  }, []);
  return list;
}

export function PersonPicker({ value, onChange, placeholder = " -  Aucune personne  - " }: { value: string; onChange: (nom: string) => void; placeholder?: string }) {
  const list = usePersonnes();
  const [q, setQ] = useState("");
  const known = !value || list.some(p => p.nom === value);
  const shown = list.filter(p => !q || p.nom.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <input placeholder="🔍 Filtrer..." value={q} onChange={e => setQ(e.target.value)} style={{ marginBottom: 4 }} />
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {!known && <option value={value}>{value} (hors référentiel)</option>}
        {["Base de données", "Fiches"].map(src => { const l = shown.filter(p => p.source === src); return l.length ? <optgroup key={src} label={src}>{l.map(p => <option key={p.nom} value={p.nom}>{p.nom}</option>)}</optgroup> : null; })}
      </select>
      {value && list.find(p => p.nom === value) && <a href={list.find(p => p.nom === value)!.href} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginTop: 6 }}>↗ Ouvrir le profil</a>}
      <div style={{ fontSize: "0.65rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>Absent ? Crée-la dans <a href="/base-de-donnees" style={{ color: "var(--gold)" }}>Base de données</a> ou <a href="/obsidian/fiches" style={{ color: "var(--gold)" }}>Fiches</a>.</div>
    </div>
  );
}

// Choix d'un membre (employé) : juge, procureur, avocat... plus de saisie libre.
export function EmployeePicker({ value, onChange, placeholder = " -  Choisir un membre  - " }: { value: string; onChange: (nom: string) => void; placeholder?: string }) {
  const [list, setList] = useState<{ nom: string; role: string }[]>([]);
  useEffect(() => { if (!supabase) return; supabase.from("obsidian_employes").select("nom,role,actif").order("nom").then(({ data }) => setList((data || []).filter((e: any) => e.actif !== false))); }, []);
  const known = !value || list.some(e => e.nom === value);
  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {!known && <option value={value}>{value} (hors annuaire)</option>}
      {list.map(e => <option key={e.nom} value={e.nom}>{e.nom}{e.role ? ` - ${e.role}` : ""}</option>)}
    </select>
  );
}
