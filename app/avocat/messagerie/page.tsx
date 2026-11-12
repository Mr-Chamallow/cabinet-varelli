"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import CabinetShell from "@/components/cabinet/CabinetShell";
import { estStaffUser } from "@/lib/cabinetRoles";
import { useTempsReel } from "@/lib/useTempsReel";

const SALONS = [
  { slug: "salon-general", nom: "Salon général", desc: "Discussion ouverte à tout le cabinet", icone: "💬" },
  { slug: "salon-juridique", nom: "Liaison secrétaire juridique", desc: "Échanges entre avocats et secrétariat", icone: "⚖️" },
];

const CSS = `
.mz { display: flex; flex-direction: column; gap: 1.6rem; }
.mz-section-titre { font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-dim); margin: 0 0 0.6rem 0.2rem; font-weight: 600; }
.mz-liste { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 14px; background: var(--card, #161616); overflow: hidden; }
.mz-ligne { display: flex; align-items: center; gap: 0.9rem; padding: 0.85rem 1rem; text-decoration: none; color: inherit; border-top: 1px solid var(--border); transition: background .15s; }
.mz-ligne:first-child { border-top: none; }
.mz-ligne:hover { background: rgba(212,175,55,0.06); }
.mz-icone { flex: 0 0 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; font-size: 1.05rem; background: rgba(212,175,55,0.1); }
.mz-texte { flex: 1; min-width: 0; }
.mz-nom { font-weight: 600; font-size: 0.92rem; }
.mz-desc { font-size: 0.74rem; color: var(--text-dim); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mz-badge { min-width: 22px; height: 22px; padding: 0 7px; border-radius: 999px; background: var(--gold); color: #111; font-size: 0.72rem; font-weight: 700; display: grid; place-items: center; }
.mz-fleche { color: var(--text-dim); font-size: 1rem; }
.mz-mention { height: 22px; padding: 0 7px; border-radius: 999px; background: rgba(217,83,79,0.18); color: #e88a86; border: 1px solid rgba(217,83,79,0.4); font-size: 0.72rem; font-weight: 700; display: grid; place-items: center; }
.mz-bureau-avatar { flex: 0 0 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; font-weight: 700; font-size: 0.85rem; background: rgba(255,255,255,0.06); color: var(--gold); border: 1px solid var(--border); }
.mz-note { font-size: 0.75rem; color: var(--text-dim); margin: 0 0 0.6rem 0.2rem; line-height: 1.5; }
.mz-vide { padding: 1rem; color: var(--text-dim); font-size: 0.85rem; }
`;

const initiales = (nom: string) => (nom || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase();

function Ligne({ href, icone, nom, desc, badge = 0, mention = 0 }: { href: string; icone: React.ReactNode; nom: string; desc?: string; badge?: number; mention?: number }) {
  return (
    <Link href={href} className="mz-ligne">
      <div className="mz-icone">{icone}</div>
      <div className="mz-texte">
        <div className="mz-nom">{nom}</div>
        {desc && <div className="mz-desc">{desc}</div>}
      </div>
      {mention > 0 && <span className="mz-mention" title="Tu as été mentionné">@{mention}</span>}
      {badge > 0 ? <span className="mz-badge">{badge}</span> : <span className="mz-fleche">›</span>}
    </Link>
  );
}

function Liste() {
  const [staff, setStaff] = useState<any[]>([]);
  const [notifs, setNotifs] = useState<any>({ plaintes: 0, votes: 0 });
  const [topics, setTopics] = useState<any>({});
  useEffect(() => { fetch("/api/cabinet/staff").then(r => r.json()).then(d => setStaff(d.rows || [])); }, []);
  const charger = () => fetch("/api/cabinet/notifications").then(r => r.json()).then(d => { if (!d.error) { setNotifs(d); setTopics(d.topics || {}); } });
  useEffect(() => { charger(); }, []);
  useTempsReel(topics.plaintes, charger);
  useTempsReel(topics.votes, charger);

  // Aperçu du dernier message : « Auteur : texte » (vide si aucun message)
  const apercu = (slug: string) => {
    const d = notifs.derniers?.[slug];
    return d ? `${d.auteur} : ${d.texte}` : "";
  };

  return (
    <div className="mz">
      <style>{CSS}</style>

      <section>
        <div className="mz-section-titre">Salons</div>
        <div className="mz-liste">
          {SALONS.map(s => (
            <Ligne key={s.slug} href={`/avocat/messagerie/${s.slug}`} icone={s.icone} nom={s.nom} desc={apercu(s.slug) || s.desc} badge={notifs.canaux?.[s.slug] || 0} mention={notifs.mentions?.[s.slug] || 0} />
          ))}
        </div>
      </section>

      <section>
        <div className="mz-section-titre">Vie interne</div>
        <div className="mz-liste">
          <Ligne href="/avocat/votes" icone="🗳️" nom="Votes" desc="Proposer un changement et voter" badge={notifs.votes || 0} />
          <Ligne href="/avocat/plaintes" icone="🔒" nom="Plaintes internes" desc="Visibles uniquement par la direction et par toi" badge={notifs.plaintes || 0} />
        </div>
      </section>

      <section>
        <div className="mz-section-titre">Bureaux</div>
        <p className="mz-note">Chaque avocat a son bureau : notes et messages visibles par tous les employés.</p>
        <div className="mz-liste">
          {staff.length === 0 && <div className="mz-vide">Aucun bureau pour l&apos;instant.</div>}
          {staff.map(s => (
            <Link key={s.discord_id} href={`/avocat/messagerie/bureau-${s.discord_id}`} className="mz-ligne">
              <div className="mz-bureau-avatar">{initiales(s.nom)}</div>
              <div className="mz-texte">
                <div className="mz-nom">Bureau de {s.nom}</div>
                <div className="mz-desc">{apercu(`bureau-${s.discord_id}`) || s.role}</div>
              </div>
              {(notifs.mentions?.[`bureau-${s.discord_id}`] || 0) > 0 && <span className="mz-mention">@{notifs.mentions[`bureau-${s.discord_id}`]}</span>}
              {(notifs.canaux?.[`bureau-${s.discord_id}`] || 0) > 0
                ? <span className="mz-badge">{notifs.canaux[`bureau-${s.discord_id}`]}</span>
                : <span className="mz-fleche">›</span>}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

// Messagerie interne : réservée aux employés du cabinet (jamais aux clients)
export default function Page() {
  return (
    <CabinetShell title="Messagerie interne" icon="" desc="Salons, votes, plaintes et bureaux" perms={["cabinet_dossiers", "cabinet_rdv"]}>
      {(user) => estStaffUser(user)
        ? <Liste />
        : <div className="empty-state"><div className="empty-title">Réservé aux employés</div></div>}
    </CabinetShell>
  );
}
