import { useMemo, useRef, useState } from "react";
import type { StockSnapshot } from "./stockData";
import { computeTotalStock } from "./stockRules";

const WIDTH = 640;
const HEIGHT = 180;
const PAD_LEFT = 44;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const LINE_COLOR = "#0d6b4d";

function niceStep(range: number): number {
  const raw = range / 3;
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const normalized = raw / magnitude;
  const step = normalized >= 5 ? 5 : normalized >= 2 ? 2 : 1;
  return step * magnitude;
}

export default function StockTrendChart({ snapshots }: { snapshots: StockSnapshot[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const points = useMemo(() => {
    const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
    return sorted.map((s) => ({ date: s.date, value: computeTotalStock(s) }));
  }, [snapshots]);

  if (points.length < 2) {
    return (
      <div className="flex h-[180px] items-center justify-center text-xs font-semibold text-[#6c7c71]">
        Historique insuffisant pour tracer une tendance.
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const step = niceStep(Math.max(rawMax - rawMin, 1));
  const min = Math.floor(rawMin / step) * step;
  const max = Math.ceil(rawMax / step) * step || step;

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xAt = (i: number) => PAD_LEFT + (i / (points.length - 1)) * plotWidth;
  const yAt = (v: number) => PAD_TOP + plotHeight - ((v - min) / (max - min || 1)) * plotHeight;

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p.value)}`).join(" ");
  const areaD = `${pathD} L ${xAt(points.length - 1)} ${HEIGHT - PAD_BOTTOM} L ${xAt(0)} ${HEIGHT - PAD_BOTTOM} Z`;
  const gridTicks = [min, min + step, min + step * 2, max].filter((v, i, arr) => arr.indexOf(v) === i);

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = Math.min(1, Math.max(0, (relX - PAD_LEFT) / plotWidth));
    const index = Math.round(ratio * (points.length - 1));
    setHoverIndex(index);
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const last = points[points.length - 1];

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
        role="img"
        aria-label="Évolution du stock vif total sur les derniers jours"
      >
        <defs>
          <linearGradient id="stock-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LINE_COLOR} stopOpacity={0.22} />
            <stop offset="100%" stopColor={LINE_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>

        {gridTicks.map((tick) => (
          <g key={tick}>
            <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={yAt(tick)} y2={yAt(tick)} stroke="#e3e9de" strokeWidth={1} />
            <text x={PAD_LEFT - 8} y={yAt(tick)} textAnchor="end" dominantBaseline="middle" className="fill-[#829187]" fontSize={10}>
              {tick >= 1000 ? `${Math.round(tick / 1000)}k` : tick}
            </text>
          </g>
        ))}

        {points
          .filter((_, i) => i % Math.ceil(points.length / 6) === 0 || i === points.length - 1)
          .map((p) => (
            <text
              key={p.date}
              x={xAt(points.indexOf(p))}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-[#829187]"
              fontSize={9}
            >
              {p.date.slice(5)}
            </text>
          ))}

        <path d={areaD} fill="url(#stock-trend-fill)" stroke="none" />
        <path d={pathD} fill="none" stroke={LINE_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        <circle cx={xAt(points.length - 1)} cy={yAt(last.value)} r={5} fill={LINE_COLOR} stroke="#fff" strokeWidth={2} />
        <text x={xAt(points.length - 1)} y={yAt(last.value) - 12} textAnchor="end" className="fill-[#102b20]" fontSize={11} fontWeight={700}>
          {last.value.toLocaleString("fr-FR")} t
        </text>

        {hovered && (
          <g>
            <line x1={xAt(hoverIndex!)} x2={xAt(hoverIndex!)} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} stroke="#0d6b4d" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
            <circle cx={xAt(hoverIndex!)} cy={yAt(hovered.value)} r={5} fill={LINE_COLOR} stroke="#fff" strokeWidth={2} />
          </g>
        )}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 -translate-y-full rounded-md border border-[#dfe6d7] bg-white px-2.5 py-1.5 text-[11px] shadow-[0_16px_42px_rgba(16,43,32,0.18)]"
          style={{ left: `${(xAt(hoverIndex!) / WIDTH) * 100}%` }}
        >
          <p className="font-black text-[#102b20]">{hovered.value.toLocaleString("fr-FR")} t</p>
          <p className="font-semibold text-[#829187]">{hovered.date}</p>
        </div>
      )}
    </div>
  );
}
