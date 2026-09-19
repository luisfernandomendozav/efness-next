// Exportación/importación del catálogo de productos en CSV (compatible con
// Excel). El legacy usaba un Excel para importar y un PDF para exportar; aquí
// ambos sentidos usan el mismo formato de columnas, así el archivo exportado
// sirve de plantilla para importar.

export const CSV_HEADERS = [
  "tipo",
  "nombre",
  "marca",
  "codigo_interno",
  "codigo_externo",
  "clave_sat",
  "unidad",
  "precio",
  "palabras_clave",
  "impuestos",
] as const;

export type CsvRow = Record<(typeof CSV_HEADERS)[number], string>;

function escapeCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

export function toCsv(rows: string[][]) {
  const lines = [CSV_HEADERS.join(","), ...rows.map((r) => r.map(escapeCell).join(","))];
  // BOM para que Excel detecte UTF-8.
  return "﻿" + lines.join("\r\n");
}

// Parser CSV mínimo con soporte de comillas; suficiente para los archivos
// que genera la propia exportación o Excel.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

export function rowsToObjects(rows: string[][]): CsvRow[] | null {
  if (rows.length === 0) return null;
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const indexes = CSV_HEADERS.map((h) => header.indexOf(h));
  // Todas las columnas obligatorias deben existir (el orden es libre).
  if (indexes.some((i) => i === -1)) return null;
  return rows.slice(1).map((r) => {
    const obj = {} as CsvRow;
    CSV_HEADERS.forEach((h, j) => {
      obj[h] = (r[indexes[j]] ?? "").trim();
    });
    return obj;
  });
}
