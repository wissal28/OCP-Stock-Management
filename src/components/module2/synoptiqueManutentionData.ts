export type EquipmentFamily = "Déchargement" | "Convoyeur" | "Reprise" | "Chargement" | "Portique";
export type EquipmentStatus = "Actif" | "En attente" | "Non renseigné";

export interface Equipment {
  code: string;
  label: string;
  family: EquipmentFamily;
  zone: string;
  type: string;
  circuitId: string;
  description: string;
  status: EquipmentStatus;
  lotId?: string;
  trajet: string;
  axeId?: string;
  qualite?: string;
}

/** Forme graphique de la couche interactive (clic/survol/statut en direct), superposée en
 * transparence sur l'image officielle affichée en fond dans SynopticScene. */
export type EquipmentShape = "rect" | "line" | "circle";

export interface EquipmentLayout {
  shape: EquipmentShape;
  /** Ancre (rect/circle) : coin haut-gauche pour un rect, centre pour un circle. */
  position?: { x: number; y: number };
  /** Tracé (line) : suite de points reliés par des segments. */
  path?: { x: number; y: number }[];
  w?: number;
  h?: number;
  r?: number;
  /** Codes des équipements directement reliés (matière entrante/sortante), pour tracer les jonctions. */
  connections: string[];
}

export interface Lot {
  id: string;
  name: string;
  description: string;
  circuitIds: string[];
}

export interface Axe {
  id: string;
  lotId: string;
  name: string;
  circuitId: string;
}

export interface Silo {
  id: string;
  label: string;
  color: string;
  fedBy: string;
  feeds: string;
  description: string;
}

export interface Peseuse {
  id: string;
  label: string;
  circuitId: string;
  role: string;
  quantite: string;
  /** Entrées toujours actives, quelle que soit la reprise sélectionnée. */
  dechargementInputs: string[];
  /** Reprises du Lot 1 ou Lot 2 alimentant cette peseuse — une seule active à la fois (même axe). */
  axisReprises: string[];
  /** Reprises du Lot 3 alimentant cette peseuse — une seule active à la fois. */
  lot3Reprises: string[];
}

export interface Circuit {
  id: string;
  name: string;
  shortDescription: string;
  family: EquipmentFamily | "Global";
}

export interface CircuitRelation {
  from: string;
  to: string;
}

export interface FamilyMeta {
  label: string;
  text: string;
  bg: string;
  border: string;
  dot: string;
}

// Couleurs calées sur le code couleur réel du document papier : rouge pour DA/DB (déchargement),
// bleu pour SA/SB (convoyage principal), vert pour RA/RB/RC/RD (reprises), noir/gris foncé pour le
// rail CA/CB/CC/CD et le chargement navire — pas une palette générique.
export const FAMILY_META: Record<EquipmentFamily, FamilyMeta> = {
  "Déchargement": { label: "Déchargement", text: "#8a2020", bg: "#fdeaea", border: "#f0c6c6", dot: "#c1272d" },
  "Convoyeur": { label: "Convoyeur", text: "#1d4e73", bg: "#e8f1f7", border: "#c7dcea", dot: "#1d5f8a" },
  "Reprise": { label: "Reprise", text: "#0d6b4d", bg: "#e8f4ed", border: "#cfe3d8", dot: "#0d6b4d" },
  "Chargement": { label: "Chargement", text: "#2b2b2b", bg: "#f0f0f0", border: "#d5d5d5", dot: "#2b2b2b" },
  "Portique": { label: "Portique", text: "#313c36", bg: "#eef1ee", border: "#d7ddd6", dot: "#627067" }
};

export const CIRCUITS: Circuit[] = [
  { id: "vue-globale", name: "Vue globale", shortDescription: "L'ensemble du synoptique, du déchargement wagons au chargement navire.", family: "Global" },
  { id: "dechargement-da", name: "Déchargement DA", shortDescription: "Réception et répartition du minerai déchargé côté circuit DA.", family: "Déchargement" },
  { id: "dechargement-db", name: "Déchargement DB", shortDescription: "Réception et répartition du minerai déchargé côté circuit DB.", family: "Déchargement" },
  { id: "convoyage-sasb", name: "Convoyage SA/SB", shortDescription: "Convoyeurs principaux reliant les silos de stockage aux lots de reprise.", family: "Convoyeur" },
  { id: "reprise-ra", name: "Reprise RA", shortDescription: "Silos et convoyeurs de reprise du groupe RA (Lot 1).", family: "Reprise" },
  { id: "reprise-rb", name: "Reprise RB", shortDescription: "Silos et convoyeurs de reprise du groupe RB (Lot 1).", family: "Reprise" },
  { id: "reprise-rc", name: "Reprise RC", shortDescription: "Silos et convoyeurs de reprise du groupe RC (Lot 2).", family: "Reprise" },
  { id: "reprise-rd", name: "Reprise RD", shortDescription: "Silos et convoyeurs de reprise du groupe RD (Lot 2).", family: "Reprise" },
  { id: "reprise-lot3", name: "Reprise Lot 3", shortDescription: "Reprises RC1x4/RD1x4/RA1x4/RB1x4 de la zone de stockage globale (Lot 3, cellules 13 à 21).", family: "Reprise" },
  { id: "portique-a", name: "Chargement Portique A", shortDescription: "Convoyeurs de chargement et portique A vers le navire.", family: "Portique" },
  { id: "portique-b", name: "Chargement Portique B", shortDescription: "Convoyeurs de chargement et portique B vers le navire.", family: "Portique" },
  { id: "portique-c", name: "Chargement Portique C", shortDescription: "Convoyeurs de chargement et portique C vers le navire.", family: "Portique" },
  { id: "portique-d", name: "Chargement Portique D", shortDescription: "Convoyeurs de chargement et portique D vers le navire.", family: "Portique" },
  { id: "chargement-navire", name: "Chargement navire", shortDescription: "Colonnes finales de déversement dans les cales du navire.", family: "Chargement" },
  { id: "poste-66", name: "Poste 66", shortDescription: "Poste de reprise et dosage alimentant le chargement final.", family: "Chargement" }
];

export const LOTS: Lot[] = [
  { id: "lot-1", name: "Lot 1", description: "Deux axes de stockage (RA, RB), soit 6 cellules au total, alimentés depuis le convoyeur principal SA via l'aiguillage SA200.", circuitIds: ["reprise-ra", "reprise-rb"] },
  { id: "lot-2", name: "Lot 2", description: "Deux axes de stockage (RC, RD), soit 6 cellules au total, alimentés depuis le convoyeur principal SB via l'aiguillage SB300.", circuitIds: ["reprise-rc", "reprise-rd"] },
  { id: "lot-3", name: "Lot 3", description: "Zone de stockage globale (cellules n°13 à n°21), sans découpage en axes, alimentée en une seule reprise de chargement partagée par les quatre peseuses.", circuitIds: ["reprise-lot3"] }
];

export const AXES: Axe[] = [
  { id: "axe-lot1-1", lotId: "lot-1", name: "Axe 1", circuitId: "reprise-ra" },
  { id: "axe-lot1-2", lotId: "lot-1", name: "Axe 2", circuitId: "reprise-rb" },
  { id: "axe-lot2-1", lotId: "lot-2", name: "Axe 1", circuitId: "reprise-rc" },
  { id: "axe-lot2-2", lotId: "lot-2", name: "Axe 2", circuitId: "reprise-rd" }
];

export const PHOSPHATE_QUALITIES: string[] = Array.from({ length: 21 }, (_, index) => `K${String(index).padStart(2, "0")}`);

// Les deux seuls silos/trémies tampons réels du document OIK/PP — T10 (trémies de reprise, poste
// 66) et DB210 (silo de vidange, buffer de débordement). Remplace l'ancien "Silo A/B/C/D" fictif
// (jamais présent sur le document réel) qui ne correspondait à aucun équipement du schéma corrigé.
export const SILOS: Silo[] = [
  {
    id: "t10",
    label: "T10 — Trémies de reprise",
    color: "#8a5a10",
    fedBy: "DB210",
    feeds: "V10 (poste de chargement 66) / DB30 (retour)",
    description:
      "Groupe de 10 trémies identiques assurant la reprise et le dosage du phosphate, avant transfert soit vers le poste de chargement 66 (V10), soit en retour vers DB30."
  },
  {
    id: "db210",
    label: "DB210 — Silo de vidange",
    color: "#a5460f",
    fedBy: "DB20",
    feeds: "DB30 (direct) / T10",
    description:
      "Silo de vidange (buffer de débordement) : reçoit le phosphate du circuit DB lorsque les cellules de stockage sont saturées, en attendant qu'une capacité se libère. Peut rejoindre DB30 directement ou via T10. Son état réel (tonnage présent) provient du bordereau de stock quotidien."
  }
];

