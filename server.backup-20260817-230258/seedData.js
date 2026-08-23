// Données de départ pour une base fraîche — copie exacte des constantes de seed déjà utilisées
// côté client (src/components/train/trainData.ts, .../navire/navireData.ts, .../stock/stockData.ts)
// avant leur migration vers la base de données, pour que rien ne change au premier démarrage.

export const TRAINS = [
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
    observations: ""
  }
];

export const DECHARGEMENTS = [
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

export const NAVIRES = [
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
    observations: ""
  }
];

const CHARGEMENT_ROWS = [
  ["chg-1", "CA30", "2", "D", "silos", "2026-06-24", "07:15", "2026-06-24", "08:30", 416],
  ["chg-2", "CA30", "2", "D", "12", "2026-06-24", "08:30", "2026-06-24", "13:25", 2694],
  ["chg-3", "CA30", "1", "D", "12", "2026-06-24", "13:55", "2026-06-24", "14:10", 112],
  ["chg-4", "CA30", "1", "A", "silos", "2026-06-24", "14:10", "2026-06-24", "15:00", 549],
  ["chg-5", "CA30", "1", "D", "12", "2026-06-24", "15:00", "2026-06-24", "17:00", 1117],
  ["chg-6", "CA30", "1", "D", "16", "2026-06-24", "17:00", "2026-06-24", "19:15", 650],
  ["chg-7", "CA30", "1", "B", "19", "2026-06-24", "19:15", "2026-06-24", "23:55", 3321],
  ["chg-8", "CA30", "1", "B", "19", "2026-06-25", "00:05", "2026-06-25", "00:20", 257],
  ["chg-9", "CA30", "2", "D", "16", "2026-06-25", "03:55", "2026-06-25", "04:30", 205],
  ["chg-10", "CA30", "2", "D", "16", "2026-06-25", "05:00", "2026-06-25", "05:30", 328],
  ["chg-11", "CA30", "2", "D", "16", "2026-06-25", "06:30", "2026-06-25", "06:40", 59],
  ["chg-12", "CA30", "2", "D", "16", "2026-06-25", "06:40", "2026-06-25", "06:45", 34],
  ["chg-13", "CB30", "3", "A", "18", "2026-06-24", "07:15", "2026-06-24", "08:45", 1503],
  ["chg-14", "CB30", "3", "A", "di", "2026-06-24", "09:00", "2026-06-24", "10:25", 900],
  ["chg-15", "CB30", "3", "A", "18", "2026-06-24", "10:25", "2026-06-24", "11:50", 1073],
  ["chg-16", "CB30", "3", "A", "20", "2026-06-24", "12:10", "2026-06-24", "13:00", 116],
  ["chg-17", "CB30", "3", "A", "silos", "2026-06-24", "13:10", "2026-06-24", "13:25", 140],
  ["chg-18", "CB30", "2", "A", "silos", "2026-06-24", "16:15", "2026-06-24", "17:00", 450],
  ["chg-19", "CB30", "2", "A", "18", "2026-06-24", "17:00", "2026-06-24", "21:30", 2317],
  ["chg-20", "CB30", "3", "A", "18", "2026-06-24", "22:00", "2026-06-24", "23:55", 433],
  ["chg-21", "CB30", "3", "A", "18", "2026-06-25", "00:05", "2026-06-25", "00:40", 27],
  ["chg-22", "CB30", "3", "B", "19", "2026-06-25", "00:50", "2026-06-25", "01:30", 267],
  ["chg-23", "CB30", "3", "D", "16", "2026-06-25", "01:40", "2026-06-25", "03:00", 560],
  ["chg-24", "CC30", "4", "B", "19", "2026-06-24", "07:15", "2026-06-24", "08:45", 1354],
  ["chg-25", "CC30", "4", "B", "di", "2026-06-24", "09:00", "2026-06-24", "10:25", 1129],
  ["chg-26", "CC30", "4", "B", "19", "2026-06-24", "10:25", "2026-06-24", "11:50", 1057],
  ["chg-27", "CC30", "4", "B", "21", "2026-06-24", "12:10", "2026-06-24", "12:25", 47],
  ["chg-28", "CC30", "4", "B", "19", "2026-06-24", "12:40", "2026-06-24", "13:25", 687],
  ["chg-29", "CC30", "3", "B", "19", "2026-06-24", "13:55", "2026-06-24", "15:00", 999],
  ["chg-30", "CC30", "3", "A", "silos", "2026-06-24", "15:00", "2026-06-24", "16:15", 795],
  ["chg-31", "CC30", "4", "C", "9", "2026-06-24", "19:00", "2026-06-24", "19:50", 234],
  ["chg-32", "CC30", "4", "C", "15", "2026-06-24", "19:50", "2026-06-24", "21:00", 544],
  ["chg-33", "CC30", "4", "C", "17", "2026-06-24", "21:00", "2026-06-24", "21:30", 152],
  ["chg-34", "CC30", "4", "C", "15", "2026-06-24", "21:40", "2026-06-24", "23:55", 791],
  ["chg-35", "CC30", "4", "C", "15", "2026-06-25", "00:05", "2026-06-25", "01:35", 815],
  ["chg-36", "CC30", "5", "C", "15", "2026-06-25", "03:00", "2026-06-25", "03:55", 599],
  ["chg-37", "CC30", "5", "C", "15", "2026-06-25", "05:00", "2026-06-25", "05:30", 117],
  ["chg-38", "CD30", "5", "C", "silos", "2026-06-24", "07:15", "2026-06-24", "08:45", 721],
  ["chg-39", "CD30", "5", "C", "di", "2026-06-24", "09:00", "2026-06-24", "11:30", 1395],
  ["chg-40", "CD30", "5", "C", "13", "2026-06-24", "11:45", "2026-06-24", "12:15", 206],
  ["chg-41", "CD30", "5", "C", "9", "2026-06-24", "12:35", "2026-06-24", "13:25", 633],
  ["chg-42", "CD30", "5", "C", "9", "2026-06-24", "13:55", "2026-06-24", "18:00", 2742]
];

