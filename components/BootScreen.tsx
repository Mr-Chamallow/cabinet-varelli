"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ObsLogo } from "@/components/ObsLogo";

const TIPS = [
  "Ctrl+K ouvre la recherche rapide depuis n'importe quelle page.",
  "Dans Fiches, saisis une plaque ou un téléphone : la fiche se pré-remplit.",
  "Colle une photo avec Ctrl+V directement dans une fiche ou une arrestation.",
  "Le bouton ↻ retourne les cartes et les avis de recherche.",
  "Tout export PDF s'ouvre en aperçu : tu télécharges seulement si tu veux.",
];
type Tag = "NET" | "SEC" | "AUTH" | "DB" | "SYS";
interface L { at: number; tag: Tag; text: string; ok?: boolean }
const END = 9200;
// Chronologie (ms) - chaque ligne apparaît à son heure.
const LINES: L[] = [
  { at: 300, tag: "SYS", text: "Initialisation du noyau Obsidian v7.2.1" },
  { at: 750, tag: "NET", text: "Résolution du relais sécurisé..." },
  { at: 1250, tag: "NET", text: "Liaison TLS 1.3 établie - latence 38 ms", ok: true },
  { at: 1750, tag: "SEC", text: "Échange de clés (X25519 / AES-256-GCM)" },
  { at: 2250, tag: "SEC", text: "Empreinte du serveur vérifiée", ok: true },
  // 2700 -> boîte « demande d'accès »
  { at: 6000, tag: "AUTH", text: "Jeton de session émis - validité 12 h", ok: true },
  { at: 6400, tag: "DB", text: 'Montage de la base "obsidian_core"' },
  { at: 6800, tag: "DB", text: "Synchronisation temps réel active", ok: true },
  { at: 7200, tag: "SYS", text: "Chargement du profil opérateur" },
];
const MODULES = [
  { label: "Réseau", from: 600, dur: 1800 },
  { label: "Chiffrement", from: 1500, dur: 2600 },
  { label: "Permissions", from: 4300, dur: 2000 },
  { label: "Base de données", from: 5600, dur: 2200 },
  { label: "Interface", from: 6400, dur: 2300 },
];
const hex = (n: number) => Array.from({ length: n }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("");

export function BootScreen() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(pathname !== "/login");
  const [leaving, setLeaving] = useState(false);
  const [t, setT] = useState(0);
  const tip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], []);
  const fp = useMemo(() => `${hex(4)}:${hex(4)}:${hex(4)}:${hex(4)}`, []);
  const req = useMemo(() => "REQ-" + hex(8), []);

  useEffect(() => {
    if (!visible) return;
    const t0 = performance.now(); const id = setInterval(() => setT(performance.now() - t0), 50);
    return () => clearInterval(id);
  }, [visible]);
  useEffect(() => { if (visible && t >= END) close(); }, [t, visible]);
  useEffect(() => { if (!visible) return; const k = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key === "Enter") close(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [visible]);
  function close() { setLeaving(true); setTimeout(() => setVisible(false), 500); }
  if (!visible) return null;

  // Boîte « demande d'accès » : 2700->6000
  const boxAt = 2700; const showBox = t >= boxAt;
  const phase = t < 3700 ? 0 : t < 4400 ? 1 : t < 5200 ? 2 : 3;
  const status = ["TRANSMISSION DE LA DEMANDE...", "ATTENTE DU CONTRÔLEUR D'ACCÈS...", "VÉRIFICATION DU CERTIFICAT OPÉRATEUR...", "ACCÈS ACCORDÉ"][phase];
  const granted = phase === 3;
  const logoAt = 7600; const showLogo = t >= logoAt; const stamped = t >= 8300;
  const total = Math.min(1, t / (END - 600));

  return (
    <div className={`boot${leaving ? " leaving" : ""}`} onClick={close}>
      <div className="boot-scan" />
      <div className="boot-wrap">
        <div className="boot-title">Obsidian Logistique</div>
        <div className="boot-sub">TERMINAL SÉCURISÉ · CONSORTIUM</div>

        <div className="boot-log">
          {LINES.filter(l => t >= l.at).map((l, i) => (
            <div key={i} className={l.ok ? "ok" : ""}>
              <span className="tg">[{l.tag}]</span>{l.ok ? "" : ""}{l.text}
            </div>
          ))}
        </div>

        {showBox && (
          <div className={`boot-req${granted ? " granted" : ""}`}>
            <div className="br-head"><span>⚿ DEMANDE D'ACCÈS - PROTOCOLE OBS-SECURE/7</span><span>{req}</span></div>
            <div className="br-grid">
              <span>ORIGINE</span><b>{fp}</b>
              <span>ENTITÉ</span><b>Obsidian Logistics</b>
              <span>NIVEAU REQUIS</span><b>HABILITATION 2 / 5</b>
              <span>CANAL</span><b>Chiffré · bout à bout</b>
            </div>
            <div className="br-status"><i className={granted ? "on" : "wait"} />{status}</div>
            <div className="br-bar"><u style={{ width: `${Math.min(100, ((t - boxAt) / 2500) * 100)}%` }} /></div>
          </div>
        )}

        <div className="boot-mods">
          {MODULES.map(m => { const p = Math.max(0, Math.min(1, (t - m.from) / m.dur)); return (
            <div key={m.label}><div className="bm-h"><span>{m.label}</span><span>{p >= 1 ? "OK" : Math.round(p * 100) + "%"}</span></div><div className="bm-bar"><u style={{ width: `${p * 100}%` }} /></div></div>); })}
        </div>

        {showLogo && (
          <div className="boot-final">
            <ObsLogo size={64} className="boot-logo" />
            <div className="boot-welcome">{stamped ? "ACCÈS AUTORISÉ" : "Initialisation de l'interface..."}</div>
          </div>
        )}
        <div className="boot-total"><u style={{ width: `${total * 100}%` }} /></div>
        <div className="boot-tip">🐈 {tip} <em>· clic ou Entrée pour passer</em></div>
      </div>
    </div>
  );
}
