"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser, logout, canAccess, setRolesCache, getMemberColor, type User } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import CommandPalette from "./CommandPalette";

const NAV_SECTIONS = [
  {
    label: "Cabinet",
    items: [
      { href: "/",         label: "Dashboard",  icon: "◈", permission: "dashboard" },
      { href: "/clients",  label: "Clients",    icon: "◉", permission: "clients" },
      { href: "/dossiers", label: "Dossiers",   icon: "◫", permission: "dossiers" },
      { href: "/factures", label: "Factures",   icon: "◳", permission: "factures" },
      { href: "/casier",   label: "Casiers",    icon: "◪", permission: "clients" },
    ],
  },
  {
    label: "Outils",
    items: [
      { href: "/simulateur", label: "Simulateur", icon: "◐", permission: "simulateur" },
      { href: "/blanchiment",label: "Blanchiment",icon: "◑", permission: "blanchiment" },
      { href: "/audiences",  label: "Audiences",  icon: "◷", permission: "dashboard" },
      { href: "/minuteur",   label: "Minuteur",   icon: "◔", permission: "dashboard" },
      { href: "/modeles",    label: "Modèles",    icon: "◧", permission: "modeles" },
    ],
  },
  {
    label: "Référence",
    items: [
      { href: "/juridique", label: "Code pénal", icon: "◎", permission: "juridique" },
    ],
  },
  {
    label: "Système",
    items: [
      { href: "/admin", label: "Administration", icon: "◈", permission: "admin" },
    ],
  },
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [roleColor, setRoleColor] = useState("var(--gold)");
  const [memberColor, setMemberColor] = useState("var(--gold)");
  const [badges, setBadges] = useState<{ factures: number; audiences: number }>({ factures:0, audiences:0 });

  useEffect(() => {
    const u = getUser();
    if (!u && pathname !== "/login") { router.replace("/login"); setChecked(true); return; }
    if (u) {
      setUser(u);
      loadRoles(u);
      loadBadges(u);
    }
    setChecked(true);
  }, [pathname]);

  async function loadBadges(u: User) {
    if (!supabase) return;
    const today = new Date();
    const in24h = new Date(today.getTime() + 24*60*60*1000).toISOString().split("T")[0];
    const todayStr = today.toISOString().split("T")[0];

    const [{ data: facturesData }, { data: audiencesData }] = await Promise.all([
      supabase.from("factures").select("id, created_at").eq("created_by", u.nom).eq("statut", "En attente"),
      supabase.from("audiences").select("id, date").gte("date", todayStr).lte("date", in24h),
    ]);

    // Factures en attente depuis plus de 3 jours
    const now = Date.now();
    const facturesEnRetard = (facturesData||[]).filter((f:any) => {
      const age = (now - new Date(f.created_at).getTime()) / (1000*60*60*24);
      return age > 3;
    }).length;

    setBadges({ factures: facturesEnRetard, audiences: (audiencesData||[]).length });
  }

  async function loadRoles(u: User) {
    if (!supabase) return;
    const [{ data: rolesData }, { data: membreData }] = await Promise.all([
      supabase.from("roles").select("nom, permissions, couleur"),
      supabase.from("membres").select("couleur").eq("nom", u.nom).single(),
    ]);
    if (rolesData) {
      const cache: Record<string, string[]> = {};
      rolesData.forEach((r: any) => { cache[r.nom] = r.permissions || []; });
      setRolesCache(cache);
      const rData = rolesData.find((r: any) => r.nom === u.role);
      if (rData?.couleur) setRoleColor(rData.couleur);
    }
    if (membreData?.couleur) setMemberColor(membreData.couleur);
    else setMemberColor(getMemberColor(u.nom));
  }

  function handleLogout() { logout(); setUser(null); router.push("/login"); }

  if (!checked) return null;
  if (pathname === "/login") return <>{children}</>;
  if (!user) return null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-title">
            <img src="/logo.png" alt="BullHead" style={{ width:26, height:26, objectFit:"contain", flexShrink:0 }} />
            BULLHEAD
          </div>
          <div className="sidebar-logo-sub">Law · Finance · Property</div>
        </div>

        {/* Bouton recherche globale */}
        <div style={{ padding:"0 0.75rem 0.5rem" }}>
          <button onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key:"k", metaKey:true }))} style={{
            display:"flex", alignItems:"center", gap:"0.5rem", width:"100%",
            padding:"0.5rem 0.75rem", borderRadius:"var(--radius)",
            background:"var(--surface)", border:"1px solid var(--border)",
            color:"var(--text-dim)", cursor:"pointer", fontFamily:"'Inter',sans-serif",
            fontSize:"0.78rem", transition:"border-color 0.15s",
          }}
            onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(201,168,76,0.3)"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
            <span>🔍</span>
            <span style={{ flex:1, textAlign:"left" }}>Rechercher…</span>
            <span className="kbd-hint">⌘K</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(section => {
            const visible = section.items.filter(item => canAccess(user.role, item.permission));
            if (visible.length === 0) return null;
            return (
              <div key={section.label}>
                <div className="sidebar-section-label">{section.label}</div>
                {visible.map(item => {
                  const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  const badgeCount = item.href === "/factures" ? badges.factures : item.href === "/audiences" ? badges.audiences : 0;
                  return (
                    <a key={item.href} href={item.href} className={`sidebar-link ${active?"active":""}`}>
                      <span className="sidebar-link-icon" style={{ fontStyle:"normal", fontFamily:"monospace" }}>{item.icon}</span>
                      {item.label}
                      {badgeCount > 0 && (
                        <span className={`sidebar-badge ${item.href==="/factures"?"danger":"warning"}`}>{badgeCount}</span>
                      )}
                    </a>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer user */}
        <div className="sidebar-footer">
          <div style={{ position:"relative" }}>
            <button className="sidebar-user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <div className="user-avatar" style={{ background:memberColor+"20", borderColor:memberColor+"40", color:memberColor }}>
                {user.avatar}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:"0.8rem", fontWeight:600, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.nom}</div>
                <div style={{ fontSize:"0.68rem", color:roleColor }}>{user.role}</div>
              </div>
              <span style={{ color:"var(--text-dim)", fontSize:"0.65rem", flexShrink:0 }}>▲</span>
            </button>

            {userMenuOpen && (
              <>
                <div style={{ position:"fixed", inset:0, zIndex:98 }} onClick={() => setUserMenuOpen(false)} />
                <div style={{
                  position:"absolute", bottom:"calc(100% + 8px)", left:0, right:0,
                  background:"var(--card)", border:"1px solid var(--border-light)",
                  borderRadius:"var(--radius-lg)", padding:"0.5rem",
                  boxShadow:"var(--shadow-lg)", zIndex:99, animation:"slideUp 0.15s ease",
                }}>
                  <div style={{ padding:"0.625rem 0.75rem", marginBottom:"0.25rem" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.375rem" }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:memberColor }} />
                      <div style={{ fontSize:"0.7rem", color:"var(--text-dim)" }}>Couleur agenda</div>
                    </div>
                    <div style={{ fontWeight:600, fontSize:"0.875rem" }}>{user.nom}</div>
                    <span style={{ fontSize:"0.72rem", padding:"0.15rem 0.5rem", borderRadius:999,
                      background:roleColor+"18", color:roleColor, border:`1px solid ${roleColor}30`, fontWeight:600 }}>
                      {user.role}
                    </span>
                  </div>
                  <div style={{ height:1, background:"var(--border)", margin:"0.25rem 0" }} />
                  <button onClick={handleLogout} style={{
                    display:"flex", alignItems:"center", gap:"0.5rem",
                    width:"100%", padding:"0.55rem 0.75rem", borderRadius:8,
                    background:"transparent", border:"none", cursor:"pointer",
                    fontSize:"0.825rem", color:"var(--danger)", fontFamily:"'Inter',sans-serif",
                    transition:"background 0.1s",
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,0.08)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span>↩</span> Se déconnecter
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}
