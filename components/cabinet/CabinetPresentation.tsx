"use client";
import { useEffect, useState } from "react";

// Texte de présentation : lu par tous, modifiable par ceux qui ont "Présentation (édition)"
export default function CabinetPresentation({ canWrite }: { canWrite: boolean }) {
  const [texte, setTexte] = useState("");
  const [brouillon, setBrouillon] = useState("");
  const [editer, setEditer] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/cabinet/cabinet_pages").then(r => r.json()).then(d => {
      const p = (d.rows || []).find((x: any) => x.cle === "presentation");
      setTexte(p?.contenu || "");
    });
  }, []);

  const enregistrer = async () => {
    const r = await fetch("/api/cabinet/cabinet_pages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cle: "presentation", contenu: brouillon }),
    });
    const d = await r.json();
    if (!r.ok || d.error) return setMessage(d.error || "Erreur");
    setTexte(brouillon);
    setEditer(false);
    setMessage("");
  };

  return (
    <div>
      {canWrite && !editer && <button className="btn btn-sm" style={{ marginBottom: "1rem" }} onClick={() => { setBrouillon(texte); setEditer(true); }}>Modifier</button>}
      {editer ? (
        <div className="cab-card">
          <textarea rows={14} value={brouillon} onChange={e => setBrouillon(e.target.value)} />
          {message && <div style={{ color: "var(--danger)", margin: "0.5rem 0" }}>{message}</div>}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
            <button className="btn btn-sm" onClick={enregistrer}>Enregistrer</button>
            <button className="btn btn-outline btn-sm" onClick={() => setEditer(false)}>Annuler</button>
          </div>
        </div>
      ) : (
        <div className="cab-card" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{texte || "Pas encore de présentation."}</div>
      )}
    </div>
  );
}
