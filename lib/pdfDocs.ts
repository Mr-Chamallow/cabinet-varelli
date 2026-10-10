"use client";
import { Pdf, clean, fdate, fday, fusd } from "@/lib/pdf";
import { metierInfo } from "@/lib/fichesMetiers";
import { scoreOf, scoreLabel } from "@/lib/gmApi";

const day = () => new Date().toISOString().slice(0, 10);

// Les notes privées ne sont JAMAIS exportées : le PDF est fait pour être partagé.
export async function pdfFiche(f: any) {
  const m = metierInfo(f.metier);
  const p = await Pdf.create({ kind: "fiche", title: f.nom, subtitle: `Fiche - ${m.label}${(f.sous_tags || []).length ? " - " + f.sous_tags.join(", ") : ""}`, classification: "Fiche - confidentiel", signers: [`L'enqueteur|${f.created_by || ""}`, `La personne concernee|${f.nom || ""}`] });
  p.photos([{ url: f.photo_url, label: "Photo de la personne", w: 38, h: 47.5 }, { url: f.photo_id, label: "Carte d'identite", w: 72, h: 45 }]);
  p.section("Identite");
  p.kv([["Type", f.type], ["Priorite", f.priorite], ["Statut", f.statut], ["Metier", m.label], ["Organisation", f.organisation], ["Occupation", f.occupation],
    ["Origine", f.origine], ["Age", f.age ? `${f.age} ans` : ""], ["Telephone", f.telephone]]);
  if ((f.tags || []).length) { p.section("Tags"); p.para((f.tags || []).join(", ")); }
  if (f.adresses) { p.section("Adresses"); p.para(f.adresses); }
  if (f.vehicules) { p.section("Vehicules"); p.para(f.vehicules); }
  if (f.comptes_bancaires) { p.section("Comptes bancaires RP"); p.para(f.comptes_bancaires); }
  if (f.relations) { p.section("Relations"); p.para(f.relations); }
  if (f.notes_publiques) { p.section("Notes"); p.para(f.notes_publiques); }
  p.save(`fiche-${f.nom}-${day()}`);
}

export async function pdfDossier(d: any) {
  const p = await Pdf.create({ kind: "tribunal", title: d.titre, subtitle: `Tribunal de l'Ombre - dossier ${d.statut}`, classification: "Niveau ecarlate", signers: [`Le Juge|${d.juge || ""}`, `Le Procureur|${d.procureur || ""}`] });
  p.section("Dossier");
  p.kv([["Accuse", d.accuse], ["Organisation", d.organisation], ["Juge", d.juge], ["Procureur", d.procureur], ["Avocat commis d'office", d.avocat], ["Audience", fdate(d.date_audience)],
    ["Statut", d.statut], ["Verdict", d.verdict === "en_cours" ? "En cours" : d.verdict]]);
  if (d.acte_accusation) { p.section("Acte d'accusation"); p.para(d.acte_accusation); }
  if (d.defense) { p.section("Defense"); p.para(d.defense); }
  p.section(`Pieces et preuves (${(d.preuves || []).length})`);
  p.list((d.preuves || []).map((x: any) => `${x.texte}${x.url ? " [" + x.url + "]" : ""}${x.par ? " - " + x.par : ""}${x.date ? " (" + fdate(x.date) + ")" : ""}`));
  if (d.sentence) { p.section("Sentence"); p.para(d.sentence); }
  p.save(`proces-${d.titre}-${day()}`);
}

export async function pdfPacte(x: any) {
  const p = await Pdf.create({ kind: "pacte", title: `Pacte d'Obsidienne - ${x.organisation}`, subtitle: `Statut : ${x.statut}`, classification: "Pacte - confidentiel", signers: [`Le signataire|${[x.signataire, x.organisation].filter(Boolean).join(" - ")}`, `Pour le Consortium|${x.created_by || "Obsidian Logistics"}`] });
  p.section("Parties et duree");
  p.kv([["Organisation", x.organisation], ["Signataire", x.signataire], ["Signe le", fday(x.date_signature)], ["Echeance", x.date_fin ? fday(x.date_fin) : "Sans echeance"]]);
  p.section("Clauses"); p.para(x.clauses || "Aucune clause renseignee.");
  p.section(`Violations (${(x.violations || []).length})`);
  p.list((x.violations || []).map((v: any) => `${v.texte} (${fdate(v.date)})`));
  p.save(`pacte-${x.organisation}-${day()}`);
}

