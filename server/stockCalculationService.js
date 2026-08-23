// Calcule le stock automatiquement à partir des mouvements réels (entrées trains − sorties navires),
// remplaçant la saisie 100% manuelle du bordereau Excel "ETAT DES STOCKS". Port côté serveur de la
// logique de répartition déjà utilisée côté client dans src/components/train/trainRules.ts
// (getDestinationShares) — dupliqué volontairement, le serveur natif `http` n'a pas de bundler pour
// partager du TypeScript avec le client.
//
// Portée : seules les 12 cellules numérotées (STOCK_CELLULE_IDS côté client, Lot 1 + Lot 2) sont
// calculées automatiquement — ce sont les seules pour lesquelles le bordereau Excel et le modèle de
// données actuel (stock_snapshots.cellules) ont une correspondance 1:1 claire. Les zones globales
// SA/SB (Lot 3) restent en saisie manuelle, comme aujourd'hui : rien dans le bordereau Excel ni dans
// le modèle actuel ne permet d'attribuer un mouvement de train/navire à une zone plutôt qu'à une
// cellule précise (voir l'analyse métier — la Question ouverte n°5 du plan).

import { db } from "./db.js";
import { getSnapshotByDate, upsertSnapshot } from "./stockRepository.js";

// Cellule → lot pour TOUTES les cellules (Lot 1 + Lot 2 + Lot 3), mêmes ids et même regroupement
// que src/components/train/trainData.ts CELLULES — dupliqué ici volontairement (pas de bundler
// partagé entre client et serveur natif `http`). Sert au partage getDestinationShares (une seule
// cellule par lot autorisée en même temps) pour TOUTES les cellules, y compris celles du Lot 3.
// Lot 3 = exactement les reprises 13-21 (confirmé avec l'utilisateur) — RD214/RC214/RA214/RB214/
// RA314/RB314/RC314/RD314 sont des convoyeurs de reprise/évacuation en aval, pas des cellules de
// stockage, donc pas des destinations valides pour un déchargement de train.
const ALL_CELLULE_LOT = {
  SA211: "lot-1", SA212: "lot-1", SA213: "lot-1", SA221: "lot-1", SA222: "lot-1", SA223: "lot-1",
  SB311: "lot-2", SB312: "lot-2", SB313: "lot-2", SB321: "lot-2", SB322: "lot-2", SB323: "lot-2",
  RC114: "lot-3", RD114: "lot-3", RC124: "lot-3", RD124: "lot-3", RC134: "lot-3", RA114: "lot-3",
  RB114: "lot-3", RA124: "lot-3", RB124: "lot-3"
};
const ALL_CELLULE_IDS = Object.keys(ALL_CELLULE_LOT);

// Sous-ensemble Lot 1 + Lot 2 (12 cellules) : les seules pour lesquelles le bordereau Excel et le
// modèle de données actuel (stock_snapshots.cellules) ont une correspondance 1:1 claire — voir
// l'en-tête du fichier. Liste explicite (pas dérivée de ALL_CELLULE_LOT) pour ne jamais s'élargir
// silencieusement si ALL_CELLULE_LOT change.
const STOCK_CELLULE_IDS = [
  "SA211", "SA212", "SA213", "SA221", "SA222", "SA223",
  "SB311", "SB312", "SB313", "SB321", "SB322", "SB323"
];

// Capacités par cellule — identiques à src/components/stock/stockData.ts CAPACITES_CELLULES,
// utilisées uniquement pour amorcer un tout premier snapshot en l'absence de tout historique.
const CAPACITES_CELLULES = {
  SA211: 12500, SA212: 8000, SA213: 13300, SA221: 13300, SA222: 13300, SA223: 13300,
  SB311: 13300, SB312: 13300, SB313: 13300, SB321: 13300, SB322: 13300, SB323: 13300
};

/** Répartit une quantité de façon égale entre N branches ouvertes — identique à
 * trainRules.splitQuantityByOpenBranches. */
function splitQuantityByOpenBranches(quantite, openBranchesCount) {
  if (openBranchesCount <= 0) return [];
  const share = Math.round((quantite / openBranchesCount) * 100) / 100;
  const shares = Array(openBranchesCount).fill(share);
  const rounding = quantite - share * openBranchesCount;
  shares[shares.length - 1] = Math.round((shares[shares.length - 1] + rounding) * 100) / 100;
  return shares;
}

