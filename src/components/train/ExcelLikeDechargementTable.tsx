import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Copy, Eraser, Pencil, Trash2 } from "lucide-react";
import type { Dechargement } from "./trainData";
import { AXES, CELLULES, PESEUSES, PHOSPHATE_QUALITIES, SILOS } from "./trainData";
import {
  calculateDuration,
  calculateEcart,
  collectSelectedCelluleIds,
  formatCelluleLabel,
  formatHM,
  getBlockedCellIds,
  isValidField,
  readDestinationsFromDechargement,
  readFieldFromDechargement,
  validateDechargementRow
} from "./dechargementRules";
import EditableCell, { type NavigateDirection } from "./EditableCell";
import MultiDestinationCell from "./MultiDestinationCell";
import DechargementTableHeader from "./DechargementTableHeader";
import {
  ACTIONS_COLUMN,
  DA_COLUMNS,
  DB_COLUMNS,
  EDITABLE_COLUMN_ORDER,
  FROZEN_COLUMNS,
  SILOS_COLUMNS,
  TEMPS_COLUMNS,
  columnWidthPercent,
  type Density
} from "./dechargementGridLayout";

const QUALITE_OPTIONS = PHOSPHATE_QUALITIES.map((q) => ({ value: q.code, label: q.code }));
const AXE_OPTIONS = AXES.map((a) => ({ value: a.name, label: a.name }));
const CELLULE_OPTIONS = CELLULES.map((c) => ({ value: c.id, label: formatCelluleLabel(c) }));
const SILO_OPTIONS = SILOS.map((s) => ({ value: s.id, label: s.label }));
const PESEUSE_OPTIONS = PESEUSES.map((p) => ({ value: p.id, label: `${p.label} (navire direct)` }));
// DA/DB peuvent aller vers une cellule, vers le silo T10, ou directement au navire via une peseuse.
// DA, DB et Silos peuvent tous rediriger vers une cellule, un silo, ou directement au navire via une peseuse.
const ALL_DESTINATION_OPTIONS = [...CELLULE_OPTIONS, ...SILO_OPTIONS, ...PESEUSE_OPTIONS];

const tdBase = "border border-[#eef1ea] p-0 text-center overflow-hidden";

