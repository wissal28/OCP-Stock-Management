import { db } from "./db.js";
import { recordAudit } from "./auditRepository.js";

function withAuditFields(row, actorMatricule) {
  const now = new Date().toISOString();
  return { ...row, createdAt: now, updatedAt: now, createdBy: actorMatricule || "", updatedBy: actorMatricule || "" };
}

// --- Incidents / accidents ---

async function selectIncidentById(id) {
  const result = await db.execute({ sql: "SELECT * FROM hse_incidents WHERE id = @id", args: { id } });
  return result.rows[0] ? { ...result.rows[0] } : undefined;
}

export async function listIncidents() {
  const result = await db.execute("SELECT * FROM hse_incidents ORDER BY date DESC, heure DESC");
  return result.rows.map((row) => ({ ...row }));
}

export async function createIncident(incident, actorMatricule) {
  const row = withAuditFields(incident, actorMatricule);
  await db.execute({
    sql: `INSERT INTO hse_incidents (id, date, heure, zone, type, gravite, personnesImpliquees, description, causeProbable, actionsCorrectives, statut, declarePar, createdAt, updatedAt, createdBy, updatedBy)
          VALUES (@id, @date, @heure, @zone, @type, @gravite, @personnesImpliquees, @description, @causeProbable, @actionsCorrectives, @statut, @declarePar, @createdAt, @updatedAt, @createdBy, @updatedBy)`,
    args: row
  });
  await recordAudit({ entityType: "hse_incident", entityId: incident.id, action: "create", matricule: actorMatricule, diff: incident });
  return row;
}

