// Règles métier du centre de notifications — agrège les anomalies déjà détectables ailleurs dans
// l'app (stock mort critique, incidents HSE, inspections/actions en retard, trains en retard, arrêts
// en cours prolongés) en une seule liste triée par sévérité. Purement dérivé : aucune donnée propre,
// aucune table — recalculé à chaque ouverture depuis les données déjà exposées par l'API.

import type { CelluleStock } from "../components/stock/stockData";
import { isMortCritique } from "../components/stock/stockRules";
import type { HSEAction, HSEIncident, HSEInspection } from "../components/hse/hseData";
import { actionsEnRetard, incidentsOuverts, inspectionsAPlanifier } from "../components/hse/hseRules";
import type { Train } from "../components/train/trainData";
import { calculateDuration } from "../components/train/trainRules";

export type NotificationSeverity = "critique" | "attention" | "info";

export interface AppNotification {
  id: string;
  severity: NotificationSeverity;
  label: string;
  detail: string;
  /** Clé de vue UserPage vers laquelle naviguer au clic (train, navires, stock, hse). */
  view: string;
}

/** Un arrêt encore ouvert (heureFin vide) depuis plus de `seuilHeures` — signale un arrêt anormalement
 * long plutôt qu'un simple arrêt en cours normal. */
function isArretProlonge(heureDebut: string, dateDebut: string, seuilHeures: number): boolean {
  if (!heureDebut || !dateDebut) return false;
  const debut = new Date(`${dateDebut}T${heureDebut}:00`);
  if (Number.isNaN(debut.getTime())) return false;
  const minutes = (Date.now() - debut.getTime()) / 60000;
  return minutes >= seuilHeures * 60;
}

export function buildNotifications(input: {
  cellules: CelluleStock[];
  incidents: HSEIncident[];
  inspections: HSEInspection[];
  actions: HSEAction[];
  trains: Train[];
  arretsNavire: { id: string; nature: string; dateDebut: string; heureDebut: string; heureFin: string; portique: string }[];
  arretsTrain: { id: string; nature: string; dateDebut: string; heureDebut: string; heureFin: string; axe: string }[];
}): AppNotification[] {
  const notifications: AppNotification[] = [];

  const cellulesCritiques = input.cellules.filter((c) => isMortCritique(c.tonnageMort, c.capaciteTotale));
  for (const c of cellulesCritiques) {
    notifications.push({
      id: `stock-${c.celluleId}`,
      severity: "critique",
      label: `Cellule ${c.celluleId} — stock mort critique`,
      detail: `${c.tonnageMort.toLocaleString("fr-FR")} t mortes sur ${c.capaciteTotale.toLocaleString("fr-FR")} t — à déboucher`,
      view: "stock"
    });
  }

  for (const i of incidentsOuverts(input.incidents)) {
    notifications.push({
      id: `incident-${i.id}`,
      severity: i.gravite === "Grave" || i.gravite === "Très grave" ? "critique" : "attention",
      label: `Incident ${i.statut.toLowerCase()} — ${i.zone}`,
      detail: `${i.type} · ${i.gravite} · déclaré le ${i.date}`,
      view: "hse"
    });
  }

  for (const i of inspectionsAPlanifier(input.inspections)) {
    notifications.push({
      id: `inspection-${i.id}`,
      severity: "attention",
      label: `Inspection due — ${i.zone}`,
      detail: `${i.type} · prévue le ${i.dateProchaineInspection}`,
      view: "hse"
    });
  }

  for (const a of actionsEnRetard(input.actions)) {
    notifications.push({
      id: `action-${a.id}`,
      severity: "attention",
      label: `Action en retard — ${a.titre}`,
      detail: `Échéance dépassée (${a.echeance})${a.responsable ? ` · ${a.responsable}` : ""}`,
      view: "hse"
    });
  }

  for (const t of input.trains.filter((t) => t.statut === "En retard")) {
    notifications.push({
      id: `train-${t.id}`,
      severity: "attention",
      label: `Train ${t.numeroTrain} en retard`,
      detail: `Arrivée prévue ${t.dateArriveePrevue} · ${t.heureArriveePrevue}`,
      view: "train"
    });
  }

  for (const a of input.arretsNavire.filter((a) => !a.heureFin && isArretProlonge(a.heureDebut, a.dateDebut, 4))) {
    const duree = calculateDuration(a.heureDebut, new Date().toTimeString().slice(0, 5));
    notifications.push({
      id: `arret-navire-${a.id}`,
      severity: "attention",
      label: `Arrêt prolongé — ${a.portique || "navire"}`,
      detail: `${a.nature} · en cours depuis ${duree !== null ? `${Math.floor(duree / 60)}h${String(duree % 60).padStart(2, "0")}` : "un moment"}`,
      view: "navires"
    });
  }

  for (const a of input.arretsTrain.filter((a) => !a.heureFin && isArretProlonge(a.heureDebut, a.dateDebut, 4))) {
    const duree = calculateDuration(a.heureDebut, new Date().toTimeString().slice(0, 5));
    notifications.push({
      id: `arret-train-${a.id}`,
      severity: "attention",
      label: `Arrêt prolongé — ${a.axe || "train"}`,
      detail: `${a.nature} · en cours depuis ${duree !== null ? `${Math.floor(duree / 60)}h${String(duree % 60).padStart(2, "0")}` : "un moment"}`,
      view: "train"
    });
  }

  const rank: Record<NotificationSeverity, number> = { critique: 0, attention: 1, info: 2 };
  return notifications.sort((a, b) => rank[a.severity] - rank[b.severity]);
}
