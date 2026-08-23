// Modèle de données du module "Gestion des navires".
// Digitalise le suivi de chargement des navires au port de Casablanca (fichier
// "Point Horaire de Chargement" / "Pesée des bascules" / "Arrêt" par navire).

import { PHOSPHATE_QUALITIES } from "../train/trainData";

export type { PhosphateQuality } from "../train/trainData";
export { PHOSPHATE_QUALITIES };

// Correspondance n° de reprise (1-21, tel qu'utilisé dans le bordereau Excel "Pesée bascules") →
// code d'équipement du schéma de manutention — même table que server/migrate.js#NUMERIC_TO_CODE
// (confirmée avec l'utilisateur, voir C:\Users\pc\.claude\plans\velvet-soaring-wreath.md). Utilisée
// par l'import Excel pour normaliser les anciennes valeurs numériques vers les codes d'équipement.
export const NUMERIC_TO_CODE: Record<string, string> = {
  "1": "SA211", "2": "SA212", "3": "SA213", "4": "SA221", "5": "SA222", "6": "SA223",
  "7": "SB311", "8": "SB312", "9": "SB313", "10": "SB321", "11": "SB322", "12": "SB323",
  "13": "RC114", "14": "RD114", "15": "RC124", "16": "RD124", "17": "RC134",
  "18": "RA114", "19": "RB114", "20": "RA124", "21": "RB124",
  silos: "SILOS",
  di: "DIRECT"
};

/** Options du sélecteur "Rep. ou dir." — les 21 cellules réelles de reprise (mêmes codes que le
 * module Train et le Schéma de manutention), dans l'ordre 1→21 du bordereau, plus les cas
 * particuliers silo T10 (indirect), silo de vidange DB210, et direct-navire. */
export const REPRISE_OPTIONS: { value: string; label: string }[] = [
  ...Array.from({ length: 21 }, (_, i) => {
    const code = NUMERIC_TO_CODE[String(i + 1)];
    return { value: code, label: `${i + 1} · ${code}` };
  }),
  { value: "SILOS", label: "Silos T10 (indirect)" },
  { value: "DB210", label: "DB210 (silo de vidange)" },
  { value: "DIRECT", label: "Direct navire" }
];

export type NavireStatus = "En rade" | "Accosté" | "En chargement" | "Chargé" | "Parti";

/** Tonnage prévu pour une cale donnée, saisi à la création du navire — permet un RAF (reste à
 * charger) par cale plutôt que seulement au niveau du navire entier. */
export interface CalePlan {
  cale: string;
  tonnagePrevu: number;
}

export interface Navire {
  id: string;
  nom: string;
  numeroEC: string;
  qualite: string;
  poste: string;
  dateDebutChargement: string; // yyyy-mm-dd
  heureDebutChargement: string; // HH:mm
  dateFinChargement: string; // yyyy-mm-dd ou ""
  heureFinChargement: string; // HH:mm ou ""
  tonnagePrevu: number;
  tonnageCharge: number;
  statut: NavireStatus;
  observations: string;
  calesPlan: CalePlan[];
}

/** Une ligne = une affectation d'un portique de chargement sur une cale (table "Pesée des bascules"). */
export interface ChargementPortique {
  id: string;
  navireId: string;
  portique: string; // CA30, CB30, CC30, CD30...
  cale: string; // numéro de cale
  peseuse: string; // A, B, C, D...
  repriseOuDirection: string; // code cellule (ex "SA211"), "SILOS" ou "DIRECT" (direct navire)
  dateDebutAffect: string; // yyyy-mm-dd
  heureDebutAffect: string; // HH:mm
  dateFinAffect: string; // yyyy-mm-dd
  heureFinAffect: string; // HH:mm
  tonnage: number;
}

/** Une ligne = un arrêt affectant un portique pendant le chargement (feuille "Arrêt"). */
export interface ArretNavire {
  id: string;
  navireId: string;
  portique: string; // CA30, CB30, CC30, CD30, CX30...
  elementConcerne: string; // "S/E" : cellule ou sous-ensemble concerné (ex. RD124, DA, CA30)
  nature: string;
  dateDebut: string; // yyyy-mm-dd
  heureDebut: string; // HH:mm
  dateFin: string; // yyyy-mm-dd ou ""
  heureFin: string; // HH:mm ou ""
  description: string;
}

