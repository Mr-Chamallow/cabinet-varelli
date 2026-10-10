"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission } from "@/lib/auth";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useToast } from "@/lib/useToast";
import { Toast } from "@/components/ui/Toast";
import { Panel, DataTable, Kpi, fmt } from "@/components/hub/Charts";
import { roleLabel } from "@/components/EmployeeCard";

// Profil central : tout ce que le système sait d'une personne (employé, fiche, base de données, activité), photo partagée.
function Inner() {
  const { user, loading: userLoading } = useCurrentUser();
  const { toast, showToast } = useToast();
  useEffect(() => { if (!userLoading && (!user || !hasPermission(user, "obsidian_fiches"))) window.location.href = "/"; }, [user, userLoading]);
  const [names, setNames] = useState<string[]>([]);
  const [nom, setNom] = useState("");
  const [d, setD] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const p = new URLSearchParams(window.location.search).get("nom"); if (p) setNom(p);
    Promise.all([supabase.from("obsidian_employes").select("nom"), supabase.from("obsidian_fiches").select("nom").is("deleted_at", null), supabase.from("bdd_personnes").select("nom,prenom")]).then(([e, f, b]) =>
      setNames([...new Set([...(e.data || []).map((x: any) => x.nom), ...(f.data || []).map((x: any) => x.nom), ...(b.data || []).map((x: any) => `${x.prenom || ""} ${x.nom || ""}`.trim())])].filter(Boolean).sort((a, b) => a.localeCompare(b))));
  }, []);

  async function load(n: string) {
    if (!supabase || !n.trim()) { setD(null); return; }
    setBusy(true);
    const q = n.trim(); const like = `%${q}%`;
    const [emp, fic, bdd, act, arr, ctr, rdv, gar] = await Promise.all([
      supabase.from("obsidian_employes").select("*").ilike("nom", q).maybeSingle(),
      supabase.from("obsidian_fiches").select("*").is("deleted_at", null).ilike("nom", q).maybeSingle(),
      supabase.from("bdd_personnes").select("*").or(`nom.ilike.${like},prenom.ilike.${like}`).limit(5),
      supabase.from("actions_illegales").select("*").ilike("membre", q).order("created_at", { ascending: false }).limit(50),
      supabase.from("arrestations").select("*").ilike("membre", q).order("created_at", { ascending: false }).limit(50),
      supabase.from("obsidian_contrats").select("titre,statut,recompense,membres_affectes").contains("membres_affectes", [q]),
      supabase.from("obsidian_rdv").select("titre,date,heure,client").or(`client.ilike.${q},partage_avec.cs.{${q}}`).limit(20),
      supabase.from("obsidian_garage").select("modele,plaque,photo_url").ilike("assigne_a", q),
    ]);
    const parts = q.toLowerCase().split(/\s+/);
    const pers = (bdd.data || []).find((p: any) => parts.every(t => `${p.prenom || ""} ${p.nom || ""}`.toLowerCase().includes(t))) || null;
    setD({ q, emp: emp.data, fiche: fic.data, pers, actions: act.data || [], arrests: arr.data || [], contrats: ctr.data || [], rdv: rdv.data || [], garage: gar.data || [] });
    setBusy(false);
  }
  useEffect(() => { if (nom) load(nom); /* eslint-disable-next-line */ }, [nom]);

  const photo = d?.emp?.photo_url || d?.fiche?.photo_url || d?.pers?.photo_police || null;
  const net = useMemo(() => (d ? d.actions.reduce((s: number, a: any) => s + (Number(a.montant) || 0), 0) : 0), [d]);

  async function syncPhoto() {
    if (!supabase || !photo || !d) return;
    if (d.emp) await fetch("/api/obsidian/employes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: d.emp.id, photo_url: photo }) });
    if (d.fiche) await supabase.from("obsidian_fiches").update({ photo_url: photo }).eq("id", d.fiche.id);
    if (d.pers) await supabase.from("bdd_personnes").update({ photo_police: photo }).eq("id", d.pers.id);
    showToast("Photo synchronisée partout"); load(d.q);
  }

  return (
    <div className="page-container">
      <a className="back-link" href="/obsidian">Dashboard Obsidian</a>
      <div className="page-header"><div><h1 className="page-title">🧬 Profil central</h1><p className="page-subtitle">Une personne = un seul profil : employé, fiche, base de données, activité</p><div className="gold-line" /></div></div>
      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input list="profil-names" placeholder="Nom Prénom..." value={nom} onChange={e => setNom(e.target.value)} style={{ maxWidth: 360 }} />
        <datalist id="profil-names">{names.map(n => <option key={n} value={n} />)}</datalist>
      </div>
      {busy ? <LoadingBlock /> : !d ? <div className="empty-state"><div className="empty-icon">🧬</div><div className="empty-title">Choisis une personne</div></div> :
        !d.emp && !d.fiche && !d.pers ? <div className="empty-state"><div className="empty-icon">❔</div><div className="empty-title">Aucun profil pour « {d.q} »</div></div> : <>
          <div className="card" style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            <div style={{ width: 96, height: 120, borderRadius: 8, overflow: "hidden", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: "0.7rem" }}>
              {photo ? <img src={photo} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "Pas de photo"}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>{d.q}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{d.emp ? `Employé · ${roleLabel(d.emp.role, d.emp.genre)}` : d.fiche ? `Fiche · ${d.fiche.organisation || " - "}` : "Base de données"}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", fontSize: "0.7rem" }}>
                {[["Employé", d.emp], ["Fiche", d.fiche], ["Base de données", d.pers]].map(([l, v]: any) => <span key={l} style={{ padding: "2px 8px", borderRadius: 999, border: "1px solid var(--border)", background: v ? "var(--gold-muted)" : "var(--surface)", color: v ? "var(--gold)" : "var(--text-dim)" }}>{v ? "OK" : "✗"} {l}</span>)}
              </div>
            </div>
            {photo && <button className="btn btn-outline btn-sm" onClick={syncPhoto}>📷 Photo partagée : appliquer partout</button>}
          </div>
          <div className="stat-grid" style={{ marginBottom: "1.25rem" }}>
            <Kpi label="Actions illégales" value={d.actions.length} /><Kpi label="Net des actions" value={fmt(net)} color={net >= 0 ? "var(--success)" : "var(--danger)"} />
            <Kpi label="Arrestations" value={d.arrests.length} color="var(--warning)" /><Kpi label="Contrats" value={d.contrats.length} />
            <Kpi label="Véhicules assignés" value={d.garage.length} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: "1.25rem" }}>
            <Panel title="Dernières actions"><DataTable empty="Aucune action." head={["Date", "Action", "Montant"]} rows={d.actions.slice(0, 8).map((a: any) => [new Date(a.created_at).toLocaleDateString("fr-FR"), a.action, <b style={{ color: Number(a.montant) >= 0 ? "var(--success)" : "var(--danger)" }}>{fmt(Number(a.montant))}</b>])} /></Panel>
            <Panel title="Arrestations"><DataTable empty="Casier vierge." head={["Date", "Amende", "Perdu"]} rows={d.arrests.slice(0, 8).map((a: any) => [new Date(a.created_at).toLocaleDateString("fr-FR"), fmt(Number(a.amende)), fmt(Number(a.argent_perdu))])} /></Panel>
            <Panel title="Contrats"><DataTable empty="Aucun contrat." head={["Contrat", "Statut", "Récompense"]} rows={d.contrats.map((c: any) => [c.titre, c.statut, fmt(Number(c.recompense))])} /></Panel>
            <Panel title="Rendez-vous"><DataTable empty="Aucun RDV." head={["RDV", "Date"]} rows={d.rdv.map((r: any) => [r.titre, `${r.date || ""} ${r.heure || ""}`])} /></Panel>
            <Panel title="Véhicules"><DataTable empty="Aucun véhicule." head={["Modèle", "Plaque"]} rows={d.garage.map((g: any) => [g.modele, g.plaque])} /></Panel>
            {d.fiche && <Panel title="Fiche"><a className="btn btn-outline btn-sm" href="/obsidian/fiches">Ouvrir dans Fiches {'->'}</a></Panel>}
          </div>
        </>}
      <Toast toast={toast} />
    </div>
  );
}
export default function ProfilPage() { return <Suspense fallback={<LoadingBlock />}><Inner /></Suspense>; }
