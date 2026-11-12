"use client";
import { useEffect, useState } from "react";

interface Props {
  id: string;
  direction: boolean;
  acces: { avocat_discord_id: string; avocat_nom: string }[];
  onChange: () => void;
}

// Membres du dossier. La direction et les avocats assignés peuvent ajouter ou retirer un employé.
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
  const disponibles = staff.filter(s => !dejaAttribues.has(s.discord_id));

  return (
    <div className="cab-card" style={{ marginBottom: "1rem" }}>
      <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Membres du dossier</div>
      {acces.length === 0 && <div style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>Aucun membre pour l&apos;instant.</div>}
      {acces.map(a => (
        <div key={a.avocat_discord_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
          <span>{a.avocat_nom}</span>
          {direction && <button className="btn btn-outline btn-sm" onClick={() => retirer(a.avocat_discord_id)}>Retirer</button>}
        </div>
      ))}
      {direction && (
        <div style={{ marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.82rem", marginBottom: "0.4rem", color: "var(--text-dim)" }}>Attribuer un avocat à ce dossier</div>
          {disponibles.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
              Aucun autre employé disponible. Chaque employé doit avoir un rôle du cabinet (Administration → Membres) pour apparaître ici.
            </div>
          ) : (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <select value={choix} onChange={e => setChoix(e.target.value)} style={{ flex: 1, minWidth: 180 }}>
                <option value="">Choisir un employé ({disponibles.length})</option>
                {disponibles.map(s => <option key={s.discord_id} value={s.discord_id}>{s.nom} ({s.role})</option>)}
              </select>
              <button className="btn btn-sm" onClick={ajouter} disabled={!choix}>Attribuer</button>
            </div>
          )}
        </div>
      )}
      {!direction && (
        <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.6rem" }}>Seule la direction ou un avocat du dossier peut ajouter un membre.</div>
      )}
      {erreur && <div style={{ color: "var(--danger)", marginTop: "0.5rem" }}>{erreur}</div>}
    </div>
  );
}
