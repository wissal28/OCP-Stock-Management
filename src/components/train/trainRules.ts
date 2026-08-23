// Règles métier du module "Gestion des trains".
// Toute la logique de calcul et de validation vit ici, pas dans les composants React.

import {
  AXES,
  CELLULES,
  SILOS,
  type Cellule,
  type CelluleQuantitePrevue,
  type Dechargement,
  type DestinationRow,
  type NavireDirectRow,
  type Train
} from "./trainData";

/** Une journée d'exploitation commence à 7h00 et se termine à 6h59 le lendemain. */
export const DAY_START_HOUR = 7;

export function calculateEcart(tonnageExpedie: number, tonnageBascule: number): number {
  return tonnageExpedie - tonnageBascule;
}

/** Retourne la durée en minutes entre deux heures "HH:mm". Gère le passage de minuit. */
export function calculateDuration(debut: string, fin: string): number | null {
  if (!debut || !fin) return null;
  const [dh, dm] = debut.split(":").map(Number);
  const [fh, fm] = fin.split(":").map(Number);
  if ([dh, dm, fh, fm].some((n) => Number.isNaN(n))) return null;
  let minutes = fh * 60 + fm - (dh * 60 + dm);
  if (minutes < 0) minutes += 24 * 60;
  return minutes;
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}`;
}

/** Cadence en tonnes/heure. */
export function calculateCadence(totalQuantite: number, dureeMinutes: number | null): number | null {
  if (!dureeMinutes || dureeMinutes <= 0) return null;
  return Math.round((totalQuantite / (dureeMinutes / 60)) * 10) / 10;
}

export interface DistributionValidation {
  totalReparti: number;
  tonnageBascule: number;
  ecart: number;
  isValid: boolean;
}

/** Compare la somme des quantités réparties (DA+DB+Silos+Cellules+Navire) au tonnage bascule. */
export function validateQuantityDistribution(tonnageBascule: number, allocations: number[], tolerance = 1): DistributionValidation {
  const totalReparti = allocations.reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);
  const ecart = totalReparti - tonnageBascule;
  return { totalReparti, tonnageBascule, ecart, isValid: Math.abs(ecart) <= tolerance };
}

/** Répartit une quantité de façon égale entre N branches ouvertes (aiguillage à 1, 2 ou 3 voies). */
export function splitQuantityByOpenBranches(quantite: number, openBranchesCount: number): number[] {
  if (openBranchesCount <= 0) return [];
  const share = Math.round((quantite / openBranchesCount) * 100) / 100;
  const shares = Array(openBranchesCount).fill(share);
  const rounding = quantite - share * openBranchesCount;
  shares[shares.length - 1] = Math.round((shares[shares.length - 1] + rounding) * 100) / 100;
  return shares;
}

export interface DestinationShare {
  destination: string;
  quantite: number;
}

/**
 * Répartit la quantité d'une ligne DA/DB/Silos entre ses destinations simultanées, en deux niveaux :
 * 1) partage égal entre les groupes de premier niveau (un Lot = un groupe, quel que soit le nombre de
 *    cellules choisies dedans ; un Silo ou une Peseuse forme aussi son propre groupe) ;
 * 2) si plusieurs cellules d'un même Lot sont choisies (une par axe), la part de ce Lot est repartagée
 *    à parts égales entre elles.
 * Exemple : X vers Lot 1 + Lot 2 → X/2 chacun. Si en plus le Lot 1 va vers 2 cellules (2 axes),
 * sa part X/2 est de nouveau divisée en 2, soit X/4 par cellule.
 */
export function getDestinationShares(row: { destinations: string[]; quantite: number }): DestinationShare[] {
  if (row.destinations.length === 0) return [];

  const groupIds: string[] = [];
  const groupMembers = new Map<string, string[]>();

  for (const id of row.destinations) {
    const cellule = CELLULES.find((c) => c.id === id);
    const groupId = cellule ? `lot:${cellule.lotId}` : `single:${id}`;
    if (!groupMembers.has(groupId)) {
      groupMembers.set(groupId, []);
      groupIds.push(groupId);
    }
    groupMembers.get(groupId)!.push(id);
  }

  const level1Shares = splitQuantityByOpenBranches(row.quantite, groupIds.length);

  const shares: DestinationShare[] = [];
  groupIds.forEach((groupId, i) => {
    const members = groupMembers.get(groupId)!;
    const level2Shares = splitQuantityByOpenBranches(level1Shares[i] ?? 0, members.length);
    members.forEach((destination, j) => shares.push({ destination, quantite: level2Shares[j] ?? 0 }));
  });

  return shares;
}

export interface CellCompatibility {
  valid: boolean;
  reason?: string;
}

/**
 * Vérifie qu'une cellule peut recevoir une qualité donnée, et — si `quantite` est fournie — qu'elle a
 * la place pour l'accueillir :
 * - la cellule doit être vide (libre) OU déjà porter la même qualité active avec assez d'espace
 *   disponible pour la quantité entrante (confirmé avec l'utilisateur : une qualité différente
 *   n'est jamais acceptée, même qualité identique n'est acceptée que si l'espace suffit)
 * - dans le même axe, aucune autre cellule ne doit déjà porter une qualité différente active
 *   (règle ignorée pour les cellules du Lot 3, qui ne sont pas subdivisées par axe)
 */
export function validateCellQualityCompatibility(
  celluleId: string,
  qualite: string,
  cellules: Cellule[] = CELLULES,
  quantite?: number
): CellCompatibility {
  const cellule = cellules.find((c) => c.id === celluleId);
  if (!cellule) return { valid: false, reason: "Cellule introuvable" };

  if (cellule.qualiteActive && cellule.qualiteActive !== qualite) {
    return { valid: false, reason: `Cellule ${celluleId} contient déjà la qualité ${cellule.qualiteActive}` };
  }

  if (
    cellule.qualiteActive &&
    cellule.qualiteActive === qualite &&
    quantite &&
    quantite > 0 &&
    cellule.capaciteRestante !== undefined &&
    quantite > cellule.capaciteRestante
  ) {
    return {
      valid: false,
      reason: `Cellule ${celluleId} n'a que ${cellule.capaciteRestante.toLocaleString("fr-FR")} t disponibles, insuffisant pour ${quantite.toLocaleString("fr-FR")} t`
    };
  }

  if (cellule.axeId) {
    const conflict = cellules.find(
      (c) => c.axeId === cellule.axeId && c.id !== celluleId && c.qualiteActive && c.qualiteActive !== qualite
    );
    if (conflict) {
      return {
        valid: false,
        reason: `Qualité ${conflict.qualiteActive} déjà active sur ${conflict.id} (même axe) : ${qualite} ne peut pas y coexister`
      };
    }
  }

  return { valid: true };
}

