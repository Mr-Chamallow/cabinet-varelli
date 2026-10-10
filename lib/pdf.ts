"use client";
// Gabarit PDF commun à tous les documents partageables (fiches, procès, pactes, audits, convois…).
// Même en-tête, même classification, même pied de page : un seul style pour tout le Consortium.

const GOLD: [number, number, number] = [201, 162, 77];
const INK: [number, number, number] = [24, 24, 30];
const MUTED: [number, number, number] = [110, 110, 122];
const SCARLET: [number, number, number] = [200, 50, 56];

// jsPDF (polices standard) ne gère pas les emojis ni l'unicode hors Latin-1 : on nettoie proprement.
export function clean(s: any): string {
  if (s === null || s === undefined || s === "") return "—";
  return String(s)
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, "...")
    .replace(/[–—]/g, "-").replace(/→/g, "->").replace(/ /g, " ")
    .replace(/[^\u0009\u000A -~ -ÿ]/g, "").replace(/ {2,}/g, " ").trim() || "—";
}
export const fdate = (s?: string | null) => (s ? new Date(s).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—");
export const fday = (s?: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR") : "—");
export const fusd = (n: number) => clean((n || 0).toLocaleString("fr-FR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }));

// Logo du Consortium (celui des réglages d'identité) en data-URL ; null si indisponible (CORS) -> emblème vectoriel.
async function loadLogo(): Promise<string | null> {
  try {
    const { DEFAULT_LOGO_URL, getCachedIdentity } = await import("@/lib/theme");
    const src = getCachedIdentity()?.logoUrl || DEFAULT_LOGO_URL;
    if (src.startsWith("data:")) return src;
    return await new Promise<string | null>(res => {
      const img = new Image(); img.crossOrigin = "anonymous";
      const t = setTimeout(() => res(null), 2500);
      img.onload = () => { clearTimeout(t); try { const c = document.createElement("canvas"); c.width = 128; c.height = 128; c.getContext("2d")!.drawImage(img, 0, 0, 128, 128); res(c.toDataURL("image/png")); } catch { res(null); } };
      img.onerror = () => { clearTimeout(t); res(null); };
      img.src = src;
    });
  } catch { return null; }
}

export type PdfKind = "fiche" | "tribunal" | "pacte" | "audit" | "evenement" | "organisation" | "contrat";
export interface PdfOpts { title: string; subtitle?: string; classification?: string; org?: string; signers?: [string, string]; kind?: PdfKind; }
type RGB = [number, number, number];
// Un style par catégorie : couleur d'accent, bandeau, emblème, tampon, signataires, numérotation des sections.
const THEMES: Record<PdfKind, { accent: RGB; band: RGB; emblem: string; stamp: string; label: string; footer: string; signers: [string, string]; num: "none" | "roman" | "article" }> = {
  fiche:        { accent: [58, 118, 178],  band: [10, 18, 30], emblem: "person",   stamp: "Fiche confidentielle", label: "Fiche d'identification", footer: "Fiche de renseignement", signers: ["L'enqueteur", "Le responsable de dossier"], num: "none" },
  tribunal:     { accent: [176, 36, 48],   band: [28, 8, 12],  emblem: "scales",   stamp: "Niveau ecarlate", label: "Tribunal de l'Ombre", footer: "Piece de procedure", signers: ["Le Juge", "Le Greffier"], num: "roman" },
  pacte:        { accent: [30, 140, 100],  band: [8, 26, 20],  emblem: "rings",    stamp: "Pacte scelle", label: "Pacte d'Obsidienne", footer: "Acte de pacte", signers: ["La partie signataire", "Pour le Consortium"], num: "article" },
  audit:        { accent: [112, 84, 196],  band: [18, 14, 36], emblem: "magnifier", stamp: "Audit realise", label: "Conformite & controle", footer: "Rapport d'audit", signers: ["L'auditeur", "La Direction"], num: "none" },
  evenement:    { accent: [226, 128, 32],  band: [32, 18, 6],  emblem: "chevrons", stamp: "Operation", label: "Operations de terrain", footer: "Compte rendu d'operation", signers: ["Le chef d'operation", "La Direction"], num: "none" },
  organisation: { accent: [201, 162, 77],  band: [11, 11, 14], emblem: "shield",   stamp: "Dossier complet", label: "Dossier d'organisation", footer: "Dossier confidentiel", signers: ["La Direction", "Le responsable du pole"], num: "none" },
  contrat:      { accent: [24, 150, 162],  band: [6, 24, 28],  emblem: "doc",      stamp: "Contrat", label: "Contrat de mission", footer: "Contrat de mission", signers: ["Le donneur d'ordre", "Le prestataire"], num: "article" },
};

export class Pdf {
  doc: any; y = 0; logo: string | null = null; W = 210; H = 297; M = 18;
  private constructor(doc: any, private opts: PdfOpts) { this.doc = doc; }

  static async create(opts: PdfOpts) {
    const { jsPDF } = await import("jspdf");
    const p = new Pdf(new jsPDF({ unit: "mm", format: "a4" }), opts);
    p.logo = await loadLogo();
    p.cover();
    return p;
  }

  // Logo (image si dispo, sinon hexagone doré) à la position donnée.
  private drawLogo(x: number, y: number, size: number) {
    const d = this.doc;
    if (this.logo) { try { d.addImage(this.logo, "PNG", x, y, size, size); return; } catch { /* repli vectoriel */ } }
    const cx = x + size / 2, cy = y + size / 2, r = size / 2;
    const pts = Array.from({ length: 6 }, (_, i) => [cx + r * Math.cos((Math.PI / 3) * i + Math.PI / 6), cy + r * Math.sin((Math.PI / 3) * i + Math.PI / 6)]);
    d.setDrawColor(...GOLD); d.setLineWidth(0.5);
    pts.forEach((pt, i) => { const q = pts[(i + 1) % 6]; d.line(pt[0], pt[1], q[0], q[1]); });
    d.setFont("times", "bold"); d.setFontSize(size * 1.5); d.setTextColor(...GOLD); d.text("O", cx, cy + size * 0.19, { align: "center" });
  }

  // Référence unique du document + empreinte (hash simple) servant aussi à dessiner le code-barres et la signature.
  get ref() {
    if (!this._ref) {
      let h = 2166136261; const src = this.opts.title + (this.opts.subtitle || "") + new Date().toISOString().slice(0, 10);
      for (let i = 0; i < src.length; i++) { h ^= src.charCodeAt(i); h = Math.imul(h, 16777619); }
      this.hash = h >>> 0; this._ref = `OBS-${new Date().getFullYear()}-${(this.hash % 65536).toString(16).toUpperCase().padStart(4, "0")}`;
    }
    return this._ref;
  }
  private _ref = ""; hash = 0; private n = 0;
  private get t() { return THEMES[this.opts.kind || "organisation"]; }
  private tint(k: number): RGB { const a = this.t.accent; return [Math.round(a[0] + (255 - a[0]) * k), Math.round(a[1] + (255 - a[1]) * k), Math.round(a[2] + (255 - a[2]) * k)]; }
  private roman(n: number) { return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"][n - 1] || String(n); }

  // Emblème vectoriel propre à chaque catégorie (balance, anneaux, loupe, chevrons, silhouette, document, blason).
  private emblem(cx: number, cy: number, size: number, color: RGB, lw = 0.6) {
    const d = this.doc; const r = size / 2; d.setDrawColor(...color); d.setFillColor(...color); d.setLineWidth(lw);
    const L = (x1: number, y1: number, x2: number, y2: number) => d.line(cx + x1 * r, cy + y1 * r, cx + x2 * r, cy + y2 * r);
    switch (this.t.emblem) {
      case "scales": L(0, -0.9, 0, 0.8); L(-0.8, -0.55, 0.8, -0.55); L(-0.45, 0.85, 0.45, 0.85);
        for (const sx of [-0.8, 0.8]) { L(sx, -0.55, sx - 0.38, 0.25); L(sx, -0.55, sx + 0.38, 0.25); L(sx - 0.38, 0.25, sx + 0.38, 0.25); } break;
      case "rings": d.circle(cx - r * 0.35, cy, r * 0.6, "S"); d.circle(cx + r * 0.35, cy, r * 0.6, "S"); break;
      case "magnifier": d.circle(cx - r * 0.12, cy - r * 0.12, r * 0.62, "S"); L(0.33, 0.33, 0.9, 0.9); L(-0.32, -0.12, -0.12, 0.1); L(-0.12, 0.1, 0.18, -0.38); break;
      case "chevrons": for (const o of [-0.7, -0.1, 0.5]) { L(o, -0.7, o + 0.5, 0); L(o + 0.5, 0, o, 0.7); } break;
      case "person": d.circle(cx, cy - r * 0.38, r * 0.34, "S"); L(-0.7, 0.85, -0.55, 0.25); L(0.7, 0.85, 0.55, 0.25); L(-0.55, 0.25, 0.55, 0.25); L(-0.7, 0.85, 0.7, 0.85); break;
      case "doc": L(-0.55, -0.9, 0.25, -0.9); L(0.25, -0.9, 0.55, -0.6); L(0.55, -0.6, 0.55, 0.9); L(0.55, 0.9, -0.55, 0.9); L(-0.55, 0.9, -0.55, -0.9); L(0.25, -0.9, 0.25, -0.6); L(0.25, -0.6, 0.55, -0.6);
        for (const y of [-0.2, 0.15, 0.5]) L(-0.3, y, 0.3, y); break;
      default: L(-0.7, -0.8, 0.7, -0.8); L(0.7, -0.8, 0.7, 0.15); L(0.7, 0.15, 0, 0.95); L(0, 0.95, -0.7, 0.15); L(-0.7, 0.15, -0.7, -0.8); L(0, -0.8, 0, 0.95); L(-0.7, -0.2, 0.7, -0.2);
    }
  }

  private barcode(x: number, y: number, w: number, h: number) {
    const d = this.doc; let seed = this.hash || 1; const n = 44; const bw = w / n;
    d.setFillColor(...INK);
    for (let i = 0; i < n; i++) { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; if ((seed >> 16) % 3 !== 0) d.rect(x + i * bw, y, bw * (0.45 + ((seed >> 8) % 3) * 0.2), h, "F"); }
  }

  // Tampon rectangulaire incliné (classification).
  private stamp(text: string, cx: number, cy: number, angle: number, color: [number, number, number]) {
    const d = this.doc; const w = 56, h = 15;
    d.setDrawColor(...color); d.setTextColor(...color);
    const rad = (angle * Math.PI) / 180; const rot = (px: number, py: number) => [cx + px * Math.cos(rad) - py * Math.sin(rad), cy - (px * Math.sin(rad) + py * Math.cos(rad))];
    const c = [rot(-w / 2, -h / 2), rot(w / 2, -h / 2), rot(w / 2, h / 2), rot(-w / 2, h / 2)];
    d.setLineWidth(1.1); c.forEach((pt, i) => { const q = c[(i + 1) % 4]; d.line(pt[0], pt[1], q[0], q[1]); });
    const k = 1.4, c2 = [rot(-w / 2 + k, -h / 2 + k), rot(w / 2 - k, -h / 2 + k), rot(w / 2 - k, h / 2 - k), rot(-w / 2 + k, h / 2 - k)];
    d.setLineWidth(0.3); c2.forEach((pt, i) => { const q = c2[(i + 1) % 4]; d.line(pt[0], pt[1], q[0], q[1]); });
    d.setFont("helvetica", "bold"); d.setFontSize(10.5);
    const tp = rot(0, 0.9); d.text(clean(text).toUpperCase(), tp[0], tp[1], { align: "center", angle });
    d.setFontSize(6); const sp = rot(0, -3.6); d.text("OBSIDIAN LOGISTICS", sp[0], sp[1], { align: "center", angle, charSpace: 0.4 });
  }

  // Sceau officiel : double anneau, texte circulaire, étoile centrale.
  private seal(cx: number, cy: number, r: number) {
    const d = this.doc;
    d.setDrawColor(...this.t.accent); d.setTextColor(...this.t.accent);
    d.setLineWidth(0.9); d.circle(cx, cy, r, "S"); d.setLineWidth(0.3); d.circle(cx, cy, r - 1.6, "S"); d.circle(cx, cy, r * 0.58, "S");
    const txt = "OBSIDIAN LOGISTICS  *  CONSORTIUM DE REGULATION  *  "; const n = txt.length; d.setFont("helvetica", "bold"); d.setFontSize(r * 0.36);
    for (let i = 0; i < n; i++) { const t = 90 - (i / n) * 360 + 0; const rad = (t * Math.PI) / 180; const rr = r - 3.9; d.text(txt[i], cx + rr * Math.cos(rad), cy - rr * Math.sin(rad), { angle: t - 90, align: "center" }); }
    const star: number[][] = []; for (let i = 0; i < 10; i++) { const rad = (-90 + i * 36) * Math.PI / 180; const rr = i % 2 ? r * 0.2 : r * 0.46; star.push([cx + rr * Math.cos(rad), cy + rr * Math.sin(rad)]); }
    d.setLineWidth(0.4); d.setFillColor(...this.t.accent); star.forEach((pt, i) => { const q = star[(i + 1) % 10]; d.line(pt[0], pt[1], q[0], q[1]); });
  }

  // Signature manuscrite générée (courbe pseudo-aléatoire stable pour ce document).
  private scribble(x: number, y: number, w: number, salt: number) {
    const d = this.doc; let seed = (this.hash + salt * 7919) >>> 0; const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    d.setDrawColor(28, 38, 92); d.setLineWidth(0.5);
    let px = x, py = y; const steps = 7;
    for (let i = 1; i <= steps; i++) {
      const nx = x + (w * i) / steps, ny = y + (rnd() - 0.5) * 9;
      d.lines([[ (nx - px) * 0.3, -(4 + rnd() * 6), (nx - px) * 0.7, (rnd() - 0.5) * 8, nx - px, ny - py ]], px, py, [1, 1], "S");
      px = nx; py = ny;
    }
    d.setLineWidth(0.35); d.line(x + w * 0.1, y + 5.5, x + w * 0.9, y + 3.2);
  }

  private frame() {
    const d = this.doc; const m = 8, L = 7; d.setDrawColor(...this.t.accent); d.setLineWidth(0.5);
    for (const [x, y, dx, dy] of [[m, m, 1, 1], [this.W - m, m, -1, 1], [m, this.H - m, 1, -1], [this.W - m, this.H - m, -1, -1]] as number[][]) { d.line(x, y, x + dx * L, y); d.line(x, y, x, y + dy * L); }
  }

  private cover() {
    const d = this.doc;
    d.setFillColor(...this.t.band); d.rect(0, 0, this.W, 34, "F");
    d.setFillColor(...this.t.accent); d.rect(0, 34, this.W, 1.1, "F"); d.setFillColor(...GOLD); d.rect(0, 35.1, this.W, 0.4, "F");
    this.drawLogo(this.M, 7, 20);
    d.setFont("times", "bold"); d.setFontSize(18); d.setTextColor(...GOLD);
    d.text("OBSIDIAN LOGISTICS", this.M + 24, 18, { charSpace: 1.4 });
    d.setFont("helvetica", "normal"); d.setFontSize(7.5); d.setTextColor(170, 170, 180);
    d.text(clean(this.opts.org || "Consortium de regulation"), this.M + 24, 24.5);
    this.emblem(this.W - this.M - 8, 17.5, 15, this.t.accent, 0.7);
    d.setFontSize(7); d.text(`REF  ${this.ref}`, this.W - this.M - 20, 18, { align: "right", charSpace: 0.6 });
    d.text(this.t.label, this.W - this.M - 20, 24.5, { align: "right" });

    d.setTextColor(...INK); d.setFont("times", "bold"); d.setFontSize(23);
    const lines = d.splitTextToSize(clean(this.opts.title), this.W - 2 * this.M - 66);
    d.text(lines, this.M, 54);
    let y = 54 + lines.length * 9.5;
    if (this.opts.subtitle) { d.setFont("helvetica", "normal"); d.setFontSize(10.5); d.setTextColor(...MUTED); const sl = d.splitTextToSize(clean(this.opts.subtitle), this.W - 2 * this.M - 66); d.text(sl, this.M, y); y += sl.length * 5 + 1; }
    this.stamp(this.opts.classification || this.t.stamp, this.W - this.M - 29, 56, 8, this.t.accent);
    d.setFillColor(...this.t.accent); d.rect(this.M, y + 2, 38, 0.9, "F");
    d.setFont("helvetica", "normal"); d.setFontSize(7.5); d.setTextColor(...MUTED);
    d.text(`Emis le ${new Date().toLocaleDateString("fr-FR", { dateStyle: "long" })}`, this.M, y + 8);
    this.barcode(this.M, y + 11, 52, 6);
    this.y = Math.max(y + 24, 78);
  }

  private ensure(h: number) {
    if (this.y + h > this.H - 20) { this.doc.addPage(); this.y = 22; }
  }

  // Photos intégrées (data-URL uniquement ; un lien externe ne peut pas être embarqué).
  photos(list: { url?: string | null; label: string; w: number; h: number }[]) {
    const items = list.filter(i => i.url && String(i.url).startsWith("data:image"));
    if (!items.length) return;
    const hmax = Math.max(...items.map(i => i.h));
    this.ensure(hmax + 12);
    const d = this.doc; let x = this.M;
    for (const it of items) {
      try { d.setDrawColor(200, 200, 208); d.setLineWidth(0.3); d.rect(x - 0.5, this.y - 0.5, it.w + 1, it.h + 1); d.addImage(it.url, "JPEG", x, this.y, it.w, it.h); } catch { /* image illisible : ignorée */ }
      d.setFont("helvetica", "normal"); d.setFontSize(7); d.setTextColor(...MUTED); d.text(clean(it.label), x, this.y + it.h + 4.5);
      x += it.w + 8;
    }
    this.y += hmax + 9;
  }

  section(title: string) {
    this.ensure(16);
    const d = this.doc;
    this.y += 4;
    d.setFillColor(...this.t.accent); d.rect(this.M, this.y - 4.2, 1.6, 6.2, "F");
    d.setFont("times", "bold"); d.setFontSize(11.5); d.setTextColor(...INK);
    this.n++; const pre = this.t.num === "roman" ? this.roman(this.n) + ".  " : this.t.num === "article" ? `ARTICLE ${this.n}  -  ` : "";
    d.text(pre + clean(title).toUpperCase(), this.M + 4.5, this.y, { charSpace: 0.9 });
    d.setDrawColor(225, 215, 185); d.setLineWidth(0.25); d.line(this.M, this.y + 2.4, this.W - this.M, this.y + 2.4);
    this.y += 8;
  }

  para(text: any, opts: { color?: [number, number, number]; italic?: boolean } = {}) {
    const d = this.doc;
    d.setFont("helvetica", opts.italic ? "italic" : "normal"); d.setFontSize(10); d.setTextColor(...(opts.color || INK));
    const lines = d.splitTextToSize(clean(text), this.W - 2 * this.M);
    for (const l of lines) { this.ensure(5.5); d.text(l, this.M, this.y); this.y += 5; }
    this.y += 1.5;
  }

  kv(rows: [string, any][]) {
    const d = this.doc; const w = this.W - 2 * this.M; const col = w / 2;
    for (let i = 0; i < rows.length; i += 2) {
      this.ensure(12);
      for (let j = 0; j < 2; j++) {
        const r = rows[i + j]; if (!r) continue;
        const x = this.M + j * col;
        d.setFont("helvetica", "normal"); d.setFontSize(7.5); d.setTextColor(...MUTED); d.text(clean(r[0]).toUpperCase(), x, this.y, { charSpace: 0.4 });
        d.setFont("helvetica", "bold"); d.setFontSize(10); d.setTextColor(...INK);
        d.text(d.splitTextToSize(clean(r[1]), col - 6)[0] || "—", x, this.y + 5);
      }
      this.y += 11;
    }
  }

  list(items: string[]) {
    const d = this.doc;
    if (!items.length) return this.para("Aucun element.", { color: MUTED, italic: true });
    d.setFont("helvetica", "normal"); d.setFontSize(10); d.setTextColor(...INK);
    for (const it of items) {
      const lines = d.splitTextToSize(clean(it), this.W - 2 * this.M - 6);
      lines.forEach((l: string, i: number) => {
        this.ensure(5.5);
        if (i === 0) { d.setFillColor(...this.t.accent); d.circle(this.M + 1.2, this.y - 1.2, 0.7, "F"); }
        d.text(l, this.M + 5, this.y); this.y += 5;
      });
      this.y += 0.8;
    }
    this.y += 1;
  }

  table(head: string[], rows: any[][], widths?: number[]) {
    const d = this.doc; const w = this.W - 2 * this.M;
    const cw = widths || head.map(() => w / head.length);
    this.ensure(14);
    d.setFillColor(...this.tint(0.82)); d.rect(this.M, this.y - 4.2, w, 6.5, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(8); d.setTextColor(...INK);
    let x = this.M; head.forEach((h, i) => { d.text(clean(h).toUpperCase(), x + 1.5, this.y); x += cw[i]; });
    this.y += 6;
    d.setFont("helvetica", "normal"); d.setFontSize(9);
    rows.forEach((r, ri) => {
      const cells = r.map((c, i) => d.splitTextToSize(clean(c), cw[i] - 3) as string[]);
      const h = Math.max(...cells.map(c => c.length)) * 4.4 + 2;
      this.ensure(h + 2);
      if (ri % 2 === 1) { d.setFillColor(...this.tint(0.93)); d.rect(this.M, this.y - 3.6, w, h, "F"); }
      let cx = this.M; d.setTextColor(...INK);
      cells.forEach((c, i) => { c.forEach((l, li) => d.text(l, cx + 1.5, this.y + li * 4.4)); cx += cw[i]; });
      this.y += h;
    });
    this.y += 2;
  }

  // Bloc de validation final : lieu/date, deux signatures manuscrites et sceau officiel.
  private validation() {
    this.ensure(52);
    const d = this.doc; const y0 = this.y + 6;
    d.setFont("helvetica", "normal"); d.setFontSize(8.5); d.setTextColor(...MUTED);
    d.text(`Fait a Los Santos, le ${new Date().toLocaleDateString("fr-FR", { dateStyle: "long" })}`, this.M, y0);
    const colW = 58; const xs = [this.M, this.M + colW + 10];
    const labels = [this.opts.signers?.[0] || this.t.signers[0], this.opts.signers?.[1] || this.t.signers[1]];
    // Format "Rôle|Nom" : le nom réel de la personne qui signe est imprimé sous la ligne.
    xs.forEach((x, i) => {
      this.scribble(x + 4, y0 + 14, colW - 12, i + 1);
      d.setDrawColor(...INK); d.setLineWidth(0.3); d.line(x, y0 + 24, x + colW, y0 + 24);
      d.setFont("helvetica", "bold"); d.setFontSize(7.5); d.setTextColor(...INK); d.text(clean(labels[i].split("|")[0]).toUpperCase(), x, y0 + 28.5, { charSpace: 0.4 });
      const nm = clean((labels[i].split("|")[1] || "").trim()); const nmShort = nm.length > 38 ? nm.slice(0, 37) + "." : nm;
      d.setFont("helvetica", nm ? "bold" : "normal"); d.setFontSize(nm ? 8 : 6.5); d.setTextColor(...(nm ? INK : MUTED)); d.text(nm ? nmShort : "Lu et approuve - signature", x, y0 + 32.5);
    });
    this.seal(this.W - this.M - 20, y0 + 16, 17);
    this.y = y0 + 38;
  }

  save(filename: string) {
    this.validation();
    const d = this.doc; const n = d.getNumberOfPages();
    const stamp = `Genere le ${new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`;
    let GState: any = null; try { GState = (d as any).GState; } catch { /* ignoré */ }
    for (let i = 1; i <= n; i++) {
      d.setPage(i);
      this.frame();
      if (GState) { // filigrane diagonal très léger
        try { d.setGState(new GState({ opacity: 0.05, "stroke-opacity": 0.05 } as any)); this.emblem(this.W / 2, this.H / 2, 95, this.t.accent, 2.2); d.setGState(new GState({ opacity: 1, "stroke-opacity": 1 } as any)); } catch { /* ignoré */ }
      }
      if (i > 1) { // bandeau fin sur les pages suivantes
        d.setFillColor(...this.t.band); d.rect(0, 0, this.W, 11, "F"); d.setFillColor(...this.t.accent); d.rect(0, 11, this.W, 0.5, "F");
        this.drawLogo(this.M, 1.8, 7.4);
        d.setFont("times", "bold"); d.setFontSize(9); d.setTextColor(...GOLD); d.text("OBSIDIAN LOGISTICS", this.M + 10, 7, { charSpace: 0.8 });
        d.setFont("helvetica", "normal"); d.setFontSize(7); d.setTextColor(170, 170, 180); d.text(`${this.ref}  -  ${clean(this.opts.title).slice(0, 48)}`, this.W - this.M, 7, { align: "right" });
      }
      d.setDrawColor(220, 220, 226); d.setLineWidth(0.2); d.line(this.M, this.H - 14, this.W - this.M, this.H - 14);
      this.drawLogo(this.M, this.H - 12.5, 5);
      d.setFont("helvetica", "normal"); d.setFontSize(7); d.setTextColor(...MUTED);
      d.text(`${this.t.footer} - Obsidian Logistics - ne pas diffuser en dehors du Consortium`, this.M + 7, this.H - 9.5);
      d.setFontSize(6.3); d.text(`${this.ref}  -  Empreinte ${(this.hash >>> 0).toString(16).toUpperCase().padStart(8, "0")}`, this.M + 7, this.H - 6);
      d.setFontSize(7.5); d.text(`${stamp}   -   Page ${i}/${n}`, this.W - this.M, this.H - 9.5, { align: "right" });
      this.barcode(this.W - this.M - 30, this.H - 8, 30, 3);
    }
    const name = `${filename.replace(/[^a-zA-Z0-9_-]+/g, "_")}.pdf`;
    // Aperçu d'abord (PdfPreviewHost) ; le téléchargement se fait depuis l'aperçu.
    const url = URL.createObjectURL(d.output("blob"));
    // dispatchEvent renvoie false quand l'aperçu a pris en charge (preventDefault) -> on ne télécharge PAS.
    if (typeof window !== "undefined" && !window.dispatchEvent(new CustomEvent("pdf-preview", { detail: { url, name }, cancelable: true }))) return;
    d.save(name);
  }
}
