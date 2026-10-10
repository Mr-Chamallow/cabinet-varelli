"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PhotoPicker } from "@/components/PhotoPicker";
export { fileToPhoto } from "@/components/PhotoPicker";

// Carte pro d'employé Obsidian Logistics : recto/verso, tilt 3D, reflet holographique, anneaux animés, puce, scan.
export interface CardEmploye { id: string; nom: string; role?: string | null; discord?: string | null; telephone?: string | null; created_at?: string; photo_url?: string | null; actif?: boolean }

export interface RoleStyle { key: string; nom: string; color: string; color2: string; niveau: string; emblem: string; stars: number; finish: string; titre: string }
// Une identité visuelle par rôle / grade : couleurs, emblème, étoiles, finition.
export const ROLE_STYLES: Record<string, RoleStyle> = {
  patron:  { key: "patron", nom: "Direction", color: "#f2d27a", color2: "#9a7a2c", niveau: "OMÉGA", emblem: "♛", stars: 5, finish: "foil", titre: "FONDATEUR" },
  ceo:     { key: "ceo", nom: "Direction", color: "#e8c766", color2: "#8a6a24", niveau: "ALPHA", emblem: "♛", stars: 5, finish: "foil", titre: "DIRECTION GÉNÉRALE" },
  coo:     { key: "coo", nom: "Direction", color: "#d8dde6", color2: "#7d8594", niveau: "ALPHA", emblem: "◆", stars: 4, finish: "foil", titre: "DIRECTION OPÉRATIONNELLE" },
  rj:      { key: "rj", nom: "Pôle Juridique", color: "#a78bfa", color2: "#5b3fb0", niveau: "BRAVO", emblem: "⚖", stars: 4, finish: "guilloche", titre: "RESPONSABLE" },
  aj:      { key: "aj", nom: "Pôle Juridique", color: "#c4b5fd", color2: "#7357d6", niveau: "CHARLIE", emblem: "⚖", stars: 3, finish: "guilloche", titre: "AGENT" },
  avocat:  { key: "avocat", nom: "Pôle Juridique", color: "#d8a7e8", color2: "#8b3fa8", niveau: "CHARLIE", emblem: "§", stars: 3, finish: "guilloche", titre: "AVOCAT" },
  rl:      { key: "rl", nom: "Pôle Logistique", color: "#f0a73a", color2: "#9a5a0c", niveau: "BRAVO", emblem: "⬢", stars: 4, finish: "hex", titre: "RESPONSABLE" },
  al:      { key: "al", nom: "Pôle Logistique", color: "#f7c873", color2: "#b8741a", niveau: "CHARLIE", emblem: "⬢", stars: 3, finish: "hex", titre: "AGENT" },
  rs:      { key: "rs", nom: "Pôle Sécurité", color: "#f0555c", color2: "#8c1219", niveau: "BRAVO", emblem: "⛨", stars: 4, finish: "stripes", titre: "RESPONSABLE" },
  as:      { key: "as", nom: "Pôle Sécurité", color: "#ff8a8f", color2: "#b32028", niveau: "CHARLIE", emblem: "⛨", stars: 3, finish: "stripes", titre: "AGENT" },
  op:      { key: "op", nom: "Opérations", color: "#4cc2ff", color2: "#1d6a99", niveau: "DELTA", emblem: "◈", stars: 2, finish: "plain", titre: "OPÉRATEUR" },
  st:      { key: "st", nom: "Stagiaire", color: "#9aa3b5", color2: "#565e70", niveau: "ÉCHO", emblem: "◇", stars: 1, finish: "intern", titre: "STAGIAIRE" },
  legal:   { key: "legal", nom: "Partenaire externe", color: "#4fd1b5", color2: "#1f7a69", niveau: "LECTURE", emblem: "◎", stars: 1, finish: "plain", titre: "LÉGAL SERVICE" },
};
export function roleKey(role?: string | null): string {
  const r = (role || "").toLowerCase();
  if (/patron|associ/.test(r)) return "patron";
  if (/ceo|directeur g/.test(r)) return "ceo";
  if (/coo|directrice|op[ée]rationnel/.test(r)) return "coo";
  if (/avocat/.test(r)) return "avocat";
  if (/juridique/.test(r)) return /resp/.test(r) ? "rj" : "aj";
  if (/logisti/.test(r)) return /resp/.test(r) ? "rl" : "al";
  if (/s[ée]curit/.test(r)) return /resp/.test(r) ? "rs" : "as";
  if (/stagiaire/.test(r)) return "st";
  if (/l[ée]gal/.test(r)) return "legal";
  return "op";
}
export const roleStyle = (role?: string | null) => ROLE_STYLES[roleKey(role)];
// Compat (accueil, etc.)
export function poleOf(role?: string | null) { const r = roleStyle(role); return { nom: r.nom, color: r.color, niveau: r.niveau }; }

const matricule = (id: string) => "OBS-" + (parseInt(id.replace(/[^0-9a-f]/gi, "").slice(0, 6) || "0", 16) % 10000).toString().padStart(4, "0");
const BASE = 440;

