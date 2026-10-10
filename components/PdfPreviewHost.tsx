"use client";
import { useEffect, useRef, useState } from "react";

const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
let loading: Promise<any> | null = null;
function loadPdfJs(): Promise<any> {
  const w = window as any;
  if (w.pdfjsLib) return Promise.resolve(w.pdfjsLib);
  if (!loading) loading = new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = PDFJS; s.async = true;
    s.onload = () => { w.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER; res(w.pdfjsLib); };
    s.onerror = () => { loading = null; rej(new Error("pdf.js indisponible")); };
    document.head.appendChild(s);
  });
  return loading;
}

// Aperçu plein écran des PDF générés : rendu page par page (aucun téléchargement automatique, même si le navigateur est réglé pour télécharger les PDF).
export function PdfPreviewHost() {
  const [pdf, setPdf] = useState<{ url: string; name: string } | null>(null);
  const [state, setState] = useState<"load" | "ok" | "fallback">("load");
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setState("load"); setPdf((e as CustomEvent).detail); };
    window.addEventListener("pdf-preview", h); return () => window.removeEventListener("pdf-preview", h);
  }, []);
  useEffect(() => {
    if (!pdf) return;
    let off = false;
    (async () => {
      try {
        const lib = await loadPdfJs();
        const doc = await lib.getDocument(pdf.url).promise;
        if (off || !box.current) return;
        box.current.innerHTML = "";
        const width = Math.min(box.current.clientWidth - 24, 900); const dpr = Math.min(2, window.devicePixelRatio || 1);
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i); if (off) return;
          const vp0 = page.getViewport({ scale: 1 }); const k = width / vp0.width; const vp = page.getViewport({ scale: k * dpr });
          const c = document.createElement("canvas"); c.width = vp.width; c.height = vp.height; c.style.cssText = `width:${width}px;max-width:100%;height:auto;margin:0 auto 12px;display:block;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.4)`;
          box.current.appendChild(c);
          await page.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
        }
        if (!off) setState("ok");
      } catch { if (!off) setState("fallback"); }
    })();
    return () => { off = true; };
  }, [pdf]);
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
          <button className="btn btn-ghost btn-sm" onClick={close}>✕</button>
        </div>
        {state === "fallback" ? (
          <iframe src={pdf.url} title={pdf.name} style={{ flex: 1, border: 0, background: "#fff" }} />
        ) : (
          <div style={{ flex: 1, overflow: "auto", padding: "12px", background: "#2a2a30" }}>
            {state === "load" && <div style={{ color: "#bbb", textAlign: "center", padding: "2rem", fontSize: "0.85rem" }}>Préparation de l'aperçu…</div>}
            <div ref={box} />
          </div>
        )}
      </div>
    </div>
  );
}
