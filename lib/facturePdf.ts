import { jsPDF } from "jspdf";

// Génère le PDF d'une facture (A4). Montants en EUR, sans caractères spéciaux.
const somme = (n: number) => Number(n || 0).toFixed(2).replace(".", ",") + " EUR";
const dateFr = (s?: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR") : "-");
const STATUT: Record<string, string> = { en_attente: "En attente de paiement", payee: "Payee", annulee: "Annulee" };

export function facturePdf(f: any): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marge = 15;
  let y = 20;

  doc.setFont("helvetica", "bold"); doc.setFontSize(18);
  doc.text("Cabinet Varelli & Associés", marge, y); y += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text("& Associés", marge, y); y += 14;

  doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text(`Facture ${f.numero || ""}`, marge, y); y += 8;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text(`Date d'émission : ${dateFr(f.created_at)}`, marge, y); y += 5;
  doc.text(`Échéance : ${dateFr(f.date_echeance)}`, marge, y); y += 5;
  doc.text(`Statut : ${STATUT[f.statut] || f.statut}`, marge, y); y += 10;

  doc.setFont("helvetica", "bold"); doc.text("Client", marge, y); y += 5;
  doc.setFont("helvetica", "normal");
  doc.text(String(f.client_nom || "-"), marge, y); y += 5;
  doc.text(`Dossier : ${f.dossier_titre || "-"}`, marge, y); y += 12;

  doc.setFont("helvetica", "bold");
  doc.text("Désignation", marge, y);
  doc.text("Qté", 125, y, { align: "right" });
  doc.text("Prix unitaire", 160, y, { align: "right" });
  doc.text("Total", 195, y, { align: "right" });
  y += 2; doc.line(marge, y, 195, y); y += 6;

  doc.setFont("helvetica", "normal");
  for (const l of f.lignes || []) {
    doc.text(String(l.description).slice(0, 70), marge, y);
    doc.text(String(l.quantite), 125, y, { align: "right" });
    doc.text(somme(l.prix), 160, y, { align: "right" });
    doc.text(somme(l.quantite * l.prix), 195, y, { align: "right" });
    y += 7;
  }
  y += 3; doc.line(125, y, 195, y); y += 7;

  doc.text("Sous-total", 160, y, { align: "right" }); doc.text(somme(f.sous_total), 195, y, { align: "right" }); y += 6;
  doc.text(`TVA (${f.tva_taux || 0} %)`, 160, y, { align: "right" }); doc.text(somme((f.montant || 0) - (f.sous_total || 0)), 195, y, { align: "right" }); y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Total à payer", 160, y, { align: "right" }); doc.text(somme(f.montant), 195, y, { align: "right" }); y += 12;

  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  if (f.note) doc.text(doc.splitTextToSize(`Note : ${f.note}`, 180), marge, y);

  doc.setFontSize(8);
  doc.text("Cabinet Varelli & Associés", marge, 285);
  return Buffer.from(doc.output("arraybuffer"));
}
