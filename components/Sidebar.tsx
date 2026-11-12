"use client";

import { Fragment, useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { hasPermission } from "@/lib/auth";
import { estStaffUser } from "@/lib/cabinetRoles";
import ListeDossiers from "@/components/cabinet/ListeDossiers";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { ObsLogo } from "@/components/ObsLogo";
import { useTempsReel } from "@/lib/useTempsReel";

interface SidebarProps {
  open?: boolean;
  onNavigate?: () => void;
}

const NAV_SECTIONS = [
  { label: "Cabinet Varelli", items: [
    { href: "/avocat",                 label: "Accueil",         icon: <ObsLogo size={18} />, perms: ["avocat"] },
    { href: "/avocat/mon-espace",      label: "Mon espace",      icon: "🧭", perms: ["avocat"] },
    { href: "/avocat/tarifs",          label: "Tarifs",          icon: "💰", perms: ["avocat", "cabinet_tarifs"] },
    { href: "/avocat/rdv",             label: "Prise de RDV",    icon: "📅", perms: ["avocat", "cabinet_rdv"] },
    { href: "/avocat/presentation",    label: "Présentation",    icon: "📜", perms: ["avocat", "cabinet_presentation"] },
    { href: "/avocat/organigramme",    label: "Organigramme",    icon: "🏛️", perms: ["avocat", "cabinet_organigramme"] },
    { href: "/avocat/code-penal",      label: "Code pénal",      icon: "📕", perms: ["avocat"] },
    { href: "/avocat/mes-commissions", label: "Mes commissions", icon: "💰", perms: ["avocat"], staffOnly: true },
    { href: "/avocat/dossiers", label: "Dossiers", icon: "📁", perms: ["avocat", "cabinet_dossiers"] },
    { href: "/avocat/messagerie", label: "Messagerie interne", icon: "💬", perms: ["cabinet_dossiers", "cabinet_rdv"], staffOnly: true },
    { href: "/avocat/comptabilite", label: "Comptabilité", icon: "🧾", perms: ["cabinet_compta"], staffOnly: true },
    { href: "/avocat/direction", label: "Tableau de bord", icon: "📊", perms: ["cabinet_attribution"], staffOnly: true },
    { href: "/avocat/recherche", label: "Recherche", icon: "🔎", perms: ["cabinet_dossiers"], staffOnly: true },
    { href: "/avocat/journal", label: "Journal", icon: "📖", perms: ["cabinet_attribution"], staffOnly: true },
    { href: "/avocat/clients", label: "Comptes clients", icon: "👥", perms: ["avocat_clients"] },
  ]},
  { label: "Obsidian Logistique", items: [
    { href: "/",                      label: "Dashboard",          icon: "◈", permission: "obsidian_dashboard" },
    { href: "/obsidian/prix",         label: "Tableau des prix",   icon: "▤", permission: "obsidian_prix" },
    { href: "/obsidian/stocks",       label: "Stocks",             icon: "▥", permission: "obsidian_stocks" },
    { href: "/obsidian/armurerie",    label: "Armurerie",          icon: "▦", permission: "obsidian_armurerie" },
    { href: "/obsidian/garage",       label: "Garage",             icon: "▧", permission: "obsidian_garage" },
    { href: "/obsidian/comptabilite", label: "Comptabilité",       icon: "▨", permission: "obsidian_comptabilite" },
    { href: "/obsidian/rdv",          label: "Rendez-vous",        icon: "▩", permission: "obsidian_rdv" },
    { href: "/obsidian/contrats",     label: "Contrats",           icon: "◆", permission: "obsidian_contrats" },
    { href: "/obsidian/stats",        label: "Statistiques",       icon: "◈", permission: "obsidian_stats" },
    { href: "/obsidian/fiches",       label: "Fiches",             icon: "◉", permission: "obsidian_stats" },
    { href: "/cahier-vente",          label: "Cahier de vente",    icon: "▪", permission: "cahier_vente" },
    { href: "/obsidian/paie",         label: "Paie & Commissions", icon: "💰", permission: "obsidian_paie" },
    { href: "/obsidian/employes",     label: "Employés",           icon: "🧑‍💼", permission: "obsidian_employes" },
    { href: "/juridique",             label: "Code pénal",         icon: "📖", permission: "juridique" },
    { href: "/carte-enqueteur",       label: "Carte enquêteur",    icon: "◔", permission: "carte-enqueteur" },
  ]},
  { label: "Administration", items: [
    { href: "/settings",    label: "Personnalisation", icon: "◌", permission: "admin" },
    { href: "/supervision", label: "Supervision",      icon: "◬", permission: "supervision" },
    { href: "/admin",       label: "Admin",            icon: "◭", permission: "admin" },
  ]},
];

export function Sidebar({ open = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();
  const [notifs, setNotifs] = useState<any>(null);
  const staffUser = estStaffUser(user);
  const chargerNotifs = () => {
    if (!user) return;
    fetch("/api/cabinet/notifications").then(r => r.json()).then(d => { if (!d.error) setNotifs(d); }).catch(() => {});
  };
  useEffect(() => { chargerNotifs(); }, [user?.discord_id, pathname]);
  useTempsReel(notifs?.topics?.plaintes, chargerNotifs);
  useTempsReel(notifs?.topics?.votes, chargerNotifs);
  const badgeFor = (href: string) =>
    href === "/avocat/messagerie" ? (notifs?.plaintes || 0) + (notifs?.votes || 0)
    : href === "/avocat/mon-espace" ? (notifs?.messages || 0)
    : href === "/avocat/direction" ? (notifs?.plaintes || 0)
    : 0;

  if (pathname === "/login") return null;
  if (loading || !user) return null;

  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-title" style={{ display: "flex", alignItems: "center", gap: 8 }}><ObsLogo size={22} />CABINET VARELLI</div>
        <div className="sidebar-logo-sub">& Associés</div>
      </div>

      <nav className="sidebar-nav">
        {NAV_SECTIONS.map(section => {
          // Un lien est visible si l'utilisateur a AU MOINS une de ses permissions (perms) ou sa permission (permission)
          const visibleItems = section.items.filter((i: any) => (!i.staffOnly || estStaffUser(user)) && (i.perms ? i.perms.some((p: string) => hasPermission(user, p)) : hasPermission(user, i.permission)));
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {visibleItems.map(item => {
                const isActive = item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || (item.href !== "/avocat" && !!pathname?.startsWith(item.href));
                return (
                  <Fragment key={item.href}>
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onNavigate?.()}
                    className={`sidebar-link${isActive ? " active" : ""}`}
                  >
                    <span className="sidebar-link-icon">{item.icon}</span>
                    <span>{item.label}</span>
                    {badgeFor(item.href) > 0 && <span style={{ marginLeft: "auto", background: "#e0b050", color: "#111", borderRadius: 10, padding: "0 7px", fontSize: "0.7rem", fontWeight: 700 }}>{badgeFor(item.href)}</span>}
                  </Link>
                  {item.href === "/avocat/dossiers" && <div style={{ padding: "0 0 0.6rem 0.4rem" }}><ListeDossiers /></div>}
                  </Fragment>
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