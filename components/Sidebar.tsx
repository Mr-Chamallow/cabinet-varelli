"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { hasPermission } from "@/lib/auth";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { supabase } from "@/lib/supabase";
import { getCachedIdentity, cacheIdentity, DEFAULT_LOGO_URL, DEFAULT_APP_NOM, Identity } from "@/lib/theme";

const NAV_SECTIONS = [
  { label: "Obsidian Logistique", items: [
    { href: "/",                       label: "Dashboard",       icon: "🏠", permission: "obsidian_dashboard" },
    { href: "/obsidian/prix",          label: "Tableau des prix", icon: "🏷️", permission: "obsidian_prix" },
    { href: "/obsidian/stocks",        label: "Stocks",          icon: "📦", permission: "obsidian_stocks" },
    { href: "/obsidian/armurerie",     label: "Armurerie",       icon: "🔫", permission: "obsidian_armurerie" },
    { href: "/obsidian/garage",        label: "Garage",          icon: "🚗", permission: "obsidian_garage" },
    { href: "/obsidian/comptabilite",  label: "Comptabilité",    icon: "🧾", permission: "obsidian_comptabilite" },
    { href: "/obsidian/rdv",           label: "Rendez-vous",     icon: "🗓️", permission: "obsidian_rdv" },
    { href: "/obsidian/contrats",      label: "Contrats",        icon: "📜", permission: "obsidian_contrats" },
    { href: "/obsidian/stats",         label: "Statistiques",    icon: "📊", permission: "obsidian_stats" },
    { href: "/obsidian/fiches",        label: "Fiches",          icon: "🗂️", permission: "obsidian_stats" },
    { href: "/cahier-vente",           label: "Cahier de vente", icon: "🧮", permission: "cahier_vente" },
    { href: "/obsidian/paie",          label: "Paie & Commissions", icon: "💰", permission: "obsidian_paie" },
    { href: "/obsidian/employes",      label: "Employés",        icon: "🧑‍💼", permission: "obsidian_employes" },
    { href: "/juridique",       label: "Code pénal",       icon: "📖", permission: "juridique" },
    { href: "/utile-samp",      label: "Utile SAMP",       icon: "🐈", permission: "utile_samp" },
    { href: "/carte-enqueteur", label: "Carte enquêteur",  icon: "🗺️", permission: "carte-enqueteur" },
  ]},
  { label: "Administration", items: [
    { href: "/settings",    label: "Personnalisation", icon: "🎨", permission: "admin" },
    { href: "/supervision", label: "Supervision",      icon: "📡", permission: "supervision" },
    { href: "/admin",       label: "Admin",            icon: "🛡️", permission: "admin" },
  ]},
];

export function Sidebar({ open = false, onNavigate }: { open?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();
  const [identity, setIdentity] = useState<Identity>({ logoUrl: DEFAULT_LOGO_URL, appNom: DEFAULT_APP_NOM });
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [pill, setPill] = useState<{ top: number; height: number; visible: boolean }>({ top: 0, height: 0, visible: false });

  useEffect(() => {
    setIdentity(getCachedIdentity()); // évite le flash le temps que Supabase réponde
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.from("app_settings").select("cle,valeur").in("cle", ["logo_url", "app_nom"]);
      if (!data) return;
      const m: Record<string, string> = {};
      data.forEach((r: any) => { m[r.cle] = r.valeur; });
      const next: Identity = {
        logoUrl: m["logo_url"] || DEFAULT_LOGO_URL,
        appNom: m["app_nom"] || DEFAULT_APP_NOM,
      };
      setIdentity(next);
      cacheIdentity(next);
    })();
  }, []);

  if (pathname === "/login") return null;
  if (loading || !user) return null;

  return (
    <aside className={`sidebar${open ? " open" : ""}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img
            src={identity.logoUrl}
            alt=""
            style={{ width: 26, height: 26, objectFit: "contain", borderRadius: 5, flexShrink: 0 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <span>{identity.appNom}</span>
        </div>
        <div className="sidebar-logo-sub">Consortium · Opérations</div>
      </div>

      <nav className="sidebar-nav" ref={navRef}>
        <SidebarActivePill pill={pill} />
        {NAV_SECTIONS.map(section => {
          const visibleItems = section.items.filter(i => hasPermission(user, i.permission));
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {visibleItems.map(item => {
                const isActive = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    ref={(el) => { linkRefs.current[item.href] = el; }}
                    className={`sidebar-link${isActive ? " active" : ""}`}
                    onClick={onNavigate}
                  >
                    <span className="sidebar-link-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <SidebarPillTracker navRef={navRef} linkRefs={linkRefs} pathname={pathname} setPill={setPill} />

      <div className="sidebar-footer">
        <span className="wandering-cat" aria-hidden="true">🐈</span>
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

// Petit pavé animé qui glisse derrière le lien actif au fil de la navigation, au lieu
// d'un simple changement instantané de fond — vérifié visuellement (mockup isolé).
function SidebarActivePill({ pill }: { pill: { top: number; height: number; visible: boolean } }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: "100%",
        top: pill.top,
        height: pill.height,
        opacity: pill.visible ? 1 : 0,
        background: "var(--gold-muted)",
        border: "1px solid rgba(var(--gold-rgb), 0.18)",
        boxShadow: "inset 0 0 0 1px rgba(var(--gold-rgb), 0.1)",
        borderRadius: "var(--radius)",
        transition: "top 0.35s var(--ease), height 0.35s var(--ease), opacity 0.2s var(--ease)",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: "60%", background: "var(--gold)", borderRadius: "0 2px 2px 0" }} />
    </div>
  );
}

function SidebarPillTracker({
  navRef, linkRefs, pathname, setPill,
}: {
  navRef: React.RefObject<HTMLElement | null>;
  linkRefs: React.RefObject<Record<string, HTMLAnchorElement | null>>;
  pathname: string | null;
  setPill: React.Dispatch<React.SetStateAction<{ top: number; height: number; visible: boolean }>>;
}) {
  useEffect(() => {
    const measure = () => {
      const nav = navRef.current;
      if (!nav) return;
      const activeHref = Object.keys(linkRefs.current).find((href) =>
        href === "/" ? pathname === "/" : pathname?.startsWith(href)
      );
      const el = activeHref ? linkRefs.current[activeHref] : null;
      if (!el) { setPill((p) => ({ ...p, visible: false })); return; }
      setPill({ top: el.offsetTop, height: el.offsetHeight, visible: true });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [pathname, navRef, linkRefs, setPill]);

  return null;
}