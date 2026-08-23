import { MAINTENANCE_INTERVENTIONS, type MaintenanceIntervention } from "./maintenanceData";
import * as api from "../../api";

/** Interventions connues (base de données), avec repli sur le seed hors-ligne — même convention que
 * readTrainsFromApi/readNaviresFromApi dans stockRules.ts. */
export async function readMaintenanceFromApi(): Promise<MaintenanceIntervention[]> {
  try {
    return await api.listMaintenance();
  } catch {
    return MAINTENANCE_INTERVENTIONS;
  }
}

/** Interventions dont la date prévue est dépassée sans être terminées/annulées. */
export function interventionsEnRetard(interventions: MaintenanceIntervention[]): MaintenanceIntervention[] {
  const today = new Date().toISOString().slice(0, 10);
  return interventions.filter((i) => i.statut !== "Terminée" && i.statut !== "Annulée" && i.datePrevue && i.datePrevue < today);
}

/** Interventions planifiées dans les `days` prochains jours (par défaut 7) — vue "à venir". */
export function interventionsAVenir(interventions: MaintenanceIntervention[], days = 7): MaintenanceIntervention[] {
  const today = new Date();
  const limit = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  const todayStr = today.toISOString().slice(0, 10);
  const limitStr = limit.toISOString().slice(0, 10);
  return interventions.filter((i) => i.statut === "Planifiée" && i.datePrevue >= todayStr && i.datePrevue <= limitStr);
}

export interface TypeTotal {
  type: string;
  count: number;
}

export function repartitionParType(interventions: MaintenanceIntervention[]): TypeTotal[] {
  const totals = new Map<string, number>();
  for (const i of interventions) totals.set(i.type, (totals.get(i.type) ?? 0) + 1);
  return [...totals.entries()].map(([type, count]) => ({ type, count }));
}

/** Part des interventions préventives sur le total terminé — indicateur classique de maturité d'un
 * plan de maintenance (plus il est élevé, moins on subit de pannes non planifiées). */
export function tauxPreventif(interventions: MaintenanceIntervention[]): number {
  const terminees = interventions.filter((i) => i.statut === "Terminée");
  if (terminees.length === 0) return 0;
  const preventives = terminees.filter((i) => i.type === "Préventive").length;
  return Math.round((preventives / terminees.length) * 1000) / 10;
}
