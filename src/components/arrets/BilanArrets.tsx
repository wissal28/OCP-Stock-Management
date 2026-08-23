import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, BookOpen, Clock, Gauge } from "lucide-react";
import { NAVIRE_PORTIQUES, type ArretNavire } from "../navire/navireData";
import { FAMILLES_ARRETS, type ArretTrain } from "../train/trainData";
import {
  buildBilanBlock,
  combineBilanBlocks,
  currentYearMonth,
  daysInMonth,
  filterByMonth,
  formatHours,
  formatPct,
  rankCauses,
  type BilanBlock
} from "./arretsBilanRules";
import * as api from "../../api";

const AXES_TRAIN = ["DA10", "DB10"];

const cardClass = "rounded-lg border border-[#dfe6d7] bg-white/90 p-4 shadow-[0_16px_42px_rgba(16,43,32,0.06)]";

function BlockTable({ block }: { block: BilanBlock }) {
  if (block.total.totalMinutes === 0) {
    return <p className="text-xs font-semibold text-[#829187]">Aucun arrêt enregistré sur cette période.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-md border border-[#dfe6d7]">
      <table className="w-full min-w-[640px] border-collapse text-xs">
        <thead>
          <tr className="border-b border-[#dfe6d7] bg-[#f3f8ef] text-left font-black uppercase tracking-[0.04em] text-[#5e7166]">
            <th className="sticky left-0 z-10 bg-[#f3f8ef] px-3 py-2.5">Équipement</th>
            {block.activeNatures.map((n) => (
              <th key={n} className="px-3 py-2.5 whitespace-nowrap">
                {n}
              </th>
            ))}
            <th className="px-3 py-2.5 whitespace-nowrap">Total</th>
            <th className="px-3 py-2.5 whitespace-nowrap">%</th>
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row) => (
            <tr key={row.label} className="border-b border-[#eef1ea] last:border-0 hover:bg-[#f6f9f2]">
              <td className="sticky left-0 z-10 bg-white px-3 py-2 font-black text-[#102b20]">{row.label}</td>
              {block.activeNatures.map((n) => {
                const minutes = row.byNature.get(n) ?? 0;
                return (
                  <td key={n} className="px-3 py-2 font-semibold text-[#314238]">
                    {minutes > 0 ? formatHours(minutes) : "—"}
                  </td>
                );
              })}
              <td className="px-3 py-2 font-black text-[#102b20]">{formatHours(row.totalMinutes)}</td>
              <td className="px-3 py-2 font-bold text-[#0d6b4d]">{formatPct(row.pctOfBlock)}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-[#cfe3d8] bg-[#e8f4ed] font-black text-[#0d6b4d]">
            <td className="sticky left-0 z-10 bg-[#e8f4ed] px-3 py-2.5">Total</td>
            {block.activeNatures.map((n) => (
              <td key={n} className="px-3 py-2.5">
                {formatHours(block.total.byNature.get(n) ?? 0)}
              </td>
            ))}
            <td className="px-3 py-2.5">{formatHours(block.total.totalMinutes)}</td>
            <td className="px-3 py-2.5">100%</td>
          </tr>
          <tr className="border-t border-dashed border-[#dfe6d7] text-[#829187]">
            <td className="sticky left-0 z-10 bg-white px-3 py-2 font-bold uppercase tracking-[0.04em]">% de la cause</td>
            {block.activeNatures.map((n) => (
              <td key={n} className="px-3 py-2 font-semibold">
                {formatPct(block.natureShareOfTotal.get(n) ?? 0)}
              </td>
            ))}
            <td className="px-3 py-2" colSpan={2} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TrsBadges({ block }: { block: BilanBlock }) {
  const t = block.total;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-bold text-[#5e7166]">
      <span className="flex items-center gap-1.5">
        <Gauge size={13} className="text-[#0d6b4d]" aria-hidden="true" />
        TRS exploitation : <span className="text-[#102b20]">{t.trsExploitation !== null ? formatPct(t.trsExploitation) : "—"}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <Gauge size={13} className="text-[#0d6b4d]" aria-hidden="true" />
        TRS maintenance : <span className="text-[#102b20]">{t.trsMaintenance !== null ? formatPct(t.trsMaintenance) : "—"}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <Gauge size={13} className="text-[#0d6b4d]" aria-hidden="true" />
        TRS Global : <span className="text-[#102b20]">{t.trsGlobal !== null ? formatPct(t.trsGlobal) : "—"}</span>
      </span>
      {t.ongoing > 0 && (
        <span className="flex items-center gap-1.5 text-[#a5460f]">
          <AlertTriangle size={13} aria-hidden="true" />
          {t.ongoing} arrêt(s) en cours (exclus du calcul)
        </span>
      )}
    </div>
  );
}

/**
 * Module "Bilan des arrêts" — réplique la feuille "Synthèses" du classeur source "Bilan et
 * synthèses des arrêts du JUIN 2026" : croise chaque équipement (portiques CA30-CD30 pour le
 * chargement navire, flux DA10/DB10 pour le déchargement train) avec les causes d'arrêt, calcule
 * les % et le TRS (Taux de Rendement Synthétique), pour une période choisie. Purement analytique —
 * aucune donnée propre, tout est recalculé depuis les arrêts déjà saisis dans Gestion de navires et
 * Gestion de train (mêmes tables que "Analyse des arrêts" sur chaque fiche, agrégées ici par mois).
 */
export default function BilanArrets() {
  const [month, setMonth] = useState(currentYearMonth());
  const [arretsNavire, setArretsNavire] = useState<ArretNavire[]>([]);
  const [arretsTrain, setArretsTrain] = useState<ArretTrain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.listArrets(), api.listArretsTrain()])
      .then(([navire, train]) => {
        setArretsNavire(navire);
        setArretsTrain(train);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const { chargementBlock, dechargementBlock, totalBlock, topCauses, navireMonthCount, trainMonthCount } = useMemo(() => {
    const navireMonth = filterByMonth(arretsNavire, month);
    const trainMonth = filterByMonth(arretsTrain, month);
    const periodeMinutes = daysInMonth(month) * 24 * 60;

    const chargementGroups = NAVIRE_PORTIQUES.map((p) => ({ label: p, arrets: navireMonth.filter((a) => a.portique === p) }));
    const dechargementGroups = AXES_TRAIN.map((axe) => ({ label: axe, arrets: trainMonth.filter((a) => a.axe === axe) }));
    const nonPrecise = trainMonth.filter((a) => !AXES_TRAIN.includes(a.axe));
    if (nonPrecise.length > 0) dechargementGroups.push({ label: "Non précisé", arrets: nonPrecise });

    const chargement = buildBilanBlock("Chargement des navires (par portique)", chargementGroups, periodeMinutes);
    const dechargement = buildBilanBlock("Déchargement des trains (par flux)", dechargementGroups, periodeMinutes);
    const total = combineBilanBlocks("Total combiné", [chargement, dechargement]);

    return {
      chargementBlock: chargement,
      dechargementBlock: dechargement,
      totalBlock: total,
      topCauses: rankCauses([...navireMonth, ...trainMonth]).slice(0, 10),
      navireMonthCount: navireMonth.length,
      trainMonthCount: trainMonth.length
    };
  }, [arretsNavire, arretsTrain, month]);

  const topCausesMax = topCauses[0]?.minutes ?? 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">Module métier</p>
          <h1 className="font-display mt-1 text-2xl font-medium text-[#102b20]">Bilan des arrêts</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#6c7c71]">
            Tableau croisé équipement × cause et TRS, sur le modèle du classeur "Bilan et synthèses des arrêts" — calculé à partir des
            arrêts déjà saisis dans Gestion de navires et Gestion de train.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-[#5e7166]">
          Période
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-10 rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-bold text-[#314238] outline-none transition focus:border-[#0d6b4d]"
          />
        </label>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-lg border border-[#dfe6d7] bg-white/70" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className={cardClass}>
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
                <BarChart3 size={13} aria-hidden="true" />
                Arrêts (navires)
              </p>
              <p className="font-display mt-2 text-2xl font-medium text-[#102b20]">{navireMonthCount}</p>
            </div>
            <div className={cardClass}>
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
                <BarChart3 size={13} aria-hidden="true" />
                Arrêts (trains)
              </p>
              <p className="font-display mt-2 text-2xl font-medium text-[#102b20]">{trainMonthCount}</p>
            </div>
            <div className={cardClass}>
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
                <Clock size={13} aria-hidden="true" />
                Durée totale perdue
              </p>
              <p className="font-display mt-2 text-2xl font-medium text-[#102b20]">{formatHours(totalBlock.total.totalMinutes)}</p>
            </div>
            <div className={cardClass}>
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
                <Gauge size={13} aria-hidden="true" />
                TRS Global combiné
              </p>
              <p className="font-display mt-2 text-2xl font-medium text-[#102b20]">
                {totalBlock.total.trsGlobal !== null ? formatPct(totalBlock.total.trsGlobal) : "—"}
              </p>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className="font-display text-base font-medium text-[#102b20]">{chargementBlock.label}</h2>
            <div className="mt-3">
              <BlockTable block={chargementBlock} />
            </div>
            <TrsBadges block={chargementBlock} />
          </div>

          <div className={cardClass}>
            <h2 className="font-display text-base font-medium text-[#102b20]">{dechargementBlock.label}</h2>
            <div className="mt-3">
              <BlockTable block={dechargementBlock} />
            </div>
            <TrsBadges block={dechargementBlock} />
          </div>

          <div className={cardClass}>
            <h2 className="font-display text-base font-medium text-[#102b20]">{totalBlock.label}</h2>
            <div className="mt-3">
              <BlockTable block={totalBlock} />
            </div>
            <TrsBadges block={totalBlock} />
          </div>

          <div className={cardClass}>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
              <BarChart3 size={13} aria-hidden="true" />
              Principales causes d'arrêt (toutes activités confondues)
            </p>
            {topCauses.length === 0 ? (
              <p className="mt-2 text-xs font-semibold text-[#829187]">Aucun arrêt enregistré sur cette période.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {topCauses.map((c) => (
                  <div key={c.nature} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-xs font-bold text-[#314238]">{c.nature}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#eef1ea]">
                      <div
                        className="h-full rounded-full bg-[#0d6b4d]"
                        style={{ width: `${topCausesMax > 0 ? Math.round((c.minutes / topCausesMax) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-xs font-black text-[#102b20]">{formatHours(c.minutes)}</span>
                    <span className="w-14 shrink-0 text-right text-[11px] font-semibold text-[#829187]">{c.count}×</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={cardClass}>
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
              <BookOpen size={13} aria-hidden="true" />
              Glossaire des familles d'arrêts
            </p>
            <div className="mt-3 overflow-x-auto rounded-md border border-[#dfe6d7]">
              <table className="w-full min-w-[560px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#dfe6d7] bg-[#f3f8ef] text-left font-black uppercase tracking-[0.04em] text-[#5e7166]">
                    <th className="px-3 py-2">Cause</th>
                    <th className="px-3 py-2">Exemples</th>
                  </tr>
                </thead>
                <tbody>
                  {FAMILLES_ARRETS.map((f) => (
                    <tr key={f.nature} className="border-b border-[#eef1ea] last:border-0">
                      <td className="px-3 py-2 font-black text-[#102b20]">{f.nature}</td>
                      <td className="px-3 py-2 text-[#6c7c71]">{f.exemples || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