export interface LiveCelluleStock {
  celluleId: string;
  qualite: string;
  tonnageVif: number;
  tonnageMort: number;
  capaciteTotale: number;
}

/** Fusionne la structure statique des cellules (axe/lot) avec la qualité, le tonnage et la capacité
 * réellement en stock aujourd'hui (Gestion de stock) — une cellule sans stock réel (tonnageVif ≤ 0)
 * est traitée comme vide (qualiteActive = null) même si une ancienne qualité traîne dans les données,
 * pour qu'une nouvelle qualité puisse toujours y être affectée une fois la cellule vidée. Une cellule
 * non vide expose aussi sa capacité restante, pour bloquer une quantité qui déborderait même à
 * qualité identique. Partagé entre TrainFormModal (déchargement) et CelluleQuantiteEditor (planification
 * à la création du train) — même règle aux deux endroits où un opérateur choisit une cellule de destination. */
export function buildLiveCellules(liveStock: LiveCelluleStock[] | null, cellules: Cellule[] = CELLULES): Cellule[] {
  if (!liveStock) return cellules;
  const byId = new Map(liveStock.map((c) => [c.celluleId, c]));
  return cellules.map((c) => {
    const live = byId.get(c.id);
    const isEmpty = !live || live.tonnageVif <= 0;
    const capaciteRestante = live ? Math.max(0, live.capaciteTotale - live.tonnageVif - live.tonnageMort) : undefined;
    return { ...c, qualiteActive: isEmpty ? null : live.qualite, capaciteRestante };
  });
}

