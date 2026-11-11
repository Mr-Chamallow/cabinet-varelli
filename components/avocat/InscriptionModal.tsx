"use client";
import { useState } from "react";

interface Props {
  profil?: any;
  discord: { discord_id: string; discord_name: string };
  onClose?: () => void;
  onDone: () => void;
}

export default function InscriptionModal({ profil, discord, onClose, onDone }: Props) {
  const edition = !!profil;
  const [nom_rp, setNom] = useState(profil?.nom_rp ?? "");
  const [tel_rp, setTel] = useState(profil?.tel_rp ?? "");
  const [id_perso, setIdp] = useState(profil?.id_perso ?? "");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function valider() {
    setErreur("");
    setEnvoi(true);
    const res = await fetch("/api/avocat/profil", {
      method: edition ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom_rp, tel_rp, id_perso }),
    });
    const data = await res.json();
    setEnvoi(false);
    if (!res.ok) { setErreur(data.error || "Erreur"); return; }
    onDone();
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{edition ? "Mes informations" : "Créer mon compte client"}</h2>
          {onClose && <button className="modal-close" onClick={onClose}>×</button>}
        </div>
        <div className="modal-body">
          <div className="form-group"><label>Pseudo Discord</label><input value={discord.discord_name} disabled /></div>
          <div className="form-group"><label>ID Discord</label><input value={discord.discord_id} disabled style={{ fontFamily: "monospace" }} /></div>
          <div className="form-group"><label>Nom et prénom RP *</label><input autoFocus value={nom_rp} onChange={e => setNom(e.target.value)} /></div>
          <div className="form-group"><label>Téléphone RP *</label><input value={tel_rp} onChange={e => setTel(e.target.value)} /></div>
          <div className="form-group"><label>ID personnage *</label><input value={id_perso} onChange={e => setIdp(e.target.value)} /></div>
          {erreur && <div style={{ color: "var(--danger)", fontSize: "0.85rem" }}>⚠️ {erreur}</div>}
        </div>
        <div className="modal-footer">
          {onClose && <button className="btn btn-outline" onClick={onClose}>Annuler</button>}
          <button className="btn btn-gold" onClick={valider} disabled={envoi || !nom_rp.trim() || !tel_rp.trim() || !id_perso.trim()}>
            {envoi ? "…" : edition ? "Enregistrer" : "Créer mon compte"}
          </button>
        </div>
      </div>
    </div>
  );
}