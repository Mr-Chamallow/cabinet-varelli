"use client";
import { useEffect, useState } from "react";

// Présentation du cabinet, mise en page éditoriale.
// Dans le texte : "## Titre" = section, ligne vide = nouveau paragraphe.
interface Element { type: "h" | "p"; text: string; }

function analyser(texte: string): Element[] {
  const elements: Element[] = [];
  let buf: string[] = [];
  const vider = () => { if (buf.length) { elements.push({ type: "p", text: buf.join("\n") }); buf = []; } };
  for (const ligne of texte.split("\n")) {
    if (ligne.startsWith("## ")) { vider(); elements.push({ type: "h", text: ligne.slice(3).trim() }); }
    else if (ligne.trim() === "") vider();
    else buf.push(ligne);
  }
  vider();
  return elements;
}

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

  const elements = analyser(texte || "");

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "2.2rem" }}>
        <div className="cab-ornement">◆ ◆ ◆</div>
        <div className="cab-title" style={{ fontSize: "1.7rem" }}>Cabinet Varelli & Associés</div>
        <div className="cab-muted" style={{ textTransform: "uppercase", letterSpacing: "0.3em", fontSize: "0.7rem", marginTop: "0.5rem" }}>Cabinet d'avocats</div>
      </div>

      {canWrite && !editer && (
        <div style={{ textAlign: "right", marginBottom: "1rem" }}>
          <button className="btn btn-outline btn-sm" onClick={() => { setBrouillon(texte); setEditer(true); }}>Modifier</button>
        </div>
      )}

      {editer ? (
        <div className="cab-card">
          <div className="cab-muted" style={{ fontSize: "0.78rem", marginBottom: "0.5rem" }}>
            Ligne commençant par ## = titre de section. Une ligne vide sépare les paragraphes. Le premier paragraphe est mis en avant.
          </div>
          <textarea rows={16} value={brouillon} onChange={e => setBrouillon(e.target.value)} />
          {message && <div style={{ color: "var(--danger)", margin: "0.5rem 0" }}>{message}</div>}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
            <button className="btn btn-sm" onClick={enregistrer}>Enregistrer</button>
            <button className="btn btn-outline btn-sm" onClick={() => setEditer(false)}>Annuler</button>
          </div>
        </div>
      ) : (
        <article>
          {elements.length === 0 && <div className="cab-muted" style={{ textAlign: "center" }}>Pas encore de présentation.</div>}
          {elements.map((el, i) => el.type === "h" ? (
            <h2 key={i} className="cab-section-titre" style={{ marginTop: "2.2rem", fontSize: "1.1rem", paddingBottom: "0.5rem", borderBottom: "1px solid rgba(var(--gold-rgb),.25)" }}>{el.text}</h2>
          ) : i === 0 ? (
            <p key={i} style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: "1.1rem", lineHeight: 1.9, color: "var(--gold-light)", textAlign: "center", margin: "0.4rem 0 1rem", whiteSpace: "pre-line" }}>{el.text}</p>
          ) : (
            <p key={i} style={{ color: "#d6dbe7", fontSize: "0.95rem", lineHeight: 1.85, margin: "0.8rem 0", whiteSpace: "pre-line" }}>{el.text}</p>
          ))}
          {elements.length > 0 && <div className="cab-ornement" style={{ textAlign: "center", marginTop: "2.6rem" }}>◆</div>}
        </article>
      )}
    </div>
  );
}
