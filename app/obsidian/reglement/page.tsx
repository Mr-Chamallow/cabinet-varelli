"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/lib/useToast";
import { Toast } from "@/components/ui/Toast";
import { dbw } from "@/lib/dbw";
import { useGmAccess } from "@/components/gm/bits";
import { SECTIONS, MISSIONS } from "@/lib/reglementContenu";
import { DEFAUTS, DROGUES_ORGA, PRODUIT_DEFAUT, REVENDIQUE_DEFAUT, REGLES_LIENS, REGLES_VU_LE, estKevlar, vehInterdits } from "@/lib/regles";

export default function ReglementPage() {
  const { canWrite } = useGmAccess("obsidian_reglement");
  const { toast, showToast } = useToast();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [prod, setProd] = useState<string[]>(PRODUIT_DEFAUT);
  const [revend, setRevend] = useState<string[]>(REVENDIQUE_DEFAUT);
  const [effMax, setEffMax] = useState<number>(DEFAUTS.effectifMax);
  const [kevMax, setKevMax] = useState<number>(DEFAUTS.kevlarMax);
  const [effectif, setEffectif] = useState<number | null>(null);
  const [kevlar, setKevlar] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showInterdits, setShowInterdits] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    Promise.all([
      supabase.from("obsidian_settings").select("*").eq("id", "default").maybeSingle(),
      supabase.from("obsidian_employes").select("actif"),
      supabase.from("obsidian_stocks").select("nom,categorie,quantite"),
    ]).then(([{ data: s }, { data: e }, { data: st }]) => {
      if (s) {
        if (Array.isArray(s.drogues_produites)) setProd(s.drogues_produites);
        if (Array.isArray(s.drogues_revendiquees)) setRevend(s.drogues_revendiquees);
        if (s.effectif_max) setEffMax(Number(s.effectif_max));
        if (s.kevlar_max) setKevMax(Number(s.kevlar_max));
      }
      setEffectif((e || []).filter((x: any) => x.actif !== false).length);
      setKevlar((st || []).filter(estKevlar).reduce((a: number, x: any) => a + (Number(x.quantite) || 0), 0));
    });
  }, []);

  const toggle = (list: string[], set: (v: string[]) => void, d: string) => set(list.includes(d) ? list.filter(x => x !== d) : [...list, d]);
  async function saveReglages() {
    setSaving(true);
    const r = await dbw.upsert("obsidian_settings", { id: "default", drogues_produites: prod, drogues_revendiquees: revend, effectif_max: effMax, kevlar_max: kevMax });
    setSaving(false);
    if (r.error) showToast(`Erreur : ${r.error.message}`, "danger"); else showToast("Réglages enregistrés");
  }

  const ql = q.trim().toLowerCase();
  const sections = useMemo(() => SECTIONS.filter(s => !ql || s.titre.toLowerCase().includes(ql) || s.points.some(p => p.toLowerCase().includes(ql))), [ql]);
  const alertes: string[] = [];
  if (prod.length > DEFAUTS.productionMax) alertes.push(`${prod.length} drogues produites : le règlement limite à ${DEFAUTS.productionMax}.`);
  if (revend.length > DEFAUTS.revendicationMax) alertes.push(`${revend.length} drogues revendiquées : le règlement limite à ${DEFAUTS.revendicationMax}.`);
  if (effectif != null && effectif > effMax) alertes.push(`Effectif de ${effectif} : maximum ${effMax} en OP.`);
  if (kevlar != null && kevlar > kevMax) alertes.push(`${kevlar} kevlars en stock : maximum ${kevMax} (un par joueur).`);
  if (revend.some(d => !prod.includes(d))) alertes.push("Une drogue revendiquée n'est pas dans les drogues produites.");

  const card: React.CSSProperties = { padding: "0.85rem 1rem" };
  return (
    <div className="page-container">
      <a className="back-link" href="/">Dashboard</a>
      <div className="page-header">
        <div><h1 className="page-title">📘 Règlement FlashBackFA</h1><p className="page-subtitle">Tout ce qui concerne notre organisation · vu le {REGLES_VU_LE}</p><div className="gold-line" /></div>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Effectif</div><div className="stat-value" style={{ fontSize: "1.4rem", color: effectif != null && effectif > effMax ? "var(--danger)" : "var(--text)" }}>{effectif ?? "?"} / {effMax}</div></div>
        <div className="stat-card"><div className="stat-label">Kevlar en stock</div><div className="stat-value" style={{ fontSize: "1.4rem", color: kevlar != null && kevlar > kevMax ? "var(--danger)" : "var(--text)" }}>{kevlar ?? "?"} / {kevMax}</div></div>
        <div className="stat-card"><div className="stat-label">Drogues produites</div><div className="stat-value" style={{ fontSize: "1.4rem" }}>{prod.length} / {DEFAUTS.productionMax}</div></div>
        <div className="stat-card"><div className="stat-label">Revendiquées</div><div className="stat-value" style={{ fontSize: "1.4rem" }}>{revend.length} / {DEFAUTS.revendicationMax}</div></div>
      </div>
      {alertes.map((a, i) => <div key={i} style={{ fontSize: "0.8rem", color: "var(--warning)", margin: "0.4rem 0" }}>⚠️ {a}</div>)}

      <div className="card" style={{ ...card, margin: "1rem 0" }}>
        <div className="section-title" style={{ marginBottom: "0.6rem" }}>⚙️ Nos réglages de conformité</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "1rem" }}>
          <div>
            <label>Drogues produites (max {DEFAUTS.productionMax})</label>
            {DROGUES_ORGA.map(d => <label key={d} style={{ display: "flex", gap: "0.4rem", fontSize: "0.82rem", cursor: canWrite ? "pointer" : "default" }}><input type="checkbox" style={{ width: "auto" }} disabled={!canWrite} checked={prod.includes(d)} onChange={() => toggle(prod, setProd, d)} /> {d}</label>)}
          </div>
          <div>
            <label>Drogues revendiquées (max {DEFAUTS.revendicationMax})</label>
            {DROGUES_ORGA.map(d => <label key={d} style={{ display: "flex", gap: "0.4rem", fontSize: "0.82rem", cursor: canWrite ? "pointer" : "default" }}><input type="checkbox" style={{ width: "auto" }} disabled={!canWrite} checked={revend.includes(d)} onChange={() => toggle(revend, setRevend, d)} /> {d}</label>)}
          </div>
          <div>
            <label>Effectif maximum (OP)</label><input type="number" min={1} disabled={!canWrite} value={effMax} onChange={e => setEffMax(Number(e.target.value) || 1)} />
            <label style={{ marginTop: "0.5rem", display: "block" }}>Kevlar maximum</label><input type="number" min={0} disabled={!canWrite} value={kevMax} onChange={e => setKevMax(Number(e.target.value) || 0)} />
          </div>
        </div>
        {canWrite && <div style={{ marginTop: "0.8rem" }}><button className="btn btn-gold" disabled={saving} onClick={saveReglages}>{saving ? "..." : "Enregistrer"}</button></div>}
      </div>

      <div className="card" style={{ ...card, marginBottom: "1rem" }}>
        <div className="section-title" style={{ marginBottom: "0.6rem" }}>🧭 Qui fait quoi chez Obsidian</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: "0.8rem" }}>
          {Object.values(MISSIONS).map(m => (
            <div key={m.titre} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.6rem 0.8rem" }}>
              <div style={{ fontWeight: 700, marginBottom: "0.3rem" }}>{m.icon} {m.titre}</div>
              <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.76rem", color: "var(--text-muted)" }}>{m.missions.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.8rem", flexWrap: "wrap", alignItems: "center" }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Chercher une règle (kevlar, rançon, labo...)" style={{ flex: 1, minWidth: 220 }} />
        <button className="btn btn-outline btn-sm" onClick={() => setOpen(Object.fromEntries(sections.map(s => [s.id, true])))}>Tout ouvrir</button>
        <button className="btn btn-outline btn-sm" onClick={() => setOpen({})}>Tout fermer</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {sections.map(s => {
          const isOpen = !!ql || !!open[s.id];
          return (
            <div key={s.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <button type="button" onClick={() => setOpen(o => ({ ...o, [s.id]: !o[s.id] }))} style={{ width: "100%", textAlign: "left", background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "0.75rem 1rem", display: "flex", gap: "0.6rem", alignItems: "center", fontFamily: "inherit" }}>
                <span style={{ fontSize: "1.1rem" }}>{s.icon}</span><span style={{ fontWeight: 700, flex: 1 }}>{s.titre}</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>{s.points.length} règles {isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && (
                <div style={{ padding: "0 1rem 0.8rem" }}>
                  <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.82rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {s.points.map((p, i) => <li key={i} style={ql && p.toLowerCase().includes(ql) ? { color: "var(--gold)" } : undefined}>{p}</li>)}
                  </ul>
                  {s.id === "vehicules" && (
                    <div style={{ marginTop: "0.6rem" }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setShowInterdits(v => !v)}>{showInterdits ? "Masquer" : "Voir"} les véhicules à éviter</button>
                      {showInterdits && <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                        {vehInterdits().map(({ v, note }) => <span key={v.code} title={note.texte} style={{ fontSize: "0.68rem", padding: "0.1rem 0.5rem", borderRadius: 999, border: "1px solid rgba(239,68,68,.3)", color: "var(--danger)" }}>{v.nom}</span>)}
                      </div>}
                    </div>
                  )}
                  <div style={{ marginTop: "0.6rem", fontSize: "0.7rem", color: "var(--text-dim)" }}>Source : <a href={REGLES_LIENS[s.source]} target="_blank" rel="noreferrer" style={{ color: "var(--gold)" }}>règlement FlashBackFA</a> (vu le {REGLES_VU_LE})</div>
                </div>
              )}
            </div>
          );
        })}
        {sections.length === 0 && <div className="empty-state"><div className="empty-icon">🔎</div><div className="empty-title">Aucune règle trouvée</div></div>}
      </div>
      <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "1rem" }}>Résumé reformulé : en cas de doute, le règlement officiel fait foi. Les alertes de l'app sont informatives et ne bloquent jamais la saisie.</div>
      <Toast toast={toast} />
    </div>
  );
}
