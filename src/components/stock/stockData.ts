// Modèle de données du module "Gestion de stock" / "Historique de stock".
// Digitalise le bordereau journalier "ETAT DES STOCKS" du port de Casablanca : une ligne par
// cellule (Lot 1 + Lot 2, 12 cellules) + 2 zones globales du Lot 3 (SA, SB).

import { CELLULES } from "../train/trainData";

export type { PhosphateQuality } from "../train/trainData";
export { PHOSPHATE_QUALITIES } from "../train/trainData";

export interface CelluleStock {
  celluleId: string; // réutilise les id de trainData.CELLULES (SA211, SA212, ...)
  qualite: string;
  tonnageVif: number; // valeur affichée = tonnageVifAuto + ecartManuel
  tonnageVifAuto?: number; // valeur calculée (stock précédent + entrées trains − sorties navires), avant correction
  ecartManuel?: number; // correction manuelle ponctuelle superposée au calcul auto, comme dans le bordereau Excel
  tonnageMort: number;
  capaciteTotale: number;
}

export interface ZoneStock {
  id: "SA" | "SB";
  qualite: string;
  tonnageVif: number;
  tonnageMort: number;
}

export interface StockSnapshot {
  date: string; // yyyy-mm-dd
  cellules: CelluleStock[];
  zones: ZoneStock[];
  etatSilos: number; // tonnage actuellement dans le silo T10, toutes qualités confondues
  posteNotes: string; // ex. "Cellule 9 et 11 à déboucher"
}

/** Les 12 cellules du bordereau ("1".."12") mappées positionnellement sur trainData.CELLULES[0..11]
 * (Lot1/AxeA ×3, Lot1/AxeB ×3, Lot2/AxeC ×3, Lot2/AxeD ×3) — même identité de cellule que les
 * modules Train et Schéma de manutention. */
export const STOCK_CELLULE_IDS: string[] = CELLULES.slice(0, 12).map((c) => c.id);

/** Capacité totale (mort+vif max) par cellule, déduite de Mort+Vif / taux de remplissage,
 * vérifiée stable sur 3 jours réels distincts du bordereau "ETAT DES STOCKS". */
export const CAPACITES_CELLULES: Record<string, number> = {
  [STOCK_CELLULE_IDS[0]]: 12500,
  [STOCK_CELLULE_IDS[1]]: 8000,
  [STOCK_CELLULE_IDS[2]]: 13300,
  [STOCK_CELLULE_IDS[3]]: 13300,
  [STOCK_CELLULE_IDS[4]]: 13300,
  [STOCK_CELLULE_IDS[5]]: 13300,
  [STOCK_CELLULE_IDS[6]]: 13300,
  [STOCK_CELLULE_IDS[7]]: 13300,
  [STOCK_CELLULE_IDS[8]]: 13300,
  [STOCK_CELLULE_IDS[9]]: 13300,
  [STOCK_CELLULE_IDS[10]]: 13300,
  [STOCK_CELLULE_IDS[11]]: 13300
};

/** Qualités effectivement observées dans le panneau "Total stock vif à 7h00" du bordereau réel. */
export const QUALITES_STOCK: string[] = ["K02", "K10", "K20", "K08", "K09", "K10/SP", "K03", "K12", "K62"];

const MORT_BASELINE = [7000, 3100, 8000, 7800, 8800, 7600, 7682, 8200, 9000, 7300, 7100, 7500];

function buildCellules(qualites: string[], vifs: number[]): CelluleStock[] {
  return STOCK_CELLULE_IDS.map((celluleId, i) => ({
    celluleId,
    qualite: qualites[i],
    tonnageVif: vifs[i],
    tonnageMort: MORT_BASELINE[i],
    capaciteTotale: CAPACITES_CELLULES[celluleId]
  }));
}

// --- Jours réels transcrits du bordereau "ETAT DES STOCKS.xlsx" ---

export const STOCK_SNAPSHOTS: StockSnapshot[] = [
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
