"use client";
import { useEffect, useState } from "react";

interface Props { direction: boolean; }

const heure = (s: string) => new Date(s).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const CHOIX = [
  { id: "pour", label: "Pour" },
  { id: "contre", label: "Contre" },
  { id: "abstention", label: "Abstention" },
] as const;

// Votes internes : une proposition, un motif libre, un vote par employé (modifiable tant que le vote est ouvert)
export default function VotesCabinet({ direction }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [moiId, setMoiId] = useState("");
  const [titre, setTitre] = useState("");
  const [motif, setMotif] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const charger = () => fetch("/api/cabinet/votes").then(r => r.json()).then(d => {
    if (d.error) return setErreur(d.error);
    setRows(d.rows || []);
    setMoiId(d.moiId || "");
  });
  useEffect(() => { charger(); }, []);

  async function proposer() {
    if (titre.trim().length < 3) return setErreur("Donne un titre (3 caractères minimum).");
    setEnvoi(true); setErreur("");
    const r = await fetch("/api/cabinet/votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titre, motif }) });
    const d = await r.json();
    setEnvoi(false);
    if (!r.ok) return setErreur(d.error || "Erreur");
    setTitre(""); setMotif("");
    charger();
  }

  async function action(id: string, corps: any) {
    const r = await fetch(`/api/cabinet/votes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    const d = await r.json();
    if (!r.ok) return setErreur(d.error || "Erreur");
    charger();
  }

  return (
    <div>
      <div className="cab-card" style={{ marginBottom: "1rem" }}>
        <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Proposer un vote</div>
        <input
          value={titre}
          onChange={e => setTitre(e.target.value)}
          placeholder="Titre de la proposition"
          maxLength={150}
          style={{ width: "100%", padding: "0.6rem", marginBottom: "0.6rem", borderRadius: 6, border: "1px solid var(--border, #333)", background: "transparent", color: "inherit" }}
        />
        <textarea
          value={motif}
          onChange={e => setMotif(e.target.value)}
          placeholder="Motif (libre) : pourquoi ce changement ?"
          rows={4}
          maxLength={2000}
          style={{ width: "100%", padding: "0.6rem", marginBottom: "0.6rem", borderRadius: 6, border: "1px solid var(--border, #333)", background: "transparent", color: "inherit", resize: "vertical" }}
        />
        <button className="btn btn-gold btn-sm" onClick={proposer} disabled={envoi}>{envoi ? "Envoi..." : "Lancer le vote"}</button>
        {erreur && <div style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.5rem" }}>{erreur}</div>}
      </div>

      {rows.length === 0 && <div className="empty-state"><div className="empty-title">Aucun vote en cours</div></div>}

      {rows.map(v => {
        const reponses: any[] = v.cabinet_votes_reponses || [];
        const monChoix = reponses.find(x => x.voter_discord_id === moiId)?.choix;
        const ouvert = v.statut === "ouvert";
        const peutFermer = ouvert ? (v.auteur_discord_id === moiId || direction) : (v.auteur_discord_id === moiId || direction);
        return (
          <div key={v.id} className="cab-card" style={{ marginBottom: "0.8rem" }}>
            <div style={{ fontWeight: 600 }}>{v.titre}</div>
            <div className="cab-muted" style={{ fontSize: "0.75rem", marginBottom: "0.4rem" }}>
              Par {v.auteur_nom || "un employé"} · {heure(v.created_at)} · {ouvert ? "Ouvert" : "Fermé"}
            </div>
            {v.motif && <div style={{ whiteSpace: "pre-wrap", fontSize: "0.9rem", marginBottom: "0.6rem" }}>{v.motif}</div>}

            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
              {CHOIX.map(c => {
                const n = reponses.filter(x => x.choix === c.id).length;
                const actif = monChoix === c.id;
                return ouvert ? (
                  <button
                    key={c.id}
                    className={actif ? "btn btn-gold btn-sm" : "btn btn-outline btn-sm"}
                    onClick={() => action(v.id, { action: "voter", choix: c.id })}
                  >
                    {c.label} ({n})
                  </button>
                ) : (
                  <span key={c.id} className="cab-muted" style={{ fontSize: "0.85rem" }}>{c.label} : {n}</span>
                );
              })}
            </div>

            {reponses.length > 0 && (
              <div className="cab-muted" style={{ fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                {CHOIX.map(c => {
                  const noms = reponses.filter(x => x.choix === c.id).map(x => x.voter_nom || "employé");
                  return noms.length ? <div key={c.id}>{c.label} : {noms.join(", ")}</div> : null;
                })}
              </div>
            )}

            {peutFermer && (
              <button className="btn btn-outline btn-sm" onClick={() => action(v.id, { action: ouvert ? "fermer" : "rouvrir" })}>
                {ouvert ? "Clore le vote" : "Rouvrir le vote"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
