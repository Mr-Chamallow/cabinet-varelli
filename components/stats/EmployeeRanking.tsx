"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { exportXlsx } from "@/lib/exportXlsx";

const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const PERIODS = [{ k: "week", label: "Semaine", days: 7 }, { k: "month", label: "30 jours", days: 30 }, { k: "all", label: "Tout", days: 0 }];

// Classement par employé : net des actions illégales, arrestations, amendes.
export function EmployeeRanking() {
  const [actions, setActions] = useState<any[]>([]);
  const [arrests, setArrests] = useState<any[]>([]);
  const [period, setPeriod] = useState("month");

  useEffect(() => { load(); }, []);
  useRealtimeTable(["actions_illegales", "arrestations"], load);

  async function load() {
    if (!supabase) return;
    const [{ data: a }, { data: r }] = await Promise.all([
      supabase.from("actions_illegales").select("membre,montant,created_at").limit(5000),
      supabase.from("arrestations").select("membre,amende,argent_perdu,created_at").limit(5000),
    ]);
    setActions(a || []); setArrests(r || []);
  }

  const rows = useMemo(() => {
    const days = PERIODS.find(p => p.k === period)?.days || 0;
    const since = days ? Date.now() - days * 86400_000 : 0;
    const ok = (d: string) => !since || new Date(d).getTime() >= since;
    const m: Record<string, { nom: string; nbActions: number; net: number; nbArrests: number; amendes: number; perdu: number }> = {};
    const get = (nom: string) => (m[nom] ??= { nom, nbActions: 0, net: 0, nbArrests: 0, amendes: 0, perdu: 0 });
    actions.filter(a => ok(a.created_at)).forEach(a => { const r = get(a.membre); r.nbActions++; r.net += Number(a.montant) || 0; });
    arrests.filter(a => ok(a.created_at)).forEach(a => { const r = get(a.membre); r.nbArrests++; r.amendes += Number(a.amende) || 0; r.perdu += Number(a.argent_perdu) || 0; });
    return Object.values(m).sort((a, b) => b.net - a.net);
  }, [actions, arrests, period]);

  const chip = (active: boolean): React.CSSProperties => ({
    padding: "0.25rem 0.75rem", borderRadius: 999, cursor: "pointer", fontSize: "0.72rem", fontFamily: "'Inter',sans-serif",
    border: `1px solid ${active ? "rgba(var(--gold-rgb),0.5)" : "var(--border)"}`, background: active ? "rgba(var(--gold-rgb),0.12)" : "transparent",
    color: active ? "var(--gold)" : "var(--text-muted)", fontWeight: active ? 600 : 400,
  });

  return (
    <div className="card" style={{ marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.875rem" }}>
        <div className="section-title" style={{ marginBottom: 0 }}>🏅 Classement par employé</div>
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
          {PERIODS.map(p => <button key={p.k} onClick={() => setPeriod(p.k)} style={chip(period === p.k)}>{p.label}</button>)}
          <button className="btn btn-outline btn-sm" onClick={() => exportXlsx("classement-employes", { Classement: rows.map(r => ({ Employé: r.nom, "Nb actions": r.nbActions, "Net actions ($)": r.net, "Nb arrestations": r.nbArrests, "Amendes ($)": r.amendes, "Argent perdu ($)": r.perdu })) })}>⬇️ Excel</button>
        </div>
      </div>
      {rows.length === 0 ? (
        <div style={{ color: "var(--text-dim)", textAlign: "center", padding: "1rem", fontSize: "0.82rem" }}>Aucune donnée sur la période</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>#</th><th>Employé</th><th style={{ textAlign: "right" }}>Actions</th><th style={{ textAlign: "right" }}>Net actions</th><th style={{ textAlign: "right" }}>Arrestations</th><th style={{ textAlign: "right" }}>Amendes</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.nom}>
                  <td style={{ color: "var(--text-dim)" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{r.nom}</td>
                  <td style={{ textAlign: "right" }}>{r.nbActions}</td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: r.net >= 0 ? "var(--success)" : "var(--danger)" }}>{fmt(r.net)}</td>
                  <td style={{ textAlign: "right" }}>{r.nbArrests}</td>
                  <td style={{ textAlign: "right", color: r.amendes > 0 ? "var(--warning)" : "var(--text-dim)" }}>{fmt(r.amendes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
