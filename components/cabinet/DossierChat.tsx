"use client";
import { ClipboardEvent, useEffect, useRef, useState } from "react";

interface Props { id: string; staff: boolean; }

// Découpe le texte pour rendre les liens cliquables
function avecLiens(texte: string) {
  return texte.split(/(https?:\/\/[^\s]+)/g).map((morceau, i) =>
    /^https?:\/\//.test(morceau)
      ? <a key={i} href={morceau} target="_blank" rel="noreferrer" style={{ color: "var(--gold)", textDecoration: "underline" }}>{morceau}</a>
      : <span key={i}>{morceau}</span>
  );
}

// Messagerie privée d'un dossier : client + staff. Rafraîchie toutes les 4 secondes.
export default function DossierChat({ id, staff }: Props) {
  const [dossier, setDossier] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const fin = useRef<HTMLDivElement>(null);

  const charger = async () => {
    const r = await fetch(`/api/cabinet/dossiers/${id}/messages`);
    const d = await r.json();
    if (d.error) return setErreur(d.error);
    setMessages(d.rows || []);
  };

  useEffect(() => {
    fetch(`/api/cabinet/dossiers?id=${id}`).then(r => r.json()).then(d => setDossier((d.rows || [])[0] || null));
    charger();
    const t = setInterval(charger, 4000);
    return () => clearInterval(t);
  }, [id]);

  useEffect(() => { fin.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const envoyer = async (corps: { contenu?: string; image_url?: string }) => {
    setErreur(""); setEnvoi(true);
    const r = await fetch(`/api/cabinet/dossiers/${id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    const d = await r.json();
    setEnvoi(false);
    if (!r.ok || d.error) return setErreur(d.error || "Erreur");
    charger();
  };

  const envoyerTexte = () => {
    const t = texte.trim();
    if (!t) return;
    setTexte("");
    envoyer({ contenu: t });
  };

  // Upload puis envoi d'une image (collée ou choisie)
  const envoyerImage = async (fichier: File) => {
    const f = new FormData();
    f.append("file", fichier);
    setEnvoi(true);
    const r = await fetch("/api/cabinet/upload", { method: "POST", body: f });
    const d = await r.json();
    setEnvoi(false);
    if (!r.ok || d.error) return setErreur(d.error || "Upload impossible");
    envoyer({ image_url: d.url });
  };

  const coller = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const img = Array.from(e.clipboardData.items).find(i => i.type.startsWith("image/"));
    if (!img) return;
    const fichier = img.getAsFile();
    if (fichier) { e.preventDefault(); envoyerImage(fichier); }
  };

  const changerStatut = async (statut: string) => {
    const r = await fetch("/api/cabinet/dossiers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, statut }) });
    const d = await r.json();
    if (!r.ok || d.error) return setErreur(d.error || "Erreur");
    setDossier(d);
  };

  const ouvert = dossier?.statut === "ouvert";

  return (
    <div>
      {dossier && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div style={{ fontWeight: 700 }}>{dossier.titre}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
            Statut : <b style={{ color: "var(--gold)" }}>{dossier.statut}</b>{staff ? `, Client : ${dossier.client_nom || "?"}` : ""}
          </div>
          {staff && (
            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
              {dossier.statut !== "ouvert" && <button className="btn btn-outline btn-sm" onClick={() => changerStatut("ouvert")}>Ouvrir</button>}
              {dossier.statut === "ouvert" && <button className="btn btn-outline btn-sm" onClick={() => changerStatut("ferme")}>Fermer la messagerie</button>}
              {dossier.statut !== "archive" && <button className="btn btn-outline btn-sm" onClick={() => changerStatut("archive")}>Archiver</button>}
            </div>
          )}
        </div>
      )}

      {!ouvert && dossier && (
        <div className="card" style={{ marginBottom: "1rem", color: "var(--text-dim)" }}>
          Dossier {dossier.statut === "archive" ? "archivé" : "fermé"} : lecture seule.
        </div>
      )}

      <div className="card" style={{ maxHeight: "60vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {messages.length === 0 && <div style={{ color: "var(--text-dim)" }}>Aucun message.</div>}
        {messages.map(m => (
          <div key={m.id} style={{ alignSelf: m.est_staff ? "flex-start" : "flex-end", maxWidth: "85%", background: m.est_staff ? "var(--surface-2, rgba(255,255,255,0.04))" : "rgba(212,175,55,0.12)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.5rem 0.7rem" }}>
            <div style={{ fontSize: "0.7rem", color: m.est_staff ? "var(--gold)" : "var(--text-dim)", marginBottom: "0.2rem" }}>
              {m.auteur_nom}{m.est_staff ? " (cabinet)" : ""}, {new Date(m.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </div>
            {m.contenu && <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{avecLiens(m.contenu)}</div>}
            {m.image_url && <a href={m.image_url} target="_blank" rel="noreferrer"><img src={m.image_url} alt="image" style={{ maxWidth: "100%", maxHeight: 280, borderRadius: "var(--radius)", marginTop: m.contenu ? "0.4rem" : 0 }} /></a>}
          </div>
        ))}
        <div ref={fin} />
      </div>

      {erreur && <div style={{ color: "var(--danger)", margin: "0.6rem 0" }}>{erreur}</div>}

      {ouvert && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <textarea
            rows={3}
            placeholder="Écris ton message... (tu peux coller une image avec Ctrl+V)"
            value={texte}
            onChange={e => setTexte(e.target.value)}
            onPaste={coller}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyerTexte(); } }}
          />
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn btn-sm" disabled={envoi} onClick={envoyerTexte}>{envoi ? "Envoi..." : "Envoyer"}</button>
            <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
              Joindre une image
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) envoyerImage(f); e.target.value = ""; }} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
