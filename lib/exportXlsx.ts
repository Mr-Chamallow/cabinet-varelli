import * as XLSX from "xlsx";

// Exporte une ou plusieurs feuilles Excel : exportXlsx("compta", { Historique: [...], Amendes: [...] })
export function exportXlsx(filename: string, sheets: Record<string, Record<string, any>[]>) {
  const wb = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, rows]) => {
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ info: "Aucune donnée" }]);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}-${stamp}.xlsx`);
}
