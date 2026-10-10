"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { fmt } from "@/components/hub/Charts";

// Onglet « Blanchiment » de la page Transaction : convertit de l'argent sale en argent propre avec un taux de perte.
export function BlanchimentPanel({ onDone }: { onDone?: () => void }) {
  const { user } = useCurrentUser();
  const [montant, setMontant] = useState(0);
  const [taux, setTaux] = useState(20);
  const [membre, setMembre] = useState("");
  const [notes, setNotes] = useState("");
  const [emps, setEmps] = useState<string[]>([]);
  const [hist, setHist] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const propre = Math.round(montant * (1 - taux / 100));

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from("obsidian_comptabilite").select("*").eq("source", "blanchiment").eq("type", "dépense").order("created_at", { ascending: false }).limit(15);
    setHist(data || []);
  }
  useEffect(() => { load(); supabase?.from("obsidian_employes").select("nom,actif").order("nom").then(({ data }) => setEmps((data || []).filter((e: any) => e.actif !== false).map((e: any) => e.nom))); }, []);

  async function go() {
    setBusy(true); setMsg("");
    const r = await fetch("/api/obsidian/blanchiment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ montant, taux, membre, notes, created_by: user?.nom }) });
    const d = await r.json(); setBusy(false);
    if (!r.ok) { setMsg("❌ " + d.error); return; }
    setMsg(`✅ ${fmt(montant)} sales → ${fmt(d.propre)} propres (frais ${fmt(d.frais)})`); setMontant(0); setNotes(""); load(); onDone?.();
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "1.5rem" }}>
      <div className="card">
        <div className="section-title" style={{ marginBottom: "1rem" }}>🧼 Blanchir de l'argent</div>
        <div className="form-group"><label>Montant d'argent sale ($) *</label><input type="number" min={0} value={montant || ""} onChange={e => setMontant(+e.target.value)} style={{ fontWeight: 700, fontSize: "1.1rem" }} /></div>
        <div className="form-group"><label>Taux de perte (%)</label><input type="number" min={0} max={100} value={taux} onChange={e => setTaux(+e.target.value)} /></div>
        <div className="form-group"><label>Employé</label><select value={membre} onChange={e => setMembre(e.target.value)}><option value="">— Aucun —</option>{emps.map(n => <option key={n}>{n}</option>)}</select></div>
        <div className="form-group"><label>Notes</label><input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: via le Casino" /></div>
        <button className="btn btn-gold" disabled={busy || montant <= 0} onClick={go} style={{ width: "100%", justifyContent: "center" }}>{busy ? "…" : "🧼 Blanchir"}</button>
        {msg && <div style={{ marginTop: 10, fontSize: "0.82rem" }}>{msg}</div>}
      </div>
      <div className="card">
        <div className="section-title" style={{ marginBottom: "0.9rem" }}>Aperçu</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.85rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Argent sale sorti</span><b style={{ color: "var(--danger)" }}>−{fmt(montant)}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Argent propre reçu</span><b style={{ color: "var(--success)" }}>+{fmt(propre)}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 8 }}><span>Frais de blanchiment (dépense réelle)</span><b style={{ color: "var(--warning)" }}>{fmt(montant - propre)}</b></div>
        </div>
        <div className="section-title" style={{ margin: "1.2rem 0 0.6rem" }}>Derniers blanchiments</div>
        {hist.length === 0 ? <div style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>Aucun.</div> : hist.map(h => <div key={h.id} style={{ fontSize: "0.74rem", padding: "0.3rem 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", gap: 8 }}><span style={{ color: "var(--text-muted)" }}>{new Date(h.created_at).toLocaleDateString("fr-FR")} · {h.membre || h.created_by}</span><b>{fmt(Number(h.montant))}</b></div>)}
      </div>
    </div>
  );
}
