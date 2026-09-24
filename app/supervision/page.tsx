"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { canAccess, getMemberColor } from "@/lib/auth";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { fetchRecentActivity, ACTIVITY_CONFIG, timeAgo, ActivityItem } from "@/lib/activity";

const fmt = (n: number) => (n || 0).toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

interface GlobalStats {
  caSale: number;
  caPropre: number;
  depenses: number;
  stockTotal: number;
  stockValeur: number;
  employesActifs: number;
  employesTotal: number;
  operationsAVenir: number;
  contratsEnCours: number;
}

interface Operation {
  id: string;
  titre: string;
  type: string;
  date: string;
  heure: string;
  lieu: string;
  client?: string;
  statut?: string;
  created_by: string;
}

const TYPE_ICONS: Record<string, string> = {
  "Livraison": "📦", "Braquage": "💰", "Surveillance": "👁️", "Réunion": "👥",
  "Rencontre fournisseur": "🤝", "Récupération": "🔧", "Intimidation": "⚠️",
  "Entraînement": "🎯", "Autre": "📌",
};

export default function SupervisionPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"stats" | "operations" | "activite">("stats");

  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [employesNoms, setEmployesNoms] = useState<string[]>([]);

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [actLoading, setActLoading] = useState(true);
  const [filterMember, setFilterMember] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    if (userLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (!canAccess(user, "supervision")) { setAuthorized(false); setLoading(false); return; }
    setAuthorized(true);
    loadStats();
    loadOperations();
    loadActivity();
  }, [user, userLoading]);

  async function loadStats() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    const [
      { data: compta },
      { data: stocks },
      { data: employes },
      { data: rdvAVenir },
      { count: contratsEnCours },
    ] = await Promise.all([
      supabase.from("obsidian_comptabilite").select("type,montant,type_argent"),
      supabase.from("obsidian_stocks").select("quantite,prix_unitaire"),
      supabase.from("obsidian_employes").select("nom,actif"),
      supabase.from("obsidian_rdv").select("id", { count: "exact", head: true }).gte("date", today),
      supabase.from("obsidian_contrats").select("*", { count: "exact", head: true }).eq("statut", "En cours"),
    ]);

    const recettes = compta || [];
    const caSale = recettes.filter((r: any) => r.type === "recette" && r.type_argent === "sale").reduce((s: number, r: any) => s + (r.montant || 0), 0);
    const caPropre = recettes.filter((r: any) => r.type === "recette" && r.type_argent === "propre").reduce((s: number, r: any) => s + (r.montant || 0), 0);
    const depenses = recettes.filter((r: any) => r.type === "depense").reduce((s: number, r: any) => s + (r.montant || 0), 0);

    const stockList = stocks || [];
    const stockTotal = stockList.reduce((s: number, r: any) => s + (r.quantite || 0), 0);
    const stockValeur = stockList.reduce((s: number, r: any) => s + (r.quantite || 0) * (r.prix_unitaire || 0), 0);

    const empList = employes || [];
    setEmployesNoms(empList.map((e: any) => e.nom).filter(Boolean).sort());

    setStats({
      caSale, caPropre, depenses,
      stockTotal, stockValeur,
      employesActifs: empList.filter((e: any) => e.actif !== false).length,
      employesTotal: empList.length,
      operationsAVenir: rdvAVenir?.length ?? 0,
      contratsEnCours: contratsEnCours || 0,
    });
    setLoading(false);
  }

  async function loadOperations() {
    if (!supabase) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("obsidian_rdv")
      .select("id,titre,type,date,heure,lieu,client,statut,created_by")
      .gte("date", today)
      .order("date")
      .order("heure")
      .limit(30);
    setOperations(data || []);
  }

  async function loadActivity() {
    setActLoading(true);
    try {
      const items = await fetchRecentActivity(40);
      setActivity(items);
    } finally {
      setActLoading(false);
    }
  }

  const filteredActivity = useMemo(
    () => activity.filter((a) => (!filterMember || a.by === filterMember) && (!filterType || a.type === filterType)),
    [activity, filterMember, filterType]
  );

  const leaderboard = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of activity) counts[a.by] = (counts[a.by] || 0) + 1;
    return Object.entries(counts)
      .filter(([nom]) => nom && nom !== "—")
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [activity]);

  if (userLoading || loading) return <div className="page-container" style={{ color: "var(--text-dim)" }}>Chargement…</div>;
  if (!authorized) {
    return (
      <div className="page-container">
        <div className="empty-state"><div className="empty-icon">🚫</div><div className="empty-title">Accès refusé</div></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <a className="back-link" href="/">← Tableau de bord</a>
      <div className="page-header">
        <div>
          <h1 className="page-title">📡 Supervision</h1>
          <p className="page-subtitle">Stats globales · Opérations en cours · Activité de l'équipe</p>
          <div className="gold-line" />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {([["stats", "📊 Vue d'ensemble"], ["operations", "🗓️ Opérations"], ["activite", "📋 Activité"]] as [string, string][]).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setActiveTab(k as any)}
            style={{
              padding: "0.55rem 1.25rem", borderRadius: "var(--radius)", cursor: "pointer",
              fontFamily: "'Inter',sans-serif", fontSize: "0.85rem", fontWeight: activeTab === k ? 700 : 400,
              background: activeTab === k ? "var(--gold-muted)" : "var(--surface)",
              border: `1px solid ${activeTab === k ? "rgba(var(--gold-rgb), 0.4)" : "var(--border)"}`,
              color: activeTab === k ? "var(--gold)" : "var(--text-muted)", transition: "all 0.15s",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {activeTab === "stats" && stats && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <StatCard icon="💵" label="Trésorerie sale" value={fmt(stats.caSale)} color="#ef4444" />
            <StatCard icon="🏦" label="Trésorerie propre" value={fmt(stats.caPropre)} color="#22c55e" />
            <StatCard icon="📉" label="Dépenses" value={fmt(stats.depenses)} color="#f97316" />
            <StatCard icon="📦" label="Unités en stock" value={stats.stockTotal.toLocaleString("fr-FR")} sub={fmt(stats.stockValeur)} color="#3b82f6" />
            <StatCard icon="👥" label="Employés actifs" value={`${stats.employesActifs}/${stats.employesTotal}`} color="#06b6d4" />
            <StatCard icon="🗓️" label="Opérations à venir" value={String(stats.operationsAVenir)} color="#a78bfa" />
            <StatCard icon="📜" label="Contrats en cours" value={String(stats.contratsEnCours)} color="#eab308" />
          </div>

          {leaderboard.length > 0 && (
            <div className="card">
              <div className="section-title" style={{ marginBottom: "1rem" }}>🏆 Membres les plus actifs (30 derniers jours d'activité enregistrée)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {leaderboard.map(([nom, count], i) => {
                  const max = leaderboard[0][1];
                  const couleur = getMemberColor(undefined, undefined) || "#a78bfa";
                  return (
                    <div key={nom} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ width: 18, fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: 700 }}>#{i + 1}</span>
                      <span style={{ width: 130, fontSize: "0.82rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nom}</span>
                      <div style={{ flex: 1, height: 8, borderRadius: 999, background: "var(--surface)", overflow: "hidden" }}>
                        <div style={{ width: `${(count / max) * 100}%`, height: "100%", background: couleur, borderRadius: 999 }} />
                      </div>
                      <span style={{ width: 28, textAlign: "right", fontSize: "0.75rem", color: "var(--text-dim)", fontFamily: "monospace" }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "operations" && (
        <div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginBottom: "1rem" }}>
            {operations.length} opération{operations.length !== 1 ? "s" : ""} programmée{operations.length !== 1 ? "s" : ""} à partir d'aujourd'hui.
          </p>
          {operations.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🗓️</div><div className="empty-title">Aucune opération à venir</div></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {operations.map((op) => (
                <div key={op.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ fontSize: "1.3rem", flexShrink: 0 }}>{TYPE_ICONS[op.type] || "📌"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{op.titre}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                      {op.type}{op.lieu ? ` · ${op.lieu}` : ""}{op.client ? ` · ${op.client}` : ""} — par {op.created_by}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 700, color: "var(--gold)" }}>{op.date}</div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "var(--text-dim)" }}>{op.heure}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "activite" && (
        <div>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)} style={{ maxWidth: 200 }}>
              <option value="">Tous les membres</option>
              {employesNoms.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            {(Object.keys(ACTIVITY_CONFIG) as (keyof typeof ACTIVITY_CONFIG)[]).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(filterType === t ? "" : t)}
                style={{
                  padding: "0.35rem 0.75rem", borderRadius: 999, cursor: "pointer", fontSize: "0.72rem",
                  fontFamily: "'Inter',sans-serif", fontWeight: filterType === t ? 700 : 400,
                  background: filterType === t ? ACTIVITY_CONFIG[t].color + "18" : "var(--surface)",
                  border: `1px solid ${filterType === t ? ACTIVITY_CONFIG[t].color + "40" : "var(--border)"}`,
                  color: filterType === t ? ACTIVITY_CONFIG[t].color : "var(--text-dim)",
                }}
              >
                {ACTIVITY_CONFIG[t].icon} {ACTIVITY_CONFIG[t].label}
              </button>
            ))}
            <button className="btn btn-outline btn-sm" style={{ marginLeft: "auto" }} onClick={loadActivity}>↻ Actualiser</button>
          </div>

          {actLoading ? (
            <div style={{ color: "var(--text-dim)" }}>Chargement du journal…</div>
          ) : filteredActivity.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">Aucune entrée</div></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {filteredActivity.map((item, i) => {
                const cfg = ACTIVITY_CONFIG[item.type];
                return (
                  <div key={i} style={{ display: "flex", gap: "0.875rem", padding: "0.625rem 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: cfg.color + "18", border: `2px solid ${cfg.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem" }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.1rem" }}>
                        <span style={{ fontSize: "0.62rem", padding: "0.08rem 0.4rem", borderRadius: 999, background: cfg.color + "15", color: cfg.color, border: `1px solid ${cfg.color}30`, fontWeight: 600 }}>{cfg.label}</span>
                        <span style={{ fontWeight: 600, fontSize: "0.84rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>{item.label}</span>
                        <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "var(--text-dim)", flexShrink: 0, whiteSpace: "nowrap" }}>{timeAgo(item.at)}</span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{item.detail}</div>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-dim)", marginTop: "0.1rem" }}>par {item.by}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="card" style={{ borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: "1.3rem", marginBottom: "0.4rem" }}>{icon}</div>
      <div style={{ fontSize: "1.15rem", fontWeight: 700, color, marginBottom: "0.15rem" }}>{value}</div>
      <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      {sub && <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>{sub}</div>}
    </div>
  );
}
