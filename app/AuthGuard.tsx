"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser, logout, canAccess, ROLE_BADGES, type User } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "⚖️", permission: "dashboard" },
  { href: "/clients", label: "Clients", icon: "👤", permission: "clients" },
  { href: "/dossiers", label: "Dossiers", icon: "📁", permission: "dossiers" },
  { href: "/factures", label: "Factures", icon: "🧾", permission: "factures" },
  { href: "/operations", label: "Opérations", icon: "💸", permission: "operations" },
  { href: "/comptabilite", label: "Comptabilité", icon: "📊", permission: "comptabilite" },
  { href: "/blanchiment", label: "Blanchiment", icon: "🔄", permission: "blanchiment" },
  { href: "/simulateur", label: "Simulateur", icon: "⚙️", permission: "simulateur" },
  { href: "/audiences", label: "Audiences", icon: "📅", permission: "dashboard" },
  { href: "/juridique", label: "Juridique", icon: "📜", permission: "juridique" },
  { href: "/admin", label: "Admin", icon: "🛡️", permission: "admin" },
];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const visibleNav = NAV_ITEMS.filter((item) => canAccess(user.role, item.permission));

  return (
    <>
      {/* Navbar */}
      <nav style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
        }}>
          {/* Logo */}
          <a href="/" style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--gold)",
            textDecoration: "none",
            padding: "1rem 0.5rem 1rem 0",
            marginRight: "0.75rem",
            whiteSpace: "nowrap",
            letterSpacing: "0.05em",
            flexShrink: 0,
          }}>
            ⚖ VARELLI
          </a>

          {/* Nav links */}
          <div style={{ display: "flex", gap: "0.1rem", overflowX: "auto", flex: 1 }}>
            {visibleNav.map((link) => {
              const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.55rem 0.8rem",
                    borderRadius: "var(--radius)",
                    fontSize: "0.8rem",
                    color: active ? "var(--gold)" : "var(--text-muted)",
                    background: active ? "var(--gold-muted)" : "transparent",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                    fontWeight: active ? 600 : 400,
                    border: active ? "1px solid rgba(212,175,55,0.25)" : "1px solid transparent",
                  }}
                >
                  <span style={{ fontSize: "0.85rem" }}>{link.icon}</span>
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* User menu */}
          <div style={{ position: "relative", flexShrink: 0, marginLeft: "0.5rem" }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "0.45rem 0.75rem",
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(212,175,55,0.4)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--gold-muted)",
                border: "1px solid rgba(212,175,55,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: "0.8rem",
                color: "var(--gold)",
              }}>
                {user.avatar}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>{user.nom.split(" ")[0]}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>{user.role}</div>
              </div>
              <span style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>▼</span>
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "0.5rem",
                minWidth: 200,
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                zIndex: 100,
                animation: "slideUp 0.15s ease",
              }}>
                {/* User info */}
                <div style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border)",
                  marginBottom: "0.5rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: "var(--gold-muted)",
                      border: "1.5px solid rgba(212,175,55,0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Playfair Display', serif",
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: "var(--gold)",
                    }}>
                      {user.avatar}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{user.nom}</div>
                      <span className={`badge ${ROLE_BADGES[user.role]}`}>{user.role}</span>
                    </div>
                  </div>
                </div>

                {/* Links */}
                {canAccess(user.role, "parametres") && (
                  <a
                    href="/parametres"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      padding: "0.6rem 0.75rem",
                      borderRadius: 8,
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      textDecoration: "none",
                      transition: "all 0.1s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--card-hover)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)"; }}
                  >
                    ⚙️ Paramètres
                  </a>
                )}

                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.6rem 0.75rem",
                    borderRadius: 8,
                    fontSize: "0.85rem",
                    color: "var(--danger)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    width: "100%",
                    fontFamily: "'Inter', sans-serif",
                    transition: "all 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  🚪 Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Click outside to close menu */}
      {menuOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 49 }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main>{children}</main>
    </>
  );
}
