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

function withAuditFields(row, actorMatricule) {
  const now = new Date().toISOString();
  return { ...row, createdAt: now, updatedAt: now, createdBy: actorMatricule || "", updatedBy: actorMatricule || "" };
}

async function selectNavireById(id) {
  const result = await db.execute({ sql: "SELECT * FROM navires WHERE id = @id", args: { id } });
  return result.rows[0] ? { ...result.rows[0] } : undefined;
}

export async function listNavires() {
  const result = await db.execute("SELECT * FROM navires ORDER BY dateDebutChargement ASC, heureDebutChargement ASC");
  return result.rows.map((row) => parseNavire({ ...row }));
}

async function syncNaviresCsv() {
  exportNaviresToCsv(await listNavires());
}

export async function createNavire(navire, actorMatricule) {
  const now = new Date().toISOString();
  const row = { ...navire, calesPlan: navire.calesPlan ?? [], createdAt: now, updatedAt: now, createdBy: actorMatricule || "", updatedBy: actorMatricule || "" };
  await db.execute({
    sql: `INSERT INTO navires (id, nom, numeroEC, qualite, poste, dateDebutChargement, heureDebutChargement, dateFinChargement, heureFinChargement, tonnagePrevu, tonnageCharge, statut, observations, calesPlan, createdAt, updatedAt, createdBy, updatedBy)
          VALUES (@id, @nom, @numeroEC, @qualite, @poste, @dateDebutChargement, @heureDebutChargement, @dateFinChargement, @heureFinChargement, @tonnagePrevu, @tonnageCharge, @statut, @observations, @calesPlan, @createdAt, @updatedAt, @createdBy, @updatedBy)`,
    args: serializeNavire(row)
  });
  await recordAudit({ entityType: "navire", entityId: navire.id, action: "create", matricule: actorMatricule, diff: navire });
  await syncNaviresCsv();
  return row;
}