export async function pdfAudit(a: any) {
  const p = await Pdf.create({ kind: "audit", title: `Audit de conformite - ${a.organisation}`, subtitle: `Note ${a.note}/10 - ${fdate(a.created_at)}`, classification: "Audit - confidentiel", signers: [`L'auditeur|${a.created_by || ""}`, `L'organisation auditee|${a.organisation || ""}`] });
  p.section("Resultat");
  p.kv([["Organisation", a.organisation], ["Note", `${a.note}/10`], ["Realise par", a.created_by], ["Date", fdate(a.created_at)]]);
  p.section("Appreciation"); p.para(a.appreciation || "—");
  if (a.sanction) { p.section("Sanction"); p.kv([["Sanction", a.sanction], ["Jusqu'au", fdate(a.sanction_fin)]]); }
  if (a.notes) { p.section("Notes"); p.para(a.notes); }
  p.save(`audit-${a.organisation}-${day()}`);
}

const TYPE_LABEL: any = { convoi: "Convoi", enchere: "Enchere", alerte: "Lanceur d'alerte", capture: "Capture" };
export async function pdfEvenement(e: any) {
  const p = await Pdf.create({ kind: "evenement", title: e.titre, subtitle: `${TYPE_LABEL[e.type] || "Evenement"} - ${e.statut}`, classification: "Operation - confidentiel", signers: [`Le responsable|${e.created_by || ""}`, `Le partenaire / la cible|${e.partenaire || ""}`] });
  p.section("Details");
  p.kv([["Type", TYPE_LABEL[e.type]], ["Statut", e.statut], ["Partenaire / cible", e.partenaire], ["Date", fdate(e.date_event)], ["Montant", e.montant ? fusd(e.montant) : "—"], ["Cree par", e.created_by]]);
  if ((e.lots || []).length) { p.section("Lots"); p.table(["Lot", "Depart", "Adjuge", "Gagnant"], e.lots.map((l: any) => [l.nom, fusd(l.mise_depart), l.mise_finale ? fusd(l.mise_finale) : "—", l.gagnant]), [70, 32, 32, 40]); }
  if (e.notes) { p.section("Notes"); p.para(e.notes); }
  p.save(`${e.type}-${e.titre}-${day()}`);
}

