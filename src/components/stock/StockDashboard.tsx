import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Gauge as GaugeIcon, Layers, PieChart, Ship, TrainFront, TrendingUp } from "lucide-react";
import type { StockSnapshot } from "./stockData";
import {
  computeStockParLot,
  computeStockParQualite,
  computeTauxGlobal,
  computeTotalStock,
  getCurrentOperationalDay,
  getNaviresParPoste,
  isMortCritique,
  readNaviresFromApi,
  readStockSnapshots,
  readTrainsFromApi,
  resolveTodaySnapshot,
  totalCapacite
} from "./stockRules";
import { getOperationalDay } from "../train/trainRules";
import type { Navire } from "../navire/navireData";
import type { Train } from "../train/trainData";
import { lighten } from "./colorUtils";
import StockLayoutMap from "./StockLayoutMap";
import StockTrendChart from "./StockTrendChart";
import StockQualityBreakdown from "./StockQualityBreakdown";
import StockLotDonut from "./StockLotDonut";
import MiniSparkline from "./MiniSparkline";
import OperationsSummary from "./OperationsSummary";

// Représentation dynamique du remplissage des cellules — actualisée en direct depuis la base de
// données (pas de calcul local dupliqué : mêmes fonctions que StockGrid/StockQualitePanel).
const REFRESH_MS = 20000;

interface Delta {
  up: boolean;
  good: boolean;
  text: string;
}

/** Formate une variation vs la veille pour une carte KPI. `invert` inverse la lecture bon/mauvais
 * (ex. une hausse du nombre de cellules à déboucher est une dégradation, pas une amélioration). */
function formatDelta(delta: number | null, opts: { suffix?: string; invert?: boolean; decimals?: number } = {}): Delta | null {
  if (delta === null || Math.round(delta * 1000) === 0) return null;
  const { suffix = "", invert = false, decimals = 0 } = opts;
  const up = delta > 0;
  const factor = 10 ** decimals;
  const rounded = Math.abs(Math.round(delta * factor) / factor);
  return { up, good: invert ? !up : up, text: `${up ? "+" : "−"}${rounded.toLocaleString("fr-FR")}${suffix}` };
}

function KpiCard({
  icon,
  label,
  value,
  valueColor,
  sub,
  delta,
  sparkline,
  accent
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  sub?: string;
  delta?: Delta | null;
  sparkline?: number[];
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4 transition-shadow duration-200 hover:shadow-[0_12px_32px_rgba(16,43,32,0.08)]">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: lighten(accent, 0.88), color: accent }}>
            {icon}
          </span>
          {label}
        </p>
        {delta && (
          <span
            className={`flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
              delta.good ? "bg-[#e7f3ec] text-[#0d6b4d]" : "bg-[#fbeae8] text-[#9a2f2f]"
            }`}
          >
            {delta.up ? <ArrowUpRight size={11} aria-hidden="true" /> : <ArrowDownRight size={11} aria-hidden="true" />}
            {delta.text}
          </span>
        )}
      </div>
      <p className="font-display mt-2 text-2xl font-medium" style={{ color: valueColor ?? "#102b20" }}>
        {value}
      </p>
      {sub && <p className="mt-1 text-[10px] font-semibold text-[#829187]">{sub}</p>}
      {sparkline && sparkline.length >= 2 && (
        <div className="-mb-1 mt-2">
          <MiniSparkline values={sparkline} color={accent} />
        </div>
      )}
    </div>
  );
}

