import { db } from "./db.js";
import { recordAudit } from "./auditRepository.js";

function withAuditFields(row, actorMatricule) {
  const now = new Date().toISOString();
  return { ...row, createdAt: now, updatedAt: now, createdBy: actorMatricule || "", updatedBy: actorMatricule || "" };
}

// --- Incidents / accidents ---

const selectAllIncidents = db.prepare("SELECT * FROM hse_incidents ORDER BY date DESC, heure DESC");
const selectIncidentById = db.prepare("SELECT * FROM hse_incidents WHERE id = ?");
const insertIncident = db.prepare(`
  INSERT INTO hse_incidents (id, date, heure, zone, type, gravite, personnesImpliquees, description, causeProbable, actionsCorrectives, statut, declarePar, createdAt, updatedAt, createdBy, updatedBy)
  VALUES (@id, @date, @heure, @zone, @type, @gravite, @personnesImpliquees, @description, @causeProbable, @actionsCorrectives, @statut, @declarePar, @createdAt, @updatedAt, @createdBy, @updatedBy)
`);
const updateIncidentStmt = db.prepare(`
  UPDATE hse_incidents SET date=@date, heure=@heure, zone=@zone, type=@type, gravite=@gravite, personnesImpliquees=@personnesImpliquees,
    description=@description, causeProbable=@causeProbable, actionsCorrectives=@actionsCorrectives, statut=@statut, declarePar=@declarePar,
    updatedAt=@updatedAt, updatedBy=@updatedBy
  WHERE id=@id
`);
const deleteIncidentStmt = db.prepare("DELETE FROM hse_incidents WHERE id = ?");

export async function listIncidents() {
  return selectAllIncidents.all();
}

export async function createIncident(incident, actorMatricule) {
  const row = withAuditFields(incident, actorMatricule);
  insertIncident.run(row);
  recordAudit({ entityType: "hse_incident", entityId: incident.id, action: "create", matricule: actorMatricule, diff: incident });
  return row;
}

export async function updateIncident(id, patch, actorMatricule) {
  const existing = selectIncidentById.get(id);
  if (!existing) {
    const error = new Error("Incident introuvable.");
    error.status = 404;
    throw error;
  }
  const merged = { ...existing, ...patch, id, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  updateIncidentStmt.run(merged);
  recordAudit({ entityType: "hse_incident", entityId: id, action: "update", matricule: actorMatricule, diff: patch });
  return merged;
}

export async function deleteIncident(id, actorMatricule) {
  const result = deleteIncidentStmt.run(id);
  if (result.changes === 0) {
    const error = new Error("Incident introuvable.");
    error.status = 404;
    throw error;
  }
  recordAudit({ entityType: "hse_incident", entityId: id, action: "delete", matricule: actorMatricule, diff: {} });
  return { ok: true };
}

// --- Inspections / checklists sécurité ---

function parseInspection(row) {
  return { ...row, checklist: JSON.parse(row.checklist || "[]") };
}

function serializeInspection(i) {
  return { ...i, checklist: JSON.stringify(i.checklist ?? []) };
}

const selectAllInspections = db.prepare("SELECT * FROM hse_inspections ORDER BY date DESC");
const selectInspectionById = db.prepare("SELECT * FROM hse_inspections WHERE id = ?");
const insertInspection = db.prepare(`
  INSERT INTO hse_inspections (id, date, zone, type, inspecteur, statut, checklist, observations, actionsRequises, dateProchaineInspection, createdAt, updatedAt, createdBy, updatedBy)
  VALUES (@id, @date, @zone, @type, @inspecteur, @statut, @checklist, @observations, @actionsRequises, @dateProchaineInspection, @createdAt, @updatedAt, @createdBy, @updatedBy)
`);
const updateInspectionStmt = db.prepare(`
  UPDATE hse_inspections SET date=@date, zone=@zone, type=@type, inspecteur=@inspecteur, statut=@statut, checklist=@checklist,
    observations=@observations, actionsRequises=@actionsRequises, dateProchaineInspection=@dateProchaineInspection,
    updatedAt=@updatedAt, updatedBy=@updatedBy
  WHERE id=@id
`);
const deleteInspectionStmt = db.prepare("DELETE FROM hse_inspections WHERE id = ?");

export async function listInspections() {
  return selectAllInspections.all().map(parseInspection);
}

export async function createInspection(inspection, actorMatricule) {
  const row = withAuditFields(inspection, actorMatricule);
  insertInspection.run(serializeInspection(row));
  recordAudit({ entityType: "hse_inspection", entityId: inspection.id, action: "create", matricule: actorMatricule, diff: inspection });
  return row;
}

export async function updateInspection(id, patch, actorMatricule) {
  const existing = selectInspectionById.get(id);
  if (!existing) {
    const error = new Error("Inspection introuvable.");
    error.status = 404;
    throw error;
  }
  const merged = { ...parseInspection(existing), ...patch, id, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  updateInspectionStmt.run(serializeInspection(merged));
  recordAudit({ entityType: "hse_inspection", entityId: id, action: "update", matricule: actorMatricule, diff: patch });
  return merged;
}

export async function deleteInspection(id, actorMatricule) {
  const result = deleteInspectionStmt.run(id);
  if (result.changes === 0) {
    const error = new Error("Inspection introuvable.");
    error.status = 404;
    throw error;
  }
  recordAudit({ entityType: "hse_inspection", entityId: id, action: "delete", matricule: actorMatricule, diff: {} });
  return { ok: true };
}

// --- Plan d'actions correctives ---

const selectAllActions = db.prepare("SELECT * FROM hse_actions ORDER BY echeance ASC");
const selectActionById = db.prepare("SELECT * FROM hse_actions WHERE id = ?");
const insertAction = db.prepare(`
  INSERT INTO hse_actions (id, titre, description, origine, origineId, responsable, echeance, priorite, statut, createdAt, updatedAt, createdBy, updatedBy)
  VALUES (@id, @titre, @description, @origine, @origineId, @responsable, @echeance, @priorite, @statut, @createdAt, @updatedAt, @createdBy, @updatedBy)
`);
const updateActionStmt = db.prepare(`
  UPDATE hse_actions SET titre=@titre, description=@description, origine=@origine, origineId=@origineId, responsable=@responsable,
    echeance=@echeance, priorite=@priorite, statut=@statut, updatedAt=@updatedAt, updatedBy=@updatedBy
  WHERE id=@id
`);
const deleteActionStmt = db.prepare("DELETE FROM hse_actions WHERE id = ?");

export async function listActions() {
  return selectAllActions.all();
}

export async function createAction(action, actorMatricule) {
  const row = withAuditFields(action, actorMatricule);
  insertAction.run(row);
  recordAudit({ entityType: "hse_action", entityId: action.id, action: "create", matricule: actorMatricule, diff: action });
  return row;
}

export async function updateAction(id, patch, actorMatricule) {
  const existing = selectActionById.get(id);
  if (!existing) {
    const error = new Error("Action introuvable.");
    error.status = 404;
    throw error;
  }
  const merged = { ...existing, ...patch, id, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  updateActionStmt.run(merged);
  recordAudit({ entityType: "hse_action", entityId: id, action: "update", matricule: actorMatricule, diff: patch });
  return merged;
}

export async function deleteAction(id, actorMatricule) {
  const result = deleteActionStmt.run(id);
  if (result.changes === 0) {
    const error = new Error("Action introuvable.");
    error.status = 404;
    throw error;
  }
  recordAudit({ entityType: "hse_action", entityId: id, action: "delete", matricule: actorMatricule, diff: {} });
  return { ok: true };
}
