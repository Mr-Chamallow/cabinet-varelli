"use client";
import { Pdf, clean, fdate, fday, fusd } from "@/lib/pdf";
import { metierInfo } from "@/lib/fichesMetiers";
import { scoreOf, scoreLabel } from "@/lib/gmApi";

const day = () => new Date().toISOString().slice(0, 10);

// Les notes privées ne sont JAMAIS exportées : le PDF est fait pour être partagé.
export async function pdfFiche(f: any) {
  const m = metierInfo(f.metier);
  const p = await Pdf.create({ title: f.nom, subtitle: `Fiche - ${m.label}${(f.sous_tags || []).length ? " - " + f.sous_tags.join(", ") : ""}`, classification: "Fiche - confidentiel" });
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
  const p = await Pdf.create({ title: d.titre, subtitle: `Tribunal de l'Ombre - dossier ${d.statut}`, classification: "Niveau ecarlate" });
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
  const p = await Pdf.create({ title: `Pacte d'Obsidienne - ${x.organisation}`, subtitle: `Statut : ${x.statut}`, classification: "Pacte - confidentiel" });
  p.section("Parties et duree");
  p.kv([["Organisation", x.organisation], ["Signataire", x.signataire], ["Signe le", fday(x.date_signature)], ["Echeance", x.date_fin ? fday(x.date_fin) : "Sans echeance"]]);
  p.section("Clauses"); p.para(x.clauses || "Aucune clause renseignee.");
  p.section(`Violations (${(x.violations || []).length})`);
  p.list((x.violations || []).map((v: any) => `${v.texte} (${fdate(v.date)})`));
  p.save(`pacte-${x.organisation}-${day()}`);
}

export async function pdfAudit(a: any) {
  const p = await Pdf.create({ title: `Audit de conformite - ${a.organisation}`, subtitle: `Note ${a.note}/10 - ${fdate(a.created_at)}`, classification: "Audit - confidentiel" });
  p.section("Resultat");
  p.kv([["Organisation", a.organisation], ["Note", `${a.note}/10`], ["Realise par", a.created_by], ["Date", fdate(a.created_at)]]);
  p.section("Appreciation"); p.para(a.appreciation || "—");
  if (a.sanction) { p.section("Sanction"); p.kv([["Sanction", a.sanction], ["Jusqu'au", fdate(a.sanction_fin)]]); }
  if (a.notes) { p.section("Notes"); p.para(a.notes); }
  p.save(`audit-${a.organisation}-${day()}`);
}

const TYPE_LABEL: any = { convoi: "Convoi", enchere: "Enchere", alerte: "Lanceur d'alerte", capture: "Capture" };
export async function pdfEvenement(e: any) {
  const p = await Pdf.create({ title: e.titre, subtitle: `${TYPE_LABEL[e.type] || "Evenement"} - ${e.statut}`, classification: "Operation - confidentiel" });
  p.section("Details");
  p.kv([["Type", TYPE_LABEL[e.type]], ["Statut", e.statut], ["Partenaire / cible", e.partenaire], ["Date", fdate(e.date_event)], ["Montant", e.montant ? fusd(e.montant) : "—"], ["Cree par", e.created_by]]);
  if ((e.lots || []).length) { p.section("Lots"); p.table(["Lot", "Depart", "Adjuge", "Gagnant"], e.lots.map((l: any) => [l.nom, fusd(l.mise_depart), l.mise_finale ? fusd(l.mise_finale) : "—", l.gagnant]), [70, 32, 32, 40]); }
  if (e.notes) { p.section("Notes"); p.para(e.notes); }
  p.save(`${e.type}-${e.titre}-${day()}`);
}

// Dossier complet d'une organisation : tout ce que le Consortium sait, en un seul PDF.
export async function pdfOrganisation(org: any, ctx: { pactes: any[]; audits: any[]; dossiers: any[]; evenements: any[]; history: any[]; fiches?: any[] }) {
  const score = scoreOf(ctx.history.map(h => h.delta)); const lab = scoreLabel(score);
  const p = await Pdf.create({ title: `Dossier - ${org.nom}`, subtitle: `${org.categorie || "Organisation"} - reputation ${score}/100 (${lab.label})`, classification: "Dossier complet - confidentiel" });
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
