"use client";
import { ClipboardEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  url: string;          // route GET/POST des messages (dossier ou canal interne)
  lecture?: boolean;    // true = aucun envoi possible
  titreVide?: string;
}

// Découpe le texte pour rendre les liens cliquables
function avecLiens(texte: string) {
  return texte.split(/(https?:\/\/[^\s]+)/g).map((morceau, i) =>
    /^https?:\/\//.test(morceau)
      ? <a key={i} href={morceau} target="_blank" rel="noreferrer" style={{ color: "var(--gold)", textDecoration: "underline" }}>{morceau}</a>
      : <span key={i}>{morceau}</span>
  );
}

const heure = (s: string) => new Date(s).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

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

  return (
    <div>
      <div className="cab-card" style={{ maxHeight: "60vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {messages.length === 0 && <div style={{ color: "var(--text-dim)" }}>{titreVide}</div>}
        {messages.map(m => (
          <div key={m.id} style={{ alignSelf: m.est_staff ? "flex-start" : "flex-end", maxWidth: "85%", background: m.est_staff ? "rgba(255,255,255,0.04)" : "rgba(212,175,55,0.12)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.5rem 0.7rem" }}>
            <div style={{ fontSize: "0.7rem", color: m.est_staff ? "var(--gold)" : "var(--text-dim)", marginBottom: "0.2rem" }}>
              {m.auteur_nom}{m.est_staff ? " (cabinet)" : ""}, {heure(m.created_at)}
            </div>
            {m.contenu && <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{avecLiens(m.contenu)}</div>}
            {m.fichier_url && (
              <a href={m.fichier_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.4rem", padding: "0.6rem 0.8rem", border: "1px solid var(--gold)", borderRadius: "var(--radius)", color: "inherit", textDecoration: "none" }}>
                <span style={{ fontSize: "1.3rem" }}>📄</span>
                <span><b>{m.fichier_nom || "Document"}</b><br /><span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>Ouvrir le PDF</span></span>
              </a>
            )}
            {m.image_url && <a href={m.image_url} target="_blank" rel="noreferrer"><img src={m.image_url} alt="Image" style={{ maxWidth: "100%", maxHeight: 280, borderRadius: "var(--radius)", marginTop: m.contenu ? "0.4rem" : 0 }} /></a>}
          </div>
        ))}
        <div ref={fin} />
      </div>

      {erreur && <div style={{ color: "var(--danger)", margin: "0.6rem 0" }}>{erreur}</div>}

      {!lecture && (
        <div className="cab-card" style={{ marginTop: "1rem" }}>
          <textarea
            rows={3}
            placeholder="Écris ton message (tu peux coller une image avec Ctrl+V)"
            value={texte}
            onChange={e => setTexte(e.target.value)}
            onPaste={coller}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyerTexte(); } }}
          />
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn btn-sm" disabled={envoi} onClick={envoyerTexte}>{envoi ? "Envoi en cours" : "Envoyer"}</button>
            <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
              Joindre une image
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) envoyerImage(f); e.target.value = ""; }} />
            </label>
            <label className="btn btn-outline btn-sm" style={{ cursor: "pointer" }}>
              Joindre un document
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.odt" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) envoyerDocument(f); e.target.value = ""; }} />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