export const PESEUSES: Peseuse[] = [
  {
    id: "peseuse-a",
    label: "Peseuse A",
    circuitId: "portique-a",
    role: "Mesure la quantité de phosphate transférée vers le navire sur le circuit du portique A, avant chargement final.",
    quantite: "Non renseigné",
    dechargementInputs: ["DA40", "DB40"],
    axisReprises: ["RA11", "RA12", "RA13"],
    lot3Reprises: ["RA114", "RA124"]
  },
  {
    id: "peseuse-b",
    label: "Peseuse B",
    circuitId: "portique-b",
    role: "Mesure la quantité de phosphate transférée vers le navire sur le circuit du portique B, avant chargement final.",
    quantite: "Non renseigné",
    dechargementInputs: ["DA40", "DB40"],
    axisReprises: ["RB11", "RB12", "RB13"],
    lot3Reprises: ["RB114", "RB124"]
  },
  {
    id: "peseuse-c",
    label: "Peseuse C",
    circuitId: "portique-c",
    role: "Mesure la quantité de phosphate transférée vers le navire sur le circuit du portique C, avant chargement final.",
    quantite: "Non renseigné",
    dechargementInputs: ["DA40", "DB40"],
    axisReprises: ["RC11", "RC12", "RC13"],
    lot3Reprises: ["RC114", "RC134"]
  },
  {
    id: "peseuse-d",
    label: "Peseuse D",
    circuitId: "portique-d",
    role: "Mesure la quantité de phosphate transférée vers le navire sur le circuit du portique D, avant chargement final.",
    quantite: "Non renseigné",
    dechargementInputs: ["DA40", "DB40"],
    axisReprises: ["RD11", "RD12", "RD13"],
    lot3Reprises: ["RD114", "RD124"]
  }
];

