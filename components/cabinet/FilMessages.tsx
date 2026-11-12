"use client";
import { ClipboardEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/useCurrentUser";

interface Props {
  url: string;          // route GET/POST des messages (dossier ou canal interne)
  lecture?: boolean;    // true = aucun envoi possible
  titreVide?: string;
}

const CSS = `
.msg-fil { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 16px; background: var(--card, #161616); overflow: hidden; }
.msg-zone { display: flex; flex-direction: column; padding: 1rem 1rem 0.4rem; height: min(62vh, 620px); overflow-y: auto; }
.msg-vide { margin: auto; text-align: center; color: var(--text-dim); font-size: 0.85rem; padding: 2rem 1rem; }
.msg-jour { align-self: center; font-size: 0.68rem; color: var(--text-dim); letter-spacing: 0.06em; text-transform: uppercase; margin: 0.8rem 0 0.5rem; padding: 3px 10px; border-radius: 999px; background: rgba(255,255,255,0.04); }
.msg-ligne { display: flex; gap: 0.5rem; align-items: flex-end; max-width: 80%; margin-top: 2px; }
.msg-ligne.debut { margin-top: 0.7rem; }
.msg-ligne.moi { align-self: flex-end; flex-direction: row-reverse; }
.msg-avatar { flex: 0 0 30px; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-size: 0.72rem; font-weight: 700; background: rgba(255,255,255,0.08); color: var(--text); }
.msg-avatar.vide { visibility: hidden; }
.msg-avatar.cab { background: rgba(212,175,55,0.18); color: var(--gold); }
.msg-corps { min-width: 0; display: flex; flex-direction: column; }
.msg-ligne.moi .msg-corps { align-items: flex-end; }
.msg-nom { font-size: 0.7rem; color: var(--text-dim); margin: 0 0.6rem 0.2rem; }
.msg-bulle { background: rgba(255,255,255,0.08); color: var(--text); border-radius: 18px; padding: 0.55rem 0.9rem; line-height: 1.4; font-size: 0.92rem; }
.msg-ligne.moi .msg-bulle { background: var(--gold); color: #111; }
.msg-ligne.suite .msg-bulle { border-top-left-radius: 6px; }
.msg-ligne.moi.suite .msg-bulle { border-top-right-radius: 6px; border-top-left-radius: 18px; }
.msg-ligne.moi .msg-bulle { border-bottom-right-radius: 6px; }
.msg-texte { white-space: pre-wrap; word-break: break-word; }
.msg-lien { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
.msg-ligne.moi .msg-lien { color: #111; }
.msg-mention { font-weight: 700; color: var(--gold); }
.msg-ligne.moi .msg-mention { color: #111; background: rgba(255,255,255,0.35); border-radius: 4px; padding: 0 2px; }
.msg-fichier { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.3rem; padding: 0.45rem 0.6rem; border-radius: 12px; color: inherit; text-decoration: none; background: rgba(0,0,0,0.22); }
.msg-ligne.moi .msg-fichier { background: rgba(0,0,0,0.12); color: #111; }
.msg-fichier small { display: block; font-size: 0.7rem; opacity: 0.7; }
.msg-image { display: block; max-width: 100%; max-height: 260px; border-radius: 12px; margin-top: 0.3rem; }
.msg-statut { font-size: 0.68rem; color: var(--text-dim); margin: 0.2rem 0.6rem 0; align-self: flex-end; }
.msg-frappe { font-size: 0.78rem; color: var(--text-dim); margin: 0.4rem 0 0.2rem 0.2rem; display: flex; align-items: center; gap: 0.4rem; min-height: 1.2rem; }
.msg-points { display: inline-flex; gap: 3px; }
.msg-points i { width: 5px; height: 5px; border-radius: 50%; background: var(--text-dim); animation: msgBond 1.2s infinite; }
.msg-points i:nth-child(2) { animation-delay: .15s; }
.msg-points i:nth-child(3) { animation-delay: .3s; }
@keyframes msgBond { 0%, 60%, 100% { opacity: .25; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-2px); } }
.msg-erreur { color: #e88a86; font-size: 0.8rem; padding: 0.4rem 1rem; border-top: 1px solid var(--border); }
.msg-saisie { border-top: 1px solid var(--border); padding: 0.6rem; display: flex; align-items: flex-end; gap: 0.5rem; background: rgba(0,0,0,0.15); }
.msg-champ { flex: 1; min-width: 0; display: flex; align-items: flex-end; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 20px; padding: 0.3rem 0.4rem 0.3rem 0.8rem; }
.msg-champ textarea { flex: 1; min-width: 0; resize: none; background: transparent; border: none; color: inherit; font: inherit; font-size: 0.92rem; padding: 0.35rem 0; max-height: 120px; }
.msg-champ textarea:focus { outline: none; }
.msg-pj { cursor: pointer; font-size: 1.05rem; padding: 0.3rem 0.4rem; color: var(--text-dim); border-radius: 50%; }
.msg-pj:hover { color: var(--gold); }
.msg-envoyer { flex: 0 0 auto; width: 38px; height: 38px; border-radius: 50%; border: none; background: var(--gold); color: #111; font-weight: 700; cursor: pointer; font-size: 1rem; }
.msg-envoyer:disabled { opacity: 0.35; cursor: default; }
`;

// Initiales pour l'avatar
const initiales = (nom: string) => (nom || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase();

// Liens cliquables et mentions @prénom
function avecLiens(texte: string) {
  return texte.split(/(https?:\/\/[^\s]+|@[\p{L}\p{N}_-]+)/gu).map((morceau, i) =>
    /^https?:\/\//.test(morceau)
      ? <a key={i} href={morceau} target="_blank" rel="noreferrer" className="msg-lien">{morceau}</a>
      : /^@/.test(morceau)
        ? <span key={i} className="msg-mention">{morceau}</span>
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

// Fil de messages en temps réel, style conversation : bulles à droite (les miennes) et à gauche (les autres)
export default function FilMessages({ url, lecture = false, titreVide = "Aucun message." }: Props) {
  const { user } = useCurrentUser();
  const moiId = (user as any)?.discord_id || "";
  const moiNom = (user as any)?.nom || (user as any)?.nom_perso || "";
  const [messages, setMessages] = useState<any[]>([]);
  const [topic, setTopic] = useState<string | null>(null);
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [frappe, setFrappe] = useState<Record<string, { nom: string; at: number }>>({});
  const fin = useRef<HTMLDivElement>(null);
  const canalRef = useRef<any>(null);
  const dernierFrappe = useRef(0);

  // Chargement initial + nom du canal temps réel
  useEffect(() => {
    setMessages([]);
    fetch(url).then(r => r.json()).then(d => {
      if (d.error) return setErreur(d.error);
      setMessages(d.rows || []);
      setTopic(d.topic || null);
    });
  }, [url]);

  // Abonnement temps réel : nouveaux messages + indicateur « écrit… »
  useEffect(() => {
    if (!topic || !supabase) return;
    const canal = supabase.channel(topic)
      .on("broadcast", { event: "message" }, (msg: any) => {
        const row = msg.payload;
        if (!row) return;
        setMessages(prev => (prev.some(m => m.id === row.id) ? prev : [...prev, row]));
      })
      .on("broadcast", { event: "typing" }, (msg: any) => {
        const p = msg.payload;
        if (!p?.id || p.id === moiId) return;
        setFrappe(prev => ({ ...prev, [p.id]: { nom: p.nom, at: Date.now() } }));
      })
      .subscribe();
    canalRef.current = canal;
    return () => { canalRef.current = null; supabase.removeChannel(canal); };
  }, [topic, moiId]);

  // Efface l'indicateur après 3 secondes sans frappe
  useEffect(() => {
    const t = setInterval(() => {
      setFrappe(prev => {
        const maintenant = Date.now();
        const suivant = Object.fromEntries(Object.entries(prev).filter(([, v]) => maintenant - v.at < 3000));
        return Object.keys(suivant).length === Object.keys(prev).length ? prev : suivant;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { fin.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, frappe]);

  // Envoie « X écrit… » (au plus une fois toutes les 2 secondes)
  const signalerFrappe = () => {
    const c = canalRef.current;
    if (!c || !moiId || Date.now() - dernierFrappe.current < 2000) return;
    dernierFrappe.current = Date.now();
    c.send({ type: "broadcast", event: "typing", payload: { id: moiId, nom: moiNom } });
  };

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

  const envoyerFichier = async (fichier: File, type: "image" | "document") => {
    const f = new FormData();
    f.append("file", fichier);
    setEnvoi(true);
    const r = await fetch("/api/cabinet/upload", { method: "POST", body: f });
    const d = await r.json();
    setEnvoi(false);
    if (!r.ok || d.error) return setErreur(d.error || "Upload impossible");
    if (type === "image") envoyer({ image_url: d.url });
    else envoyer({ fichier_url: d.url, fichier_nom: d.nom });
  };

  const coller = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const img = Array.from(e.clipboardData.items).find(i => i.type.startsWith("image/"));
    if (!img) return;
    const fichier = img.getAsFile();
    if (fichier) { e.preventDefault(); envoyerFichier(fichier, "image"); }
  };

  // Dernier message envoyé par moi : seul celui-là affiche « Envoyé »
  const dernierMoi = [...messages].reverse().find(m => m.auteur_discord_id === moiId)?.id;
  const quiFrappe = Object.values(frappe).map(v => v.nom).filter(Boolean);

  const libelles = messages.map(m => jour(m.created_at));
  return (
    <div className="msg-fil">
      <style>{CSS}</style>

      <div className="msg-zone">
        {messages.length === 0 && <div className="msg-vide">{titreVide}</div>}
        {messages.map((m, i) => {
          const moi = !!moiId && m.auteur_discord_id === moiId;
          const prec = messages[i - 1];
          const suiv = messages[i + 1];
          const meme = (x: any) => x && x.auteur_discord_id === m.auteur_discord_id;
          const memeJourQue = (x: any) => x && jour(x.created_at) === jour(m.created_at);
          const nouveauJour = i === 0 || libelles[i] !== libelles[i - 1];
          // Groupe : même auteur que le message précédent (pas de nom ni d'avatar répété) ; avatar seulement sur le dernier du groupe
          const debutGroupe = !(meme(prec) && memeJourQue(prec));
          const finGroupe = !(meme(suiv) && memeJourQue(suiv));
          return (
            <div key={m.id} style={{ display: "contents" }}>
              {nouveauJour && <div className="msg-jour">{libelles[i]}</div>}
              <div className={`msg-ligne${moi ? " moi" : ""}${debutGroupe ? " debut" : ""}${!finGroupe ? " suite" : ""}`}>
                <div className={`msg-avatar${m.est_staff ? " cab" : ""}${finGroupe ? "" : " vide"}`}>{initiales(m.auteur_nom)}</div>
                <div className="msg-corps">
                  {debutGroupe && !moi && <div className="msg-nom">{m.auteur_nom}{m.est_staff ? " · cabinet" : ""}</div>}
                  <div className="msg-bulle" title={heure(m.created_at)}>
                    {m.contenu && <div className="msg-texte">{avecLiens(m.contenu)}</div>}
                    {m.fichier_url && (
                      <a href={m.fichier_url} target="_blank" rel="noreferrer" className="msg-fichier">
                        <span style={{ fontSize: "1.2rem" }}>📄</span>
                        <span><b>{m.fichier_nom || "Document"}</b><small>Ouvrir le document</small></span>
                      </a>
                    )}
                    {m.image_url && <a href={m.image_url} target="_blank" rel="noreferrer"><img src={m.image_url} alt="Image" className="msg-image" /></a>}
                  </div>
                  {finGroupe && <div className="msg-nom" style={{ margin: "0.2rem 0.6rem 0", opacity: 0.8 }}>{heure(m.created_at)}</div>}
                </div>
              </div>
              {m.id === dernierMoi && <div className="msg-statut">Envoyé</div>}
            </div>
          );
        })}
        {quiFrappe.length > 0 && (
          <div className="msg-frappe">
            <span className="msg-points"><i /><i /><i /></span>
            {quiFrappe.join(", ")} {quiFrappe.length > 1 ? "écrivent" : "écrit"}…
          </div>
        )}
        <div ref={fin} />
      </div>

      {erreur && <div className="msg-erreur">{erreur}</div>}

      {!lecture && (
        <div className="msg-saisie">
          <label className="msg-pj" title="Joindre une image">
            🖼️
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) envoyerFichier(f, "image"); e.target.value = ""; }} />
          </label>
          <label className="msg-pj" title="Joindre un document">
            📎
            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.odt" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) envoyerFichier(f, "document"); e.target.value = ""; }} />
          </label>
          <div className="msg-champ">
            <textarea
              rows={1}
              placeholder="Message…"
              value={texte}
              onChange={e => { setTexte(e.target.value); if (e.target.value) signalerFrappe(); }}
              onPaste={coller}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyerTexte(); } }}
            />
          </div>
          <button className="msg-envoyer" disabled={envoi || !texte.trim()} onClick={envoyerTexte} aria-label="Envoyer">
            {envoi ? "…" : "➤"}
          </button>
        </div>
      )}
    </div>
  );
}
