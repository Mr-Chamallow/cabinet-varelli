"use client";
import { montant } from "@/lib/montant";
import Link from "next/link";
import { useEffect, useState } from "react";

const dateFr = (s?: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR") : "-");
const STATUT_FAC: Record<string, string> = { en_attente: "En attente", payee: "Payée", annulee: "Annulée" };

// Fiche client côté employés : identité, dossiers, factures, rendez-vous
export default function FicheClient({ discordId }: { discordId: string }) {
  const [d, setD] = useState<any>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    fetch(`/api/cabinet/clients/${discordId}`).then(r => r.json()).then(x => { if (x.error) setErreur(x.error); else setD(x); });
  }, [discordId]);

  if (erreur) return <div style={{ color: "#f87171" }}>{erreur}</div>;
  if (!d) return <div className="cab-muted">Chargement...</div>;

  const c = d.client;
  return (
    <div>
      <div className="cab-card" style={{ marginBottom: "1rem" }}>
        <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.4rem" }}>{c.nom_rp || c.discord_name}</div>
        <div className="cab-muted" style={{ fontSize: "0.85rem", lineHeight: 1.7 }}>
          Pseudo Discord : {c.discord_name || "-"}<br />
          Téléphone RP : {c.tel_rp || "-"}<br />
          ID perso : {c.id_perso || "-"}<br />
          ID Discord : <span style={{ fontFamily: "monospace" }}>{c.discord_id}</span><br />
          Inscrit le {dateFr(c.created_at)}
        </div>
      </div>

      <h2 className="cab-section-titre">Dossiers ({d.dossiers.length})</h2>
      {d.dossiers.length === 0 && <div className="cab-muted" style={{ marginBottom: "1rem" }}>Aucun dossier.</div>}
      {d.dossiers.map((x: any) => (
        <Link key={x.id} href={`/avocat/dossiers/${x.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          <div className="cab-card" style={{ marginBottom: "0.5rem" }}>
            <div style={{ fontWeight: 600 }}># {x.titre}</div>
            <div className="cab-muted" style={{ fontSize: "0.75rem" }}>{x.statut} · ouvert le {dateFr(x.created_at)}</div>
          </div>
        </Link>
      ))}

      <h2 className="cab-section-titre" style={{ marginTop: "1.2rem" }}>Factures ({d.factures.length})</h2>
      {d.factures.length === 0 && <div className="cab-muted" style={{ marginBottom: "1rem" }}>Aucune facture.</div>}
      {d.factures.map((f: any) => (
        <div key={f.id} className="cab-card" style={{ marginBottom: "0.5rem", display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 600 }}>{f.numero || "Facture"} · {montant(f.montant)}</div>
            <div className="cab-muted" style={{ fontSize: "0.75rem" }}>{STATUT_FAC[f.statut] || f.statut} · échéance {dateFr(f.date_echeance)}</div>
          </div>
          <a className="btn btn-outline btn-sm" href={`/api/cabinet/factures/${f.id}/pdf`} target="_blank" rel="noreferrer" style={{ alignSelf: "center" }}>PDF</a>
        </div>
      ))}

      <h2 className="cab-section-titre" style={{ marginTop: "1.2rem" }}>Rendez-vous ({d.rdv.length})</h2>
      {d.rdv.length === 0 && <div className="cab-muted">Aucun rendez-vous.</div>}
      {d.rdv.map((r: any) => (
        <div key={r.id} className="cab-card" style={{ marginBottom: "0.5rem" }}>
          <div style={{ fontWeight: 600 }}>{new Date(r.date_rdv).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</div>
          <div className="cab-muted" style={{ fontSize: "0.75rem" }}>{r.motif || "-"} · {r.statut}</div>
        </div>
      ))}
    </div>
  );
}
