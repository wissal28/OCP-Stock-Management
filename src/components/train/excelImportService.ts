// Service d'import Excel pour la page "Déchargement des trains".
// Lit un fichier .xlsx/.xls avec ExcelJS, détecte automatiquement les colonnes TRAIN/DA/DB/Silos/Temps
// (par position, à partir d'ancres nommées comme le fichier Excel de référence), et prépare un aperçu
// mappable avant import réel dans le tableau.

import ExcelJS from "exceljs";
import type { Dechargement, DestinationRow } from "./trainData";
import { civilDateForOperationalDay, isValidHeure, isValidQualite, isValidTonnage } from "./dechargementRules";

export const IMPORT_TARGET_FIELDS = [
  "numeroTrain",
  "nombreWagons",
  "tonnageExpedie",
  "tonnageBascule",
  "axe",
  "da.destination",
  "da.qualite",
  "da.quantite",
  "da.periode",
  "db.destination",
  "db.qualite",
  "db.quantite",
  "db.periode",
  "silos.destination",
  "silos.qualite",
  "silos.quantite",
  "silos.periode",
  "debutDechargement",
  "finDechargement"
] as const;

export type ImportTargetField = (typeof IMPORT_TARGET_FIELDS)[number];

export interface ImportPreview {
  headers: string[];
  rows: string[][];
  mapping: Partial<Record<ImportTargetField, number>>;
}

const HEADER_KEYWORDS = /n°|n\.wg|wagon|t\.?exp|bascule|ecart|axe|destination|qualit|quantit|p[ée]riode|d[ée]but|^fin|dur[ée]e/i;

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "text" in (value as { text?: string })) return String((value as { text?: string }).text ?? "");
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

