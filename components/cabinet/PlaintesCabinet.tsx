"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Props { direction: boolean; moiId: string; }

const heure = (s: string) => new Date(s).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// Plaintes internes : la direction voit tout, chaque employé voit seulement ses propres tickets
export default function PlaintesCabinet({ direction, moiId }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [sujet, setSujet] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const charger = () => fetch("/api/cabinet/plaintes").then(r => r.json()).then(d => { if (d.error) setErreur(d.error); else setRows(d.rows || []); });
  useEffect(() => { charger(); }, []);

  async function ouvrir() {
    if (sujet.trim().length < 3) return setErreur("Écris le sujet de ta plainte (3 caractères minimum).");
    setEnvoi(true); setErreur("");
    const r = await fetch("/api/cabinet/plaintes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sujet }) });
    const d = await r.json();
    setEnvoi(false);
    if (!r.ok) return setErreur(d.error || "Erreur");
    setSujet("");
    charger();
  }

  async function changerStatut(id: string, statut: "ouvert" | "ferme") {
    const r = await fetch(`/api/cabinet/plaintes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statut }) });
    if (!r.ok) return setErreur((await r.json()).error || "Erreur");
    charger();
  }

  return (
    <div>
      <div className="cab-card" style={{ marginBottom: "1rem" }}>
        <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Ouvrir une plainte</div>
        <div className="cab-muted" style={{ fontSize: "0.8rem", marginBottom: "0.6rem" }}>
          Seule la direction et toi pouvez voir ce ticket.
        </div>
        <input
          value={sujet}
          onChange={e => setSujet(e.target.value)}
          placeholder="Sujet de la plainte"
          maxLength={150}
          style={{ width: "100%", padding: "0.6rem", marginBottom: "0.6rem", borderRadius: 6, border: "1px solid var(--border, #333)", background: "transparent", color: "inherit" }}
        />
        <button className="btn btn-gold btn-sm" onClick={ouvrir} disabled={envoi}>{envoi ? "Envoi..." : "Ouvrir le ticket"}</button>
        {erreur && <div style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.5rem" }}>{erreur}</div>}
      </div>

      {rows.length === 0 && <div className="empty-state"><div className="empty-title">Aucune plainte</div></div>}

      {rows.map(p => (
        <div key={p.id} className="cab-card" style={{ marginBottom: "0.6rem" }}>
          <Link href={`/avocat/messagerie/plainte-${p.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
            <div style={{ fontWeight: 600 }}>{p.sujet}</div>
            <div className="cab-muted" style={{ fontSize: "0.75rem" }}>
              {direction && p.auteur_nom ? `${p.auteur_nom} · ` : ""}{heure(p.created_at)} · {p.statut === "ferme" ? "Fermée" : "Ouverte"}
            </div>
          </Link>
          {(direction || p.auteur_discord_id === moiId) && (
            <button
              className="btn btn-outline btn-sm"
              style={{ marginTop: "0.5rem" }}
              onClick={() => changerStatut(p.id, p.statut === "ferme" ? "ouvert" : "ferme")}
            >
              {p.statut === "ferme" ? "Rouvrir" : "Fermer"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
