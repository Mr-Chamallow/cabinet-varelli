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

export interface PdfOpts { title: string; subtitle?: string; classification?: string; org?: string; }

export class Pdf {
  doc: any; y = 0; W = 210; H = 297; M = 18;
  private constructor(doc: any, private opts: PdfOpts) { this.doc = doc; }

  static async create(opts: PdfOpts) {
    const { jsPDF } = await import("jspdf");
    const p = new Pdf(new jsPDF({ unit: "mm", format: "a4" }), opts);
    p.cover();
    return p;
  }

  private cover() {
    const d = this.doc;
    d.setFillColor(11, 11, 14); d.rect(0, 0, this.W, 30, "F");
    d.setFillColor(...GOLD); d.rect(0, 30, this.W, 0.9, "F");
    d.setFont("times", "bold"); d.setFontSize(17); d.setTextColor(...GOLD);
    d.text("OBSIDIAN LOGISTICS", this.M, 17, { charSpace: 1.2 });
    d.setFont("helvetica", "normal"); d.setFontSize(7.5); d.setTextColor(170, 170, 180);
    d.text(clean(this.opts.org || "Consortium de regulation"), this.M, 23);
    d.setFont("helvetica", "bold"); d.setFontSize(8); d.setTextColor(...SCARLET);
    d.text(clean((this.opts.classification || "CONFIDENTIEL").toUpperCase()), this.W - this.M, 17, { align: "right" });
    d.setFont("helvetica", "normal"); d.setFontSize(7); d.setTextColor(170, 170, 180);
    d.text("Reserve aux membres du Consortium", this.W - this.M, 23, { align: "right" });

    d.setTextColor(...INK); d.setFont("times", "bold"); d.setFontSize(22);
    const lines = d.splitTextToSize(clean(this.opts.title), this.W - 2 * this.M);
    d.text(lines, this.M, 46);
    this.y = 46 + lines.length * 9;
    if (this.opts.subtitle) {
      d.setFont("helvetica", "normal"); d.setFontSize(10); d.setTextColor(...MUTED);
      d.text(clean(this.opts.subtitle), this.M, this.y); this.y += 6;
    }
    this.y += 3;
  }

  private ensure(h: number) {
    if (this.y + h > this.H - 20) { this.doc.addPage(); this.y = 20; }
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
    d.setFont("helvetica", "bold"); d.setFontSize(9); d.setTextColor(...GOLD);
    d.text(clean(title).toUpperCase(), this.M, this.y, { charSpace: 0.8 });
    d.setDrawColor(...GOLD); d.setLineWidth(0.3); d.line(this.M, this.y + 1.8, this.W - this.M, this.y + 1.8);
    this.y += 7;
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
        if (i === 0) { d.setFillColor(...GOLD); d.circle(this.M + 1.2, this.y - 1.2, 0.7, "F"); }
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
    d.setFillColor(238, 232, 214); d.rect(this.M, this.y - 4.2, w, 6.5, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(8); d.setTextColor(...INK);
    let x = this.M; head.forEach((h, i) => { d.text(clean(h).toUpperCase(), x + 1.5, this.y); x += cw[i]; });
    this.y += 6;
    d.setFont("helvetica", "normal"); d.setFontSize(9);
    rows.forEach((r, ri) => {
      const cells = r.map((c, i) => d.splitTextToSize(clean(c), cw[i] - 3) as string[]);
      const h = Math.max(...cells.map(c => c.length)) * 4.4 + 2;
      this.ensure(h + 2);
      if (ri % 2 === 1) { d.setFillColor(247, 245, 238); d.rect(this.M, this.y - 3.6, w, h, "F"); }
      let cx = this.M; d.setTextColor(...INK);
      cells.forEach((c, i) => { c.forEach((l, li) => d.text(l, cx + 1.5, this.y + li * 4.4)); cx += cw[i]; });
      this.y += h;
    });
    this.y += 2;
  }

  save(filename: string) {
    const d = this.doc; const n = d.getNumberOfPages();
    const stamp = `Genere le ${new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`;
    for (let i = 1; i <= n; i++) {
      d.setPage(i);
      d.setDrawColor(220, 220, 226); d.setLineWidth(0.2); d.line(this.M, this.H - 14, this.W - this.M, this.H - 14);
      d.setFont("helvetica", "normal"); d.setFontSize(7.5); d.setTextColor(...MUTED);
      d.text("Document confidentiel - Obsidian Logistics - ne pas diffuser en dehors du Consortium", this.M, this.H - 9);
      d.text(`${stamp}   -   Page ${i}/${n}`, this.W - this.M, this.H - 9, { align: "right" });
    }
    const name = `${filename.replace(/[^a-zA-Z0-9_-]+/g, "_")}.pdf`;
    // Aperçu d'abord (PdfPreviewHost) ; le téléchargement se fait depuis l'aperçu.
    const url = URL.createObjectURL(d.output("blob"));
    if (typeof window !== "undefined" && window.dispatchEvent(new CustomEvent("pdf-preview", { detail: { url, name }, cancelable: true }))) return;
    d.save(name);
  }
}