/** Suggère les cellules disponibles (vides ou compatibles) pour une qualité donnée. */
export function suggestAvailableCells(qualite: string, cellules: Cellule[] = CELLULES): Cellule[] {
  return cellules.filter((c) => validateCellQualityCompatibility(c.id, qualite, cellules).valid);
}

/** Numéro court et séquentiel d'une cellule (ex. SA211 → 1, SA212 → 2...), pour une abréviation lisible dans l'UI. */
export function getCelluleNumero(celluleId: string): number | null {
  const index = CELLULES.findIndex((c) => c.id === celluleId);
  return index === -1 ? null : index + 1;
}

/** Libellé d'affichage d'une cellule combinant son code et son abréviation numérotée (ex. "SA211 · Cellule 1"). */
export function formatCelluleLabel(cellule: Cellule): string {
  const numero = getCelluleNumero(cellule.id);
  return numero ? `${cellule.id} · Cellule ${numero}` : cellule.id;
}

export interface AxeExclusivityConflict {
  axeId: string;
  axeName: string;
  celluleIds: string[];
}

/**
 * Règle métier : pour une même opération de déchargement, au maximum une cellule par axe peut
 * être choisie comme destination — que la cellule soit choisie via DA, DB ou la section Cellules
 * (ex. LOT 1 : une cellule de l'axe A et une de l'axe B est permis, mais deux cellules de l'axe A
 * ne le sont pas). Les cellules du Lot 3 (sans axe) ne sont pas concernées.
 */
export function validateAxeExclusivity(selectedCelluleIds: string[]): AxeExclusivityConflict[] {
  const byAxe = new Map<string, string[]>();
  for (const id of selectedCelluleIds) {
    if (!id) continue;
    const cellule = CELLULES.find((c) => c.id === id);
    if (!cellule?.axeId) continue;
    const list = byAxe.get(cellule.axeId) ?? [];
    if (!list.includes(id)) list.push(id);
    byAxe.set(cellule.axeId, list);
  }

  const conflicts: AxeExclusivityConflict[] = [];
  for (const [axeId, celluleIds] of byAxe.entries()) {
    if (celluleIds.length > 1) {
      const axe = AXES.find((a) => a.id === axeId);
      conflicts.push({ axeId, axeName: axe?.name ?? axeId, celluleIds });
    }
  }
  return conflicts;
}

/**
 * Renvoie l'ensemble des ids de cellules à bloquer pour un sélecteur donné, car elles appartiennent
 * au même axe qu'une cellule déjà choisie ailleurs (DA, DB, Cellules) dans la même opération.
 */
export function getBlockedCellIds(otherSelectedCelluleIds: string[]): Set<string> {
  const blocked = new Set<string>();
  for (const id of otherSelectedCelluleIds) {
    if (!id) continue;
    const cellule = CELLULES.find((c) => c.id === id);
    if (!cellule?.axeId) continue;
    CELLULES.filter((c) => c.axeId === cellule.axeId && c.id !== id).forEach((c) => blocked.add(c.id));
  }
  return blocked;
}

export interface DestinationTotals {
  da: number;
  db: number;
  silos: number;
  cellules: number;
  navire: number;
  total: number;
}

export function calculateTotalByDestination(dechargement: Dechargement): DestinationTotals {
  const da = dechargement.da.reduce((s, r) => s + r.quantite, 0);
  const db = dechargement.db.reduce((s, r) => s + r.quantite, 0);
  const silos = dechargement.silos.reduce((s, r) => s + r.quantite, 0);
  const cellules = dechargement.cellules.reduce((s, r) => s + r.quantite, 0);
  const navire = dechargement.navireDirect.reduce((s, r) => s + r.quantite, 0);
  return { da, db, silos, cellules, navire, total: da + db + silos + cellules + navire };
}

export interface CelluleTransfer {
  /** Id de destination exact — code de cellule (ex. "SA211") ou id de silo (ex. "T10"). */
  destination: string;
  quantite: number;
}

/**
 * Agrège, pour un ou plusieurs déchargements (typiquement tous ceux d'un même train), la quantité
 * exacte transférée vers chaque cellule/silo : répartit d'abord chaque ligne DA/DB/Silos entre ses
 * destinations simultanées (getDestinationShares gère le partage par lot/axe), puis additionne par
 * destination — donne la réponse à "quelle cellule exactement, et combien" plutôt qu'un total DA/DB
 * agrégé.
 */
