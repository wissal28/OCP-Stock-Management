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

async function migrateUsersFromCsv() {
  const countResult = await db.execute("SELECT COUNT(*) AS n FROM users");
  if (countResult.rows[0].n > 0) return;
  if (!existsSync(userCsvPath)) return;

  const rows = parseCsv(readFileSync(userCsvPath, "utf8"));
  if (rows.length === 0) return;

  await db.batch(
    rows.map((user) => ({
      sql: `INSERT INTO users (matricule, email, fullName, phone, filiale, fonction, departement, statut, role, photoUrl, passwordSalt, passwordHash, createdAt, updatedAt)
            VALUES (@matricule, @email, @fullName, @phone, @filiale, @fonction, @departement, @statut, @role, @photoUrl, @passwordSalt, @passwordHash, @createdAt, @updatedAt)`,
      args: user
    })),
    "write"
  );
  console.log(`[migrate] ${rows.length} utilisateur(s) importé(s) depuis utilisateur.csv`);
}

async function seedIfEmpty(table, rows, insertSql, mapRow) {
  const countResult = await db.execute(`SELECT COUNT(*) AS n FROM ${table}`);
  if (countResult.rows[0].n > 0) return;
  if (rows.length === 0) return;
  await db.batch(
    rows.map((item) => ({ sql: insertSql, args: mapRow(item) })),
    "write"
  );
  console.log(`[migrate] ${rows.length} ligne(s) de seed insérée(s) dans ${table}`);
}

async function seedModules() {
  await seedIfEmpty(
    "trains",
    seed.TRAINS,
    `INSERT INTO trains (id, dateArriveePrevue, heureArriveePrevue, heureArriveeReelle, numeroTrain, matricule, nombreWagons, qualite, tonnagePrevu, tonnageExpedie, tonnageBascule, statut, destinationPrevue, observations)
     VALUES (@id, @dateArriveePrevue, @heureArriveePrevue, @heureArriveeReelle, @numeroTrain, @matricule, @nombreWagons, @qualite, @tonnagePrevu, @tonnageExpedie, @tonnageBascule, @statut, @destinationPrevue, @observations)`,
    (t) => t
  );

  await seedIfEmpty(
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

  await seedIfEmpty(
    "navires",
    seed.NAVIRES,
    `INSERT INTO navires (id, nom, numeroEC, qualite, poste, dateDebutChargement, heureDebutChargement, dateFinChargement, heureFinChargement, tonnagePrevu, tonnageCharge, statut, observations)
     VALUES (@id, @nom, @numeroEC, @qualite, @poste, @dateDebutChargement, @heureDebutChargement, @dateFinChargement, @heureFinChargement, @tonnagePrevu, @tonnageCharge, @statut, @observations)`,
    (n) => n
  );

  await seedIfEmpty(
    "chargements_portique",
    seed.CHARGEMENTS,
    `INSERT INTO chargements_portique (id, navireId, portique, cale, peseuse, repriseOuDirection, dateDebutAffect, heureDebutAffect, dateFinAffect, heureFinAffect, tonnage)
     VALUES (@id, @navireId, @portique, @cale, @peseuse, @repriseOuDirection, @dateDebutAffect, @heureDebutAffect, @dateFinAffect, @heureFinAffect, @tonnage)`,
    (c) => c
  );

  await seedIfEmpty(
    "arrets_navire",
    seed.ARRETS,
    `INSERT INTO arrets_navire (id, navireId, portique, elementConcerne, nature, dateDebut, heureDebut, dateFin, heureFin, description)
     VALUES (@id, @navireId, @portique, @elementConcerne, @nature, @dateDebut, @heureDebut, @dateFin, @heureFin, @description)`,
    (a) => a
  );

  await seedIfEmpty(
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
async function migrateRepriseOuDirectionCodes() {
  const result = await db.execute("SELECT id, repriseOuDirection FROM chargements_portique");
  const toUpdate = result.rows
    .map((row) => ({ id: row.id, mapped: NUMERIC_TO_CODE[row.repriseOuDirection] }))
    .filter((row) => row.mapped && row.mapped !== undefined);
  if (toUpdate.length === 0) return;
  await db.batch(
    toUpdate.map(({ id, mapped }) => ({
      sql: "UPDATE chargements_portique SET repriseOuDirection = @mapped WHERE id = @id",
      args: { mapped, id }
    })),
    "write"
  );
}

export async function runMigrations() {
  await migrateUsersFromCsv();
  await seedModules();
  await migrateRepriseOuDirectionCodes();
}
