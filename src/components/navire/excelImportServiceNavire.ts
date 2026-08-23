// Service d'import Excel pour le module "Gestion des navires".
// Lit la feuille "Pesée des bascules" (une ligne = une affectation portique/cale) avec ExcelJS,
// même approche que excelImportService.ts (détection d'en-tête par mots-clés, mapping par ancres
// nommées) mais plus simple car la source est un tableau plat, sans blocs répétés.

import ExcelJS from "exceljs";
import { NUMERIC_TO_CODE, type ChargementPortique, type Navire } from "./navireData";

export const IMPORT_TARGET_FIELDS = [
  "navire",
  "portique",
  "cale",
  "peseuse",
  "repriseOuDirection",
  "debutAffect",
  "finAffect",
  "tonnage"
] as const;

export type ImportTargetField = (typeof IMPORT_TARGET_FIELDS)[number];

export interface ImportPreview {
  headers: string[];
  rows: string[][];
  mapping: Partial<Record<ImportTargetField, number>>;
}

const HEADER_KEYWORDS = /navire|portique|^cale$|^pes|rep ou dir|d[ée]b ?affec|fin ?affect|dur[ée]e|tonnage/i;

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "text" in (value as { text?: string })) return String((value as { text?: string }).text ?? "");
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/** Sépare une cellule date+heure ("24/6/26 7:15" ou une Date ExcelJS) en date yyyy-mm-dd et heure HH:mm. */
export function splitDateTime(raw: string): { date: string; heure: string } {
  const text = raw.trim();
  if (!text) return { date: "", heure: "" };

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (isoMatch) {
    const [, y, m, d, h, min] = isoMatch;
    return { date: `${y}-${m}-${d}`, heure: `${h}:${min}` };
  }

  // Format "24/6/26 7:15" ou "24/06/2026 07:45"
  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2})[:h](\d{2})/);
  if (slashMatch) {
    const [, d, m, y, h, min] = slashMatch;
    const year = y.length === 2 ? `20${y}` : y;
    return { date: `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`, heure: `${h.padStart(2, "0")}:${min}` };
  }

  return { date: "", heure: "" };
}

/** Lit le fichier et repère la ligne d'en-têtes (celle qui contient le plus de mots-clés reconnus). */
export async function parseExcelFile(file: File): Promise<ImportPreview> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  // Le classeur de référence range le tableau plat sur la feuille "1 - Pesée bascules" ;
  // à défaut on retombe sur la première feuille du fichier importé.
  const sheet = workbook.worksheets.find((s) => /pes[ée]e/i.test(s.name)) ?? workbook.worksheets[0];
  if (!sheet) return { headers: [], rows: [], mapping: {} };

  let headerRowNumber = 1;
  let bestScore = -1;
  for (let r = 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    let score = 0;
    row.eachCell({ includeEmpty: false }, (cell) => {
      if (HEADER_KEYWORDS.test(cellText(cell.value))) score += 1;
    });
    if (score > bestScore) {
      bestScore = score;
      headerRowNumber = r;
    }
  }

  const headerRow = sheet.getRow(headerRowNumber);
  const headers: string[] = [];
  const colCount = sheet.columnCount || headerRow.cellCount;
  for (let c = 1; c <= colCount; c++) {
    headers.push(cellText(headerRow.getCell(c).value).trim());
  }

  const rows: string[][] = [];
  for (let r = headerRowNumber + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const values: string[] = [];
    let hasContent = false;
    for (let c = 1; c <= colCount; c++) {
      const text = cellText(row.getCell(c).value).trim();
      if (text) hasContent = true;
      values.push(text);
    }
    if (hasContent) rows.push(values);
  }

  return { headers, rows, mapping: detectColumnMapping(headers) };
}

/** Détecte les colonnes du tableau "Pesée bascules" par ancres nommées. */
export function detectColumnMapping(headers: string[]): Partial<Record<ImportTargetField, number>> {
  const mapping: Partial<Record<ImportTargetField, number>> = {};
  const normalized = headers.map((h) => h.toLowerCase().trim());

  const findIndex = (pattern: RegExp) => normalized.findIndex((h) => pattern.test(h));

  const idxNavire = findIndex(/navire/);
  if (idxNavire >= 0) mapping.navire = idxNavire;

  const idxPortique = findIndex(/portique/);
  if (idxPortique >= 0) mapping.portique = idxPortique;

  const idxCale = findIndex(/^cale$/);
  if (idxCale >= 0) mapping.cale = idxCale;

  const idxPes = findIndex(/^pes/);
  if (idxPes >= 0) mapping.peseuse = idxPes;

  const idxRep = findIndex(/rep ou dir|^rep$/);
  if (idxRep >= 0) mapping.repriseOuDirection = idxRep;

  const idxDebut = findIndex(/d[ée]b ?affec/);
  if (idxDebut >= 0) mapping.debutAffect = idxDebut;

  const idxFin = findIndex(/fin ?affect/);
  if (idxFin >= 0) mapping.finAffect = idxFin;

  const idxTonnage = findIndex(/tonnage/);
  if (idxTonnage >= 0) mapping.tonnage = idxTonnage;

  return mapping;
}

export interface ImportError {
  rowNumber: number;
  message: string;
}

export interface ImportResult {
  chargements: ChargementPortique[];
  navireDetected: Pick<Navire, "nom" | "qualite"> | null;
  errors: ImportError[];
}

/** Construit les lignes ChargementPortique à partir de l'aperçu et du mapping validé par l'utilisateur. */
export function buildChargementsFromImport(preview: ImportPreview, mapping: Partial<Record<ImportTargetField, number>>, navireId: string): ImportResult {
  const errors: ImportError[] = [];
  const chargements: ChargementPortique[] = [];
  let navireDetected: Pick<Navire, "nom" | "qualite"> | null = null;

  const get = (row: string[], field: ImportTargetField): string => {
    const idx = mapping[field];
    return idx !== undefined ? (row[idx] ?? "").trim() : "";
  };

  preview.rows.forEach((row, i) => {
    const rowNumber = i + 2;
    const portique = get(row, "portique");
    const tonnageRaw = get(row, "tonnage");
    if (!portique || !tonnageRaw) return; // ligne vide ou placeholder (tonnage "0") — ignorée silencieusement

    const tonnage = Number(tonnageRaw);
    if (Number.isNaN(tonnage) || tonnage <= 0) return;

    const nomNavire = get(row, "navire");
    if (nomNavire && !navireDetected) navireDetected = { nom: nomNavire, qualite: "" };

    const debut = splitDateTime(get(row, "debutAffect"));
    const fin = splitDateTime(get(row, "finAffect"));
    if (!debut.date || !debut.heure) errors.push({ rowNumber, message: `Portique ${portique} : heure de début illisible` });
    if (!fin.date || !fin.heure) errors.push({ rowNumber, message: `Portique ${portique} : heure de fin illisible` });

    const repriseRaw = get(row, "repriseOuDirection").trim().toLowerCase();
    const repriseOuDirection = NUMERIC_TO_CODE[repriseRaw] ?? get(row, "repriseOuDirection");

    chargements.push({
      id: `chg-import-${Date.now()}-${i}`,
      navireId,
      portique,
      cale: get(row, "cale"),
      peseuse: get(row, "peseuse"),
      repriseOuDirection,
      dateDebutAffect: debut.date,
      heureDebutAffect: debut.heure,
      dateFinAffect: fin.date,
      heureFinAffect: fin.heure,
      tonnage
    });
  });

  return { chargements, navireDetected, errors };
}
