"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FilMessages from "@/components/cabinet/FilMessages";
import AttributionDossier from "@/components/cabinet/AttributionDossier";
import { montant } from "@/lib/montant";
import { supprimerDefinitivement } from "@/lib/suppression";

interface Props { id: string; moiId: string; staff: boolean; direction: boolean; compta: boolean; }

// Préviens la liste des dossiers qu'un titre ou un statut a changé
const avertirListe = () => window.dispatchEvent(new Event("dossiers-maj"));

const STATUT: Record<string, { label: string; couleur: string }> = {
  ouvert: { label: "Ouvert", couleur: "#5fb878" },
  ferme: { label: "Messagerie fermée", couleur: "#e0b050" },
  archive: { label: "Archivé", couleur: "#9ca3af" },
};
const STATUT_FAC: Record<string, string> = { en_attente: "En attente", payee: "Payée", annulee: "Annulée" };

type Onglet = "messages" | "membres" | "factures" | "notes";

// Un dossier : une en-tête sobre, puis un seul panneau à la fois (onglets)
export default function DossierChat({ id, moiId, staff, direction, compta }: Props) {
  const [dossier, setDossier] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [renommer, setRenommer] = useState(false);
  const [nouveauTitre, setNouveauTitre] = useState("");
  const [onglet, setOnglet] = useState<Onglet>("messages");
  const [factures, setFactures] = useState<any[]>([]);
  const router = useRouter();

  const charger = () => fetch(`/api/cabinet/dossiers?id=${id}`).then(r => r.json()).then(d => {
    setDossier((d.rows || [])[0] || null);
    setChargement(false);
  });
  useEffect(() => { setChargement(true); charger(); }, [id]);

  // Factures du dossier (employés seulement)
  useEffect(() => {
    if (!compta || onglet !== "factures") return;
    fetch("/api/cabinet/factures").then(r => r.json()).then(d => setFactures((d.rows || []).filter((f: any) => f.dossier_id === id)));
  }, [onglet, id, staff]);

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

  // Retire un dossier archivé de sa seule liste (les autres participants le gardent)
  const retirerPourMoi = async () => {
    if (!window.confirm("Retirer ce dossier de ta liste ? Il reste visible pour les autres participants.")) return;
    setErreur("");
    const r = await fetch(`/api/cabinet/dossiers/${id}/masquer`, { method: "POST" });
    const d = await r.json();
    if (!r.ok || d.error) return setErreur(d.error || "Erreur");
    avertirListe();
    router.push("/avocat/dossiers");
  };

  if (chargement) return <div style={{ color: "var(--text-dim)" }}>Chargement...</div>;
  if (!dossier) return <div className="empty-state"><div className="empty-title">Dossier introuvable ou non accessible</div></div>;

  const ouvert = dossier.statut === "ouvert";
  const gerer = direction || (dossier.cabinet_dossier_acces || []).some((a: any) => a.avocat_discord_id === moiId);
  const peutGerer = staff && gerer;
  const statut = STATUT[dossier.statut] || { label: dossier.statut, couleur: "#9ca3af" };

  const onglets: { id: Onglet; label: string; visible: boolean }[] = [
    { id: "messages", label: "Messages", visible: true },
    { id: "membres", label: `Membres (${(dossier.cabinet_dossier_acces || []).length})`, visible: staff },
    { id: "factures", label: "Factures", visible: compta },
    { id: "notes", label: "Notes internes", visible: peutGerer },
  ];

  const bouton: React.CSSProperties = { fontSize: "0.8rem" };

  const supprimerCeDossier = async () => {
    const res = await supprimerDefinitivement({ type: "dossier", id }, `le dossier « ${dossier.titre} » et tout son contenu`);
    if (!res.ok) return setErreur(res.message);
    avertirListe();
    router.push("/avocat/dossiers");
  };

  return (
    <div>
      {/* En-tête */}
      <div className="cab-card" style={{ marginBottom: "0.8rem" }}>
        {renommer ? (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <input value={nouveauTitre} onChange={e => setNouveauTitre(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
            <button className="btn btn-sm" onClick={enregistrerTitre}>Enregistrer</button>
            <button className="btn btn-outline btn-sm" onClick={() => setRenommer(false)}>Annuler</button>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.6rem", flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", wordBreak: "break-word" }}># {dossier.titre}</div>
              <div className="cab-muted" style={{ fontSize: "0.8rem", marginTop: "0.2rem" }}>
                {staff && dossier.client_nom ? `${dossier.client_nom}` : ""}
                {dossier.prestation ? `${staff && dossier.client_nom ? " · " : ""}${dossier.prestation}` : ""}
              </div>
            </div>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: statut.couleur, border: `1px solid ${statut.couleur}`, borderRadius: 20, padding: "0.2rem 0.6rem", whiteSpace: "nowrap" }}>
              {statut.label}
            </span>
          </div>
        )}

        {peutGerer && !renommer && (
          <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.7rem", flexWrap: "wrap" }}>
            <button className="btn btn-outline btn-sm" style={bouton} onClick={() => { setNouveauTitre(dossier.titre); setRenommer(true); }}>Renommer</button>
            {!ouvert && dossier.statut !== "archive" && <button className="btn btn-outline btn-sm" style={bouton} onClick={() => envoyer({ statut: "ouvert" })}>Rouvrir la messagerie</button>}
            {ouvert && <button className="btn btn-outline btn-sm" style={bouton} onClick={() => envoyer({ statut: "ferme" })}>Fermer la messagerie</button>}
            {dossier.statut !== "archive" && <button className="btn btn-outline btn-sm" style={bouton} onClick={() => envoyer({ statut: "archive" })}>Archiver</button>}
            {direction && <button className="btn btn-outline btn-sm" style={{ ...bouton, color: "#f87171", borderColor: "#f87171" }} onClick={supprimerCeDossier}>Supprimer définitivement</button>}
          </div>
        )}
        {dossier.statut === "archive" && (
          <div style={{ marginTop: "0.6rem" }}>
            <button className="btn btn-outline btn-sm" style={bouton} onClick={retirerPourMoi}>Supprimer de ma liste</button>
          </div>
        )}
        {erreur && <div style={{ color: "var(--danger)", marginTop: "0.5rem", fontSize: "0.85rem" }}>{erreur}</div>}
      </div>

      {/* Onglets : un seul panneau visible à la fois */}
      <div style={{ display: "flex", gap: "0.2rem", borderBottom: "1px solid var(--border, #2a2a2a)", marginBottom: "1rem", overflowX: "auto" }}>
        {onglets.filter(o => o.visible).map(o => {
          const actif = onglet === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setOnglet(o.id)}
              style={{
                background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                padding: "0.6rem 0.9rem", fontSize: "0.85rem", fontWeight: actif ? 700 : 500,
                color: actif ? "var(--gold)" : "var(--text-dim)",
                borderBottom: actif ? "2px solid var(--gold)" : "2px solid transparent", marginBottom: -1,
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {/* Panneau : Messages */}
      {onglet === "messages" && (
        <div>
          {!ouvert && <div className="cab-muted" style={{ fontSize: "0.85rem", marginBottom: "0.6rem" }}>Lecture seule : la messagerie de ce dossier est {dossier.statut === "archive" ? "archivée" : "fermée"}.</div>}
          <FilMessages url={`/api/cabinet/dossiers/${id}/messages`} lecture={!ouvert} />
        </div>
      )}

      {/* Panneau : Membres */}
      {onglet === "membres" && staff && (
        <AttributionDossier id={id} direction={gerer} acces={dossier.cabinet_dossier_acces || []} onChange={() => { charger(); avertirListe(); }} />
      )}

      {/* Panneau : Factures */}
      {onglet === "factures" && compta && (
        <div>
          {peutGerer && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.8rem" }}>
              <button className="btn btn-gold btn-sm" onClick={() => router.push(`/avocat/comptabilite?dossier=${id}`)}>+ Nouvelle facture</button>
            </div>
          )}
          {factures.length === 0 && <div className="cab-muted">Aucune facture pour ce dossier.</div>}
          {factures.map(f => (
            <div key={f.id} className="cab-card" style={{ marginBottom: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{f.numero || "Facture"} · {montant(f.montant)}</div>
                <div className="cab-muted" style={{ fontSize: "0.75rem" }}>{STATUT_FAC[f.statut] || f.statut}{f.date_echeance ? ` · échéance ${new Date(f.date_echeance).toLocaleDateString("fr-FR")}` : ""}</div>
              </div>
              <a className="btn btn-outline btn-sm" href={`/api/cabinet/factures/${f.id}/pdf`} target="_blank" rel="noreferrer">PDF</a>
            </div>
          ))}
        </div>
      )}

      {/* Panneau : Notes internes */}
      {onglet === "notes" && peutGerer && (
        <div>
          <div className="cab-muted" style={{ fontSize: "0.8rem", marginBottom: "0.6rem" }}>Visible uniquement par le cabinet, jamais par le client.</div>
          <FilMessages url={`/api/cabinet/chat/dossier-${id}`} titreVide="Aucune note interne." />
        </div>
      )}
    </div>
  );
}
