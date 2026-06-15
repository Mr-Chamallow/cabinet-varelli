"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser, logout, canAccess, ROLE_BADGES, ROLE_COLORS, type User, type Role } from "@/lib/auth";

const NAV_SECTIONS = [
  {
    label: "Cabinet",
    items: [
      { href: "/", label: "Dashboard", icon: "◈", permission: "dashboard" },
      { href: "/clients", label: "Clients", icon: "◉", permission: "clients" },
      { href: "/dossiers", label: "Dossiers", icon: "◫", permission: "dossiers" },
      { href: "/factures", label: "Factures", icon: "◳", permission: "factures" },
    ],
  },
  {
    label: "Outils",
    items: [
      { href: "/simulateur", label: "Simulateur", icon: "◐", permission: "simulateur" },
      { href: "/blanchiment", label: "Blanchiment", icon: "◑", permission: "blanchiment" },
      { href: "/audiences", label: "Audiences", icon: "◷", permission: "dashboard" },
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

  useEffect(() => {
    const u = getUser();
    if (!u && pathname !== "/login") {
      router.replace("/login");
    } else {
      setUser(u);
    }
    setChecked(true);
  }, [pathname]);

  function handleLogout() {
    logout();
    setUser(null);
    router.push("/login");
  }

  if (!checked) return null;
  if (pathname === "/login") return <>{children}</>;
  if (!user) return null;

  const roleColor = ROLE_COLORS[user.role as Role] || "var(--gold)";

  return (
    <div className="app-shell">
      {/* ── SIDEBAR ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-title">
            <span style={{ fontSize: "1.2rem" }}>⚖</span>
            VARELLI
          </div>
          <div className="sidebar-logo-sub">Cabinet juridique</div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(section => {
            const visibleItems = section.items.filter(item => canAccess(user.role, item.permission));
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.label}>
                <div className="sidebar-section-label">{section.label}</div>
                {visibleItems.map(item => {
                  const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`sidebar-link ${active ? "active" : ""}`}
                    >
                      <span className="sidebar-link-icon" style={{ fontStyle: "normal", fontFamily: "monospace" }}>{item.icon}</span>
                      {item.label}
                    </a>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer user */}
        <div className="sidebar-footer">
          <div style={{ position: "relative" }}>
            <button className="sidebar-user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <div className="user-avatar">{user.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.nom}</div>
                <div style={{ fontSize: "0.68rem", color: roleColor }}>{user.role}</div>
              </div>
              <span style={{ color: "var(--text-dim)", fontSize: "0.65rem", flexShrink: 0 }}>▲</span>
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 98 }}
                  onClick={() => setUserMenuOpen(false)}
                />
                <div style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  background: "var(--card)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-lg)",
                  padding: "0.5rem",
                  boxShadow: "var(--shadow-lg)",
                  zIndex: 99,
                  animation: "slideUp 0.15s ease",
                }}>
                  <div style={{ padding: "0.625rem 0.75rem", marginBottom: "0.25rem" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginBottom: "0.25rem" }}>Connecté en tant que</div>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{user.nom}</div>
                    <span className={`badge ${ROLE_BADGES[user.role as Role]}`} style={{ marginTop: "0.25rem" }}>{user.role}</span>
                  </div>
                  <div style={{ height: 1, background: "var(--border)", margin: "0.25rem 0" }} />
                  <button
                    onClick={handleLogout}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.5rem",
                      width: "100%", padding: "0.55rem 0.75rem", borderRadius: 8,
                      background: "transparent", border: "none", cursor: "pointer",
                      fontSize: "0.825rem", color: "var(--danger)",
                      fontFamily: "'Inter', sans-serif",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>↩</span> Se déconnecter
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
