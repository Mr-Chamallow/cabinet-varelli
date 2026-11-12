"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { montant } from "@/lib/montant";
import { useCabinetTemps } from "@/lib/useCabinetTemps";

const STATUT_RDV: Record<string, string> = { demande: "Demande", attribue: "Attribué", confirme: "Confirmé", en_cours: "En cours", reporte: "Reporté" };
const heure = (s: string) => String(s || "").slice(11, 16);

// Tableau de bord des employés : ce qui compte aujourd'hui
export default function TableauBordStaff() {
  const [d, setD] = useState<any>(null);
  const charger = () => fetch("/api/cabinet/tableau-bord").then(r => r.json()).then(x => { if (!x.error) setD(x); });
  useEffect(() => { charger(); }, []);
  useCabinetTemps(["cabinet_rdv", "cabinet_factures", "cabinet_devis", "cabinet_dossiers"], charger);

  if (!d) return null;
  const carte: React.CSSProperties = { display: "block", color: "inherit", textDecoration: "none", padding: "0.5rem 0", borderTop: "1px solid var(--border)" };

  return (
    <section style={{ marginBottom: "2rem" }}>
      <h2 className="cab-section-titre">Aujourd&apos;hui</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1rem" }}>
        <div className="cab-card">
          <div style={{ fontWeight: 700, marginBottom: "0.3rem" }}>Rendez-vous du jour <span className="cab-muted">· {d.rdv.length}</span></div>
          {d.rdv.length === 0 && <div className="cab-muted" style={{ fontSize: "0.85rem" }}>Aucun rendez-vous aujourd&apos;hui.</div>}
          {d.rdv.map((r: any) => (
            <Link key={r.id} href="/avocat/rdv" style={carte}>
              <b>{heure(r.date_rdv)}</b> · {r.client_nom || "Client"}
              <div className="cab-muted" style={{ fontSize: "0.78rem" }}>{r.prestation || "-"} · {STATUT_RDV[r.statut] || r.statut}{r.avocat_nom ? ` · ${r.avocat_nom}` : ""}</div>
            </Link>
          ))}
        </div>

        <div className="cab-card">
          <div style={{ fontWeight: 700, marginBottom: "0.3rem" }}>Mes dossiers ouverts <span className="cab-muted">· {d.dossiers.length}</span></div>
          {d.dossiers.length === 0 && <div className="cab-muted" style={{ fontSize: "0.85rem" }}>Aucun dossier ouvert qui t&apos;est attribué.</div>}
          {d.dossiers.map((x: any) => (
            <Link key={x.id} href={`/avocat/dossiers/${x.id}`} style={carte}>
              <b>{x.titre}</b>
              <div className="cab-muted" style={{ fontSize: "0.78rem" }}>{x.client_nom || "-"}</div>
            </Link>
          ))}
        </div>

        {(d.facturesRetard.length > 0 || d.devisEnAttente > 0) && (
          <div className="cab-card">
            <div style={{ fontWeight: 700, marginBottom: "0.3rem" }}>Facturation</div>
            {d.devisEnAttente > 0 && (
              <Link href="/avocat/facturation" style={carte}>Devis en attente de réponse <b>· {d.devisEnAttente}</b></Link>
            )}
            {d.facturesRetard.map((f: any) => (
              <Link key={f.id} href="/avocat/facturation" style={carte}>
                <span style={{ color: "#e88a86" }}>En retard</span> · <b>{f.numero}</b> · {f.client_nom || "-"} · {montant(Number(f.montant))}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
