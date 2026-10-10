"use client";
import { useEffect, useRef, useState } from "react";

// Redimensionne / recadre (4:5) une image en JPEG léger (~25 Ko) pour la stocker directement.
export function fileToPhoto(file: Blob, mode: boolean | "card" = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const evidence = mode === true;
      if (mode === "card") { // carte d'identité : format paysage 1.586
        const W = 720, H = 454, c = document.createElement("canvas"); c.width = W; c.height = H; const ctx = c.getContext("2d")!; const k = Math.max(W / img.width, H / img.height);
        ctx.drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k); URL.revokeObjectURL(url); resolve(c.toDataURL("image/jpeg", 0.82)); return;
      }
      if (evidence) { // photo de preuve : on garde tout le cadre (max 1100 px)
        const k = Math.min(1, 1100 / Math.max(img.width, img.height)); const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); resolve(c.toDataURL("image/jpeg", 0.78)); return;
      }
      const W = 320, H = 400, c = document.createElement("canvas"); c.width = W; c.height = H;
      const ctx = c.getContext("2d")!; const s = Math.max(W / img.width, H / img.height);
      const w = img.width * s, h = img.height * s; ctx.drawImage(img, (W - w) / 2, (H - h) / 2 * 0.7, w, h);
      URL.revokeObjectURL(url); resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image illisible")); };
    img.src = url;
  });
}

// Photo : fichier (PC / téléphone), lien, ou Ctrl+V (image copiée). `onChange` reçoit une data-URL, un lien, ou null.
export function PhotoPicker({ value, onChange, listen = true, evidence = false, card = false }: { value?: string | null; onChange: (url: string | null) => void | Promise<void>; listen?: boolean; evidence?: boolean; card?: boolean }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [link, setLink] = useState("");
  const file = useRef<HTMLInputElement>(null);
  async function setBlob(b: Blob) { setBusy(true); setErr(""); try { await onChange(await fileToPhoto(b, card ? "card" : evidence)); } catch (x: any) { setErr(x.message || "Erreur"); } setBusy(false); }
  useEffect(() => {
    if (!listen) return;
    const h = (ev: ClipboardEvent) => {
      const img = Array.from(ev.clipboardData?.items || []).find(i => i.type.startsWith("image/"));
      if (img) { ev.preventDefault(); const b = img.getAsFile(); if (b) setBlob(b); return; }
      const t = (ev.clipboardData?.getData("text") || "").trim();
      if (/^https?:\/\/\S+\.(png|jpe?g|webp|gif)(\?\S*)?$/i.test(t) && !(ev.target as HTMLElement)?.matches?.("input,textarea")) { ev.preventDefault(); onChange(t); }
    };
    window.addEventListener("paste", h); return () => window.removeEventListener("paste", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listen]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
        {value && <img src={value} alt="" referrerPolicy="no-referrer" style={{ width: card ? 70 : 44, height: card ? 44 : 55, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />}
        <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => file.current?.click()}>📁 Fichier</button>
        <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={async () => { try { const items = await (navigator as any).clipboard.read(); for (const it of items) { const t = it.types.find((x: string) => x.startsWith("image/")); if (t) { await setBlob(await it.getType(t)); return; } } setErr("Aucune image dans le presse-papier"); } catch { setErr("Fais Ctrl+V directement sur la page"); } }}>📋 Coller</button>
        {value && <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => onChange(null)}>✕ Retirer</button>}
        <input ref={file} type="file" accept="image/*" hidden onChange={ev => { const f = ev.target.files?.[0]; if (f) setBlob(f); ev.target.value = ""; }} />
      </div>
      <div style={{ display: "flex", gap: "0.4rem" }}>
        <input placeholder="🔗 ou lien d'image (https://…)" value={link} onChange={ev => setLink(ev.target.value)} style={{ flex: 1 }} />
        <button type="button" className="btn btn-gold btn-sm" disabled={!/^https?:\/\//i.test(link.trim())} onClick={() => { onChange(link.trim()); setLink(""); }}>OK</button>
      </div>
      <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>{busy ? "Traitement…" : err || "Astuce : Ctrl+V colle directement une image copiée (capture, Discord…)."}</div>
    </div>
  );
}