/** Identique à trainRules.getDestinationShares : répartit la quantité d'une ligne DA/DB/Silos entre
 * ses destinations simultanées (par lot, puis par cellule au sein d'un même lot). */
function getDestinationShares(row) {
  if (!row.destinations || row.destinations.length === 0) return [];

  const groupIds = [];
  const groupMembers = new Map();

  for (const id of row.destinations) {
    const lotId = ALL_CELLULE_LOT[id];
    const groupId = lotId ? `lot:${lotId}` : `single:${id}`;
    if (!groupMembers.has(groupId)) {
      groupMembers.set(groupId, []);
      groupIds.push(groupId);
    }
    groupMembers.get(groupId).push(id);
  }

  const level1Shares = splitQuantityByOpenBranches(row.quantite, groupIds.length);

  const shares = [];
  groupIds.forEach((groupId, i) => {
    const members = groupMembers.get(groupId);
    const level2Shares = splitQuantityByOpenBranches(level1Shares[i] ?? 0, members.length);
    members.forEach((destination, j) => shares.push({ destination, quantite: level2Shares[j] ?? 0 }));
  });

  return shares;
}

/** Journée d'exploitation (7h → 7h) à laquelle rattacher un événement — identique à
 * trainRules.getOperationalDay. */
function getOperationalDay(date, heure) {
  if (!date) return date;
  const hour = heure ? Number(heure.split(":")[0]) : 7;
  if (Number.isNaN(hour)) return date;
  if (hour >= 7) return date;
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

/** Entrées de la journée d'exploitation, par cellule : somme des parts DA+DB+Silos de chaque
 * déchargement de la journée qui pointent vers une des 12 cellules suivies, plus la qualité de phosphate
 * déchargée dans chacune (dernière ligne traitée si plusieurs, cas rare) — sert à mettre à jour la
 * qualité active d'une cellule quand elle repart de vide (voir computeAutoCellules). Retourne
 * `{ quantites, qualites }`, deux Map indexées par celluleId. */
export async function computeEntreesForDay(operationalDay) {
  const result = await db.execute("SELECT * FROM dechargements");
  const quantites = new Map();
  const qualites = new Map();
  for (const d of result.rows) {
    if (getOperationalDay(d.date, d.debutDechargement || "12:00") !== operationalDay) continue;
    for (const family of ["da", "db", "silos"]) {
      let lines;
      try {
        lines = JSON.parse(d[family] || "[]");
      } catch {
        continue;
      }
      for (const line of lines) {
        for (const share of getDestinationShares(line)) {
          if (!STOCK_CELLULE_IDS.includes(share.destination)) continue;
          quantites.set(share.destination, (quantites.get(share.destination) ?? 0) + share.quantite);
          if (line.qualite) qualites.set(share.destination, line.qualite);
        }
      }
    }
  }
  return { quantites, qualites };
}

/** Sorties de la journée d'exploitation, par cellule : somme des lignes de chargement_portique dont
 * repriseOuDirection pointe vers une des 12 cellules suivies (SILOS/DIRECT ignorés — pas de cellule). */
export async function computeSortiesForDay(operationalDay) {
  const result = await db.execute("SELECT repriseOuDirection, tonnage, dateDebutAffect, heureDebutAffect FROM chargements_portique");
  const totals = new Map();
  for (const c of result.rows) {
    if (getOperationalDay(c.dateDebutAffect, c.heureDebutAffect || "12:00") !== operationalDay) continue;
    if (!STOCK_CELLULE_IDS.includes(c.repriseOuDirection)) continue;
    totals.set(c.repriseOuDirection, (totals.get(c.repriseOuDirection) ?? 0) + c.tonnage);
  }
  return totals;
}

/**
 * stock_actuel[cellule] = stock_précédent[cellule] + entrées[cellule] − sorties[cellule], avec un
 * écart manuel optionnel superposé (comme la correction de réconciliation visible dans le bordereau
 * Excel) — la valeur affichée reste modifiable, la valeur calculée reste tracée à part.
 *
 * Qualité : une cellule qui a du stock (tonnageVif précédent > 0) garde sa qualité active — la saisie
 * (validateCellQualityCompatibility côté client) empêche déjà d'y mélanger une autre qualité. Une
 * cellule totalement vide qui reçoit une nouvelle entrée adopte la qualité de cette entrée : c'est la
 * seule façon dont la qualité active d'une cellule change, confirmé avec l'utilisateur.
 */
export function computeAutoCellules(previousCellules, entrees, sorties, qualitesEntrees = new Map()) {
  return previousCellules.map((c) => {
    const auto = c.tonnageVif + (entrees.get(c.celluleId) ?? 0) - (sorties.get(c.celluleId) ?? 0);
    const ecartManuel = c.ecartManuel ?? 0;
    const tonnageVif = Math.max(0, auto + ecartManuel);
    const nouvelleQualite = qualitesEntrees.get(c.celluleId);
    const qualite = c.tonnageVif <= 0 && nouvelleQualite ? nouvelleQualite : c.qualite;
    return { ...c, qualite, tonnageVifAuto: Math.max(0, auto), ecartManuel, tonnageVif };
  });
}

/** Calcule le snapshot complet d'une journée d'exploitation : part du dernier snapshot connu (ou
 * du plus récent antérieur), applique les mouvements réels du jour. Les zones (Lot 3) ne sont pas
 * recalculées — elles restent telles quelles, à corriger manuellement comme aujourd'hui. */
export async function computeSnapshotForDay(operationalDay) {
  const existing = await getSnapshotByDate(operationalDay);
  if (existing) return existing;

  const previousResult = await db.execute({
    sql: "SELECT * FROM stock_snapshots WHERE date < @date ORDER BY date DESC LIMIT 1",
    args: { date: operationalDay }
  });
  const previous = previousResult.rows[0];

  const baseline = previous
    ? { ...previous, cellules: JSON.parse(previous.cellules), zones: JSON.parse(previous.zones) }
    : {
        date: operationalDay,
        cellules: STOCK_CELLULE_IDS.map((celluleId) => ({ celluleId, qualite: "", tonnageVif: 0, tonnageMort: 0, capaciteTotale: CAPACITES_CELLULES[celluleId] })),
        zones: [],
        etatSilos: 0,
        posteNotes: ""
      };

  const { quantites: entrees, qualites: qualitesEntrees } = await computeEntreesForDay(operationalDay);
  const sorties = await computeSortiesForDay(operationalDay);

  return {
    date: operationalDay,
    cellules: computeAutoCellules(baseline.cellules, entrees, sorties, qualitesEntrees),
    zones: baseline.zones,
    etatSilos: baseline.etatSilos,
    posteNotes: ""
  };
}

/** Toutes les journées d'exploitation (7h → 7h) référencées par au moins un déchargement ou un
 * chargement, triées du plus ancien au plus récent — la liste complète des jours pour lesquels un
 * état de stock a du sens (l'historique demandé "de toutes les dates"). */
export async function getOperationalDaysWithActivity() {
  const days = new Set();

  const dechargements = await db.execute("SELECT date, debutDechargement FROM dechargements");
  for (const d of dechargements.rows) {
    const day = getOperationalDay(d.date, d.debutDechargement || "12:00");
    if (day) days.add(day);
  }
  const chargements = await db.execute("SELECT dateDebutAffect, heureDebutAffect FROM chargements_portique");
  for (const c of chargements.rows) {
    const day = getOperationalDay(c.dateDebutAffect, c.heureDebutAffect || "12:00");
    if (day) days.add(day);
  }

  return [...days].sort();
}

/** Calcule et enregistre un snapshot pour chaque journée d'exploitation ayant une activité réelle
 * (entrées trains ou sorties navires) et n'ayant pas encore de snapshot enregistré — traité du plus
 * ancien au plus récent pour que chaque jour parte correctement du solde calculé de la veille. Les
 * snapshots déjà existants (saisis à la main ou déjà calculés) ne sont jamais écrasés. */
export async function backfillStockSnapshots(actorMatricule) {
  const days = await getOperationalDaysWithActivity();
  const created = [];
  for (const day of days) {
    const existing = await getSnapshotByDate(day);
    if (existing) continue;
    const snapshot = await computeSnapshotForDay(day);
    await upsertSnapshot(snapshot, actorMatricule || "system");
    created.push(day);
  }
  return { totalDaysWithActivity: days.length, created };
}

/**
 * Recalcule et réenregistre TOUS les snapshots (Lot 1+2) ayant une activité réelle, du plus ancien au
 * plus récent, à partir des données de déchargement/chargement actuellement en base — utile après une
 * correction des données sources (ex. re-import navire avec des chiffres corrigés) pour que
 * l'historique déjà calculé reflète les données réellement en base aujourd'hui. Contrairement à
 * backfillStockSnapshots (qui ne comble que les jours manquants), celui-ci écrase les jours déjà
 * enregistrés — mais préserve les zones (Lot 3), l'état des silos et les notes de poste déjà saisis
 * pour chaque jour (saisie manuelle non recalculable).
 *
 * Le point de départ de chaque jour est le snapshot persisté le plus récent qui le précède — exactement
 * la même règle que computeSnapshotForDay — pas seulement le jour précédent dans la liste des jours
 * d'activité : deux jours d'activité peuvent être séparés de plusieurs mois, avec un ou plusieurs
 * relevés manuels (saisis directement dans Gestion de stock) entre les deux qu'il ne faut pas ignorer.
 * Traité chronologiquement et enregistré au fur et à mesure pour que chaque lookup "snapshot précédent"
 * voie déjà le résultat fraîchement recalculé du jour d'activité qui le précède immédiatement.
 */
export async function recomputeAllStockSnapshots(actorMatricule) {
  const days = await getOperationalDaysWithActivity();
  const recomputed = [];

  for (const day of days) {
    const existingResult = await db.execute({ sql: "SELECT * FROM stock_snapshots WHERE date = @date", args: { date: day } });
    const existingRow = existingResult.rows[0];
    const existing = existingRow ? { ...existingRow, zones: JSON.parse(existingRow.zones) } : null;

    const previousResult = await db.execute({
      sql: "SELECT * FROM stock_snapshots WHERE date < @date ORDER BY date DESC LIMIT 1",
      args: { date: day }
    });
    const previousRow = previousResult.rows[0];
    const baselineCellules = previousRow
      ? JSON.parse(previousRow.cellules)
      : STOCK_CELLULE_IDS.map((celluleId) => ({ celluleId, qualite: "", tonnageVif: 0, tonnageMort: 0, capaciteTotale: CAPACITES_CELLULES[celluleId] }));

    const { quantites: entrees, qualites: qualitesEntrees } = await computeEntreesForDay(day);
    const sorties = await computeSortiesForDay(day);
    const cellules = computeAutoCellules(baselineCellules, entrees, sorties, qualitesEntrees);

    const snapshot = {
      date: day,
      cellules,
      zones: existing?.zones ?? [],
      etatSilos: existing?.etatSilos ?? 0,
      posteNotes: existing?.posteNotes ?? ""
    };
    await upsertSnapshot(snapshot, actorMatricule || "system");
    recomputed.push(day);
  }

  return { totalDays: days.length, recomputed };
}

// Ids des 4 peseuses (train/trainData.ts PESEUSES) — une ligne DA/DB/Silos peut désigner une peseuse
// comme destination (chargement direct d'un train vers un navire, sans passer par une cellule ou un
// silo), un 3e chemin "direct" en plus de Dechargement.navireDirect et de la reprise "DIRECT".
const KNOWN_PESEUSE_IDS = ["peseuse-a", "peseuse-b", "peseuse-c", "peseuse-d"];

/** Entrées/sorties/tonnage-direct de la journée, sans filtrage par cellule — contrairement à
 * computeEntreesForDay/computeSortiesForDay (limitées aux 12 cellules Lot 1+2 du snapshot officiel,
 * comportement existant volontairement inchangé), couvre TOUTES les cellules (Lot 1+2+3) et le silo
 * T10, et regroupe les 3 façons dont un train peut aller directement au navire (Dechargement
 * navireDirect, reprise "DIRECT" côté chargement, destination = une peseuse côté DA/DB/Silos). */
async function computeAllMovementsForDay(operationalDay) {
  const dechargementsResult = await db.execute("SELECT * FROM dechargements");
  const entrantMap = new Map();
  let navireDirectQuantite = 0;
  for (const d of dechargementsResult.rows) {
    if (getOperationalDay(d.date, d.debutDechargement || "12:00") !== operationalDay) continue;
    for (const family of ["da", "db", "silos"]) {
      let lines;
      try {
        lines = JSON.parse(d[family] || "[]");
      } catch {
        continue;
      }
      for (const line of lines) {
        for (const share of getDestinationShares(line)) {
          entrantMap.set(share.destination, (entrantMap.get(share.destination) ?? 0) + share.quantite);
        }
      }
    }
    let navireLines;
    try {
      navireLines = JSON.parse(d.navireDirect || "[]");
    } catch {
      navireLines = [];
    }
    for (const row of navireLines) navireDirectQuantite += row.quantite || 0;
  }
  for (const [destination, quantite] of entrantMap.entries()) {
    if (KNOWN_PESEUSE_IDS.includes(destination)) navireDirectQuantite += quantite;
  }

  const chargementsResult = await db.execute(
    "SELECT repriseOuDirection, tonnage, dateDebutAffect, heureDebutAffect FROM chargements_portique"
  );
  const sortantMap = new Map();
  for (const c of chargementsResult.rows) {
    if (getOperationalDay(c.dateDebutAffect, c.heureDebutAffect || "12:00") !== operationalDay) continue;
    if (c.repriseOuDirection === "DIRECT") {
      navireDirectQuantite += c.tonnage || 0;
      continue;
    }
    // "SILOS" (reprise générique, cf. migrate.js NUMERIC_TO_CODE) désigne aujourd'hui sans ambiguïté
    // T10, seul silo réel du circuit (voir synoptiqueManutentionData.ts).
    const key = c.repriseOuDirection === "SILOS" ? "T10" : c.repriseOuDirection;
    sortantMap.set(key, (sortantMap.get(key) ?? 0) + (c.tonnage || 0));
  }

  return { entrantMap, sortantMap, navireDirectQuantite };
}

/** Cumul net (entrées − sorties) depuis la première journée d'activité connue jusqu'à `uptoDay`
 * inclus, pour les destinations sans stock officiel persisté (Lot 3 et le silo T10 — voir
 * getCelluleSiloMovements). Recalculé à la volée à chaque appel : le volume de données (dizaines de
 * jours, dizaines de lignes) rend ce recalcul complet largement suffisant en performance. */
async function computeCumulativeExistant(uptoDay, destinationIds) {
  const totals = new Map(destinationIds.map((id) => [id, 0]));
  const allDays = await getOperationalDaysWithActivity();
  const days = allDays.filter((day) => day <= uptoDay);
  for (const day of days) {
    const { entrantMap, sortantMap } = await computeAllMovementsForDay(day);
    for (const id of destinationIds) {
      const net = (entrantMap.get(id) ?? 0) - (sortantMap.get(id) ?? 0);
      totals.set(id, Math.max(0, (totals.get(id) ?? 0) + net));
    }
  }
  return totals;
}

// Silos/trémies tampons suivis en plus des cellules — T10 (trémies de reprise, poste 66) et DB210
// (silo de vidange : reçoit le trop-plein du circuit DB au déchargement, et le trop-plein renvoyé
// depuis les portiques quand un navire est plein — confirmé avec l'utilisateur). Mêmes ids que
// src/components/train/trainData.ts SILOS.
const SILO_IDS = ["T10", "DB210"];

/**
 * Vue d'ensemble "entrant / sortant / existant" pour chaque cellule (Lot 1, 2, 3) et pour les silos
 * (T10, DB210), sur une journée d'exploitation donnée :
 * - Lot 1 + Lot 2 (12 cellules) : "existant" = stock officiel du jour (snapshot, éventuellement
 *   corrigé via l'écart manuel de Gestion de stock).
 * - Lot 3 (9 cellules) et DB210 : pas de relevé officiel dans le modèle actuel → "existant" = cumul
 *   net calculé depuis la première journée d'activité connue, signalé comme tel côté client.
 * - T10 : le champ saisi à la main `etatSilos` du snapshot du jour est préféré quand il existe (plus
 *   fiable qu'un cumul théorique) ; à défaut, même cumul calculé que pour le Lot 3/DB210.
 */
export async function getCelluleSiloMovements(operationalDay) {
  const { entrantMap, sortantMap, navireDirectQuantite } = await computeAllMovementsForDay(operationalDay);

  const existingSnapshotRow = await getSnapshotByDate(operationalDay);
  const snapshot = existingSnapshotRow ?? (await computeSnapshotForDay(operationalDay));
  const officialExistant = new Map(snapshot.cellules.map((c) => [c.celluleId, c.tonnageVif]));
  const officialQualite = new Map(snapshot.cellules.map((c) => [c.celluleId, c.qualite]));

  const lot3Ids = ALL_CELLULE_IDS.filter((id) => ALL_CELLULE_LOT[id] === "lot-3");
  const cumulLot3 = await computeCumulativeExistant(operationalDay, lot3Ids);
  const cumulSilos = await computeCumulativeExistant(operationalDay, SILO_IDS);

  const cellules = ALL_CELLULE_IDS.map((celluleId) => {
    const isOfficial = STOCK_CELLULE_IDS.includes(celluleId);
    return {
      celluleId,
      lotId: ALL_CELLULE_LOT[celluleId],
      entrant: entrantMap.get(celluleId) ?? 0,
      sortant: sortantMap.get(celluleId) ?? 0,
      existant: isOfficial ? officialExistant.get(celluleId) ?? 0 : cumulLot3.get(celluleId) ?? 0,
      existantSource: isOfficial ? "officiel" : "cumul",
      // Qualité réellement suivie seulement pour le Lot 1+2 (stock officiel) — le Lot 3 n'a pas de
      // relevé de qualité par cellule dans le modèle actuel (voir computeAutoCellules).
      qualite: isOfficial ? officialQualite.get(celluleId) || null : null
    };
  });

  const silos = SILO_IDS.map((siloId) => {
    const useOfficial = siloId === "T10" && existingSnapshotRow;
    return {
      siloId,
      entrant: entrantMap.get(siloId) ?? 0,
      sortant: sortantMap.get(siloId) ?? 0,
      existant: useOfficial ? existingSnapshotRow.etatSilos ?? 0 : cumulSilos.get(siloId) ?? 0,
      existantSource: useOfficial ? "officiel" : "cumul"
    };
  });

  const peseuses = await computePeseusePortiqueActivity(operationalDay);

  return { date: operationalDay, cellules, silos, navireDirect: { quantite: navireDirectQuantite }, peseuses };
}

/** Journée d'exploitation en cours (7h → 7h), pour savoir si une opération de portique/peseuse est
 * réellement "en cours maintenant" (n'a de sens que pour la journée d'aujourd'hui). */
function getCurrentOperationalDayServer() {
  const now = new Date();
  const day = now.getHours() < 7 ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : now;
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

/**
 * Activité par peseuse (A/B/C/D) sur une journée d'exploitation donnée : tonnage total transféré ce
 * jour (chargements_portique.tonnage, quel que soit d'où il vient — cellule, silo ou direct), le(s)
 * portique(s) associé(s), et si une opération est en cours maintenant (heure de début renseignée,
 * heure de fin encore vide) — n'a de sens que pour la journée en cours, pas pour l'historique. Les
 * peseuses/portiques sont de simples convoyeurs de passage, pas des lieux de stockage : pas
 * d'"existant" ici, seulement le débit du jour et l'activité en cours.
 */
async function computePeseusePortiqueActivity(operationalDay) {
  const isToday = operationalDay === getCurrentOperationalDayServer();
  const result = await db.execute(
    "SELECT portique, peseuse, tonnage, dateDebutAffect, heureDebutAffect, heureFinAffect FROM chargements_portique"
  );

  const byPeseuse = new Map();
  for (const c of result.rows) {
    if (!c.peseuse) continue;
    if (getOperationalDay(c.dateDebutAffect, c.heureDebutAffect || "12:00") !== operationalDay) continue;
    const entry = byPeseuse.get(c.peseuse) ?? { peseuse: c.peseuse, portiques: new Set(), tonnage: 0, actif: false };
    entry.tonnage += c.tonnage || 0;
    if (c.portique) entry.portiques.add(c.portique);
    if (isToday && c.heureDebutAffect && !c.heureFinAffect) entry.actif = true;
    byPeseuse.set(c.peseuse, entry);
  }

  return [...byPeseuse.values()]
    .map((e) => ({ peseuse: e.peseuse, portiques: [...e.portiques], tonnage: e.tonnage, actif: e.actif }))
    .sort((a, b) => a.peseuse.localeCompare(b.peseuse));
}
