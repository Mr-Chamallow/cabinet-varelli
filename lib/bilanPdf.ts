import { jsPDF } from "jspdf";
import { CABINET_LOGO_PNG } from "@/lib/cabinetLogo";
import { montant } from "@/lib/montant";

// Bilan PDF : une page, logo, lignes de chiffres
const OR: [number, number, number] = [176, 138, 62];
const NOIR: [number, number, number] = [24, 24, 27];
const GRIS: [number, number, number] = [110, 110, 118];

export function bilanPdf(b: any, libelle: string): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const gauche = 16, droite = 194;
  doc.addImage(CABINET_LOGO_PNG, "PNG", gauche, 12, 50, 50 * 369 / 676);
  doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(...NOIR);
  doc.text("BILAN", droite, 22, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...GRIS);
  doc.text(libelle, droite, 29, { align: "right" });
  doc.setDrawColor(...OR); doc.setLineWidth(0.8); doc.line(gauche, 48, droite, 48);

  const lignes: [string, string][] = [
    ["Factures émises", `${b.factures.emises} (${montant(b.factures.montantEmis)})`],
    ["Encaissé", `${montant(b.factures.encaisse)} sur ${b.factures.encaissees} facture(s) réglée(s)`],
    ["En attente de paiement", `${b.factures.enAttente} facture(s), ${montant(b.factures.montantEnAttente)}`],
    ["Factures en retard", String(b.retards.nombre)],
    ["Dossiers ouverts sur la période", `${b.dossiers.crees} (${b.dossiers.ouverts} encore ouverts)`],
    ["Rendez-vous", `${b.rdv.total} (${b.rdv.confirmes} confirmés, ${b.rdv.annules} annulés)`],
    ["Votes lancés", `${b.votes.lances} (${b.votes.adoptes} adoptés, ${b.votes.rejetes} rejetés)`],
    ["Plaintes internes", String(b.plaintes.nouvelles)],
  ];
  let y = 62;
  lignes.forEach(([label, valeur], i) => {
    if (i % 2 === 0) { doc.setFillColor(246, 244, 239); doc.rect(gauche, y - 6, droite - gauche, 11, "F"); }
    doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(...NOIR);
    doc.text(label, gauche + 4, y + 1);
    doc.setFont("helvetica", "bold");
    doc.text(valeur, droite - 4, y + 1, { align: "right" });
    y += 11;
  });

  doc.setDrawColor(...OR); doc.setLineWidth(0.4); doc.line(gauche, 280, droite, 280);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...GRIS);
  doc.text("Cabinet Varelli & Associés · Bilan généré automatiquement", 105, 286, { align: "center" });
  return Buffer.from(doc.output("arraybuffer"));
}
