"use client";
import { useEffect, useState } from "react";

// Profil psychologique d'un personnage (RP) : archétype, traits notés, moteurs, peurs, comportements, relations.
export interface Psy {
  archetype?: string; devise?: string; resume?: string;
  traits?: Record<string, number>;
  motivations?: string; peurs?: string; forces?: string; faiblesses?: string;
  pression?: string; argent?: string; pouvoir?: string; autorite?: string;
  voix?: string; tics?: string; allies?: string; ennemis?: string; accroches?: string;
}
export const TRAITS = ["Sang-froid", "Contrôle", "Empathie", "Ambition", "Paranoïa", "Impulsivité", "Loyauté", "Charisme"] as const;
const BLOCS: [keyof Psy, string, string][] = [
  ["motivations", "🎯 Moteurs", "Ce qui le fait avancer"], ["peurs", "😨 Peurs", "Ce qui le fait vaciller"],
  ["forces", "💪 Forces", ""], ["faiblesses", "🩹 Failles", ""],
  ["pression", "🔥 Sous pression", "Comment il réagit en crise"], ["argent", "💰 Rapport à l'argent", ""],
  ["pouvoir", "👑 Rapport au pouvoir", ""], ["autorite", "⚖️ Rapport à l'autorité / loi", ""],
  ["voix", "🗣️ Façon de parler", ""], ["tics", "🎭 Tics & habitudes", ""],
  ["allies", "🤝 Alliés / affinités", ""], ["ennemis", "☠️ Ennemis / tensions", ""],
  ["accroches", "🎬 Accroches RP", "Idées de scènes à jouer avec lui"],
];

export function ProfilPsy({ value, canEdit, onSave }: { value?: Psy | null; canEdit: boolean; onSave: (p: Psy) => Promise<void> | void }) {
  const [p, setP] = useState<Psy>(value || {});
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setP(value || {}); setEdit(false); }, [value]);
  const empty = !value || Object.keys(value).length === 0;
  const setT = (k: string, v: number) => setP(x => ({ ...x, traits: { ...(x.traits || {}), [k]: v } }));
  async function save() { setBusy(true); await onSave(p); setBusy(false); setEdit(false); }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div className="section-title">🧠 Profil psychologique</div>
        {canEdit && (edit
          ? <div style={{ display: "flex", gap: 6 }}><button className="btn btn-gold btn-sm" disabled={busy} onClick={save}>{busy ? "…" : "✓ Enregistrer"}</button><button className="btn btn-ghost btn-sm" onClick={() => { setP(value || {}); setEdit(false); }}>Annuler</button></div>
          : <button className="btn btn-outline btn-sm" onClick={() => setEdit(true)}>✏️ {empty ? "Créer" : "Modifier"}</button>)}
      </div>
      {empty && !edit && <div style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>Aucun profil psy renseigné.</div>}

      {(edit || p.archetype || p.devise || p.resume) && (
        <div style={{ borderLeft: "3px solid var(--gold)", paddingLeft: 12, marginBottom: 14 }}>
          {edit ? (
            <div style={{ display: "grid", gap: 8 }}>
              <input placeholder="Archétype (ex : L'Arbitre)" value={p.archetype || ""} onChange={e => setP({ ...p, archetype: e.target.value })} />
              <input placeholder="Devise / phrase fétiche" value={p.devise || ""} onChange={e => setP({ ...p, devise: e.target.value })} />
              <textarea rows={3} placeholder="Résumé du profil" value={p.resume || ""} onChange={e => setP({ ...p, resume: e.target.value })} />
            </div>
          ) : (<>
            {p.archetype && <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: "1.15rem", color: "var(--gold)" }}>{p.archetype}</div>}
            {p.devise && <div style={{ fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.82rem", margin: "2px 0 6px" }}>« {p.devise} »</div>}
            {p.resume && <div style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>{p.resume}</div>}
          </>)}
        </div>
      )}

      {(edit || p.traits) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "6px 18px", marginBottom: 14 }}>
          {TRAITS.map(t => { const v = p.traits?.[t] ?? (edit ? 5 : null); if (v === null) return null; return (
            <div key={t}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem" }}><span>{t}</span><b>{v}/10</b></div>
              {edit ? <input type="range" min={0} max={10} value={v} onChange={e => setT(t, +e.target.value)} style={{ width: "100%" }} />
                : <div style={{ height: 6, background: "var(--surface)", borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${v * 10}%`, height: "100%", background: "var(--gold)" }} /></div>}
            </div>); })}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
        {BLOCS.map(([k, label, hint]) => {
          const v = (p[k] as string) || ""; if (!edit && !v) return null;
          return (
            <div key={k}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, marginBottom: 3 }}>{label}</div>
              {edit ? <textarea rows={3} placeholder={hint} value={v} onChange={e => setP({ ...p, [k]: e.target.value })} />
                : <div style={{ fontSize: "0.8rem", whiteSpace: "pre-wrap", color: "var(--text-muted)" }}>{v}</div>}
            </div>);
        })}
      </div>
    </div>
  );
}
