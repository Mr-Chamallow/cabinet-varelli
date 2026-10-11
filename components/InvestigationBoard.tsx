"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fileToPhoto } from "@/components/PhotoPicker";
import { pdfEnquete } from "@/lib/pdfDocs";
import { dbw } from "@/lib/dbw";
import { GroupeLogo, TYPE_COLOR } from "@/components/GroupeLogo";

// Tableau d'enquete : plusieurs tableaux, liens nommes, zones de groupe, zoom / deplacement / mini-carte,
// chemin le plus court, filtres, annuler / retablir, chronologie, export PNG / PDF. Tout est sauvegarde en base et partage.
interface F { id: string; nom: string; organisation?: string | null; relations?: string | null; photo_url?: string | null; prime?: number | null; surveille?: boolean; statut?: string | null }
interface V { id: string; modele: string; plaque?: string; assigne_a?: string | null; photo_url?: string | null; owners?: string[]; bdd?: boolean }
type Kind = "fiche" | "vehicule" | "note" | "dossier" | "pacte";
interface Item { id: string; board_id: string | null; kind: Kind; ref: string | null; x: number; y: number; img?: string | null; created_at?: string }
interface MLink { id: string; board_id: string; a: string; b: string; type: string; label?: string | null }
interface Link { key: string; a: string; b: string; color: string; dash?: string; label?: string; mid?: string; car?: boolean }

const W = 2400, H = 1500, PW = 124, PH = 150;
const norm = (s?: string | null) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const LINK_TYPES = [
  { k: "membre", label: "Membre de", color: "#c4262e" }, { k: "famille", label: "Famille", color: "#e8c870" }, { k: "contact", label: "Contact / ami", color: "#64b5f6" },
  { k: "vu", label: "A vu / suivi", color: "#a78bfa" }, { k: "vente", label: "A vendu à", color: "#22c55e" }, { k: "ennemi", label: "Ennemi", color: "#ff7a1a" },
  { k: "complice", label: "Complice", color: "#ec4899" }, { k: "proprio", label: "Propriétaire", color: "#e8b04a" },
];
const typeOf = (k: string) => LINK_TYPES.find(t => t.k === k) || LINK_TYPES[2];
type Act = { undo: () => Promise<void>; redo: () => Promise<void> };