export function EmployeeCard({ e, flippable = true, onZoom }: { e: CardEmploye; flippable?: boolean; onZoom?: () => void }) {
  const wrap = useRef<HTMLDivElement>(null); const tilt = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1); const [back, setBack] = useState(false); const [flash, setFlash] = useState(false);
  const p = roleStyle(e.role);
  useLayoutEffect(() => {
    const el = wrap.current; if (!el) return;
    const f = () => setScale(Math.min(1, el.clientWidth / BASE));
    f(); const ro = new ResizeObserver(f); ro.observe(el); return () => ro.disconnect();
  }, []);
  // « Cérémonie » : flash quand le rôle change.
  const prevRole = useRef(e.role);
  useEffect(() => { if (prevRole.current !== e.role) { prevRole.current = e.role; setFlash(true); setBack(true); setTimeout(() => setBack(false), 900); setTimeout(() => setFlash(false), 1600); } }, [e.role]);
  function move(ev: React.MouseEvent) {
    const el = tilt.current; if (!el) return;
    const r = el.getBoundingClientRect(); const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 12}deg`); el.style.setProperty("--ry", `${(x - 0.5) * 16}deg`);
    el.style.setProperty("--mx", `${x * 100}%`); el.style.setProperty("--my", `${y * 100}%`);
  }
  function leave() { const el = tilt.current; if (!el) return; el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); }
  const since = e.created_at ? new Date(e.created_at).toLocaleDateString("fr-FR", { month: "2-digit", year: "2-digit" }) : "—";
  const h = (BASE / 1.586) * scale;
  return (
    <div className="idc-wrap">
      <div className="idc-scaler" ref={wrap} style={{ height: h }} onMouseMove={move} onMouseLeave={leave}>
        <div className="idc-tilt" ref={tilt} style={{ transform: `scale(${scale})`, ["--c" as any]: p.color, ["--c2" as any]: p.color2 }}>
          <div className={`idc-flip${back ? " back" : ""}`}>
            {/* RECTO */}
            <div className={`idc idc-f-${p.finish}`}>
              <div className="idc-emblem" aria-hidden="true">{p.emblem}</div>
              {p.finish === "intern" && <div className="idc-ribbon">STAGIAIRE</div>}
              <div className="idc-rings"><i /><i /><i /></div>
              <div className="idc-grid" /><div className="idc-scan" /><div className="idc-shine" />
              {flash && <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle,#fff8,transparent 60%)", animation: "idcFlash 1.4s ease-out forwards", zIndex: 5 }} />}
              <div className="idc-head"><div className="idc-brand"><span className="idc-hex">◆</span> OBSIDIAN LOGISTICS</div><div className="idc-lvl">{p.emblem} NIVEAU {p.niveau}</div></div>
              <div className="idc-body">
                <div className="idc-photo">
                  {e.photo_url ? <img src={e.photo_url} alt="" referrerPolicy="no-referrer" /> : <span>{(e.nom || "?").charAt(0).toUpperCase()}</span>}
                  <b className={e.actif === false ? "off" : "on"} />
                </div>
                <div className="idc-info">
                  <div className="idc-name">{e.nom}</div>
                  <div className="idc-role">{e.role || "Employé"}</div>
                  <div className="idc-pole">{p.nom} · {p.titre}</div>
                  <div className="idc-stars" aria-label={`Grade ${p.stars}/5`}>{Array.from({ length: 5 }).map((_, i) => <b key={i} className={i < p.stars ? "on" : ""}>★</b>)}</div>
                  <div className="idc-meta"><div><small>MATRICULE</small>{matricule(e.id)}</div><div><small>DEPUIS</small>{since}</div></div>
                </div>
              </div>
              <div className="idc-foot">
                <div className="idc-chip"><i /><i /><i /><i /></div>
                <div className="idc-code">{(e.discord || "").slice(0, 18) || "—"}</div>
                <div className="idc-bars">{Array.from({ length: 28 }).map((_, i) => <u key={i} style={{ width: 1 + ((i * 7 + e.nom.length) % 3) }} />)}</div>
              </div>
            </div>
            {/* VERSO */}
            <div className={`idc verso idc-f-${p.finish}`}>
              <div className="idc-grid" /><div className="idc-shine" />
              <div className="idc-mag" />
              <div className="idc-vtext">Cette carte est strictement personnelle et reste la propriété d'Obsidian Logistics. Elle atteste l'appartenance de son porteur au Consortium. En cas de perte ou de vol, prévenir immédiatement la Direction. Toute utilisation frauduleuse sera portée devant le Tribunal de l'Ombre.</div>
              <div className="idc-sign"><span>{e.nom}</span><small>SIGNATURE</small></div>
              <div className="idc-vfoot"><span>{matricule(e.id)} · {p.nom.toUpperCase()}</span><span style={{ color: p.color }}>◆ OBSIDIAN</span></div>
            </div>
          </div>
        </div>
      </div>
      {(flippable || onZoom) && (
        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", marginTop: "0.5rem" }}>
          {flippable && <button type="button" className="btn btn-outline btn-sm" onClick={() => setBack(b => !b)}>↻ {back ? "Recto" : "Verso"}</button>}
          {onZoom && <button type="button" className="btn btn-gold btn-sm" onClick={onZoom}>🔍 Voir en grand</button>}
        </div>
      )}
    </div>
  );
}

export function EmployeeCardModalBody({ e, canEdit, onPhoto }: { e: CardEmploye; canEdit: boolean; onPhoto: (url: string | null) => Promise<void> | void }) {
  return (
    <div>
      <EmployeeCard e={e} />
      {canEdit && <div style={{ marginTop: "1rem" }}><PhotoPicker value={e.photo_url} onChange={onPhoto} /></div>}
    </div>
  );
}
