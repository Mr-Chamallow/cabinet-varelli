"use client";
import { useEffect, useState } from "react";
import FilMessages from "@/components/cabinet/FilMessages";
import AttributionDossier from "@/components/cabinet/AttributionDossier";

interface Props { id: string; moiId: string; staff: boolean; direction: boolean; }

// Préviens la liste des dossiers qu'un titre ou un statut a changé
const avertirListe = () => window.dispatchEvent(new Event("dossiers-maj"));

// Un dossier = un salon privé : en-tête, statut, attribution, messagerie client, notes internes
export default function DossierChat({ id, moiId, staff, direction }: Props) {
  const [dossier, setDossier] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [renommer, setRenommer] = useState(false);
  const [nouveauTitre, setNouveauTitre] = useState("");

  const charger = () => fetch(`/api/cabinet/dossiers?id=${id}`).then(r => r.json()).then(d => {
    setDossier((d.rows || [])[0] || null);
    setChargement(false);
  });
  useEffect(() => { setChargement(true); charger(); }, [id]);

  const envoyer = async (corps: any) => {
    setErreur("");
    const r = await fetch("/api/cabinet/dossiers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...corps }) });
    const d = await r.json();
    if (!r.ok || d.error) { setErreur(d.error || "Erreur"); return false; }
    await charger();
    avertirListe();
    return true;
  };

  const enregistrerTitre = async () => {
    if (!nouveauTitre.trim()) return;
    if (await envoyer({ titre: nouveauTitre.trim() })) setRenommer(false);
  };

  if (chargement) return <div style={{ color: "var(--text-dim)" }}>Chargement...</div>;
  if (!dossier) return <div className="empty-state"><div className="empty-title">Dossier introuvable ou non accessible</div></div>;

  const ouvert = dossier.statut === "ouvert";
  const gerer = direction || (dossier.cabinet_dossier_acces || []).some((a: any) => a.avocat_discord_id === moiId);
  const peutGerer = staff && gerer;

  return (
    <div>
      <div className="card" style={{ marginBottom: "1rem" }}>
        {renommer ? (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <input value={nouveauTitre} onChange={e => setNouveauTitre(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
            <button className="btn btn-sm" onClick={enregistrerTitre}>Enregistrer</button>
            <button className="btn btn-outline btn-sm" onClick={() => setRenommer(false)}>Annuler</button>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <div style={{ fontWeight: 700 }}># {dossier.titre}</div>
            {peutGerer && <button className="btn btn-outline btn-sm" onClick={() => { setNouveauTitre(dossier.titre); setRenommer(true); }}>Renommer</button>}
          </div>
        )}
        <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
          Statut : <b style={{ color: "var(--gold)" }}>{dossier.statut}</b>
          {dossier.prestation ? `, prestation : ${dossier.prestation}` : ""}
          {staff ? `, client : ${dossier.client_nom || "?"}` : ""}
        </div>
        {peutGerer && (
          <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
            {!ouvert && <button className="btn btn-outline btn-sm" onClick={() => envoyer({ statut: "ouvert" })}>Ouvrir la messagerie</button>}
            {ouvert && <button className="btn btn-outline btn-sm" onClick={() => envoyer({ statut: "ferme" })}>Fermer la messagerie</button>}
            {dossier.statut !== "archive" && <button className="btn btn-outline btn-sm" onClick={() => envoyer({ statut: "archive" })}>Archiver</button>}
          </div>
        )}
        {erreur && <div style={{ color: "var(--danger)", marginTop: "0.5rem" }}>{erreur}</div>}
      </div>

      {staff && <AttributionDossier id={id} direction={direction} acces={dossier.cabinet_dossier_acces || []} onChange={() => { charger(); avertirListe(); }} />}

      {!ouvert && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--text-dim)" }}>
          Dossier {dossier.statut === "archive" ? "archivé" : "fermé"} : lecture seule.
        </div>
      )}

      <FilMessages url={`/api/cabinet/dossiers/${id}/messages`} lecture={!ouvert} />

      {peutGerer && (
        <div style={{ marginTop: "2rem" }}>
          <div style={{ fontFamily: "'Cinzel', serif", color: "var(--gold)", marginBottom: "0.6rem" }}>Notes internes (cabinet uniquement)</div>
          <FilMessages url={`/api/cabinet/chat/dossier-${id}`} titreVide="Aucune note interne." />
        </div>
      )}
    </div>
  );
}
