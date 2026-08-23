// Modèle de données du module "Gestion des trains".
// Ce fichier est autonome (ne dépend pas de synoptiqueManutentionData.ts) car il modélise
// une structure Lot/Axe/Cellule légèrement différente, avec la zone globale du Lot 3.

export type TrainStatus = "Prévu" | "Arrivé" | "En déchargement" | "Déchargé" | "En retard" | "Annulé";
export type DestinationPrevue = "Lots" | "Silos" | "Navire direct" | "Mixte";

/** Libellés explicites de "Destination prévue" — le seul silo utilisé par ce module est T10, qui ne
 * fait partie d'aucun lot (voir SILOS ci-dessous et la fiche T10 du schéma de manutention) : c'est
 * une trémie tampon indépendante entre le circuit DB de déchargement et le chargement navire. */
export const DESTINATION_LABELS: Record<DestinationPrevue, string> = {
  "Lots": "Lots (Lot 1 / Lot 2 / Lot 3)",
  "Silos": "Silos (T10 — hors lot, trémie tampon vers le chargement navire)",
  "Navire direct": "Navire direct (sans passage par un lot)",
  "Mixte": "Mixte (Lots + Silos)"
};

export interface PhosphateQuality {
  code: string;
  label: string;
}

export const PHOSPHATE_QUALITIES: PhosphateQuality[] = Array.from({ length: 21 }, (_, i) => {
  const code = `K${String(i).padStart(2, "0")}`;
  return { code, label: `Qualité ${code}` };
});

export interface Cellule {
  id: string; // ex: "SA211"
  repriseCode: string; // ex: "RA11"
  axeId: string | null; // null pour les cellules "zone globale" du Lot 3
  lotId: string;
  qualiteActive: string | null;
  quantiteActuelle: number;
  /** Capacité restante (t) — renseignée uniquement quand la cellule est croisée avec le stock réel
   * (voir buildLiveCellules dans TrainFormModal.tsx) ; absente sinon (structure statique). */
  capaciteRestante?: number;
}

export interface Axe {
  id: string;
  lotId: string;
  name: string; // "Axe A"
  celluleIds: string[];
}

export interface Lot {
  id: string;
  name: string;
  description: string;
  axeIds: string[];
  isZoneGlobale?: boolean;
}

export interface Silo {
  id: string;
  label: string;
}

export interface Portique {
  id: string;
  label: string;
}

export interface Peseuse {
  id: string;
  label: string;
  portiqueId: string;
}

// --- LOT 1 ---
const lot1AxeA: Axe = { id: "axe-a", lotId: "lot-1", name: "Axe A", celluleIds: ["SA211", "SA212", "SA213"] };
const lot1AxeB: Axe = { id: "axe-b", lotId: "lot-1", name: "Axe B", celluleIds: ["SA221", "SA222", "SA223"] };

const lot1Cellules: Cellule[] = [
  { id: "SA211", repriseCode: "RA11", axeId: "axe-a", lotId: "lot-1", qualiteActive: null, quantiteActuelle: 0 },
  { id: "SA212", repriseCode: "RA12", axeId: "axe-a", lotId: "lot-1", qualiteActive: null, quantiteActuelle: 0 },
  { id: "SA213", repriseCode: "RA13", axeId: "axe-a", lotId: "lot-1", qualiteActive: null, quantiteActuelle: 0 },
  { id: "SA221", repriseCode: "RB11", axeId: "axe-b", lotId: "lot-1", qualiteActive: null, quantiteActuelle: 0 },
  { id: "SA222", repriseCode: "RB12", axeId: "axe-b", lotId: "lot-1", qualiteActive: null, quantiteActuelle: 0 },
  { id: "SA223", repriseCode: "RB13", axeId: "axe-b", lotId: "lot-1", qualiteActive: null, quantiteActuelle: 0 }
];

