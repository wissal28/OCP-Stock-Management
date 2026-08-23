// Service d'export Excel avancé pour la page "Déchargement des trains".
// Génère un vrai classeur .xlsx stylé (fusions, couleurs, bordures, largeurs, formats horaires, formules)
// via ExcelJS, fidèle à la structure du fichier Excel de référence (TRAIN / DA / DB / Silos / Temps + synthèse).

import ExcelJS from "exceljs";
import type { Dechargement, Train } from "./trainData";
import { calculateDailyTotals, getOperationalDayRange } from "./dechargementRules";
import { ALL_COLUMNS, DA_COLUMNS, DB_COLUMNS, FROZEN_COLUMNS, SILOS_COLUMNS, TEMPS_COLUMNS } from "./dechargementGridLayout";

const BLACK = { argb: "FF1A1A1A" };
const THIN_BORDER = { style: "thin" as const, color: BLACK };
const ALL_BORDERS = { top: THIN_BORDER, left: THIN_BORDER, bottom: THIN_BORDER, right: THIN_BORDER };

const FILL_PEACH = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFBE4CF" } };
const FILL_YELLOW_GROUP = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFDF6CF" } };
const FILL_YELLOW_CELL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFFF6B8" } };
const FILL_BLUE = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFCFE0F2" } };
const FILL_ORANGE_FOOTER = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFF6C99A" } };
const FILL_GREEN_FOOTER = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFC3E0AC" } };

function centered(cell: ExcelJS.Cell) {
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  cell.border = ALL_BORDERS;
}

