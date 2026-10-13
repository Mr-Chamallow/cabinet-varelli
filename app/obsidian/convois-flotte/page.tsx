"use client";
import Link from "next/link";
import { useGmAccess } from "@/components/gm/bits";

export default function ConvoisFlottePage() {
  const { loading } = useGmAccess("obsidian_reglement");
  if (loading) return null;
  return (
    <div className="page-container" style={{ maxWidth: "100%" }}>
      <Link className="back-link" href="/obsidian">Dashboard Obsidian</Link>
      <div className="page-header"><div><h1 className="page-title">🚚 Convois et flotte</h1><p className="page-subtitle">Formations, ordre de marche, véhicules</p><div className="gold-line" /></div>
        <a className="btn btn-outline" href="/convois.html" target="_blank" rel="noreferrer">Plein écran ↗</a></div>
      <iframe src="/convois.html" title="Convois" style={{ width: "100%", height: "calc(100vh - 210px)", minHeight: 520, border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", background: "var(--card)" }} />
    </div>
  );
}
