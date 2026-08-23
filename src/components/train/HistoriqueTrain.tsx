import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Dechargement, Train } from "./trainData";
import { calculateDailyTotals, calculateTotalByDestination, formatHM, getCurrentOperationalDay, groupDechargementsByOperationalDay } from "./dechargementRules";
import OperationalDayHeader from "./OperationalDayHeader";
import TrainFilters from "./TrainFilters";
import TrainFormModal from "./TrainFormModal";

const cardClass = "rounded-md border border-[#dfe6d7] bg-[#f6f9f2] px-3.5 py-2.5";
const cardLabel = "text-[10px] font-black uppercase tracking-[0.06em] text-[#5e7166]";
const cardValue = "mt-1 text-lg font-black text-[#102b20]";

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

/** Onglet "Historique" de Gestion des trains — reçoit trains/déchargements du parent (état partagé
 * avec Horaires & Déchargement) au lieu de les refetcher, pour rester synchronisé sans latence
 * quand on modifie une ligne depuis un autre onglet. */
export default function HistoriqueTrain({
  trains,
  dechargements,
  onUpdateDechargement,
  onDeleteDechargement
}: {
  trains: Train[];
  dechargements: Dechargement[];
  onUpdateDechargement: (dechargement: Dechargement) => void;
  onDeleteDechargement: (id: string) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Dechargement | null>(null);

  const currentOperationalDay = useMemo(() => getCurrentOperationalDay(), []);
  const groupedByDay = useMemo(() => groupDechargementsByOperationalDay(dechargements), [dechargements]);
  const days = useMemo(() => [...groupedByDay.keys()].sort((a, b) => (a < b ? 1 : -1)), [groupedByDay]);

  const activeDay = selectedDay && days.includes(selectedDay) ? selectedDay : days[0] ?? currentOperationalDay;
  const dayDechargements = groupedByDay.get(activeDay) ?? [];
  const filteredDechargements = dayDechargements.filter((d) => matchesQuery(d, query));
  const totals = activeDay ? calculateDailyTotals(dayDechargements, trains) : null;

  function handleDelete(dechargement: Dechargement) {
    if (!window.confirm(`Supprimer définitivement le déchargement du train ${dechargement.numeroTrain} ?`)) return;
    onDeleteDechargement(dechargement.id);
  }

  return (
    <div className="flex flex-col gap-5">
      <OperationalDayHeader activeDay={activeDay} days={days} onChange={setSelectedDay} totals={totals} />

      {totals && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className={cardClass}>
            <p className={cardLabel}>Trains</p>
            <p className={cardValue}>{totals.nbTrains}</p>
          </div>
          <div className={cardClass}>
            <p className={cardLabel}>Wagons</p>
            <p className={cardValue}>{totals.nbWagons}</p>
          </div>
          <div className={cardClass}>
            <p className={cardLabel}>Tonnage total</p>
            <p className={cardValue}>{totals.tonnageTotal.toLocaleString("fr-FR")} t</p>
          </div>
          <div className={cardClass}>
            <p className={cardLabel}>Cadence</p>
            <p className={cardValue}>{totals.cadence ? `${totals.cadence} t/h` : "—"}</p>
          </div>
          <div className={cardClass}>
            <p className={cardLabel}>Retard cumulé</p>
            <p className={cardValue}>{formatHM(totals.retardMinutes)}</p>
          </div>
          <div className={cardClass}>
            <p className={cardLabel}>Durée moyenne</p>
            <p className={cardValue}>{formatHM(Math.round(totals.dureeMoyenneMinutes))}</p>
          </div>
        </div>
      )}

      <TrainFilters query={query} onQueryChange={setQuery} />

      <div className="overflow-x-auto rounded-lg border border-[#dfe6d7] bg-white/90 shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#dfe6d7] bg-[#f3f8ef] text-left text-[11px] font-black uppercase tracking-[0.06em] text-[#5e7166]">
              <th className="px-4 py-3">N° train</th>
              <th className="px-4 py-3">Axe</th>
              <th className="px-4 py-3">Wagons</th>
              <th className="px-4 py-3">Début</th>
              <th className="px-4 py-3">Fin</th>
              <th className="px-4 py-3">T. expédié</th>
              <th className="px-4 py-3">T. bascule</th>
              <th className="px-4 py-3">Répartition</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredDechargements.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm font-bold text-[#6c7c71]">
                  Aucun déchargement pour cette journée.
                </td>
              </tr>
            ) : (
              filteredDechargements.map((d) => {
                const totalsByDest = calculateTotalByDestination(d);
                return (
                  <tr key={d.id} className="border-b border-[#eef1ea] last:border-0 hover:bg-[#f6f9f2]">
                    <td className="px-4 py-3 font-black text-[#102b20]">{d.numeroTrain}</td>
                    <td className="px-4 py-3 font-semibold text-[#314238]">{d.axe || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-[#314238]">{d.nombreWagons}</td>
                    <td className="px-4 py-3 font-semibold text-[#314238]">{d.debutDechargement || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-[#314238]">{d.finDechargement || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-[#314238]">{d.tonnageExpedie.toLocaleString("fr-FR")} t</td>
                    <td className="px-4 py-3 font-semibold text-[#314238]">{d.tonnageBascule.toLocaleString("fr-FR")} t</td>
                    <td className="px-4 py-3 text-xs font-bold text-[#0d6b4d]">
                      DA {totalsByDest.da.toLocaleString("fr-FR")} · DB {totalsByDest.db.toLocaleString("fr-FR")} · Silos{" "}
                      {totalsByDest.silos.toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditing(d)}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#cfe3d8] bg-[#e8f4ed] text-[#0d6b4d] hover:bg-[#d9edc8]"
                          title="Modifier ce déchargement"
                        >
                          <Pencil size={13} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(d)}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#f0c2c2] bg-[#fbe9e9] text-[#9a2f2f] hover:bg-[#f6d5d5]"
                          title="Supprimer ce déchargement"
                        >
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TrainFormModal
        open={editing !== null}
        initial={editing}
        defaultDate={activeDay}
        onClose={() => setEditing(null)}
        onSubmit={onUpdateDechargement}
      />
    </div>
  );
}
