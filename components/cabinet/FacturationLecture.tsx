"use client";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { montant } from "@/lib/montant";
import { useCabinetTemps } from "@/lib/useCabinetTemps";

const dateFr = (d?: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
const totalLignes = (ls: any[]) => (ls || []).reduce((s, l) => s + (Number(l.quantite) || 0) * (Number(l.prix) || 0), 0);

// Devis et factures côte à côte, en lecture seule (sans accès à la comptabilité)
export default function FacturationLecture() {
  const [data, setData] = useState<{ devis: any[]; factures: any[] } | null>(null);
  const [erreur, setErreur] = useState("");
  const [recherche, setRecherche] = useState("");

  const charger = () =>
    fetch("/api/cabinet/facturation").then(r => r.json()).then(d => d.error ? setErreur(d.error) : setData(d)).catch(() => setErreur("Chargement impossible"));

  useEffect(() => { charger(); }, []);
  useCabinetTemps(["cabinet_devis", "cabinet_factures"], charger);

  if (erreur) return <div style={{ color: "var(--danger)" }}>{erreur}</div>;
  if (!data) return <div style={{ color: "var(--text-dim)" }}>Chargement...</div>;

  const q = recherche.trim().toLowerCase();
  const filtre = (r: any) => !q || `${r.numero || ""} ${r.client_nom || ""} ${r.libelle || ""}`.toLowerCase().includes(q);
  const devis = data.devis.filter(filtre);
  const factures = data.factures.filter(filtre);

  const bloc = (titre: string, lignes: any[], rendu: (r: any) => ReactNode) => (
    <div className="cab-card">
      <div className="cab-section-titre" style={{ fontSize: "0.95rem" }}>{titre} ({lignes.length})</div>
      {lignes.length === 0 && <div className="cab-muted">Aucun élément.</div>}
      {lignes.map(rendu)}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <input placeholder="Rechercher (numéro, client, libellé)…" value={recherche} onChange={e => setRecherche(e.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "1rem", alignItems: "start" }}>
        {bloc("Devis", devis, (d: any) => (
          <div key={d.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
              <strong>{d.numero || "Devis"}</strong><span>{montant(d.montant || totalLignes(d.lignes))}</span>
            </div>
            <div className="cab-muted" style={{ fontSize: "0.8rem" }}>{d.client_nom || "—"} · {dateFr(d.created_at)} · {d.statut}</div>
            {(d.lignes || []).map((l: any, i: number) => <div key={i} className="cab-muted" style={{ fontSize: "0.78rem" }}>· {l.description} × {l.quantite}</div>)}
          </div>
        ))}
        {bloc("Factures", factures, (f: any) => (
          <div key={f.id} style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
              <strong>{f.numero || f.libelle}</strong><span>{montant(f.montant || totalLignes(f.lignes))}</span>
            </div>
            <div className="cab-muted" style={{ fontSize: "0.8rem" }}>
              {f.client_nom || "—"} · émise {dateFr(f.created_at)} · {f.statut === "payee" ? `payée le ${dateFr(f.payee_at)}` : `à payer avant le ${dateFr(f.date_echeance)}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
