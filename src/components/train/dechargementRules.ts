// Règles métier dédiées à la page "Déchargement des trains".
// Réexporte les fonctions communes définies dans trainRules.ts (source unique de vérité)
// sous les noms attendus par cette page, et ajoute calculateDailyTotals / getOperationalDayRange.

import type { Dechargement } from "./trainData";
import { civilDateForOperationalDay, getOperationalDay, validateAxeExclusivity } from "./trainRules";
export { validateCellQualityCompatibility } from "./trainRules";

export {
  buildLiveCellules,
  calculateEcart,
  calculateDuration,
  calculateCadence,
  getOperationalDay,
  getCurrentOperationalDay,
  getOperationalDayRange,
  civilDateForOperationalDay,
  groupDechargementsByOperationalDay,
  formatOperationalDayLabel,
  formatHM,
  calculateTotalByDestination,
  validateQuantityDistribution,
  computeDayFooterTotals as calculateDailyTotals,
  validateAxeExclusivity,
  getBlockedCellIds,
  getCelluleNumero,
  formatCelluleLabel,
  getDestinationShares,
  getCelluleTransfersForDechargements,
  type OperationalDayRange,
  type DayFooterTotals as DailyTotals,
  type DestinationTotals,
  type AxeExclusivityConflict,
  type DestinationShare,
  type CelluleTransfer,
  type LiveCelluleStock
} from "./trainRules";

const QUALITE_REGEX = /^K(0[0-9]|1[0-9]|20)$/;
const HEURE_REGEX = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

export function isValidTonnage(value: string): boolean {
  if (value.trim() === "") return true;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
}

export function isValidQuantite(value: string): boolean {
  return isValidTonnage(value);
}

export function isValidQualite(value: string): boolean {
  if (value.trim() === "") return true;
  return QUALITE_REGEX.test(value.trim().toUpperCase());
}

export function isValidHeure(value: string): boolean {
  if (value.trim() === "") return true;
  return HEURE_REGEX.test(value.trim());
}

export function isValidNumeroTrain(value: string): boolean {
  return value.trim().length > 0;
}

/** Crée une ligne de déchargement vide, prête à être remplie cellule par cellule comme dans Excel. */
export function createEmptyDechargement(date: string): Dechargement {
  const id = `dech-new-${Date.now()}-${Math.round(Math.random() * 1000)}`;
  return {
    id,
    trainId: id,
    date,
    numeroTrain: "",
    matricule: "",
    nombreWagons: 0,
    tonnageExpedie: 0,
    tonnageBascule: 0,
    axe: "",
    debutDechargement: "",
    finDechargement: "",
    da: [{ destinations: [], qualite: "", quantite: 0, periode: "" }],
    db: [{ destinations: [], qualite: "", quantite: 0, periode: "" }],
    silos: [{ destinations: [], qualite: "", quantite: 0, periode: "" }],
    cellules: [],
    navireDirect: [],
    observations: ""
  };
}

/** Vide le contenu d'une ligne tout en la gardant rattachée à sa journée d'exploitation d'origine. */
export function clearDechargementRow(d: Dechargement): Dechargement {
  const operationalDay = getOperationalDay(d.date, d.debutDechargement || "12:00");
  return { ...createEmptyDechargement(operationalDay), id: d.id, trainId: d.trainId };
}

/**
 * Applique la valeur saisie dans une cellule de la grille (clé à points pour les familles
 * DA/DB/Silos, ex. "da.quantite") et renvoie le patch partiel à fusionner dans le déchargement.
 * Le sous-champ "destination" (multi-valeurs) est géré séparément par applyDestinationsToDechargement.
 */
export function applyFieldToDechargement(d: Dechargement, colKey: string, rawValue: string): Partial<Dechargement> {
  if (colKey.includes(".")) {
    const [family, subfield] = colKey.split(".") as ["da" | "db" | "silos", "qualite" | "quantite" | "periode" | "destination"];
    if (subfield === "destination") return {};
    const rows = d[family].length ? [...d[family]] : [{ destinations: [], qualite: "", quantite: 0, periode: "" }];
    const row = { ...rows[0] };
    if (subfield === "quantite") row.quantite = Number(rawValue) || 0;
    else row[subfield] = rawValue;
    rows[0] = row;
    return { [family]: rows } as Partial<Dechargement>;
  }

  switch (colKey) {
    case "numeroTrain":
      return { numeroTrain: rawValue };
    case "nombreWagons":
      return { nombreWagons: Number(rawValue) || 0 };
    case "tonnageExpedie":
      return { tonnageExpedie: Number(rawValue) || 0 };
    case "tonnageBascule":
      return { tonnageBascule: Number(rawValue) || 0 };
    case "axe":
      return { axe: rawValue };
    case "debutDechargement": {
      // La ligne doit rester rattachée à la même journée d'exploitation (7h → 7h) quelle que soit
      // l'heure saisie : on recalcule la date civile pour que getOperationalDay(date, rawValue)
      // redonne toujours la journée d'exploitation d'origine de la ligne, sans jamais dériver
      // silencieusement vers la journée précédente ou suivante.
      const operationalDay = getOperationalDay(d.date, d.debutDechargement || "12:00");
      return { debutDechargement: rawValue, date: civilDateForOperationalDay(operationalDay, rawValue) };
    }
    case "finDechargement":
      return { finDechargement: rawValue };
    default:
      return {};
  }
}