/** Lit le fichier et repère la ligne d'en-têtes (celle qui contient le plus de mots-clés reconnus). */
export async function parseExcelFile(file: File): Promise<ImportPreview> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { headers: [], rows: [], mapping: {} };

  let headerRowNumber = 1;
  let bestScore = -1;
  const scanLimit = Math.min(sheet.rowCount, 8);
  for (let r = 1; r <= scanLimit; r++) {
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

/** Détecte les colonnes par ancres nommées, puis par position pour les blocs répétés DA/DB/Silos. */
export function detectColumnMapping(headers: string[]): Partial<Record<ImportTargetField, number>> {
  const mapping: Partial<Record<ImportTargetField, number>> = {};
  const normalized = headers.map((h) => h.toLowerCase().trim());

  const findIndex = (pattern: RegExp, from = 0) => {
    for (let i = from; i < normalized.length; i++) {
      if (pattern.test(normalized[i])) return i;
    }
    return -1;
  };

  const idxNumero = findIndex(/^n°?$|^no$|^numero|^n$/);
  if (idxNumero >= 0) mapping.numeroTrain = idxNumero;

  const idxWagons = findIndex(/wg|wagon/);
  if (idxWagons >= 0) mapping.nombreWagons = idxWagons;

  const idxExp = findIndex(/t\.?exp|exp[ée]di/);
  if (idxExp >= 0) mapping.tonnageExpedie = idxExp;

  const idxBascule = findIndex(/bascule/);
  if (idxBascule >= 0) mapping.tonnageBascule = idxBascule;

  const idxAxe = findIndex(/^axe$/);
  if (idxAxe >= 0) mapping.axe = idxAxe;

  const searchFrom = (idxAxe >= 0 ? idxAxe : idxBascule >= 0 ? idxBascule : 0) + 1;
  const idxDaDest = findIndex(/destination/, searchFrom);
  if (idxDaDest >= 0) {
    mapping["da.destination"] = idxDaDest;
    mapping["da.qualite"] = idxDaDest + 1;
    mapping["da.quantite"] = idxDaDest + 2;
    mapping["da.periode"] = idxDaDest + 3;

    const idxDbDest = findIndex(/destination/, idxDaDest + 4);
    if (idxDbDest >= 0) {
      mapping["db.destination"] = idxDbDest;
      mapping["db.qualite"] = idxDbDest + 1;
      mapping["db.quantite"] = idxDbDest + 2;
      mapping["db.periode"] = idxDbDest + 3;

      const idxSilosDest = findIndex(/destination/, idxDbDest + 4);
      if (idxSilosDest >= 0) {
        mapping["silos.destination"] = idxSilosDest;
        mapping["silos.qualite"] = idxSilosDest + 1;
        mapping["silos.quantite"] = idxSilosDest + 2;
        mapping["silos.periode"] = idxSilosDest + 3;
      }
    }
  }

  const idxDebut = findIndex(/d[ée]but/);
  if (idxDebut >= 0) mapping.debutDechargement = idxDebut;
  const idxFin = findIndex(/^fin/);
  if (idxFin >= 0) mapping.finDechargement = idxFin;

  return mapping;
}

export interface ImportError {
  rowNumber: number;
  message: string;
}

export interface ImportResult {
  dechargements: Dechargement[];
  errors: ImportError[];
}

function emptyDestinationRow(): DestinationRow {
  return { destinations: [], qualite: "", quantite: 0, periode: "" };
}

/** Construit les objets Dechargement à partir de l'aperçu et du mapping validé par l'utilisateur. */
export function buildDechargementsFromImport(preview: ImportPreview, mapping: Partial<Record<ImportTargetField, number>>, date: string): ImportResult {
  const errors: ImportError[] = [];
  const dechargements: Dechargement[] = [];

  const get = (row: string[], field: ImportTargetField): string => {
    const idx = mapping[field];
    return idx !== undefined ? (row[idx] ?? "").trim() : "";
  };

  preview.rows.forEach((row, i) => {
    const rowNumber = i + 2;
    const numeroTrain = get(row, "numeroTrain");
    if (!numeroTrain) {
      const hasOtherData = row.some((v) => v.trim());
      if (hasOtherData) errors.push({ rowNumber, message: "Numéro de train manquant — ligne ignorée" });
      return;
    }

    const tonnageExpedieRaw = get(row, "tonnageExpedie");
    const tonnageBasculeRaw = get(row, "tonnageBascule");
    if (!isValidTonnage(tonnageExpedieRaw)) errors.push({ rowNumber, message: `Train ${numeroTrain} : tonnage expédié non numérique` });
    if (!isValidTonnage(tonnageBasculeRaw)) errors.push({ rowNumber, message: `Train ${numeroTrain} : tonnage bascule non numérique` });

    const debut = get(row, "debutDechargement");
    const fin = get(row, "finDechargement");
    if (debut && !isValidHeure(debut)) errors.push({ rowNumber, message: `Train ${numeroTrain} : heure de début invalide (${debut})` });
    if (fin && !isValidHeure(fin)) errors.push({ rowNumber, message: `Train ${numeroTrain} : heure de fin invalide (${fin})` });

    const buildRow = (prefix: "da" | "db" | "silos"): DestinationRow => {
      const destinationRaw = get(row, `${prefix}.destination` as ImportTargetField);
      // Plusieurs destinations simultanées peuvent être séparées par "+" ou "," dans le fichier Excel.
      const destinations = destinationRaw
        .split(/[+,]/)
        .map((v) => v.trim())
        .filter(Boolean);
      const qualite = get(row, `${prefix}.qualite` as ImportTargetField).toUpperCase();
      const quantiteRaw = get(row, `${prefix}.quantite` as ImportTargetField);
      const periode = get(row, `${prefix}.periode` as ImportTargetField);
      if (qualite && !isValidQualite(qualite)) errors.push({ rowNumber, message: `Train ${numeroTrain} : qualité ${prefix.toUpperCase()} invalide (${qualite})` });
      if (destinations.length === 0 && !qualite && !quantiteRaw && !periode) return emptyDestinationRow();
      return { destinations, qualite, quantite: Number(quantiteRaw) || 0, periode };
    };

    const id = `dech-import-${numeroTrain}-${Date.now()}-${i}`;
    // Une heure de début avant 7h00 doit être datée du lendemain civil pour rester dans la même
    // journée d'exploitation `date` (7h → 7h), sinon la ligne dériverait vers la veille.
    const rowDate = civilDateForOperationalDay(date, isValidHeure(debut) ? debut : "");
    dechargements.push({
      id,
      trainId: id,
      date: rowDate,
      numeroTrain,
      matricule: numeroTrain,
      nombreWagons: Number(get(row, "nombreWagons")) || 0,
      tonnageExpedie: Number(tonnageExpedieRaw) || 0,
      tonnageBascule: Number(tonnageBasculeRaw) || 0,
      axe: get(row, "axe"),
      debutDechargement: isValidHeure(debut) ? debut : "",
      finDechargement: isValidHeure(fin) ? fin : "",
      da: [buildRow("da")],
      db: [buildRow("db")],
      silos: [buildRow("silos")],
      cellules: [],
      navireDirect: [],
      observations: ""
    });
  });

  return { dechargements, errors };
}
