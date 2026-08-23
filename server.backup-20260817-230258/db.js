import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const databaseDir = path.join(rootDir, "database");
export const dbPath = path.join(databaseDir, "ocp-stock.db");

mkdirSync(databaseDir, { recursive: true });

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    matricule TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    fullName TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    filiale TEXT NOT NULL DEFAULT '',
    fonction TEXT NOT NULL DEFAULT '',
    departement TEXT NOT NULL DEFAULT '',
    statut TEXT NOT NULL DEFAULT 'actif',
    role TEXT NOT NULL DEFAULT 'Lecture seule',
    photoUrl TEXT NOT NULL DEFAULT '',
    passwordSalt TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    matricule TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    expiresAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS trains (
    id TEXT PRIMARY KEY,
    dateArriveePrevue TEXT NOT NULL DEFAULT '',
    heureArriveePrevue TEXT NOT NULL DEFAULT '',
    heureArriveeReelle TEXT NOT NULL DEFAULT '',
    numeroTrain TEXT NOT NULL DEFAULT '',
    matricule TEXT NOT NULL DEFAULT '',
    nombreWagons INTEGER NOT NULL DEFAULT 0,
    qualite TEXT NOT NULL DEFAULT '',
    tonnagePrevu INTEGER NOT NULL DEFAULT 0,
    tonnageExpedie INTEGER NOT NULL DEFAULT 0,
    tonnageBascule INTEGER NOT NULL DEFAULT 0,
    statut TEXT NOT NULL DEFAULT '',
    destinationPrevue TEXT NOT NULL DEFAULT '',
    observations TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS dechargements (
    id TEXT PRIMARY KEY,
    trainId TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL DEFAULT '',
    numeroTrain TEXT NOT NULL DEFAULT '',
    matricule TEXT NOT NULL DEFAULT '',
    nombreWagons INTEGER NOT NULL DEFAULT 0,
    tonnageExpedie INTEGER NOT NULL DEFAULT 0,
    tonnageBascule INTEGER NOT NULL DEFAULT 0,
    axe TEXT NOT NULL DEFAULT '',
    debutDechargement TEXT NOT NULL DEFAULT '',
    finDechargement TEXT NOT NULL DEFAULT '',
    da TEXT NOT NULL DEFAULT '[]',
    db TEXT NOT NULL DEFAULT '[]',
    silos TEXT NOT NULL DEFAULT '[]',
    cellules TEXT NOT NULL DEFAULT '[]',
    navireDirect TEXT NOT NULL DEFAULT '[]',
    observations TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS navires (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL DEFAULT '',
    numeroEC TEXT NOT NULL DEFAULT '',
    qualite TEXT NOT NULL DEFAULT '',
    poste TEXT NOT NULL DEFAULT '',
    dateDebutChargement TEXT NOT NULL DEFAULT '',
    heureDebutChargement TEXT NOT NULL DEFAULT '',
    dateFinChargement TEXT NOT NULL DEFAULT '',
    heureFinChargement TEXT NOT NULL DEFAULT '',
    tonnagePrevu INTEGER NOT NULL DEFAULT 0,
    tonnageCharge INTEGER NOT NULL DEFAULT 0,
    statut TEXT NOT NULL DEFAULT '',
    observations TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS chargements_portique (
    id TEXT PRIMARY KEY,
    navireId TEXT NOT NULL DEFAULT '',
    portique TEXT NOT NULL DEFAULT '',
    cale TEXT NOT NULL DEFAULT '',
    peseuse TEXT NOT NULL DEFAULT '',
    repriseOuDirection TEXT NOT NULL DEFAULT '',
    dateDebutAffect TEXT NOT NULL DEFAULT '',
    heureDebutAffect TEXT NOT NULL DEFAULT '',
    dateFinAffect TEXT NOT NULL DEFAULT '',
    heureFinAffect TEXT NOT NULL DEFAULT '',
    tonnage INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS arrets_navire (
    id TEXT PRIMARY KEY,
    navireId TEXT NOT NULL DEFAULT '',
    portique TEXT NOT NULL DEFAULT '',
    elementConcerne TEXT NOT NULL DEFAULT '',
    nature TEXT NOT NULL DEFAULT '',
    dateDebut TEXT NOT NULL DEFAULT '',
    heureDebut TEXT NOT NULL DEFAULT '',
    dateFin TEXT NOT NULL DEFAULT '',
    heureFin TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS arrets_train (
    id TEXT PRIMARY KEY,
    trainId TEXT NOT NULL DEFAULT '',
    axe TEXT NOT NULL DEFAULT '',
    elementConcerne TEXT NOT NULL DEFAULT '',
    nature TEXT NOT NULL DEFAULT '',
    dateDebut TEXT NOT NULL DEFAULT '',
    heureDebut TEXT NOT NULL DEFAULT '',
    dateFin TEXT NOT NULL DEFAULT '',
    heureFin TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS stock_snapshots (
    date TEXT PRIMARY KEY,
    cellules TEXT NOT NULL DEFAULT '[]',
    zones TEXT NOT NULL DEFAULT '[]',
    etatSilos INTEGER NOT NULL DEFAULT 0,
    posteNotes TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS hse_incidents (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL DEFAULT '',
    heure TEXT NOT NULL DEFAULT '',
    zone TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT '',
    gravite TEXT NOT NULL DEFAULT '',
    personnesImpliquees TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    causeProbable TEXT NOT NULL DEFAULT '',
    actionsCorrectives TEXT NOT NULL DEFAULT '',
    statut TEXT NOT NULL DEFAULT '',
    declarePar TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL DEFAULT '',
    updatedAt TEXT NOT NULL DEFAULT '',
    createdBy TEXT NOT NULL DEFAULT '',
    updatedBy TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS hse_inspections (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL DEFAULT '',
    zone TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT '',
    inspecteur TEXT NOT NULL DEFAULT '',
    statut TEXT NOT NULL DEFAULT '',
    checklist TEXT NOT NULL DEFAULT '[]',
    observations TEXT NOT NULL DEFAULT '',
    actionsRequises TEXT NOT NULL DEFAULT '',
    dateProchaineInspection TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL DEFAULT '',
    updatedAt TEXT NOT NULL DEFAULT '',
    createdBy TEXT NOT NULL DEFAULT '',
    updatedBy TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS hse_actions (
    id TEXT PRIMARY KEY,
    titre TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    origine TEXT NOT NULL DEFAULT '',
    origineId TEXT NOT NULL DEFAULT '',
    responsable TEXT NOT NULL DEFAULT '',
    echeance TEXT NOT NULL DEFAULT '',
    priorite TEXT NOT NULL DEFAULT '',
    statut TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL DEFAULT '',
    updatedAt TEXT NOT NULL DEFAULT '',
    createdBy TEXT NOT NULL DEFAULT '',
    updatedBy TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS maintenance_interventions (
    id TEXT PRIMARY KEY,
    equipementCode TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT '',
    statut TEXT NOT NULL DEFAULT '',
    datePrevue TEXT NOT NULL DEFAULT '',
    dateRealisee TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    intervenant TEXT NOT NULL DEFAULT '',
    dureeMinutes INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT '',
    updatedAt TEXT NOT NULL DEFAULT '',
    createdBy TEXT NOT NULL DEFAULT '',
    updatedBy TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    entityType TEXT NOT NULL,
    entityId TEXT NOT NULL,
    action TEXT NOT NULL,
    matricule TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    diff TEXT NOT NULL DEFAULT '{}'
  );
  CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entityType, entityId);
`);

// Colonnes ajoutées après la version initiale du schéma : doivent exister avant que tout autre
// module important `db` ne prépare ses requêtes (les repositories préparent leurs statements dès
// leur import, avant que server/migrate.js#runMigrations() n'ait la moindre chance de s'exécuter) —
// donc ce correctif de schéma doit tourner ici, de façon synchrone, juste après la création des tables.
function ensureColumn(table, column, ddl) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!columns.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}

for (const table of ["trains", "dechargements", "navires", "chargements_portique", "arrets_navire", "arrets_train"]) {
  ensureColumn(table, "createdAt", "createdAt TEXT NOT NULL DEFAULT ''");
  ensureColumn(table, "updatedAt", "updatedAt TEXT NOT NULL DEFAULT ''");
  ensureColumn(table, "createdBy", "createdBy TEXT NOT NULL DEFAULT ''");
  ensureColumn(table, "updatedBy", "updatedBy TEXT NOT NULL DEFAULT ''");
}
ensureColumn("stock_snapshots", "updatedAt", "updatedAt TEXT NOT NULL DEFAULT ''");
ensureColumn("stock_snapshots", "updatedBy", "updatedBy TEXT NOT NULL DEFAULT ''");
ensureColumn("navires", "calesPlan", "calesPlan TEXT NOT NULL DEFAULT '[]'");
ensureColumn("trains", "celluleDestinationPrevue", "celluleDestinationPrevue TEXT NOT NULL DEFAULT '[]'");

export default db;