// --- LOT 2 ---
const lot2AxeC: Axe = { id: "axe-c", lotId: "lot-2", name: "Axe C", celluleIds: ["SB311", "SB312", "SB313"] };
const lot2AxeD: Axe = { id: "axe-d", lotId: "lot-2", name: "Axe D", celluleIds: ["SB321", "SB322", "SB323"] };

const lot2Cellules: Cellule[] = [
  { id: "SB311", repriseCode: "RC11", axeId: "axe-c", lotId: "lot-2", qualiteActive: null, quantiteActuelle: 0 },
  { id: "SB312", repriseCode: "RC12", axeId: "axe-c", lotId: "lot-2", qualiteActive: null, quantiteActuelle: 0 },
  { id: "SB313", repriseCode: "RC13", axeId: "axe-c", lotId: "lot-2", qualiteActive: null, quantiteActuelle: 0 },
  { id: "SB321", repriseCode: "RD11", axeId: "axe-d", lotId: "lot-2", qualiteActive: null, quantiteActuelle: 0 },
  { id: "SB322", repriseCode: "RD12", axeId: "axe-d", lotId: "lot-2", qualiteActive: null, quantiteActuelle: 0 },
  { id: "SB323", repriseCode: "RD13", axeId: "axe-d", lotId: "lot-2", qualiteActive: null, quantiteActuelle: 0 }
];

// --- LOT 3 : grande zone de stockage globale (pas de subdivision par axe) ---
// Lot 3 = exactement les reprises 13 à 21 (confirmé avec l'utilisateur — mêmes codes que
// NUMERIC_TO_CODE dans server/migrate.js). Les codes RD214/RC214/RA214/RB214/RA314/RB314/RC314/
// RD314 existent bien dans le schéma de manutention (synoptiqueManutentionData.ts) mais ce sont des
// convoyeurs de reprise/évacuation en aval, pas des cellules de stockage — un train ne peut pas y
// décharger, donc ils ne font pas partie de cette liste de destinations.
const LOT3_REPRISES = ["RC114", "RD114", "RC124", "RD124", "RC134", "RA114", "RB114", "RA124", "RB124"];

const lot3Cellules: Cellule[] = LOT3_REPRISES.map((code) => ({
  id: code,
  repriseCode: code,
  axeId: null,
  lotId: "lot-3",
  qualiteActive: null,
  quantiteActuelle: 0
}));

export const LOTS: Lot[] = [
  { id: "lot-1", name: "Lot 1", description: "Axe A + Axe B, 3 cellules par axe", axeIds: ["axe-a", "axe-b"] },
  { id: "lot-2", name: "Lot 2", description: "Axe C + Axe D, 3 cellules par axe", axeIds: ["axe-c", "axe-d"] },
  { id: "lot-3", name: "Lot 3", description: "Zone globale de stockage (reprises 13 à 21)", axeIds: [], isZoneGlobale: true }
];

export const AXES: Axe[] = [lot1AxeA, lot1AxeB, lot2AxeC, lot2AxeD];

export const CELLULES: Cellule[] = [...lot1Cellules, ...lot2Cellules, ...lot3Cellules];

// T10 (trémies de reprise, poste 66) et DB210 (silo de vidange : reçoit le trop-plein du circuit DB
// au déchargement, et le trop-plein renvoyé depuis les portiques quand un navire est plein) — les
// deux seuls silos/trémies tampons réels, aucun des deux ne fait partie d'un lot.
export const SILOS: Silo[] = [
  { id: "T10", label: "T10 — hors lot" },
  { id: "DB210", label: "DB210 — silo de vidange" }
];

export const PORTIQUES: Portique[] = [
  { id: "portique-a", label: "Portique A" },
  { id: "portique-b", label: "Portique B" },
  { id: "portique-c", label: "Portique C" },
  { id: "portique-d", label: "Portique D" }
];

