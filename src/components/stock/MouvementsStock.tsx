import { useEffect, useState } from "react";
import { Activity, CalendarClock, Gauge, Info, Layers, Ship, Warehouse } from "lucide-react";
import { AXES, LOTS, PESEUSES, PESEUSE_SOURCES, SILOS } from "../train/trainData";
import { getCurrentOperationalDay, getOperationalDayRange } from "./stockRules";
import * as api from "../../api";
import type { CelluleMovement, PeseuseActivity, StockMovements } from "../../api";

const PESEUSE_LETTERS = ["A", "B", "C", "D"];

function siloLabel(siloId: string): string {
  return SILOS.find((s) => s.id === siloId)?.label ?? siloId;
}

const cardClass = "rounded-lg border border-[#dfe6d7] bg-white/90 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm";
const thClass = "px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.06em] text-[#5e7166]";
const tdClass = "px-4 py-2.5 text-sm font-semibold text-[#314238]";

function SourceBadge({ source }: { source: CelluleMovement["existantSource"] }) {
  if (source === "officiel") return null;
  return (
    <span
      className="ml-1.5 inline-flex items-center rounded-full border border-[#f3c9a8] bg-[#fdece0] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.04em] text-[#a5460f]"
      title="Aucun stock officiel par cellule pour le Lot 3 (le bordereau Excel ne le suit qu'en 2 zones globales) — valeur calculée par cumul des entrées/sorties depuis la première journée d'activité connue."
    >
      cumul calculé
    </span>
  );
}

