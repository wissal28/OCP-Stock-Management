import { useEffect, useState } from "react";
import { CalendarClock, RefreshCw } from "lucide-react";
import type { StockSnapshot } from "./stockData";
import { getCurrentOperationalDay, getOperationalDayRange } from "./stockRules";
import StockGrid from "./StockGrid";
import StockQualitePanel from "./StockQualitePanel";
import * as api from "../../api";

const selectClass =
  "h-10 rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-bold text-[#314238] outline-none transition focus:border-[#0d6b4d]";

/** Onglet "Historique" de Gestion de stock — reçoit les snapshots du parent (état partagé avec
 * l'onglet "État de stock") au lieu de les refetcher, pour rester synchronisé sans latence quand une
 * cellule est modifiée depuis l'autre onglet. */
export default function HistoriqueStock({
  snapshots,
  onRefresh
}: {
  snapshots: StockSnapshot[];
  onRefresh: () => Promise<StockSnapshot[]>;
}) {
  const [selectedDate, setSelectedDate] = useState(snapshots[0]?.date ?? "");
  const [backfilling, setBackfilling] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState("");
  const [recomputing, setRecomputing] = useState(false);
  const [recomputeMessage, setRecomputeMessage] = useState("");

  useEffect(() => {
    setSelectedDate((current) => (snapshots.some((s) => s.date === current) ? current : snapshots[0]?.date ?? ""));
  }, [snapshots]);

  async function handleBackfill() {
    setBackfilling(true);
    setBackfillMessage("");
    try {
      const result = await api.backfillStockSnapshots();
      await onRefresh();
      setBackfillMessage(
        result.created.length > 0
          ? `${result.created.length} journée(s) ajoutée(s) (${result.created[0]} → ${result.created[result.created.length - 1]}).`
          : "Historique déjà complet — aucune journée manquante."
      );
    } catch {
      setBackfillMessage("Échec du calcul de l'historique.");
    } finally {
      setBackfilling(false);
    }
  }

  /** Recalcule tout l'historique déjà enregistré (Lot 1+2) à partir des données actuellement en base
   * — utile après une correction des données sources (ex. re-import navire/train corrigé) pour que
   * l'historique reflète les chiffres corrigés plutôt que ceux calculés au moment du premier calcul. */
  async function handleRecomputeAll() {
    if (!window.confirm("Recalculer tout l'historique de stock (Lot 1+2) à partir des données actuelles ? Les écarts manuels et le Lot 3 sont conservés.")) return;
    setRecomputing(true);
    setRecomputeMessage("");
    try {
      const result = await api.recomputeAllStockSnapshots();
      await onRefresh();
      setRecomputeMessage(`${result.recomputed.length} journée(s) recalculée(s) sur ${result.totalDays}.`);
    } catch {
      setRecomputeMessage("Échec du recalcul de l'historique.");
    } finally {
      setRecomputing(false);
    }
  }

  const today = getCurrentOperationalDay();
  const selected = snapshots.find((s) => s.date === selectedDate) ?? snapshots[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-[#6c7c71]">
          Consultez l'état du stock à une date antérieure — chaque journée d'exploitation (7h00 → 7h00 le lendemain) est calculée à
          partir des entrées (trains) et sorties (navires) réelles de ce jour.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleBackfill}
            disabled={backfilling}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-[#cfe3d8] bg-[#e8f4ed] px-3.5 text-xs font-bold text-[#0d6b4d] transition hover:bg-[#d9edc8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={backfilling ? "animate-spin" : ""} aria-hidden="true" />
            {backfilling ? "Calcul en cours…" : "Compléter l'historique"}
          </button>
          <button
            type="button"
            onClick={handleRecomputeAll}
            disabled={recomputing}
            title="Recalcule chaque journée déjà enregistrée à partir des données de déchargement/chargement actuellement en base — utile après une correction des données sources"
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-[#dfe6d7] bg-white px-3.5 text-xs font-bold text-[#314238] transition hover:border-[#0d6b4d] hover:text-[#0d6b4d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={14} className={recomputing ? "animate-spin" : ""} aria-hidden="true" />
            {recomputing ? "Recalcul en cours…" : "Recalculer tout l'historique"}
          </button>
          <label className="flex items-center gap-2">
            <CalendarClock size={15} className="text-[#5e7166]" aria-hidden="true" />
            <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={selectClass}>
              {snapshots.map((s) => (
                <option key={s.date} value={s.date}>
                  {s.date === today ? `${s.date} (aujourd'hui)` : s.date}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {backfillMessage && <p className="text-xs font-bold text-[#0d6b4d]">{backfillMessage}</p>}
      {recomputeMessage && <p className="text-xs font-bold text-[#0d6b4d]">{recomputeMessage}</p>}

      {selected && (
        <>
          <p className="text-xs font-bold text-[#0d6b4d]">Journée d'exploitation : {getOperationalDayRange(selected.date).label}</p>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <StockGrid cellules={selected.cellules} zones={selected.zones} editable={false} />
            <StockQualitePanel snapshot={selected} />
          </div>
        </>
      )}
    </div>
  );
}
