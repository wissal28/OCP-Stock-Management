// Modèle de données du module "Maintenance" — planification et suivi des interventions préventives
// et correctives sur les équipements du schéma de manutention (portiques, convoyeurs, reprises...).
// Distinct de "Bilan des arrêts" (constate le temps perdu après coup) et du "Plan d'actions" HSE
// (sécurité) : ici on planifie et trace le travail de maintenance lui-même.

export type MaintenanceType = "Préventive" | "Corrective";
export type MaintenanceStatut = "Planifiée" | "En cours" | "Terminée" | "Annulée";

export const MAINTENANCE_TYPES: MaintenanceType[] = ["Préventive", "Corrective"];
export const MAINTENANCE_STATUTS: MaintenanceStatut[] = ["Planifiée", "En cours", "Terminée", "Annulée"];

export interface MaintenanceIntervention {
  id: string;
  equipementCode: string;
  type: MaintenanceType;
  statut: MaintenanceStatut;
  datePrevue: string; // yyyy-mm-dd
  dateRealisee: string; // yyyy-mm-dd ou ""
  description: string;
  intervenant: string; // matricule
  dureeMinutes: number; // durée réelle si terminée, estimée sinon
}

export const MAINTENANCE_INTERVENTIONS: MaintenanceIntervention[] = [];
