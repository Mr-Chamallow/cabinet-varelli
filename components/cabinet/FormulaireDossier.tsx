"use client";
import { tarifsGroupes } from "@/lib/tarifs";
import { useEffect, useState } from "react";

interface Props {
  staff: boolean;
  onCree: (dossier: any) => void;
}

// Formulaire d'ouverture d'un dossier (client pour lui-même, employé pour un client)
export default function FormulaireDossier({ staff, onCree }: Props) {
  const [types, setTypes] = useState<any[]>([]);
  const [tarifs, setTarifs] = useState<any[]>([]);
  const [erreur, setErreur] = useState("");
  const [titre, setTitre] = useState("");
  const [typeId, setTypeId] = useState("");
  const [prestation, setPrestation] = useState("");
  const [recherche, setRecherche] = useState("");
  const [resultats, setResultats] = useState<any[]>([]);
  const [client, setClient] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/cabinet/cabinet_dossier_types").then(r => r.json()).then(d => setTypes(d.rows || []));
    fetch("/api/cabinet/cabinet_tarifs").then(r => r.json()).then(d => setTarifs(d.rows || []));
  }, []);

  // Recherche de client (employé) par pseudo, nom RP ou ID Discord
  useEffect(() => {
    if (!staff || recherche.trim().length < 2) { setResultats([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/cabinet/clients?q=${encodeURIComponent(recherche.trim())}`).then(r => r.json()).then(d => setResultats(d.rows || []));
    }, 300);
    return () => clearTimeout(t);
  }, [recherche, staff]);

  const creer = async () => {
    setErreur("");
    const body: any = { titre, type_id: typeId || null, prestation };
    if (staff) {
      if (!client) return setErreur("Choisis un client (recherche ou ID Discord)");
      body.client_discord_id = client.discord_id;
    }
    const r = await fetch("/api/cabinet/dossiers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok || d.error) return setErreur(d.error || "Erreur");
    window.dispatchEvent(new Event("dossiers-maj"));
    onCree(d);
  };

  return (
    <div>
      <div className="form-group"><label>Type de dossier</label>
        <select value={typeId} onChange={e => setTypeId(e.target.value)}>
          <option value="">Choisir</option>
          {types.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
        </select>
      </div>
      <div className="form-group"><label>Prestation (grille tarifaire)</label>
        <select value={prestation} onChange={e => setPrestation(e.target.value)}>
          <option value="">Choisir une prestation</option>
          {tarifsGroupes(tarifs).map(([cat, items]) => <optgroup key={cat} label={cat}>{items.map(t => <option key={t.id} value={t.nom}>{t.nom}</option>)}</optgroup>)}
        </select>
      </div>
      <div className="form-group"><label>Titre du dossier</label><input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex : Changement de nom de Jean Dupont" /></div>

      {staff && (
        <div className="form-group">
          <label>Client</label>
          {client ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
              <span>{client.nom_rp || client.discord_name} <span style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>({client.discord_id})</span></span>
              <button className="btn btn-outline btn-sm" onClick={() => setClient(null)}>Changer</button>
            </div>
          ) : (
            <>
              <input value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Pseudo, nom RP ou ID Discord" />
              {resultats.map(c => (
                <div key={c.discord_id} className="cab-card" style={{ marginTop: "0.4rem", cursor: "pointer", padding: "0.5rem 0.7rem" }} onClick={() => setClient(c)}>
                  {c.nom_rp}, {c.discord_name} <span style={{ color: "var(--text-dim)", fontSize: "0.72rem" }}>{c.discord_id}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {erreur && <div style={{ color: "var(--danger)", marginBottom: "0.6rem" }}>{erreur}</div>}
      <button className="btn btn-sm" onClick={creer}>Ouvrir le dossier</button>
    </div>
  );
}
