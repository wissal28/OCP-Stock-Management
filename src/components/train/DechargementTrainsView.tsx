import { useMemo, useState } from "react";
import type { Dechargement, Train } from "./trainData";
import {
  applyDestinationsToDechargement,
  applyFieldToDechargement,
  calculateDailyTotals,
  clearDechargementRow,
  createEmptyDechargement,
  getCurrentOperationalDay,
  groupDechargementsByOperationalDay
} from "./dechargementRules";
import { EDITABLE_COLUMN_ORDER, type Density } from "./dechargementGridLayout";
import OperationalDayHeader from "./OperationalDayHeader";
import TrainFilters from "./TrainFilters";
import TableToolbar from "./TableToolbar";
import ExcelLikeDechargementTable from "./ExcelLikeDechargementTable";
import DechargementSummaryFooter from "./DechargementSummaryFooter";
import TrainFormModal from "./TrainFormModal";
import ImportExcelModal from "./ImportExcelModal";
import FullscreenTableMode from "./FullscreenTableMode";

function matchesQuery(d: Dechargement, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const haystack = [
    d.numeroTrain,
    d.axe,
    ...d.da.flatMap((r) => [...r.destinations, r.qualite]),
    ...d.db.flatMap((r) => [...r.destinations, r.qualite]),
    ...d.silos.flatMap((r) => [...r.destinations, r.qualite])
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export default function DechargementTrainsView({
  dechargements,
  trains,
  onCreate,
  onUpdate,
  onDuplicate,
  onDelete
}: {
  dechargements: Dechargement[];
  trains: Train[];
  onCreate: (dechargement: Dechargement) => void;
  onUpdate: (id: string, patch: Partial<Dechargement>) => void;
  onDuplicate: (dechargement: Dechargement) => void;
  onDelete: (id: string) => void;
}) {
  const currentOperationalDay = useMemo(() => getCurrentOperationalDay(), []);
  const groupedByDay = useMemo(() => groupDechargementsByOperationalDay(dechargements), [dechargements]);
  // La journée d'exploitation en cours (7h → 7h) est toujours proposable, même avant toute saisie —
  // pas besoin de la créer ou de la sélectionner manuellement. Les journées passées restent
  // consultables (l'historique), triées de la plus récente à la plus ancienne.
  const days = useMemo(() => {
    const list = [...groupedByDay.keys()];
    if (!list.includes(currentOperationalDay)) list.push(currentOperationalDay);
    return list.sort((a, b) => (a < b ? 1 : -1));
  }, [groupedByDay, currentOperationalDay]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<{ open: boolean; editing: Dechargement | null }>({ open: false, editing: null });
  const [importOpen, setImportOpen] = useState(false);
  const [density, setDensity] = useState<Density>("normal");
  const [zoom, setZoom] = useState(100);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dirtyCells, setDirtyCells] = useState<Set<string>>(new Set());
  const [focusRowId, setFocusRowId] = useState<string | null>(null);

  // Par défaut (tant que l'utilisateur n'a pas navigué manuellement), la journée active est celle
  // en cours — déduite de l'heure réelle, jamais à saisir à la main.
  const activeDay = selectedDay && days.includes(selectedDay) ? selectedDay : currentOperationalDay;
  const dayDechargements = activeDay ? groupedByDay.get(activeDay) ?? [] : [];
  const filteredDechargements = dayDechargements.filter((d) => matchesQuery(d, query));

  function markDirty(id: string, colKey: string) {
    setDirtyCells((prev) => {
      const next = new Set(prev);
      next.add(`${id}:${colKey}`);
      return next;
    });
  }

  function handleCellCommit(id: string, colKey: string, rawValue: string) {
    const target = dayDechargements.find((d) => d.id === id);
    if (!target) return;
    onUpdate(id, applyFieldToDechargement(target, colKey, rawValue));
    markDirty(id, colKey);
  }

  function handleDestinationsCommit(id: string, family: "da" | "db" | "silos", values: string[]) {
    const target = dayDechargements.find((d) => d.id === id);
    if (!target) return;
    onUpdate(id, applyDestinationsToDechargement(target, family, values));
    markDirty(id, `${family}.destination`);
  }

  function handleBulkPaste(filteredRowIndex: number, startColKey: string, grid: string[][]) {
    const anchorRow = filteredDechargements[filteredRowIndex];
    const editableOrder = EDITABLE_COLUMN_ORDER;
    const startColIdx = editableOrder.indexOf(startColKey);
    if (startColIdx === -1) return;

    const baseIndex = anchorRow ? dayDechargements.findIndex((d) => d.id === anchorRow.id) : dayDechargements.length;

    grid.forEach((line, r) => {
      const rowIndex = baseIndex + r;
      const existing = dayDechargements[rowIndex];
      let targetId: string;
      let targetForRead: Dechargement;
      if (existing) {
        targetId = existing.id;
        targetForRead = existing;
      } else {
        const newRow = createEmptyDechargement(activeDay);
        targetId = newRow.id;
        targetForRead = newRow;
        onCreate(newRow);
      }

      let patch: Partial<Dechargement> = {};
      let workingRow = targetForRead;
      line.forEach((val, c) => {
        const colKey = editableOrder[startColIdx + c];
        if (!colKey) return;
        const fieldPatch = applyFieldToDechargement(workingRow, colKey, val);
        workingRow = { ...workingRow, ...fieldPatch };
        patch = { ...patch, ...fieldPatch };
        markDirty(targetId, colKey);
      });
      onUpdate(targetId, patch);
    });
  }

  function handleAddRow() {
    const newRow = createEmptyDechargement(activeDay);
    onCreate(newRow);
    setFocusRowId(newRow.id);
  }

  function handleClearRow(id: string) {
    const target = dayDechargements.find((d) => d.id === id);
    if (!target) return;
    onUpdate(id, clearDechargementRow(target));
  }

  function handleModalSubmit(dechargement: Dechargement) {
    if (modal.editing) onUpdate(dechargement.id, dechargement);
    else onCreate(dechargement);
  }

  function handleImportedRows(rows: Dechargement[]) {
    rows.forEach((row) => onCreate({ ...row, date: activeDay ?? row.date }));
  }

  const content = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-medium text-[#102b20]">Déchargement des trains</h2>
          {!isFullWidth && !isFullscreen && (
            <p className="mt-1 max-w-2xl text-sm text-[#6c7c71]">
              Saisie type Excel — cliquez une cellule, Tab/Entrée pour naviguer, collez directement depuis Excel. Remplace le fichier
              « Déchargement train ». Une journée d'exploitation va de 7h00 à 7h00 le lendemain.
            </p>
          )}
        </div>
      </div>

      <OperationalDayHeader
        activeDay={activeDay}
        days={days}
        onChange={setSelectedDay}
        totals={activeDay ? calculateDailyTotals(dayDechargements, trains) : null}
      />

      <TrainFilters query={query} onQueryChange={setQuery} />

      <TableToolbar
        density={density}
        onDensityChange={setDensity}
        zoom={zoom}
        onZoomChange={setZoom}
        isFullWidth={isFullWidth}
        onToggleFullWidth={() => setIsFullWidth((v) => !v)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen((v) => !v)}
        onAddRow={handleAddRow}
        onImportClick={() => setImportOpen(true)}
        dechargements={dayDechargements}
        trains={trains}
        operationalDay={activeDay}
      />

      <ExcelLikeDechargementTable
        dechargements={filteredDechargements}
        density={density}
        zoom={zoom}
        dirtyCells={dirtyCells}
        onCellCommit={handleCellCommit}
        onDestinationsCommit={handleDestinationsCommit}
        onBulkPaste={handleBulkPaste}
        onDuplicateRow={onDuplicate}
        onDeleteRow={onDelete}
        onClearRow={handleClearRow}
        onOpenModal={(d) => setModal({ open: true, editing: d })}
        maxHeightClass={isFullscreen ? "max-h-[calc(100vh-320px)]" : isFullWidth ? "max-h-[75vh]" : "max-h-[60vh]"}
        focusRowId={focusRowId}
        onFocusHandled={() => setFocusRowId(null)}
      />

      <DechargementSummaryFooter dechargements={dayDechargements} trains={trains} density={density} />

      <TrainFormModal
        open={modal.open}
        initial={modal.editing}
        defaultDate={activeDay}
        onClose={() => setModal({ open: false, editing: null })}
        onSubmit={handleModalSubmit}
      />

      <ImportExcelModal open={importOpen} defaultDate={activeDay} onClose={() => setImportOpen(false)} onImport={handleImportedRows} />
    </div>
  );

  return (
    <FullscreenTableMode active={isFullscreen} onExit={() => setIsFullscreen(false)}>
      {content}
    </FullscreenTableMode>
  );
}
