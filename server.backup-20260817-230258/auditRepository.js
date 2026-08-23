import { randomUUID } from "node:crypto";
import { db } from "./db.js";

const insertLog = db.prepare(`
  INSERT INTO audit_log (id, entityType, entityId, action, matricule, createdAt, diff)
  VALUES (@id, @entityType, @entityId, @action, @matricule, @createdAt, @diff)
`);
const selectByEntity = db.prepare("SELECT * FROM audit_log WHERE entityType = ? AND entityId = ? ORDER BY createdAt DESC");

/** Enregistre une entrée d'audit (qui a fait quoi, quand) — appelée par les repositories après chaque écriture. */
export function recordAudit({ entityType, entityId, action, matricule, diff }) {
  insertLog.run({
    id: randomUUID(),
    entityType,
    entityId,
    action,
    matricule: matricule || "",
    createdAt: new Date().toISOString(),
    diff: JSON.stringify(diff ?? {})
  });
}

export async function listAuditForEntity(entityType, entityId) {
  return selectByEntity.all(entityType, entityId).map((row) => ({ ...row, diff: JSON.parse(row.diff) }));
}
