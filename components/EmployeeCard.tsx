"use client";
import { useEffect, useRef, useState } from "react";

// Carte pro d'employé Obsidian Logistics : tilt 3D, reflet holographique, anneaux animés, puce, scan.
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

// Redimensionne / recadre (4:5) une image en JPEG léger (~25 Ko) pour la stocker directement.
export function fileToPhoto(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const W = 320, H = 400, c = document.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d")!; const s = Math.max(W / img.width, H / img.height);
      const w = img.width * s, h = img.height * s; ctx.drawImage(img, (W - w) / 2, (H - h) / 2 * 0.7, w, h);
      URL.revokeObjectURL(url); resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image illisible")); };
    img.src = url;
  });
}

export function EmployeeCard({ e }: { e: CardEmploye }) {
  const ref = useRef<HTMLDivElement>(null);
  const p = poleOf(e.role);
  function move(ev: React.MouseEvent) {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect(); const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 14}deg`); el.style.setProperty("--ry", `${(x - 0.5) * 18}deg`);
    el.style.setProperty("--mx", `${x * 100}%`); el.style.setProperty("--my", `${y * 100}%`);
  }
  function leave() { const el = ref.current; if (!el) return; el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); }
  const since = e.created_at ? new Date(e.created_at).toLocaleDateString("fr-FR", { month: "2-digit", year: "2-digit" }) : "—";
  return (
    <div className="idc-wrap" onMouseMove={move} onMouseLeave={leave}>
      <div className="idc" ref={ref} style={{ ["--c" as any]: p.color }}>
        <div className="idc-rings"><i /><i /><i /></div>
        <div className="idc-grid" />
        <div className="idc-scan" />
        <div className="idc-shine" />
        <div className="idc-head">
          <div className="idc-brand"><span className="idc-hex">◆</span> OBSIDIAN LOGISTICS</div>
          <div className="idc-lvl">ACCRÉDITATION {p.niveau}</div>
        </div>
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
    </div>
  );
}

export function EmployeeCardModalBody({ e, canEdit, onPhoto }: { e: CardEmploye; canEdit: boolean; onPhoto: (url: string | null) => Promise<void> | void }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [link, setLink] = useState("");
  const file = useRef<HTMLInputElement>(null);
  async function setBlob(b: Blob) { setBusy(true); setErr(""); try { await onPhoto(await fileToPhoto(b)); } catch (x: any) { setErr(x.message || "Erreur"); } setBusy(false); }
  useEffect(() => {
    if (!canEdit) return;
    const h = (ev: ClipboardEvent) => {
      const items = Array.from(ev.clipboardData?.items || []);
      const img = items.find(i => i.type.startsWith("image/"));
      if (img) { ev.preventDefault(); const b = img.getAsFile(); if (b) setBlob(b); return; }
      const t = ev.clipboardData?.getData("text") || "";
      if (/^https?:\/\//i.test(t.trim()) && !(ev.target as HTMLElement)?.matches?.("input,textarea")) { ev.preventDefault(); onPhoto(t.trim()); }
    };
    window.addEventListener("paste", h); return () => window.removeEventListener("paste", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit]);
  return (
    <div>
      <EmployeeCard e={e} />
      {canEdit && (
        <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => file.current?.click()}>📁 Fichier (PC / téléphone)</button>
            <button className="btn btn-outline btn-sm" disabled={busy} onClick={async () => { try { const items = await (navigator as any).clipboard.read(); for (const it of items) { const t = it.types.find((x: string) => x.startsWith("image/")); if (t) { await setBlob(await it.getType(t)); return; } } setErr("Aucune image dans le presse-papier"); } catch { setErr("Fais Ctrl+V directement sur cette fenêtre"); } }}>📋 Coller</button>
            {e.photo_url && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => onPhoto(null)}>✕ Retirer</button>}
            <input ref={file} type="file" accept="image/*" hidden onChange={ev => { const f = ev.target.files?.[0]; if (f) setBlob(f); ev.target.value = ""; }} />
          </div>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <input placeholder="🔗 ou colle un lien d'image (https://…)" value={link} onChange={ev => setLink(ev.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-gold btn-sm" disabled={!/^https?:\/\//i.test(link.trim())} onClick={() => { onPhoto(link.trim()); setLink(""); }}>OK</button>
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>{busy ? "Traitement…" : err || "Astuce : Ctrl+V colle directement une image copiée (capture, Discord…)."}</div>
        </div>
      )}
    </div>
  );
}