export const PESEUSES: Peseuse[] = [
  { id: "peseuse-a", label: "Peseuse A", portiqueId: "portique-a" },
  { id: "peseuse-b", label: "Peseuse B", portiqueId: "portique-b" },
  { id: "peseuse-c", label: "Peseuse C", portiqueId: "portique-c" },
  { id: "peseuse-d", label: "Peseuse D", portiqueId: "portique-d" }
];

export interface PeseuseSource {
  peseuseId: string;
  /** Cellule de cet axe (Lot 1 ou Lot 2) — une seule à la fois. */
  axeId: string;
  /** Les 2 cellules du Lot 3 pouvant alimenter cette peseuse — une seule à la fois. */
  lot3Options: string[];
}

/** Sources d'alimentation réelles de chaque peseuse (confirmé avec l'utilisateur) : DA40/DB40 en
 * direct (train → navire, sans passage par une cellule), une cellule de son axe (Lot 1 ou 2), ou
 * une des 2 cellules dédiées du Lot 3 — jamais plusieurs sources en même temps. Purement
 * informatif (légende) ici, ne contraint aucune saisie ni aucun calcul. */
export const PESEUSE_SOURCES: PeseuseSource[] = [
  { peseuseId: "peseuse-a", axeId: "axe-a", lot3Options: ["RA114", "RA124"] },
  { peseuseId: "peseuse-b", axeId: "axe-b", lot3Options: ["RB114", "RB124"] },
  { peseuseId: "peseuse-c", axeId: "axe-c", lot3Options: ["RC114", "RC134"] },
  { peseuseId: "peseuse-d", axeId: "axe-d", lot3Options: ["RD114", "RD124"] }
];

export interface CelluleQuantitePrevue {
  celluleId: string;
  quantite: number;
  /** Flux de déchargement choisi par l'opérateur pour une destination cellule (DA10 ou DB10) —
   * l'app propose une alternance par défaut mais c'est toujours l'opérateur qui décide, pas
   * l'application (confirmé avec l'utilisateur). Sans objet pour un silo ou "Navire direct". */
  flux?: "DA" | "DB";
}

/** Déduit automatiquement la catégorie "Destination prévue" à partir des lignes cellule(s)/silo(s)/
 * navire réellement saisies — évite de faire ressaisir deux fois la même information (la catégorie
 * était auparavant un champ manuel séparé, redondant avec l'éditeur détaillé). */
export function computeDestinationPrevue(rows: CelluleQuantitePrevue[]): DestinationPrevue {
  if (rows.length === 0) return "Lots";
  const celluleIds = new Set(CELLULES.map((c) => c.id));
  const siloIds = new Set(SILOS.map((s) => s.id));
  let hasCellule = false;
  let hasSilo = false;
  let hasDirect = false;
  for (const row of rows) {
    if (celluleIds.has(row.celluleId)) hasCellule = true;
    else if (siloIds.has(row.celluleId)) hasSilo = true;
    else if (row.celluleId === "DIRECT") hasDirect = true;
  }
  const kinds = [hasCellule, hasSilo, hasDirect].filter(Boolean).length;
  if (kinds > 1) return "Mixte";
  if (hasDirect) return "Navire direct";
  if (hasSilo) return "Silos";
  return "Lots";
}

export interface Train {
  id: string;
  dateArriveePrevue: string; // yyyy-mm-dd
  heureArriveePrevue: string; // HH:mm
  heureArriveeReelle: string; // HH:mm ou ""
  numeroTrain: string;
  matricule: string;
  nombreWagons: number;
  qualite: string;
  tonnagePrevu: number;
  tonnageExpedie: number;
  tonnageBascule: number;
  statut: TrainStatus;
  destinationPrevue: DestinationPrevue;
  /** Cellule(s)/lot(s) envisagé(s) dès la planification, avec la quantité exacte prévue pour chacune
   * — quand destinationPrevue = "Lots" ou "Mixte". Indicatif ; l'entrée réelle reste saisie plus tard
   * via le déchargement (voir TrainDetailsPanel "Cellules exactes de destination"). */
  celluleDestinationPrevue: CelluleQuantitePrevue[];
  observations: string;
}

