import { db } from "./db.js";
import { recordAudit } from "./auditRepository.js";
import { exportTrainsToCsv } from "./csvExport.js";
import { readTrainsCsv } from "./csvImport.js";

function parseTrain(row) {
  return { ...row, celluleDestinationPrevue: JSON.parse(row.celluleDestinationPrevue ?? "[]") };
}

function serializeTrain(t) {
  return { ...t, celluleDestinationPrevue: JSON.stringify(t.celluleDestinationPrevue ?? []) };
}

const selectAllTrains = db.prepare("SELECT * FROM trains ORDER BY dateArriveePrevue ASC, heureArriveePrevue ASC");
function syncTrainsCsv() {
  exportTrainsToCsv(selectAllTrains.all().map(parseTrain));
}
const selectTrainById = db.prepare("SELECT * FROM trains WHERE id = ?");
const insertTrain = db.prepare(`
  INSERT INTO trains (id, dateArriveePrevue, heureArriveePrevue, heureArriveeReelle, numeroTrain, matricule, nombreWagons, qualite, tonnagePrevu, tonnageExpedie, tonnageBascule, statut, destinationPrevue, celluleDestinationPrevue, observations, createdAt, updatedAt, createdBy, updatedBy)
  VALUES (@id, @dateArriveePrevue, @heureArriveePrevue, @heureArriveeReelle, @numeroTrain, @matricule, @nombreWagons, @qualite, @tonnagePrevu, @tonnageExpedie, @tonnageBascule, @statut, @destinationPrevue, @celluleDestinationPrevue, @observations, @createdAt, @updatedAt, @createdBy, @updatedBy)
`);
const updateTrainStmt = db.prepare(`
  UPDATE trains SET dateArriveePrevue=@dateArriveePrevue, heureArriveePrevue=@heureArriveePrevue, heureArriveeReelle=@heureArriveeReelle,
    numeroTrain=@numeroTrain, matricule=@matricule, nombreWagons=@nombreWagons, qualite=@qualite, tonnagePrevu=@tonnagePrevu,
    tonnageExpedie=@tonnageExpedie, tonnageBascule=@tonnageBascule, statut=@statut, destinationPrevue=@destinationPrevue,
    celluleDestinationPrevue=@celluleDestinationPrevue, observations=@observations, updatedAt=@updatedAt, updatedBy=@updatedBy
  WHERE id=@id
`);
const deleteTrainStmt = db.prepare("DELETE FROM trains WHERE id = ?");
const deleteArretsTrainByTrainStmt = db.prepare("DELETE FROM arrets_train WHERE trainId = ?");

function withAuditFields(row, actorMatricule) {
  const now = new Date().toISOString();
  return { ...row, createdAt: now, updatedAt: now, createdBy: actorMatricule || "", updatedBy: actorMatricule || "" };
}

export async function listTrains() {
  return selectAllTrains.all().map(parseTrain);
}

export async function createTrain(train, actorMatricule) {
  const now = new Date().toISOString();
  const row = { ...train, celluleDestinationPrevue: train.celluleDestinationPrevue ?? [], createdAt: now, updatedAt: now, createdBy: actorMatricule || "", updatedBy: actorMatricule || "" };
  insertTrain.run(serializeTrain(row));
  recordAudit({ entityType: "train", entityId: train.id, action: "create", matricule: actorMatricule, diff: train });
  syncTrainsCsv();
  return row;
}

