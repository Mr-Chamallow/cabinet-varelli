"use client";
import { ObsLogo } from "@/components/ObsLogo";

// Écran de chargement du cabinet, affiché à la connexion le temps de charger l'espace
export default function EcranChargement({ message = "Chargement de ton espace…" }: { message?: string }) {
  return (
    <div className="cab-chargement" role="status" aria-live="polite">
      <style>{`
        .cab-chargement { position: fixed; inset: 0; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.4rem; background: radial-gradient(ellipse at 50% 30%, #1d1608 0%, #0b0b0c 70%); color: #e9e4d6; font-family: 'Inter', system-ui, sans-serif; }
        .cab-chargement .cab-chargement-logo { filter: drop-shadow(0 0 18px rgba(201,162,77,0.35)); animation: cabRespire 2.4s ease-in-out infinite; }
        .cab-chargement .cab-chargement-titre { font-family: 'Playfair Display', serif; font-size: 1.5rem; letter-spacing: 0.02em; }
        .cab-chargement .cab-chargement-sous { font-size: 0.8rem; letter-spacing: 0.18em; text-transform: uppercase; color: #a8966a; }
        .cab-chargement .cab-chargement-barre { width: 180px; height: 2px; background: rgba(201,162,77,0.15); border-radius: 2px; overflow: hidden; position: relative; }
        .cab-chargement .cab-chargement-barre::after { content: ""; position: absolute; top: 0; left: -40%; width: 40%; height: 100%; background: linear-gradient(90deg, transparent, #c9a24d, transparent); animation: cabGlisse 1.4s ease-in-out infinite; }
        .cab-chargement .cab-chargement-msg { font-size: 0.82rem; color: #8a8270; }
        @keyframes cabRespire { 0%, 100% { transform: scale(1); opacity: 0.85; } 50% { transform: scale(1.06); opacity: 1; } }
        @keyframes cabGlisse { 0% { left: -40%; } 100% { left: 100%; } }
        @media (prefers-reduced-motion: reduce) { .cab-chargement * { animation: none !important; } }
      `}</style>
      <div className="cab-chargement-logo"><ObsLogo size={64} /></div>
      <div className="cab-chargement-titre">Cabinet Varelli &amp; Associés</div>
      <div className="cab-chargement-sous">Espace juridique</div>
      <div className="cab-chargement-barre" />
      <div className="cab-chargement-msg">{message}</div>
    </div>
  );
}
