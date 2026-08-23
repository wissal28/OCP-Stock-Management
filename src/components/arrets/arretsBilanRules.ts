// Règles métier du module "Bilan des arrêts" — réplique la feuille "Synthèses" du classeur source
// "Bilan et synthèses des arrêts du JUIN 2026" : un tableau croisé équipement × cause avec % et TRS
// (Taux de Rendement Synthétique), pour le chargement des navires (par portique), le déchargement
// des trains (par flux DA10/DB10), et leur total combiné. Calculé à la volée à partir des arrêts déjà
// enregistrés (arrets_navire / arrets_train) — pas de table brute séparée, comme la feuille "Bilan"
// du classeur n'est qu'un journal que "Synthèses" agrège par SUMIFS.

import { ARRETS, type ArretNavire } from "../navire/navireData";
import { ARRETS_TRAIN, type ArretTrain } from "../train/trainData";
import { MAINTENANCE_NATURES, NATURE_ARRET_OPTIONS } from "../train/trainData";
import { calculateDuration } from "../train/trainRules";
import * as api from "../../api";

export { MAINTENANCE_NATURES, NATURE_ARRET_OPTIONS };

/** Arrêts navires/trains connus (base de données), avec repli sur les données de seed hors-ligne —
 * même convention que readTrainsFromApi/readNaviresFromApi dans stockRules.ts. */
export async function readArretsNavireFromApi(): Promise<ArretNavire[]> {
  try {
    return await api.listArrets();
  } catch {
    return ARRETS;
  }
}

export async function readArretsTrainFromApi(): Promise<ArretTrain[]> {
  try {
    return await api.listArretsTrain();
  } catch {
    return ARRETS_TRAIN;
  }
}

export interface BilanRow {
  label: string;
  /** Minutes d'arrêt par cause (uniquement les causes présentes dans cette ligne). */
  byNature: Map<string, number>;
  totalMinutes: number;
  /** Part de cette ligne dans le total du bloc (équivalent colonne "%" de Synthèses). */
  pctOfBlock: number;
  ongoing: number;
  dureeAffectationMinutes: number;
  /** TRS = (durée d'affectation − arrêts de la famille) / durée d'affectation, null si affectation nulle. */
  trsExploitation: number | null;
  trsMaintenance: number | null;
  trsGlobal: number | null;
}

export interface BilanBlock {
  label: string;
  rows: BilanRow[];
  /** Ligne agrégée (total du bloc), même structure qu'une BilanRow. */
  total: BilanRow;
  /** Causes présentes dans ce bloc, triées par durée totale décroissante — sert à n'afficher que les
   * colonnes non nulles du tableau croisé (32 colonnes vides seraient illisibles). */
  activeNatures: string[];
  /** Part de chaque cause dans le total du bloc — équivalent ligne "%" de Synthèses. */
  natureShareOfTotal: Map<string, number>;
}

interface ArretLike {
  heureDebut: string;
  heureFin: string;
  nature: string;
}

function trsFrom(dureeAffectationMinutes: number, lostMinutes: number): number | null {
  if (dureeAffectationMinutes <= 0) return null;
  return Math.max(0, Math.min(1, (dureeAffectationMinutes - lostMinutes) / dureeAffectationMinutes));
}

function buildRow(label: string, byNature: Map<string, number>, ongoing: number, dureeAffectationMinutes: number): BilanRow {
  const totalMinutes = [...byNature.values()].reduce((s, v) => s + v, 0);
  const exploitationMinutes = byNature.get("exploitation") ?? 0;
  const maintenanceMinutes = MAINTENANCE_NATURES.reduce((s, n) => s + (byNature.get(n) ?? 0), 0);

  return {
    label,
    byNature,
    totalMinutes,
    pctOfBlock: 0, // renseigné une fois le total du bloc connu
    ongoing,
    dureeAffectationMinutes,
    trsExploitation: trsFrom(dureeAffectationMinutes, exploitationMinutes),
    trsMaintenance: trsFrom(dureeAffectationMinutes, maintenanceMinutes),
    trsGlobal: trsFrom(dureeAffectationMinutes, exploitationMinutes + maintenanceMinutes)
  };
}

function natureBreakdown(arrets: ArretLike[]): { byNature: Map<string, number>; ongoing: number } {
  const byNature = new Map<string, number>();
  let ongoing = 0;
  for (const a of arrets) {
    const duree = a.heureFin ? calculateDuration(a.heureDebut, a.heureFin) : null;
    if (duree === null) {
      ongoing += 1;
      continue;
    }
    byNature.set(a.nature, (byNature.get(a.nature) ?? 0) + duree);
  }
  return { byNature, ongoing };
}

