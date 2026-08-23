import { useRef } from "react";
import { Copy, Trash2 } from "lucide-react";
import { NAVIRE_PORTIQUES, REPRISE_OPTIONS, type ChargementPortique } from "./navireData";
import { calculateDuration, formatDuration } from "./navireRules";
import EditableCell, { type NavigateDirection } from "../train/EditableCell";
import { ACTIONS_COLUMN, CHARGEMENT_COLUMNS, EDITABLE_COLUMN_ORDER, columnWidthPercent, type Density } from "./chargementGridLayout";

const PORTIQUE_OPTIONS = NAVIRE_PORTIQUES.map((p) => ({ value: p, label: p }));

const tdBase = "border border-[#eef1ea] p-0 text-center overflow-hidden";

function readField(row: ChargementPortique, key: string): string {
  const value = row[key as keyof ChargementPortique];
  return value === undefined || value === null ? "" : String(value);
}

export default function ExcelLikeChargementTable({
  chargements,
  density = "normal",
  onCellCommit,
  onDuplicateRow,
  onDeleteRow
}: {
  chargements: ChargementPortique[];
  density?: Density;
  onCellCommit: (id: string, colKey: string, rawValue: string) => void;
  onDuplicateRow: (row: ChargementPortique) => void;
  onDeleteRow: (id: string) => void;
}) {
  const cellRefs = useRef<Map<string, HTMLInputElement | HTMLSelectElement>>(new Map());
  const compact = density === "compact";
  const actionBtnSize = compact ? "h-5 w-5" : "h-6 w-6";
  const actionIconSize = compact ? 10 : 11;
  const readonlyTextClass = compact ? "text-[10px] px-0.5 py-1" : "text-xs px-1 py-1.5";

  function focusCell(rowIndex: number, colIndex: number) {
    const row = chargements[rowIndex];
    const colKey = EDITABLE_COLUMN_ORDER[colIndex];
    if (!row || !colKey) return;
    const el = cellRefs.current.get(`${row.id}:${colKey}`);
    if (el) {
      el.focus();
      if (el instanceof HTMLInputElement) el.select();
    }
  }

  function handleNavigate(rowIndex: number, colIndex: number, direction: NavigateDirection) {
    let r = rowIndex;
    let c = colIndex;
    if (direction === "up") r -= 1;
    if (direction === "down") r += 1;
    if (direction === "left") c -= 1;
    if (direction === "right") c += 1;
    if (c < 0) {
      c = EDITABLE_COLUMN_ORDER.length - 1;
      r -= 1;
    }
    if (c >= EDITABLE_COLUMN_ORDER.length) {
      c = 0;
      r += 1;
    }
    focusCell(r, c);
  }

  return (
    <div className="max-h-[65vh] overflow-y-auto overflow-x-auto rounded-lg border border-[#dfe6d7] bg-white shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
      <table className="w-full min-w-[900px] table-fixed border-collapse text-xs">
        <colgroup>
          {[...CHARGEMENT_COLUMNS, ACTIONS_COLUMN].map((col) => (
            <col key={col.key} style={{ width: columnWidthPercent(col) }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-[#dfe6d7] bg-[#f3f8ef] text-[11px] font-black uppercase tracking-[0.05em] text-[#5e7166]">
            {[...CHARGEMENT_COLUMNS, ACTIONS_COLUMN].map((col) => (
              <th key={col.key} className="border border-[#eef1ea] px-2 py-2">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chargements.map((row, rowIndex) => {
            const duree = calculateDuration(row.heureDebutAffect, row.heureFinAffect);

            function cellProps(colKey: string) {
              const colIndex = EDITABLE_COLUMN_ORDER.indexOf(colKey);
              return {
                value: readField(row, colKey),
                onCommit: (v: string) => onCellCommit(row.id, colKey, v),
                onNavigate: (dir: NavigateDirection) => handleNavigate(rowIndex, colIndex, dir),
                registerRef: (el: HTMLInputElement | HTMLSelectElement | null) => {
                  const key = `${row.id}:${colKey}`;
                  if (el) cellRefs.current.set(key, el);
                  else cellRefs.current.delete(key);
                },
                compact
              };
            }

            return (
              <tr key={row.id} className="group">
                <td className={tdBase}>
                  <EditableCell {...cellProps("portique")} type="select" options={PORTIQUE_OPTIONS} />
                </td>
                <td className={tdBase}>
                  <EditableCell {...cellProps("cale")} type="text" />
                </td>
                <td className={tdBase}>
                  <EditableCell {...cellProps("peseuse")} type="text" />
                </td>
                <td className={tdBase}>
                  <EditableCell {...cellProps("repriseOuDirection")} type="select" options={REPRISE_OPTIONS} />
                </td>
                <td className={tdBase}>
                  <EditableCell {...cellProps("dateDebutAffect")} type="text" />
                </td>
                <td className={tdBase}>
                  <EditableCell {...cellProps("heureDebutAffect")} type="time" />
                </td>
                <td className={tdBase}>
                  <EditableCell {...cellProps("dateFinAffect")} type="text" />
                </td>
                <td className={tdBase}>
                  <EditableCell {...cellProps("heureFinAffect")} type="time" />
                </td>
                <td className={`${tdBase} truncate font-semibold text-[#314238] ${readonlyTextClass}`}>{formatDuration(duree)}</td>
                <td className={tdBase}>
                  <EditableCell {...cellProps("tonnage")} type="number" />
                </td>
                <td className="border border-[#eef1ea] px-0.5 py-1">
                  <div className="flex items-center justify-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onDuplicateRow(row)}
                      title="Dupliquer la ligne"
                      className={`flex ${actionBtnSize} cursor-pointer items-center justify-center rounded border border-[#dfe6d7] text-[#5e7166] hover:bg-[#f3f8ef]`}
                    >
                      <Copy size={actionIconSize} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRow(row.id)}
                      title="Supprimer la ligne"
                      className={`flex ${actionBtnSize} cursor-pointer items-center justify-center rounded border border-[#f0c2c2] text-[#9a2f2f] hover:bg-[#fbe9e9]`}
                    >
                      <Trash2 size={actionIconSize} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {chargements.length === 0 && (
            <tr>
              <td colSpan={CHARGEMENT_COLUMNS.length + 1} className="px-4 py-8 text-center text-sm font-bold text-[#6c7c71]">
                Aucune ligne de chargement. Utilisez « Ajouter une ligne » ou « Importer » pour commencer la saisie.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