export function getCelluleTransfersForDechargements(dechargements: Dechargement[]): CelluleTransfer[] {
  const totals = new Map<string, number>();
  const add = (destination: string, quantite: number) => {
    if (!destination) return;
    totals.set(destination, (totals.get(destination) ?? 0) + quantite);
  };
  for (const d of dechargements) {
    for (const row of [...d.da, ...d.db, ...d.silos]) {
      for (const share of getDestinationShares(row)) add(share.destination, share.quantite);
    }
    for (const c of d.cellules) add(c.celluleId, c.quantite);
  }
  return [...totals.entries()]
    .map(([destination, quantite]) => ({ destination, quantite: Math.round(quantite * 100) / 100 }))
    .sort((a, b) => b.quantite - a.quantite);
}

export type DestinationFamily = "DA" | "DB" | "Silos" | "Direct";

/**
 * Détermine, pour chaque ligne cellule(s)/silo(s)/navire prévu(s) saisie à la création d'un train,
 * par quel flux elle sera réellement déchargée. Pour une destination cellule, c'est l'opérateur qui
 * décide (row.flux) — pas l'application (confirmé avec l'utilisateur) : une alternance DA/DB est
 * juste proposée par défaut tant qu'il n'a pas choisi explicitement. Les silos (T10/DB210) vont dans
 * la famille Silos, "Navire direct" dans son propre flux — pas de choix DA/DB pour ceux-là. Affiché
 * en saisie (CelluleQuantiteEditor) et utilisé tel quel par buildDechargementFromTrain, pour que ce
 * que l'opérateur voit corresponde exactement à ce qui est enregistré.
 */
export function classifyDestinationRows(rows: CelluleQuantitePrevue[]): { row: CelluleQuantitePrevue; family: DestinationFamily }[] {
  const celluleIds = new Set(CELLULES.map((c) => c.id));
  const siloIds = new Set(SILOS.map((s) => s.id));
  let celluleIndex = 0;
  return rows.map((row) => {
    if (celluleIds.has(row.celluleId)) {
      const family: DestinationFamily = row.flux ?? (celluleIndex % 2 === 0 ? "DA" : "DB");
      celluleIndex += 1;
      return { row, family };
    }
    if (siloIds.has(row.celluleId)) return { row, family: "Silos" as const };
    return { row, family: "Direct" as const };
  });
}

/**
 * Construit automatiquement le déchargement d'un train à partir de ses cellule(s)/silo(s)/navire
 * prévu(s) saisis à la création — évite de ressaisir une seconde fois la même information dans
 * "Déchargement des trains" (voir classifyDestinationRows pour la règle de répartition). Le résultat
 * reste modifiable ensuite (axe, heures, tonnage réel...) comme n'importe quel déchargement.
 */
export function buildDechargementFromTrain(train: Train): Dechargement {
  const da: DestinationRow[] = [];
  const db: DestinationRow[] = [];
  const silos: DestinationRow[] = [];
  const navireDirect: NavireDirectRow[] = [];

  for (const { row, family } of classifyDestinationRows(train.celluleDestinationPrevue)) {
    if (family === "DA" || family === "DB") {
      const target = family === "DA" ? da : db;
      target.push({ destinations: [row.celluleId], qualite: train.qualite, quantite: row.quantite, periode: "" });
    } else if (family === "Silos") {
      silos.push({ destinations: [row.celluleId], qualite: train.qualite, quantite: row.quantite, periode: "" });
    } else {
      navireDirect.push({ quantite: row.quantite, qualite: train.qualite, peseuseId: "", portiqueId: "", periode: "", navire: "" });
    }
  }

  return {
    id: `dech-${train.numeroTrain || train.id}-${Date.now()}`,
    trainId: train.id,
    date: train.dateArriveePrevue,
    numeroTrain: train.numeroTrain,
    matricule: train.matricule || train.numeroTrain,
    nombreWagons: train.nombreWagons,
    tonnageExpedie: train.tonnageExpedie,
    tonnageBascule: train.tonnageBascule,
    axe: "",
    debutDechargement: "",
    finDechargement: "",
    da,
    db,
    silos,
    cellules: [],
    navireDirect,
    observations: ""
  };
}

