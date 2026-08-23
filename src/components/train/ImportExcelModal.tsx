import { useState } from "react";
import { AlertTriangle, CheckCircle2, FileUp, Loader2, Upload, X } from "lucide-react";
import type { Dechargement } from "./trainData";
import {
  IMPORT_TARGET_FIELDS,
  buildDechargementsFromImport,
  parseExcelFile,
  type ImportPreview,
  type ImportTargetField
} from "./excelImportService";

const FIELD_LABELS: Record<ImportTargetField, string> = {
  numeroTrain: "N° train",
  nombreWagons: "Nombre de wagons",
  tonnageExpedie: "Tonnage expédié",
  tonnageBascule: "Tonnage bascule",
  axe: "Axe",
  "da.destination": "DA — Destination",
  "da.qualite": "DA — Qualité",
  "da.quantite": "DA — Quantité",
  "da.periode": "DA — Période",
  "db.destination": "DB — Destination",
  "db.qualite": "DB — Qualité",
  "db.quantite": "DB — Quantité",
  "db.periode": "DB — Période",
  "silos.destination": "Silos — Destination",
  "silos.qualite": "Silos — Qualité",
  "silos.quantite": "Silos — Quantité",
  "silos.periode": "Silos — Période",
  debutDechargement: "Début déchargt",
  finDechargement: "fin déchargt"
};

export default function ImportExcelModal({
  open,
  defaultDate,
  onClose,
  onImport
}: {
  open: boolean;
  defaultDate: string;
  onClose: () => void;
  onImport: (dechargements: Dechargement[]) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<Partial<Record<ImportTargetField, number>>>({});
  const [importErrors, setImportErrors] = useState<{ rowNumber: number; message: string }[]>([]);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  if (!open) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setImportedCount(null);
    setImportErrors([]);
    try {
      const result = await parseExcelFile(file);
      setPreview(result);
      setMapping(result.mapping);
    } catch {
      setImportErrors([{ rowNumber: 0, message: "Impossible de lire ce fichier. Vérifiez qu'il s'agit bien d'un fichier .xlsx ou .xls." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleConfirmImport() {
    if (!preview) return;
    const { dechargements, errors } = buildDechargementsFromImport(preview, mapping, defaultDate);
    setImportErrors(errors);
    setImportedCount(dechargements.length);
    if (dechargements.length > 0) onImport(dechargements);
  }

  function handleClose() {
    setPreview(null);
    setMapping({});
    setImportErrors([]);
    setImportedCount(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#102b20]/30 p-4 backdrop-blur-[2px]" onClick={handleClose}>
      <div onClick={(e) => e.stopPropagation()} className="my-6 w-full max-w-5xl rounded-lg border border-[#dfe6d7] bg-white p-5 shadow-[0_24px_60px_rgba(16,43,32,0.2)]">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-medium text-[#102b20]">Importer un fichier Excel</h3>
          <button type="button" onClick={handleClose} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#dfe6d7] text-[#5e7166] hover:bg-[#f3f8ef]">
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        {!preview && (
          <label className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#b8c6bc] bg-[#f6f9f2] p-10 text-center">
            {loading ? <Loader2 size={24} className="animate-spin text-[#0d6b4d]" aria-hidden="true" /> : <FileUp size={24} className="text-[#0d6b4d]" aria-hidden="true" />}
            <span className="text-sm font-bold text-[#102b20]">{loading ? "Lecture du fichier…" : "Cliquez pour choisir un fichier .xlsx ou .xls"}</span>
            <span className="text-xs font-semibold text-[#6c7c71]">Les colonnes TRAIN / DA / DB / Silos / Début / fin seront détectées automatiquement.</span>
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} disabled={loading} />
          </label>
        )}

        {importErrors.length > 0 && preview === null && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-[#f3c9a8] bg-[#fdece0] px-3 py-2.5 text-xs font-bold text-[#a5460f]">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            {importErrors[0].message}
          </div>
        )}

        {preview && (
          <>
            <div className="mt-5">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-[#5e7166]">Correspondance des colonnes</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {IMPORT_TARGET_FIELDS.map((field) => (
                  <label key={field} className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#5e7166]">{FIELD_LABELS[field]}</span>
                    <select
                      value={mapping[field] ?? ""}
                      onChange={(e) => setMapping((prev) => ({ ...prev, [field]: e.target.value === "" ? undefined : Number(e.target.value) }))}
                      className="h-9 rounded-md border border-[#dfe6d7] bg-white px-2 text-xs font-semibold text-[#102b20] outline-none focus:border-[#0d6b4d]"
                    >
                      <option value="">— non mappé —</option>
                      {preview.headers.map((h, idx) => (
                        <option key={idx} value={idx}>
                          {h || `Colonne ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-[#5e7166]">
                Aperçu ({preview.rows.length} ligne{preview.rows.length > 1 ? "s" : ""} détectée{preview.rows.length > 1 ? "s" : ""})
              </p>
              <div className="mt-2 max-h-64 overflow-auto rounded-md border border-[#dfe6d7]">
                <table className="w-full min-w-[900px] border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-[#f3f8ef] text-left font-bold text-[#5e7166]">
                      {preview.headers.map((h, idx) => (
                        <th key={idx} className="border border-[#eef1ea] px-2 py-1">
                          {h || `Colonne ${idx + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 10).map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci} className="border border-[#eef1ea] px-2 py-1 text-[#314238]">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {importErrors.length > 0 && (
              <div className="mt-4 rounded-md border border-[#f3c9a8] bg-[#fdece0] p-3">
                <p className="flex items-center gap-1.5 text-xs font-black text-[#a5460f]">
                  <AlertTriangle size={13} aria-hidden="true" />
                  {importErrors.length} anomalie(s) détectée(s)
                </p>
                <ul className="mt-1.5 flex max-h-32 flex-col gap-1 overflow-y-auto text-[11px] font-semibold text-[#a5460f]">
                  {importErrors.map((err, i) => (
                    <li key={i}>
                      • Ligne {err.rowNumber} : {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {importedCount !== null && importedCount > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-md border border-[#b9ddc9] bg-[#eef8f1] px-3 py-2.5 text-xs font-bold text-[#237343]">
                <CheckCircle2 size={14} aria-hidden="true" />
                {importedCount} ligne(s) importée(s) dans le tableau.
              </div>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={handleConfirmImport}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-[#0d6b4d] px-5 text-sm font-bold text-white transition hover:bg-[#0a563d]"
              >
                <Upload size={15} aria-hidden="true" />
                Importer dans le tableau
              </button>
              <button type="button" onClick={handleClose} className="text-xs font-bold text-[#5e7166] hover:text-[#102b20]">
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