export const CHARGEMENTS = CHARGEMENT_ROWS.map(
  ([id, portique, cale, peseuse, repriseOuDirection, dateDebutAffect, heureDebutAffect, dateFinAffect, heureFinAffect, tonnage]) => ({
    id,
    navireId: "navire-saint-vassilios",
    portique,
    cale,
    peseuse,
    repriseOuDirection,
    dateDebutAffect,
    heureDebutAffect,
    dateFinAffect,
    heureFinAffect,
    tonnage
  })
);

const ARRET_ROWS = [
  ["arret-1", "CA30", "RD124", "Permutation circuit", "07:15", "08:30", "08:45", "Permutation circuit"],
  ["arret-2", "CA30", "DA", "Permutation circuit", "08:45", "08:45", "09:00", "Permutation circuit"],
  ["arret-3", "CB30", "DA", "Permutation circuit", "08:45", "08:45", "09:00", "Permutation circuit"],
  ["arret-4", "CC30", "DB", "Permutation circuit", "08:45", "08:45", "09:00", "Permutation circuit"],
  ["arret-5", "CD30", "DB", "Permutation circuit", "08:45", "08:45", "09:00", "Permutation circuit"],
  ["arret-6", "CD30", "RC114", "Permutation circuit", "11:30", "11:30", "11:45", "Permutation circuit"],
  ["arret-7", "CC30", "CC30", "Mouvement même cale", "11:40", "11:40", "12:00", "Mouvement même cale"],
  ["arret-8", "CD30", "RC114", "bande", "11:45", "11:45", "12:00", "déport de bande"],
  ["arret-9", "CB30", "RA125", "Permutation circuit", "11:50", "11:50", "12:10", "Permutation circuit"],
  ["arret-10", "CB30", "CB30", "Mouvement même cale", "12:15", "12:15", "12:35", "Mouvement même cale"],
  ["arret-11", "CC30", "RB124", "mécanique", "12:10", "12:10", "12:25", "problème goulotte"],
  ["arret-12", "CA30", "CA30", "Changement de cale", "13:25", "13:25", "13:55", "Changement de cale"],
  ["arret-13", "CB30", "CB30", "Changement de cale", "13:25", "13:25", "13:55", "Changement de cale"],
  ["arret-14", "CC30", "CC30", "Changement de cale", "13:25", "13:25", "13:55", "Changement de cale"],
  ["arret-15", "CD30", "CD30", "Changement de cale", "13:25", "13:25", "13:55", "Changement de cale"],
  ["arret-16", "CB30", "CB30", "Assiette", "13:55", "13:55", "16:15", "Assiette"],
  ["arret-17", "CA30", "CA30", "Assiette", "16:15", "16:15", "19:00", "Assiette"],
  ["arret-18", "CA30", "RD13", "stock", "16:15", "16:15", "17:00", "cellule en vidange"],
  ["arret-19", "CD30", "RC13", "stock", "17:25", "17:25", "18:00", "cellule en vidange"],
  ["arret-20", "CD30", "CD30", "Changement de cale", "18:00", "18:00", "18:30", "changement de cale"],
  ["arret-21", "CA30", "RD214", "électrique", "18:15", "18:15", "19:15", "défaut rotation"],
  ["arret-22", "CD30", "CD30", "Assiette", "18:30", "18:30", "", "Assiette"],
  ["arret-23", "CC30", "RC13", "stock", "19:00", "19:00", "19:50", "cellule en vidange"],
  ["arret-24", "CB30", "CB30", "Mouvement même cale", "19:50", "19:50", "20:10", "Mouvement même cale"],
  ["arret-25", "CB30", "CB30", "Changement de cale", "21:30", "21:30", "22:00", "Changement de cale"],
  ["arret-26", "CA30", "RB114", "exploitation", "22:00", "22:00", "22:40", "débit faible"],
  ["arret-27", "CB30", "RA114", "stock", "22:00", "22:00", "22:40", "cellule en vidange"],
  ["arret-28", "CC30", "RC124", "exploitation", "22:00", "22:00", "22:40", "débit faible"],
  ["arret-29", "CA30", "CA30", "Balance", "00:20", "00:20", "03:55", "Balance"],
  ["arret-30", "CB30", "RB114", "Permutation circuit", "00:30", "00:30", "00:40", "Permutation circuit"],
  ["arret-31", "CC30", "CC30", "Mouvement même cale", "00:40", "00:40", "01:00", "Mouvement même cale"]
];

