import { useMemo, useState } from "react";
import { FileUp, Pencil, PlusCircle, Ship, Trash2 } from "lucide-react";
import type { ChargementPortique, Navire } from "./navireData";
import { NAVIRE_PORTIQUES } from "./navireData";
import { aggregateTonnageByPortique, formatDuration } from "./navireRules";
import ExcelLikeChargementTable from "./ExcelLikeChargementTable";
import ImportExcelModalNavire from "./ImportExcelModalNavire";
import NavireEditModal from "./NavireEditModal";

const selectClass =
  "h-10 rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-bold text-[#314238] outline-none transition focus:border-[#0d6b4d]";

export default function ChargementNavireView({
  navires,
  chargements,
  onCreate,
  onUpdate,
  onDuplicate,
  onDelete,
  onImport,
  onUpdateNavire,
  onDeleteNavire
}: {
  navires: Navire[];
  chargements: ChargementPortique[];
  onCreate: (row: ChargementPortique) => void;
  onUpdate: (id: string, patch: Partial<ChargementPortique>) => void;
  onDuplicate: (row: ChargementPortique) => void;
  onDelete: (id: string) => void;
  onImport: (rows: ChargementPortique[]) => void;
  onUpdateNavire?: (id: string, patch: Partial<Navire>) => void;
  onDeleteNavire?: (id: string) => void;
}) {
  const [selectedNavireId, setSelectedNavireId] = useState(navires[0]?.id ?? "");
  const [importOpen, setImportOpen] = useState(false);
  const [editNavireOpen, setEditNavireOpen] = useState(false);

  const selectedNavire = navires.find((n) => n.id === selectedNavireId) ?? null;

  function handleDeleteNavire() {
    if (!selectedNavire || !onDeleteNavire) return;
    if (!window.confirm(`Supprimer définitivement le navire ${selectedNavire.nom} et ses lignes de chargement associées ?`)) return;
    onDeleteNavire(selectedNavire.id);
    setSelectedNavireId(navires.find((n) => n.id !== selectedNavire.id)?.id ?? "");
  }
  const filtered = useMemo(() => chargements.filter((c) => c.navireId === selectedNavireId), [chargements, selectedNavireId]);
  const totals = useMemo(() => aggregateTonnageByPortique(filtered), [filtered]);
  const totalTonnage = filtered.reduce((sum, c) => sum + c.tonnage, 0);

  function handleAddRow() {
    if (!selectedNavireId) return;
    onCreate({
      id: `chg-${Date.now()}`,
      navireId: selectedNavireId,
      portique: NAVIRE_PORTIQUES[0],
      cale: "",
      peseuse: "",
      repriseOuDirection: "",
      dateDebutAffect: "",
      heureDebutAffect: "",
      dateFinAffect: "",
      heureFinAffect: "",
      tonnage: 0
    });
  }

  function handleCellCommit(id: string, colKey: string, rawValue: string) {
    if (colKey === "tonnage") {
      onUpdate(id, { tonnage: Number(rawValue) || 0 });
      return;
    }
    onUpdate(id, { [colKey]: rawValue } as Partial<ChargementPortique>);
  }

  if (navires.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#b8c6bc] bg-white/70 p-10 text-center text-sm font-bold text-[#6c7c71]">
        Créez d'abord un navire dans l'onglet « Navires » pour saisir son chargement.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-medium text-[#102b20]">
            Chargement portiques{selectedNavire ? ` — ${selectedNavire.nom}` : ""}
          </h2>
          <p className="mt-1 text-sm text-[#6c7c71]">Une ligne par affectation portique/cale, comme la feuille "Pesée des bascules".</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-[#dfe6d7] bg-white px-4 text-xs font-bold text-[#314238] transition hover:bg-[#f3f8ef]"
          >
            <FileUp size={15} aria-hidden="true" />
            Importer
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#cfe3d8] bg-[#e8f4ed] px-4 py-3">
        <label className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#cfe3d8] bg-white text-[#0d6b4d]">
            <Ship size={14} aria-hidden="true" />
          </span>
          <span className="text-xs font-black uppercase tracking-[0.06em] text-[#0d6b4d]">Navire sélectionné</span>
          <select value={selectedNavireId} onChange={(e) => setSelectedNavireId(e.target.value)} className={selectClass}>
            {navires.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nom}
              </option>
            ))}
          </select>
        </label>
        {onUpdateNavire && (
          <button
            type="button"
            onClick={() => setEditNavireOpen(true)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#cfe3d8] bg-white text-[#0d6b4d] hover:bg-[#d9edc8]"
            title="Modifier ce navire"
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
        )}
        {onDeleteNavire && (
          <button
            type="button"
            onClick={handleDeleteNavire}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#f0c2c2] bg-white text-[#9a2f2f] hover:bg-[#fbe9e9]"
            title="Supprimer ce navire"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-[#0d6b4d] px-4 text-xs font-bold text-white transition hover:bg-[#0a563d]"
        >
          <PlusCircle size={15} aria-hidden="true" />
          Ajouter une ligne{selectedNavire ? ` pour ${selectedNavire.nom}` : ""}
        </button>
        <span className="text-xs font-semibold text-[#237343]">
          Les lignes ajoutées ou importées ci-dessous s'appliquent toutes à ce navire — changez-le ici pour saisir un autre chargement.
        </span>
      </div>

      {onUpdateNavire && editNavireOpen && (
        <NavireEditModal
          navire={selectedNavire}
          onClose={() => setEditNavireOpen(false)}
          onSubmit={(id, patch) => onUpdateNavire(id, patch)}
        />
      )}

      <ExcelLikeChargementTable
        chargements={filtered}
        onCellCommit={handleCellCommit}
        onDuplicateRow={(row) => onDuplicate({ ...row, id: `${row.id}-copie-${Date.now()}` })}
        onDeleteRow={onDelete}
      />

      {totals.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[#dfe6d7] bg-white/80 px-4 py-3 text-xs font-bold text-[#314238]">
          <span className="text-[#0d6b4d]">Total : {totalTonnage.toLocaleString("fr-FR")} t</span>
          {totals.map((t) => (
            <span key={t.portique}>
              {t.portique} : {t.tonnage.toLocaleString("fr-FR")} t · {formatDuration(t.dureeMinutes)}
              {t.cadence ? ` · ${t.cadence} t/h` : ""}
            </span>
          ))}
        </div>
      )}

      <ImportExcelModalNavire
        open={importOpen}
        navireId={selectedNavireId}
        onClose={() => setImportOpen(false)}
        onImport={(rows) => {
          onImport(rows);
          setImportOpen(false);
        }}
      />
    </div>
  );
}
