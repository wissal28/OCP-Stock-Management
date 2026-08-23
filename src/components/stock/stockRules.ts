// Règles métier du module "Gestion de stock". Recoupe "dernier train comptabilisé" et "navire en
// chargement" via l'API (base de données), avec repli sur les données de seed hors-ligne.

import { CELLULES, LOTS, TRAINS, type Train } from "../train/trainData";
import { NAVIRES, type Navire } from "../navire/navireData";
import { calculateRAF, getNaviresEnCours } from "../navire/navireRules";
import { getCurrentOperationalDay, getOperationalDayRange } from "../train/trainRules";
import { STOCK_SNAPSHOTS, type CelluleStock, type StockSnapshot, type ZoneStock } from "./stockData";
import * as api from "../../api";

export { getCurrentOperationalDay, getOperationalDayRange };

export function latestSeedSnapshot(): StockSnapshot {
  return [...STOCK_SNAPSHOTS].sort((a, b) => b.date.localeCompare(a.date))[0];
}

/**
 * L'état de stock du jour J couvre la journée d'exploitation 7h00 (jour J) → 7h00 (jour J+1),
 * exactement comme le bordereau "ETAT DES STOCKS" ("Total stock vif à 7h00") et comme le module
 * Train (trainRules.getCurrentOperationalDay). Si aucun snapshot n'existe encore pour la journée
 * d'exploitation en cours, on le crée en clonant le dernier état connu (le stock ne repart jamais
 * de zéro à 7h — seuls les mouvements du jour le font évoluer).
 */
export function resolveTodaySnapshot(snapshots: StockSnapshot[]): { snapshot: StockSnapshot; isNew: boolean } {
  const today = getCurrentOperationalDay();
  const existing = snapshots.find((s) => s.date === today);
  if (existing) return { snapshot: existing, isNew: false };

  const mostRecent = snapshots[0];
  if (!mostRecent) return { snapshot: { ...latestSeedSnapshot(), date: today }, isNew: true };
  return { snapshot: { ...mostRecent, date: today }, isNew: true };
}

/** Tous les snapshots connus (base de données), triés du plus récent au plus ancien. */
export async function readStockSnapshots(): Promise<StockSnapshot[]> {
  try {
    const snapshots = await api.listStockSnapshots();
    if (snapshots.length > 0) return [...snapshots].sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    // ignore, retombe sur les données de seed hors-ligne
  }
  return [...STOCK_SNAPSHOTS].sort((a, b) => b.date.localeCompare(a.date));
}

export function calculateTaux(tonnageVif: number, tonnageMort: number, capaciteTotale: number): number {
  if (!capaciteTotale) return 0;
  return Math.round(((tonnageVif + tonnageMort) / capaciteTotale) * 10000) / 100;
}

/** Part de la capacité occupée par du stock mort (non recouvrable sans débouchage) — indépendante du
 * taux d'occupation total : une cellule pleine de stock vif (bon produit) n'est pas dans la même
 * situation qu'une cellule pleine de stock mort (capacité bloquée), même si le taux global est identique. */
export function calculateTauxMort(tonnageMort: number, capaciteTotale: number): number {
  if (!capaciteTotale) return 0;
  return Math.round((tonnageMort / capaciteTotale) * 10000) / 100;
}

/** Seuil au-delà duquel le stock mort d'une cellule est jugé critique (nécessite un débouchage),
 * confirmé avec l'utilisateur : c'est le stock mort élevé qui définit l'état critique, pas
 * simplement un taux d'occupation total élevé (qui peut n'être que du bon stock vif). */
export const SEUIL_MORT_CRITIQUE = 60;

export function isMortCritique(tonnageMort: number, capaciteTotale: number): boolean {
  return calculateTauxMort(tonnageMort, capaciteTotale) >= SEUIL_MORT_CRITIQUE;
}

/** Une cellule au stock vif nul est libre : elle n'est pas "vide" dans le mauvais sens, c'est de la
 * capacité disponible, prête à recevoir n'importe quelle nouvelle qualité (voir
 * trainRules.validateCellQualityCompatibility). */
export function isCelluleLibre(tonnageVif: number): boolean {
  return tonnageVif <= 0;
}

export interface QualiteTotal {
  qualite: string;
  tonnageVif: number;
}

/** Recalcule "Total stock vif à 7h00" par qualité à partir de la grille (cellules + zones),
 * au lieu de dupliquer une valeur qui pourrait diverger de la grille éditée. */
