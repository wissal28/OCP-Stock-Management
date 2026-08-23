import { motion, useReducedMotion } from "framer-motion";
import type { LotTotal } from "./stockRules";

const SIZE = 132;
const STROKE = 17;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const LOT_COLORS: Record<string, string> = {
  "lot-1": "#0d6b4d",
  "lot-2": "#1d6fa5",
  "lot-3": "#c2872f"
};

export default function StockLotDonut({ data }: { data: LotTotal[] }) {
  const reduced = useReducedMotion();
  const total = data.reduce((sum, d) => sum + d.tonnageVif, 0);

  let cumulative = 0;
  const segments = data.map((d) => {
    const share = total > 0 ? d.tonnageVif / total : 0;
    const dashArray = `${share * CIRCUMFERENCE} ${CIRCUMFERENCE - share * CIRCUMFERENCE}`;
    const offset = -cumulative * CIRCUMFERENCE;
    cumulative += share;
    return { ...d, share, dashArray, offset, color: LOT_COLORS[d.lotId] ?? "#9aa79c" };
  });

  return (
    <div className="flex items-center gap-5">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0 -rotate-90" role="img" aria-label="Répartition du stock vif par lot">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#edf2e8" strokeWidth={STROKE} />
        {segments.map((seg, i) =>
          seg.share > 0 ? (
            <motion.circle
              key={seg.lotId}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={STROKE}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.offset}
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: reduced ? 0 : i * 0.08 }}
            />
          ) : null
        )}
      </svg>
      <div className="flex flex-1 flex-col gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#829187]">
          Total <span className="text-[#102b20]">{total.toLocaleString("fr-FR")} t</span>
        </p>
        {segments.map((seg) => (
          <div key={seg.lotId} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-1.5 font-bold text-[#314238]">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} aria-hidden="true" />
              {seg.label}
            </span>
            <span className="font-black text-[#102b20]">
              {seg.tonnageVif.toLocaleString("fr-FR")} t <span className="font-bold text-[#829187]">· {Math.round(seg.share * 1000) / 10}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
