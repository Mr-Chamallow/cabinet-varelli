"use client";

import jsPDF from "jspdf";

export default function GenerateFacture({ facture }: any) {

  function downloadPDF() {

    const pdf = new jsPDF();

    pdf.setFontSize(22);
    pdf.text("Cabinet BullHead", 20, 20);

    pdf.setFontSize(12);

    pdf.text(
      "Facture : " + facture.numero,
      20,
      50
    );

    pdf.text(
      "Client : " + facture.client,
      20,
      60
    );

    pdf.text(
      "Montant : " + facture.montant + "$",
      20,
      70
    );

    pdf.save(
      facture.numero + ".pdf"
    );
  }

  return (
    <button onClick={downloadPDF}>
      Télécharger PDF
    </button>
  );
}
