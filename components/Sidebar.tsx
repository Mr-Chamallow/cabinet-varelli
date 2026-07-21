"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { hasPermission } from "@/lib/auth";
import { useCurrentUser } from "@/lib/useCurrentUser";

const NAV_SECTIONS = [
  { label: "⚖️ Cabinet BullHead", items: [
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

export function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();

  if (loading || !user) return null;

  return (
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
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href)) ? "active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-name">{user.nom}</div>
          <div className="user-role">{user.role}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => signOut({ callbackUrl: "/login" })}>↩</button>
      </div>
    </aside>
  );
}
