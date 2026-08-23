import { useState } from "react";
import { motion } from "framer-motion";
import { AXES, LOTS } from "../train/trainData";
import type { CelluleStock, ZoneStock } from "./stockData";
import { calculateTaux, isCelluleLibre, isMortCritique, totalZoneMortVif } from "./stockRules";
import { lighten } from "./colorUtils";

type Tier = "ok" | "warn" | "critical";

const TIER_META: Record<Tier, { hex: string; label: string }> = {
  ok: { hex: "#0d6b4d", label: "Normal" },
  warn: { hex: "#a5460f", label: "Élevé" },
  critical: { hex: "#9a2f2f", label: "Critique" }
};

function tierOf(taux: number): Tier {
  if (taux >= 95) return "critical";
  if (taux >= 80) return "warn";
  return "ok";
}

interface TooltipData {
  title: string;
  qualite: string;
  vif: number;
  mort: number;
  capacite: number;
  taux: number;
}

function SiloMeter({ cellule, label, onHover }: { cellule: CelluleStock; label: string; onHover: (data: TooltipData | null, el: HTMLElement | null) => void }) {
  const taux = calculateTaux(cellule.tonnageVif, cellule.tonnageMort, cellule.capaciteTotale);
  const tier = tierOf(taux);
  const meta = TIER_META[tier];
  const barHeight = Math.min(100, Math.max(0, taux));
  const libre = isCelluleLibre(cellule.tonnageVif);
  // L'état vraiment critique est un stock MORT élevé (capacité bloquée, à déboucher) — indépendant du
  // taux d'occupation total, qui peut n'être que du bon stock vif (pas un problème en soi).
  const mortCritique = isMortCritique(cellule.tonnageMort, cellule.capaciteTotale);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onMouseEnter={(e) =>
          onHover(
            { title: `Cellule ${label}`, qualite: cellule.qualite, vif: cellule.tonnageVif, mort: cellule.tonnageMort, capacite: cellule.capaciteTotale, taux },
            e.currentTarget
          )
        }
        onMouseLeave={() => onHover(null, null)}
        onFocus={(e) =>
          onHover(
            { title: `Cellule ${label}`, qualite: cellule.qualite, vif: cellule.tonnageVif, mort: cellule.tonnageMort, capacite: cellule.capaciteTotale, taux },
            e.currentTarget
          )
        }
        onBlur={() => onHover(null, null)}
        className="group relative flex h-28 w-full cursor-pointer flex-col overflow-hidden rounded-md border text-left outline-none focus-visible:ring-2 focus-visible:ring-[#0d6b4d]"
        style={{ backgroundColor: lighten(meta.hex, 0.88), borderColor: mortCritique ? "#9a2f2f" : "#dfe6d7", borderWidth: mortCritique ? 2 : 1 }}
        aria-label={`Cellule ${label}, qualité ${cellule.qualite || "aucune"}, stock vif ${cellule.tonnageVif} t, stock mort ${cellule.tonnageMort} t, taux de remplissage ${taux}%${libre ? ", libre" : ""}${mortCritique ? ", stock mort critique" : ""}`}
      >
        <motion.div
          className="absolute inset-x-0 bottom-0 rounded-t-[4px]"
          style={{ backgroundColor: meta.hex }}
          initial={false}
          animate={{ height: `${barHeight}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
        <span className="absolute inset-x-0 top-1.5 text-center text-[11px] font-black text-[#5e7166] transition group-hover:text-[#102b20]">{label}</span>
        {libre ? (
          <span className="absolute inset-x-0 bottom-1.5 text-center text-[9px] font-black uppercase tracking-[0.06em] text-[#1d6fa5] drop-shadow-sm">
            Libre
          </span>
        ) : (
          <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-black text-white drop-shadow-sm">{taux > 12 ? `${taux}%` : ""}</span>
        )}
        {mortCritique && (
          <span
            className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#9a2f2f] text-[8px] font-black text-white"
            title="Stock mort critique — à déboucher"
          >
            !
          </span>
        )}
      </button>
      <p className="text-center text-[9px] font-bold leading-tight text-[#5e7166]">
        Vif <span className="text-[#102b20]">{cellule.tonnageVif.toLocaleString("fr-FR")} t</span>
      </p>
      <p className={`text-center text-[9px] font-bold leading-tight ${mortCritique ? "text-[#9a2f2f]" : "text-[#5e7166]"}`}>
        Mort <span className={mortCritique ? "text-[#9a2f2f]" : "text-[#102b20]"}>{cellule.tonnageMort.toLocaleString("fr-FR")} t</span>
      </p>
    </div>
  );
}

function ZoneCard({ zone }: { zone: ZoneStock }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-[#dfe6d7] bg-white/90 p-3">
      <span className="text-xs font-black text-[#102b20]">{zone.id}</span>
      <span className="text-lg font-black text-[#0d6b4d]">{zone.tonnageVif.toLocaleString("fr-FR")} t</span>
      <span className="text-[10px] font-bold text-[#6c7c71]">
        {zone.qualite || "—"} · Mort+Vif {totalZoneMortVif(zone).toLocaleString("fr-FR")} t
      </span>
    </div>
  );
}

export default function StockLayoutMap({ cellules, zones }: { cellules: CelluleStock[]; zones: ZoneStock[] }) {
  const [tooltip, setTooltip] = useState<{ data: TooltipData; rect: DOMRect } | null>(null);

  function handleHover(data: TooltipData | null, el: HTMLElement | null) {
    if (!data || !el) {
      setTooltip(null);
      return;
    }
    setTooltip({ data, rect: el.getBoundingClientRect() });
  }

  const byId = new Map(cellules.map((c) => [c.celluleId, c]));

  return (
    <div className="relative flex flex-col gap-5">
      {LOTS.filter((lot) => !lot.isZoneGlobale).map((lot) => {
        const lotAxes = AXES.filter((axe) => axe.lotId === lot.id);
        return (
          <div key={lot.id} className="rounded-lg border border-[#dfe6d7] bg-white/70 p-4">
            <h3 className="mb-3 text-xs font-black uppercase tracking-[0.1em] text-[#5e7166]">{lot.name}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {lotAxes.map((axe) => (
                <div key={axe.id}>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#829187]">{axe.name}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {axe.celluleIds.map((id, i) => {
                      const cellule = byId.get(id);
                      if (!cellule) return null;
                      const globalIndex = cellules.findIndex((c) => c.celluleId === id);
                      return <SiloMeter key={id} cellule={cellule} label={String(globalIndex + 1)} onHover={handleHover} />;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="rounded-lg border border-[#dfe6d7] bg-white/70 p-4">
        <h3 className="mb-3 text-xs font-black uppercase tracking-[0.1em] text-[#5e7166]">Lot 3 (zone globale)</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {zones.map((z) => (
            <ZoneCard key={z.id} zone={z} />
          ))}
        </div>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 w-56 rounded-md border border-[#dfe6d7] bg-white p-3 text-xs shadow-[0_16px_42px_rgba(16,43,32,0.18)]"
          style={{ left: tooltip.rect.left + tooltip.rect.width / 2, top: tooltip.rect.top - 10, transform: "translate(-50%, -100%)" }}
        >
          <p className="font-black text-[#102b20]">{tooltip.data.title}</p>
          <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 font-semibold text-[#314238]">
            <dt className="text-[#829187]">Qualité</dt>
            <dd className="text-right">{tooltip.data.qualite || "—"}</dd>
            <dt className="text-[#829187]">Vif</dt>
            <dd className="text-right">{tooltip.data.vif.toLocaleString("fr-FR")} t</dd>
            <dt className="text-[#829187]">Mort</dt>
            <dd className="text-right">{tooltip.data.mort.toLocaleString("fr-FR")} t</dd>
            <dt className="text-[#829187]">Capacité</dt>
            <dd className="text-right">{tooltip.data.capacite.toLocaleString("fr-FR")} t</dd>
            <dt className="text-[#829187]">Taux</dt>
            <dd className="text-right font-black" style={{ color: TIER_META[tierOf(tooltip.data.taux)].hex }}>
              {tooltip.data.taux}%
            </dd>
          </dl>
        </div>
      )}
    </div>
  );
}