export async function updateTrain(id, patch, actorMatricule) {
  const existing = selectTrainById.get(id);
  if (!existing) {
    const error = new Error("Train introuvable.");
    error.status = 404;
    throw error;
  }
  const merged = { ...parseTrain(existing), ...patch, id, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  updateTrainStmt.run(serializeTrain(merged));
  recordAudit({ entityType: "train", entityId: id, action: "update", matricule: actorMatricule, diff: patch });
  syncTrainsCsv();
  return merged;
}

/** Supprime le train et, en cascade, ses arrêts (pas de contrainte FK dans ce schéma — la cascade
 * est faite explicitement ici pour ne pas laisser de lignes orphelines, comme pour deleteNavire). */
export async function deleteTrain(id, actorMatricule) {
  const result = deleteTrainStmt.run(id);
  if (result.changes === 0) {
    const error = new Error("Train introuvable.");
    error.status = 404;
    throw error;
  }
  const arretsDeleted = deleteArretsTrainByTrainStmt.run(id).changes;
  recordAudit({ entityType: "train", entityId: id, action: "delete", matricule: actorMatricule, diff: { arretsDeleted } });
  syncTrainsCsv();
  return { ok: true, arretsDeleted };
}

const TRAIN_NUMBER_FIELDS = ["nombreWagons", "tonnagePrevu", "tonnageExpedie", "tonnageBascule"];

function normalizeTrainCsvRow(raw) {
  const row = { ...raw };
  for (const field of TRAIN_NUMBER_FIELDS) row[field] = Number(row[field]) || 0;
  try {
    row.celluleDestinationPrevue = row.celluleDestinationPrevue ? JSON.parse(row.celluleDestinationPrevue) : [];
  } catch {
    row.celluleDestinationPrevue = [];
  }
  delete row.createdAt;
  delete row.updatedAt;
  delete row.createdBy;
  delete row.updatedBy;
  return row;
}

/** Relit database/trains.csv (potentiellement modifié à la main) et réconcilie chaque ligne avec la
 * base : met à jour les trains existants (par id), crée ceux qui n'existent pas encore. Déclenché
 * par le bouton "Importer depuis CSV" — jamais automatique. */
export async function importTrainsFromCsv(actorMatricule) {
  const rows = readTrainsCsv();
  let created = 0;
  let updated = 0;
  for (const raw of rows) {
    if (!raw.id) continue;
    const train = normalizeTrainCsvRow(raw);
    const existing = selectTrainById.get(train.id);
    if (existing) {
      await updateTrain(train.id, train, actorMatricule);
      updated += 1;
    } else {
      await createTrain(train, actorMatricule);
      created += 1;
    }
  }
  return { created, updated, total: rows.length };
}

function parseDechargement(row) {
  return {
    ...row,
    da: JSON.parse(row.da),
    db: JSON.parse(row.db),
    silos: JSON.parse(row.silos),
    cellules: JSON.parse(row.cellules),
    navireDirect: JSON.parse(row.navireDirect)
  };
}

function serializeDechargement(d) {
  return {
    ...d,
    da: JSON.stringify(d.da ?? []),
    db: JSON.stringify(d.db ?? []),
    silos: JSON.stringify(d.silos ?? []),
    cellules: JSON.stringify(d.cellules ?? []),
    navireDirect: JSON.stringify(d.navireDirect ?? [])
  };
}

const selectAllDechargements = db.prepare("SELECT * FROM dechargements ORDER BY date ASC, debutDechargement ASC");
const insertDechargement = db.prepare(`
  INSERT INTO dechargements (id, trainId, date, numeroTrain, matricule, nombreWagons, tonnageExpedie, tonnageBascule, axe, debutDechargement, finDechargement, da, db, silos, cellules, navireDirect, observations, createdAt, updatedAt, createdBy, updatedBy)
  VALUES (@id, @trainId, @date, @numeroTrain, @matricule, @nombreWagons, @tonnageExpedie, @tonnageBascule, @axe, @debutDechargement, @finDechargement, @da, @db, @silos, @cellules, @navireDirect, @observations, @createdAt, @updatedAt, @createdBy, @updatedBy)
`);
const selectDechargementById = db.prepare("SELECT * FROM dechargements WHERE id = ?");
const updateDechargementStmt = db.prepare(`
  UPDATE dechargements SET trainId=@trainId, date=@date, numeroTrain=@numeroTrain, matricule=@matricule, nombreWagons=@nombreWagons,
    tonnageExpedie=@tonnageExpedie, tonnageBascule=@tonnageBascule, axe=@axe, debutDechargement=@debutDechargement,
    finDechargement=@finDechargement, da=@da, db=@db, silos=@silos, cellules=@cellules, navireDirect=@navireDirect, observations=@observations,
    updatedAt=@updatedAt, updatedBy=@updatedBy
  WHERE id=@id
`);
const deleteDechargementStmt = db.prepare("DELETE FROM dechargements WHERE id = ?");

export async function listDechargements() {
  return selectAllDechargements.all().map(parseDechargement);
}

export async function createDechargement(dechargement, actorMatricule) {
  const now = new Date().toISOString();
  const row = { ...dechargement, createdAt: now, updatedAt: now, createdBy: actorMatricule || "", updatedBy: actorMatricule || "" };
  insertDechargement.run(serializeDechargement(row));
  recordAudit({ entityType: "dechargement", entityId: dechargement.id, action: "create", matricule: actorMatricule, diff: dechargement });
  return row;
}

export async function updateDechargement(id, patch, actorMatricule) {
  const existing = selectDechargementById.get(id);
  if (!existing) {
    const error = new Error("Déchargement introuvable.");
    error.status = 404;
    throw error;
  }
  const merged = { ...parseDechargement(existing), ...patch, id, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  updateDechargementStmt.run(serializeDechargement(merged));
  recordAudit({ entityType: "dechargement", entityId: id, action: "update", matricule: actorMatricule, diff: patch });
  return merged;
}

export async function deleteDechargement(id, actorMatricule) {
  const result = deleteDechargementStmt.run(id);
  if (result.changes === 0) {
    const error = new Error("Déchargement introuvable.");
    error.status = 404;
    throw error;
  }
  recordAudit({ entityType: "dechargement", entityId: id, action: "delete", matricule: actorMatricule, diff: {} });
  return { ok: true };
}

const selectAllArretsTrain = db.prepare("SELECT * FROM arrets_train ORDER BY dateDebut DESC, heureDebut DESC");
const selectArretTrainById = db.prepare("SELECT * FROM arrets_train WHERE id = ?");
const insertArretTrain = db.prepare(`
  INSERT INTO arrets_train (id, trainId, axe, elementConcerne, nature, dateDebut, heureDebut, dateFin, heureFin, description, createdAt, updatedAt, createdBy, updatedBy)
  VALUES (@id, @trainId, @axe, @elementConcerne, @nature, @dateDebut, @heureDebut, @dateFin, @heureFin, @description, @createdAt, @updatedAt, @createdBy, @updatedBy)
`);
const updateArretTrainStmt = db.prepare(`
  UPDATE arrets_train SET trainId=@trainId, axe=@axe, elementConcerne=@elementConcerne, nature=@nature,
    dateDebut=@dateDebut, heureDebut=@heureDebut, dateFin=@dateFin, heureFin=@heureFin, description=@description,
    updatedAt=@updatedAt, updatedBy=@updatedBy
  WHERE id=@id
`);
const deleteArretTrainStmt = db.prepare("DELETE FROM arrets_train WHERE id = ?");

export async function listArretsTrain() {
  return selectAllArretsTrain.all();
}

export async function createArretTrain(arret, actorMatricule) {
  const row = withAuditFields(arret, actorMatricule);
  insertArretTrain.run(row);
  recordAudit({ entityType: "arret-train", entityId: arret.id, action: "create", matricule: actorMatricule, diff: arret });
  return row;
}

export async function updateArretTrain(id, patch, actorMatricule) {
  const existing = selectArretTrainById.get(id);
  if (!existing) {
    const error = new Error("Arrêt introuvable.");
    error.status = 404;
    throw error;
  }
  const merged = { ...existing, ...patch, id, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  updateArretTrainStmt.run(merged);
  recordAudit({ entityType: "arret-train", entityId: id, action: "update", matricule: actorMatricule, diff: patch });
  return merged;
}

export async function deleteArretTrain(id, actorMatricule) {
  const result = deleteArretTrainStmt.run(id);
  if (result.changes === 0) {
    const error = new Error("Arrêt introuvable.");
    error.status = 404;
    throw error;
  }
  recordAudit({ entityType: "arret-train", entityId: id, action: "delete", matricule: actorMatricule, diff: {} });
  return { ok: true };
}