export const NAVIRE_PORTIQUES: string[] = ["CA30", "CB30", "CC30", "CD30"];

// Vocabulaire des causes d'arrêt — source unique dans trainData.ts (le déchargement des trains
// utilise exactement les mêmes 32 causes, confirmé par la feuille "Synthèses" du classeur
// "Bilan et synthèses des arrêts" — voir MAINTENANCE_NATURES/FAMILLES_ARRETS au même endroit).
export { NATURE_ARRET_OPTIONS } from "../train/trainData";

// --- Données d'exemple, transcrites du bordereau réel "SAINT VASSILIOS" (24-25/06/2026) ---

export const NAVIRES: Navire[] = [
  {
    id: "navire-saint-vassilios",
    nom: "SAINT VASSILIOS",
    numeroEC: "7155",
    qualite: "K02",
    poste: "",
    dateDebutChargement: "2026-06-24",
    heureDebutChargement: "07:15",
    dateFinChargement: "2026-06-25",
    heureFinChargement: "06:45",
    tonnagePrevu: 32545,
    tonnageCharge: 32545,
    statut: "Chargé",
    observations: "",
    calesPlan: []
  }
];

export const CHARGEMENTS: ChargementPortique[] = [
  { id: "chg-1", navireId: "navire-saint-vassilios", portique: "CA30", cale: "2", peseuse: "D", repriseOuDirection: "SILOS", dateDebutAffect: "2026-06-24", heureDebutAffect: "07:15", dateFinAffect: "2026-06-24", heureFinAffect: "08:30", tonnage: 416 },
  { id: "chg-2", navireId: "navire-saint-vassilios", portique: "CA30", cale: "2", peseuse: "D", repriseOuDirection: "SB323", dateDebutAffect: "2026-06-24", heureDebutAffect: "08:30", dateFinAffect: "2026-06-24", heureFinAffect: "13:25", tonnage: 2694 },
  { id: "chg-3", navireId: "navire-saint-vassilios", portique: "CA30", cale: "1", peseuse: "D", repriseOuDirection: "SB323", dateDebutAffect: "2026-06-24", heureDebutAffect: "13:55", dateFinAffect: "2026-06-24", heureFinAffect: "14:10", tonnage: 112 },
  { id: "chg-4", navireId: "navire-saint-vassilios", portique: "CA30", cale: "1", peseuse: "A", repriseOuDirection: "SILOS", dateDebutAffect: "2026-06-24", heureDebutAffect: "14:10", dateFinAffect: "2026-06-24", heureFinAffect: "15:00", tonnage: 549 },
  { id: "chg-5", navireId: "navire-saint-vassilios", portique: "CA30", cale: "1", peseuse: "D", repriseOuDirection: "SB323", dateDebutAffect: "2026-06-24", heureDebutAffect: "15:00", dateFinAffect: "2026-06-24", heureFinAffect: "17:00", tonnage: 1117 },
  { id: "chg-6", navireId: "navire-saint-vassilios", portique: "CA30", cale: "1", peseuse: "D", repriseOuDirection: "RD124", dateDebutAffect: "2026-06-24", heureDebutAffect: "17:00", dateFinAffect: "2026-06-24", heureFinAffect: "19:15", tonnage: 650 },
  { id: "chg-7", navireId: "navire-saint-vassilios", portique: "CA30", cale: "1", peseuse: "B", repriseOuDirection: "RB114", dateDebutAffect: "2026-06-24", heureDebutAffect: "19:15", dateFinAffect: "2026-06-24", heureFinAffect: "23:55", tonnage: 3321 },
  { id: "chg-8", navireId: "navire-saint-vassilios", portique: "CA30", cale: "1", peseuse: "B", repriseOuDirection: "RB114", dateDebutAffect: "2026-06-25", heureDebutAffect: "00:05", dateFinAffect: "2026-06-25", heureFinAffect: "00:20", tonnage: 257 },
  { id: "chg-9", navireId: "navire-saint-vassilios", portique: "CA30", cale: "2", peseuse: "D", repriseOuDirection: "RD124", dateDebutAffect: "2026-06-25", heureDebutAffect: "03:55", dateFinAffect: "2026-06-25", heureFinAffect: "04:30", tonnage: 205 },
  { id: "chg-10", navireId: "navire-saint-vassilios", portique: "CA30", cale: "2", peseuse: "D", repriseOuDirection: "RD124", dateDebutAffect: "2026-06-25", heureDebutAffect: "05:00", dateFinAffect: "2026-06-25", heureFinAffect: "05:30", tonnage: 328 },
  { id: "chg-11", navireId: "navire-saint-vassilios", portique: "CA30", cale: "2", peseuse: "D", repriseOuDirection: "RD124", dateDebutAffect: "2026-06-25", heureDebutAffect: "06:30", dateFinAffect: "2026-06-25", heureFinAffect: "06:40", tonnage: 59 },
  { id: "chg-12", navireId: "navire-saint-vassilios", portique: "CA30", cale: "2", peseuse: "D", repriseOuDirection: "RD124", dateDebutAffect: "2026-06-25", heureDebutAffect: "06:40", dateFinAffect: "2026-06-25", heureFinAffect: "06:45", tonnage: 34 },

  { id: "chg-13", navireId: "navire-saint-vassilios", portique: "CB30", cale: "3", peseuse: "A", repriseOuDirection: "RA114", dateDebutAffect: "2026-06-24", heureDebutAffect: "07:15", dateFinAffect: "2026-06-24", heureFinAffect: "08:45", tonnage: 1503 },
  { id: "chg-14", navireId: "navire-saint-vassilios", portique: "CB30", cale: "3", peseuse: "A", repriseOuDirection: "DIRECT", dateDebutAffect: "2026-06-24", heureDebutAffect: "09:00", dateFinAffect: "2026-06-24", heureFinAffect: "10:25", tonnage: 900 },
  { id: "chg-15", navireId: "navire-saint-vassilios", portique: "CB30", cale: "3", peseuse: "A", repriseOuDirection: "RA114", dateDebutAffect: "2026-06-24", heureDebutAffect: "10:25", dateFinAffect: "2026-06-24", heureFinAffect: "11:50", tonnage: 1073 },
  { id: "chg-16", navireId: "navire-saint-vassilios", portique: "CB30", cale: "3", peseuse: "A", repriseOuDirection: "RA124", dateDebutAffect: "2026-06-24", heureDebutAffect: "12:10", dateFinAffect: "2026-06-24", heureFinAffect: "13:00", tonnage: 116 },
  { id: "chg-17", navireId: "navire-saint-vassilios", portique: "CB30", cale: "3", peseuse: "A", repriseOuDirection: "SILOS", dateDebutAffect: "2026-06-24", heureDebutAffect: "13:10", dateFinAffect: "2026-06-24", heureFinAffect: "13:25", tonnage: 140 },
  { id: "chg-18", navireId: "navire-saint-vassilios", portique: "CB30", cale: "2", peseuse: "A", repriseOuDirection: "SILOS", dateDebutAffect: "2026-06-24", heureDebutAffect: "16:15", dateFinAffect: "2026-06-24", heureFinAffect: "17:00", tonnage: 450 },
  { id: "chg-19", navireId: "navire-saint-vassilios", portique: "CB30", cale: "2", peseuse: "A", repriseOuDirection: "RA114", dateDebutAffect: "2026-06-24", heureDebutAffect: "17:00", dateFinAffect: "2026-06-24", heureFinAffect: "21:30", tonnage: 2317 },
  { id: "chg-20", navireId: "navire-saint-vassilios", portique: "CB30", cale: "3", peseuse: "A", repriseOuDirection: "RA114", dateDebutAffect: "2026-06-24", heureDebutAffect: "22:00", dateFinAffect: "2026-06-24", heureFinAffect: "23:55", tonnage: 433 },
  { id: "chg-21", navireId: "navire-saint-vassilios", portique: "CB30", cale: "3", peseuse: "A", repriseOuDirection: "RA114", dateDebutAffect: "2026-06-25", heureDebutAffect: "00:05", dateFinAffect: "2026-06-25", heureFinAffect: "00:40", tonnage: 27 },
  { id: "chg-22", navireId: "navire-saint-vassilios", portique: "CB30", cale: "3", peseuse: "B", repriseOuDirection: "RB114", dateDebutAffect: "2026-06-25", heureDebutAffect: "00:50", dateFinAffect: "2026-06-25", heureFinAffect: "01:30", tonnage: 267 },
  { id: "chg-23", navireId: "navire-saint-vassilios", portique: "CB30", cale: "3", peseuse: "D", repriseOuDirection: "RD124", dateDebutAffect: "2026-06-25", heureDebutAffect: "01:40", dateFinAffect: "2026-06-25", heureFinAffect: "03:00", tonnage: 560 },

  { id: "chg-24", navireId: "navire-saint-vassilios", portique: "CC30", cale: "4", peseuse: "B", repriseOuDirection: "RB114", dateDebutAffect: "2026-06-24", heureDebutAffect: "07:15", dateFinAffect: "2026-06-24", heureFinAffect: "08:45", tonnage: 1354 },
  { id: "chg-25", navireId: "navire-saint-vassilios", portique: "CC30", cale: "4", peseuse: "B", repriseOuDirection: "DIRECT", dateDebutAffect: "2026-06-24", heureDebutAffect: "09:00", dateFinAffect: "2026-06-24", heureFinAffect: "10:25", tonnage: 1129 },
  { id: "chg-26", navireId: "navire-saint-vassilios", portique: "CC30", cale: "4", peseuse: "B", repriseOuDirection: "RB114", dateDebutAffect: "2026-06-24", heureDebutAffect: "10:25", dateFinAffect: "2026-06-24", heureFinAffect: "11:50", tonnage: 1057 },
  { id: "chg-27", navireId: "navire-saint-vassilios", portique: "CC30", cale: "4", peseuse: "B", repriseOuDirection: "RB124", dateDebutAffect: "2026-06-24", heureDebutAffect: "12:10", dateFinAffect: "2026-06-24", heureFinAffect: "12:25", tonnage: 47 },
  { id: "chg-28", navireId: "navire-saint-vassilios", portique: "CC30", cale: "4", peseuse: "B", repriseOuDirection: "RB114", dateDebutAffect: "2026-06-24", heureDebutAffect: "12:40", dateFinAffect: "2026-06-24", heureFinAffect: "13:25", tonnage: 687 },
  { id: "chg-29", navireId: "navire-saint-vassilios", portique: "CC30", cale: "3", peseuse: "B", repriseOuDirection: "RB114", dateDebutAffect: "2026-06-24", heureDebutAffect: "13:55", dateFinAffect: "2026-06-24", heureFinAffect: "15:00", tonnage: 999 },
  { id: "chg-30", navireId: "navire-saint-vassilios", portique: "CC30", cale: "3", peseuse: "A", repriseOuDirection: "SILOS", dateDebutAffect: "2026-06-24", heureDebutAffect: "15:00", dateFinAffect: "2026-06-24", heureFinAffect: "16:15", tonnage: 795 },
  { id: "chg-31", navireId: "navire-saint-vassilios", portique: "CC30", cale: "4", peseuse: "C", repriseOuDirection: "SB313", dateDebutAffect: "2026-06-24", heureDebutAffect: "19:00", dateFinAffect: "2026-06-24", heureFinAffect: "19:50", tonnage: 234 },
  { id: "chg-32", navireId: "navire-saint-vassilios", portique: "CC30", cale: "4", peseuse: "C", repriseOuDirection: "RC124", dateDebutAffect: "2026-06-24", heureDebutAffect: "19:50", dateFinAffect: "2026-06-24", heureFinAffect: "21:00", tonnage: 544 },
  { id: "chg-33", navireId: "navire-saint-vassilios", portique: "CC30", cale: "4", peseuse: "C", repriseOuDirection: "RC134", dateDebutAffect: "2026-06-24", heureDebutAffect: "21:00", dateFinAffect: "2026-06-24", heureFinAffect: "21:30", tonnage: 152 },
  { id: "chg-34", navireId: "navire-saint-vassilios", portique: "CC30", cale: "4", peseuse: "C", repriseOuDirection: "RC124", dateDebutAffect: "2026-06-24", heureDebutAffect: "21:40", dateFinAffect: "2026-06-24", heureFinAffect: "23:55", tonnage: 791 },
  { id: "chg-35", navireId: "navire-saint-vassilios", portique: "CC30", cale: "4", peseuse: "C", repriseOuDirection: "RC124", dateDebutAffect: "2026-06-25", heureDebutAffect: "00:05", dateFinAffect: "2026-06-25", heureFinAffect: "01:35", tonnage: 815 },
  { id: "chg-36", navireId: "navire-saint-vassilios", portique: "CC30", cale: "5", peseuse: "C", repriseOuDirection: "RC124", dateDebutAffect: "2026-06-25", heureDebutAffect: "03:00", dateFinAffect: "2026-06-25", heureFinAffect: "03:55", tonnage: 599 },
  { id: "chg-37", navireId: "navire-saint-vassilios", portique: "CC30", cale: "5", peseuse: "C", repriseOuDirection: "RC124", dateDebutAffect: "2026-06-25", heureDebutAffect: "05:00", dateFinAffect: "2026-06-25", heureFinAffect: "05:30", tonnage: 117 },

  { id: "chg-38", navireId: "navire-saint-vassilios", portique: "CD30", cale: "5", peseuse: "C", repriseOuDirection: "SILOS", dateDebutAffect: "2026-06-24", heureDebutAffect: "07:15", dateFinAffect: "2026-06-24", heureFinAffect: "08:45", tonnage: 721 },
  { id: "chg-39", navireId: "navire-saint-vassilios", portique: "CD30", cale: "5", peseuse: "C", repriseOuDirection: "DIRECT", dateDebutAffect: "2026-06-24", heureDebutAffect: "09:00", dateFinAffect: "2026-06-24", heureFinAffect: "11:30", tonnage: 1395 },
  { id: "chg-40", navireId: "navire-saint-vassilios", portique: "CD30", cale: "5", peseuse: "C", repriseOuDirection: "RC114", dateDebutAffect: "2026-06-24", heureDebutAffect: "11:45", dateFinAffect: "2026-06-24", heureFinAffect: "12:15", tonnage: 206 },
  { id: "chg-41", navireId: "navire-saint-vassilios", portique: "CD30", cale: "5", peseuse: "C", repriseOuDirection: "SB313", dateDebutAffect: "2026-06-24", heureDebutAffect: "12:35", dateFinAffect: "2026-06-24", heureFinAffect: "13:25", tonnage: 633 },
  { id: "chg-42", navireId: "navire-saint-vassilios", portique: "CD30", cale: "5", peseuse: "C", repriseOuDirection: "SB313", dateDebutAffect: "2026-06-24", heureDebutAffect: "13:55", dateFinAffect: "2026-06-24", heureFinAffect: "18:00", tonnage: 2742 }
];

