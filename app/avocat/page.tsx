"use client";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { ObsLogo } from "@/components/ObsLogo";
import { hasPermission } from "@/lib/auth";
import InscriptionModal from "@/components/avocat/InscriptionModal";
import AccueilCabinet from "@/components/cabinet/AccueilCabinet";
import TableauBordStaff from "@/components/cabinet/TableauBordStaff";
import { estStaffUser } from "@/lib/cabinetRoles";
import { CabinetStyles } from "@/components/cabinet/CabinetStyles";
import EcranChargement from "@/components/cabinet/EcranChargement";

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

  if (loading || !user) return <EcranChargement />;
  if (!pret) return <div className="page-container" style={{ color: "var(--text-dim)" }}>Chargement...</div>;

  const recharger = () => window.location.reload();
  const infosDiscord = discord || { discord_id: "", discord_name: "" };

  return (
    <div className="page-container cab-enter">
      <CabinetStyles />
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
        <div className="cab-card" style={{ marginBottom: "1rem" }}>Accès en cours d&apos;activation. Recharge la page.</div>
      )}

      {estStaffUser(user) && <TableauBordStaff />}

      <style>{`
        .ac-label { font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-dim); font-weight: 600; }
        .ac-acces { display: grid; grid-template-columns: 1fr; gap: 0.7rem; margin-bottom: 2.6rem; }
        @media (min-width: 640px) { .ac-acces { grid-template-columns: repeat(2, 1fr); } }
        .ac-lien { display: flex; align-items: center; gap: 0.9rem; padding: 0.9rem 1rem; border: 1px solid var(--border); border-radius: 12px; text-decoration: none; color: inherit; transition: border-color .15s, background .15s; }
        .ac-lien:hover { border-color: var(--gold); background: rgba(176,138,62,0.05); }
        .ac-lien-icone { font-size: 1.2rem; width: 2rem; text-align: center; flex: 0 0 auto; }
        .ac-lien-texte { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .ac-lien-texte b { font-size: 0.95rem; }
        .ac-lien-texte small { font-size: 0.78rem; color: var(--text-dim); margin-top: 2px; }
        .ac-lien-fleche { color: var(--text-dim); font-size: 1.2rem; }
      `}</style>
      <div className="ac-label" style={{ marginBottom: "0.8rem" }}>Accès rapides</div>
      <div className="ac-acces">
        {SECTIONS.filter(s => s.perms.some(p => hasPermission(user, p))).map(s => (
          <a key={s.label} href={s.href} className="ac-lien">
            <span className="ac-lien-icone">{s.icon}</span>
            <span className="ac-lien-texte"><b>{s.label}</b><small>{s.desc}</small></span>
            <span className="ac-lien-fleche" aria-hidden>›</span>
          </a>
        ))}
      </div>

      <AccueilCabinet />

      {!profil && <InscriptionModal discord={infosDiscord} onDone={recharger} />}
      {profil && editer && <InscriptionModal profil={profil} discord={infosDiscord} onClose={() => setEditer(false)} onDone={recharger} />}
    </div>
  );
}