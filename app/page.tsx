"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission, firstAccessiblePath } from "@/lib/auth";

const fmt = (n:number) => n.toLocaleString("fr-FR",{style:"currency",currency:"USD",maximumFractionDigits:0});

export default function ObsidianDashboard() {
  const { user, loading: userLoading } = useCurrentUser();
  useEffect(() => {
    if (userLoading) return;
    if (!user) { window.location.href = "/login"; return; }
    // ⚠️ Ne JAMAIS renvoyer vers /login ici : l'utilisateur EST connecté, seulement
    // sans accès au Dashboard (ex: rôle "Légal Service"). /login le renvoie vers "/",
    // qui le renvoyait ici vers /login → boucle infinie. On l'envoie plutôt vers la
    // première page à laquelle il a vraiment accès.
    if (!hasPermission(user, "obsidian_dashboard")) {
      window.location.href = firstAccessiblePath(user);
    }
  }, [user, userLoading]);

  const [stats, setStats] = useState({recettes:0,depenses:0,argSale:0,nbArmes:0,nbDrogues:0});
  const [events, setEvents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ if(user) load(); },[user]);

  async function load() {
    if(!supabase){setLoading(false);return;}
    const [{data:compta},{data:stocks},{data:rdv},{data:contrats}] = await Promise.all([
      supabase.from("obsidian_comptabilite").select("type,montant,type_argent"),
      supabase.from("obsidian_stocks").select("*"),
      supabase.from("obsidian_rdv").select("id,titre,type,date,statut").order("date").limit(5),
      supabase.from("obsidian_contrats").select("id,titre,statut,date_cible").eq("statut","En cours").limit(5),
    ]);
    const r=(compta||[]).filter((c:any)=>c.type==="recette").reduce((s:number,c:any)=>s+c.montant,0);
    const d=(compta||[]).filter((c:any)=>c.type==="dépense").reduce((s:number,c:any)=>s+c.montant,0);
    const sal=(compta||[]).filter((c:any)=>c.type_argent==="sale").reduce((s:number,c:any)=>s+c.montant,0);
    setStats({
      recettes:r,depenses:d,argSale:sal,
      nbArmes:(stocks||[]).filter((s:any)=>s.categorie==="arme").reduce((a:number,x:any)=>a+x.quantite,0),
      nbDrogues:(stocks||[]).filter((s:any)=>s.categorie==="drogue").reduce((a:number,x:any)=>a+x.quantite,0),
    });
    setAlerts((stocks||[]).filter((s:any)=>s.seuil_alerte>0&&s.quantite<=s.seuil_alerte));
    setEvents([
      ...(rdv||[]).map((r:any)=>({...r,_type:"Opération"})),
      ...(contrats||[]).map((c:any)=>({...c,titre:c.titre,date:c.date_cible,_type:"Contrat"})),
    ].sort((a,b)=>(a.date||"").localeCompare(b.date||"")));
    setLoading(false);
  }

  const s = stats;
  const solde = s.recettes - s.depenses;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  if (userLoading || !user) return null;

  return (
    <div className="page-container" style={{ position: "relative" }}>
      <div className="ambient-glow" style={{ top: "-10%", left: "60%" }} />

      <div style={{ marginBottom: "2.25rem", position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: "'Inter', sans-serif", fontSize: "2.1rem", fontWeight: 900,
          letterSpacing: "-0.02em", marginBottom: "0.3rem", lineHeight: 1.1,
          textTransform: "uppercase"
        }}>
          {greeting()}, <span style={{ color: "var(--gold)" }}>{user.nom.split(" ")[0]}</span>
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Obsidian Logistique — {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
        <div className="gold-line" style={{ marginTop: "0.8rem" }} />
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          <div className="stat-grid">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton-card" />)}
          </div>
          <div className="skeleton skeleton-card" style={{ height: 140 }} />
        </div>
      ) : (
        <>
          {alerts.length > 0 && (
            <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-lg)", padding: "0.875rem 1.125rem", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--danger)", marginBottom: "0.4rem" }}>⚠️ Stock bas</div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {alerts.map((a:any) => (
                  <a key={a.id} href="/obsidian/stocks" style={{ textDecoration: "none" }}>
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.65rem", borderRadius: 999, background: "rgba(239,68,68,0.12)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)", fontWeight: 600 }}>
                      {a.emoji} {a.nom} : {a.quantite}/{a.seuil_alerte}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Stats principales */}
          <div className="stat-grid">
            {[
              { label: "Solde", value: fmt(solde), icon: "⚖️", href: "/obsidian/comptabilite", color: solde>=0?"var(--success)":"var(--danger)" },
              { label: "Argent sale", value: fmt(s.argSale), icon: "💰", href: "/obsidian/comptabilite", color: "var(--warning)" },
              { label: "Stock armes", value: s.nbArmes+"u.", icon: "🔫", href: "/obsidian/armurerie", color: "var(--danger)" },
              { label: "Stock drogues", value: s.nbDrogues+"u.", icon: "💊", href: "/obsidian/stocks", color: "#8b5cf6" },
            ].map((st) => (
              <a key={st.label} href={st.href} style={{ textDecoration: "none" }} className="stagger-item">
                <div className="stat-card">
                  <div className="stat-icon" style={{ opacity: 0.8, fontSize: "1.2rem" }}>{st.icon}</div>
                  <div className="stat-value" style={{ color: st.color, fontSize: "1.1rem" }}>{st.value}</div>
                  <div className="stat-label" style={{ marginTop: "0.35rem" }}>{st.label}</div>
                </div>
              </a>
            ))}
          </div>

          {/* Recettes/Dépenses */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginBottom: "1.75rem" }}>
            <div className="card stagger-item" style={{ borderColor: "rgba(34,197,94,0.18)" }}>
              <div className="stat-label" style={{ marginBottom: "0.5rem" }}>Recettes cumulées</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--success)" }}>{fmt(s.recettes)}</div>
            </div>
            <div className="card stagger-item" style={{ borderColor: "rgba(239,68,68,0.18)" }}>
              <div className="stat-label" style={{ marginBottom: "0.5rem" }}>Dépenses cumulées</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--danger)" }}>{fmt(s.depenses)}</div>
            </div>
          </div>

          {/* Prochains événements + Accès rapide */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.125rem" }}>
                <div>
                  <div className="section-title">Prochaines opérations</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.15rem" }}>Agenda partagé</div>
                </div>
                <a href="/obsidian/rdv" className="btn btn-ghost btn-sm">Planning complet →</a>
              </div>

              {events.length === 0 ? (
                <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-dim)", fontSize: "0.825rem" }}>
                  Aucune opération planifiée
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {events.slice(0, 6).map((e:any) => (
                    <a key={e.id} href={e._type === "Opération" ? "/obsidian/rdv" : "/obsidian/contrats"} style={{ textDecoration: "none" }} className="stagger-item">
                      <div style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.7rem 0.875rem", borderRadius: "var(--radius)",
                        background: "var(--surface)", border: "1px solid var(--border)",
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.825rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.titre}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.1rem" }}>
                            {e._type}{e.date ? " · " + new Date(e.date+"T12:00:00").toLocaleDateString("fr-FR",{day:"2-digit",month:"short"}) : ""}
                          </div>
                        </div>
                        <span style={{ fontSize: "0.6rem", padding: "0.15rem 0.45rem", borderRadius: 999, background: "var(--gold-muted)", color: "var(--gold)", border: "1px solid rgba(139,92,246,0.3)", flexShrink: 0, fontWeight: 600 }}>{e.statut}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              <a href="/obsidian/rdv" className="btn btn-outline btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: "1rem" }}>
                + Planifier une opération
              </a>
            </div>

            <div className="card">
              <div className="section-title" style={{ marginBottom: "0.875rem" }}>🚀 Accès rapide</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {[
                  ["/obsidian/prix","💲 Prix","var(--gold)"],
                  ["/obsidian/stocks","📦 Stocks","var(--info)"],
                  ["/obsidian/armurerie","🔫 Armurerie","var(--danger)"],
                  ["/obsidian/comptabilite","💳 Compta","var(--success)"],
                  ["/obsidian/rdv","📅 Planning","var(--warning)"],
                  ["/obsidian/contrats","📋 Contrats","#8b5cf6"],
                  ["/obsidian/garage","🚗 Garage","var(--text-muted)"],
                  ["/obsidian/fiches","👤 Fiches","#f97316"],
                ].map(([h,l,c]) => (
                  <a key={h as string} href={h as string} style={{ textDecoration: "none", padding: "0.625rem 0.875rem", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", fontSize: "0.82rem", fontWeight: 500, color: c as string, display: "block" }}>
                    {l as string}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}