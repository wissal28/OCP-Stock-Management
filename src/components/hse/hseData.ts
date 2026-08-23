// Modèle de données du module "HSE" (Hygiène, Sécurité, Environnement).
// Contrairement à Train/Navire/Stock, il n'existe pas de fichier Excel source pour ce module — les
// champs ci-dessous couvrent les besoins confirmés avec l'utilisateur (déclaration d'incidents,
// inspections/checklists sécurité, indicateurs) sans prétendre reproduire un document existant.

export type IncidentType = "Accident" | "Incident" | "Presqu'accident";
export type IncidentGravite = "Mineur" | "Modéré" | "Grave" | "Très grave";
export type IncidentStatut = "Ouvert" | "En cours" | "Clôturé";

export const INCIDENT_TYPES: IncidentType[] = ["Accident", "Incident", "Presqu'accident"];
export const INCIDENT_GRAVITES: IncidentGravite[] = ["Mineur", "Modéré", "Grave", "Très grave"];
export const INCIDENT_STATUTS: IncidentStatut[] = ["Ouvert", "En cours", "Clôturé"];

export interface HSEIncident {
  id: string;
  date: string; // yyyy-mm-dd
  heure: string; // HH:mm
  zone: string; // lieu/poste (ex. "Lot 1 - Axe A", "Portique CA30"...)
  type: IncidentType;
  gravite: IncidentGravite;
  personnesImpliquees: string;
  description: string;
  causeProbable: string;
  actionsCorrectives: string;
  statut: IncidentStatut;
  declarePar: string; // matricule
}

export type InspectionStatut = "Conforme" | "Non conforme" | "Conforme avec réserves";

export const INSPECTION_STATUTS: InspectionStatut[] = ["Conforme", "Non conforme", "Conforme avec réserves"];

export const INSPECTION_TYPES: string[] = [
  "Extincteurs / moyens de lutte incendie",
  "EPI (équipements de protection individuelle)",
  "Engins de levage / portiques",
  "Convoyeurs / manutention",
  "Électrique / consignation",
  "Environnement (rejets, poussières)",
  "Autre"
];

export interface ChecklistItem {
  libelle: string;
  conforme: boolean | null; // null = non évalué
  observation: string;
}

export interface HSEInspection {
  id: string;
  date: string; // yyyy-mm-dd
  zone: string;
  type: string;
  inspecteur: string; // matricule
  statut: InspectionStatut;
  checklist: ChecklistItem[];
  observations: string;
  actionsRequises: string;
  dateProchaineInspection: string; // yyyy-mm-dd ou ""
}

export type ActionOrigine = "incident" | "inspection" | "libre";
export type ActionPriorite = "Basse" | "Moyenne" | "Haute";
export type ActionStatut = "À faire" | "En cours" | "Fait";

export const ACTION_ORIGINES: { value: ActionOrigine; label: string }[] = [
  { value: "libre", label: "Action libre" },
  { value: "incident", label: "Liée à un incident" },
  { value: "inspection", label: "Liée à une inspection" }
];
export const ACTION_PRIORITES: ActionPriorite[] = ["Basse", "Moyenne", "Haute"];
export const ACTION_STATUTS: ActionStatut[] = ["À faire", "En cours", "Fait"];

/** Une ligne = une action corrective à suivre — transforme les champs texte libre
 * "actionsCorrectives"/"actionsRequises" des incidents/inspections en tâches réellement pilotables
 * (responsable, échéance, statut), affichées en Kanban dans l'onglet "Actions". */
export interface HSEAction {
  id: string;
  titre: string;
  description: string;
  origine: ActionOrigine;
  /** Id de l'incident ou de l'inspection d'origine, si `origine` n'est pas "libre". */
  origineId: string;
  responsable: string; // matricule
  echeance: string; // yyyy-mm-dd ou ""
  priorite: ActionPriorite;
  statut: ActionStatut;
}

export const ACTIONS: HSEAction[] = [];

export const INCIDENTS: HSEIncident[] = [
  {
    id: "hse-inc-1",
    date: "2026-07-10",
    heure: "14:30",
    zone: "Portique CB30",
    type: "Presqu'accident",
    gravite: "Mineur",
    personnesImpliquees: "Agent portique",
    description: "Chute d'un outil depuis la passerelle du portique, personne en dessous mais aucun contact.",
    causeProbable: "Outil mal arrimé lors d'une opération de maintenance.",
    actionsCorrectives: "Rappel consigne d'arrimage des outils en hauteur, affichage sur site.",
    statut: "Clôturé",
    declarePar: "OCP-1042"
  },
  {
    id: "hse-inc-2",
    date: "2026-07-22",
    heure: "09:15",
    zone: "Lot 1 - Axe A",
    type: "Incident",
    gravite: "Modéré",
    personnesImpliquees: "Opérateur cellule",
    description: "Glissade sur zone humide près de SA211, sans blessure grave, contusion légère.",
    causeProbable: "Fuite d'eau non signalée sur le convoyeur SA210.",
    actionsCorrectives: "Réparation de la fuite, pose d'un panneau de signalisation temporaire.",
    statut: "En cours",
    declarePar: "OCP-1108"
  }
];

export const INSPECTIONS: HSEInspection[] = [
  {
    id: "hse-insp-1",
    date: "2026-07-15",
    zone: "Poste 66 (chargement navire)",
    type: "Engins de levage / portiques",
    inspecteur: "OCP-1042",
    statut: "Conforme avec réserves",
    checklist: [
      { libelle: "Freins et systèmes d'arrêt d'urgence", conforme: true, observation: "" },
      { libelle: "Câbles et élingues", conforme: true, observation: "" },
      { libelle: "Éclairage de la zone", conforme: false, observation: "2 projecteurs hors service côté portique C" }
    ],
    observations: "Portiques opérationnels, éclairage à corriger avant la prochaine rotation navire.",
    actionsRequises: "Remplacement des projecteurs défectueux",
    dateProchaineInspection: "2026-08-15"
  }
];
