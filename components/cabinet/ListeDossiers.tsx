"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { estStaffUser } from "@/lib/cabinetRoles";

// Liste façon salons Discord : un salon par dossier, rangés en « Dossiers » et « Archives », avec recherche
export default function ListeDossiers() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const staff = estStaffUser(user);
  const [rows, setRows] = useState<any[]>([]);
  const [recherche, setRecherche] = useState("");

  const charger = () => fetch("/api/cabinet/dossiers").then(r => r.json()).then(d => setRows(d.rows || [])).catch(() => {});

  useEffect(() => { charger(); }, [pathname]);
  useEffect(() => {
    const maj = () => charger();
    window.addEventListener("dossiers-maj", maj);
    return () => window.removeEventListener("dossiers-maj", maj);
  }, []);

  // Recherche par titre, client ou prestation
  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(d => [d.titre, d.client_nom, d.prestation].some(v => (v || "").toLowerCase().includes(q)));
  }, [rows, recherche]);

  const actifs = filtres.filter(d => d.statut !== "archive");
  const archives = filtres.filter(d => d.statut === "archive");

  const groupe = (titre: string, liste: any[]) => (
    <div style={{ marginBottom: "1.2rem" }}>
      <div style={{ fontFamily: "'Cinzel', serif", color: "var(--gold)", fontSize: "0.8rem", marginBottom: "0.4rem", textTransform: "uppercase" }}>{titre}</div>
      {liste.length === 0 && <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{recherche ? "Aucun résultat" : "Aucun"}</div>}
      {liste.map(d => {
        const actif = pathname === `/avocat/dossiers/${d.id}`;
        return (
          <Link key={d.id} href={`/avocat/dossiers/${d.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <div className="cab-card" style={{ marginBottom: "0.4rem", padding: "0.5rem 0.7rem", background: actif ? "var(--gold-muted)" : undefined }}>
              <div style={{ fontWeight: 600, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}># {d.titre}</div>
              {staff && <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>{d.client_nom}</div>}
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div>
      <Link href="/avocat/dossiers" className="btn btn-sm" style={{ marginBottom: "0.8rem", textDecoration: "none", display: "inline-block" }}>+ Nouveau dossier</Link>
      <input
        value={recherche}
        onChange={e => setRecherche(e.target.value)}
        placeholder="Rechercher un dossier..."
        style={{ width: "100%", padding: "0.5rem 0.6rem", marginBottom: "0.9rem", borderRadius: 6, border: "1px solid var(--border, #333)", background: "transparent", color: "inherit", fontSize: "0.85rem" }}
      />
      {groupe("Dossiers", actifs)}
      {groupe("Archives", archives)}
    </div>
  );
}