export const ARRETS: ArretNavire[] = [
  { id: "arret-1", navireId: "navire-saint-vassilios", portique: "CA30", elementConcerne: "RD124", nature: "Permutation circuit", dateDebut: "2026-06-24", heureDebut: "08:30", dateFin: "2026-06-24", heureFin: "08:45", description: "Permutation circuit" },
  { id: "arret-2", navireId: "navire-saint-vassilios", portique: "CA30", elementConcerne: "DA", nature: "Permutation circuit", dateDebut: "2026-06-24", heureDebut: "08:45", dateFin: "2026-06-24", heureFin: "09:00", description: "Permutation circuit" },
  { id: "arret-3", navireId: "navire-saint-vassilios", portique: "CB30", elementConcerne: "DA", nature: "Permutation circuit", dateDebut: "2026-06-24", heureDebut: "08:45", dateFin: "2026-06-24", heureFin: "09:00", description: "Permutation circuit" },
  { id: "arret-4", navireId: "navire-saint-vassilios", portique: "CC30", elementConcerne: "DB", nature: "Permutation circuit", dateDebut: "2026-06-24", heureDebut: "08:45", dateFin: "2026-06-24", heureFin: "09:00", description: "Permutation circuit" },
  { id: "arret-5", navireId: "navire-saint-vassilios", portique: "CD30", elementConcerne: "DB", nature: "Permutation circuit", dateDebut: "2026-06-24", heureDebut: "08:45", dateFin: "2026-06-24", heureFin: "09:00", description: "Permutation circuit" },
  { id: "arret-6", navireId: "navire-saint-vassilios", portique: "CD30", elementConcerne: "RC114", nature: "Permutation circuit", dateDebut: "2026-06-24", heureDebut: "11:30", dateFin: "2026-06-24", heureFin: "11:45", description: "Permutation circuit" },
  { id: "arret-7", navireId: "navire-saint-vassilios", portique: "CC30", elementConcerne: "CC30", nature: "Mouvement même cale", dateDebut: "2026-06-24", heureDebut: "11:40", dateFin: "2026-06-24", heureFin: "12:00", description: "Mouvement même cale" },
  { id: "arret-8", navireId: "navire-saint-vassilios", portique: "CD30", elementConcerne: "RC114", nature: "bande", dateDebut: "2026-06-24", heureDebut: "11:45", dateFin: "2026-06-24", heureFin: "12:00", description: "déport de bande" },
  { id: "arret-9", navireId: "navire-saint-vassilios", portique: "CB30", elementConcerne: "RA125", nature: "Permutation circuit", dateDebut: "2026-06-24", heureDebut: "11:50", dateFin: "2026-06-24", heureFin: "12:10", description: "Permutation circuit" },
  { id: "arret-10", navireId: "navire-saint-vassilios", portique: "CB30", elementConcerne: "CB30", nature: "Mouvement même cale", dateDebut: "2026-06-24", heureDebut: "12:15", dateFin: "2026-06-24", heureFin: "12:35", description: "Mouvement même cale" },
  { id: "arret-11", navireId: "navire-saint-vassilios", portique: "CC30", elementConcerne: "RB124", nature: "mécanique", dateDebut: "2026-06-24", heureDebut: "12:10", dateFin: "2026-06-24", heureFin: "12:25", description: "problème goulotte" },
  { id: "arret-12", navireId: "navire-saint-vassilios", portique: "CA30", elementConcerne: "CA30", nature: "Changement de cale", dateDebut: "2026-06-24", heureDebut: "13:25", dateFin: "2026-06-24", heureFin: "13:55", description: "Changement de cale" },
  { id: "arret-13", navireId: "navire-saint-vassilios", portique: "CB30", elementConcerne: "CB30", nature: "Changement de cale", dateDebut: "2026-06-24", heureDebut: "13:25", dateFin: "2026-06-24", heureFin: "13:55", description: "Changement de cale" },
  { id: "arret-14", navireId: "navire-saint-vassilios", portique: "CC30", elementConcerne: "CC30", nature: "Changement de cale", dateDebut: "2026-06-24", heureDebut: "13:25", dateFin: "2026-06-24", heureFin: "13:55", description: "Changement de cale" },
  { id: "arret-15", navireId: "navire-saint-vassilios", portique: "CD30", elementConcerne: "CD30", nature: "Changement de cale", dateDebut: "2026-06-24", heureDebut: "13:25", dateFin: "2026-06-24", heureFin: "13:55", description: "Changement de cale" },
  { id: "arret-16", navireId: "navire-saint-vassilios", portique: "CB30", elementConcerne: "CB30", nature: "Assiette", dateDebut: "2026-06-24", heureDebut: "13:55", dateFin: "2026-06-24", heureFin: "16:15", description: "Assiette" },
  { id: "arret-17", navireId: "navire-saint-vassilios", portique: "CA30", elementConcerne: "CA30", nature: "Assiette", dateDebut: "2026-06-24", heureDebut: "16:15", dateFin: "2026-06-24", heureFin: "19:00", description: "Assiette" },
  { id: "arret-18", navireId: "navire-saint-vassilios", portique: "CA30", elementConcerne: "RD13", nature: "stock", dateDebut: "2026-06-24", heureDebut: "16:15", dateFin: "2026-06-24", heureFin: "17:00", description: "cellule en vidange" },
  { id: "arret-19", navireId: "navire-saint-vassilios", portique: "CD30", elementConcerne: "RC13", nature: "stock", dateDebut: "2026-06-24", heureDebut: "17:25", dateFin: "2026-06-24", heureFin: "18:00", description: "cellule en vidange" },
  { id: "arret-20", navireId: "navire-saint-vassilios", portique: "CD30", elementConcerne: "CD30", nature: "Changement de cale", dateDebut: "2026-06-24", heureDebut: "18:00", dateFin: "2026-06-24", heureFin: "18:30", description: "changement de cale" },
  { id: "arret-21", navireId: "navire-saint-vassilios", portique: "CA30", elementConcerne: "RD214", nature: "électrique", dateDebut: "2026-06-24", heureDebut: "18:15", dateFin: "2026-06-24", heureFin: "19:15", description: "défaut rotation" },
  { id: "arret-22", navireId: "navire-saint-vassilios", portique: "CD30", elementConcerne: "CD30", nature: "Assiette", dateDebut: "2026-06-24", heureDebut: "18:30", dateFin: "", heureFin: "", description: "Assiette" },
  { id: "arret-23", navireId: "navire-saint-vassilios", portique: "CC30", elementConcerne: "RC13", nature: "stock", dateDebut: "2026-06-24", heureDebut: "19:00", dateFin: "2026-06-24", heureFin: "19:50", description: "cellule en vidange" },
  { id: "arret-24", navireId: "navire-saint-vassilios", portique: "CB30", elementConcerne: "CB30", nature: "Mouvement même cale", dateDebut: "2026-06-24", heureDebut: "19:50", dateFin: "2026-06-24", heureFin: "20:10", description: "Mouvement même cale" },
  { id: "arret-25", navireId: "navire-saint-vassilios", portique: "CB30", elementConcerne: "CB30", nature: "Changement de cale", dateDebut: "2026-06-24", heureDebut: "21:30", dateFin: "2026-06-24", heureFin: "22:00", description: "Changement de cale" },
  { id: "arret-26", navireId: "navire-saint-vassilios", portique: "CA30", elementConcerne: "RB114", nature: "exploitation", dateDebut: "2026-06-24", heureDebut: "22:00", dateFin: "2026-06-24", heureFin: "22:40", description: "débit faible" },
  { id: "arret-27", navireId: "navire-saint-vassilios", portique: "CB30", elementConcerne: "RA114", nature: "stock", dateDebut: "2026-06-24", heureDebut: "22:00", dateFin: "2026-06-24", heureFin: "22:40", description: "cellule en vidange" },
  { id: "arret-28", navireId: "navire-saint-vassilios", portique: "CC30", elementConcerne: "RC124", nature: "exploitation", dateDebut: "2026-06-24", heureDebut: "22:00", dateFin: "2026-06-24", heureFin: "22:40", description: "débit faible" },
  { id: "arret-29", navireId: "navire-saint-vassilios", portique: "CA30", elementConcerne: "CA30", nature: "Balance", dateDebut: "2026-06-25", heureDebut: "00:20", dateFin: "2026-06-25", heureFin: "03:55", description: "Balance" },
  { id: "arret-30", navireId: "navire-saint-vassilios", portique: "CB30", elementConcerne: "RB114", nature: "Permutation circuit", dateDebut: "2026-06-25", heureDebut: "00:30", dateFin: "2026-06-25", heureFin: "00:40", description: "Permutation circuit" },
  { id: "arret-31", navireId: "navire-saint-vassilios", portique: "CC30", elementConcerne: "CC30", nature: "Mouvement même cale", dateDebut: "2026-06-25", heureDebut: "00:40", dateFin: "2026-06-25", heureFin: "01:00", description: "Mouvement même cale" }
];
