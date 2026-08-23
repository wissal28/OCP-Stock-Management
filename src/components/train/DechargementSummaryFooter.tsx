import type { Dechargement, Train } from "./trainData";
import { calculateDailyTotals, formatHM } from "./dechargementRules";
import type { Density } from "./dechargementGridLayout";

export default function DechargementSummaryFooter({
  dechargements,
  trains,
  density = "normal"
}: {
  dechargements: Dechargement[];
  trains: Train[];
  density?: Density;
}) {
  const totals = calculateDailyTotals(dechargements, trains);
  const cell = `flex flex-col items-center justify-center gap-1 border border-[#e3d9bb] text-center ${density === "compact" ? "px-2 py-1.5" : "px-3 py-2.5"}`;
  const label = `font-black uppercase tracking-[0.04em] text-[#5a3d1f] ${density === "compact" ? "text-[9px]" : "text-[10px]"}`;
  const value = `font-black text-[#102b20] ${density === "compact" ? "text-xs" : "text-sm"}`;

  return (
    <div className="rounded-lg border border-[#dfe6d7] bg-white shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11">
        <div className={`${cell} bg-[#f6c99a]`}>
          <span className={label}>Nbre de train</span>
          <span className={`${value} text-[#a5460f]`}>{totals.nbTrains}</span>
        </div>
        <div className={`${cell} bg-[#f6c99a]`}>
          <span className={label}>Nbre de wagons</span>
          <span className={`${value} text-[#a5460f]`}>{totals.nbWagons}</span>
        </div>
        <div className={`${cell} bg-white`}>
          <span className={label.replace("text-[#5a3d1f]", "text-[#5e7166]")}>Durée</span>
          <span className={`${value} text-[#a5460f]`}>{formatHM(totals.dureeTotaleMinutes)}</span>
        </div>
        <div className={`${cell} bg-white`}>
          <span className={label.replace("text-[#5a3d1f]", "text-[#5e7166]")}>Moyenne</span>
          <span className={`${value} text-[#a5460f]`}>{formatHM(totals.dureeMoyenneMinutes)}</span>
        </div>
        <div className={`${cell} bg-[#fdf6d8]`}>
          <span className={label.replace("text-[#5a3d1f]", "text-[#6c5a2f]")}>Tonnage DA</span>
          <span className={`${value} text-[#8a5a10]`}>{totals.tonnageDA.toLocaleString("fr-FR")}</span>
        </div>
        <div className={`${cell} bg-[#fdf6d8]`}>
          <span className={label.replace("text-[#5a3d1f]", "text-[#6c5a2f]")}>Tonnage DB</span>
          <span className={`${value} text-[#8a5a10]`}>{totals.tonnageDB.toLocaleString("fr-FR")}</span>
        </div>
        <div className={`${cell} bg-[#cfe0f2]`}>
          <span className={label.replace("text-[#5a3d1f]", "text-[#1d4d75]")}>Total</span>
          <span className={`${value} text-[#1d4d75]`}>{totals.tonnageTotal.toLocaleString("fr-FR")}</span>
        </div>
        <div className={`${cell} bg-[#c3e0ac]`}>
          <span className={label.replace("text-[#5a3d1f]", "text-[#2f5320]")}>Durée affectation</span>
          <span className={`${value} text-[#2f5320]`}>{formatHM(totals.dureeAffectationMinutes)}</span>
        </div>
        <div className={`${cell} bg-white`}>
          <span className={label.replace("text-[#5a3d1f]", "text-[#5e7166]")}>Retard</span>
          <span className={`${value} ${totals.retardMinutes > 0 ? "text-[#a5460f]" : "text-[#102b20]"}`}>{formatHM(totals.retardMinutes)}</span>
        </div>
        <div className={`${cell} bg-white`}>
          <span className={label.replace("text-[#5a3d1f]", "text-[#5e7166]")}>Cadence (t/h)</span>
          <span className={value}>{totals.cadence ?? "—"}</span>
        </div>
        <div className={`${cell} bg-white`}>
          <span className={label.replace("text-[#5a3d1f]", "text-[#5e7166]")}>
            T<sub className="text-[8px]">D MAINT + EXPLOIT</sub>
          </span>
          <span className={value}>{formatHM(totals.tdMaintExploitMinutes)}</span>
        </div>
      </div>
    </div>
  );
}
