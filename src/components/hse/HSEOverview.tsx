import { CalendarCheck, ClipboardCheck, KanbanSquare, ShieldCheck, TriangleAlert } from "lucide-react";
import type { HSEAction, HSEIncident, HSEInspection } from "./hseData";
import {
  actionsEnRetard,
  incidentsOuverts,
  incidentsParMois,
  inspectionsAPlanifier,
  joursSansAccident,
  repartitionParGravite,
  tauxConformiteInspections
} from "./hseRules";

const kpiCardClass = "rounded-lg border border-[#dfe6d7] bg-white/90 p-4";
const kpiLabelClass = "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]";
const kpiValueClass = "font-display mt-2 text-2xl font-medium text-[#102b20]";

const GRAVITE_COLOR: Record<string, string> = {
  Mineur: "#0d6b4d",
  "Modéré": "#a5460f",
  Grave: "#9a2f2f",
  "Très grave": "#7a1f1f"
};

export default function HSEOverview({
  incidents,
  inspections,
  actions
}: {
  incidents: HSEIncident[];
  inspections: HSEInspection[];
  actions: HSEAction[];
}) {
  const jours = joursSansAccident(incidents);
  const ouverts = incidentsOuverts(incidents);
  const taux = tauxConformiteInspections(inspections);
  const aPlanifier = inspectionsAPlanifier(inspections);
  const enRetard = actionsEnRetard(actions);
  const repartition = repartitionParGravite(incidents);
  const parMois = incidentsParMois(incidents, 6);
  const maxMois = Math.max(1, ...parMois.map((m) => m.count));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className={kpiCardClass}>
          <p className={kpiLabelClass}>
            <ShieldCheck size={13} aria-hidden="true" />
            Jours sans accident
          </p>
          <p className={kpiValueClass}>{jours === null ? "—" : jours}</p>
          {jours === null && <p className="mt-1 text-[10px] font-semibold text-[#829187]">Aucun accident enregistré</p>}
        </div>
        <div className={kpiCardClass}>
          <p className={kpiLabelClass}>
            <TriangleAlert size={13} aria-hidden="true" />
            Incidents ouverts
          </p>
          <p className={`${kpiValueClass} ${ouverts.length > 0 ? "text-[#a5460f]" : ""}`}>{ouverts.length}</p>
        </div>
        <div className={kpiCardClass}>
          <p className={kpiLabelClass}>
            <ClipboardCheck size={13} aria-hidden="true" />
            Taux conformité inspections
          </p>
          <p className={kpiValueClass}>{taux}%</p>
        </div>
        <div className={kpiCardClass}>
          <p className={kpiLabelClass}>
            <CalendarCheck size={13} aria-hidden="true" />
            Inspections à planifier
          </p>
          <p className={`${kpiValueClass} ${aPlanifier.length > 0 ? "text-[#a5460f]" : ""}`}>{aPlanifier.length}</p>
        </div>
        <div className={kpiCardClass}>
          <p className={kpiLabelClass}>
            <KanbanSquare size={13} aria-hidden="true" />
            Actions en retard
          </p>
          <p className={`${kpiValueClass} ${enRetard.length > 0 ? "text-[#a5460f]" : ""}`}>{enRetard.length}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.1em] text-[#5e7166]">Incidents/accidents par mois</p>
          <div className="flex h-32 items-end gap-3">
            {parMois.map((m) => (
              <div key={m.mois} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-black text-[#102b20]">{m.count || ""}</span>
                <div
                  className="w-full rounded-t-[4px] bg-[#0d6b4d]"
                  style={{ height: `${Math.max(4, (m.count / maxMois) * 100)}%`, backgroundColor: m.count > 0 ? "#0d6b4d" : "#eef1ea" }}
                />
                <span className="text-[9px] font-bold text-[#829187]">{m.mois.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.1em] text-[#5e7166]">Répartition par gravité</p>
          {repartition.length === 0 ? (
            <p className="text-xs font-semibold text-[#829187]">Aucun incident enregistré.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {repartition.map((r) => (
                <div key={r.gravite} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-xs font-bold text-[#314238]">{r.gravite}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#f3f8ef]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(r.count / Math.max(1, incidents.length)) * 100}%`,
                        backgroundColor: GRAVITE_COLOR[r.gravite] ?? "#5e7166"
                      }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs font-black text-[#102b20]">{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(ouverts.length > 0 || aPlanifier.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {ouverts.length > 0 && (
            <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.1em] text-[#5e7166]">Incidents à traiter</p>
              <div className="flex flex-col gap-1.5">
                {ouverts.slice(0, 5).map((i) => (
                  <div key={i.id} className="flex items-center justify-between rounded-md border border-[#eef1ea] bg-[#f6f9f2] px-3 py-2 text-xs">
                    <span className="font-black text-[#102b20]">
                      {i.type} <span className="font-semibold text-[#6c7c71]">· {i.zone}</span>
                    </span>
                    <span className="font-bold text-[#a5460f]">{i.statut}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {aPlanifier.length > 0 && (
            <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.1em] text-[#5e7166]">Inspections en retard / dues</p>
              <div className="flex flex-col gap-1.5">
                {aPlanifier.slice(0, 5).map((i) => (
                  <div key={i.id} className="flex items-center justify-between rounded-md border border-[#eef1ea] bg-[#f6f9f2] px-3 py-2 text-xs">
                    <span className="font-black text-[#102b20]">
                      {i.type} <span className="font-semibold text-[#6c7c71]">· {i.zone}</span>
                    </span>
                    <span className="font-bold text-[#a5460f]">{i.dateProchaineInspection}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
