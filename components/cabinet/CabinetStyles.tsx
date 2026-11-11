"use client";

// Style du module cabinet : cartes, animations d'entrée, survol, pastille en direct.
// Les couleurs viennent des variables du thème (globals.css).
const CSS = `
@keyframes cabFade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes cabShine { from { transform: translateX(-120%); } to { transform: translateX(120%); } }
@keyframes cabPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(var(--gold-rgb),.45); } 50% { box-shadow: 0 0 0 8px rgba(var(--gold-rgb),0); } }

.cab-enter { animation: cabFade .5s cubic-bezier(.2,.7,.2,1) both; }
.cab-stagger > * { animation: cabFade .5s cubic-bezier(.2,.7,.2,1) both; }
.cab-stagger > *:nth-child(2) { animation-delay: .05s; }
.cab-stagger > *:nth-child(3) { animation-delay: .10s; }
.cab-stagger > *:nth-child(4) { animation-delay: .15s; }
.cab-stagger > *:nth-child(5) { animation-delay: .20s; }
.cab-stagger > *:nth-child(6) { animation-delay: .25s; }
.cab-stagger > *:nth-child(n+7) { animation-delay: .30s; }

.cab-card {
  position: relative; overflow: hidden;
  background: linear-gradient(180deg, var(--card), var(--bg));
  border: 1px solid var(--border); border-radius: var(--radius-lg);
  padding: 1.1rem 1.2rem;
  transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
}
.cab-card:hover {
  transform: translateY(-3px); border-color: rgba(var(--gold-rgb),.45);
  box-shadow: 0 14px 32px -14px rgba(0,0,0,.7), 0 0 0 1px rgba(var(--gold-rgb),.12);
}
.cab-card::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(110deg, transparent 30%, rgba(var(--gold-rgb),.12) 50%, transparent 70%);
  transform: translateX(-120%);
}
.cab-card:hover::after { animation: cabShine .9s ease; }
.cab-link { text-decoration: none; color: inherit; display: block; }

.cab-title { font-family: 'Cinzel', serif; color: var(--gold); letter-spacing: .08em; }
.cab-muted { color: #c5cbdb; font-size: .85rem; line-height: 1.6; }
/* Dans le module cabinet, les gris sont plus lisibles */
.cab-enter { --text-dim: #a3abc4; --text-muted: #cdd2df; }
.cab-cliquable { cursor: pointer; }
.cab-cliquable:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }

.cab-badge {
  display: inline-block; font-size: .66rem; letter-spacing: .12em; text-transform: uppercase;
  padding: .2rem .6rem; border-radius: 999px;
  border: 1px solid rgba(var(--gold-rgb),.35); color: var(--gold); background: var(--gold-muted);
}
.cab-live {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%;
  background: #5fb878; animation: cabPulse 2s infinite;
}

.cab-avatar {
  width: 78px; height: 78px; margin: 0 auto .9rem; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Playfair Display', serif; font-size: 1.7rem; font-weight: 700; color: var(--gold-light);
  background: radial-gradient(circle at 30% 30%, var(--card-hover), var(--bg));
  border: 2px solid rgba(var(--gold-rgb),.55); box-shadow: 0 0 0 5px var(--gold-muted);
}
.cab-vacant { border-style: dashed; }
.cab-vacant .cab-avatar { color: var(--text-dim); border-style: dashed; box-shadow: none; }

/* Carte diplôme (organigramme) */
.cab-diplome {
  position: relative; text-align: center; padding: 1.4rem 1.1rem 1.2rem;
  background: radial-gradient(circle at top, rgba(var(--gold-rgb),.07), transparent 60%), var(--card);
  border: 1px solid rgba(var(--gold-rgb),.55); border-radius: var(--radius-lg);
  transition: transform .25s ease, box-shadow .25s ease;
}
.cab-diplome:hover { transform: translateY(-3px); box-shadow: 0 14px 32px -14px rgba(0,0,0,.7), 0 0 0 1px rgba(var(--gold-rgb),.2); }
.cab-diplome::before {
  content: ""; position: absolute; inset: 6px; pointer-events: none;
  border: 1px solid rgba(var(--gold-rgb),.25); border-radius: calc(var(--radius-lg) - 4px);
}
.cab-diplome-entete { font-family: 'Cinzel', serif; font-size: .6rem; letter-spacing: .3em; text-transform: uppercase; color: var(--gold-dark); margin-bottom: .9rem; }
.cab-photo {
  width: 96px; height: 96px; margin: 0 auto .9rem; display: block; object-fit: cover; border-radius: 50%;
  border: 2px solid rgba(var(--gold-rgb),.6); box-shadow: 0 0 0 5px var(--gold-muted);
}
.cab-nom { font-size: 1.05rem; margin-bottom: .35rem; }
.cab-poste { font-size: .78rem; color: var(--gold-light); letter-spacing: .06em; margin-bottom: .5rem; }
.cab-barreau { font-size: .7rem; color: var(--text-muted); margin-bottom: .6rem; }
.cab-chips { display: flex; flex-wrap: wrap; gap: .3rem; justify-content: center; margin-bottom: .6rem; }
.cab-chip { font-size: .66rem; padding: .15rem .5rem; border-radius: 4px; background: var(--surface); border: 1px solid var(--border); color: var(--text-muted); }
.cab-sceau {
  width: 36px; height: 36px; margin: 1rem auto 0; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cinzel', serif; font-size: .62rem; color: var(--bg);
  background: linear-gradient(135deg, var(--gold-light), var(--gold-dark)); box-shadow: 0 2px 8px rgba(0,0,0,.5);
}
.cab-etoiles { color: var(--gold); letter-spacing: .15em; }
.cab-section-titre { font-family: 'Cinzel', serif; color: var(--gold); letter-spacing: .08em; font-size: 1rem; margin: 0 0 .8rem; }

/* Diplôme en grand (ouvert au clic sur une carte de l'organigramme) */
.cab-diplome-grand {
  position: relative; width: min(560px, 100%); max-height: 90vh; overflow: auto;
  padding: 2.6rem 2rem 2.2rem; text-align: center; border-radius: 6px;
  background: radial-gradient(circle at top, rgba(var(--gold-rgb),.14), transparent 55%), linear-gradient(180deg, #181516, #0d0c0c);
  border: 2px solid rgba(var(--gold-rgb),.75);
  box-shadow: 0 30px 80px -20px rgba(0,0,0,.9), inset 0 0 0 1px rgba(var(--gold-rgb),.25);
}
.cab-diplome-grand::before { content: ""; position: absolute; inset: 10px; border: 1px solid rgba(var(--gold-rgb),.5); border-radius: 3px; pointer-events: none; }
.cab-diplome-grand::after { content: ""; position: absolute; inset: 16px; border: 1px dashed rgba(var(--gold-rgb),.25); border-radius: 2px; pointer-events: none; }
.cab-diplome-grand > * { position: relative; z-index: 1; }
.cab-ornement { color: var(--gold); letter-spacing: .5em; font-size: .7rem; margin: 1rem 0; opacity: .85; }
.cab-titre-diplome { font-family: 'Cinzel', serif; font-size: 1.5rem; letter-spacing: .18em; text-transform: uppercase; color: var(--gold-light); margin: .2rem 0 1.2rem; }
.cab-decerne { font-family: 'Playfair Display', serif; font-style: italic; color: #c5cbdb; font-size: .95rem; }
.cab-nom-grand { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700; color: var(--gold); margin: .3rem 0 .8rem; }
.cab-texte-grand { color: #d6dbe7; font-size: .9rem; line-height: 1.8; margin: .3rem auto; max-width: 440px; }
.cab-signature { margin-top: 1.4rem; font-family: 'Playfair Display', serif; font-style: italic; color: var(--gold-light); font-size: 1rem; }
.cab-fermer { position: absolute; top: 8px; right: 12px; z-index: 2; background: none; border: none; color: var(--gold); font-size: 1.6rem; line-height: 1; cursor: pointer; }

@media (prefers-reduced-motion: reduce) {
  .cab-enter, .cab-stagger > *, .cab-live, .cab-card, .cab-card::after { animation: none !important; transition: none !important; }
}
`;

export function CabinetStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}
