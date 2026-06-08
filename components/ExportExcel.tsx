"use client";

import * as XLSX from "xlsx";

export default function ExportExcel({
  data
}: any) {

  function exporter() {

    const wb =
      XLSX.utils.book_new();

    const ws =
      XLSX.utils.json_to_sheet(
        data
      );

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Dossiers"
    );

    XLSX.writeFile(
      wb,
      "dossiers.xlsx"
    );
  }

  return (
    <button onClick={exporter}>
      Export Excel
    </button>
  );
}