export interface DestinationRow {
  // plusieurs destinations peuvent être choisies en même temps (ex. une cellule + le silo T10) ;
  // la quantité totale est alors répartie automatiquement entre elles (voir getDestinationShares).
  destinations: string[];
  qualite: string;
  quantite: number;
  periode: string;
}

export interface CelluleAllocation {
  celluleId: string;
  quantite: number;
}

export interface NavireDirectRow {
  quantite: number;
  qualite: string;
  peseuseId: string;
  portiqueId: string;
  periode: string;
  navire: string;
}

export interface Dechargement {
  id: string;
  trainId: string;
  date: string;
  numeroTrain: string;
  matricule: string;
  nombreWagons: number;
  tonnageExpedie: number;
  tonnageBascule: number;
  axe: string;
  debutDechargement: string; // HH:mm
  finDechargement: string; // HH:mm
  da: DestinationRow[];
  db: DestinationRow[];
  silos: DestinationRow[];
  cellules: CelluleAllocation[];
  navireDirect: NavireDirectRow[];
  observations: string;
}

/** Une ligne = un arrêt affectant le déchargement d'un train (même structure que "Arrêt" côté
 * navire — feuille absente du fichier Excel train, ajoutée pour permettre le même suivi). */
export interface ArretTrain {
  id: string;
  trainId: string;
  axe: string; // DA10, DB10, ou vide si l'arrêt concerne les deux
  elementConcerne: string; // cellule/silo concerné, ex. "RD124"
  nature: string;
  dateDebut: string; // yyyy-mm-dd
  heureDebut: string; // HH:mm
  dateFin: string; // yyyy-mm-dd ou ""
  heureFin: string; // HH:mm ou ""
  description: string;
}

/** Vocabulaire officiel des causes d'arrêt — feuille "Familles arrêts" du classeur source
 * "Bilan et synthèses des arrêts du JUIN 2026". Confirmé par la feuille "Synthèses" : le
 * déchargement des trains (DA10/DB10) utilise exactement les mêmes 32 causes que le chargement
 * des navires (CA30-CD30), pas une liste séparée — remplace l'ancienne liste "train" inventée
 * faute de source à l'époque. "BDM" est observé dans les données réelles de juin sans être défini
 * dans le glossaire "Familles arrêts" (probablement Balayage/Dépoussiérage/Maintenance). */
export const NATURE_ARRET_OPTIONS: string[] = [
  "exploitation",
  "électrique",
  "instrumentation",
  "mécanique",
  "bande",
  "manque navire",
  "attente accostage",
  "attente préparation",
  "structure navire",
  "Mouvement portique",
  "Changement de cale",
  "Mouvement même cale",
  "Passage marée",
  "intempéries",
  "Assiette",
  "Balance",
  "LTE",
  "Déhalage",
  "Déballastage",
  "Correction gîte",
  "Navire haut",
  "Sondage des ballasts",
  "Arrêt par le bord",
  "Arrêt par le quai",
  "Forces majeurs",
  "stock",
  "arrêts planifiés",
  "manque produit",
  "Alimentation du train",
  "Dégagement stériles",
  "Permutation circuit",
  "autres externes",
  "BDM"
];

/** Causes appartenant à la famille "maintenance" dans le calcul du TRS (Taux de Rendement
 * Synthétique) de la feuille "Synthèses" — les autres causes hors "exploitation" relèvent de la
 * catégorie "externe/organisationnel" et ne comptent ni en exploitation ni en maintenance. */
export const MAINTENANCE_NATURES: string[] = ["électrique", "instrumentation", "mécanique", "bande"];

export interface FamilleArret {
  nature: string;
  exemples: string;
}

