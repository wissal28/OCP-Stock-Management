import { db } from "./db.js";
import { recordAudit } from "./auditRepository.js";

function parseSnapshot(row) {
  return { ...row, cellules: JSON.parse(row.cellules), zones: JSON.parse(row.zones) };
}

function serializeSnapshot(s) {
  return { ...s, cellules: JSON.stringify(s.cellules ?? []), zones: JSON.stringify(s.zones ?? []) };
}

const selectAll = db.prepare("SELECT * FROM stock_snapshots ORDER BY date ASC");
const selectByDate = db.prepare("SELECT * FROM stock_snapshots WHERE date = ?");
const insertSnapshot = db.prepare(`
  INSERT INTO stock_snapshots (date, cellules, zones, etatSilos, posteNotes, updatedAt, updatedBy)
  VALUES (@date, @cellules, @zones, @etatSilos, @posteNotes, @updatedAt, @updatedBy)
`);
const updateSnapshot = db.prepare(`
  UPDATE stock_snapshots SET cellules=@cellules, zones=@zones, etatSilos=@etatSilos, posteNotes=@posteNotes, updatedAt=@updatedAt, updatedBy=@updatedBy
  WHERE date=@date
`);

export async function listSnapshots() {
  return selectAll.all().map(parseSnapshot);
}

export async function getSnapshotByDate(date) {
  const row = selectByDate.get(date);
  return row ? parseSnapshot(row) : null;
}

/** Crée le snapshot du jour s'il n'existe pas encore, sinon le met à jour (édition en place). */
export async function upsertSnapshot(snapshot, actorMatricule) {
  const row = { ...snapshot, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  const serialized = serializeSnapshot(row);
  const existing = selectByDate.get(snapshot.date);
  if (existing) {
    updateSnapshot.run(serialized);
  } else {
    insertSnapshot.run(serialized);
  }
  recordAudit({ entityType: "stock_snapshot", entityId: snapshot.date, action: existing ? "update" : "create", matricule: actorMatricule, diff: {} });
  return row;
}
