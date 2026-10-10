"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { hasPermission } from "@/lib/auth";
import { poleOf } from "@/components/EmployeeCard";

type Tile = { i: string; l: string; v: number | string; href: string; c: string; warn?: boolean };

// « Mon accueil » : chaque tuile n'apparaît que si le membre a la permission de l'onglet correspondant (rien n'est forcé par le rôle).
export function PoleHome({ user }: { user: any }) {
  const pole = poleOf(user?.role);
  const [tiles, setTiles] = useState<Tile[] | null>(null);
  useEffect(() => {
    if (!supabase || !user) return;
    const db = supabase; const can = (p: string) => hasPermission(user, p);
    const n = async (q: any) => { const { count } = await q; return count || 0; };
    (async () => {
      const t: Tile[] = [];
      const now = new Date().toISOString(); const wk = new Date(Date.now() - 7 * 86400000).toISOString();
      if (can("gm_tribunal")) t.push({ i: "⚖️", l: "Dossiers en cours", v: await n(db.from("tribunal_dossiers").select("id", { count: "exact", head: true }).eq("verdict", "en_cours")), href: "/obsidian/tribunal", c: "#a78bfa" });
      if (can("gm_pactes")) t.push({ i: "🤝", l: "Pactes actifs", v: await n(db.from("gm_pactes").select("id", { count: "exact", head: true }).eq("statut", "actif")), href: "/obsidian/pactes", c: "#a78bfa" });
      if (can("gm_audits")) t.push({ i: "⛔", l: "Sanctions en cours", v: await n(db.from("gm_audits").select("id", { count: "exact", head: true }).gt("sanction_fin", now)), href: "/obsidian/audits", c: "var(--danger)" });
      if (can("obsidian_stocks")) { const { data } = await db.from("obsidian_stocks").select("quantite,seuil_alerte"); const low = (data || []).filter((s: any) => s.seuil_alerte > 0 && s.quantite <= s.seuil_alerte).length; t.push({ i: "📦", l: "Stocks bas", v: low, href: "/obsidian/stocks", c: "var(--gold)", warn: low > 0 }); }
      if (can("gm_evenements")) t.push({ i: "🚚", l: "Convois à venir", v: await n(db.from("gm_evenements").select("id", { count: "exact", head: true }).eq("type", "convoi").in("statut", ["planifie", "en_route"])), href: "/obsidian/evenements", c: "var(--info)" });
      if (can("gm_evenements")) { const c = await n(db.from("gm_evenements").select("id", { count: "exact", head: true }).eq("type", "capture").in("statut", ["a_faire", "en_cours"])); t.push({ i: "🎯", l: "Captures à faire", v: c, href: "/obsidian/evenements", c: "var(--danger)", warn: c > 0 }); }
      if (can("obsidian_arrestations")) t.push({ i: "🚔", l: "Arrestations (7 j)", v: await n(db.from("arrestations").select("id", { count: "exact", head: true }).gte("created_at", wk)), href: "/obsidian/arrestations", c: "var(--warning)" });
      if (can("gm_reputation")) t.push({ i: "⭐", l: "Groupes suivis", v: await n(db.from("carte_gangs").select("id", { count: "exact", head: true })), href: "/obsidian/reputation", c: "var(--gold)" });
      if (can("obsidian_actions")) t.push({ i: "💼", l: "Mes actions (7 j)", v: await n(db.from("actions_illegales").select("id", { count: "exact", head: true }).eq("membre", user.nom).gte("created_at", wk)), href: "/obsidian/actions-illegales", c: "var(--gold)" });
      setTiles(t);
    })();
  }, [user?.id, pole.nom]);

  if (!tiles || tiles.length === 0) return null;
  return (
    <div className="card" style={{ marginBottom: "1.25rem", borderTop: `3px solid ${pole.color}`, position: "relative", zIndex: 1 }}>
      <div className="section-title" style={{ marginBottom: "0.75rem", color: pole.color }}>🎯 Mon accueil</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "0.6rem" }}>
        {tiles.map((t, k) => (
          <a key={t.l} href={t.href} data-tilt className={t.warn ? "pulse-danger" : undefined} style={{ textDecoration: "none", color: "inherit", padding: "0.7rem 0.85rem", borderRadius: "var(--radius)", background: "var(--surface)", border: `1px solid ${t.warn ? "rgba(239,68,68,.4)" : "var(--border)"}`, animation: `slideUp .5s ${k * 70}ms both` }}>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: t.c }}>{t.i} {t.v}</div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: ".06em" }}>{t.l}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
