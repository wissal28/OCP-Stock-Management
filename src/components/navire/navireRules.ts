// Règles métier du module "Gestion des navires".
// Réutilise les calculs génériques du module train (durée/débit) au lieu de les dupliquer.

import { analyzeArrets, calculateCadence, calculateDuration, formatDuration } from "../train/trainRules";
import type { ArretNavire, CalePlan, ChargementPortique, Navire } from "./navireData";

export { analyzeArrets, calculateCadence, calculateDuration, formatDuration };

/** Reste à faire (tonnes) pour atteindre le tonnage prévu. */
export function calculateRAF(tonnagePrevu: number, tonnageCharge: number): number {
  return Math.max(0, tonnagePrevu - tonnageCharge);
}

export function calculateEcart(tonnagePrevu: number, tonnageCharge: number): number {
  return tonnageCharge - tonnagePrevu;
}

/** Somme du tonnage chargé pour un navire, à partir de ses lignes de chargement. */
export function computeNavireTonnageCharge(navireId: string, chargements: ChargementPortique[]): number {
  return chargements.filter((c) => c.navireId === navireId).reduce((sum, c) => sum + c.tonnage, 0);
}

export interface PortiqueTotal {
  portique: string;
  tonnage: number;
  dureeMinutes: number;
  cadence: number | null;
}

/** Agrège le tonnage et la durée totale par portique, pour le pied de page du tableau de chargement. */
export function aggregateTonnageByPortique(chargements: ChargementPortique[]): PortiqueTotal[] {
  const byPortique = new Map<string, { tonnage: number; dureeMinutes: number }>();

  for (const chargement of chargements) {
    const duree = calculateDuration(chargement.heureDebutAffect, chargement.heureFinAffect) ?? 0;
    const current = byPortique.get(chargement.portique) ?? { tonnage: 0, dureeMinutes: 0 };
    current.tonnage += chargement.tonnage;
    current.dureeMinutes += duree;
    byPortique.set(chargement.portique, current);
  }

  return Array.from(byPortique.entries()).map(([portique, totals]) => ({
    portique,
    tonnage: totals.tonnage,
    dureeMinutes: totals.dureeMinutes,
    cadence: calculateCadence(totals.tonnage, totals.dureeMinutes)
  }));
}

export function calculateArretDuration(arret: ArretNavire): number | null {
  if (!arret.heureFin) return null;
  return calculateDuration(arret.heureDebut, arret.heureFin);
}

/** Navires actuellement en rade, accostés ou en cours de chargement — pour un futur module Stock. */
export function getNaviresEnCours(navires: Navire[]): Navire[] {
  return navires.filter((n) => n.statut === "En rade" || n.statut === "Accosté" || n.statut === "En chargement");
}

export interface CaleRAF {
  cale: string;
  tonnagePrevu: number;
  tonnageCharge: number;
  raf: number;
}

/** Reste à charger par cale — remplace le bloc de réconciliation ad-hoc du bordereau Excel (colonnes
 * Q:AB, structure différente chaque jour) par un suivi structuré : tonnage prévu par cale (saisi à la
 * création du navire) contre tonnage réellement chargé sur cette cale (somme des lignes de chargement). */
export function calculateRAFParCale(calesPlan: CalePlan[], chargements: ChargementPortique[]): CaleRAF[] {
  return calesPlan.map((plan) => {
    const tonnageCharge = chargements.filter((c) => c.cale === plan.cale).reduce((sum, c) => sum + c.tonnage, 0);
    return { cale: plan.cale, tonnagePrevu: plan.tonnagePrevu, tonnageCharge, raf: Math.max(0, plan.tonnagePrevu - tonnageCharge) };
  });
}