// Dossier complet d'une organisation : tout ce que le Consortium sait, en un seul PDF.
export async function pdfOrganisation(org: any, ctx: { pactes: any[]; audits: any[]; dossiers: any[]; evenements: any[]; history: any[]; fiches?: any[] }) {
  const score = scoreOf(ctx.history.map(h => h.delta)); const lab = scoreLabel(score);
  const p = await Pdf.create({ kind: "organisation", title: `Dossier - ${org.nom}`, subtitle: `${org.categorie || "Organisation"} - reputation ${score}/100 (${lab.label})`, classification: "Dossier complet - confidentiel", signers: ["La Direction|Obsidian Logistics", `L'organisation|${org.nom || ""}`] });
  p.section("Synthese");
  p.kv([["Organisation", org.nom], ["Categorie", org.categorie], ["Reputation", `${score}/100 - ${lab.label}`], ["Pactes actifs", ctx.pactes.filter(x => x.statut === "actif").length],
    ["Audits", ctx.audits.length], ["Dossiers au tribunal", ctx.dossiers.length]]);
  if (org.notes) p.para(org.notes);
  if (ctx.fiches?.length) { p.section(`Fiches liees (${ctx.fiches.length})`); p.table(["Nom", "Metier", "Priorite", "Statut"], ctx.fiches.map(f => [f.nom, metierInfo(f.metier).label, f.priorite, f.statut]), [60, 40, 36, 38]); }
  p.section(`Pactes (${ctx.pactes.length})`);
  if (ctx.pactes.length) p.table(["Statut", "Signe le", "Echeance", "Violations"], ctx.pactes.map(x => [x.statut, fday(x.date_signature), x.date_fin ? fday(x.date_fin) : "—", (x.violations || []).length]), [30, 40, 40, 64]);
  else p.para("Aucun pacte.", { italic: true });
  p.section(`Audits (${ctx.audits.length})`);
  if (ctx.audits.length) p.table(["Date", "Note", "Appreciation", "Sanction"], ctx.audits.map(a => [fday(a.created_at), `${a.note}/10`, a.appreciation, a.sanction || "—"]), [28, 20, 76, 50]);
  else p.para("Aucun audit.", { italic: true });
  p.section(`Dossiers du tribunal (${ctx.dossiers.length})`);
  if (ctx.dossiers.length) p.table(["Date", "Dossier", "Statut", "Verdict"], ctx.dossiers.map(d => [fday(d.created_at), d.titre, d.statut, d.verdict === "en_cours" ? "En cours" : d.verdict]), [28, 74, 36, 36]);
  else p.para("Aucun dossier.", { italic: true });
  p.section(`Convois, encheres et operations (${ctx.evenements.length})`);
  if (ctx.evenements.length) p.table(["Date", "Type", "Titre", "Statut"], ctx.evenements.map(e => [fday(e.date_event || e.created_at), TYPE_LABEL[e.type] || e.type, e.titre, e.statut]), [28, 32, 78, 36]);
  else p.para("Aucun evenement.", { italic: true });
  p.section("Historique de reputation");
  if (ctx.history.length) p.table(["Date", "Points", "Motif"], ctx.history.slice(0, 40).map(h => [fday(h.created_at), `${h.delta > 0 ? "+" : ""}${h.delta}`, h.motif || h.source || "—"]), [28, 22, 124]);
  else p.para("Aucun mouvement (score de depart : 50).", { italic: true });
  p.save(`dossier-${org.nom}-${day()}`);
}

export async function pdfContrat(c: any) {
  const p = await Pdf.create({ kind: "contrat", title: c.titre || "Contrat", subtitle: `${c.type || "Mission"} - ${c.statut || ""}`, classification: "Contrat - confidentiel", signers: [`Le donneur d'ordre|${c.created_by || "Obsidian Logistics"}`, `Le prestataire|${(c.membres_affectes || []).join(", ")}`] });
  p.section("Parties et conditions");
  p.kv([["Type", c.type], ["Difficulte", c.difficulte], ["Statut", c.statut], ["Recompense", c.recompense ? fusd(c.recompense) : "—"], ["Date cible", c.date_cible ? fdate(c.date_cible) : "—"], ["Employes affectes", (c.membres_affectes || []).join(", ") || "—"]]);
  if (c.description) { p.section("Objet du contrat"); p.para(c.description); }
  if (c.rapport) { p.section("Rapport de mission"); p.para(c.rapport); }
  p.save(`contrat-${c.titre || "contrat"}-${day()}`);
}