export async function updateNavire(id, patch, actorMatricule) {
  const existing = await selectNavireById(id);
  if (!existing) {
    const error = new Error("Navire introuvable.");
    error.status = 404;
    throw error;
  }
  const merged = { ...parseNavire(existing), ...patch, id, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  await db.execute({
    sql: `UPDATE navires SET nom=@nom, numeroEC=@numeroEC, qualite=@qualite, poste=@poste, dateDebutChargement=@dateDebutChargement,
      heureDebutChargement=@heureDebutChargement, dateFinChargement=@dateFinChargement, heureFinChargement=@heureFinChargement,
      tonnagePrevu=@tonnagePrevu, tonnageCharge=@tonnageCharge, statut=@statut, observations=@observations, calesPlan=@calesPlan,
      updatedAt=@updatedAt, updatedBy=@updatedBy
    WHERE id=@id`,
    args: serializeNavire(merged)
  });
  await recordAudit({ entityType: "navire", entityId: id, action: "update", matricule: actorMatricule, diff: patch });
  await syncNaviresCsv();
  return merged;
}

/** Supprime le navire et, en cascade, ses lignes de chargement et ses arrêts (pas de contrainte FK
 * dans ce schéma — la cascade est faite explicitement ici pour ne pas laisser de lignes orphelines). */
export async function deleteNavire(id, actorMatricule) {
  const existing = await selectNavireById(id);
  if (!existing) {
    const error = new Error("Navire introuvable.");
    error.status = 404;
    throw error;
  }
  const chargementsResult = await db.execute({ sql: "DELETE FROM chargements_portique WHERE navireId = @navireId", args: { navireId: id } });
  const arretsResult = await db.execute({ sql: "DELETE FROM arrets_navire WHERE navireId = @navireId", args: { navireId: id } });
  await db.execute({ sql: "DELETE FROM navires WHERE id = @id", args: { id } });
  const chargementsDeleted = chargementsResult.rowsAffected;
  const arretsDeleted = arretsResult.rowsAffected;
  await recordAudit({ entityType: "navire", entityId: id, action: "delete", matricule: actorMatricule, diff: { chargementsDeleted, arretsDeleted } });
  await syncNaviresCsv();
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
    const existing = await selectNavireById(navire.id);
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

async function selectChargementById(id) {
  const result = await db.execute({ sql: "SELECT * FROM chargements_portique WHERE id = @id", args: { id } });
  return result.rows[0] ? { ...result.rows[0] } : undefined;
}

export async function listChargements() {
  const result = await db.execute("SELECT * FROM chargements_portique ORDER BY dateDebutAffect ASC, heureDebutAffect ASC");
  return result.rows.map((row) => ({ ...row }));
}

const CHARGEMENT_INSERT_SQL = `
  INSERT INTO chargements_portique (id, navireId, portique, cale, peseuse, repriseOuDirection, dateDebutAffect, heureDebutAffect, dateFinAffect, heureFinAffect, tonnage, createdAt, updatedAt, createdBy, updatedBy)
  VALUES (@id, @navireId, @portique, @cale, @peseuse, @repriseOuDirection, @dateDebutAffect, @heureDebutAffect, @dateFinAffect, @heureFinAffect, @tonnage, @createdAt, @updatedAt, @createdBy, @updatedBy)
`;

export async function createChargement(chargement, actorMatricule) {
  const row = withAuditFields(chargement, actorMatricule);
  await db.execute({ sql: CHARGEMENT_INSERT_SQL, args: row });
  await recordAudit({ entityType: "chargement", entityId: chargement.id, action: "create", matricule: actorMatricule, diff: chargement });
  return row;
}

export async function createChargementsBulk(chargements, actorMatricule) {
  const rows = chargements.map((c) => withAuditFields(c, actorMatricule));
  // Insertion atomique (tout ou rien) — équivalent du db.transaction(...) synchrone de better-sqlite3.
  await db.batch(
    rows.map((row) => ({ sql: CHARGEMENT_INSERT_SQL, args: row })),
    "write"
  );
  for (const c of chargements) {
    await recordAudit({ entityType: "chargement", entityId: c.id, action: "create", matricule: actorMatricule, diff: c });
  }
  return rows;
}

export async function updateChargement(id, patch, actorMatricule) {
  const existing = await selectChargementById(id);
  if (!existing) {
    const error = new Error("Ligne de chargement introuvable.");
    error.status = 404;
    throw error;
  }
  const merged = { ...existing, ...patch, id, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  await db.execute({
    sql: `UPDATE chargements_portique SET navireId=@navireId, portique=@portique, cale=@cale, peseuse=@peseuse,
      repriseOuDirection=@repriseOuDirection, dateDebutAffect=@dateDebutAffect, heureDebutAffect=@heureDebutAffect,
      dateFinAffect=@dateFinAffect, heureFinAffect=@heureFinAffect, tonnage=@tonnage, updatedAt=@updatedAt, updatedBy=@updatedBy
    WHERE id=@id`,
    args: merged
  });
  await recordAudit({ entityType: "chargement", entityId: id, action: "update", matricule: actorMatricule, diff: patch });
  return merged;
}

export async function deleteChargement(id, actorMatricule) {
  const result = await db.execute({ sql: "DELETE FROM chargements_portique WHERE id = @id", args: { id } });
  if (result.rowsAffected === 0) {
    const error = new Error("Ligne de chargement introuvable.");
    error.status = 404;
    throw error;
  }
  await recordAudit({ entityType: "chargement", entityId: id, action: "delete", matricule: actorMatricule, diff: {} });
  return { ok: true };
}

async function selectArretById(id) {
  const result = await db.execute({ sql: "SELECT * FROM arrets_navire WHERE id = @id", args: { id } });
  return result.rows[0] ? { ...result.rows[0] } : undefined;
}

export async function listArrets() {
  const result = await db.execute("SELECT * FROM arrets_navire ORDER BY dateDebut DESC, heureDebut DESC");
  return result.rows.map((row) => ({ ...row }));
}

export async function createArret(arret, actorMatricule) {
  const row = withAuditFields(arret, actorMatricule);
  await db.execute({
    sql: `INSERT INTO arrets_navire (id, navireId, portique, elementConcerne, nature, dateDebut, heureDebut, dateFin, heureFin, description, createdAt, updatedAt, createdBy, updatedBy)
          VALUES (@id, @navireId, @portique, @elementConcerne, @nature, @dateDebut, @heureDebut, @dateFin, @heureFin, @description, @createdAt, @updatedAt, @createdBy, @updatedBy)`,
    args: row
  });
  await recordAudit({ entityType: "arret", entityId: arret.id, action: "create", matricule: actorMatricule, diff: arret });
  return row;
}

export async function updateArret(id, patch, actorMatricule) {
  const existing = await selectArretById(id);
  if (!existing) {
    const error = new Error("Arrêt introuvable.");
    error.status = 404;
    throw error;
  }
  const merged = { ...existing, ...patch, id, updatedAt: new Date().toISOString(), updatedBy: actorMatricule || "" };
  await db.execute({
    sql: `UPDATE arrets_navire SET navireId=@navireId, portique=@portique, elementConcerne=@elementConcerne, nature=@nature,
      dateDebut=@dateDebut, heureDebut=@heureDebut, dateFin=@dateFin, heureFin=@heureFin, description=@description,
      updatedAt=@updatedAt, updatedBy=@updatedBy
    WHERE id=@id`,
    args: merged
  });
  await recordAudit({ entityType: "arret", entityId: id, action: "update", matricule: actorMatricule, diff: patch });
  return merged;
}

export async function deleteArret(id, actorMatricule) {
  const result = await db.execute({ sql: "DELETE FROM arrets_navire WHERE id = @id", args: { id } });
  if (result.rowsAffected === 0) {
    const error = new Error("Arrêt introuvable.");
    error.status = 404;
    throw error;
  }
  await recordAudit({ entityType: "arret", entityId: id, action: "delete", matricule: actorMatricule, diff: {} });
  return { ok: true };
}