/** Glossaire des causes d'arrêt — feuille "Familles arrêts" du classeur source, citée verbatim
 * (fautes de frappe d'origine incluses) pour rester fidèle au document de référence des opérateurs. */
export const FAMILLES_ARRETS: FamilleArret[] = [
  { nature: "exploitation", exemples: "Débit faible, surcharge….." },
  { nature: "électrique", exemples: "" },
  { nature: "instrumentation", exemples: "arrêts service électronique : Défaut .. Arrêt d'urgence défectueux etc" },
  { nature: "mécanique", exemples: "" },
  { nature: "bande", exemples: "" },
  { nature: "manque navire", exemples: "" },
  { nature: "attente accostage", exemples: "" },
  { nature: "attente préparation", exemples: "" },
  { nature: "structure navire", exemples: "" },
  { nature: "Mouvement portique", exemples: "" },
  { nature: "Changement de cale", exemples: "" },
  { nature: "Mouvement même cale", exemples: "" },
  { nature: "Passage marée", exemples: "" },
  { nature: "intempéries", exemples: "" },
  { nature: "Assiette", exemples: "Correction d'assiète, avantge cale" },
  { nature: "Balance", exemples: "Attente balance" },
  { nature: "LTE", exemples: "" },
  { nature: "Déhalage", exemples: "" },
  { nature: "Déballastage", exemples: "" },
  { nature: "Correction gîte", exemples: "" },
  { nature: "Navire haut", exemples: "Tirant d'air" },
  { nature: "Sondage des ballasts", exemples: "" },
  { nature: "Arrêt par le bord", exemples: "Petit navires, mat de charge ….." },
  { nature: "Arrêt par le quai", exemples: "Attente ouverture des cales, navires sous saisie conservatoire, chargement deux qualité …....." },
  { nature: "Forces majeurs", exemples: "Clandestins, visites, passage navires …....." },
  { nature: "stock", exemples: "Vidange cellule, reconstitition du stocks, casque bouché" },
  { nature: "arrêts planifiés", exemples: "" },
  { nature: "manque produit", exemples: "" },
  { nature: "Alimentation du train", exemples: "" },
  { nature: "Dégagement stériles", exemples: "" },
  { nature: "Permutation circuit", exemples: "" },
  { nature: "autres externes", exemples: "toutes arrêts n'appartient pas aux familles déjà cité" },
  { nature: "BDM", exemples: "Non défini dans le glossaire source — catégorie observée dans les données réelles" }
];

/** Aucun arrêt de train enregistré par défaut — contrairement aux navires, le fichier Excel source
 * ne contenait pas d'historique d'arrêts trains à transcrire ; l'opérateur les saisit au fil de l'eau. */
export const ARRETS_TRAIN: ArretTrain[] = [];