export const EQUIPMENTS: Equipment[] = [
  // Déchargement DA
  { code: "DA10", label: "DA10", family: "Déchargement", zone: "Poste 0", type: "Trémie de déchargement", circuitId: "dechargement-da", description: "Convoyeur de réception du minerai déchargé côté wagons, tête de ligne du circuit DA.", status: "Actif", trajet: "Wagons de déchargement → DA10 → DA20" },
  { code: "DA20", label: "DA20", family: "Déchargement", zone: "Poste 0", type: "Convoyeur de transfert", circuitId: "dechargement-da", description: "Convoyeur de transfert DA reliant la trémie de réception à la zone de répartition.", status: "Actif", trajet: "DA10 → DA20 → DA30" },
  { code: "DA30", label: "DA30", family: "Déchargement", zone: "Poste 0", type: "Convoyeur de répartition", circuitId: "dechargement-da", description: "Convoyeur de répartition DA vers les silos de stockage.", status: "Actif", trajet: "DA20 → DA30 → DA40" },
  { code: "DA40", label: "DA40", family: "Déchargement", zone: "Poste 0", type: "Chariot verseur", circuitId: "dechargement-da", description: "Chariot verseur DA : répartit le phosphate soit directement vers une peseuse (DA510/DA520), soit vers le circuit de stockage (SA10).", status: "En attente", trajet: "DA30 → DA40 → DA510 / DA520 / SA10" },
  { code: "DA510", label: "DA510", family: "Déchargement", zone: "Poste 0", type: "Descente peseuse", circuitId: "dechargement-da", description: "Descente DA510 : convoyeur dédié alimentant la Peseuse A (PA10) depuis le chariot verseur DA40.", status: "Actif", trajet: "DA40 → DA510 → Peseuse A (PA10)" },
  { code: "DA520", label: "DA520", family: "Déchargement", zone: "Poste 0", type: "Descente peseuse", circuitId: "dechargement-da", description: "Descente DA520 : convoyeur dédié alimentant la Peseuse B (PB10) depuis le chariot verseur DA40.", status: "Non renseigné", trajet: "DA40 → DA520 → Peseuse B (PB10)" },

  // Déchargement DB
  { code: "DB10", label: "DB10", family: "Déchargement", zone: "Poste 3", type: "Trémie de déchargement", circuitId: "dechargement-db", description: "Convoyeur de réception du minerai déchargé côté wagons, tête de ligne du circuit DB.", status: "Actif", trajet: "Wagons de déchargement → DB10 → DB20" },
  { code: "DB20", label: "DB20", family: "Déchargement", zone: "Poste 3", type: "Convoyeur de transfert", circuitId: "dechargement-db", description: "Convoyeur de transfert DB vers la zone de chargement train.", status: "Actif", trajet: "DB10 → DB20 → DB210" },
  { code: "DB30", label: "DB30", family: "Déchargement", zone: "Poste 0", type: "Convoyeur de répartition", circuitId: "dechargement-db", description: "Convoyeur de répartition DB vers les silos de stockage.", status: "Actif", trajet: "DB20 → DB30 → DB40" },
  { code: "DB40", label: "DB40", family: "Déchargement", zone: "Poste 0", type: "Chariot verseur", circuitId: "dechargement-db", description: "Chariot verseur DB : répartit le phosphate soit directement vers une peseuse (DB510/DB520), soit vers le circuit de stockage (SB10).", status: "En attente", trajet: "DB30 → DB40 → DB510 / DB520 / SB10" },
  { code: "DB210", label: "DB210", family: "Déchargement", zone: "Poste 3", type: "Jonction convoyeur", circuitId: "dechargement-db", description: "Jonction DB210 reliant le convoyeur DB20 à DB30 (direct) et à la trémie T10 — T10 rejoint ensuite lui aussi DB30.", status: "Actif", trajet: "DB20 → DB210 → DB30 / T10" },
  { code: "DB510", label: "DB510", family: "Déchargement", zone: "Poste 0", type: "Descente peseuse", circuitId: "dechargement-db", description: "Descente DB510 : convoyeur dédié alimentant la Peseuse C (PC10) depuis le chariot verseur DB40.", status: "Actif", trajet: "DB40 → DB510 → Peseuse C (PC10)" },
  { code: "DB520", label: "DB520", family: "Déchargement", zone: "Poste 0", type: "Descente peseuse", circuitId: "dechargement-db", description: "Descente DB520 : convoyeur dédié alimentant la Peseuse D (PD10) depuis le chariot verseur DB40.", status: "Non renseigné", trajet: "DB40 → DB520 → Peseuse D (PD10)" },

  // Convoyage SA/SB
  { code: "SA10", label: "SA10", family: "Convoyeur", zone: "Poste 0", type: "Convoyeur principal", circuitId: "convoyage-sasb", description: "Convoyeur principal SA reliant le chariot verseur DA40 (déchargement) au Lot 1.", status: "Actif", trajet: "DA40 → SA10 → SA20" },
  { code: "SA20", label: "SA20", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur à bande", circuitId: "convoyage-sasb", description: "Convoyeur SA20 du Lot 1 vers le Lot 2, alimentant les reprises RA/RB.", status: "Actif", trajet: "SA10 → SA20 → SA200 (aiguillage Lot 1)" },
  { code: "SA30", label: "SA30", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur à bande", circuitId: "convoyage-sasb", description: "Convoyeur SA30 du Lot 2 vers le Lot 3.", status: "Actif", trajet: "SA200 → SA30 → SB300 (aiguillage Lot 2)" },
  { code: "SB10", label: "SB10", family: "Convoyeur", zone: "Poste 0", type: "Convoyeur principal", circuitId: "convoyage-sasb", description: "Convoyeur principal SB reliant le chariot verseur DB40 (déchargement) au Lot 1.", status: "Actif", trajet: "DB40 → SB10 → SB20" },
  { code: "SB20", label: "SB20", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur à bande", circuitId: "convoyage-sasb", description: "Convoyeur SB20 du Lot 1 vers le Lot 2.", status: "Actif", trajet: "SB10 → SB20 → Lot 1" },
  { code: "SB30", label: "SB30", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur à bande", circuitId: "convoyage-sasb", description: "Convoyeur SB30 du Lot 2 vers le Lot 3.", status: "En attente", trajet: "Lot 1 → SB30 → Lot 2" },
  { code: "SA44", label: "SA44", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur à bande", circuitId: "convoyage-sasb", description: "Convoyeur SA44 prolongeant SA30 vers la zone du Lot 3.", status: "Actif", trajet: "SA30 → SA44 → Lot 3" },
  { code: "SB40", label: "SB40", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur à bande", circuitId: "convoyage-sasb", description: "Convoyeur SB40 prolongeant SB30 vers la zone du Lot 3.", status: "Actif", trajet: "SB30 → SB40 → Lot 3" },

  // Convoyage SA - branchement Lot 1
  { code: "SA200", label: "SA200", family: "Convoyeur", zone: "Poste 1", type: "Aiguillage convoyeur", circuitId: "convoyage-sasb", description: "Point d'aiguillage SA200 répartissant le flux du Lot 1 vers SA210 et SA220.", status: "Actif", lotId: "lot-1", trajet: "SA20 → SA200 → SA210 / SA220" },
  { code: "SA210", label: "SA210", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de répartition", circuitId: "convoyage-sasb", description: "Convoyeur SA210 alimentant les silos RA11 à RA13.", status: "Actif", lotId: "lot-1", trajet: "SA200 → SA210 → SA211 / SA212 / SA213" },
  { code: "SA220", label: "SA220", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de répartition", circuitId: "convoyage-sasb", description: "Convoyeur SA220 alimentant les silos RB11 à RB13.", status: "Actif", lotId: "lot-1", trajet: "SA200 → SA220 → SA221 / SA222 / SA223" },
  { code: "SA211", label: "SA211", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de silo", circuitId: "convoyage-sasb", description: "Convoyeur SA211 alimentant le silo RA11.", status: "Actif", lotId: "lot-1", trajet: "SA210 → SA211 → Silo RA11" },
  { code: "SA212", label: "SA212", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de silo", circuitId: "convoyage-sasb", description: "Convoyeur SA212 alimentant le silo RA12.", status: "Actif", lotId: "lot-1", trajet: "SA210 → SA212 → Silo RA12" },
  { code: "SA213", label: "SA213", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de silo", circuitId: "convoyage-sasb", description: "Convoyeur SA213 alimentant le silo RA13.", status: "Non renseigné", lotId: "lot-1", trajet: "SA210 → SA213 → Silo RA13" },
  { code: "SA221", label: "SA221", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de silo", circuitId: "convoyage-sasb", description: "Convoyeur SA221 alimentant le silo RB11.", status: "Actif", lotId: "lot-1", trajet: "SA220 → SA221 → Silo RB11" },
  { code: "SA222", label: "SA222", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de silo", circuitId: "convoyage-sasb", description: "Convoyeur SA222 alimentant le silo RB12.", status: "Actif", lotId: "lot-1", trajet: "SA220 → SA222 → Silo RB12" },
  { code: "SA223", label: "SA223", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de silo", circuitId: "convoyage-sasb", description: "Convoyeur SA223 alimentant le silo RB13.", status: "En attente", lotId: "lot-1", trajet: "SA220 → SA223 → Silo RB13" },

  // Convoyage SB - branchement Lot 2
  { code: "SB300", label: "SB300", family: "Convoyeur", zone: "Poste 1", type: "Aiguillage convoyeur", circuitId: "convoyage-sasb", description: "Point d'aiguillage SB300 répartissant le flux du Lot 2 vers SB310 et SB320.", status: "Actif", lotId: "lot-2", trajet: "SB30 / SA30 → SB300 → SB310 / SB320" },
  { code: "SB310", label: "SB310", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de répartition", circuitId: "convoyage-sasb", description: "Convoyeur SB310 alimentant les silos RC11 à RC13.", status: "Actif", lotId: "lot-2", trajet: "SB300 → SB310 → SB311 / SB312 / SB313" },
  { code: "SB320", label: "SB320", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de répartition", circuitId: "convoyage-sasb", description: "Convoyeur SB320 alimentant les silos RD11 à RD13.", status: "Actif", lotId: "lot-2", trajet: "SB300 → SB320 → SB321 / SB322 / SB323" },
  { code: "SB311", label: "SB311", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de silo", circuitId: "convoyage-sasb", description: "Convoyeur SB311 alimentant le silo RC11.", status: "Actif", lotId: "lot-2", trajet: "SB310 → SB311 → Silo RC11" },
  { code: "SB312", label: "SB312", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de silo", circuitId: "convoyage-sasb", description: "Convoyeur SB312 alimentant le silo RC12.", status: "Actif", lotId: "lot-2", trajet: "SB310 → SB312 → Silo RC12" },
  { code: "SB313", label: "SB313", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de silo", circuitId: "convoyage-sasb", description: "Convoyeur SB313 alimentant le silo RC13.", status: "Non renseigné", lotId: "lot-2", trajet: "SB310 → SB313 → Silo RC13" },
  { code: "SB321", label: "SB321", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de silo", circuitId: "convoyage-sasb", description: "Convoyeur SB321 alimentant le silo RD11.", status: "Actif", lotId: "lot-2", trajet: "SB320 → SB321 → Silo RD11" },
  { code: "SB322", label: "SB322", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de silo", circuitId: "convoyage-sasb", description: "Convoyeur SB322 alimentant le silo RD12.", status: "Actif", lotId: "lot-2", trajet: "SB320 → SB322 → Silo RD12" },
  { code: "SB323", label: "SB323", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de silo", circuitId: "convoyage-sasb", description: "Convoyeur SB323 alimentant le silo RD13.", status: "En attente", lotId: "lot-2", trajet: "SB320 → SB323 → Silo RD13" },

  // Reprise RA (Lot 1)
  { code: "RA11", label: "RA11", family: "Reprise", zone: "Poste 1", type: "Silo de stockage", circuitId: "reprise-ra", description: "Cellule de stockage RA11, Axe 1 du Lot 1, alimentée par le convoyeur SA211.", status: "Actif", lotId: "lot-1", axeId: "axe-lot1-1", qualite: "K05", trajet: "SA211 → Silo RA11 → RA20" },
  { code: "RA12", label: "RA12", family: "Reprise", zone: "Poste 1", type: "Silo de stockage", circuitId: "reprise-ra", description: "Cellule de stockage RA12, Axe 1 du Lot 1.", status: "Actif", lotId: "lot-1", axeId: "axe-lot1-1", qualite: "K05", trajet: "SA212 → Silo RA12 → RA20" },
  { code: "RA13", label: "RA13", family: "Reprise", zone: "Poste 1", type: "Silo de stockage", circuitId: "reprise-ra", description: "Cellule de stockage RA13, Axe 1 du Lot 1.", status: "Non renseigné", lotId: "lot-1", axeId: "axe-lot1-1", qualite: "Non renseignée", trajet: "SA213 → Silo RA13 → RA20" },
  { code: "RA20", label: "RA20", family: "Reprise", zone: "Poste 1", type: "Convoyeur de reprise", circuitId: "reprise-ra", description: "Convoyeur de reprise RA20 sous silos, vers l'évacuation.", status: "Actif", lotId: "lot-1", trajet: "Silos RA11-RA13 → RA20 → RA30" },
  { code: "RA30", label: "RA30", family: "Reprise", zone: "Poste 1", type: "Convoyeur de reprise", circuitId: "reprise-ra", description: "Convoyeur de reprise RA30 assurant la continuité vers RA40.", status: "Actif", lotId: "lot-1", trajet: "RA20 → RA30 → RA40" },
  { code: "RA40", label: "RA40", family: "Reprise", zone: "Poste 0", type: "Chariot répartiteur", circuitId: "reprise-ra", description: "Chariot répartiteur RA40 orientant le flux vers l'évacuation générale.", status: "En attente", lotId: "lot-1", trajet: "RA30 / A2A4RA → RA40 → RA50" },
  { code: "RA50", label: "RA50", family: "Reprise", zone: "Poste 0", type: "Convoyeur d'évacuation", circuitId: "reprise-ra", description: "Convoyeur d'évacuation RA50 vers la zone de chargement.", status: "Actif", lotId: "lot-1", trajet: "RA40 → RA50 → Zone de chargement (CA/Portique A)" },

  // Reprise RB (Lot 1)
  { code: "RB11", label: "RB11", family: "Reprise", zone: "Poste 1", type: "Silo de stockage", circuitId: "reprise-rb", description: "Cellule de stockage RB11, Axe 2 du Lot 1.", status: "Actif", lotId: "lot-1", axeId: "axe-lot1-2", qualite: "K12", trajet: "SA221 → Silo RB11 → RB20" },
  { code: "RB12", label: "RB12", family: "Reprise", zone: "Poste 1", type: "Silo de stockage", circuitId: "reprise-rb", description: "Cellule de stockage RB12, Axe 2 du Lot 1.", status: "Actif", lotId: "lot-1", axeId: "axe-lot1-2", qualite: "K12", trajet: "SA222 → Silo RB12 → RB20" },
  { code: "RB13", label: "RB13", family: "Reprise", zone: "Poste 1", type: "Silo de stockage", circuitId: "reprise-rb", description: "Cellule de stockage RB13, Axe 2 du Lot 1.", status: "Non renseigné", lotId: "lot-1", axeId: "axe-lot1-2", qualite: "Non renseignée", trajet: "SA223 → Silo RB13 → RB20" },
  { code: "RB20", label: "RB20", family: "Reprise", zone: "Poste 1", type: "Convoyeur de reprise", circuitId: "reprise-rb", description: "Convoyeur de reprise RB20 sous silos, vers l'évacuation.", status: "Actif", lotId: "lot-1", trajet: "Silos RB11-RB13 → RB20 → RB30" },
  { code: "RB30", label: "RB30", family: "Reprise", zone: "Poste 1", type: "Convoyeur de reprise", circuitId: "reprise-rb", description: "Convoyeur de reprise RB30 assurant la continuité vers RB40.", status: "Actif", lotId: "lot-1", trajet: "RB20 → RB30 → RB40" },
  { code: "RB40", label: "RB40", family: "Reprise", zone: "Poste 0", type: "Chariot répartiteur", circuitId: "reprise-rb", description: "Chariot répartiteur RB40 orientant le flux vers l'évacuation générale.", status: "En attente", lotId: "lot-1", trajet: "RB30 / A2A4RB → RB40 → RB50" },
  { code: "RB50", label: "RB50", family: "Reprise", zone: "Poste 0", type: "Convoyeur d'évacuation", circuitId: "reprise-rb", description: "Convoyeur d'évacuation RB50 vers la zone de chargement.", status: "Actif", lotId: "lot-1", trajet: "RB40 → RB50 → Zone de chargement (CB/Portique B)" },

  // Reprise RC (Lot 2)
  { code: "RC11", label: "RC11", family: "Reprise", zone: "Poste 1", type: "Silo de stockage", circuitId: "reprise-rc", description: "Cellule de stockage RC11, Axe 1 du Lot 2.", status: "Actif", lotId: "lot-2", axeId: "axe-lot2-1", qualite: "K02", trajet: "SB311 → Silo RC11 → RC20" },
  { code: "RC12", label: "RC12", family: "Reprise", zone: "Poste 1", type: "Silo de stockage", circuitId: "reprise-rc", description: "Cellule de stockage RC12, Axe 1 du Lot 2.", status: "Actif", lotId: "lot-2", axeId: "axe-lot2-1", qualite: "K02", trajet: "SB312 → Silo RC12 → RC20" },
  { code: "RC13", label: "RC13", family: "Reprise", zone: "Poste 1", type: "Silo de stockage", circuitId: "reprise-rc", description: "Cellule de stockage RC13, Axe 1 du Lot 2.", status: "Non renseigné", lotId: "lot-2", axeId: "axe-lot2-1", qualite: "Non renseignée", trajet: "SB313 → Silo RC13 → RC20" },
  { code: "RC20", label: "RC20", family: "Reprise", zone: "Poste 1", type: "Convoyeur de reprise", circuitId: "reprise-rc", description: "Convoyeur de reprise RC20 sous silos, vers l'évacuation.", status: "Actif", lotId: "lot-2", trajet: "Silos RC11-RC13 → RC20 → RC30" },
  { code: "RC30", label: "RC30", family: "Reprise", zone: "Poste 1", type: "Convoyeur de reprise", circuitId: "reprise-rc", description: "Convoyeur de reprise RC30 assurant la continuité vers RC40.", status: "Actif", lotId: "lot-2", trajet: "RC20 → RC30 → RC40" },
  { code: "RC40", label: "RC40", family: "Reprise", zone: "Poste 0", type: "Chariot répartiteur", circuitId: "reprise-rc", description: "Chariot répartiteur RC40 orientant le flux vers l'évacuation générale.", status: "En attente", lotId: "lot-2", trajet: "RC30 / A2A4RC → RC40 → RC50" },
  { code: "RC50", label: "RC50", family: "Reprise", zone: "Poste 0", type: "Convoyeur d'évacuation", circuitId: "reprise-rc", description: "Convoyeur d'évacuation RC50 vers la zone de chargement.", status: "Actif", lotId: "lot-2", trajet: "RC40 → RC50 → Zone de chargement (CC/Portique C)" },

  // Reprise RD (Lot 2)
  { code: "RD11", label: "RD11", family: "Reprise", zone: "Poste 1", type: "Silo de stockage", circuitId: "reprise-rd", description: "Cellule de stockage RD11, Axe 2 du Lot 2.", status: "Actif", lotId: "lot-2", axeId: "axe-lot2-2", qualite: "K18", trajet: "SB321 → Silo RD11 → RD20" },
  { code: "RD12", label: "RD12", family: "Reprise", zone: "Poste 1", type: "Silo de stockage", circuitId: "reprise-rd", description: "Cellule de stockage RD12, Axe 2 du Lot 2.", status: "Actif", lotId: "lot-2", axeId: "axe-lot2-2", qualite: "K17", trajet: "SB322 → Silo RD12 → RD20" },
  { code: "RD13", label: "RD13", family: "Reprise", zone: "Poste 1", type: "Silo de stockage", circuitId: "reprise-rd", description: "Cellule de stockage RD13, Axe 2 du Lot 2.", status: "Non renseigné", lotId: "lot-2", axeId: "axe-lot2-2", qualite: "Non renseignée", trajet: "SB323 → Silo RD13 → RD20" },
  { code: "RD20", label: "RD20", family: "Reprise", zone: "Poste 1", type: "Convoyeur de reprise", circuitId: "reprise-rd", description: "Convoyeur de reprise RD20 sous silos, vers l'évacuation.", status: "Actif", lotId: "lot-2", trajet: "Silos RD11-RD13 → RD20 → RD30" },
  { code: "RD30", label: "RD30", family: "Reprise", zone: "Poste 1", type: "Convoyeur de reprise", circuitId: "reprise-rd", description: "Convoyeur de reprise RD30 assurant la continuité vers RD40.", status: "Actif", lotId: "lot-2", trajet: "RD20 → RD30 → RD40" },
  { code: "RD40", label: "RD40", family: "Reprise", zone: "Poste 0", type: "Chariot répartiteur", circuitId: "reprise-rd", description: "Chariot répartiteur RD40 orientant le flux vers l'évacuation générale.", status: "En attente", lotId: "lot-2", trajet: "RD30 / A2A4RD → RD40 → RD50" },
  { code: "RD50", label: "RD50", family: "Reprise", zone: "Poste 0", type: "Convoyeur d'évacuation", circuitId: "reprise-rd", description: "Convoyeur d'évacuation RD50 vers la zone de chargement.", status: "Actif", lotId: "lot-2", trajet: "RD40 → RD50 → Zone de chargement (CD/Portique D)" },

  // Convoyage SA/SB - prolongement vers le Lot 3
  { code: "SB50", label: "SB50", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur à bande", circuitId: "convoyage-sasb", description: "Convoyeur SB50 prolongeant SB40 vers la zone du Lot 3.", status: "Actif", trajet: "SB40 → SB50 → SB64" },
  { code: "SA54", label: "SA54", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur à bande", circuitId: "convoyage-sasb", description: "Convoyeur SA54 prolongeant SA44 vers la zone du Lot 3.", status: "Actif", trajet: "SA44 → SA54 → SA64" },
  { code: "SB64", label: "SB64", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur à bande", circuitId: "convoyage-sasb", description: "Convoyeur SB64 alimentant la zone de reprise du Lot 3.", status: "Actif", trajet: "SB50 → SB64 → SB74" },
  { code: "SA64", label: "SA64", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur à bande", circuitId: "convoyage-sasb", description: "Convoyeur SA64 alimentant la zone de reprise du Lot 3.", status: "Actif", trajet: "SA54 → SA64 → SA74" },
  { code: "SB74", label: "SB74", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur à bande", circuitId: "convoyage-sasb", description: "Convoyeur SB74 alimentant la zone de reprise du Lot 3.", status: "Actif", trajet: "SB64 → SB74 → SB84" },
  { code: "SA74", label: "SA74", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur à bande", circuitId: "convoyage-sasb", description: "Convoyeur SA74 alimentant la zone de reprise du Lot 3.", status: "Actif", trajet: "SA64 → SA74 → SA84" },
  { code: "SB84", label: "SB84", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de silo", circuitId: "convoyage-sasb", description: "Convoyeur SB84 déversant dans la zone de reprise du Lot 3.", status: "Actif", trajet: "SB74 → SB84 → Lot 3" },
  { code: "SA84", label: "SA84", family: "Convoyeur", zone: "Poste 1", type: "Convoyeur de silo", circuitId: "convoyage-sasb", description: "Convoyeur SA84 déversant dans la zone de reprise du Lot 3.", status: "Actif", trajet: "SA74 → SA84 → Lot 3" },

  // Reprise Lot 3 (cellules n°13 à n°21, zone globale sans axe, une seule reprise de chargement partagée)
  { code: "RC114", label: "RC114", family: "Reprise", zone: "Lot 3", type: "Silo de stockage", circuitId: "reprise-lot3", description: "Cellule de stockage n°13, Lot 3 — alimente la Peseuse C.", status: "Actif", lotId: "lot-3", qualite: "Non renseignée", trajet: "SA84 / SB84 → RC114 → Peseuse C" },
  { code: "RD114", label: "RD114", family: "Reprise", zone: "Lot 3", type: "Silo de stockage", circuitId: "reprise-lot3", description: "Cellule de stockage n°14, Lot 3 — alimente la Peseuse D.", status: "Actif", lotId: "lot-3", qualite: "Non renseignée", trajet: "SA84 / SB84 → RD114 → Peseuse D" },
  { code: "RC124", label: "RC124", family: "Reprise", zone: "Lot 3", type: "Silo de stockage", circuitId: "reprise-lot3", description: "Cellule de stockage n°15, Lot 3.", status: "Actif", lotId: "lot-3", qualite: "Non renseignée", trajet: "SA84 / SB84 → RC124" },
  { code: "RD124", label: "RD124", family: "Reprise", zone: "Lot 3", type: "Silo de stockage", circuitId: "reprise-lot3", description: "Cellule de stockage n°16, Lot 3 — alimente la Peseuse D.", status: "Actif", lotId: "lot-3", qualite: "Non renseignée", trajet: "SA84 / SB84 → RD124 → Peseuse D" },
  { code: "RC134", label: "RC134", family: "Reprise", zone: "Lot 3", type: "Silo de stockage", circuitId: "reprise-lot3", description: "Cellule de stockage n°17, Lot 3 — alimente la Peseuse C.", status: "Actif", lotId: "lot-3", qualite: "Non renseignée", trajet: "SA84 / SB84 → RC134 → Peseuse C" },
  { code: "RA114", label: "RA114", family: "Reprise", zone: "Lot 3", type: "Silo de stockage", circuitId: "reprise-lot3", description: "Cellule de stockage n°18, Lot 3 — alimente la Peseuse A.", status: "Actif", lotId: "lot-3", qualite: "Non renseignée", trajet: "SA84 / SB84 → RA114 → Peseuse A" },
  { code: "RB114", label: "RB114", family: "Reprise", zone: "Lot 3", type: "Silo de stockage", circuitId: "reprise-lot3", description: "Cellule de stockage n°19, Lot 3 — alimente la Peseuse B.", status: "Actif", lotId: "lot-3", qualite: "Non renseignée", trajet: "SA84 / SB84 → RB114 → Peseuse B" },
  { code: "RA124", label: "RA124", family: "Reprise", zone: "Lot 3", type: "Silo de stockage", circuitId: "reprise-lot3", description: "Cellule de stockage n°20, Lot 3 — alimente la Peseuse A.", status: "Actif", lotId: "lot-3", qualite: "Non renseignée", trajet: "SA84 / SB84 → RA124 → Peseuse A" },
  { code: "RB124", label: "RB124", family: "Reprise", zone: "Lot 3", type: "Silo de stockage", circuitId: "reprise-lot3", description: "Cellule de stockage n°21, Lot 3 — alimente la Peseuse B.", status: "Actif", lotId: "lot-3", qualite: "Non renseignée", trajet: "SA84 / SB84 → RB124 → Peseuse B" },

  // Convoyeurs de reprise du Lot 3 (continuité vers l'évacuation, mêmes familles RA/RB/RC/RD)
  { code: "RD214", label: "RD214", family: "Reprise", zone: "Lot 3", type: "Convoyeur de reprise", circuitId: "reprise-lot3", description: "Convoyeur de reprise RD214 du Lot 3.", status: "Actif", lotId: "lot-3", trajet: "RD114 / RD124 → RD214 → RD314" },
  { code: "RC214", label: "RC214", family: "Reprise", zone: "Lot 3", type: "Convoyeur de reprise", circuitId: "reprise-lot3", description: "Convoyeur de reprise RC214 du Lot 3.", status: "Actif", lotId: "lot-3", trajet: "RC114 / RC124 / RC134 → RC214 → RC314" },
  { code: "RB214", label: "RB214", family: "Reprise", zone: "Lot 3", type: "Convoyeur de reprise", circuitId: "reprise-lot3", description: "Convoyeur de reprise RB214 du Lot 3.", status: "Actif", lotId: "lot-3", trajet: "RB114 / RB124 → RB214 → RB314" },
  { code: "RA214", label: "RA214", family: "Reprise", zone: "Lot 3", type: "Convoyeur de reprise", circuitId: "reprise-lot3", description: "Convoyeur de reprise RA214 du Lot 3.", status: "Actif", lotId: "lot-3", trajet: "RA114 / RA124 → RA214 → RA314" },
  { code: "RD314", label: "RD314", family: "Reprise", zone: "Lot 3", type: "Convoyeur d'évacuation", circuitId: "reprise-lot3", description: "Convoyeur d'évacuation RD314 du Lot 3 vers la Peseuse D.", status: "Actif", lotId: "lot-3", trajet: "RD214 → RD314 → Peseuse D" },
  { code: "RC314", label: "RC314", family: "Reprise", zone: "Lot 3", type: "Convoyeur d'évacuation", circuitId: "reprise-lot3", description: "Convoyeur d'évacuation RC314 du Lot 3 vers la Peseuse C.", status: "Actif", lotId: "lot-3", trajet: "RC214 → RC314 → Peseuse C" },
  { code: "RB314", label: "RB314", family: "Reprise", zone: "Lot 3", type: "Convoyeur d'évacuation", circuitId: "reprise-lot3", description: "Convoyeur d'évacuation RB314 du Lot 3 vers la Peseuse B.", status: "Actif", lotId: "lot-3", trajet: "RB214 → RB314 → Peseuse B" },
  { code: "RA314", label: "RA314", family: "Reprise", zone: "Lot 3", type: "Convoyeur d'évacuation", circuitId: "reprise-lot3", description: "Convoyeur d'évacuation RA314 du Lot 3 vers la Peseuse A.", status: "Actif", lotId: "lot-3", trajet: "RA214 → RA314 → Peseuse A" },

  // Lignes de retour instrumentées vers les chariots répartiteurs
  { code: "A2A4RA", label: "A2A4RA", family: "Reprise", zone: "Poste 0", type: "Ligne de retour instrumentée", circuitId: "reprise-ra", description: "Ligne de retour A2A4RA reliant la reprise RA au chariot répartiteur RA40.", status: "Actif", lotId: "lot-1", trajet: "Zone de reprise RA → A2A4RA → RA40" },
  { code: "A2A4RB", label: "A2A4RB", family: "Reprise", zone: "Poste 0", type: "Ligne de retour instrumentée", circuitId: "reprise-rb", description: "Ligne de retour A2A4RB reliant la reprise RB au chariot répartiteur RB40.", status: "Actif", lotId: "lot-1", trajet: "Zone de reprise RB → A2A4RB → RB40" },
  { code: "A2A4RC", label: "A2A4RC", family: "Reprise", zone: "Poste 0", type: "Ligne de retour instrumentée", circuitId: "reprise-rc", description: "Ligne de retour A2A4RC reliant la reprise RC au chariot répartiteur RC40.", status: "Actif", lotId: "lot-2", trajet: "Zone de reprise RC → A2A4RC → RC40" },
  { code: "A2A4RD", label: "A2A4RD", family: "Reprise", zone: "Poste 0", type: "Ligne de retour instrumentée", circuitId: "reprise-rd", description: "Ligne de retour A2A4RD reliant la reprise RD au chariot répartiteur RD40.", status: "Actif", lotId: "lot-2", trajet: "Zone de reprise RD → A2A4RD → RD40" },

  // Chargement Portique A
  { code: "CA10", label: "CA10", family: "Chargement", zone: "Poste 0", type: "Convoyeur de chargement", circuitId: "portique-a", description: "Convoyeur de chargement CA10 alimentant le portique A depuis les silos de stockage.", status: "Actif", trajet: "RA50 → CA10 → PA10 / Portique A" },
  { code: "CA20", label: "CA20", family: "Chargement", zone: "Poste 0", type: "Convoyeur de chargement", circuitId: "portique-a", description: "Convoyeur de chargement CA20, ligne complémentaire vers le portique A.", status: "Actif", trajet: "RA50 → CA20 → Portique A (ligne complémentaire)" },
  { code: "PA10", label: "PA10", family: "Chargement", zone: "Poste 0", type: "Descente silo-portique", circuitId: "portique-a", description: "Descente PA10 alimentant directement le portique A depuis le silo dédié.", status: "Non renseigné", trajet: "Silo dédié → PA10 → Portique A" },
  { code: "PORT-A", label: "Portique A", family: "Portique", zone: "Portiques", type: "Portique de chargement navire", circuitId: "portique-a", description: "Portique de chargement A assurant le transfert final du minerai vers la cale du navire.", status: "Actif", trajet: "CA10 / CA20 / PA10 → Portique A → Cale du navire" },

  // Chargement Portique B
  { code: "CB10", label: "CB10", family: "Chargement", zone: "Poste 0", type: "Convoyeur de chargement", circuitId: "portique-b", description: "Convoyeur de chargement CB10 alimentant le portique B depuis les silos de stockage.", status: "Actif", trajet: "RB50 → CB10 → PB10 / Portique B" },
  { code: "CB20", label: "CB20", family: "Chargement", zone: "Poste 0", type: "Convoyeur de chargement", circuitId: "portique-b", description: "Convoyeur de chargement CB20, ligne complémentaire vers le portique B.", status: "Actif", trajet: "RB50 → CB20 → Portique B (ligne complémentaire)" },
  { code: "PB10", label: "PB10", family: "Chargement", zone: "Poste 0", type: "Descente silo-portique", circuitId: "portique-b", description: "Descente PB10 alimentant directement le portique B depuis le silo dédié.", status: "Non renseigné", trajet: "Silo dédié → PB10 → Portique B" },
  { code: "PORT-B", label: "Portique B", family: "Portique", zone: "Portiques", type: "Portique de chargement navire", circuitId: "portique-b", description: "Portique de chargement B assurant le transfert final du minerai vers la cale du navire.", status: "Actif", trajet: "CB10 / CB20 / PB10 → Portique B → Cale du navire" },

  // Chargement Portique C
  { code: "CC10", label: "CC10", family: "Chargement", zone: "Poste 0", type: "Convoyeur de chargement", circuitId: "portique-c", description: "Convoyeur de chargement CC10 alimentant le portique C depuis les silos de stockage.", status: "Actif", trajet: "RC50 → CC10 → PC10 / Portique C" },
  { code: "CC20", label: "CC20", family: "Chargement", zone: "Poste 0", type: "Convoyeur de chargement", circuitId: "portique-c", description: "Convoyeur de chargement CC20, ligne complémentaire vers le portique C.", status: "En attente", trajet: "RC50 → CC20 → Portique C (ligne complémentaire)" },
  { code: "PC10", label: "PC10", family: "Chargement", zone: "Poste 0", type: "Descente silo-portique", circuitId: "portique-c", description: "Descente PC10 alimentant directement le portique C depuis le silo dédié.", status: "Non renseigné", trajet: "Silo dédié → PC10 → Portique C" },
  { code: "PORT-C", label: "Portique C", family: "Portique", zone: "Portiques", type: "Portique de chargement navire", circuitId: "portique-c", description: "Portique de chargement C assurant le transfert final du minerai vers la cale du navire.", status: "Actif", trajet: "CC10 / CC20 / PC10 → Portique C → Cale du navire" },

  // Chargement Portique D
  { code: "CD10", label: "CD10", family: "Chargement", zone: "Poste 0", type: "Convoyeur de chargement", circuitId: "portique-d", description: "Convoyeur de chargement CD10 alimentant le portique D depuis les silos de stockage.", status: "Actif", trajet: "RD50 → CD10 → PD10 / Portique D" },
  { code: "CD20", label: "CD20", family: "Chargement", zone: "Poste 0", type: "Convoyeur de chargement", circuitId: "portique-d", description: "Convoyeur de chargement CD20, ligne complémentaire vers le portique D.", status: "Actif", trajet: "RD50 → CD20 → Portique D (ligne complémentaire)" },
  { code: "PD10", label: "PD10", family: "Chargement", zone: "Poste 0", type: "Descente silo-portique", circuitId: "portique-d", description: "Descente PD10 alimentant directement le portique D depuis le silo dédié.", status: "Non renseigné", trajet: "Silo dédié → PD10 → Portique D" },
  { code: "PORT-D", label: "Portique D", family: "Portique", zone: "Portiques", type: "Portique de chargement navire", circuitId: "portique-d", description: "Portique de chargement D assurant le transfert final du minerai vers la cale du navire.", status: "Actif", trajet: "CD10 / CD20 / PD10 → Portique D → Cale du navire" },

  // Chargement navire
  { code: "V10", label: "V10", family: "Chargement", zone: "Poste 3", type: "Colonne de chargement navire", circuitId: "chargement-navire", description: "Colonne verticale V10 amorçant la descente finale vers le poste de chargement navire.", status: "Actif", trajet: "T10 / DB210 → V10 → C8" },
  { code: "C8", label: "C8", family: "Chargement", zone: "Poste 3", type: "Convoyeur de liaison", circuitId: "chargement-navire", description: "Convoyeur C8 assurant la liaison entre les colonnes V10 et V20.", status: "Actif", trajet: "V10 → C8 → V20" },
  { code: "V20", label: "V20", family: "Chargement", zone: "Poste 3", type: "Colonne de chargement navire", circuitId: "chargement-navire", description: "Colonne verticale V20 assurant le déversement final dans les cales du navire.", status: "Actif", trajet: "C8 → V20 → Cale du navire" },

  // Poste 66
  { code: "T10", label: "T10", family: "Chargement", zone: "Poste 3", type: "Trémie de reprise", circuitId: "poste-66", description: "Groupe de 10 trémies identiques assurant la reprise et le dosage avant transfert soit vers le poste de chargement 66 (V10), soit en retour vers DB30.", status: "En attente", trajet: "DB210 → T10 → V10 (poste de chargement 66) / DB30" },
  { code: "CA30", label: "CA30", family: "Chargement", zone: "Portiques", type: "Point de jonction rail", circuitId: "portique-a", description: "Point de jonction CA30 sur le rail du portique A.", status: "Actif", trajet: "CA10 → CA30 → V10" },
  { code: "CB30", label: "CB30", family: "Chargement", zone: "Portiques", type: "Point de jonction rail", circuitId: "portique-b", description: "Point de jonction CB30 sur le rail du portique B.", status: "Actif", trajet: "CB10 → CB30 → CB210 / V10" },
  { code: "CC30", label: "CC30", family: "Chargement", zone: "Portiques", type: "Point de jonction rail", circuitId: "portique-c", description: "Point de jonction CC30 sur le rail du portique C.", status: "Actif", trajet: "CC10 → CC30 → CC210 / V10" },
  { code: "CD30", label: "CD30", family: "Chargement", zone: "Portiques", type: "Point de jonction rail", circuitId: "portique-d", description: "Point de jonction CD30 sur le rail du portique D.", status: "Actif", trajet: "CD10 → CD30 → CD210 / V10" },
  { code: "CB210", label: "CB210", family: "Chargement", zone: "Portiques", type: "Dérivation rail", circuitId: "portique-b", description: "Dérivation CB210 du rail portique B.", status: "Non renseigné", trajet: "CB30 → CB210" },
  { code: "CC210", label: "CC210", family: "Chargement", zone: "Portiques", type: "Dérivation rail", circuitId: "portique-c", description: "Dérivation CC210 du rail portique C.", status: "Non renseigné", trajet: "CC30 → CC210" },
  { code: "CD210", label: "CD210", family: "Chargement", zone: "Portiques", type: "Dérivation rail", circuitId: "portique-d", description: "Dérivation CD210 du rail portique D.", status: "Non renseigné", trajet: "CD30 → CD210" }
];

export const RELATIONS: CircuitRelation[] = [
  { from: "dechargement-da", to: "convoyage-sasb" },
  { from: "dechargement-db", to: "convoyage-sasb" },
  { from: "convoyage-sasb", to: "reprise-ra" },
  { from: "convoyage-sasb", to: "reprise-rb" },
  { from: "convoyage-sasb", to: "reprise-rc" },
  { from: "convoyage-sasb", to: "reprise-rd" },
  { from: "convoyage-sasb", to: "reprise-lot3" },
  { from: "reprise-ra", to: "portique-a" },
  { from: "reprise-rb", to: "portique-b" },
  { from: "reprise-rc", to: "portique-c" },
  { from: "reprise-rd", to: "portique-d" },
  { from: "reprise-lot3", to: "portique-a" },
  { from: "reprise-lot3", to: "portique-b" },
  { from: "reprise-lot3", to: "portique-c" },
  { from: "reprise-lot3", to: "portique-d" },
  { from: "dechargement-db", to: "poste-66" },
  { from: "poste-66", to: "chargement-navire" }
];

export const ZONES: string[] = ["Poste 0", "Poste 1", "Poste 3", "Portiques", "Lot 3"];

// =====================================================================================
// Disposition du synoptique : position/forme/connexions par code d'équipement.
// La scène (SCENE_WIDTH × SCENE_HEIGHT) correspond exactement aux dimensions du document
// officiel "SCHEMA DE MANUTENTION OIK/PP" affiché en fond dans SynopticScene — chaque
// coordonnée ci-dessous a été relevée directement sur ce document pour que la couche
// interactive (clic, survol, couleur en direct) tombe exactement sur le bon équipement.
// =====================================================================================
export const SCENE_WIDTH = 1600;
export const SCENE_HEIGHT = 1200;

const LAYOUT: Record<string, EquipmentLayout> = {};

function line(code: string, path: { x: number; y: number }[], connections: string[] = []) {
  LAYOUT[code] = { shape: "line", path, connections };
}
function rect(code: string, x: number, y: number, w: number, h: number, connections: string[] = []) {
  LAYOUT[code] = { shape: "rect", position: { x, y }, w, h, connections };
}
function circle(code: string, x: number, y: number, r: number, connections: string[] = []) {
  LAYOUT[code] = { shape: "circle", position: { x, y }, r, connections };
}

// --- Rail CA10-CD10 + boîtier de pesage (haut-gauche) — coordonnées relevées sur le document réel ---
const RAIL_COLS: { prefix: "CA" | "CB" | "CC" | "CD"; x: number; lineY: number; boxY: number }[] = [
  { prefix: "CA", x: 140, lineY: 70, boxY: 280 },
  { prefix: "CB", x: 175, lineY: 90, boxY: 280 },
  { prefix: "CC", x: 210, lineY: 112, boxY: 295 },
  { prefix: "CD", x: 245, lineY: 135, boxY: 295 }
];
RAIL_COLS.forEach(({ prefix, x, lineY, boxY }) => {
  line(`${prefix}10`, [{ x, y: lineY }, { x, y: boxY }], [`PORT-${prefix[1]}`, `P${prefix[1]}10`]);
  circle(`PORT-${prefix[1]}`, x, lineY - 20, 10, [`${prefix}10`]);
  line(`P${prefix[1]}10`, [{ x, y: boxY }, { x: x + 15, y: boxY + 30 }], [`${prefix}10`, `${prefix}30`]);
});
line("DA510", [{ x: 110, y: 395 }, { x: 110, y: 455 }], []);
line("DA520", [{ x: 145, y: 395 }, { x: 145, y: 455 }], []);
line("DB510", [{ x: 180, y: 395 }, { x: 180, y: 455 }], []);
line("DB520", [{ x: 215, y: 395 }, { x: 215, y: 455 }], []);
line("SB10", [{ x: 60, y: 390 }, { x: 60, y: 460 }], ["DB40"]);
line("SA10", [{ x: 350, y: 390 }, { x: 350, y: 460 }], ["DA40", "SA20"]);
line("SB20", [{ x: 350, y: 375 }, { x: 350, y: 240 }, { x: 920, y: 240 }, { x: 920, y: 326 }], ["SB300"]);
line("SA20", [{ x: 350, y: 400 }, { x: 350, y: 340 }, { x: 620, y: 340 }], ["SA10", "SA200"]);

// --- Rail complémentaire CA20-CD20 (ligne haute) + jonctions CA30-CD30 / dérivations 210 ---
const RAIL2_COLS: { prefix: "CA" | "CB" | "CC" | "CD"; y: number; jx: number }[] = [
  { prefix: "CA", y: 70, jx: 730 },
  { prefix: "CB", y: 90, jx: 955 },
  { prefix: "CC", y: 112, jx: 1100 },
  { prefix: "CD", y: 135, jx: 1310 }
];
RAIL2_COLS.forEach(({ prefix, y, jx }) => {
  line(`${prefix}20`, [{ x: 550, y }, { x: 1475, y }], [`${prefix}10`, `${prefix}30`]);
  circle(`${prefix}30`, jx, y, 7, [`${prefix}20`]);
});
line("CB210", [{ x: 955, y: 90 }, { x: 955, y: 145 }, { x: 1020, y: 145 }, { x: 1020, y: 190 }], ["CB30"]);
line("CC210", [{ x: 1100, y: 112 }, { x: 1100, y: 145 }, { x: 1170, y: 145 }, { x: 1170, y: 190 }], ["CC30"]);
line("CD210", [{ x: 1310, y: 135 }, { x: 1310, y: 160 }, { x: 1360, y: 160 }, { x: 1360, y: 190 }], ["CD30"]);
line("V10", [{ x: 1475, y: 70 }, { x: 1475, y: 1010 }], ["T10", "C8"]);

// --- Aiguillages Lot 1 / Lot 2 — position et étendue des 12 cases jaunes mesurées par analyse de
// pixels directement sur public/synoptique/schema-manutention-officiel.png (scan colonne par
// colonne, conversion du repère image 1448×1086 vers la scène 1600×1200 : facteur ×1.105). ---
const AIG_Y = 350;
circle("SA200", 560, AIG_Y, 14, ["SA20", "SA210", "SA220", "SA30"]);
circle("SB300", 940, AIG_Y, 14, ["SA30", "SB20", "SB310", "SB320", "SA44", "SB40"]);
line("SA30", [{ x: 574, y: AIG_Y }, { x: 926, y: AIG_Y }], ["SA200", "SB300"]);
line("SA210", [{ x: 560, y: AIG_Y + 14 }, { x: 515, y: AIG_Y + 14 }, { x: 515, y: 475 }], ["SA200"]);
line("SA220", [{ x: 560, y: AIG_Y + 14 }, { x: 685, y: AIG_Y + 14 }, { x: 685, y: 475 }], ["SA200"]);
line("SB310", [{ x: 940, y: AIG_Y + 14 }, { x: 856, y: AIG_Y + 14 }, { x: 856, y: 475 }], ["SB300"]);
line("SB320", [{ x: 940, y: AIG_Y + 14 }, { x: 1026, y: AIG_Y + 14 }, { x: 1026, y: 475 }], ["SB300"]);

// --- Cellules Lot 1 (RA / RB) + Lot 2 (RC / RD) : silos étroits en rangée, x/y/largeur mesurés par
// scan de pixels (bornes des 12 blocs jaunes) sur le document officiel, puis convertis dans la scène. ---
const REPRISE_GROUPS: {
  prefix: "RA" | "RB" | "RC" | "RD";
  feedPrefix: string;
  boxX: [number, number, number];
  boxW: number;
  spineX: number;
  dropX: number;
  evacY: number;
  turnX: number;
  railY: number;
}[] = [
  // Les 12 cases (SA211..SB323) forment une bande continue sur le document officiel : aucun grand
  // espace entre les groupes RA/RB/RC/RD, seulement le même fin liseré noir qu'entre deux cases
  // voisines. Pitch mesuré ≈56-58px, largeur 56px.
  { prefix: "RA", feedPrefix: "SA21", boxX: [431, 487, 544], boxW: 56, spineX: 515, dropX: 535, evacY: 1045, turnX: 90, railY: 300 },
  { prefix: "RB", feedPrefix: "SA22", boxX: [600, 657, 714], boxW: 56, spineX: 685, dropX: 580, evacY: 1005, turnX: 115, railY: 320 },
  { prefix: "RC", feedPrefix: "SB31", boxX: [771, 828, 884], boxW: 56, spineX: 856, dropX: 815, evacY: 865, turnX: 245, railY: 670 },
  { prefix: "RD", feedPrefix: "SB32", boxX: [942, 998, 1054], boxW: 56, spineX: 1026, dropX: 955, evacY: 830, turnX: 300, railY: 700 }
];
const CELL_Y = 475;
const CELL_H = 153;
REPRISE_GROUPS.forEach(({ prefix, feedPrefix, boxX, boxW, spineX, dropX, evacY, turnX, railY }) => {
  // Le code IMPRIMÉ sur la case jaune elle-même, sur le document officiel, est celui du convoyeur
  // (SA211, SB312, ...) — c'est donc lui qui reçoit le grand rectangle cliquable, pas la reprise
  // (RA11, RC12, ...) dont le libellé, plus petit, est imprimé séparément sous la case, près des
  // flèches d'évacuation. Avant cette correction, cliquer sur la case affichant "SB312" sélectionnait
  // en réalité "RC12", puisque c'est ce code qui occupait le grand rectangle.
  boxX.forEach((x, i) => {
    rect(`${feedPrefix}${i + 1}`, x, CELL_Y, boxW, CELL_H, [`${prefix}1${i + 1}`, `${prefix}20`]);
  });
  const rowBottom = CELL_Y + CELL_H;
  // Repère de la reprise : sous la case, la ligne traverse DA10/DB10 (y≈738, mesuré) avant de
  // rejoindre la rangée verte RA20/RB20/RC20/RD20 (y≈802, mesurée) — écart mesuré sur le document.
  const repriseRowY = 802;
  boxX.forEach((x, i) => {
    const cx = x + boxW / 2;
    line(`${prefix}1${i + 1}`, [{ x: cx, y: rowBottom + 2 }, { x: cx, y: repriseRowY }], [`${feedPrefix}${i + 1}`, `${prefix}20`]);
  });
  line(`${prefix}20`, [{ x: boxX[0], y: repriseRowY }, { x: boxX[2] + boxW, y: repriseRowY }], [`${prefix}11`, `${prefix}12`, `${prefix}13`, `${prefix}30`]);
  line(`${prefix}30`, [{ x: dropX, y: repriseRowY }, { x: dropX, y: evacY }], [`${prefix}20`, `${prefix}40`]);
  line(`${prefix}40`, [{ x: dropX, y: evacY }, { x: turnX, y: evacY }], [`${prefix}30`, `A2A4${prefix}`, `${prefix}50`]);
  line(`A2A4${prefix}`, [{ x: dropX + 30, y: evacY - 15 }, { x: dropX, y: evacY - 15 }], [`${prefix}40`]);
  line(`${prefix}50`, [{ x: turnX, y: evacY }, { x: turnX, y: railY }], [`${prefix}40`]);
});

// --- Prolongement SA/SB vers le Lot 3, à droite des aiguillages : deux colonnes orthogonales
// (SA à gauche, SB à droite) descendant droit au-dessus du peigne de cellules du Lot 3, terminées
// par le portique "P-3" (deux arcs de vanne SA84/SB84, dessinés comme glyphes de vanne dans SynopticScene). ---
const GATE_XA = 1255;
const GATE_XB = 1320;
line("SA44", [{ x: 954, y: AIG_Y - 5 }, { x: GATE_XA, y: AIG_Y - 5 }, { x: GATE_XA, y: 460 }], ["SB300", "SA54"]);
line("SB40", [{ x: 954, y: AIG_Y + 15 }, { x: GATE_XB, y: AIG_Y + 15 }, { x: GATE_XB, y: 460 }], ["SB300", "SB84"]);

line("SA54", [{ x: GATE_XA, y: 460 }, { x: GATE_XA, y: 485 }], ["SA44", "SA64"]);
line("SA64", [{ x: GATE_XA, y: 485 }, { x: GATE_XA - 10, y: 485 }, { x: GATE_XA - 10, y: 510 }], ["SA54", "SA74"]);
line("SA74", [{ x: GATE_XA - 10, y: 510 }, { x: GATE_XA - 10, y: 535 }], ["SA64", "SA84"]);
line("SA84", [{ x: GATE_XA - 10, y: 535 }, { x: GATE_XA, y: 535 }, { x: GATE_XA, y: 555 }], ["SA74"]);
line("SB50", [{ x: GATE_XB, y: 460 }, { x: GATE_XB, y: 485 }], ["SB40", "SB64"]);
line("SB64", [{ x: GATE_XB, y: 485 }, { x: GATE_XB + 10, y: 485 }, { x: GATE_XB + 10, y: 510 }], ["SB50", "SB74"]);
line("SB74", [{ x: GATE_XB + 10, y: 510 }, { x: GATE_XB + 10, y: 535 }], ["SB64", "SB84"]);
line("SB84", [{ x: GATE_XB + 10, y: 535 }, { x: GATE_XB, y: 535 }, { x: GATE_XB, y: 555 }], ["SB74"]);

// --- Lot 3 : 9 cellules n°13 à n°21 (sans axe), colonnes étroites x≈1245-1596, y≈600-900 ---
const LOT3_X0 = 1245;
const LOT3_PITCH = 39;
const LOT3_ROWS: { code: string }[] = [
  { code: "RC114" }, { code: "RD114" }, { code: "RC124" }, { code: "RD124" }, { code: "RC134" },
  { code: "RA114" }, { code: "RB114" }, { code: "RA124" }, { code: "RB124" }
];
LOT3_ROWS.forEach(({ code }, i) => rect(code, LOT3_X0 + i * LOT3_PITCH, 600, 28, 300, ["SA84", "SB84"]));

const LOT3_CONVOYEUR_ROWS: { code: string; y: number }[] = [
  { code: "RC214", y: 650 },
  { code: "RD214", y: 690 },
  { code: "RC314", y: 730 },
  { code: "RD314", y: 770 },
  { code: "RA214", y: 810 },
  { code: "RB214", y: 850 },
  { code: "RA314", y: 890 },
  { code: "RB314", y: 920 }
];
LOT3_CONVOYEUR_ROWS.forEach(({ code, y }) => line(code, [{ x: 970, y }, { x: LOT3_X0, y }]));

// --- Déchargement DA / DB : longues lignes rouges — coordonnées mesurées par scan de pixels (canal
// rouge) sur le document officiel, puis converties dans la scène (×1.105). ---
line("DA10", [{ x: 376, y: 738 }, { x: 1032, y: 738 }], ["DA20"]);
line("DA20", [{ x: 377, y: 738 }, { x: 377, y: 1055 }], ["DA10", "DA30"]);
line("DA30", [{ x: 377, y: 1054 }, { x: 179, y: 1054 }], ["DA20", "DA40"]);
line("DA40", [{ x: 181, y: 1054 }, { x: 181, y: 464 }], ["DA30", "DA510", "DA520", "SA10"]);

line("DB10", [{ x: 1061, y: 738 }, { x: 1480, y: 738 }], ["DB20"]);
line("DB20", [{ x: 1479, y: 738 }, { x: 1479, y: 1058 }], ["DB10", "DB210", "DB30"]);
line("DB30", [{ x: 1479, y: 1058 }, { x: 219, y: 1058 }], ["DB20", "DB40"]);
line("DB40", [{ x: 222, y: 1058 }, { x: 222, y: 403 }], ["DB30", "DB510", "DB520", "SB10"]);
rect("DB210", 1490, 1000, 65, 45, ["DB20", "T10", "DB30"]);
rect("T10", 1050, 965, 160, 70, ["DB210", "V10", "DB30"]);

// --- Chargement navire (C8/V20), poste 3, bas de page ---
line("C8", [{ x: 1200, y: 1010 }, { x: 1475, y: 1010 }], ["V10", "V20"]);
line("V20", [{ x: 950, y: 1010 }, { x: 1200, y: 1010 }], ["C8"]);

export function getEquipmentLayout(code: string): EquipmentLayout | undefined {
  return LAYOUT[code];
}

/** Postes P0 à P4 du bordereau papier — décoratifs (pas des équipements interactifs). */
export const POST_LABELS: { text: string; x: number; y: number }[] = [
  { text: "P0", x: 65, y: 640 },
  { text: "P1", x: 845, y: 945 },
  { text: "P2", x: 1055, y: 820 },
  { text: "P3", x: 1460, y: 500 },
  { text: "P4", x: 785, y: 260 }
];

export const PESEUSE_POSITIONS: Record<string, { x: number; y: number }> = {
  "peseuse-a": { x: 140, y: 55 },
  "peseuse-b": { x: 175, y: 55 },
  "peseuse-c": { x: 210, y: 70 },
  "peseuse-d": { x: 245, y: 70 }
};

export function getCircuitById(id: string): Circuit | undefined {
  return CIRCUITS.find((circuit) => circuit.id === id);
}

export function getEquipmentsByCircuit(circuitId: string): Equipment[] {
  if (circuitId === "vue-globale") return EQUIPMENTS;
  return EQUIPMENTS.filter((equipment) => equipment.circuitId === circuitId);
}

/** Trajet réel d'un équipement cliqué : lui-même + ses voisins directs, calculé depuis les
 * `connections` du LAYOUT (adjacence physique réelle, relevée équipement par équipement) — pas
 * depuis `circuitId`, qui regroupe par grande famille (ex. tout "convoyage-sasb" partage un seul
 * id, du Lot 1 au Lot 3) et surlignerait des tronçons sans rapport avec l'équipement cliqué. Les
 * `connections` ne sont pas toujours renseignées dans les deux sens, donc on cherche aussi les
 * équipements qui listent `code` parmi les leurs. */
export function getTrajetHighlight(code: string): Set<string> {
  const result = new Set<string>([code]);
  const layout = getEquipmentLayout(code);
  if (layout) for (const neighbour of layout.connections) result.add(neighbour);
  for (const equipment of EQUIPMENTS) {
    const neighbourLayout = getEquipmentLayout(equipment.code);
    if (neighbourLayout?.connections.includes(code)) result.add(equipment.code);
  }
  return result;
}

/** Reprise (code) → peseuse + groupe ("axis" ou "lot3") auquel elle appartient, pour permettre de
 * sélectionner une reprise directement en cliquant dessus sur le schéma (même sélection que
 * l'onglet Peseuses, une seule reprise active par groupe). */
export function findRepriseOwner(code: string): { peseuseId: string; group: "axis" | "lot3" } | undefined {
  for (const peseuse of PESEUSES) {
    if (peseuse.axisReprises.includes(code)) return { peseuseId: peseuse.id, group: "axis" };
    if (peseuse.lot3Reprises.includes(code)) return { peseuseId: peseuse.id, group: "lot3" };
  }
  return undefined;
}

export function getLotById(id: string): Lot | undefined {
  return LOTS.find((lot) => lot.id === id);
}

export function getEquipmentsByLot(lotId: string): Equipment[] {
  return EQUIPMENTS.filter((equipment) => equipment.lotId === lotId);
}

export function getAxesByLot(lotId: string): Axe[] {
  return AXES.filter((axe) => axe.lotId === lotId);
}

export function getAxeById(id: string): Axe | undefined {
  return AXES.find((axe) => axe.id === id);
}

export function getCellulesByAxe(axeId: string): Equipment[] {
  return EQUIPMENTS.filter((equipment) => equipment.axeId === axeId);
}

export function getPeseuseById(id: string): Peseuse | undefined {
  return PESEUSES.find((peseuse) => peseuse.id === id);
}

export function searchEquipments(query: string): Equipment[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return EQUIPMENTS.filter(
    (equipment) => equipment.code.toLowerCase().includes(normalized) || equipment.label.toLowerCase().includes(normalized)
  ).slice(0, 8);
}
