"use client";
import { useEffect, useState } from "react";

interface Props { id: string; peutGerer: boolean; onChange: () => void; }

// Clients supplémentaires du dossier : ils voient le dossier et la messagerie, comme le client principal
export default function ClientsDossier({ id, peutGerer, onChange }: Props) {
  const [clients, setClients] = useState<any[]>([]);
  const [recherche, setRecherche] = useState("");
  const [resultats, setResultats] = useState<any[]>([]);
  const [erreur, setErreur] = useState("");

  const charger = () => fetch(`/api/cabinet/dossiers/${id}/clients`).then(r => r.json()).then(d => d.error ? setErreur(d.error) : setClients(d.rows || []));
  useEffect(() => { charger(); }, [id]);

  useEffect(() => {
    if (!peutGerer || recherche.trim().length < 2) { setResultats([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/cabinet/clients?q=${encodeURIComponent(recherche.trim())}`).then(r => r.json()).then(d => setResultats(d.rows || []));
    }, 250);
    return () => clearTimeout(t);
  }, [recherche, peutGerer]);

  const ajouter = async (cid: string) => {
    setErreur("");
    const r = await fetch(`/api/cabinet/dossiers/${id}/clients`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_discord_id: cid }) });
    const d = await r.json();
    if (!r.ok) return setErreur(d.error || "Erreur");
    setRecherche(""); setResultats([]);
    charger(); onChange();
  };

  const retirer = async (cid: string) => {
    setErreur("");
    const r = await fetch(`/api/cabinet/dossiers/${id}/clients?client_discord_id=${encodeURIComponent(cid)}`, { method: "DELETE" });
    const d = await r.json();
    if (!r.ok) return setErreur(d.error || "Erreur");
    charger(); onChange();
  };

  return (
    <div className="cab-card" style={{ marginTop: "1rem" }}>
      <div className="cab-section-titre" style={{ fontSize: "0.9rem" }}>Clients du dossier</div>
      <div className="cab-muted" style={{ fontSize: "0.8rem", marginBottom: "0.6rem" }}>
        Chaque client ajouté voit le dossier et la messagerie. La facturation reste sur le client principal.
      </div>
      {erreur && <div style={{ color: "#f87171", fontSize: "0.82rem", marginBottom: "0.5rem" }}>{erreur}</div>}

      {clients.length === 0 && <div className="cab-muted" style={{ fontSize: "0.85rem" }}>Aucun client supplémentaire.</div>}
      {clients.map(c => (
        <div key={c.client_discord_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0", borderBottom: "1px solid var(--border, #333)" }}>
          <span>{c.client_nom || c.client_discord_id} <span className="cab-muted" style={{ fontSize: "0.72rem" }}>{c.client_discord_id}</span></span>
          {peutGerer && <button className="btn btn-outline btn-sm" onClick={() => retirer(c.client_discord_id)}>Retirer</button>}
        </div>
      ))}

      {peutGerer && (
        <div style={{ marginTop: "0.8rem" }}>
          <input placeholder="Rechercher un client (nom RP, pseudo ou ID Discord)" value={recherche} onChange={e => setRecherche(e.target.value)} />
          {resultats.map(c => (
            <div key={c.discord_id} className="cab-card" style={{ marginTop: "0.4rem", cursor: "pointer", padding: "0.5rem 0.7rem" }} onClick={() => ajouter(c.discord_id)}>
              {c.nom_rp || c.discord_name} <span className="cab-muted" style={{ fontSize: "0.72rem" }}>{c.discord_id}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
