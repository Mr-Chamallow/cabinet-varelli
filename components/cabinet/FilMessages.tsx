"use client";
import { ClipboardEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  url: string;          // route GET/POST des messages (dossier ou canal interne)
  lecture?: boolean;    // true = aucun envoi possible
  titreVide?: string;
}

const CSS = `
.msg-fil { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 14px; background: var(--card, #161616); overflow: hidden; }
.msg-zone { display: flex; flex-direction: column; gap: 0.35rem; padding: 1rem 1rem 0.5rem; height: min(62vh, 620px); overflow-y: auto; }
.msg-vide { margin: auto; text-align: center; color: var(--text-dim); font-size: 0.85rem; padding: 2rem 1rem; }
.msg-jour { align-self: center; font-size: 0.68rem; color: var(--text-dim); letter-spacing: 0.08em; text-transform: uppercase; margin: 0.6rem 0 0.3rem; padding: 2px 10px; border-radius: 999px; background: rgba(255,255,255,0.04); }
.msg-ligne { display: flex; gap: 0.6rem; align-items: flex-end; max-width: 82%; }
.msg-ligne.moi { align-self: flex-end; flex-direction: row-reverse; }
.msg-avatar { flex: 0 0 30px; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-size: 0.75rem; font-weight: 700; background: rgba(255,255,255,0.07); color: var(--text); }
.msg-avatar.cab { background: rgba(212,175,55,0.16); color: var(--gold); }
.msg-corps { min-width: 0; display: flex; flex-direction: column; }
.msg-ligne.moi .msg-corps { align-items: flex-end; }
.msg-meta { font-size: 0.7rem; color: var(--text-dim); margin: 0 0.2rem 0.2rem; }
.msg-bulle { background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 14px 14px 14px 4px; padding: 0.55rem 0.8rem; line-height: 1.45; font-size: 0.92rem; }
.msg-ligne.moi .msg-bulle { background: rgba(212,175,55,0.12); border-color: rgba(212,175,55,0.3); border-radius: 14px 14px 4px 14px; }
.msg-texte { white-space: pre-wrap; word-break: break-word; }
.msg-lien { color: var(--gold); text-decoration: underline; text-underline-offset: 2px; }
.msg-fichier { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.4rem; padding: 0.5rem 0.7rem; border: 1px solid var(--border); border-radius: 10px; color: inherit; text-decoration: none; background: rgba(0,0,0,0.2); }
.msg-fichier:hover { border-color: var(--gold); }
.msg-fichier small { display: block; font-size: 0.7rem; color: var(--text-dim); }
.msg-image { display: block; max-width: 100%; max-height: 260px; border-radius: 10px; margin-top: 0.4rem; }
.msg-erreur { color: #e88a86; font-size: 0.8rem; padding: 0.4rem 1rem; border-top: 1px solid var(--border); }
.msg-saisie { border-top: 1px solid var(--border); padding: 0.7rem; display: flex; flex-direction: column; gap: 0.5rem; background: rgba(0,0,0,0.15); }
.msg-saisie textarea { width: 100%; resize: vertical; min-height: 44px; border-radius: 10px; padding: 0.6rem 0.75rem; background: transparent; border: 1px solid var(--border); color: inherit; font: inherit; font-size: 0.9rem; }
.msg-saisie textarea:focus { outline: none; border-color: var(--gold); }
.msg-barre { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; justify-content: space-between; }
.msg-pieces { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.msg-piece { font-size: 0.75rem; cursor: pointer; padding: 0.3rem 0.6rem; border-radius: 8px; border: 1px solid var(--border); color: var(--text-dim); background: transparent; }
.msg-piece:hover { color: var(--gold); border-color: var(--gold); }
.msg-envoyer { font-size: 0.82rem; padding: 0.4rem 1rem; border-radius: 8px; background: var(--gold); color: #111; border: none; font-weight: 600; cursor: pointer; }
.msg-envoyer:disabled { opacity: 0.5; cursor: default; }
.msg-aide { font-size: 0.7rem; color: var(--text-dim); }
`;