export const TRAINS: Train[] = [
  {
    id: "train-9608",
    dateArriveePrevue: "2026-01-01",
    heureArriveePrevue: "05:30",
    heureArriveeReelle: "05:42",
    numeroTrain: "9608",
    matricule: "9608",
    nombreWagons: 59,
    qualite: "K12",
    tonnagePrevu: 3750,
    tonnageExpedie: 3750,
    tonnageBascule: 3695,
    statut: "Déchargé",
    destinationPrevue: "Mixte",
    celluleDestinationPrevue: [
      { celluleId: "SA211", quantite: 1450 },
      { celluleId: "SA221", quantite: 1245 }
    ],
    observations: ""
  },
  {
    id: "train-9610",
    dateArriveePrevue: "2026-01-01",
    heureArriveePrevue: "07:15",
    heureArriveeReelle: "07:10",
    numeroTrain: "9610",
    matricule: "9610",
    nombreWagons: 56,
    qualite: "K08",
    tonnagePrevu: 3600,
    tonnageExpedie: 3556,
    tonnageBascule: 3630,
    statut: "Déchargé",
    destinationPrevue: "Lots",
    celluleDestinationPrevue: [{ celluleId: "SB311", quantite: 1815 }],
    observations: ""
  },
  {
    id: "train-9600",
    dateArriveePrevue: "2026-01-01",
    heureArriveePrevue: "09:00",
    heureArriveeReelle: "09:35",
    numeroTrain: "9600",
    matricule: "9600",
    nombreWagons: 60,
    qualite: "K10",
    tonnagePrevu: 3800,
    tonnageExpedie: 3837,
    tonnageBascule: 3546,
    statut: "En retard",
    destinationPrevue: "Silos",
    celluleDestinationPrevue: [],
    observations: "Retard aiguillage"
  },
  {
    id: "train-9602",
    dateArriveePrevue: "2026-01-01",
    heureArriveePrevue: "11:20",
    heureArriveeReelle: "",
    numeroTrain: "9602",
    matricule: "9602",
    nombreWagons: 58,
    qualite: "K12",
    tonnagePrevu: 3616,
    tonnageExpedie: 0,
    tonnageBascule: 0,
    statut: "Prévu",
    destinationPrevue: "Lots",
    celluleDestinationPrevue: [{ celluleId: "SA222", quantite: 1800 }],
    observations: ""
  },
  {
    id: "train-9606",
    dateArriveePrevue: "2026-01-01",
    heureArriveePrevue: "13:45",
    heureArriveeReelle: "13:50",
    numeroTrain: "9606",
    matricule: "9606",
    nombreWagons: 60,
    qualite: "K06",
    tonnagePrevu: 3800,
    tonnageExpedie: 3801,
    tonnageBascule: 3814,
    statut: "En déchargement",
    destinationPrevue: "Mixte",
    celluleDestinationPrevue: [{ celluleId: "RC114", quantite: 1900 }],
    observations: ""
  }
];

export const DECHARGEMENTS: Dechargement[] = [
  {
    id: "dech-9608",
    trainId: "train-9608",
    date: "2026-01-01",
    numeroTrain: "9608",
    matricule: "9608",
    nombreWagons: 59,
    tonnageExpedie: 3750,
    tonnageBascule: 3695,
    axe: "Axe A",
    debutDechargement: "07:50",
    finDechargement: "09:40",
    da: [{ destinations: ["SA211"], qualite: "K12", quantite: 1450, periode: "07:50-08:50" }],
    db: [{ destinations: ["SA221"], qualite: "K12", quantite: 1245, periode: "08:50-09:40" }],
    silos: [{ destinations: ["T10"], qualite: "K12", quantite: 1000, periode: "07:50-09:40" }],
    cellules: [],
    navireDirect: [],
    observations: ""
  },
  {
    id: "dech-9610",
    trainId: "train-9610",
    date: "2026-01-01",
    numeroTrain: "9610",
    matricule: "9610",
    nombreWagons: 56,
    tonnageExpedie: 3556,
    tonnageBascule: 3630,
    axe: "Axe C",
    debutDechargement: "07:20",
    finDechargement: "09:05",
    da: [{ destinations: ["SB311"], qualite: "K08", quantite: 1815, periode: "07:20-08:10" }],
    db: [],
    silos: [],
    cellules: [],
    navireDirect: [],
    observations: ""
  },
  {
    id: "dech-9600",
    trainId: "train-9600",
    date: "2025-12-31",
    numeroTrain: "9600",
    matricule: "9600",
    nombreWagons: 60,
    tonnageExpedie: 3837,
    tonnageBascule: 3546,
    axe: "Axe B",
    debutDechargement: "22:10",
    finDechargement: "23:55",
    da: [{ destinations: ["SA222"], qualite: "K10", quantite: 2000, periode: "22:10-23:00" }],
    db: [{ destinations: ["SA213"], qualite: "K10", quantite: 1546, periode: "23:00-23:55" }],
    silos: [],
    cellules: [],
    navireDirect: [],
    observations: ""
  }
];
