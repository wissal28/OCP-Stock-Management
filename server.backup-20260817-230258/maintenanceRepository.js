import { db } from "./db.js";
import { recordAudit } from "./auditRepository.js";

function withAuditFields(row, actorMatricule) {
  const now = new Date().toISOString();
  return { ...row, createdAt: now, updatedAt: now, createdBy: actorMatricule || "", updatedBy: actorMatricule || "" };
}

const selectAll = db.prepare("SELECT * FROM maintenance_interventions ORDER BY datePrevue ASC");
const selectById = db.prepare("SELECT * FROM maintenance_interventions WHERE id = ?");
const insert = db.prepare(`
  INSERT INTO maintenance_interventions (id, equipementCode, type, statut, datePrevue, dateRealisee, description, intervenant, dureeMinutes, createdAt, updatedAt, createdBy, updatedBy)
  VALUES (@id, @equipementCode, @type, @statut, @datePrevue, @dateRealisee, @description, @intervenant, @dureeMinutes, @createdAt, @updatedAt, @createdBy, @updatedBy)
`);
const updateStmt = db.prepare(`
  UPDATE maintenance_interventions SET equipementCode=@equipementCode, type=@type, statut=@statut, datePrevue=@datePrevue,
    dateRealisee=@dateRealisee, description=@description, intervenant=@intervenant, dureeMinutes=@dureeMinutes,
    updatedAt=@updatedAt, updatedBy=@updatedBy
  WHERE id=@id
`);
const deleteStmt = db.prepare("DELETE FROM maintenance_interventions WHERE id = ?");

export async function listMaintenance() {
  return selectAll.all();
}

export async function createMaintenance(intervention, actorMatricule) {
  const row = withAuditFields(intervention, actorMatricule);
  insert.run(row);
  recordAudit({ entityType: "maintenance", entityId: intervention.id, action: "create", matricule: actorMatricule, diff: intervention });
  return row;
}

export async function updateMaintenance(id, patch, actorMatricule) {
  const existing = selectById.get(id);
  if (!existing) {
    const error = new Error("Intervention introuvable.");
    error.status = 404;
    throw error;
  }
  const merged = { ...existing, ...patch, id, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  updateStmt.run(merged);
  recordAudit({ entityType: "maintenance", entityId: id, action: "update", matricule: actorMatricule, diff: patch });
  return merged;
}

export async function deleteMaintenance(id, actorMatricule) {
  const result = deleteStmt.run(id);
  if (result.changes === 0) {
    const error = new Error("Intervention introuvable.");
    error.status = 404;
    throw error;
  }
  recordAudit({ entityType: "maintenance", entityId: id, action: "delete", matricule: actorMatricule, diff: {} });
  return { ok: true };
}
