import { db } from "./db.js";
import { recordAudit } from "./auditRepository.js";

function withAuditFields(row, actorMatricule) {
  const now = new Date().toISOString();
  return { ...row, createdAt: now, updatedAt: now, createdBy: actorMatricule || "", updatedBy: actorMatricule || "" };
}

async function selectById(id) {
  const result = await db.execute({ sql: "SELECT * FROM maintenance_interventions WHERE id = @id", args: { id } });
  return result.rows[0] ? { ...result.rows[0] } : undefined;
}

export async function listMaintenance() {
  const result = await db.execute("SELECT * FROM maintenance_interventions ORDER BY datePrevue ASC");
  return result.rows.map((row) => ({ ...row }));
}

export async function createMaintenance(intervention, actorMatricule) {
  const row = withAuditFields(intervention, actorMatricule);
  await db.execute({
    sql: `INSERT INTO maintenance_interventions (id, equipementCode, type, statut, datePrevue, dateRealisee, description, intervenant, dureeMinutes, createdAt, updatedAt, createdBy, updatedBy)
          VALUES (@id, @equipementCode, @type, @statut, @datePrevue, @dateRealisee, @description, @intervenant, @dureeMinutes, @createdAt, @updatedAt, @createdBy, @updatedBy)`,
    args: row
  });
  await recordAudit({ entityType: "maintenance", entityId: intervention.id, action: "create", matricule: actorMatricule, diff: intervention });
  return row;
}

export async function updateMaintenance(id, patch, actorMatricule) {
  const existing = await selectById(id);
  if (!existing) {
    const error = new Error("Intervention introuvable.");
    error.status = 404;
    throw error;
  }
  const merged = { ...existing, ...patch, id, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  await db.execute({
    sql: `UPDATE maintenance_interventions SET equipementCode=@equipementCode, type=@type, statut=@statut, datePrevue=@datePrevue,
      dateRealisee=@dateRealisee, description=@description, intervenant=@intervenant, dureeMinutes=@dureeMinutes,
      updatedAt=@updatedAt, updatedBy=@updatedBy
    WHERE id=@id`,
    args: merged
  });
  await recordAudit({ entityType: "maintenance", entityId: id, action: "update", matricule: actorMatricule, diff: patch });
  return merged;
}

export async function deleteMaintenance(id, actorMatricule) {
  const result = await db.execute({ sql: "DELETE FROM maintenance_interventions WHERE id = @id", args: { id } });
  if (result.rowsAffected === 0) {
    const error = new Error("Intervention introuvable.");
    error.status = 404;
    throw error;
  }
  await recordAudit({ entityType: "maintenance", entityId: id, action: "delete", matricule: actorMatricule, diff: {} });
  return { ok: true };
}
