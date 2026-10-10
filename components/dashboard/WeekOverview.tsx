"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRealtimeTable } from "@/lib/useRealtimeTable";
import { CountUp } from "@/components/ui/CountUp";
import { ActionType, DEFAULT_ACTION_TYPES, rowToType, fmtDelai } from "@/lib/actionTypes";

const fmt = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
function pad(n: number) { return String(n).padStart(2, "0"); }
function countdown(ms: number) { const s = Math.max(0, Math.floor(ms / 1000)); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`; }
function mondayISO() { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); d.setHours(0, 0, 0, 0); return d.toISOString(); }

// Bloc du Dashboard : arrestations, amendes (hors solde), net des actions de la semaine et timers de délai.
export function WeekOverview({ showActions, showArrests }: { showActions: boolean; showArrests: boolean }) {
  const [arrests, setArrests] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [last, setLast] = useState<any[]>([]);
  const [types, setTypes] = useState<ActionType[]>(DEFAULT_ACTION_TYPES);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { load(); }, []);
  useRealtimeTable(["arrestations", "actions_illegales", "actions_illegales_types"], load);
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);

  async function load() {
    if (!supabase) return;
    const since = mondayISO();
    const [{ data: a }, { data: ac }, { data: ty, error: tyErr }, { data: lastRows }] = await Promise.all([
      supabase.from("arrestations").select("amende,argent_perdu,created_at").gte("created_at", since),
      supabase.from("actions_illegales").select("montant,created_at").gte("created_at", since),
      supabase.from("actions_illegales_types").select("*").order("ordre"),
      supabase.from("actions_illegales").select("membre,action,created_at").order("created_at", { ascending: false }).limit(500),
    ]);
    setArrests(a || []); setActions(ac || []); setLast(lastRows || []);
    if (!tyErr && ty && ty.length) setTypes(ty.map(rowToType));
  }

  const amendes = arrests.reduce((s, a) => s + (Number(a.amende) || 0), 0);
  const netActions = actions.reduce((s, a) => s + (Number(a.montant) || 0), 0);

  // Délais en cours : par action avec délai, qui est encore en attente.
  const timers = useMemo(() => {
    const lastBy = new Map<string, number>();
    last.forEach(e => { const k = `${e.action}||${e.membre}`; const t = new Date(e.created_at).getTime(); if (!lastBy.has(k) || t > (lastBy.get(k) as number)) lastBy.set(k, t); });
    return types.filter(t => t.actif && t.delaiMin > 0).map(t => {
      const waiting: { membre: string; ms: number }[] = [];
      lastBy.forEach((ts, k) => {
        const [action, membre] = k.split("||");
        if (action !== t.nom) return;
        const ms = ts + t.delaiMin * 60_000 - now;
        if (ms > 0) waiting.push({ membre, ms });
      });
      waiting.sort((a, b) => a.ms - b.ms);
      return { type: t, waiting };
    });
  }, [last, types, now]);

  if (!showActions && !showArrests) return null;

  const card = (label: string, value: React.ReactNode, color: string, sub?: string, href?: string) => (
    <a href={href} style={{ textDecoration: "none" }} className="stagger-item">
      <div className="stat-card">
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color, fontSize: "1.3rem" }}>{value}</div>
        {sub && <div style={{ fontSize: "0.65rem", color: "var(--text-dim)", marginTop: "0.3rem" }}>{sub}</div>}
      </div>
    </a>
  );

  return (
    <div style={{ marginBottom: "1.75rem" }}>
      <div className="section-title" style={{ marginBottom: "0.75rem" }}>📅 Cette semaine</div>
      <div className="stat-grid" style={{ marginBottom: "1rem" }}>
        {showArrests && card("Arrestations", <CountUp value={arrests.length} />, "var(--text)", undefined, "/obsidian/arrestations")}
        {showArrests && card("Amendes (hors solde)", <CountUp value={amendes} format={fmt} />, "var(--warning)", "non déduites du solde", "/obsidian/arrestations")}
        {showActions && card("Net actions illégales", <CountUp value={netActions} format={fmt} />, netActions >= 0 ? "var(--success)" : "var(--danger)", `${actions.length} action${actions.length > 1 ? "s" : ""}`, "/obsidian/actions-illegales")}
      </div>
      {showActions && timers.map(({ type, waiting }) => (
        <div key={type.nom} className="card" style={{ marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <span>{type.icon}</span><span style={{ fontWeight: 700, fontSize: "0.85rem" }}>{type.nom}</span>
            <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>1 fois toutes les {fmtDelai(type.delaiMin)}</span>
            <a href="/obsidian/actions-illegales" className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }}>Détails →</a>
          </div>
          {waiting.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: "var(--success)" }}>✅ Tout le monde est disponible</div>
          ) : (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {waiting.map(w => (
                <span key={w.membre} style={{ fontSize: "0.75rem", padding: "0.2rem 0.65rem", borderRadius: 999, background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", color: "var(--warning)" }}>
                  {w.membre} · <b style={{ fontFamily: "var(--font-mono)" }}>{countdown(w.ms)}</b>
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