// Initiales pour l'avatar
const initiales = (nom: string) => (nom || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase();

// Découpe le texte pour rendre les liens cliquables
function avecLiens(texte: string) {
  return texte.split(/(https?:\/\/[^\s]+)/g).map((morceau, i) =>
    /^https?:\/\//.test(morceau)
      ? <a key={i} href={morceau} target="_blank" rel="noreferrer" className="msg-lien">{morceau}</a>
      : <span key={i}>{morceau}</span>
  );
}

const heure = (s: string) => new Date(s).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const jour = (s: string) => {
  const d = new Date(s);
  const auj = new Date();
  if (d.toDateString() === auj.toDateString()) return "Aujourd'hui";
  const hier = new Date(auj); hier.setDate(auj.getDate() - 1);
  if (d.toDateString() === hier.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};

// Fil de messages en temps réel : chargement initial, puis chaque message arrive par Supabase Realtime
export default function FilMessages({ url, lecture = false, titreVide = "Aucun message." }: Props) {
  const [messages, setMessages] = useState<any[]>([]);
  const [topic, setTopic] = useState<string | null>(null);
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const fin = useRef<HTMLDivElement>(null);

  // Chargement initial + nom du canal temps réel
  useEffect(() => {
    setMessages([]);
    fetch(url).then(r => r.json()).then(d => {
      if (d.error) return setErreur(d.error);
      setMessages(d.rows || []);
      setTopic(d.topic || null);
    });
  }, [url]);

  // Abonnement temps réel : chaque nouveau message est ajouté sans rafraîchir la page
  useEffect(() => {
    if (!topic || !supabase) return;
    const canal = supabase.channel(topic).on("broadcast", { event: "message" }, (msg: any) => {
      const row = msg.payload;
      if (!row) return;
      setMessages(prev => (prev.some(m => m.id === row.id) ? prev : [...prev, row]));
    }).subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [topic]);

  useEffect(() => { fin.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const envoyer = async (corps: { contenu?: string; image_url?: string; fichier_url?: string; fichier_nom?: string }) => {
    setErreur(""); setEnvoi(true);
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    const d = await r.json();
    setEnvoi(false);
    if (!r.ok || d.error) return setErreur(d.error || "Erreur");
    // Ajout immédiat pour l'expéditeur (l'écho temps réel ne revient pas vers lui)
    setMessages(prev => (prev.some(m => m.id === d.id) ? prev : [...prev, d]));
  };

  const envoyerTexte = () => {
    const t = texte.trim();
    if (!t) return;
    setTexte("");
    envoyer({ contenu: t });
  };

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

  const envoyerDocument = async (fichier: File) => {
    const f = new FormData();
    f.append("file", fichier);
    setEnvoi(true);
    const r = await fetch("/api/cabinet/upload", { method: "POST", body: f });
    const d = await r.json();
    setEnvoi(false);
    if (!r.ok || d.error) return setErreur(d.error || "Upload impossible");
    envoyer({ fichier_url: d.url, fichier_nom: d.nom });
  };

  const coller = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const img = Array.from(e.clipboardData.items).find(i => i.type.startsWith("image/"));
    if (!img) return;
    const fichier = img.getAsFile();
    if (fichier) { e.preventDefault(); envoyerImage(fichier); }
  };

  // Séparateurs de jour : un libellé à chaque changement de date
  const jours = messages.map(m => jour(m.created_at));

  return (
    <div className="msg-fil">
      <style>{CSS}</style>

      <div className="msg-zone">
        {messages.length === 0 && <div className="msg-vide">{titreVide}</div>}
        {messages.map((m, i) => {
          const moi = !m.est_staff;
          const afficherJour = i === 0 || jours[i] !== jours[i - 1];
          return (
            <div key={m.id} style={{ display: "contents" }}>
              {afficherJour && <div className="msg-jour">{jours[i]}</div>}
              <div className={`msg-ligne${moi ? " moi" : ""}`}>
                <div className={`msg-avatar${m.est_staff ? " cab" : ""}`}>{initiales(m.auteur_nom)}</div>
                <div className="msg-corps">
                  <div className="msg-meta">
                    {m.auteur_nom}{m.est_staff ? " · cabinet" : ""} · {heure(m.created_at)}
                  </div>
                  <div className="msg-bulle">
                    {m.contenu && <div className="msg-texte">{avecLiens(m.contenu)}</div>}
                    {m.fichier_url && (
                      <a href={m.fichier_url} target="_blank" rel="noreferrer" className="msg-fichier">
                        <span style={{ fontSize: "1.2rem" }}>📄</span>
                        <span><b>{m.fichier_nom || "Document"}</b><small>Ouvrir le document</small></span>
                      </a>
                    )}
                    {m.image_url && <a href={m.image_url} target="_blank" rel="noreferrer"><img src={m.image_url} alt="Image" className="msg-image" /></a>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={fin} />
      </div>

      {erreur && <div className="msg-erreur">{erreur}</div>}

      {!lecture && (
        <div className="msg-saisie">
          <textarea
            rows={2}
            placeholder="Écrire un message…"
            value={texte}
            onChange={e => setTexte(e.target.value)}
            onPaste={coller}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyerTexte(); } }}
          />
          <div className="msg-barre">
            <div className="msg-pieces">
              <label className="msg-piece">
                Image
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) envoyerImage(f); e.target.value = ""; }} />
              </label>
              <label className="msg-piece">
                Document
                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.odt" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) envoyerDocument(f); e.target.value = ""; }} />
              </label>
              <span className="msg-aide">Entrée pour envoyer · Ctrl+V pour coller une image</span>
            </div>
            <button className="msg-envoyer" disabled={envoi || !texte.trim()} onClick={envoyerTexte}>
              {envoi ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
