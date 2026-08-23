// Mini-graphique d'arrière-plan pour une carte KPI : une tendance en un coup d'œil, sans axes ni
// interaction (le détail complet reste dans "Évolution du stock vif total").
const WIDTH = 96;
const HEIGHT = 32;

export default function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const xAt = (i: number) => (i / (values.length - 1)) * WIDTH;
  const yAt = (v: number) => HEIGHT - ((v - min) / range) * (HEIGHT - 4) - 2;

  const linePoints = values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");
  const areaPoints = `0,${HEIGHT} ${linePoints} ${WIDTH},${HEIGHT}`;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-8 w-full" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={areaPoints} fill={color} opacity={0.12} />
      <polyline points={linePoints} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
