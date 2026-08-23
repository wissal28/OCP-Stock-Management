import {
  ACTIONS_COLUMN,
  DA_COLUMNS,
  DB_COLUMNS,
  FROZEN_COLUMNS,
  SILOS_COLUMNS,
  TEMPS_COLUMNS,
  columnWidthPercent,
  type Density
} from "./dechargementGridLayout";

const groupClassPeach = "border border-[#8a6d3b]/40 bg-[#fbe4cf] px-1 py-1.5 text-center font-black uppercase tracking-[0.04em] text-[#5a3d1f]";
const groupClassYellow = "border border-[#8a6d3b]/40 bg-[#fdf6cf] px-1 py-1.5 text-center font-black uppercase tracking-[0.04em] text-[#5a3d1f]";
const subClass = "border border-[#c9b98a]/70 bg-[#fdf6d8] px-0.5 py-1 text-center font-bold text-[#6c5a2f] truncate";

export default function DechargementTableHeader({ density }: { density: Density }) {
  const fontSize = density === "compact" ? "text-[9px]" : "text-[10px]";
  const subFontSize = density === "compact" ? "text-[8px]" : "text-[9px]";

  return (
    <thead className="sticky top-0 z-30">
      <tr>
        <th colSpan={FROZEN_COLUMNS.length} className={`${groupClassPeach} ${fontSize}`}>
          Train
        </th>
        <th colSpan={DA_COLUMNS.length} className={`${groupClassYellow} ${fontSize}`}>
          DA
        </th>
        <th colSpan={DB_COLUMNS.length} className={`${groupClassYellow} ${fontSize}`}>
          DB
        </th>
        <th colSpan={SILOS_COLUMNS.length} className={`${groupClassYellow} ${fontSize}`}>
          Silos
        </th>
        {TEMPS_COLUMNS.map((col) => (
          <th key={col.key} rowSpan={2} className={`${groupClassPeach} ${fontSize}`} style={{ width: columnWidthPercent(col) }}>
            {col.label}
          </th>
        ))}
        <th rowSpan={2} className={`${groupClassPeach} ${fontSize}`} style={{ width: columnWidthPercent(ACTIONS_COLUMN) }}>
          {ACTIONS_COLUMN.label}
        </th>
      </tr>
      <tr>
        {FROZEN_COLUMNS.map((col) => (
          <th
            key={col.key}
            className={`${subClass} ${subFontSize} ${col.key === "tonnageBascule" ? "bg-[#cfe0f2]" : col.key === "ecart" ? "bg-[#fbe4cf]" : ""}`}
            style={{ width: columnWidthPercent(col) }}
          >
            {col.label}
          </th>
        ))}
        {[...DA_COLUMNS, ...DB_COLUMNS, ...SILOS_COLUMNS].map((col) => (
          <th
            key={col.key}
            className={`${subClass} ${subFontSize} ${col.key.endsWith("periode") ? "bg-[#fff6b8]" : ""}`}
            style={{ width: columnWidthPercent(col) }}
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}