export async function updateIncident(id, patch, actorMatricule) {
  const existing = await selectIncidentById(id);
  if (!existing) {
    const error = new Error("Incident introuvable.");
    error.status = 404;
    throw error;
  }
  const merged = { ...existing, ...patch, id, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  await db.execute({
    sql: `UPDATE hse_incidents SET date=@date, heure=@heure, zone=@zone, type=@type, gravite=@gravite, personnesImpliquees=@personnesImpliquees,
      description=@description, causeProbable=@causeProbable, actionsCorrectives=@actionsCorrectives, statut=@statut, declarePar=@declarePar,
      updatedAt=@updatedAt, updatedBy=@updatedBy
    WHERE id=@id`,
    args: merged
  });
  await recordAudit({ entityType: "hse_incident", entityId: id, action: "update", matricule: actorMatricule, diff: patch });
  return merged;
}

export async function deleteIncident(id, actorMatricule) {
  const result = await db.execute({ sql: "DELETE FROM hse_incidents WHERE id = @id", args: { id } });
  if (result.rowsAffected === 0) {
    const error = new Error("Incident introuvable.");
    error.status = 404;
    throw error;
  }
  await recordAudit({ entityType: "hse_incident", entityId: id, action: "delete", matricule: actorMatricule, diff: {} });
  return { ok: true };
}

// --- Inspections / checklists sécurité ---

function parseInspection(row) {
  return { ...row, checklist: JSON.parse(row.checklist || "[]") };
}

function serializeInspection(i) {
  return { ...i, checklist: JSON.stringify(i.checklist ?? []) };
}

async function selectInspectionById(id) {
  const result = await db.execute({ sql: "SELECT * FROM hse_inspections WHERE id = @id", args: { id } });
  return result.rows[0] ? { ...result.rows[0] } : undefined;
}

export async function listInspections() {
  const result = await db.execute("SELECT * FROM hse_inspections ORDER BY date DESC");
  return result.rows.map((row) => parseInspection({ ...row }));
}

export async function createInspection(inspection, actorMatricule) {
  const row = withAuditFields(inspection, actorMatricule);
  await db.execute({
    sql: `INSERT INTO hse_inspections (id, date, zone, type, inspecteur, statut, checklist, observations, actionsRequises, dateProchaineInspection, createdAt, updatedAt, createdBy, updatedBy)
          VALUES (@id, @date, @zone, @type, @inspecteur, @statut, @checklist, @observations, @actionsRequises, @dateProchaineInspection, @createdAt, @updatedAt, @createdBy, @updatedBy)`,
    args: serializeInspection(row)
  });
  await recordAudit({ entityType: "hse_inspection", entityId: inspection.id, action: "create", matricule: actorMatricule, diff: inspection });
  return row;
}

export async function updateInspection(id, patch, actorMatricule) {
  const existing = await selectInspectionById(id);
  if (!existing) {
    const error = new Error("Inspection introuvable.");
    error.status = 404;
    throw error;
  }
  const merged = { ...parseInspection(existing), ...patch, id, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  await db.execute({
    sql: `UPDATE hse_inspections SET date=@date, zone=@zone, type=@type, inspecteur=@inspecteur, statut=@statut, checklist=@checklist,
      observations=@observations, actionsRequises=@actionsRequises, dateProchaineInspection=@dateProchaineInspection,
      updatedAt=@updatedAt, updatedBy=@updatedBy
    WHERE id=@id`,
    args: serializeInspection(merged)
  });
  await recordAudit({ entityType: "hse_inspection", entityId: id, action: "update", matricule: actorMatricule, diff: patch });
  return merged;
}

export async function deleteInspection(id, actorMatricule) {
  const result = await db.execute({ sql: "DELETE FROM hse_inspections WHERE id = @id", args: { id } });
  if (result.rowsAffected === 0) {
    const error = new Error("Inspection introuvable.");
    error.status = 404;
    throw error;
  }
  await recordAudit({ entityType: "hse_inspection", entityId: id, action: "delete", matricule: actorMatricule, diff: {} });
  return { ok: true };
}

// --- Plan d'actions correctives ---

async function selectActionById(id) {
  const result = await db.execute({ sql: "SELECT * FROM hse_actions WHERE id = @id", args: { id } });
  return result.rows[0] ? { ...result.rows[0] } : undefined;
}

export async function listActions() {
  const result = await db.execute("SELECT * FROM hse_actions ORDER BY echeance ASC");
  return result.rows.map((row) => ({ ...row }));
}

export async function createAction(action, actorMatricule) {
  const row = withAuditFields(action, actorMatricule);
  await db.execute({
    sql: `INSERT INTO hse_actions (id, titre, description, origine, origineId, responsable, echeance, priorite, statut, createdAt, updatedAt, createdBy, updatedBy)
          VALUES (@id, @titre, @description, @origine, @origineId, @responsable, @echeance, @priorite, @statut, @createdAt, @updatedAt, @createdBy, @updatedBy)`,
    args: row
  });
  await recordAudit({ entityType: "hse_action", entityId: action.id, action: "create", matricule: actorMatricule, diff: action });
  return row;
}

export async function updateAction(id, patch, actorMatricule) {
  const existing = await selectActionById(id);
  if (!existing) {
    const error = new Error("Action introuvable.");
    error.status = 404;
    throw error;
  }
  const merged = { ...existing, ...patch, id, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  await db.execute({
    sql: `UPDATE hse_actions SET titre=@titre, description=@description, origine=@origine, origineId=@origineId, responsable=@responsable,
      echeance=@echeance, priorite=@priorite, statut=@statut, updatedAt=@updatedAt, updatedBy=@updatedBy
    WHERE id=@id`,
    args: merged
  });
  await recordAudit({ entityType: "hse_action", entityId: id, action: "update", matricule: actorMatricule, diff: patch });
  return merged;
}

export async function deleteAction(id, actorMatricule) {
  const result = await db.execute({ sql: "DELETE FROM hse_actions WHERE id = @id", args: { id } });
  if (result.rowsAffected === 0) {
    const error = new Error("Action introuvable.");
    error.status = 404;
    throw error;
  }
  await recordAudit({ entityType: "hse_action", entityId: id, action: "delete", matricule: actorMatricule, diff: {} });
  return { ok: true };
}