function CelluleTable({ title, cellules }: { title: string; cellules: CelluleMovement[] }) {
  if (cellules.length === 0) return null;
  return (
    <div className={cardClass}>
      <div className="flex items-center gap-2 border-b border-[#dfe6d7] bg-[#f3f8ef] px-4 py-3">
        <Layers size={15} className="text-[#0d6b4d]" aria-hidden="true" />
        <h3 className="text-sm font-black text-[#102b20]">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#dfe6d7] text-left">
              <th className={thClass}>Cellule</th>
              <th className={thClass}>Entrant</th>
              <th className={thClass}>Sortant</th>
              <th className={thClass}>Existant</th>
            </tr>
          </thead>
          <tbody>
            {cellules.map((c) => (
              <tr key={c.celluleId} className="border-b border-[#eef1ea] last:border-0 hover:bg-[#f6f9f2]">
                <td className={`${tdClass} font-black text-[#102b20]`}>{c.celluleId}</td>
                <td className={`${tdClass} text-[#0d6b4d]`}>{c.entrant > 0 ? `+${c.entrant.toLocaleString("fr-FR")} t` : "—"}</td>
                <td className={`${tdClass} text-[#a5460f]`}>{c.sortant > 0 ? `-${c.sortant.toLocaleString("fr-FR")} t` : "—"}</td>
                <td className={tdClass}>
                  {c.existant.toLocaleString("fr-FR")} t
                  <SourceBadge source={c.existantSource} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PeseuseLegend() {
  return (
    <div className={cardClass}>
      <div className="flex items-center gap-2 border-b border-[#dfe6d7] bg-[#f3f8ef] px-4 py-3">
        <Gauge size={15} className="text-[#0d6b4d]" aria-hidden="true" />
        <h3 className="text-sm font-black text-[#102b20]">Peseuses — sources d'alimentation</h3>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {PESEUSE_SOURCES.map((src) => {
          const peseuse = PESEUSES.find((p) => p.id === src.peseuseId);
          const axe = AXES.find((a) => a.id === src.axeId);
          const lotLabel = axe?.lotId === "lot-1" ? "Lot 1" : "Lot 2";
          return (
            <div key={src.peseuseId} className="rounded-md border border-[#dfe6d7] bg-[#f6f9f2] px-3.5 py-3">
              <p className="text-xs font-black text-[#102b20]">{peseuse?.label ?? src.peseuseId}</p>
              <ul className="mt-1.5 space-y-1 text-xs font-semibold text-[#5e7166]">
                <li>DA40 / DB40 — direct, sans passage par une cellule</li>
                <li>
                  1 cellule de {axe?.name} ({lotLabel})
                </li>
                <li>1 cellule du Lot 3 : {src.lot3Options.join(" ou ")}</li>
              </ul>
            </div>
          );
        })}
      </div>
      <p className="border-t border-[#eef1ea] px-4 py-2.5 text-[11px] font-semibold text-[#6c7c71]">
        Une seule de ces 3 sources à la fois par opération — purement informatif ici, n'affecte aucun calcul de la page.
      </p>
    </div>
  );
}

function PeseuseActivityTable({ peseuses, isToday }: { peseuses: PeseuseActivity[]; isToday: boolean }) {
  const byLetter = new Map(peseuses.map((p) => [p.peseuse, p]));
  return (
    <div className={cardClass}>
      <div className="flex items-center gap-2 border-b border-[#dfe6d7] bg-[#f3f8ef] px-4 py-3">
        <Activity size={15} className="text-[#0d6b4d]" aria-hidden="true" />
        <h3 className="text-sm font-black text-[#102b20]">Peseuses & portiques — activité du jour</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#dfe6d7] text-left">
              <th className={thClass}>Peseuse</th>
              <th className={thClass}>Portique(s)</th>
              <th className={thClass}>Tonnage transféré ce jour</th>
              <th className={thClass}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {PESEUSE_LETTERS.map((letter) => {
              const entry = byLetter.get(letter);
              const statusLabel = !entry || entry.tonnage === 0 ? "—" : isToday ? (entry.actif ? "Actif" : "En attente") : "Terminé";
              const statusColor = statusLabel === "Actif" ? "text-[#0d6b4d]" : statusLabel === "En attente" ? "text-[#a5460f]" : "text-[#6c7c71]";
              return (
                <tr key={letter} className="border-b border-[#eef1ea] last:border-0 hover:bg-[#f6f9f2]">
                  <td className={`${tdClass} font-black text-[#102b20]`}>Peseuse {letter}</td>
                  <td className={tdClass}>{entry?.portiques.length ? entry.portiques.join(", ") : "—"}</td>
                  <td className={tdClass}>{entry?.tonnage ? `${entry.tonnage.toLocaleString("fr-FR")} t` : "—"}</td>
                  <td className={`${tdClass} font-black ${statusColor}`}>{statusLabel}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-[#eef1ea] px-4 py-2.5 text-[11px] font-semibold text-[#6c7c71]">
        Peseuses/portiques sont des convoyeurs de passage, pas un lieu de stockage — pas d'"existant" ici, seulement le débit du jour.
        "Actif"/"En attente" ne sont fiables que pour la journée en cours ; les journées passées affichent "Terminé".
      </p>
    </div>
  );
}

export default function MouvementsStock() {
  const [selectedDate, setSelectedDate] = useState(getCurrentOperationalDay());
  const [movements, setMovements] = useState<StockMovements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .getStockMovements(selectedDate)
      .then((data) => {
        if (!cancelled) setMovements(data);
      })
      .catch(() => {
        if (!cancelled) setError("Impossible de calculer les mouvements pour cette journée.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const today = getCurrentOperationalDay();
  const cellulesByLot = LOTS.map((lot) => ({
    lot,
    cellules: (movements?.cellules ?? []).filter((c) => c.lotId === lot.id)
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">Module métier</p>
          <h1 className="font-display mt-1 text-2xl font-medium text-[#102b20]">Mouvements de stock</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#6c7c71]">
            Pour chaque cellule (Lot 1, Lot 2, Lot 3) et chaque silo (T10, DB210) : quantité entrante (trains), sortante (navires) et
            existante, plus l'activité du jour par peseuse/portique — journée par journée d'exploitation (7h00 → 7h00 le lendemain).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedDate !== today && (
            <button
              type="button"
              onClick={() => setSelectedDate(today)}
              className="inline-flex h-10 cursor-pointer items-center rounded-md border border-[#cfe3d8] bg-[#e8f4ed] px-3.5 text-xs font-bold text-[#0d6b4d] transition hover:bg-[#d9edc8]"
            >
              Aujourd'hui
            </button>
          )}
          <label className="flex items-center gap-2">
            <CalendarClock size={15} className="text-[#5e7166]" aria-hidden="true" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-bold text-[#314238] outline-none transition focus:border-[#0d6b4d]"
            />
          </label>
        </div>
      </div>

      <p className="text-xs font-bold text-[#0d6b4d]">Journée d'exploitation : {getOperationalDayRange(selectedDate).label}</p>

      {error && <p className="rounded-md border border-[#efc3bd] bg-[#fff1ee] px-4 py-3 text-sm font-semibold text-[#a13b2f]">{error}</p>}

      {loading ? (
        <div className="grid gap-4">
          <div className="h-48 animate-pulse rounded-lg border border-[#dfe6d7] bg-white/70" />
          <div className="h-48 animate-pulse rounded-lg border border-[#dfe6d7] bg-white/70" />
        </div>
      ) : movements ? (
        <div className="grid gap-4">
          {cellulesByLot.map(({ lot, cellules }) => (
            <CelluleTable key={lot.id} title={`${lot.name} — ${lot.description}`} cellules={cellules} />
          ))}

          <div className={cardClass}>
            <div className="flex items-center gap-2 border-b border-[#dfe6d7] bg-[#f3f8ef] px-4 py-3">
              <Warehouse size={15} className="text-[#0d6b4d]" aria-hidden="true" />
              <h3 className="text-sm font-black text-[#102b20]">Silos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#dfe6d7] text-left">
                    <th className={thClass}>Silo</th>
                    <th className={thClass}>Entrant</th>
                    <th className={thClass}>Sortant</th>
                    <th className={thClass}>Existant</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.silos.map((s) => (
                    <tr key={s.siloId} className="hover:bg-[#f6f9f2]">
                      <td className={`${tdClass} font-black text-[#102b20]`}>{siloLabel(s.siloId)}</td>
                      <td className={`${tdClass} text-[#0d6b4d]`}>{s.entrant > 0 ? `+${s.entrant.toLocaleString("fr-FR")} t` : "—"}</td>
                      <td className={`${tdClass} text-[#a5460f]`}>{s.sortant > 0 ? `-${s.sortant.toLocaleString("fr-FR")} t` : "—"}</td>
                      <td className={tdClass}>
                        {s.existant.toLocaleString("fr-FR")} t
                        <SourceBadge source={s.existantSource} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-[#dfe6d7] bg-[#f6f9f2] px-4 py-3.5">
            <Ship size={16} className="mt-0.5 shrink-0 text-[#0d6b4d]" aria-hidden="true" />
            <p className="text-sm font-semibold text-[#314238]">
              Navire direct (bypass, sans passage par une cellule ou un silo) :{" "}
              <span className="font-black text-[#102b20]">{movements.navireDirect.quantite.toLocaleString("fr-FR")} t</span> ce jour.
            </p>
          </div>

          <PeseuseActivityTable peseuses={movements.peseuses} isToday={selectedDate === today} />

          <PeseuseLegend />

          <p className="flex items-start gap-2 text-xs font-semibold text-[#6c7c71]">
            <Info size={14} className="mt-0.5 shrink-0 text-[#5e7166]" aria-hidden="true" />
            Entrant/sortant = mouvements réels de la journée (trains déchargés / navires chargés). Existant = stock officiel (Lot 1 et
            Lot 2, corrigible dans Gestion de stock) ou cumul calculé depuis la première journée d'activité connue (Lot 3 et silo T10, en
            l'absence d'un relevé officiel saisi ce jour-là).
          </p>
        </div>
      ) : null}
    </div>
  );
}
