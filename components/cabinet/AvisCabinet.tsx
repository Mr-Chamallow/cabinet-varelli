"use client";
import { useEffect, useState } from "react";

const etoiles = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

// Avis clients publiés + formulaire pour laisser un avis (validé ensuite par le cabinet)
export default function AvisCabinet() {
  const [rows, setRows] = useState<any[]>([]);
  const [note, setNote] = useState(5);
  const [contenu, setContenu] = useState("");
  const [erreur, setErreur] = useState("");
  const [merci, setMerci] = useState(false);

  const charger = () => fetch("/api/cabinet/avis").then(r => r.json()).then(d => setRows(d.rows || []));
  useEffect(() => { charger(); }, []);

  const envoyer = async () => {
    setErreur("");
    const r = await fetch("/api/cabinet/avis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note, contenu }) });
    const d = await r.json();
    if (!r.ok || d.error) return setErreur(d.error || "Erreur");
    setContenu(""); setNote(5); setMerci(true);
  };

  return (
    <section>
      <h2 className="cab-section-titre">Avis de nos clients</h2>
      {rows.length === 0 && <div className="cab-muted" style={{ marginBottom: "1rem" }}>Aucun avis publié pour le moment.</div>}
      <div className="cab-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: "1rem", marginBottom: "1.2rem" }}>
        {rows.map(a => (
          <div key={a.id} className="cab-card">
            <div className="cab-etoiles">{etoiles(a.note)}</div>
            <p className="cab-muted" style={{ color: "var(--text)", margin: "0.6rem 0" }}>« {a.contenu} »</p>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{a.auteur_nom}</div>
          </div>
        ))}
      </div>

      <div className="cab-card">
        {merci ? (
          <div className="cab-muted">Merci pour ton avis ! Il sera publié après validation par le cabinet.</div>
        ) : (
          <>
            <div className="cab-title" style={{ fontSize: "0.9rem", marginBottom: "0.6rem" }}>Laisser un avis</div>
            <div className="form-group"><label>Note</label>
              <select value={note} onChange={e => setNote(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{etoiles(n)}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Ton expérience</label>
              <textarea value={contenu} onChange={e => setContenu(e.target.value)} maxLength={800} placeholder="Ce que tu as apprécié, en quelques mots" />
            </div>
            {erreur && <div style={{ color: "var(--danger)", marginBottom: "0.5rem" }}>{erreur}</div>}
            <button className="btn btn-gold btn-sm" onClick={envoyer}>Envoyer mon avis</button>
          </>
        )}
      </div>
    </section>
  );
}
