// Dimensions partagées entre l'en-tête et le corps de la grille "Déchargement des trains".
// Les largeurs web sont en pourcentage (somme = 100%) pour que le tableau tienne toujours dans la
// largeur disponible, sans scrollbar horizontale. widthNormal/widthCompact restent utilisées uniquement
// pour dimensionner les colonnes du fichier Excel exporté (excelExportService.ts).

export type Density = "normal" | "compact";

export interface ColumnDef {
  key: string;
  label: string;
  widthPercent: number;
  widthNormal: number;
  widthCompact: number;
  frozen?: boolean;
}

export const FROZEN_COLUMNS: ColumnDef[] = [
  { key: "numeroTrain", label: "n°", widthPercent: 4, widthNormal: 72, widthCompact: 52, frozen: true },
  { key: "nombreWagons", label: "N.Wg", widthPercent: 3.5, widthNormal: 68, widthCompact: 50, frozen: true },
  { key: "tonnageExpedie", label: "T.EXP", widthPercent: 4.5, widthNormal: 78, widthCompact: 58, frozen: true },
  { key: "tonnageBascule", label: "T.Bascule", widthPercent: 5.5, widthNormal: 88, widthCompact: 64, frozen: true },
  { key: "ecart", label: "Ecart", widthPercent: 4.5, widthNormal: 76, widthCompact: 56, frozen: true },
  { key: "axe", label: "Axe", widthPercent: 3.5, widthNormal: 68, widthCompact: 50, frozen: true }
];

function destinationBlock(prefix: string): ColumnDef[] {
  return [
    { key: `${prefix}.destination`, label: "Destination", widthPercent: 5, widthNormal: 96, widthCompact: 68 },
    { key: `${prefix}.qualite`, label: "qualité", widthPercent: 4, widthNormal: 78, widthCompact: 56 },
    { key: `${prefix}.quantite`, label: "quantité", widthPercent: 4.5, widthNormal: 88, widthCompact: 64 },
    { key: `${prefix}.periode`, label: "période", widthPercent: 5.5, widthNormal: 100, widthCompact: 74 }
  ];
}

export const DA_COLUMNS = destinationBlock("da");
export const DB_COLUMNS = destinationBlock("db");
export const SILOS_COLUMNS = destinationBlock("silos");

export const TEMPS_COLUMNS: ColumnDef[] = [
  { key: "debutDechargement", label: "Début déchargt", widthPercent: 4, widthNormal: 88, widthCompact: 64 },
  { key: "finDechargement", label: "fin déchargt", widthPercent: 4, widthNormal: 88, widthCompact: 64 },
  { key: "dureeDechargement", label: "durée déchargt", widthPercent: 4, widthNormal: 88, widthCompact: 64 }
];

export const ACTIONS_COLUMN: ColumnDef = { key: "actions", label: "Actions", widthPercent: 5.5, widthNormal: 118, widthCompact: 96 };

export const ALL_COLUMNS: ColumnDef[] = [
  ...FROZEN_COLUMNS,
  ...DA_COLUMNS,
  ...DB_COLUMNS,
  ...SILOS_COLUMNS,
  ...TEMPS_COLUMNS,
  ACTIONS_COLUMN
];

/** Colonnes réellement éditables au clavier, dans l'ordre de navigation Tab/Entrée. */
export const EDITABLE_COLUMN_ORDER: string[] = [
  "numeroTrain",
  "nombreWagons",
  "tonnageExpedie",
  "tonnageBascule",
  "axe",
  "da.destination",
  "da.qualite",
  "da.quantite",
  "da.periode",
  "db.destination",
  "db.qualite",
  "db.quantite",
  "db.periode",
  "silos.destination",
  "silos.qualite",
  "silos.quantite",
  "silos.periode",
  "debutDechargement",
  "finDechargement"
];

/** Largeur en pourcentage de la colonne (identique quelle que soit la densité — seuls la police et le padding varient). */
export function columnWidthPercent(col: ColumnDef): string {
  return `${col.widthPercent}%`;
}
