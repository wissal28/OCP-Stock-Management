import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, HardHat, Wrench } from "lucide-react";
import { readArretsNavireFromApi, readArretsTrainFromApi } from "../arrets/arretsBilanRules";
import type { ArretNavire } from "../navire/navireData";
import type { ArretTrain } from "../train/trainData";
import { analyzeArrets, formatDuration, getCurrentOperationalDay, getOperationalDay } from "../train/trainRules";
import { interventionsAVenir, interventionsEnRetard, readMaintenanceFromApi } from "../maintenance/maintenanceRules";
import type { MaintenanceIntervention } from "../maintenance/maintenanceData";
import { actionsEnRetard, incidentsOuverts, joursSansAccident, readActionsFromApi, readIncidentsFromApi } from "../hse/hseRules";
import type { HSEAction, HSEIncident } from "../hse/hseData";
import { lighten } from "./colorUtils";

// Résumé croisé des autres modules opérationnels (arrêts, maintenance, HSE) — le tableau de bord ne
// doit pas se limiter au stock : ce sont les 3 autres sources d'alerte "métier" du sidebar, avec leur
// propre convention API + repli hors-ligne (voir readXFromApi dans chaque module de règles).
const REFRESH_MS = 30000;

type NavigableView = "bilan-arrets" | "maintenance" | "hse";

function StatRow({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="font-semibold text-[#6c7c71]">{label}</span>
      <span className={`font-black ${alert ? "text-[#9a2f2f]" : "text-[#102b20]"}`}>{value}</span>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  accent,
  navView,
  onNavigate,
  children
}: {
  icon: ReactNode;
  title: string;
  accent: string;
  navView: NavigableView;
  onNavigate?: (view: NavigableView) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[#dfe6d7] bg-white/90 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: lighten(accent, 0.88), color: accent }}>
            {icon}
          </span>
          {title}
        </p>
        {onNavigate && (
          <button type="button" onClick={() => onNavigate(navView)} className="shrink-0 text-[10px] font-black text-[#0d6b4d] transition hover:underline">
            Voir →
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

export default function OperationsSummary({ onNavigate }: { onNavigate?: (view: NavigableView) => void }) {
  const [arretsNavire, setArretsNavire] = useState<ArretNavire[]>([]);
  const [arretsTrain, setArretsTrain] = useState<ArretTrain[]>([]);
  const [interventions, setInterventions] = useState<MaintenanceIntervention[]>([]);
  const [incidents, setIncidents] = useState<HSEIncident[]>([]);
  const [actions, setActions] = useState<HSEAction[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const [an, at, mi, hi, ha] = await Promise.all([
        readArretsNavireFromApi(),
        readArretsTrainFromApi(),
        readMaintenanceFromApi(),
        readIncidentsFromApi(),
        readActionsFromApi()
      ]);
      if (cancelled) return;
      setArretsNavire(an);
      setArretsTrain(at);
      setInterventions(mi);
      setIncidents(hi);
      setActions(ha);
      setLoaded(true);
    }
    refresh();
    const interval = window.setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (!loaded) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-36 animate-pulse rounded-lg border border-[#dfe6d7] bg-white/70" />
        <div className="h-36 animate-pulse rounded-lg border border-[#dfe6d7] bg-white/70" />
        <div className="h-36 animate-pulse rounded-lg border border-[#dfe6d7] bg-white/70" />
      </div>
    );
  }

  const today = getCurrentOperationalDay();
  const arretsAujourdhui = [
    ...arretsNavire.filter((a) => getOperationalDay(a.dateDebut, a.heureDebut) === today),
    ...arretsTrain.filter((a) => getOperationalDay(a.dateDebut, a.heureDebut) === today)
  ];
  const arretsAnalysis = analyzeArrets(arretsAujourdhui);
  const topCause = arretsAnalysis.byNature[0] ?? null;

  const enCours = interventions.filter((i) => i.statut === "En cours").length;
  const enRetard = interventionsEnRetard(interventions).length;
  const aVenir = interventionsAVenir(interventions).length;

  const joursSansAcc = joursSansAccident(incidents);
  const incidentsOuvertsCount = incidentsOuverts(incidents).length;
  const actionsRetardCount = actionsEnRetard(actions).length;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <SummaryCard icon={<BarChart3 size={13} aria-hidden="true" />} title="Arrêts (journée)" accent="#a5460f" navView="bilan-arrets" onNavigate={onNavigate}>
        <StatRow label="Temps perdu" value={formatDuration(arretsAnalysis.totalMinutes)} />
        <StatRow label="Nombre d'arrêts" value={String(arretsAnalysis.count)} />
        <StatRow label="En cours" value={String(arretsAnalysis.ongoing)} alert={arretsAnalysis.ongoing > 0} />
        <StatRow label="Principale cause" value={topCause ? `${topCause.nature} · ${formatDuration(topCause.minutes)}` : "—"} />
      </SummaryCard>

      <SummaryCard icon={<Wrench size={13} aria-hidden="true" />} title="Maintenance" accent="#1d6fa5" navView="maintenance" onNavigate={onNavigate}>
        <StatRow label="Interventions en cours" value={String(enCours)} />
        <StatRow label="En retard" value={String(enRetard)} alert={enRetard > 0} />
        <StatRow label="À venir (7 j)" value={String(aVenir)} />
      </SummaryCard>

      <SummaryCard icon={<HardHat size={13} aria-hidden="true" />} title="HSE — Sécurité" accent="#0d6b4d" navView="hse" onNavigate={onNavigate}>
        <StatRow label="Jours sans accident" value={joursSansAcc !== null ? String(joursSansAcc) : "—"} />
        <StatRow label="Incidents ouverts" value={String(incidentsOuvertsCount)} alert={incidentsOuvertsCount > 0} />
        <StatRow label="Actions en retard" value={String(actionsRetardCount)} alert={actionsRetardCount > 0} />
      </SummaryCard>
    </div>
  );
}
