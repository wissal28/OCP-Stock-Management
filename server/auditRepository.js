import { randomUUID } from "node:crypto";
import { db } from "./db.js";

/** Enregistre une entrée d'audit (qui a fait quoi, quand) — appelée par les repositories après chaque écriture.
 * Awaited par tous ses appelants (voir chaque repository) : en environnement serverless, la fonction peut se
 * terminer dès la réponse envoyée, donc une écriture "fire and forget" non attendue risquerait d'être perdue. */
export async function recordAudit({ entityType, entityId, action, matricule, diff }) {
  await db.execute({
    sql: `
      INSERT INTO audit_log (id, entityType, entityId, action, matricule, createdAt, diff)
      VALUES (@id, @entityType, @entityId, @action, @matricule, @createdAt, @diff)
    `,
    args: {
      id: randomUUID(),
      entityType,
      entityId,
      action,
      matricule: matricule || "",
      createdAt: new Date().toISOString(),
      diff: JSON.stringify(diff ?? {})
    }
  });
}

export async function listAuditForEntity(entityType, entityId) {
  const result = await db.execute({
    sql: "SELECT * FROM audit_log WHERE entityType = @entityType AND entityId = @entityId ORDER BY createdAt DESC",
    args: { entityType, entityId }
  });
  return result.rows.map((row) => ({ ...row, diff: JSON.parse(row.diff) }));
}
