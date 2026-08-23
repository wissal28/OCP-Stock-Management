// Relit database/trains.csv et database/navires.csv — potentiellement modifiés à la main dans un
// tableur — pour les besoins de trainRepository.js / navireRepository.js. Sens inverse de
// csvExport.js. Déclenché uniquement par une action explicite ("Importer depuis CSV" côté UI),
// jamais automatiquement au démarrage, pour ne jamais écraser silencieusement des données plus
// récentes en base avec un fichier CSV resté ouvert/obsolète dans un tableur.

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv } from "./csvUtil.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseDir = path.join(__dirname, "..", "database");

export function readTrainsCsv() {
  const file = path.join(databaseDir, "trains.csv");
  if (!existsSync(file)) return [];
  return parseCsv(readFileSync(file, "utf8"));
}

export function readNaviresCsv() {
  const file = path.join(databaseDir, "navires.csv");
  if (!existsSync(file)) return [];
  return parseCsv(readFileSync(file, "utf8"));
}