export interface EnqueteItem { id: string; kind: "fiche" | "vehicule" | "note"; x: number; y: number; label: string; sub?: string; img?: string | null; prime?: number }
export async function pdfEnquete(items: EnqueteItem[], links: { a: string; b: string; car?: boolean }[], auteur?: string) {
  const p = await Pdf.create({ kind: "enquete", title: "Tableau d'enquete", subtitle: `${items.filter(i => i.kind === "fiche").length} personne(s) - ${items.filter(i => i.kind === "vehicule").length} vehicule(s) - ${links.length} lien(s)`, classification: "Enquete", signers: [`L'enqueteur|${auteur || ""}`, "Le responsable de dossier|"] });
  const BW = 1500, BH = 920, PW = 124, PH = 150;
  const k = (p.W - 2 * p.M) / BW, H = BH * k;
  const byId = new Map(items.map(i => [i.id, i]));
  p.section("Vue d'ensemble du tableau");
  p.canvas(H, (x0, y0) => {
    const d = p.doc;
    d.setFillColor(58, 42, 28); d.rect(x0, y0, BW * k, H, "F"); d.setDrawColor(110, 80, 50); d.setLineWidth(0.8); d.rect(x0, y0, BW * k, H);
    links.forEach(l => { const a = byId.get(l.a), b = byId.get(l.b); if (!a || !b) return; d.setLineWidth(0.35); if (l.car) { d.setDrawColor(232, 176, 74); d.setLineDashPattern([1.2, 0.8], 0); } else { d.setDrawColor(210, 50, 50); d.setLineDashPattern([], 0); } d.line(x0 + (a.x + PW / 2) * k, y0 + (a.y + 6) * k, x0 + (b.x + PW / 2) * k, y0 + (b.y + 6) * k); });
    d.setLineDashPattern([], 0);
    items.forEach(i => {
      const x = x0 + i.x * k, y = y0 + i.y * k, w = PW * k, h = PH * k;
      d.setFillColor(246, 239, 217); d.rect(x, y, w, h, "F");
      const ix = x + 0.8, iy = y + 0.8, iw = w - 1.6, ih = h * 0.72;
      let ok = false; if (i.img && String(i.img).startsWith("data:image")) { try { d.addImage(i.img, "JPEG", ix, iy, iw, ih); ok = true; } catch { /* ignoré */ } }
      if (!ok) { d.setFillColor(217, 207, 176); d.rect(ix, iy, iw, ih, "F"); d.setFont("helvetica", "bold"); d.setFontSize(9); d.setTextColor(138, 122, 85); d.text(i.kind === "vehicule" ? "V" : "?", ix + iw / 2, iy + ih / 2 + 1.5, { align: "center" }); }
      d.setFont("helvetica", "bold"); d.setFontSize(4.2); d.setTextColor(43, 29, 14);
      const lab = String(i.label || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().slice(0, 22);
      d.text(lab, x + w / 2, y + h - 3.2, { align: "center" });
      if (i.prime && i.prime > 0) { d.setFillColor(176, 36, 48); d.circle(x + w - 1.5, y + 1.5, 1.2, "F"); }
      d.setFillColor(190, 30, 30); d.circle(x + w / 2, y, 0.9, "F");
    });
  });
  const name = (id: string) => byId.get(id)?.label || "?";
  const people = items.filter(i => i.kind === "fiche");
  if (people.length) {
    p.section(`Personnes (${people.length})`);
    p.table(["Nom", "Organisation", "Liens"], people.map(i => [i.label, i.sub || "—", links.filter(l => (l.a === i.id || l.b === i.id)).map(l => (l.car ? "[veh] " : "") + name(l.a === i.id ? l.b : l.a)).join(", ") || "—"]), [48, 44, 82]);
  }
  const cars = items.filter(i => i.kind === "vehicule");
  if (cars.length) { p.section(`Vehicules (${cars.length})`); p.table(["Modele", "Plaque / details", "Assigne a"], cars.map(i => [i.label, i.sub || "—", links.filter(l => l.car && l.b === i.id || l.car && l.a === i.id).map(l => name(l.a === i.id ? l.b : l.a)).join(", ") || "—"]), [60, 54, 60]); }
  const notes = items.filter(i => i.kind === "note" && i.img);
  if (notes.length) { p.section(`Pieces libres (${notes.length})`); for (let n = 0; n < notes.length; n += 3) p.photos(notes.slice(n, n + 3).map((x, j) => ({ url: x.img, label: `Piece ${n + j + 1}`, w: 50, h: 38 }))); }
  p.save(`tableau-enquete-${day()}`);
}
