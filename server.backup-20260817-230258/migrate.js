// Migration unique exécutée au démarrage du serveur : importe l'ancien CSV utilisateurs dans SQLite
// et pré-remplit trains/navires/stock avec les mêmes données de seed qu'avant (voir seedData.js),
// pour que rien ne change au premier lancement après la bascule vers la base de données.

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db.js";
import * as seed from "./seedData.js";
import { parseCsv } from "./csvUtil.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const userCsvPath = path.join(rootDir, "database", "utilisateur.csv");

function migrateUsersFromCsv() {
  const count = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
  if (count > 0) return;
  if (!existsSync(userCsvPath)) return;

  const rows = parseCsv(readFileSync(userCsvPath, "utf8"));
  if (rows.length === 0) return;

  const insert = db.prepare(`
    INSERT INTO users (matricule, email, fullName, phone, filiale, fonction, departement, statut, role, photoUrl, passwordSalt, passwordHash, createdAt, updatedAt)
    VALUES (@matricule, @email, @fullName, @phone, @filiale, @fonction, @departement, @statut, @role, @photoUrl, @passwordSalt, @passwordHash, @createdAt, @updatedAt)
  `);
  const insertMany = db.transaction((users) => {
    for (const user of users) insert.run(user);
  });
  insertMany(rows);
  console.log(`[migrate] ${rows.length} utilisateur(s) importé(s) depuis utilisateur.csv`);
}

function seedIfEmpty(table, rows, insertSql, mapRow) {
  const count = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
  if (count > 0) return;
  const insert = db.prepare(insertSql);
  const insertMany = db.transaction((items) => {
    for (const item of items) insert.run(mapRow(item));
  });
  insertMany(rows);
  console.log(`[migrate] ${rows.length} ligne(s) de seed insérée(s) dans ${table}`);
}

function seedModules() {
  seedIfEmpty(
    "trains",
    seed.TRAINS,
    `INSERT INTO trains (id, dateArriveePrevue, heureArriveePrevue, heureArriveeReelle, numeroTrain, matricule, nombreWagons, qualite, tonnagePrevu, tonnageExpedie, tonnageBascule, statut, destinationPrevue, observations)
     VALUES (@id, @dateArriveePrevue, @heureArriveePrevue, @heureArriveeReelle, @numeroTrain, @matricule, @nombreWagons, @qualite, @tonnagePrevu, @tonnageExpedie, @tonnageBascule, @statut, @destinationPrevue, @observations)`,
    (t) => t
  );

  seedIfEmpty(
    "dechargements",
    seed.DECHARGEMENTS,
    `INSERT INTO dechargements (id, trainId, date, numeroTrain, matricule, nombreWagons, tonnageExpedie, tonnageBascule, axe, debutDechargement, finDechargement, da, db, silos, cellules, navireDirect, observations)
     VALUES (@id, @trainId, @date, @numeroTrain, @matricule, @nombreWagons, @tonnageExpedie, @tonnageBascule, @axe, @debutDechargement, @finDechargement, @da, @db, @silos, @cellules, @navireDirect, @observations)`,
    (d) => ({
      ...d,
      da: JSON.stringify(d.da),
      db: JSON.stringify(d.db),
      silos: JSON.stringify(d.silos),
      cellules: JSON.stringify(d.cellules),
      navireDirect: JSON.stringify(d.navireDirect)
    })
  );

  seedIfEmpty(
    "navires",
    seed.NAVIRES,
    `INSERT INTO navires (id, nom, numeroEC, qualite, poste, dateDebutChargement, heureDebutChargement, dateFinChargement, heureFinChargement, tonnagePrevu, tonnageCharge, statut, observations)
     VALUES (@id, @nom, @numeroEC, @qualite, @poste, @dateDebutChargement, @heureDebutChargement, @dateFinChargement, @heureFinChargement, @tonnagePrevu, @tonnageCharge, @statut, @observations)`,
    (n) => n
  );

  seedIfEmpty(
    "chargements_portique",
    seed.CHARGEMENTS,
    `INSERT INTO chargements_portique (id, navireId, portique, cale, peseuse, repriseOuDirection, dateDebutAffect, heureDebutAffect, dateFinAffect, heureFinAffect, tonnage)
     VALUES (@id, @navireId, @portique, @cale, @peseuse, @repriseOuDirection, @dateDebutAffect, @heureDebutAffect, @dateFinAffect, @heureFinAffect, @tonnage)`,
    (c) => c
  );

  seedIfEmpty(
    "arrets_navire",
    seed.ARRETS,
    `INSERT INTO arrets_navire (id, navireId, portique, elementConcerne, nature, dateDebut, heureDebut, dateFin, heureFin, description)
     VALUES (@id, @navireId, @portique, @elementConcerne, @nature, @dateDebut, @heureDebut, @dateFin, @heureFin, @description)`,
    (a) => a
  );

  seedIfEmpty(
    "stock_snapshots",
    seed.STOCK_SNAPSHOTS,
    `INSERT INTO stock_snapshots (date, cellules, zones, etatSilos, posteNotes)
     VALUES (@date, @cellules, @zones, @etatSilos, @posteNotes)`,
    (s) => ({ ...s, cellules: JSON.stringify(s.cellules), zones: JSON.stringify(s.zones) })
  );
}

// Table de correspondance n° de reprise (1-21, tel qu'utilisé dans le bordereau Excel "Pesée
// bascules") → code d'équipement du schéma de manutention (mêmes codes que
// src/components/module2/synoptiqueManutentionData.ts et src/components/train/trainData.ts).
// Confirmée avec l'utilisateur avant migration — voir C:\Users\pc\.claude\plans\velvet-soaring-wreath.md.
export const NUMERIC_TO_CODE = {
  "1": "SA211", "2": "SA212", "3": "SA213", "4": "SA221", "5": "SA222", "6": "SA223",
  "7": "SB311", "8": "SB312", "9": "SB313", "10": "SB321", "11": "SB322", "12": "SB323",
  "13": "RC114", "14": "RD114", "15": "RC124", "16": "RD124", "17": "RC134",
  "18": "RA114", "19": "RB114", "20": "RA124", "21": "RB124",
  silos: "SILOS",
  di: "DIRECT"
};

/** Migration ponctuelle et idempotente : réécrit les anciennes valeurs libres de
 * chargements_portique.repriseOuDirection ("1".."21", "silos", "di") vers les codes d'équipement
 * normalisés. Un second passage est un no-op puisque les valeurs sont déjà des codes après le premier. */
function migrateRepriseOuDirectionCodes() {
  const rows = db.prepare("SELECT id, repriseOuDirection FROM chargements_portique").all();
  const update = db.prepare("UPDATE chargements_portique SET repriseOuDirection = ? WHERE id = ?");
  const tx = db.transaction(() => {
    for (const row of rows) {
      const mapped = NUMERIC_TO_CODE[row.repriseOuDirection];
      if (mapped && mapped !== row.repriseOuDirection) update.run(mapped, row.id);
    }
  });
  tx();
}

export function runMigrations() {
  migrateUsersFromCsv();
  seedModules();
  migrateRepriseOuDirectionCodes();
}
