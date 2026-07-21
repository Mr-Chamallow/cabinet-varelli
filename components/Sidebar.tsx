"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { hasPermission } from "@/lib/auth";
import { useCurrentUser } from "@/lib/useCurrentUser";

const NAV_SECTIONS = [
  { label: "Cabinet BullHead", items: [
    { href: "/",            label: "Dashboard",     icon: "◈", permission: "dashboard" },
    { href: "/clients",     label: "Clients",       icon: "◉", permission: "clients" },
    { href: "/dossiers",    label: "Dossiers",      icon: "◫", permission: "dossiers" },
    { href: "/factures",    label: "Factures",      icon: "◬", permission: "factures" },
    { href: "/casier",      label: "Casier",        icon: "◪", permission: "casier" },
    { href: "/simulateur",  label: "Simulateur",    icon: "◐", permission: "simulateur" },
    { href: "/audiences",   label: "Audiences",     icon: "◍", permission: "audiences" },
    { href: "/juridique",   label: "Code pénal",    icon: "◎", permission: "juridique" },
    { href: "/calculatrice",label: "Calculatrice",  icon: "◑", permission: "calculatrice" },
    { href: "/comptabilite",label: "Comptabilité",  icon: "◒", permission: "comptabilite" },
    { href: "/operations",  label: "Opérations",    icon: "◓", permission: "comptabilite" },
  ]},
  { label: "Obsidian Logistics", items: [
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
        <div className="sidebar-logo-title">⚖️ CABINET BULLHEAD</div>
        <div className="sidebar-logo-sub">Law · Finance · Property</div>
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
