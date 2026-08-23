// Dimensions partagées pour la grille "Chargement portiques" (mêmes largeurs en pourcentage
// que dechargementGridLayout.ts, en plus simple car il n'y a pas de blocs répétés DA/DB/Silos).

export type Density = "normal" | "compact";

export interface ColumnDef {
  key: string;
  label: string;
  widthPercent: number;
}

export const CHARGEMENT_COLUMNS: ColumnDef[] = [
  { key: "portique", label: "Portique", widthPercent: 9 },
  { key: "cale", label: "Cale", widthPercent: 7 },
  { key: "peseuse", label: "Pes.", widthPercent: 7 },
  { key: "repriseOuDirection", label: "Rep. ou dir.", widthPercent: 10 },
  { key: "dateDebutAffect", label: "Date début", widthPercent: 11 },
  { key: "heureDebutAffect", label: "Heure début", widthPercent: 9 },
  { key: "dateFinAffect", label: "Date fin", widthPercent: 11 },
  { key: "heureFinAffect", label: "Heure fin", widthPercent: 9 },
  { key: "duree", label: "Durée", widthPercent: 8 },
  { key: "tonnage", label: "Tonnage", widthPercent: 9 }
];

export const ACTIONS_COLUMN: ColumnDef = { key: "actions", label: "Actions", widthPercent: 10 };

export const EDITABLE_COLUMN_ORDER: string[] = [
  "portique",
  "cale",
  "peseuse",
  "repriseOuDirection",
  "dateDebutAffect",
  "heureDebutAffect",
  "dateFinAffect",
  "heureFinAffect",
  "tonnage"
];

export function columnWidthPercent(col: ColumnDef): string {
  return `${col.widthPercent}%`;
}