export default function StockDashboard({ onNavigate }: { onNavigate?: (view: "bilan-arrets" | "maintenance" | "hse") => void }) {
  const [snapshot, setSnapshot] = useState<StockSnapshot | null>(null);
  const [history, setHistory] = useState<StockSnapshot[]>([]);
  const [navires, setNavires] = useState<Navire[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function refresh() {
    const snapshots = await readStockSnapshots();
    const { snapshot: todaySnapshot } = resolveTodaySnapshot(snapshots);
    setSnapshot(todaySnapshot);
    setHistory(snapshots.some((s) => s.date === todaySnapshot.date) ? snapshots : [todaySnapshot, ...snapshots]);
    setNavires(await readNaviresFromApi());
    setTrains(await readTrainsFromApi());
    setLastRefresh(new Date());
  }

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, REFRESH_MS);
    return () => window.clearInterval(interval);
  }, []);

  // history est trié du plus récent au plus ancien (voir readStockSnapshots) — on le retrie en ordre
  // chronologique pour les mini-tendances des cartes KPI, comme StockTrendChart le fait déjà pour le
  // graphique principal.
  const sparkHistory = useMemo(() => [...history].sort((a, b) => a.date.localeCompare(b.date)).slice(-10), [history]);

  if (!snapshot) {
    return <div className="h-64 animate-pulse rounded-lg border border-[#dfe6d7] bg-white/70" />;
  }

  const previous = history[1] ?? null;

  const nbAlertes = snapshot.cellules.filter((c) => isMortCritique(c.tonnageMort, c.capaciteTotale)).length;
  const nbAlertesPrev = previous ? previous.cellules.filter((c) => isMortCritique(c.tonnageMort, c.capaciteTotale)).length : null;

  const totalVif = computeTotalStock(snapshot);
  const totalVifPrev = previous ? computeTotalStock(previous) : null;

  const totalCap = totalCapacite(snapshot.cellules);
  const tauxGlobal = computeTauxGlobal(snapshot.cellules);
  const tauxGlobalPrev = previous ? computeTauxGlobal(previous.cellules) : null;

  const postes = getNaviresParPoste(navires);
  const today = getCurrentOperationalDay();
  const trainsDuJour = trains.filter((t) => getOperationalDay(t.dateArriveePrevue, t.heureArriveeReelle || t.heureArriveePrevue) === today);

  const qualiteTotals = computeStockParQualite(snapshot);
  const lotTotals = computeStockParLot(snapshot);

  const vifSpark = sparkHistory.map((s) => computeTotalStock(s));
  const tauxSpark = sparkHistory.map((s) => computeTauxGlobal(s.cellules));

  const deltaVif = formatDelta(totalVifPrev !== null ? totalVif - totalVifPrev : null, { suffix: " t" });
  const deltaTaux = formatDelta(tauxGlobalPrev !== null ? tauxGlobal - tauxGlobalPrev : null, { suffix: " pt", decimals: 1 });
  const deltaAlertes = formatDelta(nbAlertesPrev !== null ? nbAlertes - nbAlertesPrev : null, { invert: true });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">Tableau de bord</p>
          <h1 className="font-display mt-1 text-2xl font-medium text-[#102b20]">Occupation des lots en temps réel</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#6c7c71]">
            Quantités et taux de remplissage des cellules, actualisés automatiquement toutes les {REFRESH_MS / 1000}s.
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-[#dfe6d7] bg-white/80 px-3 py-1.5 text-[11px] font-bold text-[#5e7166]">
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0d6b4d] opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#0d6b4d]" />
          </span>
          {lastRefresh ? `En direct · actualisé à ${lastRefresh.toLocaleTimeString("fr-FR")}` : "Connexion…"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          icon={<TrendingUp size={13} aria-hidden="true" />}
          label="Stock vif total"
          value={`${totalVif.toLocaleString("fr-FR")} t`}
          delta={deltaVif}
          sparkline={vifSpark}
          accent="#0d6b4d"
        />
        <KpiCard
          icon={<GaugeIcon size={13} aria-hidden="true" />}
          label="Taux moyen (Lots 1+2)"
          value={`${tauxGlobal}%`}
          sub={`Capacité totale : ${totalCap.toLocaleString("fr-FR")} t`}
          delta={deltaTaux}
          sparkline={tauxSpark}
          accent="#1d6fa5"
        />
        <KpiCard
          icon={<AlertTriangle size={13} aria-hidden="true" />}
          label="Cellules à déboucher"
          value={String(nbAlertes)}
          valueColor={nbAlertes > 0 ? "#9a2f2f" : undefined}
          sub="Stock mort ≥ 60% de la capacité"
          delta={deltaAlertes}
          accent="#9a2f2f"
        />
        <KpiCard
          icon={<Ship size={13} aria-hidden="true" />}
          label="Navires en chargement"
          value={String(postes.length)}
          sub={postes.length > 0 ? `Postes : ${postes.map((p) => p.poste).join(", ")}` : "Aucun poste occupé"}
          accent="#c2872f"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[0.1em] text-[#5e7166]">Évolution du stock vif total</h2>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#829187]">
              <span className="inline-block h-[2px] w-4 rounded-full bg-[#0d6b4d]" aria-hidden="true" />
              Stock vif (t)
            </span>
          </div>
          <StockTrendChart snapshots={history} />
        </div>

        <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.1em] text-[#5e7166]">
            <PieChart size={13} aria-hidden="true" />
            Répartition par qualité
          </h2>
          <StockQualityBreakdown data={qualiteTotals} total={totalVif} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.1em] text-[#5e7166]">
            <Layers size={13} aria-hidden="true" />
            Stock vif par lot
          </h2>
          <StockLotDonut data={lotTotals} />
        </div>

        <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.1em] text-[#5e7166]">
            <TrainFront size={13} aria-hidden="true" />
            Trains du jour ({trainsDuJour.length})
          </p>
          {trainsDuJour.length === 0 ? (
            <p className="text-xs font-semibold text-[#829187]">Aucun train prévu sur la journée en cours.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {trainsDuJour.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-md border border-[#eef1ea] bg-[#f6f9f2] px-3 py-2 text-xs">
                  <span className="font-black text-[#102b20]">
                    Train {t.numeroTrain} <span className="font-semibold text-[#6c7c71]">· {t.qualite}</span>
                  </span>
                  <span className="font-bold text-[#314238]">{t.statut}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[#dfe6d7] bg-white/90 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.1em] text-[#5e7166]">
            <Ship size={13} aria-hidden="true" />
            Navires en chargement ({postes.length})
          </p>
          {postes.length === 0 ? (
            <p className="text-xs font-semibold text-[#829187]">Aucun navire en chargement actuellement.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {postes.map(({ poste, navire, raf }) => (
                <div key={navire.id} className="flex items-center justify-between rounded-md border border-[#eef1ea] bg-[#f6f9f2] px-3 py-2 text-xs">
                  <span className="font-black text-[#102b20]">
                    {navire.nom} <span className="font-semibold text-[#6c7c71]">· Poste {poste}</span>
                  </span>
                  <span className="font-bold text-[#a5460f]">RAF {raf.toLocaleString("fr-FR")} t</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-black uppercase tracking-[0.1em] text-[#5e7166]">Autres indicateurs opérationnels</h2>
        <OperationsSummary onNavigate={onNavigate} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#dfe6d7] bg-white/80 px-4 py-2.5 text-[11px] font-bold">
        <span className="flex items-center gap-1.5 text-[#0d6b4d]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#0d6b4d" }} aria-hidden="true" />
          Normal (&lt; 80%)
        </span>
        <span className="flex items-center gap-1.5 text-[#a5460f]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#a5460f" }} aria-hidden="true" />
          Élevé (80–94%)
        </span>
        <span className="flex items-center gap-1.5 text-[#9a2f2f]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#9a2f2f" }} aria-hidden="true" />
          Occupation totale (≥ 95%)
        </span>
        <span className="flex items-center gap-1.5 text-[#1d6fa5]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#1d6fa5" }} aria-hidden="true" />
          Libre (vif = 0, prête pour une nouvelle qualité)
        </span>
        <span className="flex items-center gap-1.5 text-[#9a2f2f]">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#9a2f2f] text-[8px] font-black text-white">!</span>
          Stock mort critique (≥ 60% — à déboucher)
        </span>
        <span className="text-[#829187]">Survolez une cellule pour le détail.</span>
      </div>

      <StockLayoutMap cellules={snapshot.cellules} zones={snapshot.zones} />
    </div>
  );
}
