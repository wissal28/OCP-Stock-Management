// Écrit la liste des navires / trains dans des fichiers CSV sous database/, en plus de la base
// SQLite (qui reste la source de vérité) — même dossier que utilisateur.csv, pour que ces listes
// restent consultables/portables (Excel, tableur) comme au format d'origine. Régénérés en entier à
// chaque écriture (create/update/delete), pas d'ajout incrémental, pour rester toujours exacts.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseDir = path.join(__dirname, "..", "database");

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(fileName, columns, rows) {
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((col) => csvEscape(row[col])).join(","));
  }
  writeFileSync(path.join(databaseDir, fileName), lines.join("\n") + "\n", "utf8");
}

const TRAIN_COLUMNS = [
  "id", "dateArriveePrevue", "heureArriveePrevue", "heureArriveeReelle", "numeroTrain", "matricule",
  "nombreWagons", "qualite", "tonnagePrevu", "tonnageExpedie", "tonnageBascule", "statut",
  "destinationPrevue", "celluleDestinationPrevue", "observations", "createdAt", "updatedAt", "createdBy", "updatedBy"
];

const NAVIRE_COLUMNS = [
  "id", "nom", "numeroEC", "qualite", "poste", "dateDebutChargement", "heureDebutChargement",
  "dateFinChargement", "heureFinChargement", "tonnagePrevu", "tonnageCharge", "statut", "observations",
  "calesPlan", "createdAt", "updatedAt", "createdBy", "updatedBy"
];

export function exportTrainsToCsv(trains) {
  const rows = trains.map((t) => ({ ...t, celluleDestinationPrevue: JSON.stringify(t.celluleDestinationPrevue ?? []) }));
  writeCsv("trains.csv", TRAIN_COLUMNS, rows);
}

export function exportNaviresToCsv(navires) {
  const rows = navires.map((n) => ({ ...n, calesPlan: JSON.stringify(n.calesPlan ?? []) }));
  writeCsv("navires.csv", NAVIRE_COLUMNS, rows);
}
