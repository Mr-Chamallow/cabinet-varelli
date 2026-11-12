"use client";
import { useState } from "react";
import { MODELES_DOCUMENTS } from "@/lib/modelesDocuments";

// Génère un document pré-rempli avec les infos du dossier (ouvre une page prête à imprimer)
export default function ModelesDocuments({ dossierId }: { dossierId: string }) {
  const [modele, setModele] = useState(MODELES_DOCUMENTS[0].id);
  const [erreur, setErreur] = useState("");

  const generer = async () => {
    setErreur("");
    const r = await fetch(`/api/cabinet/modeles/${dossierId}?modele=${modele}`);
    if (!r.ok) return setErreur((await r.json().catch(() => ({}))).error || "Impossible de générer le document");
    const html = await r.text();
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="cab-card" style={{ marginBottom: "0.8rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontWeight: 600 }}>Générer un document</span>
      <select value={modele} onChange={e => setModele(e.target.value)} style={{ padding: "0.45rem", borderRadius: 8, background: "transparent", border: "1px solid var(--border)", color: "inherit" }}>
        {MODELES_DOCUMENTS.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
      </select>
      <button className="btn btn-gold btn-sm" onClick={generer}>Créer (pré-rempli)</button>
      {erreur && <span style={{ color: "#e88a86", fontSize: "0.8rem" }}>{erreur}</span>}
    </div>
  );
}
