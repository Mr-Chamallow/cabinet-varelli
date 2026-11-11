"use client";
import { montant } from "@/lib/montant";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTempsReel } from "@/lib/useTempsReel";
import { supprimerDefinitivement } from "@/lib/suppression";

const heure = (s: string) => new Date(s).toLocaleString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

// Tableau de bord direction : vue d'ensemble, mise à jour en temps réel
export default function TableauBord() {
  const [d, setD] = useState<any>(null);
  const [erreur, setErreur] = useState("");
  const [info, setInfo] = useState("");

  const charger = () => fetch("/api/cabinet/direction").then(r => r.json()).then(x => { if (x.error) setErreur(x.error); else setD(x); });
  useEffect(() => { charger(); }, []);
  useTempsReel(d?.topics?.votes, charger);
  useTempsReel(d?.topics?.plaintes, charger);

  const purger = async (corps: any, quoi: string) => {
    const res = await supprimerDefinitivement(corps, quoi);
    setInfo(res.message);
    if (res.ok) charger();
  };

  if (erreur) return <div style={{ color: "#f87171" }}>{erreur}</div>;
  if (!d) return <div className="cab-muted">Chargement...</div>;

  const kpi = (titre: string, valeur: string | number, couleur?: string) => (
    <div className="cab-card">
      <div className="cab-muted" style={{ fontSize: "0.75rem" }}>{titre}</div>
      <div style={{ fontWeight: 700, fontSize: "1.25rem", color: couleur }}>{valeur}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.7rem", marginBottom: "1.2rem" }}>
        {kpi("Dossiers ouverts", d.dossiers.ouvert)}
        {kpi("RDV aujourd'hui", d.rdvJour.length)}
        {kpi("Votes en cours", d.votesOuverts.length)}
        {kpi("Plaintes ouvertes", d.plaintesOuvertes, d.plaintesOuvertes > 0 ? "#f87171" : undefined)}
        {kpi("Encaissé", montant(d.factures.encaisse), "#5fb878")}
        {kpi("En attente", montant(d.factures.attente), "#e0b050")}
        {kpi("Factures en retard", d.factures.retard, d.factures.retard > 0 ? "#f87171" : undefined)}
      </div>

      <h2 className="cab-section-titre">Rendez-vous du jour</h2>
      {d.rdvJour.length === 0 && <div className="cab-muted" style={{ marginBottom: "1rem" }}>Aucun rendez-vous aujourd'hui.</div>}
      {d.rdvJour.map((r: any) => (
        <div key={r.id} className="cab-card" style={{ marginBottom: "0.5rem" }}>
          <div style={{ fontWeight: 600 }}>{heure(r.date_rdv)} · {r.client_nom || "Client"}</div>
          <div className="cab-muted" style={{ fontSize: "0.78rem" }}>{r.motif || "-"} · {r.avocat_nom ? `Avocat : ${r.avocat_nom}` : "Avocat non attribué"} · {r.statut}</div>
        </div>
      ))}

      <h2 className="cab-section-titre" style={{ marginTop: "1.2rem" }}>Votes en cours</h2>
      {d.votesOuverts.length === 0 && <div className="cab-muted" style={{ marginBottom: "1rem" }}>Aucun vote en cours.</div>}
      {d.votesOuverts.map((v: any) => (
        <Link key={v.id} href="/avocat/votes" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
          <div className="cab-card" style={{ marginBottom: "0.5rem" }}>
            <div style={{ fontWeight: 600 }}>{v.titre}</div>
            <div className="cab-muted" style={{ fontSize: "0.78rem" }}>Pour : {v.pour} · Contre : {v.contre}</div>
          </div>
        </Link>
      ))}

      <h2 className="cab-section-titre" style={{ marginTop: "1.2rem" }}>Accès rapides</h2>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Link className="btn btn-outline btn-sm" href="/avocat/comptabilite">Comptabilité</Link>
        <Link className="btn btn-outline btn-sm" href="/avocat/plaintes">Plaintes internes</Link>
        <Link className="btn btn-outline btn-sm" href="/avocat/votes">Votes</Link>
        <Link className="btn btn-outline btn-sm" href="/avocat/rdv">Rendez-vous</Link>
      </div>

      <h2 className="cab-section-titre" style={{ marginTop: "1.6rem" }}>Suppression définitive</h2>
      <div className="cab-muted" style={{ fontSize: "0.8rem", marginBottom: "0.6rem" }}>
        Irréversible. Efface aussi les messages, notes internes et membres liés. Réservé à la direction.
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button className="btn btn-outline btn-sm" style={{ color: "#f87171", borderColor: "#f87171" }} onClick={() => purger({ type: "toutes_factures" }, "toutes les factures")}>Supprimer toutes les factures</button>
        <button className="btn btn-outline btn-sm" style={{ color: "#f87171", borderColor: "#f87171" }} onClick={() => purger({ type: "tous_dossiers" }, "tous les dossiers, avec leurs messages et leurs factures")}>Supprimer tous les dossiers</button>
      </div>
      {info && <div style={{ marginTop: "0.6rem", fontSize: "0.85rem", color: "var(--gold)" }}>{info}</div>}
    </div>
  );
}
