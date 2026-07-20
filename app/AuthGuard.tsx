// ⚠️ Ce fichier remplace l'AuthGuard existant.
// Ajouter les imports et sections Obsidian dans votre AuthGuard.
// Voir README.txt pour les instructions.

"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser, hasPermission, type AppUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const NAV_SECTIONS = [
  { label: "⚖️ Cabinet BullHead", items: [
    { href: "/",           label: "Dashboard",     icon: "◈", permission: "dashboard" },
    { href: "/clients",    label: "Clients",       icon: "◉", permission: "clients" },
    { href: "/dossiers",   label: "Dossiers",      icon: "◫", permission: "dossiers" },
    { href: "/factures",   label: "Factures",      icon: "◬", permission: "factures" },
    { href: "/casier",     label: "Casier",        icon: "◪", permission: "casier" },
    { href: "/simulateur", label: "Simulateur",    icon: "◐", permission: "simulateur" },
    { href: "/audiences",  label: "Audiences",     icon: "◍", permission: "audiences" },
    { href: "/juridique",  label: "Code pénal",    icon: "◎", permission: "juridique" },
    { href: "/calculatrice",label:"Calculatrice",  icon: "◑", permission: "calculatrice" },
  ]},
  { label: "🖤 Obsidian Logistics", items: [
    { href: "/obsidian",               label: "Dashboard OBS",   icon: "▣", permission: "obsidian_dashboard" },
    { href: "/obsidian/prix",          label: "Tableau des prix", icon: "▤", permission: "obsidian_prix" },
    { href: "/obsidian/stocks",        label: "Stocks",          icon: "▥", permission: "obsidian_stocks" },
    { href: "/obsidian/armurerie",     label: "Armurerie",       icon: "▦", permission: "obsidian_armurerie" },
    { href: "/obsidian/garage",        label: "Garage",          icon: "▧", permission: "obsidian_garage" },
    { href: "/obsidian/comptabilite",  label: "Comptabilité",    icon: "▨", permission: "obsidian_comptabilite" },
    { href: "/obsidian/rdv",           label: "Rendez-vous",     icon: "▩", permission: "obsidian_rdv" },
    { href: "/obsidian/contrats",      label: "Contrats",        icon: "◆", permission: "obsidian_contrats" },
    { href: "/obsidian/planification", label: "Planification",   icon: "◇", permission: "obsidian_planification" },
    { href: "/obsidian/stats",         label: "Statistiques",    icon: "◈", permission: "obsidian_stats" },
    { href: "/obsidian/fiches",        label: "Fiches",          icon: "◉", permission: "obsidian_stats" },
    { href: "/obsidian/carte",         label: "Carte",           icon: "◊", permission: "obsidian_stats" },
    { href: "/cahier-vente",           label: "Cahier de vente", icon: "▪", permission: "cahier_vente" },
  ]},
  { label: "⚙️ Administration", items: [
    { href: "/settings",    label: "Personnalisation", icon: "◌", permission: "admin" },
    { href: "/supervision", label: "Supervision",      icon: "◬", permission: "supervision" },
    { href: "/admin",       label: "Admin",            icon: "◭", permission: "admin" },
  ]},
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (!u && pathname !== "/login") { router.push("/login"); return; }
    setUser(u); setLoading(false);
  }, [pathname, router]);

  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", color:"var(--text-dim)" }}>Chargement…</div>;
  if (!user) return null;

  const dc = typeof window !== "undefined" ? parseInt(localStorage.getItem("cabinet_defcon") || "5") : 5;
  const DC_COLORS: Record<number,string> = {5:"#3b82f6",4:"#22c55e",3:"#f59e0b",2:"#f97316",1:"#ef4444"};
  const dcCol = DC_COLORS[dc] || "#3b82f6";

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-text">CABINET BULLHEAD</div>
          <div className="logo-sub">Law · Finance · Property</div>
        </div>
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(section => (
            <div key={section.label} className="nav-section">
              <div className="nav-section-label">{section.label}</div>
              {section.items.filter(i => hasPermission(user, i.permission)).map(item => (
                <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href)) ? "active" : ""}`}>
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div style={{padding:"0 0.75rem 0.75rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.45rem 0.75rem",borderRadius:"var(--radius)",background:dcCol+"12",border:"1px solid "+dcCol+"35"}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:dcCol,boxShadow:"0 0 6px "+dcCol}}/>
            <span style={{fontSize:"0.72rem",fontWeight:700,color:dcCol}}>DEFCON {dc}</span>
          </div>
        </div>
        <div className="sidebar-footer">
          <div className="user-info"><div className="user-name">{user.nom}</div><div className="user-role">{user.role}</div></div>
          <button className="btn btn-ghost btn-sm" onClick={() => { localStorage.removeItem("bullhead_user"); router.push("/login"); }}>↩</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}