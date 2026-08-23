import { motion, useReducedMotion } from "framer-motion";
import type { QualiteTotal } from "./stockRules";
import { colorForQualite } from "./colorUtils";

const MAX_ROWS = 6;

export default function StockQualityBreakdown({ data, total }: { data: QualiteTotal[]; total: number }) {
  const reduced = useReducedMotion();
  const rows = data.slice(0, MAX_ROWS);
  const autres = data.slice(MAX_ROWS).reduce((sum, q) => sum + q.tonnageVif, 0);
  const maxValue = Math.max(...rows.map((r) => r.tonnageVif), 1);

  if (rows.length === 0) {
    return <p className="text-xs font-semibold text-[#829187]">Aucun stock vif enregistré pour l'instant.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row, i) => {
        const color = colorForQualite(row.qualite);
        const pctOfTotal = total > 0 ? Math.round((row.tonnageVif / total) * 1000) / 10 : 0;
        return (
          <div key={row.qualite} className="flex items-center gap-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
            <span className="w-11 shrink-0 text-[11px] font-black text-[#102b20]">{row.qualite || "—"}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#edf2e8]">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${(row.tonnageVif / maxValue) * 100}%` }}
                transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 90, damping: 18, delay: i * 0.04 }}
              />
            </div>
            <span className="w-20 shrink-0 text-right text-[11px] font-bold text-[#5e7166]">
              {row.tonnageVif.toLocaleString("fr-FR")} t
            </span>
            <span className="w-11 shrink-0 text-right text-[10px] font-bold text-[#829187]">{pctOfTotal}%</span>
          </div>
        );
      })}
      {autres > 0 && (
        <div className="flex items-center gap-2.5 pt-0.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#9aa79c]" aria-hidden="true" />
          <span className="w-11 shrink-0 text-[11px] font-black text-[#829187]">Autres</span>
          <div className="h-2 flex-1" />
          <span className="w-20 shrink-0 text-right text-[11px] font-bold text-[#829187]">{autres.toLocaleString("fr-FR")} t</span>
          <span className="w-11 shrink-0 text-right text-[10px] font-bold text-[#829187]">
            {total > 0 ? Math.round((autres / total) * 1000) / 10 : 0}%
          </span>
        </div>
      )}
    </div>
  );
}
