"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PhotoPicker } from "@/components/PhotoPicker";
export { fileToPhoto } from "@/components/PhotoPicker";

// Carte pro d'employé Obsidian Logistics : recto/verso, tilt 3D, reflet holographique, anneaux animés, puce, scan.
export interface CardEmploye { id: string; nom: string; role?: string | null; discord?: string | null; telephone?: string | null; created_at?: string; photo_url?: string | null; actif?: boolean }

export function poleOf(role?: string | null) {
  const r = (role || "").toLowerCase();
  if (/ceo|directeur g|patron|associ/.test(r)) return { nom: "Direction", color: "#e8c766", niveau: "ALPHA" };
  if (/coo|directrice|op[ée]rationnel/.test(r)) return { nom: "Direction", color: "#e8c766", niveau: "ALPHA" };
  if (/juridique|avocat/.test(r)) return { nom: "Pôle Juridique", color: "#a78bfa", niveau: /resp/.test(r) ? "BRAVO" : "CHARLIE" };
  if (/logisti/.test(r)) return { nom: "Pôle Logistique", color: "#c9a24d", niveau: /resp/.test(r) ? "BRAVO" : "CHARLIE" };
  if (/s[ée]curit/.test(r)) return { nom: "Pôle Sécurité", color: "#e5484d", niveau: /resp/.test(r) ? "BRAVO" : "CHARLIE" };
  if (/stagiaire/.test(r)) return { nom: "Stagiaire", color: "#8b93a7", niveau: "DELTA" };
  return { nom: "Opérations", color: "#4cc2ff", niveau: "DELTA" };
}

const matricule = (id: string) => "OBS-" + (parseInt(id.replace(/[^0-9a-f]/gi, "").slice(0, 6) || "0", 16) % 10000).toString().padStart(4, "0");
const BASE = 440;

export function EmployeeCard({ e, flippable = true, onZoom }: { e: CardEmploye; flippable?: boolean; onZoom?: () => void }) {
  const wrap = useRef<HTMLDivElement>(null); const tilt = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1); const [back, setBack] = useState(false); const [flash, setFlash] = useState(false);
  const p = poleOf(e.role);
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
        <div className="idc-tilt" ref={tilt} style={{ transform: `scale(${scale})`, ["--c" as any]: p.color }}>
          <div className={`idc-flip${back ? " back" : ""}`}>
            {/* RECTO */}
            <div className="idc">
              <div className="idc-rings"><i /><i /><i /></div>
              <div className="idc-grid" /><div className="idc-scan" /><div className="idc-shine" />
              {flash && <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle,#fff8,transparent 60%)", animation: "idcFlash 1.4s ease-out forwards", zIndex: 5 }} />}
              <div className="idc-head"><div className="idc-brand"><span className="idc-hex">◆</span> OBSIDIAN LOGISTICS</div><div className="idc-lvl">ACCRÉDITATION {p.niveau}</div></div>
              <div className="idc-body">
                <div className="idc-photo">
                  {e.photo_url ? <img src={e.photo_url} alt="" referrerPolicy="no-referrer" /> : <span>{(e.nom || "?").charAt(0).toUpperCase()}</span>}
                  <b className={e.actif === false ? "off" : "on"} />
                </div>
                <div className="idc-info">
                  <div className="idc-name">{e.nom}</div>
                  <div className="idc-role">{e.role || "Employé"}</div>
                  <div className="idc-pole">{p.nom}</div>
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
            <div className="idc verso">
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
