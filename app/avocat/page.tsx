"use client";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { hasPermission } from "@/lib/auth";
import InscriptionModal from "@/components/avocat/InscriptionModal";

const SECTIONS = [
  { label: "Tarifs", icon: "💰", desc: "Grille des honoraires" },
  { label: "Prise de RDV", icon: "📅", desc: "Réserver un rendez-vous" },
  { label: "Présentation", icon: "⚖️", desc: "Qui nous sommes" },
  { label: "Organigramme", icon: "🏛️", desc: "Notre équipe" },
  { label: "Nouveau dossier", icon: "📁", desc: "Ouvrir une demande" },
];

export default function AvocatAccueil() {
  const { user, loading } = useCurrentUser();
  const [profil, setProfil] = useState<any>(null);
  const [discord, setDiscord] = useState<any>(null);
  const [pret, setPret] = useState(false);
  const [editer, setEditer] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    fetch("/api/avocat/profil")
      .then(r => r.json())
      .then(d => { setProfil(d.profil); setDiscord(d.discord); setPret(true); });
  }, [loading, user]);

  if (loading || !user) return null;
  if (!pret) return <div className="page-container" style={{ color: "var(--text-dim)" }}>Chargement…</div>;

  const recharger = () => window.location.reload();
  const infosDiscord = discord || { discord_id: "", discord_name: "" };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cabinet Varelli & Associés</h1>
          <p className="page-subtitle">
            {profil ? `Espace client · ${profil.nom_rp}` : "Bienvenue — crée ton compte pour continuer"}
          </p>
          <div className="gold-line" />
        </div>
        {profil && <button className="btn btn-outline btn-sm" onClick={() => setEditer(true)}>✏️ Mes informations</button>}
      </div>

      {profil && !hasPermission(user, "avocat") && (
        <div className="card" style={{ marginBottom: "1rem" }}>Accès en cours d'activation. Recharge la page.</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1rem" }}>
        {SECTIONS.map(s => (
          <div key={s.label} className="card" style={{ opacity: 0.6 }}>
            <div style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>{s.icon}</div>
            <div style={{ fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>{s.desc}</div>
            <div style={{ fontSize: "0.65rem", color: "var(--gold)", marginTop: "0.5rem" }}>Bientôt disponible</div>
          </div>
        ))}
      </div>

      {!profil && <InscriptionModal discord={infosDiscord} onDone={recharger} />}
      {profil && editer && <InscriptionModal profil={profil} discord={infosDiscord} onClose={() => setEditer(false)} onDone={recharger} />}
    </div>
  );
}