"use client";
import { useEffect, useState } from "react";

interface Props {
  id: string;
  direction: boolean;
  acces: { avocat_discord_id: string; avocat_nom: string }[];
  onChange: () => void;
}

// Avocats qui ont accès à ce dossier. Seule la direction peut ajouter ou retirer un avocat.
export default function AttributionDossier({ id, direction, acces, onChange }: Props) {
  const [staff, setStaff] = useState<any[]>([]);
  const [choix, setChoix] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!direction) return;
    fetch("/api/cabinet/staff").then(r => r.json()).then(d => setStaff(d.rows || []));
  }, [direction]);

  const ajouter = async () => {
    setErreur("");
    if (!choix) return;
    const r = await fetch(`/api/cabinet/dossiers/${id}/acces`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avocat_discord_id: choix }) });
    const d = await r.json();
    if (!r.ok || d.error) return setErreur(d.error || "Erreur");
    setChoix("");
    onChange();
  };

  const retirer = async (discordId: string) => {
    setErreur("");
    const r = await fetch(`/api/cabinet/dossiers/${id}/acces`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avocat_discord_id: discordId }) });
    const d = await r.json();
    if (!r.ok || d.error) return setErreur(d.error || "Erreur");
    onChange();
  };

  const dejaAttribues = new Set(acces.map(a => a.avocat_discord_id));

  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Avocats sur ce dossier</div>
      {acces.length === 0 && <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>Aucun avocat attribué.</div>}
      {acces.map(a => (
        <div key={a.avocat_discord_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
          <span>{a.avocat_nom}</span>
          {direction && <button className="btn btn-outline btn-sm" onClick={() => retirer(a.avocat_discord_id)}>Retirer</button>}
        </div>
      ))}
      {direction && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
          <select value={choix} onChange={e => setChoix(e.target.value)} style={{ flex: 1, minWidth: 180 }}>
            <option value="">Choisir un avocat</option>
            {staff.filter(s => !dejaAttribues.has(s.discord_id)).map(s => <option key={s.discord_id} value={s.discord_id}>{s.nom} ({s.role})</option>)}
          </select>
          <button className="btn btn-sm" onClick={ajouter}>Attribuer</button>
        </div>
      )}
      {erreur && <div style={{ color: "var(--danger)", marginTop: "0.5rem" }}>{erreur}</div>}
    </div>
  );
}
