"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { PreviewBanner } from "@/components/PreviewBanner";
import { QuickEntry } from "@/components/QuickEntry";
import { PdfPreviewHost } from "@/components/PdfPreviewHost";
import { MotionFX } from "@/components/MotionFX";
import { AmbientBg } from "@/components/AmbientBg";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BottomBar } from "@/components/BottomBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { installGestures } from "@/lib/gestures";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { roleStyle } from "@/components/EmployeeCard";

// Gère l'ouverture/fermeture du menu mobile (hamburger + tiroir + overlay).
// Remplace l'ancienne structure du layout qui n'offrait aucune adaptation mobile :
// la sidebar (position: fixed) recouvrait le contenu sur les petits écrans.
export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  const { user } = useCurrentUser();
  const openRef = useRef(false); openRef.current = open;
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => installGestures({ openMenu: () => setOpen(true), closeMenu: () => setOpen(false), isOpen: () => openRef.current }), []);
  const poleColor = roleStyle((user as any)?.role).color;

  if (isLogin) {
    // Pas de sidebar sur /login : pleine largeur, sans le décalage habituel.
    return <>{children}</>;
  }

  return (
    <>
      <AmbientBg />
      <Sidebar open={open} onNavigate={() => setOpen(false)} />
      <div className={`sidebar-overlay${open ? " open" : ""}`} onClick={() => setOpen(false)} />

      <main className="main-content" style={{ display: "flex", flexDirection: "column", ["--pole" as any]: poleColor }}>
        <div className="mobile-topbar">
          <button className="mobile-topbar-btn" onClick={() => setOpen(o => !o)} aria-label="Menu">☰</button>
          <span className="mobile-topbar-title">Obsidian Logistique</span>
          <span style={{ marginLeft: "auto" }}><ThemeToggle compact /></span>
        </div>
        <PreviewBanner />
        <Breadcrumb />
        {children}
      </main>
      <BottomBar onMenu={() => setOpen(o => !o)} />
      <QuickEntry />
      <PdfPreviewHost />
      <MotionFX />
    </>
  );
}
