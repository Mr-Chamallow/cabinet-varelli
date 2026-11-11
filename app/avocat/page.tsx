"use client";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { ObsLogo } from "@/components/ObsLogo";
import { hasPermission } from "@/lib/auth";
import InscriptionModal from "@/components/avocat/InscriptionModal";

const SECTIONS = [
  { label: "Tarifs", icon: "💰", desc: "Grille des honoraires", href: "/avocat/tarifs", perms: ["avocat", "cabinet_tarifs"] },
  { label: "Prise de RDV", icon: "📅", desc: "Réserver un rendez-vous", href: "/avocat/rdv", perms: ["avocat", "cabinet_rdv"] },
  { label: "Présentation", icon: <ObsLogo size={26} />, desc: "Qui nous sommes", href: "/avocat/presentation", perms: ["avocat", "cabinet_presentation"] },
  { label: "Organigramme", icon: "🏛️", desc: "Notre équipe", href: "/avocat/organigramme", perms: ["avocat", "cabinet_organigramme"] },
  { label: "Dossiers", icon: "📁", desc: "Ouvrir ou suivre un dossier", href: "/avocat/dossiers", perms: ["avocat", "cabinet_dossiers"] },
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
  if (!pret) return <div className="page-container" style={{ color: "var(--text-dim)" }}>Chargement...</div>;

  const recharger = () => window.location.reload();
  const infosDiscord = discord || { discord_id: "", discord_name: "" };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cabinet Varelli & Associés</h1>
          <p className="page-subtitle">
            {profil ? `Espace client : ${profil.nom_rp}` : "Bienvenue, crée ton compte pour continuer"}
          </p>
          <div className="gold-line" />
        </div>
        {profil && <button className="btn btn-outline btn-sm" onClick={() => setEditer(true)}>Mes informations</button>}
      </div>

      {profil && !hasPermission(user, "avocat") && (
        <div className="card" style={{ marginBottom: "1rem" }}>Accès en cours d'activation. Recharge la page.</div>
      )}

      <div className="cab-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1rem" }}>
        {SECTIONS.filter(s => s.perms.some(p => hasPermission(user, p))).map(s => (
          <a key={s.label} href={s.href} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="cab-card">
              <div style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>{s.icon}</div>
              <div style={{ fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>{s.desc}</div>
            </div>
          </a>
        ))}
      </div>

      {!profil && <InscriptionModal discord={infosDiscord} onDone={recharger} />}
      {profil && editer && <InscriptionModal profil={profil} discord={infosDiscord} onClose={() => setEditer(false)} onDone={recharger} />}
    </div>
  );
}