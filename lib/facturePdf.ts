import { MENTIONS_CABINET } from "@/lib/factureMentions";
import { jsPDF } from "jspdf";
import { CABINET_LOGO_PNG } from "@/lib/cabinetLogo";
import { montant } from "@/lib/montant";

// Facture PDF A4 : logo, bloc émetteur et client, lignes, totaux, statut
const OR: [number, number, number] = [176, 138, 62];
const NOIR: [number, number, number] = [24, 24, 27];
const GRIS: [number, number, number] = [110, 110, 118];
const CLAIR: [number, number, number] = [246, 244, 239];
const dateFr = (s?: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR") : "-");
const STATUT: Record<string, { label: string; couleur: [number, number, number] }> = {
  en_attente: { label: "EN ATTENTE", couleur: [176, 138, 62] },
  payee: { label: "PAYÉE", couleur: [60, 140, 90] },
  annulee: { label: "ANNULÉE", couleur: [180, 60, 60] },
};

export function facturePdf(f: any): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const gauche = 16;
  const droite = W - 16;

  // Bandeau : logo à gauche, titre à droite
  doc.addImage(CABINET_LOGO_PNG, "PNG", gauche, 12, 58, 58 * 369 / 676);
  doc.setFont("helvetica", "bold"); doc.setFontSize(26); doc.setTextColor(...NOIR);
  doc.text("FACTURE", droite, 24, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...GRIS);
  doc.text(String(f.numero || ""), droite, 31, { align: "right" });
  doc.text(`Émise le ${dateFr(f.created_at)}`, droite, 37, { align: "right" });
  doc.text(`Échéance : ${dateFr(f.date_echeance)}`, droite, 43, { align: "right" });

  // Filet doré
  doc.setDrawColor(...OR); doc.setLineWidth(0.8); doc.line(gauche, 52, droite, 52);

  // Émetteur et client
  let y = 64;
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...OR);
  doc.text("ÉMETTEUR", gauche, y);
  doc.text("FACTURÉ À", 110, y);
  y += 6;
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...NOIR);
  doc.text("Cabinet Varelli & Associés", gauche, y);
  doc.text(String(f.client_nom || "-"), 110, y);
  y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...GRIS);
  doc.text("Cabinet d'avocats", gauche, y);
  doc.text(`Dossier : ${f.dossier_titre || "-"}`, 110, y);

  // Tableau des prestations
  y = 100;
  doc.setFillColor(...NOIR);
  doc.rect(gauche, y, droite - gauche, 9, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(255, 255, 255);
  doc.text("DÉSIGNATION", gauche + 4, y + 6);
  doc.text("QTÉ", 138, y + 6, { align: "right" });
  doc.text("PRIX UNITAIRE", 170, y + 6, { align: "right" });
  doc.text("TOTAL", droite - 4, y + 6, { align: "right" });
  y += 9;

  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...NOIR);
  (f.lignes || []).forEach((l: any, i: number) => {
    if (y > 225) { doc.addPage(); y = 30; }
    if (i % 2 === 0) { doc.setFillColor(...CLAIR); doc.rect(gauche, y, droite - gauche, 9, "F"); }
    doc.text(String(l.description).slice(0, 75), gauche + 4, y + 6);
    doc.text(String(l.quantite), 138, y + 6, { align: "right" });
    doc.text(montant(l.prix), 170, y + 6, { align: "right" });
    doc.text(montant(l.quantite * l.prix), droite - 4, y + 6, { align: "right" });
    y += 9;
  });
  doc.setDrawColor(...OR); doc.setLineWidth(0.4); doc.line(gauche, y, droite, y);

  // Totaux
  y += 10;
  const tva = (f.montant || 0) - (f.sous_total || 0);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...GRIS);
  doc.text("Sous-total", 130, y); doc.text(montant(f.sous_total), droite - 4, y, { align: "right" }); y += 7;
  if (tva > 0) { doc.text(`TVA (${f.tva_taux} %)`, 130, y); doc.text(montant(tva), droite - 4, y, { align: "right" }); y += 7; }
  doc.setFillColor(...OR); doc.rect(122, y - 1, droite - 122, 13, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(255, 255, 255);
  doc.text("TOTAL", 128, y + 7.5);
  doc.text(montant(f.montant), droite - 4, y + 7.5, { align: "right" });
  y += 22;

  // Statut
  const st = STATUT[f.statut];
  if (st) {
    doc.setDrawColor(...st.couleur); doc.setLineWidth(0.8);
    doc.roundedRect(gauche, y - 6, 50, 11, 2, 2, "S");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...st.couleur);
    doc.text(st.label, gauche + 25, y + 1, { align: "center" });
    y += 14;
  }

  // Note
  if (f.note) {
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...GRIS);
    doc.text(doc.splitTextToSize(`Note : ${f.note}`, droite - gauche), gauche, y);
  }

  // Pied de page
  doc.setDrawColor(...OR); doc.setLineWidth(0.4); doc.line(gauche, 280, droite, 280);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...GRIS);
  doc.text(`${MENTIONS_CABINET.nom} · ${MENTIONS_CABINET.adresse} · ${MENTIONS_CABINET.telephone}`, W / 2, 284, { align: "center" });
  doc.text(doc.splitTextToSize(MENTIONS_CABINET.mention, droite - gauche), W / 2, 288, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}
