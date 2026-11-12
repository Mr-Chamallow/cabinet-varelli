"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import CartesMembres from "@/components/cabinet/CartesMembres";
import AvisCabinet from "@/components/cabinet/AvisCabinet";

// Mise en page sobre : séparations fines, listes au lieu de cartes
const CSS = `
.ac-page { display: flex; flex-direction: column; gap: 2.6rem; margin-bottom: 2.4rem; }
.ac-hero { padding: 1.5rem 0 2rem; border-bottom: 1px solid var(--border); }
.ac-eyebrow { font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.9rem; }
.ac-titre { font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; max-width: 36rem; margin: 0 0 0.8rem; color: var(--text); }
.ac-texte { color: var(--text-dim); max-width: 34rem; line-height: 1.6; margin: 0 0 1.4rem; }
.ac-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.ac-bloc { display: flex; flex-direction: column; gap: 1rem; }
.ac-label { font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-dim); font-weight: 600; }
.ac-entete { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }
.ac-voir { font-size: 0.8rem; color: var(--gold); text-decoration: none; }
.ac-liste { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--border); }
.ac-liste li { border-bottom: 1px solid var(--border); }
.ac-ligne { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 0.9rem 0.2rem; color: var(--text); text-decoration: none; font-weight: 600; font-size: 0.95rem; transition: color .15s, padding .15s; }
.ac-ligne:hover { color: var(--gold); padding-left: 0.6rem; }
.ac-compte { font-weight: 400; font-size: 0.8rem; color: var(--text-dim); white-space: nowrap; }
`;

// Page d'accueil du cabinet : présentation, domaines, équipe, avis clients
export default function AccueilCabinet() {
  const [domaines, setDomaines] = useState<[string, number][]>([]);

  useEffect(() => {
    fetch("/api/cabinet/cabinet_tarifs").then(r => r.json()).then(d => {
      const compte: Record<string, number> = {};
      (d.rows || []).forEach((t: any) => { const c = t.categorie || "Autres"; compte[c] = (compte[c] || 0) + 1; });
      setDomaines(Object.entries(compte));
    });
  }, []);

  return (
    <div className="ac-page">
      <style>{CSS}</style>

      <section className="ac-hero">
        <div className="ac-eyebrow">Cabinet d&apos;avocats · Espace client</div>
        <h2 className="ac-titre">Un accompagnement juridique sérieux, discret et sur mesure.</h2>
        <p className="ac-texte">Choisis le service dont tu as besoin. Nous nous occupons du reste.</p>
        <div className="ac-actions">
          <Link className="btn btn-gold btn-sm" href="/avocat/rdv">Prendre rendez-vous</Link>
          <Link className="btn btn-outline btn-sm" href="/avocat/dossiers">Ouvrir un dossier</Link>
          <Link className="btn btn-outline btn-sm" href="/avocat/tarifs">Voir les tarifs</Link>
        </div>
      </section>

      {domaines.length > 0 && (
        <section className="ac-bloc">
          <div className="ac-label">Nos domaines</div>
          <ul className="ac-liste">
            {domaines.map(([nom, n]) => (
              <li key={nom}>
                <Link href="/avocat/tarifs" className="ac-ligne">
                  <span>{nom}</span>
                  <span className="ac-compte">{n} prestation{n > 1 ? "s" : ""} <span aria-hidden>›</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="ac-bloc">
        <div className="ac-entete">
          <div className="ac-label">Notre équipe</div>
          <Link href="/avocat/organigramme" className="ac-voir">Voir tout</Link>
        </div>
        <CartesMembres limite={3} />
      </section>

      <AvisCabinet />
    </div>
  );
}
