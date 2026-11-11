"use client";
import { useEffect, useState } from "react";
import FilMessages from "@/components/cabinet/FilMessages";
import AttributionDossier from "@/components/cabinet/AttributionDossier";

interface Props { id: string; staff: boolean; direction: boolean; }

// Dossier : en-tête, statut, attribution (direction), messagerie client, notes internes (staff)
export default function DossierChat({ id, staff, direction }: Props) {
  const [dossier, setDossier] = useState<any>(null);
  const [erreur, setErreur] = useState("");

  const charger = () => fetch(`/api/cabinet/dossiers?id=${id}`).then(r => r.json()).then(d => setDossier((d.rows || [])[0] || null));
  useEffect(() => { charger(); }, [id]);

  const changerStatut = async (statut: string) => {
    setErreur("");
    const r = await fetch("/api/cabinet/dossiers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, statut }) });
    const d = await r.json();
    if (!r.ok || d.error) return setErreur(d.error || "Erreur");
    charger();
  };

  const ouvert = dossier?.statut === "ouvert";

  return (
    <div>
      {dossier && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div style={{ fontWeight: 700 }}>{dossier.titre}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
            Statut : <b style={{ color: "var(--gold)" }}>{dossier.statut}</b>
            {dossier.prestation ? `, prestation : ${dossier.prestation}` : ""}
            {staff ? `, client : ${dossier.client_nom || "?"}` : ""}
          </div>
          {staff && (
            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
              {dossier.statut !== "ouvert" && <button className="btn btn-outline btn-sm" onClick={() => changerStatut("ouvert")}>Ouvrir la messagerie</button>}
              {dossier.statut === "ouvert" && <button className="btn btn-outline btn-sm" onClick={() => changerStatut("ferme")}>Fermer la messagerie</button>}
              {dossier.statut !== "archive" && <button className="btn btn-outline btn-sm" onClick={() => changerStatut("archive")}>Archiver</button>}
            </div>
          )}
          {erreur && <div style={{ color: "var(--danger)", marginTop: "0.5rem" }}>{erreur}</div>}
        </div>
      )}

      {staff && dossier && <AttributionDossier id={id} direction={direction} acces={dossier.cabinet_dossier_acces || []} onChange={charger} />}

      {dossier && !ouvert && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--text-dim)" }}>
          Dossier {dossier.statut === "archive" ? "archivé" : "fermé"} : lecture seule.
        </div>
      )}

      <FilMessages url={`/api/cabinet/dossiers/${id}/messages`} lecture={!ouvert} />

      {staff && (
        <div style={{ marginTop: "2rem" }}>
          <div style={{ fontFamily: "'Cinzel', serif", color: "var(--gold)", marginBottom: "0.6rem" }}>Notes internes (cabinet uniquement)</div>
          <FilMessages url={`/api/cabinet/chat/dossier-${id}`} titreVide="Aucune note interne." />
        </div>
      )}
    </div>
  );
}