/** Remplace les destinations simultanées (famille DA/DB/Silos) choisies pour la ligne. */
export function applyDestinationsToDechargement(d: Dechargement, family: "da" | "db" | "silos", values: string[]): Partial<Dechargement> {
  const rows = d[family].length ? [...d[family]] : [{ destinations: [], qualite: "", quantite: 0, periode: "" }];
  rows[0] = { ...rows[0], destinations: values };
  return { [family]: rows } as Partial<Dechargement>;
}

/** Lit les destinations actuellement choisies pour une famille (DA/DB/Silos) d'un déchargement. */
export function readDestinationsFromDechargement(d: Dechargement, family: "da" | "db" | "silos"): string[] {
  return d[family][0]?.destinations ?? [];
}

/** Lit la valeur texte actuelle d'une cellule de la grille, pour l'affichage dans EditableCell. */
export function readFieldFromDechargement(d: Dechargement, colKey: string): string {
  if (colKey.includes(".")) {
    const [family, subfield] = colKey.split(".") as ["da" | "db" | "silos", "qualite" | "quantite" | "periode" | "destination"];
    const row = d[family][0];
    if (!row) return "";
    if (subfield === "destination") return row.destinations.join(", ");
    if (subfield === "quantite") return row.quantite ? String(row.quantite) : "";
    return row[subfield] ?? "";
  }
  switch (colKey) {
    case "numeroTrain":
      return d.numeroTrain;
    case "nombreWagons":
      return d.nombreWagons ? String(d.nombreWagons) : "";
    case "tonnageExpedie":
      return d.tonnageExpedie ? String(d.tonnageExpedie) : "";
    case "tonnageBascule":
      return d.tonnageBascule ? String(d.tonnageBascule) : "";
    case "axe":
      return d.axe;
    case "debutDechargement":
      return d.debutDechargement;
    case "finDechargement":
      return d.finDechargement;
    default:
      return "";
  }
}

/** Valide la valeur d'une cellule selon sa colonne. */
export function isValidField(colKey: string, rawValue: string): boolean {
  if (colKey.endsWith("qualite")) return isValidQualite(rawValue);
  if (colKey.endsWith("quantite") || colKey === "tonnageExpedie" || colKey === "tonnageBascule" || colKey === "nombreWagons") {
    return isValidTonnage(rawValue);
  }
  if (colKey === "debutDechargement" || colKey === "finDechargement") return isValidHeure(rawValue);
  if (colKey === "numeroTrain") return true;
  return true;
}

export interface RowValidationIssue {
  field: string;
  message: string;
}

/**
 * Rassemble les ids de cellules choisies comme destination dans un déchargement, quel que soit le
 * flux d'origine : DA, DB, Silos (qui peuvent eux aussi rediriger vers une cellule ou une peseuse)
 * et la section Cellules. Les ids de silos/peseuses ne correspondent à aucune cellule et sont ignorés
 * automatiquement par les fonctions d'axe (validateAxeExclusivity, getBlockedCellIds).
 */
export function collectSelectedCelluleIds(d: Pick<Dechargement, "da" | "db" | "silos" | "cellules">): string[] {
  return [
    ...d.da.flatMap((r) => r.destinations),
    ...d.db.flatMap((r) => r.destinations),
    ...d.silos.flatMap((r) => r.destinations),
    ...d.cellules.map((c) => c.celluleId).filter(Boolean)
  ];
}

/** Valide l'ensemble d'une ligne (champs + cohérence de répartition) et renvoie la liste des problèmes. */
export function validateDechargementRow(d: Dechargement): RowValidationIssue[] {
  const issues: RowValidationIssue[] = [];
  if (!isValidNumeroTrain(d.numeroTrain)) issues.push({ field: "numeroTrain", message: "Numéro de train manquant" });
  if (!isValidHeure(d.debutDechargement)) issues.push({ field: "debutDechargement", message: "Heure de début invalide" });
  if (!isValidHeure(d.finDechargement)) issues.push({ field: "finDechargement", message: "Heure de fin invalide" });
  for (const [family, label] of [
    ["da", "DA"],
    ["db", "DB"],
    ["silos", "Silos"]
  ] as const) {
    const row = d[family][0];
    if (row?.qualite && !isValidQualite(row.qualite)) issues.push({ field: `${family}.qualite`, message: `Qualité ${label} invalide (attendu K00–K20)` });
  }

  const axeConflicts = validateAxeExclusivity(collectSelectedCelluleIds(d));
  for (const conflict of axeConflicts) {
    issues.push({
      field: "axe",
      message: `${conflict.axeName} : ${conflict.celluleIds.join(", ")} — une seule cellule autorisée par axe et par opération`
    });
  }

  return issues;
}
