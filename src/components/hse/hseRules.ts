// Règles métier du module HSE — calculs des indicateurs affichés dans la Vue d'ensemble.

import { ACTIONS, INCIDENTS, INSPECTIONS, type HSEAction, type HSEIncident, type HSEInspection } from "./hseData";
import * as api from "../../api";

/** Incidents/inspections/actions connus (base de données), avec repli sur le seed hors-ligne — même
 * convention que readTrainsFromApi/readNaviresFromApi dans stockRules.ts. */
export async function readIncidentsFromApi(): Promise<HSEIncident[]> {
  try {
    return await api.listIncidents();
  } catch {
    return INCIDENTS;
  }
}

export async function readInspectionsFromApi(): Promise<HSEInspection[]> {
  try {
    return await api.listInspections();
  } catch {
    return INSPECTIONS;
  }
}

export async function readActionsFromApi(): Promise<HSEAction[]> {
  try {
    return await api.listActions();
  } catch {
    return ACTIONS;
  }
}

/** Jours écoulés depuis le dernier Accident (type strictement "Accident", pas Incident/Presqu'accident)
 * — l'indicateur classique "jours sans accident". Renvoie null si aucun accident n'a jamais été
 * enregistré (pas de référence, plutôt que d'afficher un chiffre trompeur). */
export function joursSansAccident(incidents: HSEIncident[]): number | null {
  const accidents = incidents.filter((i) => i.type === "Accident");
  if (accidents.length === 0) return null;
  const dernier = [...accidents].sort((a, b) => `${b.date}${b.heure}`.localeCompare(`${a.date}${a.heure}`))[0];
  const dernierDate = new Date(`${dernier.date}T${dernier.heure || "00:00"}`);
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - dernierDate.getTime()) / (1000 * 60 * 60 * 24)));
}

export interface RepartitionGravite {
  gravite: string;
  count: number;
}

export function repartitionParGravite(incidents: HSEIncident[]): RepartitionGravite[] {
  const totals = new Map<string, number>();
  for (const i of incidents) totals.set(i.gravite, (totals.get(i.gravite) ?? 0) + 1);
  return [...totals.entries()].map(([gravite, count]) => ({ gravite, count }));
}

export interface MoisTotal {
  mois: string; // yyyy-mm
  count: number;
}

/** Nombre d'incidents/accidents par mois, sur les `nbMois` derniers mois (par défaut 6), triés du
 * plus ancien au plus récent — pour un graphique d'évolution simple. */
export function incidentsParMois(incidents: HSEIncident[], nbMois = 6): MoisTotal[] {
  const now = new Date();
  const mois: MoisTotal[] = [];
  for (let i = nbMois - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    mois.push({ mois: key, count: 0 });
  }
  const byKey = new Map(mois.map((m) => [m.mois, m]));
  for (const inc of incidents) {
    const key = inc.date.slice(0, 7);
    const entry = byKey.get(key);
    if (entry) entry.count += 1;
  }
  return mois;
}

export function tauxConformiteInspections(inspections: HSEInspection[]): number {
  if (inspections.length === 0) return 0;
  const conformes = inspections.filter((i) => i.statut === "Conforme").length;
  return Math.round((conformes / inspections.length) * 1000) / 10;
}

export function incidentsOuverts(incidents: HSEIncident[]): HSEIncident[] {
  return incidents.filter((i) => i.statut !== "Clôturé");
}

export function inspectionsAPlanifier(inspections: HSEInspection[]): HSEInspection[] {
  const today = new Date().toISOString().slice(0, 10);
  return inspections.filter((i) => i.dateProchaineInspection && i.dateProchaineInspection <= today);
}

/** Actions dont l'échéance est dépassée et qui ne sont pas encore "Fait" — la veille classique d'un
 * plan d'actions correctives. */
export function actionsEnRetard(actions: HSEAction[]): HSEAction[] {
  const today = new Date().toISOString().slice(0, 10);
  return actions.filter((a) => a.statut !== "Fait" && a.echeance && a.echeance < today);
}
