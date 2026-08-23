import { db } from "./db.js";
import { recordAudit } from "./auditRepository.js";
import { exportNaviresToCsv } from "./csvExport.js";
import { readNaviresCsv } from "./csvImport.js";

function parseNavire(row) {
  return { ...row, calesPlan: JSON.parse(row.calesPlan ?? "[]") };
}

function serializeNavire(n) {
  return { ...n, calesPlan: JSON.stringify(n.calesPlan ?? []) };
}

const selectAllNavires = db.prepare("SELECT * FROM navires ORDER BY dateDebutChargement ASC, heureDebutChargement ASC");
function syncNaviresCsv() {
  exportNaviresToCsv(selectAllNavires.all().map(parseNavire));
}
const insertNavire = db.prepare(`
  INSERT INTO navires (id, nom, numeroEC, qualite, poste, dateDebutChargement, heureDebutChargement, dateFinChargement, heureFinChargement, tonnagePrevu, tonnageCharge, statut, observations, calesPlan, createdAt, updatedAt, createdBy, updatedBy)
  VALUES (@id, @nom, @numeroEC, @qualite, @poste, @dateDebutChargement, @heureDebutChargement, @dateFinChargement, @heureFinChargement, @tonnagePrevu, @tonnageCharge, @statut, @observations, @calesPlan, @createdAt, @updatedAt, @createdBy, @updatedBy)
`);
const selectNavireById = db.prepare("SELECT * FROM navires WHERE id = ?");
const updateNavireStmt = db.prepare(`
  UPDATE navires SET nom=@nom, numeroEC=@numeroEC, qualite=@qualite, poste=@poste, dateDebutChargement=@dateDebutChargement,
    heureDebutChargement=@heureDebutChargement, dateFinChargement=@dateFinChargement, heureFinChargement=@heureFinChargement,
    tonnagePrevu=@tonnagePrevu, tonnageCharge=@tonnageCharge, statut=@statut, observations=@observations, calesPlan=@calesPlan,
    updatedAt=@updatedAt, updatedBy=@updatedBy
  WHERE id=@id
`);
const deleteNavireStmt = db.prepare("DELETE FROM navires WHERE id = ?");
const deleteChargementsByNavireStmt = db.prepare("DELETE FROM chargements_portique WHERE navireId = ?");
const deleteArretsByNavireStmt = db.prepare("DELETE FROM arrets_navire WHERE navireId = ?");

export async function listNavires() {
  return selectAllNavires.all().map(parseNavire);
}

export async function createNavire(navire, actorMatricule) {
  const now = new Date().toISOString();
  const row = { ...navire, calesPlan: navire.calesPlan ?? [], createdAt: now, updatedAt: now, createdBy: actorMatricule || "", updatedBy: actorMatricule || "" };
  insertNavire.run(serializeNavire(row));
  recordAudit({ entityType: "navire", entityId: navire.id, action: "create", matricule: actorMatricule, diff: navire });
  syncNaviresCsv();
  return row;
}

