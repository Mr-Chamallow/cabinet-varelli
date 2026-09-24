"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Astuces livrées par le chat en fin de séquence — une piochée au hasard à chaque
// démarrage, pour que ça reste "utile" et pas juste décoratif à la longue.
const CAT_TIPS = [
  "Ctrl+K ouvre la recherche rapide depuis n'importe quelle page.",
  "Dans la carte enquêteur, clique sur 🔍 Filtres pour combiner catégorie, groupe et dates.",
  "Un clic droit sur un rôle Discord te donne son ID pour un override dans Admin.",
  "La couleur du site se change en un clic depuis Personnalisation — sans redéploiement.",
  "Dans une fiche de la carte, utilise la checklist pour suivre les recensements pas à pas.",
  "Copie le lien direct d'un point de la carte pour le partager sur Discord.",
];

type LogTag = "NET" | "SEC" | "PROXY" | "DB" | "SYS" | "";
interface LogLine { tag: LogTag; text: string; variant?: "ok" | "warn"; }

const LOG: LogLine[] = [
  { tag: "NET",   text: "Scan des nœuds relais... 14 trouvés" },
  { tag: "NET",   text: "Connexion à 185.24.61.203:8422" },
  { tag: "SEC",   text: "Détection IDS locale... aucune alerte" },
  { tag: "SEC",   text: "Injection tunnel chiffré AES-256" },
  { tag: "SEC",   text: "Clé de session : 7f3a9c..e91c" },
  { tag: "PROXY", text: "Rotation d'adresse IP (x3)" },
  { tag: "PROXY", text: "Masquage adresse MAC" },
  { tag: "DB",    text: 'Authentification base "obsidian_core"' },
  { tag: "DB",    text: "Contournement du logging SAMP" },
  { tag: "DB",    text: "Accès base de données illégale confirmé", variant: "ok" },
  { tag: "SYS",   text: "Désactivation traçage réseau" },
  { tag: "SYS",   text: "Chargement du profil opérateur" },
  { tag: "",      text: "Session : OBSIDIAN LOGISTIQUE", variant: "warn" },
];

const BARS: { label: string; durationMs: number }[] = [
  { label: "Réseau", durationMs: 1600 },
  { label: "Chiffrement", durationMs: 2300 },
  { label: "Base de données", durationMs: 2900 },
  { label: "Proxy", durationMs: 1950 },
];

// Se relance à chaque VRAI chargement de page (refresh, connexion) car monté au
// niveau racine sans aucune mémoire persistante (pas de localStorage/sessionStorage) :
// la navigation interne (clic Sidebar) ne remonte jamais ce composant dans le
// App Router de Next.js — seul un rechargement complet le fait.
export function BootScreen() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(pathname !== "/login");
  const [leaving, setLeaving] = useState(false);
  const [step, setStep] = useState(0);
  const [percents, setPercents] = useState<number[]>(() => BARS.map(() => 0));
  const [tip] = useState(() => CAT_TIPS[Math.floor(Math.random() * CAT_TIPS.length)]);
  const startedRef = useRef(false);

  // Logs qui s'affichent ligne par ligne, façon terminal
  useEffect(() => {
    if (!visible || step >= LOG.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 170);
    return () => clearTimeout(t);
  }, [visible, step]);

  // 4 barres de progression indépendantes, façon "sous-systèmes" en parallèle
  useEffect(() => {
    if (!visible || startedRef.current) return;
    startedRef.current = true;
    const rafs: number[] = [];
    BARS.forEach((bar, i) => {
      const start = performance.now();
      const tick = (now: number) => {
        const pct = Math.min((now - start) / bar.durationMs, 1);
        setPercents((prev) => { const next = [...prev]; next[i] = pct; return next; });
        if (pct < 1) rafs[i] = requestAnimationFrame(tick);
      };
      rafs[i] = requestAnimationFrame(tick);
    });
    return () => rafs.forEach((id) => cancelAnimationFrame(id));
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const end = setTimeout(() => close(), 4200);
    return () => clearTimeout(end);
  }, [visible]);

  function close() {
    setLeaving(true);
    setTimeout(() => setVisible(false), 350);
  }

  if (!visible) return null;

  return (
    <div
      onClick={close}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "var(--bg)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        opacity: leaving ? 0 : 1,
        transition: "opacity 0.35s ease",
        pointerEvents: leaving ? "none" : "auto",
        padding: "1rem",
      }}
    >
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: "clamp(1.1rem, 4vw, 1.4rem)", color: "var(--gold)",
        letterSpacing: "0.16em", marginBottom: "1.75rem", textTransform: "uppercase", textAlign: "center",
      }}>
        Obsidian Logistique
      </div>

      <div style={{ width: "min(92vw, 560px)", fontFamily: "var(--font-mono)", fontSize: "0.72rem", lineHeight: 1.9, height: "min(40vh, 250px)", overflow: "hidden" }}>
        {LOG.map((line, i) => (
          <div key={i} style={{
            opacity: i < step ? 1 : 0,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            color: line.variant === "ok" ? "var(--success)" : line.variant === "warn" ? "var(--gold)" : "var(--text-muted)",
            fontWeight: line.variant ? 600 : 400,
          }}>
            <span style={{ display: "inline-block", width: 52, color: "var(--text-dim)" }}>{line.tag && `[${line.tag}]`}</span>
            {line.variant === "ok" && "✓ "}
            {line.variant === "warn" && "→ "}
            {line.text}
          </div>
        ))}
      </div>

      <div style={{ width: "min(92vw, 560px)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1.2rem", marginTop: "0.75rem" }}>
        {BARS.map((bar, i) => (
          <div key={bar.label} style={{ fontSize: "0.62rem", color: "var(--text-dim)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <span>{bar.label}</span>
              <span style={{ fontFamily: "var(--font-mono)" }}>{Math.round(percents[i] * 100)}%</span>
            </div>
            <div style={{ height: 4, background: "var(--card)", borderRadius: 2, overflow: "hidden", border: "1px solid var(--surface)" }}>
              <div style={{ height: "100%", width: `${percents[i] * 100}%`, background: "linear-gradient(90deg, var(--gold), var(--chart-2))" }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: "1.5rem", fontSize: "0.72rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)",
        opacity: step >= LOG.length ? 1 : 0, transition: "opacity 0.4s ease",
        display: "flex", alignItems: "center", gap: "0.5rem", maxWidth: "min(92vw, 560px)", textAlign: "center",
      }}>
        <span>🐈</span><span>{tip}</span>
      </div>
    </div>
  );
}
