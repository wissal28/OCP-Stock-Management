import { Maximize2, Minimize2, PlusCircle, Rows3, Table2, Upload, ZoomIn, ZoomOut } from "lucide-react";
import type { Density } from "./dechargementGridLayout";
import type { Dechargement, Train } from "./trainData";
import ExportExcelButton from "./ExportExcelButton";

const ZOOM_LEVELS = [80, 90, 100, 110];

const btn =
  "flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-bold text-[#314238] transition hover:bg-[#f3f8ef]";
const btnActive = "flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-[#e8f4ed] px-3 text-xs font-bold text-[#0d6b4d] border border-[#cfe3d8]";

export default function TableToolbar({
  density,
  onDensityChange,
  zoom,
  onZoomChange,
  isFullWidth,
  onToggleFullWidth,
  isFullscreen,
  onToggleFullscreen,
  onAddRow,
  onImportClick,
  dechargements,
  trains,
  operationalDay
}: {
  density: Density;
  onDensityChange: (density: Density) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isFullWidth: boolean;
  onToggleFullWidth: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onAddRow: () => void;
  onImportClick: () => void;
  dechargements: Dechargement[];
  trains: Train[];
  operationalDay: string | null;
}) {
  const zoomIndex = ZOOM_LEVELS.indexOf(zoom);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#dfe6d7] bg-white/90 p-2.5 shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onAddRow} className="flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-[#0d6b4d] px-3 text-xs font-bold text-white transition hover:bg-[#0a563d]">
          <PlusCircle size={14} aria-hidden="true" />
          Ajouter une ligne train
        </button>
        <button type="button" onClick={onImportClick} className={btn}>
          <Upload size={13} aria-hidden="true" />
          Importer Excel
        </button>
        <ExportExcelButton dechargements={dechargements} trains={trains} operationalDay={operationalDay} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-md border border-[#dfe6d7] bg-white p-1">
          <button
            type="button"
            onClick={() => onDensityChange("normal")}
            title="Vue normale"
            className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded ${density === "normal" ? "bg-[#e8f4ed] text-[#0d6b4d]" : "text-[#5e7166] hover:bg-[#f3f8ef]"}`}
          >
            <Table2 size={13} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDensityChange("compact")}
            title="Vue compacte"
            className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded ${density === "compact" ? "bg-[#e8f4ed] text-[#0d6b4d]" : "text-[#5e7166] hover:bg-[#f3f8ef]"}`}
          >
            <Rows3 size={13} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-1 rounded-md border border-[#dfe6d7] bg-white p-1">
          <button
            type="button"
            disabled={zoomIndex <= 0}
            onClick={() => onZoomChange(ZOOM_LEVELS[Math.max(0, zoomIndex - 1)])}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-[#5e7166] hover:bg-[#f3f8ef] disabled:cursor-not-allowed disabled:opacity-40"
            title="Zoom arrière"
          >
            <ZoomOut size={13} aria-hidden="true" />
          </button>
          <span className="w-10 text-center text-xs font-black text-[#314238]">{zoom}%</span>
          <button
            type="button"
            disabled={zoomIndex >= ZOOM_LEVELS.length - 1}
            onClick={() => onZoomChange(ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, zoomIndex + 1)])}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-[#5e7166] hover:bg-[#f3f8ef] disabled:cursor-not-allowed disabled:opacity-40"
            title="Zoom avant"
          >
            <ZoomIn size={13} aria-hidden="true" />
          </button>
        </div>

        <button type="button" onClick={onToggleFullWidth} className={isFullWidth ? btnActive : btn} title="Vue complète (pleine largeur)">
          <Table2 size={13} aria-hidden="true" />
          Vue complète
        </button>

        <button type="button" onClick={onToggleFullscreen} className={isFullscreen ? btnActive : btn} title="Plein écran">
          {isFullscreen ? <Minimize2 size={13} aria-hidden="true" /> : <Maximize2 size={13} aria-hidden="true" />}
          {isFullscreen ? "Quitter plein écran" : "Plein écran"}
        </button>
      </div>
    </div>
  );
}
