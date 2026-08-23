import { useMemo } from "react";
import { AlertTriangle, CalendarClock, Gauge, PackageCheck, TrainFront, Weight } from "lucide-react";
import type { Dechargement, Train } from "./trainData";
import { calculateDailyTotals, formatHM, getCurrentOperationalDay, groupDechargementsByOperationalDay } from "./dechargementRules";

const kpiCardClass = "rounded-lg border border-[#dfe6d7] bg-white/90 p-4";
const kpiLabelClass = "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]";
const kpiValueClass = "font-display mt-2 text-2xl font-medium text-[#102b20]";

/** Onglet "Vue d'ensemble" de Gestion des trains — première chose vue en ouvrant le module : les
 * chiffres clés de la journée en cours, plus ce qui arrive et ce qui vient de se terminer, sans avoir
 * à naviguer entre Horaires/Déchargement/Historique pour se faire une idée de l'activité du jour. */
export default function TrainOverview({ trains, dechargements }: { trains: Train[]; dechargements: Dechargement[] }) {
  const today = useMemo(() => getCurrentOperationalDay(), []);
  const groupedByDay = useMemo(() => groupDechargementsByOperationalDay(dechargements), [dechargements]);
  const todayDechargements = groupedByDay.get(today) ?? [];
  const totals = calculateDailyTotals(todayDechargements, trains);

  const enRetard = trains.filter((t) => t.statut === "En retard");
  const prochains = trains
    .filter((t) => t.statut === "Prévu")
    .sort((a, b) => `${a.dateArriveePrevue}${a.heureArriveePrevue}`.localeCompare(`${b.dateArriveePrevue}${b.heureArriveePrevue}`))
    .slice(0, 5);
  const dernierDecharges = [...dechargements]
    .filter((d) => d.finDechargement)
    .sort((a, b) => `${b.date}${b.finDechargement}`.localeCompare(`${a.date}${a.finDechargement}`))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs font-bold text-[#0d6b4d]">Journée d'exploitation en cours : {today} (7h00 → 7h00 le lendemain)</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className={kpiCardClass}>
          <p className={kpiLabelClass}>
            <TrainFront size={13} aria-hidden="true" />
            Trains aujourd'hui
          </p>
          <p className={kpiValueClass}>{totals.nbTrains}</p>
        </div>
        <div className={kpiCardClass}>
          <p className={kpiLabelClass}>
            <PackageCheck size={13} aria-hidden="true" />
            Wagons
          </p>
          <p className={kpiValueClass}>{totals.nbWagons}</p>
        </div>
        <div className={kpiCardClass}>
          <p className={kpiLabelClass}>
            <Weight size={13} aria-hidden="true" />
            Tonnage total
          </p>
          <p className={kpiValueClass}>{totals.tonnageTotal.toLocaleString("fr-FR")} t</p>
        </div>
        <div className={kpiCardClass}>
          <p className={kpiLabelClass}>
            <Gauge size={13} aria-hidden="true" />
            Cadence
          </p>
          <p className={kpiValueClass}>{totals.cadence ? `${totals.cadence} t/h` : "—"}</p>
        </div>
        <div className={kpiCardClass}>
          <p className={kpiLabelClass}>
            <CalendarClock size={13} aria-hidden="true" />
            Retard cumulé
          </p>
          <p className={kpiValueClass}>{formatHM(totals.retardMinutes)}</p>
        </div>
        <div className={kpiCardClass}>
          <p className={kpiLabelClass}>
            <AlertTriangle size={13} aria-hidden="true" />
            En retard
          </p>
          <p className={`${kpiValueClass} ${enRetard.length > 0 ? "text-[#a5460f]" : ""}`}>{enRetard.length}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.1em] text-[#5e7166]">
            <CalendarClock size={13} aria-hidden="true" />
            Prochains trains attendus
          </p>
          {prochains.length === 0 ? (
            <p className="text-xs font-semibold text-[#829187]">Aucun train prévu pour le moment.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {prochains.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-md border border-[#eef1ea] bg-[#f6f9f2] px-3 py-2 text-xs">
                  <span className="font-black text-[#102b20]">
                    Train {t.numeroTrain} <span className="font-semibold text-[#6c7c71]">· {t.qualite}</span>
                  </span>
                  <span className="font-bold text-[#314238]">
                    {t.dateArriveePrevue} · {t.heureArriveePrevue}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.1em] text-[#5e7166]">
            <PackageCheck size={13} aria-hidden="true" />
            Derniers déchargements terminés
          </p>
          {dernierDecharges.length === 0 ? (
            <p className="text-xs font-semibold text-[#829187]">Aucun déchargement terminé pour le moment.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {dernierDecharges.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-md border border-[#eef1ea] bg-[#f6f9f2] px-3 py-2 text-xs">
                  <span className="font-black text-[#102b20]">
                    Train {d.numeroTrain} <span className="font-semibold text-[#6c7c71]">· {d.axe || "—"}</span>
                  </span>
                  <span className="font-bold text-[#314238]">{d.tonnageBascule.toLocaleString("fr-FR")} t</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