export function computeStockParQualite(snapshot: StockSnapshot): QualiteTotal[] {
  const totals = new Map<string, number>();

  const add = (qualite: string, tonnage: number) => {
    if (!qualite || !tonnage) return;
    totals.set(qualite, (totals.get(qualite) ?? 0) + tonnage);
  };

  snapshot.cellules.forEach((c) => add(c.qualite, c.tonnageVif));
  snapshot.zones.forEach((z) => add(z.qualite, z.tonnageVif));

  return Array.from(totals.entries())
    .map(([qualite, tonnageVif]) => ({ qualite, tonnageVif }))
    .sort((a, b) => b.tonnageVif - a.tonnageVif);
}

export function computeTotalStock(snapshot: StockSnapshot): number {
  const cellulesTotal = snapshot.cellules.reduce((sum, c) => sum + c.tonnageVif, 0);
  const zonesTotal = snapshot.zones.reduce((sum, z) => sum + z.tonnageVif, 0);
  return cellulesTotal + zonesTotal;
}

export async function readTrainsFromApi(): Promise<Train[]> {
  try {
    return await api.listTrains();
  } catch {
    return TRAINS;
  }
}

export async function readNaviresFromApi(): Promise<Navire[]> {
  try {
    return await api.listNavires();
  } catch {
    return NAVIRES;
  }
}

/** Dernier train comptabilisé (le plus récent par date/heure d'arrivée réelle ou prévue). */
export function getDernierTrainComptabilise(trains: Train[]): Train | null {
  if (trains.length === 0) return null;
  return [...trains].sort((a, b) => {
    const da = `${a.dateArriveePrevue}T${a.heureArriveeReelle || a.heureArriveePrevue}`;
    const db = `${b.dateArriveePrevue}T${b.heureArriveeReelle || b.heureArriveePrevue}`;
    return db.localeCompare(da);
  })[0];
}

export interface PosteNavire {
  poste: string;
  navire: Navire;
  raf: number;
}

/** Navires actuellement en rade/accostés/en chargement, regroupés par poste — reflète le panneau
 * "Poste / Navire en chargement / RAF à 7h00 / Tonnage à charger" du bordereau. */
export function getNaviresParPoste(navires: Navire[]): PosteNavire[] {
  return getNaviresEnCours(navires)
    .filter((n) => n.poste)
    .map((navire) => ({ poste: navire.poste, navire, raf: calculateRAF(navire.tonnagePrevu, navire.tonnageCharge) }));
}

export function totalCapacite(cellules: CelluleStock[]): number {
  return cellules.reduce((sum, c) => sum + c.capaciteTotale, 0);
}

/** Taux moyen d'occupation (Lots 1+2), factorisé ici pour pouvoir le recalculer identiquement sur
 * le snapshot du jour et sur un snapshot antérieur (comparaison de tendance dans le tableau de bord). */
export function computeTauxGlobal(cellules: CelluleStock[]): number {
  if (cellules.length === 0) return 0;
  const taux = cellules.map((c) => calculateTaux(c.tonnageVif, c.tonnageMort, c.capaciteTotale));
  return Math.round((taux.reduce((sum, t) => sum + t, 0) / taux.length) * 10) / 10;
}

export interface LotTotal {
  lotId: string;
  label: string;
  tonnageVif: number;
}

/** Répartition du stock vif par lot (Lot 1 / Lot 2 / cellules ; Lot 3 = zones globales SA/SB) —
 * réutilise la même identité de cellule (lotId) que le module Train au lieu de redéduire les bornes
 * d'indices ailleurs. */
export function computeStockParLot(snapshot: StockSnapshot): LotTotal[] {
  const lotIdByCellule = new Map(CELLULES.map((c) => [c.id, c.lotId]));
  const totals = new Map<string, number>();

  snapshot.cellules.forEach((c) => {
    const lotId = lotIdByCellule.get(c.celluleId);
    if (!lotId) return;
    totals.set(lotId, (totals.get(lotId) ?? 0) + c.tonnageVif);
  });

  const lot3 = LOTS.find((lot) => lot.isZoneGlobale);
  if (lot3) {
    const lot3Vif = snapshot.zones.reduce((sum, z) => sum + z.tonnageVif, 0);
    totals.set(lot3.id, (totals.get(lot3.id) ?? 0) + lot3Vif);
  }

  return LOTS.map((lot) => ({ lotId: lot.id, label: lot.name, tonnageVif: totals.get(lot.id) ?? 0 }));
}

export function totalCelluleMortVif(cellule: CelluleStock): number {
  return cellule.tonnageVif + cellule.tonnageMort;
}

export function totalZoneMortVif(zone: ZoneStock): number {
  return zone.tonnageVif + zone.tonnageMort;
}
