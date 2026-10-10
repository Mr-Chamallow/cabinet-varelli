"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { apiRequest } from "@/lib/apiRequest";
import { ActionType, rowToType, fmtDelai } from "@/lib/actionTypes";

const UNITS = [{ k: "min", label: "minutes", m: 1 }, { k: "h", label: "heures", m: 60 }, { k: "j", label: "jours", m: 1440 }];

function splitDelai(min: number): { val: number; unit: string } {
  if (min > 0 && min % 1440 === 0) return { val: min / 1440, unit: "j" };
  if (min > 0 && min % 60 === 0) return { val: min / 60, unit: "h" };
  return { val: min, unit: "min" };
}

export function ActionsTab() {
  const [types, setTypes] = useState<ActionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [draft, setDraft] = useState({ nom: "", icon: "🕶️", val: 0, unit: "h" });

  useEffect(() => { load(); }, []);

  async function load() {
    if (!supabase) { setLoading(false); return; }
    const { data, error } = await supabase.from("actions_illegales_types").select("*").order("ordre").order("nom");
    if (error) setErr(`Table introuvable (as-tu exécuté migration-action-types.sql ?) : ${error.message}`);
    else { setErr(""); setTypes((data || []).map(rowToType)); }
    setLoading(false);
  }

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(""), 2500); }

  async function save(t: ActionType) {
    const r = await apiRequest("/api/admin/action-types", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: t.nom, icon: t.icon, delai_minutes: t.delaiMin, ordre: t.ordre, actif: t.actif }),
    });
    if (!r.ok) { setErr(r.error || "Erreur"); return false; }
    setErr(""); flash("✅ Enregistré"); return true;
  }

  function patch(nom: string, p: Partial<ActionType>) {
    setTypes(list => list.map(t => t.nom === nom ? { ...t, ...p } : t));
  }

  async function add() {
    const nom = draft.nom.trim();
    if (!nom) return;
    if (types.some(t => t.nom.toLowerCase() === nom.toLowerCase())) { setErr("Cette action existe déjà."); return; }
    const m = UNITS.find(u => u.k === draft.unit)?.m || 60;
    const t: ActionType = { nom, icon: draft.icon || "🕶️", delaiMin: Math.max(0, Math.round(Number(draft.val) * m)), ordre: types.length + 1, actif: true };
    if (await save(t)) { setDraft({ nom: "", icon: "🕶️", val: 0, unit: "h" }); load(); }
  }

  async function remove(nom: string) {
    if (!window.confirm(`Supprimer « ${nom} » ? L'historique déjà enregistré est conservé.`)) return;
    const r = await apiRequest("/api/admin/action-types", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom }) });
    if (!r.ok) { setErr(r.error || "Erreur"); return; }
    setTypes(list => list.filter(t => t.nom !== nom)); flash("🗑️ Supprimé");
  }

  if (loading) return <div style={{ color: "var(--text-dim)" }}>Chargement…</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div className="section-title">Actions illégales ({types.length})</div>
        {msg && <span style={{ fontSize: "0.8rem", color: "var(--success)" }}>{msg}</span>}
      </div>
      <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "1rem" }}>
        Règle le délai de réutilisation (par personne) de chaque action, ou crées-en de nouvelles. « 0 » = sans délai.
        Le nom ne peut pas être modifié après création (il est lié à l'historique) : supprime et recrée si besoin.
      </p>
      {err && <div className="card" style={{ padding: "0.6rem 0.9rem", marginBottom: "0.75rem", color: "var(--danger)", fontSize: "0.8rem" }}>{err}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {types.map(t => {
          const { val, unit } = splitDelai(t.delaiMin);
          return (
            <div key={t.nom} className="card" style={{ padding: "0.6rem 0.9rem", opacity: t.actif ? 1 : 0.55 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                <input value={t.icon} onChange={e => patch(t.nom, { icon: e.target.value })} onBlur={() => save(t)} style={{ width: 54, textAlign: "center", fontSize: "1.1rem" }} maxLength={4} />
                <div style={{ flex: 1, minWidth: 130, fontWeight: 600 }}>{t.nom}
                  <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", fontWeight: 400 }}>Délai : {fmtDelai(t.delaiMin)}</div>
                </div>
                <input type="number" min="0" value={val} style={{ width: 80 }}
                  onChange={e => { const m = UNITS.find(u => u.k === unit)?.m || 60; patch(t.nom, { delaiMin: Math.max(0, Math.round(Number(e.target.value) * m)) }); }}
                  onBlur={() => save(t)} />
                <select value={unit} style={{ width: 100 }}
                  onChange={e => { const m = UNITS.find(u => u.k === e.target.value)?.m || 60; const nt = { ...t, delaiMin: val * m }; patch(t.nom, { delaiMin: nt.delaiMin }); save(nt); }}>
                  {UNITS.map(u => <option key={u.k} value={u.k}>{u.label}</option>)}
                </select>
                <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "var(--text-muted)", cursor: "pointer" }}>
                  <input type="checkbox" checked={t.actif} style={{ width: "auto" }} onChange={e => { const nt = { ...t, actif: e.target.checked }; patch(t.nom, { actif: e.target.checked }); save(nt); }} /> Active
                </label>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => remove(t.nom)}>🗑️</button>
              </div>
            </div>
          );
        })}
        {types.length === 0 && !err && <div className="empty-state"><div className="empty-icon">🕶️</div><div className="empty-title">Aucune action</div></div>}
      </div>

      <div className="section-title" style={{ marginBottom: "0.5rem" }}>+ Nouvelle action</div>
      <div className="card" style={{ padding: "0.75rem 0.9rem" }}>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
          <input value={draft.icon} onChange={e => setDraft({ ...draft, icon: e.target.value })} style={{ width: 54, textAlign: "center", fontSize: "1.1rem" }} maxLength={4} />
          <input value={draft.nom} onChange={e => setDraft({ ...draft, nom: e.target.value })} placeholder="Nom (ex : Braquage de fourgon)" style={{ flex: 1, minWidth: 180 }} />
          <input type="number" min="0" value={draft.val} onChange={e => setDraft({ ...draft, val: Number(e.target.value) })} style={{ width: 80 }} />
          <select value={draft.unit} onChange={e => setDraft({ ...draft, unit: e.target.value })} style={{ width: 100 }}>
            {UNITS.map(u => <option key={u.k} value={u.k}>{u.label}</option>)}
          </select>
          <button className="btn btn-gold" disabled={!draft.nom.trim()} onClick={add}>Ajouter</button>
        </div>
      </div>
    </div>
  );
}