export default function ExcelLikeDechargementTable({
  dechargements,
  density,
  zoom,
  dirtyCells,
  onCellCommit,
  onDestinationsCommit,
  onBulkPaste,
  onDuplicateRow,
  onDeleteRow,
  onClearRow,
  onOpenModal,
  maxHeightClass = "max-h-[65vh]",
  focusRowId,
  onFocusHandled
}: {
  dechargements: Dechargement[];
  density: Density;
  zoom: number;
  dirtyCells: Set<string>;
  onCellCommit: (id: string, colKey: string, rawValue: string) => void;
  onDestinationsCommit: (id: string, family: "da" | "db" | "silos", values: string[]) => void;
  onBulkPaste: (startRowIndex: number, startColKey: string, grid: string[][]) => void;
  onDuplicateRow: (d: Dechargement) => void;
  onDeleteRow: (id: string) => void;
  onClearRow: (id: string) => void;
  onOpenModal: (d: Dechargement) => void;
  maxHeightClass?: string;
  focusRowId?: string | null;
  onFocusHandled?: () => void;
}) {
  const cellRefs = useRef<Map<string, HTMLInputElement | HTMLSelectElement>>(new Map());
  const [expandedValidationId, setExpandedValidationId] = useState<string | null>(null);
  const compact = density === "compact";
  const actionBtnSize = compact ? "h-5 w-5" : "h-6 w-6";
  const actionIconSize = compact ? 10 : 11;
  const readonlyTextClass = compact ? "text-[10px] px-0.5 py-1" : "text-xs px-1 py-1.5";

  useEffect(() => {
    if (!focusRowId) return;
    const el = cellRefs.current.get(`${focusRowId}:numeroTrain`);
    if (el) {
      el.focus();
      onFocusHandled?.();
    }
  }, [focusRowId, dechargements, onFocusHandled]);

  function focusCell(rowIndex: number, colIndex: number) {
    const row = dechargements[rowIndex];
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
    <div
      className={`overflow-y-auto overflow-x-hidden rounded-lg border border-[#dfe6d7] bg-white shadow-[0_16px_42px_rgba(16,43,32,0.06)] ${maxHeightClass}`}
      style={{ zoom: `${zoom}%` }}
    >
      <table className="w-full table-fixed border-collapse text-xs">
        <colgroup>
          {[...FROZEN_COLUMNS, ...DA_COLUMNS, ...DB_COLUMNS, ...SILOS_COLUMNS, ...TEMPS_COLUMNS, ACTIONS_COLUMN].map((col) => (
            <col key={col.key} style={{ width: columnWidthPercent(col) }} />
          ))}
        </colgroup>
        <DechargementTableHeader density={density} />
        <tbody>
          {dechargements.map((d, rowIndex) => {
            const ecart = calculateEcart(d.tonnageExpedie, d.tonnageBascule);
            const duree = calculateDuration(d.debutDechargement, d.finDechargement);
            const issues = validateDechargementRow(d);
            const blockedCelluleIds = getBlockedCellIds(collectSelectedCelluleIds(d));

            function cellProps(colKey: string) {
              const colIndex = EDITABLE_COLUMN_ORDER.indexOf(colKey);
              return {
                value: readFieldFromDechargement(d, colKey),
                isValid: isValidField(colKey, readFieldFromDechargement(d, colKey)),
                isDirty: dirtyCells.has(`${d.id}:${colKey}`),
                onCommit: (v: string) => onCellCommit(d.id, colKey, v),
                onNavigate: (dir: NavigateDirection) => handleNavigate(rowIndex, colIndex, dir),
                onPasteBulk: (grid: string[][]) => onBulkPaste(rowIndex, colKey, grid),
                registerRef: (el: HTMLInputElement | HTMLSelectElement | null) => {
                  const key = `${d.id}:${colKey}`;
                  if (el) cellRefs.current.set(key, el);
                  else cellRefs.current.delete(key);
                },
                compact
              };
            }

            return (
              <tr key={d.id} className="group">
                {FROZEN_COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={`${tdBase} ${
                      col.key === "tonnageBascule" ? "bg-[#eaf3fb]" : col.key === "ecart" ? "bg-[#fdf1e6]" : "bg-white"
                    } group-hover:bg-[#f6f9f2]`}
                    style={{ width: columnWidthPercent(col) }}
                  >
                    {col.key === "ecart" ? (
                      <span className={`block truncate font-black ${readonlyTextClass} ${ecart === 0 ? "text-[#8a5a10]" : "text-[#a5460f]"}`}>{ecart}</span>
                    ) : col.key === "axe" ? (
                      <EditableCell {...cellProps(col.key)} type="select" options={AXE_OPTIONS} />
                    ) : (
                      <EditableCell {...cellProps(col.key)} type={col.key === "numeroTrain" ? "text" : "number"} />
                    )}
                  </td>
                ))}

                {DA_COLUMNS.map((col) =>
                  col.key.endsWith("destination") ? (
                    <td key={col.key} className="relative overflow-visible border border-[#eef1ea] p-0 text-center" style={{ width: columnWidthPercent(col) }}>
                      <MultiDestinationCell
                        selected={readDestinationsFromDechargement(d, "da")}
                        options={ALL_DESTINATION_OPTIONS}
                        quantiteTotale={d.da[0]?.quantite ?? 0}
                        blockedIds={blockedCelluleIds}
                        onChange={(values) => onDestinationsCommit(d.id, "da", values)}
                        compact={compact}
                      />
                    </td>
                  ) : (
                    <td key={col.key} className={`${tdBase} ${col.key.endsWith("periode") ? "bg-[#fffbe0]" : ""}`} style={{ width: columnWidthPercent(col) }}>
                      <EditableCell
                        {...cellProps(col.key)}
                        type={col.key.endsWith("qualite") ? "select" : col.key.endsWith("quantite") ? "number" : "text"}
                        options={col.key.endsWith("qualite") ? QUALITE_OPTIONS : undefined}
                        bgClass={col.key.endsWith("periode") ? "bg-[#fffbe0]" : ""}
                      />
                    </td>
                  )
                )}
                {DB_COLUMNS.map((col) =>
                  col.key.endsWith("destination") ? (
                    <td key={col.key} className="relative overflow-visible border border-[#eef1ea] p-0 text-center" style={{ width: columnWidthPercent(col) }}>
                      <MultiDestinationCell
                        selected={readDestinationsFromDechargement(d, "db")}
                        options={ALL_DESTINATION_OPTIONS}
                        quantiteTotale={d.db[0]?.quantite ?? 0}
                        blockedIds={blockedCelluleIds}
                        onChange={(values) => onDestinationsCommit(d.id, "db", values)}
                        compact={compact}
                      />
                    </td>
                  ) : (
                    <td key={col.key} className={`${tdBase} ${col.key.endsWith("periode") ? "bg-[#fffbe0]" : ""}`} style={{ width: columnWidthPercent(col) }}>
                      <EditableCell
                        {...cellProps(col.key)}
                        type={col.key.endsWith("qualite") ? "select" : col.key.endsWith("quantite") ? "number" : "text"}
                        options={col.key.endsWith("qualite") ? QUALITE_OPTIONS : undefined}
                        bgClass={col.key.endsWith("periode") ? "bg-[#fffbe0]" : ""}
                      />
                    </td>
                  )
                )}
                {SILOS_COLUMNS.map((col) =>
                  col.key.endsWith("destination") ? (
                    <td key={col.key} className="relative overflow-visible border border-[#eef1ea] p-0 text-center" style={{ width: columnWidthPercent(col) }}>
                      <MultiDestinationCell
                        selected={readDestinationsFromDechargement(d, "silos")}
                        options={ALL_DESTINATION_OPTIONS}
                        quantiteTotale={d.silos[0]?.quantite ?? 0}
                        blockedIds={blockedCelluleIds}
                        onChange={(values) => onDestinationsCommit(d.id, "silos", values)}
                        compact={compact}
                      />
                    </td>
                  ) : (
                    <td key={col.key} className={`${tdBase} ${col.key.endsWith("periode") ? "bg-[#fffbe0]" : ""}`} style={{ width: columnWidthPercent(col) }}>
                      <EditableCell
                        {...cellProps(col.key)}
                        type={col.key.endsWith("qualite") ? "select" : col.key.endsWith("quantite") ? "number" : "text"}
                        options={col.key.endsWith("qualite") ? QUALITE_OPTIONS : undefined}
                        bgClass={col.key.endsWith("periode") ? "bg-[#fffbe0]" : ""}
                      />
                    </td>
                  )
                )}

                <td className={tdBase} style={{ width: columnWidthPercent(TEMPS_COLUMNS[0]) }}>
                  <EditableCell {...cellProps("debutDechargement")} type="time" />
                </td>
                <td className={tdBase} style={{ width: columnWidthPercent(TEMPS_COLUMNS[1]) }}>
                  <EditableCell {...cellProps("finDechargement")} type="time" />
                </td>
                <td className={`${tdBase} truncate font-semibold text-[#314238] ${readonlyTextClass}`} style={{ width: columnWidthPercent(TEMPS_COLUMNS[2]) }}>
                  {formatHM(duree)}
                </td>

                <td className="relative overflow-visible border border-[#eef1ea] px-0.5 py-1" style={{ width: columnWidthPercent(ACTIONS_COLUMN) }}>
                  <div className="flex flex-wrap items-center justify-center gap-0.5">
                    <button type="button" onClick={() => onOpenModal(d)} title="Répartition détaillée (DA/DB/Silos/Cellules/Navire)" className={`flex ${actionBtnSize} cursor-pointer items-center justify-center rounded border border-[#dfe6d7] text-[#5e7166] hover:bg-[#f3f8ef]`}>
                      <Pencil size={actionIconSize} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => onDuplicateRow(d)} title="Dupliquer la ligne" className={`flex ${actionBtnSize} cursor-pointer items-center justify-center rounded border border-[#dfe6d7] text-[#5e7166] hover:bg-[#f3f8ef]`}>
                      <Copy size={actionIconSize} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => onClearRow(d.id)} title="Vider la ligne" className={`flex ${actionBtnSize} cursor-pointer items-center justify-center rounded border border-[#dfe6d7] text-[#5e7166] hover:bg-[#f3f8ef]`}>
                      <Eraser size={actionIconSize} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedValidationId(expandedValidationId === d.id ? null : d.id)}
                      title="Valider la ligne"
                      className={`flex ${actionBtnSize} cursor-pointer items-center justify-center rounded border ${
                        issues.length > 0 ? "border-[#f3c9a8] text-[#a5460f]" : "border-[#b9ddc9] text-[#237343]"
                      } hover:bg-[#f3f8ef]`}
                    >
                      <CheckCircle2 size={actionIconSize} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => onDeleteRow(d.id)} title="Supprimer la ligne" className={`flex ${actionBtnSize} cursor-pointer items-center justify-center rounded border border-[#f0c2c2] text-[#9a2f2f] hover:bg-[#fbe9e9]`}>
                      <Trash2 size={actionIconSize} aria-hidden="true" />
                    </button>
                  </div>
                  {expandedValidationId === d.id && (
                    <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-md border border-[#dfe6d7] bg-white p-3 text-left text-[11px] shadow-[0_16px_42px_rgba(16,43,32,0.15)]">
                      {issues.length === 0 ? (
                        <p className="font-bold text-[#237343]">Ligne valide — aucune anomalie détectée.</p>
                      ) : (
                        <ul className="flex flex-col gap-1">
                          {issues.map((issue, i) => (
                            <li key={i} className="font-semibold text-[#a5460f]">
                              • {issue.message}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {dechargements.length === 0 && (
            <tr>
              <td colSpan={FROZEN_COLUMNS.length + DA_COLUMNS.length + DB_COLUMNS.length + SILOS_COLUMNS.length + TEMPS_COLUMNS.length + 1} className="px-4 py-8 text-center text-sm font-bold text-[#6c7c71]">
                Aucune ligne pour cette journée ou cette recherche. Utilisez « Ajouter une ligne train » pour commencer la saisie.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
