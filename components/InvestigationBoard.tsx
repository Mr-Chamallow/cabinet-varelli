"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fileToPhoto } from "@/components/PhotoPicker";
import { pdfEnquete } from "@/lib/pdfDocs";

// Tableau d'enquête (vide au départ, sauvegardé en base et partagé).
// Choisir une personne l'ajoute avec tous ses liens : même organisation, noms cités dans « Relations » (dans les deux sens) et véhicules qui lui sont assignés.
// Images déposées : sur une fiche = nouvelle photo ; sur le panneau = pièce libre. Tout est enregistré automatiquement.
interface F { id: string; nom: string; organisation?: string | null; relations?: string | null; photo_url?: string | null; prime?: number | null; surveille?: boolean }
interface V { id: string; modele: string; plaque?: string; assigne_a?: string | null; photo_url?: string | null }
interface Item { id: string; kind: "fiche" | "vehicule" | "note"; ref: string | null; x: number; y: number; img?: string | null }
const W = 1500, H = 920, PW = 124, PH = 150;
const norm = (s?: string | null) => (s || "").trim().toLowerCase();

export function InvestigationBoard({ fiches, onOpen, onPhoto, user }: { fiches: F[]; onOpen: (id: string) => void; onPhoto?: (id: string, dataUrl: string) => void | Promise<void>; user?: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [vehicles, setVehicles] = useState<V[]>([]);
  const [pick, setPick] = useState("");
  const [over, setOver] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const board = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);

  const load = useCallback(async () => {
    if (!supabase) return;
    const [{ data: b, error }, { data: v }] = await Promise.all([supabase.from("obsidian_board").select("*").order("created_at"), supabase.from("obsidian_garage").select("id,modele,plaque,assigne_a,photo_url")]);
    if (error) setErr("Table obsidian_board absente : lance migration-lot16.sql dans Supabase.");
    setItems((b || []) as Item[]); setVehicles((v || []) as V[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const fById = useMemo(() => new Map(fiches.map(f => [f.id, f])), [fiches]);
  const vById = useMemo(() => new Map(vehicles.map(v => [v.id, v])), [vehicles]);

  // Éléments dont la fiche / le véhicule existe encore.
  const shown = items.filter(i => i.kind === "note" || (i.kind === "fiche" ? fById.has(i.ref!) : vById.has(i.ref!)));
  const onBoard = (kind: string, ref: string) => items.some(i => i.kind === kind && i.ref === ref);

  const relatedOf = (p: F) => {
    const cites = (x: F, y: F) => y.nom.length >= 3 && (x.relations || "").toLowerCase().includes(y.nom.toLowerCase());
    const people = fiches.filter(o => o.id !== p.id && ((p.organisation && p.organisation === o.organisation) || cites(p, o) || cites(o, p)));
    const cars = vehicles.filter(v => norm(v.assigne_a) && norm(v.assigne_a) === norm(p.nom));
    return { people, cars };
  };

  async function addPerson(id: string) {
    const p = fById.get(id); if (!p || !supabase) return;
    const { people, cars } = relatedOf(p);
    const todo: { kind: "fiche" | "vehicule"; ref: string }[] = [];
    if (!onBoard("fiche", p.id)) todo.push({ kind: "fiche", ref: p.id });
    people.forEach(o => { if (!onBoard("fiche", o.id)) todo.push({ kind: "fiche", ref: o.id }); });
    cars.forEach(v => { if (!onBoard("vehicule", v.id)) todo.push({ kind: "vehicule", ref: v.id }); });
    if (!todo.length) return;
    // Placement : la personne choisie au centre d'une zone libre, ses liens en couronne autour.
    const free = () => { for (let t = 0; t < 60; t++) { const x = 40 + Math.random() * (W - PW - 80), y = 40 + Math.random() * (H - PH - 80); if (!items.some(i => Math.abs(i.x - x) < PW && Math.abs(i.y - y) < PH)) return { x, y }; } return { x: 40 + Math.random() * (W - PW - 80), y: 40 + Math.random() * (H - PH - 80) }; };
    const c = free(); const rows = todo.map((t, i) => {
      const main = t.kind === "fiche" && t.ref === p.id;
      const a = (i / Math.max(1, todo.length)) * 6.283, r = 190;
      const x = main ? c.x : c.x + Math.cos(a) * r, y = main ? c.y : c.y + Math.sin(a) * r * 0.75;
      return { ...t, x: Math.round(Math.max(10, Math.min(W - PW - 10, x))), y: Math.round(Math.max(10, Math.min(H - PH - 10, y))), created_by: user || null };
    });
    const { data, error } = await supabase.from("obsidian_board").insert(rows).select();
    if (error) { setErr(error.message); return; }
    setItems(l => [...l, ...((data || []) as Item[])]);
  }

  async function remove(id: string) { setItems(l => l.filter(i => i.id !== id)); await supabase?.from("obsidian_board").delete().eq("id", id); }
  async function clearAll() { if (!window.confirm("Vider tout le tableau ? (les fiches ne sont pas supprimées)")) return; setItems([]); await supabase?.from("obsidian_board").delete().neq("id", "00000000-0000-0000-0000-000000000000"); }
  const persistPos = async (id: string, x: number, y: number) => { await supabase?.from("obsidian_board").update({ x: Math.round(x), y: Math.round(y) }).eq("id", id); };

  // ── Fils : entre personnes présentes (même orga / relations) et personne → véhicule assigné ──
  const links = useMemo(() => {
    const out: { a: string; b: string; car?: boolean }[] = [];
    const fi = shown.filter(i => i.kind === "fiche"), vi = shown.filter(i => i.kind === "vehicule");
    for (let i = 0; i < fi.length; i++) for (let j = i + 1; j < fi.length; j++) {
      const a = fById.get(fi[i].ref!)!, b = fById.get(fi[j].ref!)!;
      const cites = (x: F, y: F) => y.nom.length >= 3 && (x.relations || "").toLowerCase().includes(y.nom.toLowerCase());
      if ((a.organisation && a.organisation === b.organisation) || cites(a, b) || cites(b, a)) out.push({ a: fi[i].id, b: fi[j].id });
    }
    vi.forEach(v => { const car = vById.get(v.ref!)!; fi.forEach(f => { if (norm(car.assigne_a) && norm(car.assigne_a) === norm(fById.get(f.ref!)!.nom)) out.push({ a: f.id, b: v.id, car: true }); }); });
    return out;
  }, [shown, fById, vById]);

  const byId = (id: string) => items.find(i => i.id === id);
  const c = (id: string) => ({ x: (byId(id)?.x ?? 0) + PW / 2, y: (byId(id)?.y ?? 0) + 6 });

  function down(e: React.PointerEvent, it: Item) { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); const r = board.current!.getBoundingClientRect(); drag.current = { id: it.id, dx: e.clientX - r.left - it.x, dy: e.clientY - r.top - it.y, moved: false }; }
  function move(e: React.PointerEvent) { const d = drag.current; if (!d) return; const r = board.current!.getBoundingClientRect(); d.moved = true; const x = Math.max(0, Math.min(W - PW, e.clientX - r.left - d.dx)), y = Math.max(0, Math.min(H - PH, e.clientY - r.top - d.dy)); setItems(l => l.map(i => i.id === d.id ? { ...i, x, y } : i)); }
  function up(it: Item) { const d = drag.current; drag.current = null; if (!d) return; if (!d.moved) { if (it.kind === "fiche") onOpen(it.ref!); return; } const cur = byId(it.id); if (cur) persistPos(cur.id, cur.x, cur.y); }

  const imgOf = (e: React.DragEvent) => Array.from(e.dataTransfer.files || []).find(f => f.type.startsWith("image/"));
  async function dropBoard(e: React.DragEvent) {
    e.preventDefault(); setOver(null); const f = imgOf(e); if (!f || !supabase) return; const r = board.current!.getBoundingClientRect();
    const img = await fileToPhoto(f, false);
    const { data, error } = await supabase.from("obsidian_board").insert([{ kind: "note", img, x: Math.round(Math.max(0, Math.min(W - PW, e.clientX - r.left - PW / 2))), y: Math.round(Math.max(0, Math.min(H - PH, e.clientY - r.top - 40))), created_by: user || null }]).select().single();
    if (error) { setErr(error.message); return; } setItems(l => [...l, data as Item]);
  }
  async function dropPin(e: React.DragEvent, it: Item) {
    e.preventDefault(); e.stopPropagation(); setOver(null); const f = imgOf(e); if (!f) return;
    const url = await fileToPhoto(f, false);
    if (it.kind === "fiche") await onPhoto?.(it.ref!, url);
    else if (it.kind === "vehicule") { await supabase?.from("obsidian_garage").update({ photo_url: url }).eq("id", it.ref!); setVehicles(l => l.map(v => v.id === it.ref ? { ...v, photo_url: url } : v)); }
  }

  async function exportPdf() {
    const list = shown.map(i => { const f = i.kind === "fiche" ? fById.get(i.ref!) : null, v = i.kind === "vehicule" ? vById.get(i.ref!) : null;
      return { id: i.id, kind: i.kind, x: i.x, y: i.y, label: f ? f.nom : v ? v.modele : "Piece", sub: f ? (f.organisation || "") : v ? [v.plaque, v.assigne_a ? "-> " + v.assigne_a : ""].filter(Boolean).join(" ") : "", img: i.kind === "note" ? i.img : (f?.photo_url || v?.photo_url), prime: Number(f?.prime) || 0 }; });
    await pdfEnquete(list, links, user);
  }
  const candidates = fiches.filter(f => !onBoard("fiche", f.id) || true);
  function submitPick() { const f = fiches.find(x => x.nom.toLowerCase() === pick.trim().toLowerCase()); if (!f) { setErr("Personne introuvable : choisis dans la liste."); return; } setErr(""); addPerson(f.id); setPick(""); }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input list="board-people" value={pick} onChange={e => setPick(e.target.value)} onKeyDown={e => e.key === "Enter" && submitPick()} placeholder="🔎 Ajouter une personne (nom)…" style={{ flex: 1, minWidth: 220 }} />
        <datalist id="board-people">{candidates.map(f => <option key={f.id} value={f.nom}>{f.organisation || ""}</option>)}</datalist>
        <button className="btn btn-gold btn-sm" onClick={submitPick} disabled={!pick.trim()}>➕ Ajouter + ses liens</button>
        {items.length > 0 && <button className="btn btn-outline btn-sm" onClick={exportPdf}>📄 Export PDF</button>}
        {items.length > 0 && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={clearAll}>🧹 Vider</button>}
      </div>
      {err && <div style={{ color: "var(--danger)", fontSize: "0.78rem", marginBottom: 6 }}>{err}</div>}
      <div style={{ overflow: "auto", maxHeight: "68vh", borderRadius: 10 }}>
        <div className="board" ref={board} onDragOver={e => { e.preventDefault(); setOver("board"); }} onDragLeave={() => setOver(null)} onDrop={dropBoard} style={over === "board" ? { outline: "3px dashed #e8c870", outlineOffset: -10 } : undefined}>
          <svg width={W} height={H}>
            {links.map((l, i) => { const a = c(l.a), b = c(l.b); const sag = 28 + ((a.x + b.y) % 22); return <path key={i} d={`M${a.x},${a.y} Q${(a.x + b.x) / 2},${(a.y + b.y) / 2 + sag} ${b.x},${b.y}`} style={{ animationDelay: `${i * 0.05}s`, ...(l.car ? { stroke: "#e8b04a", strokeDasharray: "7 5", animation: "none" } : {}) }} />; })}
          </svg>
          {items.length === 0 && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#cdb98a", fontSize: "1rem", textAlign: "center", padding: 40, pointerEvents: "none" }}>Tableau vide — ajoute une personne ci-dessus : ses liens (organisation, relations, véhicules) arrivent avec elle.<br />Tu peux aussi déposer des images ici.</div>}
          {shown.map(it => {
            const rot = `rotate(${(it.id.charCodeAt(0) % 7) - 3}deg)`;
            if (it.kind === "note") return (
              <div key={it.id} className="pin" style={{ left: it.x, top: it.y, transform: rot }} onPointerDown={e => down(e, it)} onPointerMove={move} onPointerUp={() => up(it)}>
                <button className="pin-x" onPointerDown={e => e.stopPropagation()} onClick={() => remove(it.id)} title="Retirer">×</button>
                <img src={it.img || ""} alt="" draggable={false} /><small>PIÈCE</small>
              </div>);
            const f = it.kind === "fiche" ? fById.get(it.ref!) : null, v = it.kind === "vehicule" ? vById.get(it.ref!) : null;
            return (
              <div key={it.id} className={`pin${f && Number(f.prime) > 0 ? " hot" : ""}${f?.surveille ? " eye" : ""}`} style={{ left: it.x, top: it.y, transform: rot }}
                onPointerDown={e => down(e, it)} onPointerMove={move} onPointerUp={() => up(it)}
                onDragOver={e => { e.preventDefault(); e.stopPropagation(); }} onDrop={e => dropPin(e, it)}>
                <button className="pin-x" onPointerDown={e => e.stopPropagation()} onClick={() => remove(it.id)} title="Retirer du tableau">×</button>
                {(f?.photo_url || v?.photo_url) ? <img src={(f?.photo_url || v?.photo_url)!} alt="" draggable={false} referrerPolicy="no-referrer" /> : <div className="pin-no">{v ? "🚗" : "?"}</div>}
                <b>{f ? f.nom : v!.modele}</b><small>{f ? (f.organisation || "—") : `${v!.plaque || ""} · véhicule`}</small>
              </div>);
          })}
        </div>
      </div>
    </div>
  );
}
