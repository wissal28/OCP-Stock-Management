import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import type { Dechargement, Train } from "./trainData";
import { exportDechargementsToExcelAdvanced } from "./excelExportService";

export default function ExportExcelButton({
  dechargements,
  trains,
  operationalDay
}: {
  dechargements: Dechargement[];
  trains: Train[];
  operationalDay: string | null;
}) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (!operationalDay || loading) return;
    setLoading(true);
    try {
      await exportDechargementsToExcelAdvanced(dechargements, operationalDay, trains);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={!operationalDay || loading}
      className="flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-bold text-[#314238] transition hover:bg-[#f3f8ef] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <FileSpreadsheet size={13} aria-hidden="true" />}
      Exporter Excel
    </button>
  );
}