export function getAxeByCelluleId(celluleId: string) {
  const cellule = CELLULES.find((c) => c.id === celluleId);
  if (!cellule?.axeId) return null;
  return AXES.find((a) => a.id === cellule.axeId) ?? null;
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Calcule la "journée d'exploitation" (7h → 7h le lendemain) à laquelle rattacher un événement.
 * Un événement survenant avant 7h00 est rattaché à la journée d'exploitation de la veille.
 */
export function getOperationalDay(date: string, heure: string): string {
  if (!date) return date;
  const hour = heure ? Number(heure.split(":")[0]) : DAY_START_HOUR;
  if (Number.isNaN(hour)) return date;
  return hour < DAY_START_HOUR ? addDays(date, -1) : date;
}

/**
 * Journée d'exploitation en cours, déduite de l'heure réelle (horloge de l'appareil) : plus besoin de
 * saisir une date manuellement, la bonne journée (7h → 7h) est détectée automatiquement.
 */
export function getCurrentOperationalDay(): string {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const heure = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return getOperationalDay(date, heure);
}

function formatFrDate(day: string): string {
  const [y, m, d] = day.split("-");
  return `${d}/${m}/${y}`;
}

export interface OperationalDayRange {
  startDate: string;
  endDate: string;
  label: string;
}

/** Renvoie les bornes civiles (07:00 → 07:00 le lendemain) d'une journée d'exploitation, et un libellé prêt à afficher. */
export function getOperationalDayRange(day: string): OperationalDayRange {
  const endDate = addDays(day, 1);
  return {
    startDate: day,
    endDate,
    label: `${formatFrDate(day)} 07:00 → ${formatFrDate(endDate)} 07:00`
  };
}

/**
 * Inverse de getOperationalDay : renvoie la date civile à utiliser pour qu'un événement à `heure`
 * reste rattaché à la journée d'exploitation `operationalDay` (7h → 7h). Une heure avant 7h00 doit
 * être datée du lendemain civil de `operationalDay`, sinon elle retomberait par erreur sur la
 * journée d'exploitation précédente.
 */
export function civilDateForOperationalDay(operationalDay: string, heure: string): string {
  if (!operationalDay) return operationalDay;
  const hour = heure ? Number(heure.split(":")[0]) : DAY_START_HOUR;
  if (Number.isNaN(hour)) return operationalDay;
  return hour < DAY_START_HOUR ? getOperationalDayRange(operationalDay).endDate : operationalDay;
}

export function formatOperationalDayLabel(day: string): string {
  if (!day) return "—";
  return `Journée d'exploitation : ${getOperationalDayRange(day).label}`;
}

/** Minutes écoulées depuis 7h00 du début de la journée d'exploitation, pour comparer des heures qui traversent minuit. */
function minutesSinceDayStart(heure: string): number | null {
  if (!heure) return null;
  const [h, m] = heure.split(":").map(Number);
  if ([h, m].some((n) => Number.isNaN(n))) return null;
  return ((h * 60 + m - DAY_START_HOUR * 60) % (24 * 60) + 24 * 60) % (24 * 60);
}

/** Regroupe les déchargements par journée d'exploitation (7h → 7h), triés du plus récent au plus ancien. */
export function groupDechargementsByOperationalDay(dechargements: Dechargement[]): Map<string, Dechargement[]> {
  const groups = new Map<string, Dechargement[]>();
  for (const d of dechargements) {
    const day = getOperationalDay(d.date, d.debutDechargement || "12:00");
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(d);
  }
  return new Map([...groups.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)));
}

export function formatHM(minutes: number | null): string {
  if (minutes === null || Number.isNaN(minutes)) return "0:00";
  const sign = minutes < 0 ? "-" : "";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = Math.round(abs % 60);
  return `${sign}${h}:${String(m).padStart(2, "0")}`;
}

export interface ArretNatureBreakdown {
  nature: string;
  minutes: number;
  count: number;
}

export interface ArretAnalysis {
  totalMinutes: number;
  count: number;
  /** Arrêts sans heure de fin renseignée — toujours en cours. */
  ongoing: number;
  /** Répartition par nature, triée de la plus longue à la plus courte. */
  byNature: ArretNatureBreakdown[];
}

