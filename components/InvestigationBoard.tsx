"use client";
import { useEffect, useMemo, useRef, useState } from "react";

// Tableau d'enquête : photos épinglées sur un panneau, fils rouges entre les personnes liées
// (même organisation, ou nom cité dans « Relations »). Les épingles se déplacent (position mémorisée).
interface F { id: string; nom: string; organisation?: string | null; relations?: string | null; photo_url?: string | null; prime?: number | null; surveille?: boolean }
const W = 1500, H = 920, PW = 124, PH = 150, KEY = "obs-board-pos";

export function InvestigationBoard({ fiches, onOpen }: { fiches: F[]; onOpen: (id: string) => void }) {
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({});
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  const board = useRef<HTMLDivElement>(null);

  // Positions initiales : un cluster par organisation, sur une grande ellipse.
  const initial = useMemo(() => {
    const groups: Record<string, F[]> = {}; fiches.forEach(f => (groups[f.organisation || "—"] ??= []).push(f));
    const keys = Object.keys(groups); const out: Record<string, { x: number; y: number }> = {};
    keys.forEach((k, gi) => {
      const cx = W / 2 + Math.cos((gi / keys.length) * 6.283 - 1.57) * (keys.length > 1 ? 480 : 0), cy = H / 2 + Math.sin((gi / keys.length) * 6.283 - 1.57) * (keys.length > 1 ? 290 : 0);
      groups[k].forEach((f, i) => { const a = (i / groups[k].length) * 6.283, r = groups[k].length > 1 ? 70 + groups[k].length * 14 : 0; out[f.id] = { x: Math.max(10, Math.min(W - PW - 10, cx + Math.cos(a) * r - PW / 2)), y: Math.max(10, Math.min(H - PH - 10, cy + Math.sin(a) * r - PH / 2)) }; });
    });
    return out;
  }, [fiches]);
  useEffect(() => { let saved: any = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch {} setPos({ ...initial, ...saved }); }, [initial]);

  const links = useMemo(() => {
    const out: { a: string; b: string }[] = [];
    for (let i = 0; i < fiches.length; i++) for (let j = i + 1; j < fiches.length; j++) {
      const a = fiches[i], b = fiches[j];
      const sameOrg = a.organisation && a.organisation === b.organisation;
      const cites = (x: F, y: F) => y.nom.length >= 3 && (x.relations || "").toLowerCase().includes(y.nom.toLowerCase());
      if (sameOrg || cites(a, b) || cites(b, a)) out.push({ a: a.id, b: b.id });
    }
    return out;
  }, [fiches]);

  function down(e: React.PointerEvent, id: string) { const p = pos[id]; if (!p) return; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); const r = board.current!.getBoundingClientRect(); drag.current = { id, dx: e.clientX - r.left - p.x, dy: e.clientY - r.top - p.y, moved: false }; }
  function move(e: React.PointerEvent) { const d = drag.current; if (!d) return; const r = board.current!.getBoundingClientRect(); d.moved = true; setPos(p => ({ ...p, [d.id]: { x: Math.max(0, Math.min(W - PW, e.clientX - r.left - d.dx)), y: Math.max(0, Math.min(H - PH, e.clientY - r.top - d.dy)) } })); }
  function up(id: string) { const d = drag.current; drag.current = null; if (!d) return; if (!d.moved) { onOpen(id); return; } setPos(p => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} return p; }); }
  const c = (id: string) => ({ x: (pos[id]?.x ?? 0) + PW / 2, y: (pos[id]?.y ?? 0) + 6 });

  return (
    <div style={{ overflow: "auto", maxHeight: "72vh", borderRadius: 10 }}>
      <div className="board" ref={board}>
        <svg width={W} height={H}>
          {links.map((l, i) => { const a = c(l.a), b = c(l.b); const sag = 28 + ((a.x + b.y) % 22); return <path key={i} d={`M${a.x},${a.y} Q${(a.x + b.x) / 2},${(a.y + b.y) / 2 + sag} ${b.x},${b.y}`} style={{ animationDelay: `${i * 0.05}s` }} />; })}
        </svg>
        {fiches.map(f => { const p = pos[f.id]; if (!p) return null; return (
          <div key={f.id} className={`pin${Number(f.prime) > 0 ? " hot" : ""}${f.surveille ? " eye" : ""}`} style={{ left: p.x, top: p.y, transform: `rotate(${(f.id.charCodeAt(0) % 7) - 3}deg)` }}
            onPointerDown={e => down(e, f.id)} onPointerMove={move} onPointerUp={() => up(f.id)}>
            {f.photo_url ? <img src={f.photo_url} alt="" draggable={false} referrerPolicy="no-referrer" /> : <div className="pin-no">?</div>}
            <b>{f.nom}</b><small>{f.organisation || "—"}</small>
          </div>); })}
      </div>
    </div>
  );
}