export const ARRETS = ARRET_ROWS.map(([id, portique, elementConcerne, nature, heureDebut, _dup, heureFin, description]) => {
  const isDay2 = ["arret-29", "arret-30", "arret-31"].includes(id);
  const date = isDay2 ? "2026-06-25" : "2026-06-24";
  return {
    id,
    navireId: "navire-saint-vassilios",
    portique,
    elementConcerne,
    nature,
    dateDebut: date,
    heureDebut,
    dateFin: heureFin ? date : "",
    heureFin,
    description
  };
});

const MORT_BASELINE = [7000, 3100, 8000, 7800, 8800, 7600, 7682, 8200, 9000, 7300, 7100, 7500];
const CAPACITES = [12500, 8000, 13300, 13300, 13300, 13300, 13300, 13300, 13300, 13300, 13300, 13300];
// Mêmes id que trainData.CELLULES[0..11] (SA211, SA212, SA213, SA221, SA222, SA223, SB311, SB312, SB313, SB321, SB322, SB323).
const STOCK_CELLULE_IDS = ["SA211", "SA212", "SA213", "SA221", "SA222", "SA223", "SB311", "SB312", "SB313", "SB321", "SB322", "SB323"];

function buildCellules(qualites, vifs) {
  return STOCK_CELLULE_IDS.map((celluleId, i) => ({
    celluleId,
    qualite: qualites[i],
    tonnageVif: vifs[i],
    tonnageMort: MORT_BASELINE[i],
    capaciteTotale: CAPACITES[i]
  }));
}

export const STOCK_SNAPSHOTS = [
  {
    date: "2026-02-24",
    cellules: buildCellules(
      ["K03", "K10", "K20", "K03", "K02", "K10", "K02", "K03", "K10", "K02", "K10", "K03"],
      [3300, 3000, 1800, 4600, 0, 800, 0, 4700, 2000, 0, 0, 3600]
    ),
    zones: [
      { id: "SA", qualite: "K09", tonnageVif: 76000, tonnageMort: 60000 },
      { id: "SB", qualite: "", tonnageVif: 0, tonnageMort: 50000 }
    ],
    etatSilos: 0,
    posteNotes: "A déboucher cellule 9"
  },
  {
    date: "2026-04-13",
    cellules: buildCellules(
      ["K03", "K12", "K20", "K03", "K02", "K12", "K20", "K02", "K12", "K12", "K20", "K02"],
      [4000, 3600, 200, 3700, 0, 4200, 3000, 1600, 4000, 3400, 2200, 0]
    ),
    zones: [
      { id: "SA", qualite: "K09", tonnageVif: 52300, tonnageMort: 60000 },
      { id: "SB", qualite: "", tonnageVif: 0, tonnageMort: 50000 }
    ],
    etatSilos: 0,
    posteNotes: "Cellule 9 et 11 à déboucher"
  },
  {
    date: "2026-04-23",
    cellules: buildCellules(
      ["K02", "K12", "K20", "K02", "K02", "K12", "K02", "K02", "K12", "K12", "K02", "K01"],
      [800, 3600, 0, 200, 400, 4200, 200, 300, 4000, 3400, 600, 0]
    ),
    zones: [
      { id: "SA", qualite: "K09", tonnageVif: 70100, tonnageMort: 60000 },
      { id: "SB", qualite: "", tonnageVif: 0, tonnageMort: 50000 }
    ],
    etatSilos: 0,
    posteNotes: "Cellule 9 et 11 à déboucher"
  },
  {
    date: "2026-06-26",
    cellules: buildCellules(
      ["K12", "K02", "K02", "K12", "K02", "K02", "K02", "K02", "K02", "K12", "K02", "K02"],
      [4300, 400, 5000, 2200, 0, 3900, 1700, 3000, 4200, 0, 3000, 800]
    ),
    zones: [
      { id: "SA", qualite: "K09", tonnageVif: 30000, tonnageMort: 60000 },
      { id: "SB", qualite: "", tonnageVif: 0, tonnageMort: 50000 }
    ],
    etatSilos: 0,
    posteNotes: "Cellule 9 et 11 à déboucher"
  }
];