/**
 * Analyse générique d'une liste d'arrêts (train ou navire — les deux partagent heureDebut/heureFin/
 * nature) : durée totale immobilisée, répartition par cause, arrêts encore en cours. Sert à la fois
 * à TrainDetailsPanel et NavireDetailsPanel, pour répondre à "combien de temps perdu, et pourquoi".
 */
export function analyzeArrets<T extends { heureDebut: string; heureFin: string; nature: string }>(arrets: T[]): ArretAnalysis {
  let totalMinutes = 0;
  let ongoing = 0;
  const byNatureMap = new Map<string, { minutes: number; count: number }>();

  for (const arret of arrets) {
    const duree = arret.heureFin ? calculateDuration(arret.heureDebut, arret.heureFin) : null;
    if (duree === null) {
      ongoing += 1;
      continue;
    }
    totalMinutes += duree;
    const current = byNatureMap.get(arret.nature) ?? { minutes: 0, count: 0 };
    current.minutes += duree;
    current.count += 1;
    byNatureMap.set(arret.nature, current);
  }

  const byNature = Array.from(byNatureMap.entries())
    .map(([nature, v]) => ({ nature, ...v }))
    .sort((a, b) => b.minutes - a.minutes);

  return { totalMinutes, count: arrets.length, ongoing, byNature };
}

export interface DayFooterTotals {
  nbTrains: number;
  nbWagons: number;
  dureeTotaleMinutes: number;
  dureeMoyenneMinutes: number;
  tonnageDA: number;
  tonnageDB: number;
  tonnageTotal: number;
  dureeAffectationMinutes: number;
  retardMinutes: number;
  cadence: number | null;
  tdMaintExploitMinutes: number;
}

/** Calcule la ligne de totaux du bas de tableau pour une journée d'exploitation donnée. */
export function computeDayFooterTotals(dechargements: Dechargement[], trains: Train[] = []): DayFooterTotals {
  const nbTrains = dechargements.length;
  const nbWagons = dechargements.reduce((s, d) => s + d.nombreWagons, 0);

  const durations = dechargements
    .map((d) => calculateDuration(d.debutDechargement, d.finDechargement))
    .filter((v): v is number => v !== null);
  const dureeTotaleMinutes = durations.reduce((s, v) => s + v, 0);
  const dureeMoyenneMinutes = durations.length ? dureeTotaleMinutes / durations.length : 0;

  const totals = dechargements.map((d) => calculateTotalByDestination(d));
  const tonnageDA = totals.reduce((s, t) => s + t.da, 0);
  const tonnageDB = totals.reduce((s, t) => s + t.db, 0);
  const tonnageTotal = tonnageDA + tonnageDB;

  const starts = dechargements.map((d) => minutesSinceDayStart(d.debutDechargement)).filter((v): v is number => v !== null);
  const ends = dechargements.map((d) => minutesSinceDayStart(d.finDechargement)).filter((v): v is number => v !== null);
  const dureeAffectationMinutes = starts.length && ends.length ? Math.max(...ends) - Math.min(...starts) : 0;

  const retardMinutes = dechargements.reduce((sum, d) => {
    const train = trains.find((t) => t.numeroTrain === d.numeroTrain);
    if (!train?.heureArriveeReelle || !train.heureArriveePrevue) return sum;
    const retard = calculateDuration(train.heureArriveePrevue, train.heureArriveeReelle);
    return train.heureArriveeReelle > train.heureArriveePrevue && retard !== null ? sum + retard : sum;
  }, 0);

  const tonnageBasculeTotal = dechargements.reduce((s, d) => s + d.tonnageBascule, 0);
  const cadence = calculateCadence(tonnageBasculeTotal, dureeTotaleMinutes || null);

  const tdMaintExploitMinutes = Math.max(0, 24 * 60 - dureeAffectationMinutes);

  return {
    nbTrains,
    nbWagons,
    dureeTotaleMinutes,
    dureeMoyenneMinutes,
    tonnageDA,
    tonnageDB,
    tonnageTotal,
    dureeAffectationMinutes,
    retardMinutes,
    cadence,
    tdMaintExploitMinutes
  };
}
