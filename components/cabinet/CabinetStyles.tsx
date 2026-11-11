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
.cab-muted { color: var(--text-muted); font-size: .85rem; line-height: 1.6; }

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

@media (prefers-reduced-motion: reduce) {
  .cab-enter, .cab-stagger > *, .cab-live, .cab-card, .cab-card::after { animation: none !important; transition: none !important; }
}
`;

export function CabinetStyles() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}
