"use client";
import { useEffect, useState } from "react";

// Aperçu plein écran des PDF générés (sans téléchargement automatique).
export function PdfPreviewHost() {
  const [pdf, setPdf] = useState<{ url: string; name: string } | null>(null);
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setPdf((e as CustomEvent).detail); };
    window.addEventListener("pdf-preview", h); return () => window.removeEventListener("pdf-preview", h);
  }, []);
  useEffect(() => {
    if (!pdf) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdf]);
  function close() { if (pdf) URL.revokeObjectURL(pdf.url); setPdf(null); }
  if (!pdf) return null;
  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.78)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2vh 2vw", animation: "modalZoomIn .25s ease-out" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "min(960px,100%)", height: "96vh", display: "flex", flexDirection: "column", background: "var(--card, #111)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg, 12px)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 0.9rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ flex: 1, fontWeight: 700, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📄 {pdf.name}</div>
          <a className="btn btn-gold btn-sm" href={pdf.url} download={pdf.name}>⬇ Télécharger</a>
          <a className="btn btn-outline btn-sm" href={pdf.url} target="_blank" rel="noreferrer">↗ Nouvel onglet</a>
          <button className="btn btn-ghost btn-sm" onClick={close}>✕</button>
        </div>
        <iframe src={pdf.url} title={pdf.name} style={{ flex: 1, border: 0, background: "#fff" }} />
      </div>
    </div>
  );
}