export function InvestigationBoard({ fiches, onOpen, onPhoto, user }: { fiches: F[]; onOpen: (id: string) => void; onPhoto?: (id: string, dataUrl: string) => void | Promise<void>; user?: string }) {
  const [boards, setBoards] = useState<{ id: string; nom: string }[]>([]);
  const [boardId, setBoardId] = useState<string | null>(null);
  const [all, setAll] = useState<Item[]>([]);
  const [mlinksAll, setMlinksAll] = useState<MLink[]>([]);
  const [vehicles, setVehicles] = useState<V[]>([]);
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [pactes, setPactes] = useState<any[]>([]);
  const [groupes, setGroupes] = useState<{ id: string; nom: string; type: string }[]>([]);
  const [pick, setPick] = useState(""); const [pickG, setPickG] = useState("");
  const [err, setErr] = useState("");
  const [over, setOver] = useState(false);
  const [z, setZ] = useState(0.6); const [pan, setPan] = useState({ x: 10, y: 10 });
  const [sel, setSel] = useState<Set<string>>(new Set()); const [selLink, setSelLink] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState(false); const [linkFrom, setLinkFrom] = useState<string | null>(null); const [draft, setDraft] = useState<{ a: string; b: string; type: string; label: string } | null>(null);
  const [pathMode, setPathMode] = useState(false); const [pathA, setPathA] = useState<string | null>(null); const [pathB, setPathB] = useState<string | null>(null);
  const [fGroupe, setFGroupe] = useState(""); const [fFlag, setFFlag] = useState("tout"); const [fPeriode, setFPeriode] = useState("tout");
  const [timeline, setTimeline] = useState<{ at: string; txt: string; icon: string }[] | null>(null);
  const [, bump] = useState(0);
  const vp = useRef<HTMLDivElement>(null);
  const hist = useRef<{ past: Act[]; future: Act[] }>({ past: [], future: [] });
  const idMap = useRef(new Map<string, string>()); const lidMap = useRef(new Map<string, string>());
  const R = (id: string) => idMap.current.get(id) || id; const LR = (id: string) => lidMap.current.get(id) || id;
  const dragRef = useRef<{ ids: string[]; start: Record<string, { x: number; y: number }>; px: number; py: number; moved: boolean } | null>(null);
  const panRef = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const allRef = useRef<Item[]>([]); allRef.current = all;
  const view = useRef({ z, pan }); view.current = { z, pan };

  const items = useMemo(() => all.filter(i => i.board_id === boardId), [all, boardId]);
  const mlinks = useMemo(() => mlinksAll.filter(l => l.board_id === boardId), [mlinksAll, boardId]);

  // ---------- chargement ----------
  const load = useCallback(async () => {
    if (!supabase) return;
    const [bd, b, ml, v, bv, bp, td, gp, gg] = await Promise.all([
      supabase.from("obsidian_boards").select("*").order("created_at"),
      supabase.from("obsidian_board").select("*").order("created_at"),
      supabase.from("obsidian_board_links").select("*"),
      supabase.from("obsidian_garage").select("id,modele,plaque,assigne_a,photo_url"),
      supabase.from("bdd_vehicules").select("id,plaque,marque_modele,photos,proprietaire_id"),
      supabase.from("bdd_personnes").select("id,nom,prenom"),
      supabase.from("tribunal_dossiers").select("id,titre,accuse,organisation,statut"),
      supabase.from("gm_pactes").select("id,organisation,statut"),
      supabase.from("carte_gangs").select("id,nom,type").order("nom"),
    ]);
    if (bd.error) { setErr("Tables du tableau absentes : lance migration-lot44.sql dans Supabase."); return; }
    let list = (bd.data || []) as { id: string; nom: string }[];
    let its = (b.data || []) as Item[];
    if (!list.length) { const r = await dbw.insert("obsidian_boards", { nom: "Tableau principal", created_by: user || null }); if (r.data) list = [r.data]; }
    const first = list[0]?.id || null;
    const legacy = its.filter(i => !i.board_id);
    if (legacy.length && first) { its = its.map(i => (i.board_id ? i : { ...i, board_id: first })); Promise.all(legacy.map(i => dbw.update("obsidian_board", i.id, { board_id: first }))); }
    setBoards(list); setBoardId(cur => (cur && list.some(x => x.id === cur) ? cur : first)); setAll(its); setMlinksAll((ml.data || []) as MLink[]);
    const pById = new Map((bp.data || []).map((p: any) => [p.id, p]));
    const dbVeh: V[] = (bv.data || []).map((x: any) => {
      const o: any = pById.get(x.proprietaire_id); const a = o ? [o.prenom, o.nom].filter(Boolean).join(" ") : ""; const b2 = o ? [o.nom, o.prenom].filter(Boolean).join(" ") : "";
      return { id: x.id, modele: x.marque_modele || "Véhicule", plaque: x.plaque, assigne_a: a || null, owners: o ? [norm(a), norm(b2)] : [], photo_url: Array.isArray(x.photos) ? x.photos[0] || null : null, bdd: true };
    });
    setVehicles([...((v.data || []) as V[]), ...dbVeh]); setDossiers(td.data || []); setPactes(gp.data || []); setGroupes((gg.data || []) as any);
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const fById = useMemo(() => new Map(fiches.map(f => [f.id, f])), [fiches]);
  const vById = useMemo(() => new Map(vehicles.map(v => [v.id, v])), [vehicles]);
  const dById = useMemo(() => new Map(dossiers.map(d => [d.id, d])), [dossiers]);
  const pcById = useMemo(() => new Map(pactes.map(d => [d.id, d])), [pactes]);
  const shown = items.filter(i => i.kind === "note" || (i.kind === "fiche" ? fById.has(i.ref!) : i.kind === "vehicule" ? vById.has(i.ref!) : i.kind === "dossier" ? dById.has(i.ref!) : pcById.has(i.ref!)));
  const byId = (id: string) => allRef.current.find(i => i.id === id);
  const onBoard = (kind: string, ref: string) => items.some(i => i.kind === kind && i.ref === ref);
  const typeOfGroup = (nom?: string | null) => groupes.find(g => norm(g.nom) === norm(nom))?.type || "pf";

  // ---------- historique (annuler / retablir) ----------
  const push = (a: Act) => { hist.current.past.push(a); if (hist.current.past.length > 60) hist.current.past.shift(); hist.current.future = []; bump(n => n + 1); };
  async function undo() { const a = hist.current.past.pop(); if (!a) return; await a.undo(); hist.current.future.push(a); bump(n => n + 1); }
  async function redo() { const a = hist.current.future.pop(); if (!a) return; await a.redo(); hist.current.past.push(a); bump(n => n + 1); }

  // ---------- operations de base (avec persistance) ----------
  async function insertItems(rows: any[]): Promise<Item[]> {
    const { data, error } = await dbw.insertMany("obsidian_board", rows);
    if (error) { setErr(error.message); return []; }
    const got = (data || []) as Item[]; setAll(l => [...l, ...got]); return got;
  }
  async function deleteItems(ids: string[]) {
    setAll(l => l.filter(i => !ids.includes(i.id))); setMlinksAll(l => l.filter(k => !ids.includes(k.a) && !ids.includes(k.b)));
    setSel(s => { const n = new Set(s); ids.forEach(i => n.delete(i)); return n; });
    await Promise.all(ids.map(id => dbw.remove("obsidian_board", id)));
  }
  async function insertLink(row: any): Promise<MLink | null> {
    const { data, error } = await dbw.insert("obsidian_board_links", row);
    if (error || !data) { setErr(error?.message || "Erreur"); return null; }
    setMlinksAll(l => [...l, data as MLink]); return data as MLink;
  }
  async function deleteLink(id: string) { setMlinksAll(l => l.filter(k => k.id !== id)); setSelLink(s => (s === id ? null : s)); await dbw.remove("obsidian_board_links", id); }
  const setPos = (id: string, x: number, y: number) => { setAll(l => l.map(i => (i.id === id ? { ...i, x, y } : i))); dbw.update("obsidian_board", id, { x: Math.round(x), y: Math.round(y) }); };

  // action "ajout d'elements" annulable
  async function addAct(rows: any[]) {
    const created = await insertItems(rows); if (!created.length) return;
    const olds = created.map(c => c.id);
    push({
      undo: async () => { await deleteItems(olds.map(R)); },
      redo: async () => { const re = await insertItems(rows.map((r, i) => ({ ...r, x: byId(R(olds[i]))?.x ?? r.x }))); re.forEach((n, i) => idMap.current.set(olds[i], n.id)); },
    });
  }
  async function removeAct(ids: string[]) {
    const snap = ids.map(id => byId(id)).filter(Boolean) as Item[];
    const linkSnap = mlinksAll.filter(k => ids.includes(k.a) || ids.includes(k.b));
    if (!snap.length) return;
    await deleteItems(ids);
    push({
      undo: async () => {
        const re = await insertItems(snap.map(s => ({ board_id: s.board_id, kind: s.kind, ref: s.ref, x: Math.round(s.x), y: Math.round(s.y), img: s.img || null, created_by: user || null })));
        re.forEach((n, i) => idMap.current.set(snap[i].id, n.id));
        for (const k of linkSnap) { const n = await insertLink({ board_id: k.board_id, a: R(k.a), b: R(k.b), type: k.type, label: k.label || null, created_by: user || null }); if (n) lidMap.current.set(k.id, n.id); }
      },
      redo: async () => { await deleteItems(snap.map(s => R(s.id))); },
    });
  }
  async function createLink(a: string, b: string, type: string, label: string) {
    const n = await insertLink({ board_id: boardId, a, b, type, label: label.trim() || null, created_by: user || null }); if (!n) return;
    const orig = n.id;
    push({
      undo: async () => { await deleteLink(LR(orig)); },
      redo: async () => { const m = await insertLink({ board_id: boardId, a: R(a), b: R(b), type, label: label.trim() || null, created_by: user || null }); if (m) lidMap.current.set(orig, m.id); },
    });
  }
  async function removeLinkAct(l: MLink) {
    await deleteLink(l.id);
    push({
      undo: async () => { const m = await insertLink({ board_id: l.board_id, a: R(l.a), b: R(l.b), type: l.type, label: l.label || null, created_by: user || null }); if (m) lidMap.current.set(l.id, m.id); },
      redo: async () => { await deleteLink(LR(l.id)); },
    });
  }

  // ---------- placement ----------
  function freeSpot(w: number, h: number) {
    const hit = (x: number, y: number) => items.some(i => x < i.x + PW + 20 && x + w + 20 > i.x && y < i.y + PH + 20 && y + h + 20 > i.y);
    for (let t = 0; t < 120; t++) { const x = 40 + Math.random() * Math.max(1, W - w - 80), y = 40 + Math.random() * Math.max(1, H - h - 80); if (!hit(x, y)) return { x, y }; }
    const maxY = items.reduce((m, i) => Math.max(m, i.y + PH), 0); return { x: 40, y: clamp(maxY + 60, 40, Math.max(40, H - h - 40)) };
  }
  const rowOf = (kind: Kind, ref: string, x: number, y: number) => ({ board_id: boardId, kind, ref, x: Math.round(clamp(x, 10, W - PW - 10)), y: Math.round(clamp(y, 10, H - PH - 10)), created_by: user || null });

  // ---------- relations d'une personne ----------
  const dossiersOf = (p: F) => dossiers.filter(d => norm(d.accuse) && (norm(d.accuse) === norm(p.nom) || norm(p.nom).includes(norm(d.accuse)) || norm(d.accuse).includes(norm(p.nom))) && norm(d.accuse).length >= 5);
  const pactesOf = (p: F) => (p.organisation ? pactes.filter(x => norm(x.organisation) === norm(p.organisation) && x.statut !== "rompu" && x.statut !== "expire") : []);
  const relatedOf = (p: F) => {
    const cites = (x: F, y: F) => y.nom.length >= 3 && (x.relations || "").toLowerCase().includes(y.nom.toLowerCase());
    const people = fiches.filter(o => o.id !== p.id && ((p.organisation && norm(p.organisation) === norm(o.organisation)) || cites(p, o) || cites(o, p)));
    const cars = vehicles.filter(v => (v.owners?.length ? v.owners.includes(norm(p.nom)) : norm(v.assigne_a) && norm(v.assigne_a) === norm(p.nom)));
    return { people, cars, dos: dossiersOf(p), pacs: pactesOf(p) };
  };
  async function addPerson(id: string) {
    const p = fById.get(id); if (!p) return;
    const { people, cars, dos, pacs } = relatedOf(p);
    const todo: { kind: Kind; ref: string }[] = [];
    if (!onBoard("fiche", p.id)) todo.push({ kind: "fiche", ref: p.id });
    people.forEach(o => { if (!onBoard("fiche", o.id)) todo.push({ kind: "fiche", ref: o.id }); });
    cars.forEach(v => { if (!onBoard("vehicule", v.id)) todo.push({ kind: "vehicule", ref: v.id }); });
    dos.forEach(d => { if (!onBoard("dossier", d.id)) todo.push({ kind: "dossier", ref: d.id }); });
    pacs.forEach(d => { if (!onBoard("pacte", d.id)) todo.push({ kind: "pacte", ref: d.id }); });
    if (!todo.length) { fitTo([...items.filter(i => i.kind === "fiche" && i.ref === p.id)]); return; }
    const c = freeSpot(520, 420);
    const rows = todo.map((t, i) => { const main = t.kind === "fiche" && t.ref === p.id; const a = (i / Math.max(1, todo.length)) * 6.283, r = 230; return rowOf(t.kind, t.ref, main ? c.x + 200 : c.x + 200 + Math.cos(a) * r, main ? c.y + 150 : c.y + 150 + Math.sin(a) * r * 0.75); });
    await addAct(rows);
  }
  async function addGroup(nom: string) {
    const list = fiches.filter(f => norm(f.organisation) === norm(nom) && !onBoard("fiche", f.id));
    if (!list.length) { setErr(`Aucune fiche à ajouter pour « ${nom} » (déjà sur le tableau, ou aucune fiche ne porte ce groupe).`); return; }
    const cols = Math.min(6, Math.ceil(Math.sqrt(list.length))), rowsN = Math.ceil(list.length / cols); const gx = PW + 40, gy = PH + 50;
    const c = freeSpot(cols * gx, rowsN * gy);
    const cars: V[] = []; list.forEach(f => relatedOf(f).cars.forEach(v => { if (!onBoard("vehicule", v.id) && !cars.some(x => x.id === v.id)) cars.push(v); }));
    const rows: any[] = list.map((f, i) => rowOf("fiche", f.id, c.x + (i % cols) * gx, c.y + Math.floor(i / cols) * gy));
    cars.forEach((v, i) => rows.push(rowOf("vehicule", v.id, c.x + ((list.length + i) % cols) * gx, c.y + Math.floor((list.length + i) / cols) * gy)));
    await addAct(rows); setErr("");
  }

  // ---------- liens (auto + manuels) ----------
  const links = useMemo<Link[]>(() => {
    const out: Link[] = [];
    const fi = shown.filter(i => i.kind === "fiche"), vi = shown.filter(i => i.kind === "vehicule"), di = shown.filter(i => i.kind === "dossier"), pi = shown.filter(i => i.kind === "pacte");
    const cites = (x: F, y: F) => y.nom.length >= 3 && (x.relations || "").toLowerCase().includes(y.nom.toLowerCase());
    for (let i = 0; i < fi.length; i++) for (let j = i + 1; j < fi.length; j++) {
      const a = fById.get(fi[i].ref!)!, b = fById.get(fi[j].ref!)!;
      if ((a.organisation && norm(a.organisation) === norm(b.organisation)) || cites(a, b) || cites(b, a)) out.push({ key: `a${fi[i].id}${fi[j].id}`, a: fi[i].id, b: fi[j].id, color: "#c4262e" });
    }
    vi.forEach(v => { const car = vById.get(v.ref!)!; fi.forEach(f => { const fn = norm(fById.get(f.ref!)!.nom); if (car.owners?.length ? car.owners.includes(fn) : (norm(car.assigne_a) && norm(car.assigne_a) === fn)) out.push({ key: `v${v.id}${f.id}`, a: f.id, b: v.id, color: "#e8b04a", dash: "7 5", car: true }); }); });
    di.forEach(d => { const dd = dById.get(d.ref!)!; fi.forEach(f => { const p = fById.get(f.ref!)!; if (dossiersOf(p).some(x => x.id === dd.id)) out.push({ key: `d${d.id}${f.id}`, a: f.id, b: d.id, color: "#64b5f6", dash: "3 4" }); }); });
    pi.forEach(pc => { const pp = pcById.get(pc.ref!)!; fi.forEach(f => { const p = fById.get(f.ref!)!; if (norm(p.organisation) === norm(pp.organisation)) out.push({ key: `p${pc.id}${f.id}`, a: f.id, b: pc.id, color: "#e8c870", dash: "3 4" }); }); });
    const ids = new Set(shown.map(i => i.id));
    mlinks.filter(m => ids.has(m.a) && ids.has(m.b)).forEach(m => { const t = typeOf(m.type); out.push({ key: `m${m.id}`, a: m.a, b: m.b, color: t.color, label: m.label || t.label, mid: m.id }); });
    return out;
  }, [shown, mlinks, fById, vById, dById, pcById, dossiers, pactes]);

  // ---------- chemin le plus court ----------
  const path = useMemo(() => {
    if (!pathA || !pathB) return null;
    const adj = new Map<string, { to: string; key: string }[]>();
    links.forEach(l => { (adj.get(l.a) || adj.set(l.a, []).get(l.a)!).push({ to: l.b, key: l.key }); (adj.get(l.b) || adj.set(l.b, []).get(l.b)!).push({ to: l.a, key: l.key }); });
    const prev = new Map<string, { from: string; key: string }>(); const q = [pathA]; const seen = new Set([pathA]);
    while (q.length) { const cur = q.shift()!; if (cur === pathB) break; for (const e of adj.get(cur) || []) if (!seen.has(e.to)) { seen.add(e.to); prev.set(e.to, { from: cur, key: e.key }); q.push(e.to); } }
    if (!seen.has(pathB)) return { nodes: [] as string[], keys: new Set<string>() };
    const nodes = [pathB]; const keys = new Set<string>(); let c = pathB; while (c !== pathA) { const p = prev.get(c)!; keys.add(p.key); c = p.from; nodes.unshift(c); }
    return { nodes, keys };
  }, [pathA, pathB, links]);
  const labelOf = (id: string) => { const it = byId(id); if (!it) return "?"; if (it.kind === "fiche") return fById.get(it.ref!)?.nom || "?"; if (it.kind === "vehicule") return vById.get(it.ref!)?.modele || "Véhicule"; if (it.kind === "dossier") return dById.get(it.ref!)?.titre || "Dossier"; if (it.kind === "pacte") return `Pacte ${pcById.get(it.ref!)?.organisation || ""}`; return "Pièce"; };

  // ---------- filtres ----------
  const filtering = !!fGroupe || fFlag !== "tout" || fPeriode !== "tout";
  const keepFiche = (it: Item) => {
    const f = fById.get(it.ref!); if (!f) return false;
    if (fGroupe && norm(f.organisation) !== norm(fGroupe)) return false;
    if (fFlag === "recherche" && !(Number(f.prime) > 0 || f.statut === "Recherché")) return false;
    if (fFlag === "surveille" && !f.surveille) return false;
    if (fPeriode !== "tout" && it.created_at && Date.now() - new Date(it.created_at).getTime() > Number(fPeriode) * 86400000) return false;
    return true;
  };
  const keepSet = useMemo(() => {
    if (!filtering) return null; const s = new Set<string>();
    shown.filter(i => i.kind === "fiche" && keepFiche(i)).forEach(i => s.add(i.id));
    links.forEach(l => { if (s.has(l.a) && !shown.find(i => i.id === l.b && i.kind === "fiche")) s.add(l.b); if (s.has(l.b) && !shown.find(i => i.id === l.a && i.kind === "fiche")) s.add(l.a); });
    return s;
  }, [filtering, shown, links, fGroupe, fFlag, fPeriode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- zones de groupe ----------
  const zones = useMemo(() => {
    const m = new Map<string, Item[]>();
    shown.filter(i => i.kind === "fiche").forEach(i => { const o = fById.get(i.ref!)?.organisation; if (o && norm(o)) { const k = norm(o); (m.get(k) || m.set(k, []).get(k)!).push(i); } });
    return [...m.entries()].filter(([, l]) => l.length >= 2).map(([k, l]) => {
      const nom = fById.get(l[0].ref!)!.organisation!; const x0 = Math.min(...l.map(i => i.x)) - 28, y0 = Math.min(...l.map(i => i.y)) - 46, x1 = Math.max(...l.map(i => i.x)) + PW + 28, y1 = Math.max(...l.map(i => i.y)) + PH + 24;
      return { k, nom, x: x0, y: y0, w: x1 - x0, h: y1 - y0, type: typeOfGroup(nom) };
    });
  }, [shown, fById, groupes]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- vue : zoom / deplacement ----------
  const vpSize = () => { const r = vp.current?.getBoundingClientRect(); return { w: r?.width || 900, h: r?.height || 500 }; };
  function fitTo(list: Item[]) {
    const l = list.length ? list : shown; const { w, h } = vpSize();
    if (!l.length) { setZ(Math.min(1, w / W + 0.1)); setPan({ x: 10, y: 10 }); return; }
    const x0 = Math.min(...l.map(i => i.x)) - 40, y0 = Math.min(...l.map(i => i.y)) - 60, x1 = Math.max(...l.map(i => i.x)) + PW + 40, y1 = Math.max(...l.map(i => i.y)) + PH + 40;
    const nz = clamp(Math.min(w / (x1 - x0), h / (y1 - y0), 1), 0.2, 1.6); setZ(nz); setPan({ x: (w - (x1 - x0) * nz) / 2 - x0 * nz, y: (h - (y1 - y0) * nz) / 2 - y0 * nz });
  }
  function zoomBy(f: number, cx?: number, cy?: number) {
    const { z: oz, pan: op } = view.current; const nz = clamp(oz * f, 0.2, 1.6); const { w, h } = vpSize(); const px = cx ?? w / 2, py = cy ?? h / 2;
    setZ(nz); setPan({ x: px - (px - op.x) * (nz / oz), y: py - (py - op.y) * (nz / oz) });
  }
  useEffect(() => {
    const el = vp.current; if (!el) return;
    const fn = (e: WheelEvent) => { e.preventDefault(); const r = el.getBoundingClientRect(); zoomBy(e.deltaY < 0 ? 1.12 : 0.89, e.clientX - r.left, e.clientY - r.top); };
    el.addEventListener("wheel", fn, { passive: false }); return () => el.removeEventListener("wheel", fn);
  }, [boardId]);
  useEffect(() => { if (boardId) setTimeout(() => fitTo(allRef.current.filter(i => i.board_id === boardId)), 60); }, [boardId, boards.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const bp = (e: { clientX: number; clientY: number }) => { const r = vp.current!.getBoundingClientRect(); return { x: (e.clientX - r.left - view.current.pan.x) / view.current.z, y: (e.clientY - r.top - view.current.pan.y) / view.current.z }; };

  // ---------- souris ----------
  function bgDown(e: React.PointerEvent) { if (e.button !== 0) return; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); panRef.current = { sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y, moved: false }; }
  function bgMove(e: React.PointerEvent) {
    const p = panRef.current; if (p) { const dx = e.clientX - p.sx, dy = e.clientY - p.sy; if (Math.abs(dx) + Math.abs(dy) > 3) p.moved = true; if (p.moved) setPan({ x: p.ox + dx, y: p.oy + dy }); return; }
    const d = dragRef.current; if (!d) return; const q = bp(e); const dx = q.x - d.px, dy = q.y - d.py;
    if (!d.moved && Math.hypot(dx, dy) * view.current.z < 4) return; d.moved = true;
    setAll(l => l.map(i => (d.start[i.id] ? { ...i, x: clamp(d.start[i.id].x + dx, 0, W - PW), y: clamp(d.start[i.id].y + dy, 0, H - PH) } : i)));
  }
  function bgUp() {
    const p = panRef.current; panRef.current = null;
    if (p && !p.moved) { setSel(new Set()); setSelLink(null); if (linkMode) setLinkFrom(null); return; }
    const d = dragRef.current; dragRef.current = null; if (!d || !d.moved) return;
    const moves = d.ids.map(id => { const c = byId(id)!; return { id, from: d.start[id], to: { x: Math.round(c.x), y: Math.round(c.y) } }; });
    moves.forEach(m => dbw.update("obsidian_board", m.id, { x: m.to.x, y: m.to.y }));
    push({ undo: async () => { moves.forEach(m => setPos(R(m.id), m.from.x, m.from.y)); }, redo: async () => { moves.forEach(m => setPos(R(m.id), m.to.x, m.to.y)); } });
  }
  function pinDown(e: React.PointerEvent, it: Item) {
    e.stopPropagation(); if (e.button !== 0) return; (vp.current as HTMLElement).setPointerCapture(e.pointerId);
    const q = bp(e); const ids = sel.has(it.id) && sel.size > 1 ? [...sel] : [it.id];
    dragRef.current = { ids, start: Object.fromEntries(ids.map(id => [id, { x: byId(id)!.x, y: byId(id)!.y }])), px: q.x, py: q.y, moved: false };
    panRef.current = null; clickRef.current = { it, shift: e.shiftKey || e.ctrlKey || e.metaKey };
  }
  const clickRef = useRef<{ it: Item; shift: boolean } | null>(null);
  function pinUp(e: React.PointerEvent) {
    const d = dragRef.current; const c = clickRef.current; clickRef.current = null;
    if (!d || !c) return; if (d.moved) { bgUp(); return; } dragRef.current = null; clickPin(c.it, c.shift);
  }
  function clickPin(it: Item, shift: boolean) {
    if (linkMode) { if (!linkFrom) setLinkFrom(it.id); else if (linkFrom !== it.id) { setDraft({ a: linkFrom, b: it.id, type: "contact", label: "" }); setLinkFrom(null); } return; }
    if (pathMode) { if (!pathA || pathB) { setPathA(it.id); setPathB(null); } else if (it.id !== pathA) setPathB(it.id); return; }
    setSelLink(null); setSel(s => { if (shift) { const n = new Set(s); n.has(it.id) ? n.delete(it.id) : n.add(it.id); return n; } return new Set([it.id]); });
  }

  // ---------- images deposees ----------
  const imgOf = (e: React.DragEvent) => Array.from(e.dataTransfer.files || []).find(f => f.type.startsWith("image/"));
  async function dropBoard(e: React.DragEvent) {
    e.preventDefault(); setOver(false); const f = imgOf(e); if (!f) return; const q = bp(e); const img = await fileToPhoto(f, false);
    const got = await insertItems([{ board_id: boardId, kind: "note", img, x: Math.round(clamp(q.x - PW / 2, 0, W - PW)), y: Math.round(clamp(q.y - 40, 0, H - PH)), created_by: user || null }]);
    if (got.length) { const o = got[0].id; push({ undo: async () => { await deleteItems([R(o)]); }, redo: async () => { const re = await insertItems([{ board_id: boardId, kind: "note", img, x: Math.round(got[0].x), y: Math.round(got[0].y), created_by: user || null }]); if (re[0]) idMap.current.set(o, re[0].id); } }); }
  }
  async function dropPin(e: React.DragEvent, it: Item) {
    e.preventDefault(); e.stopPropagation(); setOver(false); const f = imgOf(e); if (!f) return; const url = await fileToPhoto(f, false);
    if (it.kind === "fiche") await onPhoto?.(it.ref!, url);
    else if (it.kind === "vehicule") { const cv = vById.get(it.ref!); if (cv?.bdd) await dbw.update("bdd_vehicules", it.ref!, { photos: [url] }); else await dbw.update("obsidian_garage", it.ref!, { photo_url: url }); setVehicles(l => l.map(v => (v.id === it.ref ? { ...v, photo_url: url } : v))); }
  }

  // ---------- tableaux ----------
  async function newBoard() { const nom = window.prompt("Nom du nouveau tableau (ex : Affaire du convoi)"); if (!nom?.trim()) return; const r = await dbw.insert("obsidian_boards", { nom: nom.trim(), created_by: user || null }); if (r.data) { setBoards(l => [...l, r.data]); setBoardId(r.data.id); } else if (r.error) setErr(r.error.message); }
  async function renameBoard() { const cur = boards.find(b => b.id === boardId); const nom = window.prompt("Nouveau nom du tableau", cur?.nom || ""); if (!nom?.trim() || !boardId) return; await dbw.update("obsidian_boards", boardId, { nom: nom.trim() }); setBoards(l => l.map(b => (b.id === boardId ? { ...b, nom: nom.trim() } : b))); }
  async function deleteBoard() {
    if (boards.length < 2) { setErr("Il faut garder au moins un tableau."); return; }
    if (!window.confirm("Supprimer ce tableau et tout son contenu ? (les fiches ne sont pas supprimées)")) return;
    const id = boardId!; await dbw.remove("obsidian_boards", id); const rest = boards.filter(b => b.id !== id); setBoards(rest); setAll(l => l.filter(i => i.board_id !== id)); setBoardId(rest[0].id); hist.current = { past: [], future: [] };
  }
  async function clearAll() { if (!window.confirm("Vider ce tableau ? (les fiches ne sont pas supprimées)")) return; await removeAct(items.map(i => i.id)); }

  // ---------- clavier ----------
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement; if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
      else if ((e.key === "Delete" || e.key === "Backspace") && sel.size) { e.preventDefault(); removeAct([...sel]); }
      else if (e.key === "Escape") { setLinkMode(false); setLinkFrom(null); setPathMode(false); setPathA(null); setPathB(null); setDraft(null); }
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- chronologie ----------
  async function openTimeline() {
    if (!supabase) return; const fl = (sel.size ? shown.filter(i => sel.has(i.id)) : shown).filter(i => i.kind === "fiche").map(i => fById.get(i.ref!)!).filter(Boolean);
    const ids = fl.map(f => f.id), orgs = [...new Set(fl.map(f => f.organisation).filter(Boolean) as string[])], noms = fl.map(f => f.nom);
    const [j, ev] = await Promise.all([ids.length ? supabase.from("obsidian_journal").select("fiche_nom,action,created_at,par").in("fiche_id", ids).order("created_at", { ascending: false }).limit(40) : Promise.resolve({ data: [] as any[] }), orgs.length ? supabase.from("gm_evenements").select("titre,type,statut,partenaire,date_event").in("partenaire", orgs).limit(30) : Promise.resolve({ data: [] as any[] })]);
    const out: { at: string; txt: string; icon: string }[] = [];
    (j.data || []).forEach((x: any) => out.push({ at: x.created_at, icon: "🗂️", txt: `${x.fiche_nom} : ${x.action}${x.par ? ` (${x.par})` : ""}` }));
    (ev.data || []).forEach((x: any) => x.date_event && out.push({ at: x.date_event, icon: "🚚", txt: `${x.titre} (${x.partenaire}) · ${x.statut}` }));
    dossiers.filter(d => noms.some(n => dossiersOf({ id: "", nom: n } as F).some(x => x.id === d.id))).forEach(d => out.push({ at: d.date_audience || d.created_at || new Date().toISOString(), icon: "⚖️", txt: `Tribunal : ${d.titre} (${d.statut})` }));
    setTimeline(out.filter(x => x.at).sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 50));
  }

  // ---------- exports ----------
  async function exportPdf() {
    const list = shown.map(i => { const f = i.kind === "fiche" ? fById.get(i.ref!) : null, v = i.kind === "vehicule" ? vById.get(i.ref!) : null;
      return { id: i.id, kind: (i.kind === "fiche" || i.kind === "vehicule" ? i.kind : "note") as any, x: i.x, y: i.y, label: labelOf(i.id), sub: f ? (f.organisation || "") : v ? [v.plaque, v.assigne_a ? "-> " + v.assigne_a : ""].filter(Boolean).join(" ") : i.kind === "dossier" ? "Dossier tribunal" : i.kind === "pacte" ? "Pacte" : "", img: i.kind === "note" ? i.img : (f?.photo_url || v?.photo_url), prime: Number(f?.prime) || 0 }; });
    await pdfEnquete(list as any, links.map(l => ({ a: l.a, b: l.b, car: l.car })), user);
  }
  async function exportPng() {
    const s = 0.7; const cv = document.createElement("canvas"); cv.width = W * s; cv.height = H * s; const g = cv.getContext("2d")!; g.scale(s, s);
    g.fillStyle = "#a87b4f"; g.fillRect(0, 0, W, H);
    zones.forEach(zn => { g.fillStyle = (TYPE_COLOR[zn.type] || "#999") + "33"; g.strokeStyle = TYPE_COLOR[zn.type] || "#999"; g.lineWidth = 2; g.setLineDash([10, 6]); g.beginPath(); g.roundRect(zn.x, zn.y, zn.w, zn.h, 18); g.fill(); g.stroke(); g.setLineDash([]); g.fillStyle = "#2b1d0e"; g.font = "bold 18px sans-serif"; g.fillText(zn.nom, zn.x + 14, zn.y + 26); });
    const c = (id: string) => { const i = byId(id)!; return { x: i.x + PW / 2, y: i.y + 6 }; };
    links.forEach(l => { const a = c(l.a), b = c(l.b); g.strokeStyle = l.color; g.lineWidth = 3; g.setLineDash(l.dash ? [8, 6] : []); g.beginPath(); g.moveTo(a.x, a.y); g.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 + 30, b.x, b.y); g.stroke(); g.setLineDash([]); if (l.label) { g.fillStyle = "#2b1d0e"; g.font = "bold 14px sans-serif"; g.fillText(l.label, (a.x + b.x) / 2 - 20, (a.y + b.y) / 2 + 22); } });
    const load = (u: string) => new Promise<HTMLImageElement | null>(res => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => res(im); im.onerror = () => res(null); im.src = u; });
    for (const it of shown) {
      const f = it.kind === "fiche" ? fById.get(it.ref!) : null, v = it.kind === "vehicule" ? vById.get(it.ref!) : null; const u = it.kind === "note" ? it.img : (f?.photo_url || v?.photo_url);
      g.fillStyle = "#f6efd9"; g.shadowColor = "rgba(0,0,0,.5)"; g.shadowBlur = 10; g.fillRect(it.x, it.y, PW, PH); g.shadowBlur = 0;
      g.fillStyle = "#d9cfb0"; g.fillRect(it.x + 6, it.y + 6, PW - 12, 108); const im = u ? await load(u) : null;
      if (im) g.drawImage(im, it.x + 6, it.y + 6, PW - 12, 108); else { g.fillStyle = "#8a7a55"; g.font = "36px sans-serif"; g.fillText(it.kind === "vehicule" ? "🚗" : it.kind === "dossier" ? "⚖️" : it.kind === "pacte" ? "🤝" : "?", it.x + PW / 2 - 16, it.y + 70); }
      g.fillStyle = "#2b1d0e"; g.font = "bold 11px monospace"; g.fillText(labelOf(it.id).toUpperCase().slice(0, 18), it.x + 8, it.y + 130); g.fillStyle = "#a31818"; g.beginPath(); g.arc(it.x + PW / 2, it.y + 6, 6, 0, 6.3); g.fill();
    }
    const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = `tableau-enquete-${new Date().toISOString().slice(0, 10)}.png`; a.click();
  }

  // ---------- rendu ----------
  const cpt = (id: string) => { const i = byId(id); return { x: (i?.x ?? 0) + PW / 2, y: (i?.y ?? 0) + 6 }; };
  const selItems = shown.filter(i => sel.has(i.id)); const one = selItems.length === 1 ? selItems[0] : null; const oneF = one?.kind === "fiche" ? fById.get(one.ref!) : null;
  const selLinkObj = selLink ? mlinks.find(m => m.id === selLink) : null;
  const submitPick = () => { const f = fiches.find(x => norm(x.nom) === norm(pick)); if (!f) { setErr("Personne introuvable : choisis dans la liste."); return; } setErr(""); addPerson(f.id); setPick(""); };
  const submitGroup = () => { const g = groupes.find(x => norm(x.nom) === norm(pickG)); if (!g) { setErr("Groupe introuvable : choisis dans la liste."); return; } addGroup(g.nom); setPickG(""); };
  const mm = 170 / W; const { w: vw, h: vh } = vpSize();
  const orgs = useMemo(() => [...new Set(fiches.map(f => f.organisation).filter(Boolean) as string[])].sort(), [fiches]);
  const tb = (on: boolean) => (on ? "btn btn-gold btn-sm" : "btn btn-outline btn-sm");

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap", alignItems: "center" }}>
        <select value={boardId || ""} onChange={e => { setBoardId(e.target.value); setSel(new Set()); hist.current = { past: [], future: [] }; }} style={{ maxWidth: 200 }}>{boards.map(b => <option key={b.id} value={b.id}>📌 {b.nom}</option>)}</select>
        <button className="btn btn-outline btn-sm" onClick={newBoard} title="Nouveau tableau">➕ Tableau</button>
        <button className="btn btn-ghost btn-sm" onClick={renameBoard} title="Renommer">✏️</button>
        <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={deleteBoard} title="Supprimer le tableau">🗑️</button>
        <span style={{ width: 8 }} />
        <input list="board-people" value={pick} onChange={e => setPick(e.target.value)} onKeyDown={e => e.key === "Enter" && submitPick()} placeholder="🔎 Personne..." style={{ flex: 1, minWidth: 150 }} />
        <datalist id="board-people">{fiches.map(f => <option key={f.id} value={f.nom}>{f.organisation || ""}</option>)}</datalist>
        <button className="btn btn-gold btn-sm" onClick={submitPick} disabled={!pick.trim()}>➕ + ses liens</button>
        <input list="board-groups" value={pickG} onChange={e => setPickG(e.target.value)} onKeyDown={e => e.key === "Enter" && submitGroup()} placeholder="🛡️ Groupe entier..." style={{ flex: 1, minWidth: 140 }} />
        <datalist id="board-groups">{groupes.map(g => <option key={g.id} value={g.nom} />)}</datalist>
        <button className="btn btn-gold btn-sm" onClick={submitGroup} disabled={!pickG.trim()}>➕ Groupe</button>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap", alignItems: "center" }}>
        <button className={tb(linkMode)} onClick={() => { setLinkMode(m => !m); setLinkFrom(null); setPathMode(false); setPathA(null); setPathB(null); }}>🔗 Lier</button>
        <button className={tb(pathMode)} onClick={() => { setPathMode(m => !m); setPathA(null); setPathB(null); setLinkMode(false); setLinkFrom(null); }}>🧭 Chemin</button>
        <button className="btn btn-outline btn-sm" onClick={() => zoomBy(1.2)}>＋</button><button className="btn btn-outline btn-sm" onClick={() => zoomBy(0.83)}>－</button>
        <button className="btn btn-outline btn-sm" onClick={() => fitTo(sel.size ? selItems : [])} title="Tout afficher">⤢ Ajuster</button>
        <span style={{ fontSize: "0.68rem", color: "var(--text-dim)" }}>{Math.round(z * 100)} %</span>
        <button className="btn btn-outline btn-sm" onClick={undo} disabled={!hist.current.past.length} title="Ctrl+Z">↶</button>
        <button className="btn btn-outline btn-sm" onClick={redo} disabled={!hist.current.future.length} title="Ctrl+Y">↷</button>
        <select value={fGroupe} onChange={e => setFGroupe(e.target.value)} style={{ maxWidth: 170 }}><option value="">Filtre : tous les groupes</option>{orgs.map(o => <option key={o}>{o}</option>)}</select>
        <select value={fFlag} onChange={e => setFFlag(e.target.value)} style={{ maxWidth: 140 }}><option value="tout">Tous statuts</option><option value="recherche">Recherchés</option><option value="surveille">Surveillés</option></select>
        <select value={fPeriode} onChange={e => setFPeriode(e.target.value)} style={{ maxWidth: 130 }}><option value="tout">Toute période</option><option value="7">Ajoutés 7 j</option><option value="30">Ajoutés 30 j</option></select>
        <span style={{ flex: 1 }} />
        <button className="btn btn-outline btn-sm" onClick={openTimeline}>🕓 Chronologie</button>
        {items.length > 0 && <><button className="btn btn-outline btn-sm" onClick={exportPng}>🖼️ PNG</button><button className="btn btn-outline btn-sm" onClick={exportPdf}>📄 PDF</button><button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={clearAll}>🧹 Vider</button></>}
      </div>
      {err && <div style={{ color: "var(--danger)", fontSize: "0.78rem", marginBottom: 6 }}>{err}</div>}
      {(linkMode || pathMode) && (
        <div style={{ fontSize: "0.76rem", color: "var(--gold)", marginBottom: 6 }}>
          {linkMode && (linkFrom ? `🔗 Clique sur la 2e pièce (de : ${labelOf(linkFrom)})` : "🔗 Clique sur la 1re pièce à relier (Échap pour quitter)")}
          {pathMode && (path ? (path.nodes.length ? `🧭 ${path.nodes.map(labelOf).join(" → ")} (${path.nodes.length - 1} lien${path.nodes.length > 2 ? "s" : ""})` : "🧭 Aucun chemin entre ces deux pièces") : pathA ? `🧭 Départ : ${labelOf(pathA)}. Clique sur l'arrivée.` : "🧭 Clique sur la pièce de départ puis sur l'arrivée (Échap pour quitter)")}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
        <div ref={vp} className="bd-viewport" style={{ height: "64vh", flex: 1, ...(over ? { outline: "3px dashed #e8c870", outlineOffset: -8 } : {}) }}
          onPointerDown={bgDown} onPointerMove={bgMove} onPointerUp={bgUp} onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={dropBoard}>
          <div className="board" style={{ width: W, height: H, transform: `translate(${pan.x}px,${pan.y}px) scale(${z})`, transformOrigin: "0 0" }}>
            {zones.map(zn => <div key={zn.k} className="bd-zone" style={{ left: zn.x, top: zn.y, width: zn.w, height: zn.h, borderColor: TYPE_COLOR[zn.type], background: (TYPE_COLOR[zn.type] || "#999") + "22" }}><span style={{ color: "#2b1d0e" }}><GroupeLogo nom={zn.nom} type={zn.type} size={26} />{zn.nom}</span></div>)}
            <svg width={W} height={H}>
              {links.map((l, i) => {
                const a = cpt(l.a), b = cpt(l.b); const sag = 28 + ((a.x + b.y) % 22); const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + sag / 2 + 8; const hot = path?.keys.has(l.key); const dim = (!!path && path.nodes.length > 0 && !hot) || (keepSet ? !(keepSet.has(l.a) && keepSet.has(l.b)) : false);
                const d = `M${a.x},${a.y} Q${(a.x + b.x) / 2},${(a.y + b.y) / 2 + sag} ${b.x},${b.y}`;
                return (
                  <g key={l.key} style={{ opacity: dim ? 0.12 : 1 }}>
                    <path d={d} stroke={hot ? "#fff3a0" : l.color} strokeWidth={hot ? 5 : l.mid ? 3.4 : 2.4} strokeDasharray={l.dash} style={{ animation: "none", fill: "none" }} />
                    {l.mid && <path d={d} stroke="transparent" strokeWidth={16} fill="none" style={{ pointerEvents: "stroke", cursor: "pointer", animation: "none" }} onPointerDown={e => { e.stopPropagation(); setSelLink(l.mid!); setSel(new Set()); }} />}
                    {l.label && <text x={mx} y={my} textAnchor="middle" className="bd-lbl">{l.label}</text>}
                  </g>
                );
              })}
            </svg>
            {items.length === 0 && <div style={{ position: "absolute", left: 80, top: 80, width: 560, color: "#2b1d0e", fontSize: "1.05rem", pointerEvents: "none" }}>Tableau vide. Ajoute une personne ou un groupe entier ci-dessus : ses liens (organisation, relations, véhicules, dossiers, pactes) arrivent avec.<br />Molette = zoom · glisser le fond = déplacer · Maj+clic = sélection multiple · images déposables.</div>}
            {shown.map(it => {
              const rot = `rotate(${(it.id.charCodeAt(0) % 7) - 3}deg)`;
              const f = it.kind === "fiche" ? fById.get(it.ref!) : null, v = it.kind === "vehicule" ? vById.get(it.ref!) : null, d = it.kind === "dossier" ? dById.get(it.ref!) : null, pc = it.kind === "pacte" ? pcById.get(it.ref!) : null;
              const dim = (keepSet && !keepSet.has(it.id)) || (path && path.nodes.length > 0 && !path.nodes.includes(it.id));
              const cls = `pin${f && Number(f.prime) > 0 ? " hot" : ""}${f?.surveille ? " eye" : ""}${sel.has(it.id) ? " bd-sel" : ""}${dim ? " bd-dim" : ""}${linkFrom === it.id || pathA === it.id || pathB === it.id ? " bd-pick" : ""}${d ? " k-dossier" : ""}${pc ? " k-pacte" : ""}`;
              const photo = it.kind === "note" ? it.img : (f?.photo_url || v?.photo_url);
              return (
                <div key={it.id} className={cls} style={{ left: it.x, top: it.y, transform: rot }} onPointerDown={e => pinDown(e, it)} onPointerUp={pinUp} onDoubleClick={() => f && onOpen(f.id)}
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); }} onDrop={e => dropPin(e, it)}>
                  <button className="pin-x" onPointerDown={e => e.stopPropagation()} onClick={() => removeAct([it.id])} title="Retirer du tableau">x</button>
                  {photo ? <img src={photo} alt="" draggable={false} referrerPolicy="no-referrer" /> : <div className="pin-no">{v ? "🚗" : d ? "⚖️" : pc ? "🤝" : "?"}</div>}
                  <b>{it.kind === "note" ? "Pièce" : labelOf(it.id)}</b>
                  <small>{f ? (f.organisation || " - ") : v ? `${v.plaque || ""} · véhicule` : d ? `dossier · ${d.statut}` : pc ? `pacte · ${pc.statut}` : "PIÈCE"}</small>
                </div>
              );
            })}
          </div>
          {linkMode && !linkFrom && <div className="bd-hint">🔗 Mode liens : clique deux pièces</div>}
          {/* mini-carte */}
          <div className="bd-mini" style={{ width: 170, height: H * mm }} onPointerDown={e => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); const tx = (e.clientX - r.left) / mm, ty = (e.clientY - r.top) / mm; setPan({ x: vw / 2 - tx * z, y: vh / 2 - ty * z }); }}>
            {shown.map(i => <i key={i.id} style={{ left: i.x * mm, top: i.y * mm, width: Math.max(3, PW * mm), height: Math.max(4, PH * mm), background: i.kind === "fiche" ? TYPE_COLOR[typeOfGroup(fById.get(i.ref!)?.organisation)] || "#e8c870" : "#c9b88a" }} />)}
            <b style={{ left: clamp((-pan.x / z) * mm, 0, 170), top: clamp((-pan.y / z) * mm, 0, H * mm), width: Math.min(170, (vw / z) * mm), height: Math.min(H * mm, (vh / z) * mm) }} />
          </div>
          {draft && (
            <div className="bd-pop" onPointerDown={e => e.stopPropagation()}>
              <b style={{ fontSize: "0.8rem" }}>Lien : {labelOf(draft.a)} → {labelOf(draft.b)}</b>
              <select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })}>{LINK_TYPES.map(t => <option key={t.k} value={t.k}>{t.label}</option>)}</select>
              <input value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })} placeholder="Précision (optionnel)" />
              <div style={{ display: "flex", gap: 6 }}><button className="btn btn-gold btn-sm" onClick={() => { createLink(draft.a, draft.b, draft.type, draft.label); setDraft(null); }}>Créer</button><button className="btn btn-outline btn-sm" onClick={() => setDraft(null)}>Annuler</button></div>
            </div>
          )}
        </div>
        <div className="bd-side">
          {selLinkObj ? (
            <>
              <b>🔗 Lien</b><div style={{ fontSize: "0.72rem" }}>{labelOf(selLinkObj.a)} → {labelOf(selLinkObj.b)}</div>
              <select value={selLinkObj.type} onChange={async e => { const t = e.target.value; setMlinksAll(l => l.map(m => (m.id === selLinkObj.id ? { ...m, type: t } : m))); await dbw.update("obsidian_board_links", selLinkObj.id, { type: t }); }}>{LINK_TYPES.map(t => <option key={t.k} value={t.k}>{t.label}</option>)}</select>
              <input defaultValue={selLinkObj.label || ""} key={selLinkObj.id} placeholder="Précision" onBlur={async e => { await dbw.update("obsidian_board_links", selLinkObj.id, { label: e.target.value.trim() || null }); setMlinksAll(l => l.map(m => (m.id === selLinkObj.id ? { ...m, label: e.target.value.trim() || null } : m))); }} />
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => removeLinkAct(selLinkObj)}>🗑️ Supprimer le lien</button>
            </>
          ) : one ? (
            <>
              <b>{labelOf(one.id)}</b>
              {oneF && <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>{oneF.organisation || "Sans groupe"}{Number(oneF.prime) > 0 ? ` · prime ${oneF.prime}` : ""}</div>}
              {oneF && <button className="btn btn-outline btn-sm" onClick={() => onOpen(oneF.id)}>📂 Ouvrir la fiche</button>}
              {oneF && <button className="btn btn-outline btn-sm" onClick={() => addPerson(oneF.id)}>➕ Ses liens</button>}
              <button className="btn btn-outline btn-sm" onClick={() => { setLinkMode(true); setLinkFrom(one.id); setPathMode(false); }}>🔗 Lier à...</button>
              <button className="btn btn-outline btn-sm" onClick={() => { setPathMode(true); setPathA(one.id); setPathB(null); setLinkMode(false); }}>🧭 Chemin depuis ici</button>
              <div style={{ fontSize: "0.66rem", color: "var(--text-dim)" }}>Liens manuels :</div>
              {mlinks.filter(m => m.a === one.id || m.b === one.id).map(m => <button key={m.id} className="btn btn-ghost btn-sm" style={{ justifyContent: "flex-start", color: typeOf(m.type).color }} onClick={() => setSelLink(m.id)}>{typeOf(m.type).label} : {labelOf(m.a === one.id ? m.b : m.a)}</button>)}
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => removeAct([one.id])}>Retirer du tableau</button>
            </>
          ) : selItems.length > 1 ? (
            <><b>{selItems.length} pièces</b><div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Glisse l'une d'elles pour tout déplacer.</div><button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => removeAct([...sel])}>Retirer la sélection (Suppr)</button></>
          ) : (
            <><b style={{ fontSize: "0.78rem" }}>Légende des liens</b>
              {LINK_TYPES.map(t => <div key={t.k} style={{ fontSize: "0.68rem", display: "flex", gap: 6, alignItems: "center" }}><i style={{ width: 22, height: 3, background: t.color, display: "inline-block" }} />{t.label}</div>)}
              <div style={{ fontSize: "0.66rem", color: "var(--text-dim)", marginTop: 4 }}>Auto : rouge = même groupe / relations · pointillé orange = véhicule · bleu = dossier tribunal · or = pacte.</div>
              <div style={{ fontSize: "0.66rem", color: "var(--text-dim)" }}>Double-clic sur une fiche = ouvrir. Ctrl+Z / Ctrl+Y = annuler / rétablir.</div></>
          )}
        </div>
      </div>
      {timeline && (
        <div className="card" style={{ marginTop: 8, padding: "0.7rem 0.9rem", maxHeight: 220, overflow: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}><b style={{ fontSize: "0.82rem" }}>🕓 Chronologie {sel.size ? "de la sélection" : "du tableau"}</b><button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setTimeline(null)}>✕</button></div>
          {timeline.length === 0 && <div style={{ fontSize: "0.76rem", color: "var(--text-dim)" }}>Aucun fait enregistré.</div>}
          {timeline.map((t, i) => <div key={i} style={{ fontSize: "0.74rem", display: "flex", gap: 8, padding: "2px 0" }}><span style={{ color: "var(--text-dim)", minWidth: 96 }}>{new Date(t.at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span><span>{t.icon} {t.txt}</span></div>)}
        </div>
      )}
    </div>
  );
}
