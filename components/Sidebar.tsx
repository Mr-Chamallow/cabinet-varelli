"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { hasPermission } from "@/lib/auth";
import { useCurrentUser } from "@/lib/useCurrentUser";

const NAV_SECTIONS = [
  { label: "Obsidian Logistique", items: [
    { href: "/",                       label: "Dashboard",       icon: "◈", permission: "obsidian_dashboard" },
    { href: "/obsidian/prix",          label: "Tableau des prix", icon: "▤", permission: "obsidian_prix" },
    { href: "/obsidian/stocks",        label: "Stocks",          icon: "▥", permission: "obsidian_stocks" },
    { href: "/obsidian/armurerie",     label: "Armurerie",       icon: "▦", permission: "obsidian_armurerie" },
    { href: "/obsidian/garage",        label: "Garage",          icon: "▧", permission: "obsidian_garage" },
    { href: "/obsidian/comptabilite",  label: "Comptabilité",    icon: "▨", permission: "obsidian_comptabilite" },
    { href: "/obsidian/rdv",           label: "Rendez-vous",     icon: "▩", permission: "obsidian_rdv" },
    { href: "/obsidian/contrats",      label: "Contrats",        icon: "◆", permission: "obsidian_contrats" },
    { href: "/obsidian/stats",         label: "Statistiques",    icon: "◈", permission: "obsidian_stats" },
    { href: "/obsidian/fiches",        label: "Fiches",          icon: "◉", permission: "obsidian_stats" },
    { href: "/cahier-vente",           label: "Cahier de vente", icon: "▪", permission: "cahier_vente" },
    { href: "/obsidian/paie",          label: "Paie & Commissions", icon: "💰", permission: "obsidian_paie" },
    { href: "/obsidian/employes",      label: "Employés",        icon: "🧑‍💼", permission: "obsidian_employes" },
    { href: "/juridique",       label: "Code pénal",       icon: "📖", permission: "juridique" },
    { href: "/carte-enqueteur", label: "Carte enquêteur",  icon: "◔", permission: "carte-enqueteur" },
  ]},
  { label: "Administration", items: [
    { href: "/settings",    label: "Personnalisation", icon: "◌", permission: "admin" },
    { href: "/supervision", label: "Supervision",      icon: "◬", permission: "supervision" },
    { href: "/admin",       label: "Admin",            icon: "◭", permission: "admin" },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();

  if (pathname === "/login") return null;
  if (loading || !user) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-title">🖤 OBSIDIAN LOGISTIQUE</div>
        <div className="sidebar-logo-sub">Consortium · Opérations</div>
      </div>

      <nav className="sidebar-nav">
        {NAV_SECTIONS.map(section => {
          const visibleItems = section.items.filter(i => hasPermission(user, i.permission));
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {visibleItems.map(item => {
                const isActive = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} className={`sidebar-link${isActive ? " active" : ""}`}>
                    <span className="sidebar-link-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-user" onClick={() => signOut({ callbackUrl: "/login" })} title="Se déconnecter">
          <div className="user-avatar">{user.nom?.charAt(0)?.toUpperCase() || "?"}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.nom}</div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.role}</div>
          </div>
        </button>
      </div>
    </aside>
  );
}