/**
 * Construit un bloc (ex. "Chargement des navires") : une ligne par équipement (portique ou flux),
 * plus une ligne total. `periodeMinutes` divisée par le nombre d'équipements du bloc donne la durée
 * d'affectation par ligne — même logique que Synthèses!AO15/4 pour les 4 portiques — faute de
 * connaître le planning réel d'affectation minute par minute ; clairement indiqué comme estimation
 * dans l'UI plutôt que présenté comme un chiffre officiel.
 */
export function buildBilanBlock(label: string, equipmentGroups: { label: string; arrets: ArretLike[] }[], periodeMinutes: number): BilanBlock {
  const dureeAffectationParLigne = equipmentGroups.length > 0 ? periodeMinutes / equipmentGroups.length : 0;
  const rows = equipmentGroups.map((g) => {
    const { byNature, ongoing } = natureBreakdown(g.arrets);
    return buildRow(g.label, byNature, ongoing, dureeAffectationParLigne);
  });

  const totalByNature = new Map<string, number>();
  let totalOngoing = 0;
  for (const row of rows) {
    totalOngoing += row.ongoing;
    for (const [nature, minutes] of row.byNature.entries()) totalByNature.set(nature, (totalByNature.get(nature) ?? 0) + minutes);
  }
  const total = buildRow("Total", totalByNature, totalOngoing, periodeMinutes);

  const withPct = rows.map((r) => ({ ...r, pctOfBlock: total.totalMinutes > 0 ? r.totalMinutes / total.totalMinutes : 0 }));

  const natureShareOfTotal = new Map<string, number>();
  for (const [nature, minutes] of total.byNature.entries()) {
    natureShareOfTotal.set(nature, total.totalMinutes > 0 ? minutes / total.totalMinutes : 0);
  }

  const activeNatures = NATURE_ARRET_OPTIONS.filter((n) => (total.byNature.get(n) ?? 0) > 0).sort(
    (a, b) => (total.byNature.get(b) ?? 0) - (total.byNature.get(a) ?? 0)
  );

  return { label, rows: withPct, total: { ...total, pctOfBlock: 1 }, activeNatures, natureShareOfTotal };
}

/** Combine plusieurs blocs (chargement + déchargement) en un bloc "Total" — même principe que la
 * ligne 37 de Synthèses (`<col>15+<col>27`), avec une durée d'affectation combinée pour le TRS global. */
export function combineBilanBlocks(label: string, blocks: BilanBlock[]): BilanBlock {
  const totalByNature = new Map<string, number>();
  let totalOngoing = 0;
  let dureeAffectationTotale = 0;
  for (const block of blocks) {
    totalOngoing += block.total.ongoing;
    dureeAffectationTotale += block.total.dureeAffectationMinutes;
    for (const [nature, minutes] of block.total.byNature.entries()) totalByNature.set(nature, (totalByNature.get(nature) ?? 0) + minutes);
  }
  const total = buildRow("Total", totalByNature, totalOngoing, dureeAffectationTotale);

  const natureShareOfTotal = new Map<string, number>();
  for (const [nature, minutes] of total.byNature.entries()) {
    natureShareOfTotal.set(nature, total.totalMinutes > 0 ? minutes / total.totalMinutes : 0);
  }

  const activeNatures = NATURE_ARRET_OPTIONS.filter((n) => (total.byNature.get(n) ?? 0) > 0).sort(
    (a, b) => (total.byNature.get(b) ?? 0) - (total.byNature.get(a) ?? 0)
  );

  return { label, rows: [], total: { ...total, pctOfBlock: 1 }, activeNatures, natureShareOfTotal };
}

export interface CauseRanking {
  nature: string;
  minutes: number;
  count: number;
}

/** Classement des causes par durée cumulée, tous équipements confondus — équivalent d'un Pareto des
 * arrêts, absent tel quel du classeur mais naturel à partir des mêmes données agrégées. */
export function rankCauses(arrets: ArretLike[]): CauseRanking[] {
  const byNature = new Map<string, { minutes: number; count: number }>();
  for (const a of arrets) {
    const duree = a.heureFin ? calculateDuration(a.heureDebut, a.heureFin) : null;
    if (duree === null) continue;
    const current = byNature.get(a.nature) ?? { minutes: 0, count: 0 };
    current.minutes += duree;
    current.count += 1;
    byNature.set(a.nature, current);
  }
  return [...byNature.entries()].map(([nature, v]) => ({ nature, ...v })).sort((a, b) => b.minutes - a.minutes);
}

export function daysInMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

export function filterByMonth<T extends { dateDebut: string }>(items: T[], yearMonth: string): T[] {
  return items.filter((item) => item.dateDebut.startsWith(yearMonth));
}

export function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function formatPct(ratio: number): string {
  return `${Math.round(ratio * 1000) / 10}%`;
}

export function formatHours(minutes: number): string {
  const h = Math.round((minutes / 60) * 10) / 10;
  return `${h.toLocaleString("fr-FR")} h`;
}

export type { ArretNavire, ArretTrain };
