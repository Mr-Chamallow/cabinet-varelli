"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { PreviewBanner } from "@/components/PreviewBanner";

// Gère l'ouverture/fermeture du menu mobile (hamburger + tiroir + overlay).
// Remplace l'ancienne structure du layout qui n'offrait aucune adaptation mobile :
// la sidebar (position: fixed) recouvrait le contenu sur les petits écrans.
export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  useEffect(() => { setOpen(false); }, [pathname]);

  if (isLogin) {
    // Pas de sidebar sur /login : pleine largeur, sans le décalage habituel.
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      <div className={`sidebar-overlay${open ? " open" : ""}`} onClick={() => setOpen(false)} />

      <main className="main-content" style={{ display: "flex", flexDirection: "column" }}>
        <div className="mobile-topbar">
          <button className="mobile-topbar-btn" onClick={() => setOpen(o => !o)} aria-label="Menu">☰</button>
          <span className="mobile-topbar-title">Obsidian Logistique</span>
        </div>
        <PreviewBanner />
        {children}
      </main>
    </>
  );
}
