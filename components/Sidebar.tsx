"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { getUser } from "@/lib/auth";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [user, setUserState] = useState<any>(null);

  useEffect(() => {
    const localUser = getUser();
    setUserState(localUser);
  }, []);

  // Détection force Patron pour ton ID Discord
  const isDiscordAdmin = (session?.user as any)?.discord_id === "460865920278069248";
  const currentUser = isDiscordAdmin 
    ? { nom: "mrchamallow__", role: "Patron", couleur: "#5865F2" }
    : user || { nom: "mrchamallow__", role: "Patron" };

  // Ne pas cacher le menu sur la page de login
  if (pathname === "/login") return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>CABINET BULLHEAD</h2>
        <span className="badge">{currentUser.role || "Patron"}</span>
      </div>

      <nav className="sidebar-nav">
        <Link href="/" className={pathname === "/" ? "active" : ""}>
          📊 Tableau de bord
        </Link>
        <Link href="/clients" className={pathname?.startsWith("/clients") ? "active" : ""}>
          👥 Clients
        </Link>
        <Link href="/dossiers" className={pathname?.startsWith("/dossiers") ? "active" : ""}>
          📁 Dossiers
        </Link>
        <Link href="/factures" className={pathname?.startsWith("/factures") ? "active" : ""}>
          📄 Factures
        </Link>
        <Link href="/agenda" className={pathname?.startsWith("/agenda") ? "active" : ""}>
          📅 Agenda
        </Link>
        <Link href="/comptabilite" className={pathname?.startsWith("/comptabilite") ? "active" : ""}>
          💰 Comptabilité
        </Link>
        <Link href="/membres" className={pathname?.startsWith("/membres") ? "active" : ""}>
          ⚙️ Gestion Membres
        </Link>
      </nav>
    </aside>
  );
}
