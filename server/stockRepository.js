import { db } from "./db.js";
import { recordAudit } from "./auditRepository.js";

function parseSnapshot(row) {
  return { ...row, cellules: JSON.parse(row.cellules), zones: JSON.parse(row.zones) };
}

function serializeSnapshot(s) {
  return { ...s, cellules: JSON.stringify(s.cellules ?? []), zones: JSON.stringify(s.zones ?? []) };
}

export async function listSnapshots() {
  const result = await db.execute("SELECT * FROM stock_snapshots ORDER BY date ASC");
  return result.rows.map((row) => parseSnapshot({ ...row }));
}

export async function getSnapshotByDate(date) {
  const result = await db.execute({ sql: "SELECT * FROM stock_snapshots WHERE date = @date", args: { date } });
  return result.rows[0] ? parseSnapshot({ ...result.rows[0] }) : null;
}

/** Crée le snapshot du jour s'il n'existe pas encore, sinon le met à jour (édition en place). */
export async function upsertSnapshot(snapshot, actorMatricule) {
  const row = { ...snapshot, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  const serialized = serializeSnapshot(row);
  const existing = await getSnapshotByDate(snapshot.date);
  if (existing) {
    await db.execute({
      sql: `UPDATE stock_snapshots SET cellules=@cellules, zones=@zones, etatSilos=@etatSilos, posteNotes=@posteNotes, updatedAt=@updatedAt, updatedBy=@updatedBy
            WHERE date=@date`,
      args: serialized
    });
  } else {
    await db.execute({
      sql: `INSERT INTO stock_snapshots (date, cellules, zones, etatSilos, posteNotes, updatedAt, updatedBy)
            VALUES (@date, @cellules, @zones, @etatSilos, @posteNotes, @updatedAt, @updatedBy)`,
      args: serialized
    });
  }
  await recordAudit({ entityType: "stock_snapshot", entityId: snapshot.date, action: existing ? "update" : "create", matricule: actorMatricule, diff: {} });
  return row;
}