export async function updateNavire(id, patch, actorMatricule) {
  const existing = selectNavireById.get(id);
  if (!existing) {
    const error = new Error("Navire introuvable.");
    error.status = 404;
    throw error;
  }
  const merged = { ...parseNavire(existing), ...patch, id, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  updateNavireStmt.run(serializeNavire(merged));
  recordAudit({ entityType: "navire", entityId: id, action: "update", matricule: actorMatricule, diff: patch });
  syncNaviresCsv();
  return merged;
}

/** Supprime le navire et, en cascade, ses lignes de chargement et ses arrêts (pas de contrainte FK
 * dans ce schéma — la cascade est faite explicitement ici pour ne pas laisser de lignes orphelines). */
export async function deleteNavire(id, actorMatricule) {
  const existing = selectNavireById.get(id);
  if (!existing) {
    const error = new Error("Navire introuvable.");
    error.status = 404;
    throw error;
  }
  const chargementsDeleted = deleteChargementsByNavireStmt.run(id).changes;
  const arretsDeleted = deleteArretsByNavireStmt.run(id).changes;
  deleteNavireStmt.run(id);
  recordAudit({ entityType: "navire", entityId: id, action: "delete", matricule: actorMatricule, diff: { chargementsDeleted, arretsDeleted } });
  syncNaviresCsv();
  return { ok: true, chargementsDeleted, arretsDeleted };
}

const NAVIRE_NUMBER_FIELDS = ["tonnagePrevu", "tonnageCharge"];

function normalizeNavireCsvRow(raw) {
  const row = { ...raw };
  for (const field of NAVIRE_NUMBER_FIELDS) row[field] = Number(row[field]) || 0;
  try {
    row.calesPlan = row.calesPlan ? JSON.parse(row.calesPlan) : [];
  } catch {
    row.calesPlan = [];
  }
  delete row.createdAt;
  delete row.updatedAt;
  delete row.createdBy;
  delete row.updatedBy;
  return row;
}

/** Relit database/navires.csv (potentiellement modifié à la main) et réconcilie chaque ligne avec la
 * base : met à jour les navires existants (par id), crée ceux qui n'existent pas encore. Déclenché
 * par le bouton "Importer depuis CSV" — jamais automatique. */
export async function importNaviresFromCsv(actorMatricule) {
  const rows = readNaviresCsv();
  let created = 0;
  let updated = 0;
  for (const raw of rows) {
    if (!raw.id) continue;
    const navire = normalizeNavireCsvRow(raw);
    const existing = selectNavireById.get(navire.id);
    if (existing) {
      await updateNavire(navire.id, navire, actorMatricule);
      updated += 1;
    } else {
      await createNavire(navire, actorMatricule);
      created += 1;
    }
  }
  return { created, updated, total: rows.length };
}

const selectAllChargements = db.prepare("SELECT * FROM chargements_portique ORDER BY dateDebutAffect ASC, heureDebutAffect ASC");
const insertChargement = db.prepare(`
  INSERT INTO chargements_portique (id, navireId, portique, cale, peseuse, repriseOuDirection, dateDebutAffect, heureDebutAffect, dateFinAffect, heureFinAffect, tonnage, createdAt, updatedAt, createdBy, updatedBy)
  VALUES (@id, @navireId, @portique, @cale, @peseuse, @repriseOuDirection, @dateDebutAffect, @heureDebutAffect, @dateFinAffect, @heureFinAffect, @tonnage, @createdAt, @updatedAt, @createdBy, @updatedBy)
`);
const selectChargementById = db.prepare("SELECT * FROM chargements_portique WHERE id = ?");
const updateChargementStmt = db.prepare(`
  UPDATE chargements_portique SET navireId=@navireId, portique=@portique, cale=@cale, peseuse=@peseuse,
    repriseOuDirection=@repriseOuDirection, dateDebutAffect=@dateDebutAffect, heureDebutAffect=@heureDebutAffect,
    dateFinAffect=@dateFinAffect, heureFinAffect=@heureFinAffect, tonnage=@tonnage, updatedAt=@updatedAt, updatedBy=@updatedBy
  WHERE id=@id
`);
const deleteChargementStmt = db.prepare("DELETE FROM chargements_portique WHERE id = ?");

function withAuditFields(row, actorMatricule) {
  const now = new Date().toISOString();
  return { ...row, createdAt: now, updatedAt: now, createdBy: actorMatricule || "", updatedBy: actorMatricule || "" };
}

export async function listChargements() {
  return selectAllChargements.all();
}

export async function createChargement(chargement, actorMatricule) {
  const row = withAuditFields(chargement, actorMatricule);
  insertChargement.run(row);
  recordAudit({ entityType: "chargement", entityId: chargement.id, action: "create", matricule: actorMatricule, diff: chargement });
  return row;
}

export async function createChargementsBulk(chargements, actorMatricule) {
  const rows = chargements.map((c) => withAuditFields(c, actorMatricule));
  const insertMany = db.transaction((items) => {
    for (const row of items) insertChargement.run(row);
  });
  insertMany(rows);
  for (const c of chargements) recordAudit({ entityType: "chargement", entityId: c.id, action: "create", matricule: actorMatricule, diff: c });
  return rows;
}

export async function updateChargement(id, patch, actorMatricule) {
  const existing = selectChargementById.get(id);
  if (!existing) {
    const error = new Error("Ligne de chargement introuvable.");
    error.status = 404;
    throw error;
  }
  const merged = { ...existing, ...patch, id, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  updateChargementStmt.run(merged);
  recordAudit({ entityType: "chargement", entityId: id, action: "update", matricule: actorMatricule, diff: patch });
  return merged;
}

export async function deleteChargement(id, actorMatricule) {
  const result = deleteChargementStmt.run(id);
  if (result.changes === 0) {
    const error = new Error("Ligne de chargement introuvable.");
    error.status = 404;
    throw error;
  }
  recordAudit({ entityType: "chargement", entityId: id, action: "delete", matricule: actorMatricule, diff: {} });
  return { ok: true };
}

const selectAllArrets = db.prepare("SELECT * FROM arrets_navire ORDER BY dateDebut DESC, heureDebut DESC");
const selectArretById = db.prepare("SELECT * FROM arrets_navire WHERE id = ?");
const insertArret = db.prepare(`
  INSERT INTO arrets_navire (id, navireId, portique, elementConcerne, nature, dateDebut, heureDebut, dateFin, heureFin, description, createdAt, updatedAt, createdBy, updatedBy)
  VALUES (@id, @navireId, @portique, @elementConcerne, @nature, @dateDebut, @heureDebut, @dateFin, @heureFin, @description, @createdAt, @updatedAt, @createdBy, @updatedBy)
`);
const updateArretStmt = db.prepare(`
  UPDATE arrets_navire SET navireId=@navireId, portique=@portique, elementConcerne=@elementConcerne, nature=@nature,
    dateDebut=@dateDebut, heureDebut=@heureDebut, dateFin=@dateFin, heureFin=@heureFin, description=@description,
    updatedAt=@updatedAt, updatedBy=@updatedBy
  WHERE id=@id
`);
const deleteArretStmt = db.prepare("DELETE FROM arrets_navire WHERE id = ?");

export async function listArrets() {
  return selectAllArrets.all();
}

export async function createArret(arret, actorMatricule) {
  const row = withAuditFields(arret, actorMatricule);
  insertArret.run(row);
  recordAudit({ entityType: "arret", entityId: arret.id, action: "create", matricule: actorMatricule, diff: arret });
  return row;
}

export async function updateArret(id, patch, actorMatricule) {
  const existing = selectArretById.get(id);
  if (!existing) {
    const error = new Error("Arrêt introuvable.");
    error.status = 404;
    throw error;
  }
  const merged = { ...existing, ...patch, id, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  updateArretStmt.run(merged);
  recordAudit({ entityType: "arret", entityId: id, action: "update", matricule: actorMatricule, diff: patch });
  return merged;
}

export async function deleteArret(id, actorMatricule) {
  const result = deleteArretStmt.run(id);
  if (result.changes === 0) {
    const error = new Error("Arrêt introuvable.");
    error.status = 404;
    throw error;
  }
  recordAudit({ entityType: "arret", entityId: id, action: "delete", matricule: actorMatricule, diff: {} });
  return { ok: true };
}