function letterFor(colIndex: number): string {
  let n = colIndex + 1;
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function heureToExcelDate(heure: string): Date | null {
  if (!heure) return null;
  const [h, m] = heure.split(":").map(Number);
  if ([h, m].some((n) => Number.isNaN(n))) return null;
  return new Date(1899, 11, 30, h, m, 0);
}

export async function exportDechargementsToExcelAdvanced(
  dechargements: Dechargement[],
  operationalDay: string,
  trains: Train[] = []
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "OCP Stock — Gestion des trains";
  workbook.created = new Date();

  const range = getOperationalDayRange(operationalDay);
  const sheet = workbook.addWorksheet("Déchargement", {
    views: [{ state: "frozen", xSplit: FROZEN_COLUMNS.length, ySplit: 2 }]
  });

  ALL_COLUMNS.filter((c) => c.key !== "actions").forEach((col, i) => {
    sheet.getColumn(i + 1).width = Math.max(8, Math.round(col.widthNormal / 6.2));
  });

  // Ligne titre
  sheet.mergeCells(1, 1, 1, FROZEN_COLUMNS.length + DA_COLUMNS.length + DB_COLUMNS.length + SILOS_COLUMNS.length + TEMPS_COLUMNS.length);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `STOCKAGE DES TRAINS — Journée d'exploitation ${range.label}`;
  titleCell.font = { bold: true, size: 12 };
  titleCell.alignment = { horizontal: "left", vertical: "middle" };
  sheet.getRow(1).height = 22;

  const headerRow1 = 2;
  const headerRow2 = 3;
  const dataStartRow = 4;

  let col = 1;
  sheet.mergeCells(headerRow1, col, headerRow1, col + FROZEN_COLUMNS.length - 1);
  const trainHeader = sheet.getCell(headerRow1, col);
  trainHeader.value = "TRAIN";
  trainHeader.font = { bold: true };
  trainHeader.fill = FILL_PEACH;
  centered(trainHeader);
  FROZEN_COLUMNS.forEach((c, i) => {
    const cell = sheet.getCell(headerRow2, col + i);
    cell.value = c.label;
    cell.font = { bold: true, size: 9 };
    cell.fill = c.key === "tonnageBascule" ? FILL_BLUE : c.key === "ecart" ? FILL_PEACH : FILL_YELLOW_GROUP;
    centered(cell);
  });
  col += FROZEN_COLUMNS.length;

  for (const [label, block] of [
    ["DA", DA_COLUMNS],
    ["DB", DB_COLUMNS],
    ["Silos", SILOS_COLUMNS]
  ] as const) {
    sheet.mergeCells(headerRow1, col, headerRow1, col + block.length - 1);
    const groupCell = sheet.getCell(headerRow1, col);
    groupCell.value = label;
    groupCell.font = { bold: true };
    groupCell.fill = FILL_YELLOW_GROUP;
    centered(groupCell);
    block.forEach((c, i) => {
      const cell = sheet.getCell(headerRow2, col + i);
      cell.value = c.label;
      cell.font = { bold: true, size: 9 };
      cell.fill = c.key.endsWith("periode") ? FILL_YELLOW_CELL : FILL_YELLOW_GROUP;
      centered(cell);
    });
    col += block.length;
  }

  TEMPS_COLUMNS.forEach((c, i) => {
    sheet.mergeCells(headerRow1, col + i, headerRow2, col + i);
    const cell = sheet.getCell(headerRow1, col + i);
    cell.value = c.label;
    cell.font = { bold: true, size: 9 };
    cell.fill = FILL_PEACH;
    centered(cell);
  });
  col += TEMPS_COLUMNS.length;

  sheet.getRow(headerRow1).height = 20;
  sheet.getRow(headerRow2).height = 18;

  const colLetters = {
    numeroTrain: letterFor(0),
    nombreWagons: letterFor(1),
    tonnageExpedie: letterFor(2),
    tonnageBascule: letterFor(3),
    ecart: letterFor(4),
    axe: letterFor(5),
    daDestination: letterFor(6),
    daQualite: letterFor(7),
    daQuantite: letterFor(8),
    daPeriode: letterFor(9),
    dbDestination: letterFor(10),
    dbQualite: letterFor(11),
    dbQuantite: letterFor(12),
    dbPeriode: letterFor(13),
    silosDestination: letterFor(14),
    silosQualite: letterFor(15),
    silosQuantite: letterFor(16),
    silosPeriode: letterFor(17),
    debut: letterFor(18),
    fin: letterFor(19),
    duree: letterFor(20)
  };

  dechargements.forEach((d, i) => {
    const row = dataStartRow + i;
    const da = d.da[0] ?? { destinations: [], qualite: "", quantite: 0, periode: "" };
    const db = d.db[0] ?? { destinations: [], qualite: "", quantite: 0, periode: "" };
    const silos = d.silos[0] ?? { destinations: [], qualite: "", quantite: 0, periode: "" };

    const values: Record<string, ExcelJS.CellValue> = {
      [colLetters.numeroTrain]: d.numeroTrain,
      [colLetters.nombreWagons]: d.nombreWagons || null,
      [colLetters.tonnageExpedie]: d.tonnageExpedie || null,
      [colLetters.tonnageBascule]: d.tonnageBascule || null,
      [colLetters.ecart]: { formula: `${colLetters.tonnageExpedie}${row}-${colLetters.tonnageBascule}${row}` },
      [colLetters.axe]: d.axe,
      [colLetters.daDestination]: da.destinations.join(" + "),
      [colLetters.daQualite]: da.qualite,
      [colLetters.daQuantite]: da.quantite || null,
      [colLetters.daPeriode]: da.periode,
      [colLetters.dbDestination]: db.destinations.join(" + "),
      [colLetters.dbQualite]: db.qualite,
      [colLetters.dbQuantite]: db.quantite || null,
      [colLetters.dbPeriode]: db.periode,
      [colLetters.silosDestination]: silos.destinations.join(" + "),
      [colLetters.silosQualite]: silos.qualite,
      [colLetters.silosQuantite]: silos.quantite || null,
      [colLetters.silosPeriode]: silos.periode
    };

    for (const [letter, value] of Object.entries(values)) {
      const cell = sheet.getCell(`${letter}${row}`);
      cell.value = value;
      centered(cell);
      if (letter === colLetters.tonnageBascule) cell.fill = FILL_BLUE;
      if (letter === colLetters.ecart) cell.fill = FILL_PEACH;
      if (letter === colLetters.daPeriode || letter === colLetters.dbPeriode || letter === colLetters.silosPeriode) cell.fill = FILL_YELLOW_CELL;
    }

    const debutDate = heureToExcelDate(d.debutDechargement);
    const finDate = heureToExcelDate(d.finDechargement);
    const debutCell = sheet.getCell(`${colLetters.debut}${row}`);
    debutCell.value = debutDate;
    if (debutDate) debutCell.numFmt = "hh:mm";
    centered(debutCell);

    const finCell = sheet.getCell(`${colLetters.fin}${row}`);
    finCell.value = finDate;
    if (finDate) finCell.numFmt = "hh:mm";
    centered(finCell);

    const dureeCell = sheet.getCell(`${colLetters.duree}${row}`);
    if (debutDate && finDate) {
      dureeCell.value = { formula: `MOD(${colLetters.fin}${row}-${colLetters.debut}${row},1)` };
      dureeCell.numFmt = "[h]:mm";
    }
    centered(dureeCell);

    sheet.getRow(row).height = 20;
  });

  const lastDataRow = dataStartRow + dechargements.length - 1;
  const totals = calculateDailyTotals(dechargements, trains);

  const footerLabelRow = lastDataRow + 3;
  const footerValueRow = footerLabelRow + 1;

  interface FooterMetric {
    label: string;
    value: ExcelJS.CellValue;
    fill?: typeof FILL_PEACH;
    numFmt?: string;
  }

  const metrics: FooterMetric[] = dechargements.length
    ? [
        { label: "Nbre de train", value: { formula: `COUNTA(${colLetters.numeroTrain}${dataStartRow}:${colLetters.numeroTrain}${lastDataRow})` }, fill: FILL_ORANGE_FOOTER },
        { label: "Nbre de wagons", value: { formula: `SUM(${colLetters.nombreWagons}${dataStartRow}:${colLetters.nombreWagons}${lastDataRow})` }, fill: FILL_ORANGE_FOOTER },
        { label: "Durée", value: totals.dureeTotaleMinutes / 1440, numFmt: "[h]:mm" },
        { label: "Moyenne", value: totals.dureeMoyenneMinutes / 1440, numFmt: "[h]:mm" },
        { label: "Tonnage DA", value: { formula: `SUM(${colLetters.daQuantite}${dataStartRow}:${colLetters.daQuantite}${lastDataRow})` }, fill: FILL_YELLOW_GROUP },
        { label: "Tonnage DB", value: { formula: `SUM(${colLetters.dbQuantite}${dataStartRow}:${colLetters.dbQuantite}${lastDataRow})` }, fill: FILL_YELLOW_GROUP },
        { label: "Total", value: totals.tonnageTotal, fill: FILL_BLUE },
        { label: "Durée affectation", value: totals.dureeAffectationMinutes / 1440, fill: FILL_GREEN_FOOTER, numFmt: "[h]:mm" },
        { label: "Retard", value: totals.retardMinutes / 1440, numFmt: "[h]:mm" },
        { label: "Cadence (t/h)", value: totals.cadence ?? 0 },
        { label: "TD MAINT + EXPLOIT", value: totals.tdMaintExploitMinutes / 1440, numFmt: "[h]:mm" }
      ]
    : [];

  metrics.forEach((metric, i) => {
    const labelCell = sheet.getCell(footerLabelRow, i + 1);
    labelCell.value = metric.label;
    labelCell.font = { bold: true, size: 9 };
    labelCell.fill = metric.fill ?? FILL_YELLOW_GROUP;
    centered(labelCell);

    const valueCell = sheet.getCell(footerValueRow, i + 1);
    valueCell.value = metric.value;
    valueCell.font = { bold: true };
    if (metric.numFmt) valueCell.numFmt = metric.numFmt;
    centered(valueCell);
  });

  const safeLabel = `${range.startDate}_07h-07h`;
  const filename = `Dechargement_Trains_${safeLabel}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
