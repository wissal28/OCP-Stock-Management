import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { formatHM, getOperationalDayRange, type DailyTotals } from "./dechargementRules";

export default function OperationalDayHeader({
  activeDay,
  days,
  onChange,
  totals
}: {
  activeDay: string | null;
  days: string[];
  onChange: (day: string) => void;
  totals: DailyTotals | null;
}) {
  const dayIndex = activeDay ? days.indexOf(activeDay) : -1;
  const range = activeDay ? getOperationalDayRange(activeDay) : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#dfe6d7] bg-white/90 p-3.5 shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#cfe3d8] bg-[#e8f4ed] text-[#0d6b4d]">
          <CalendarClock size={17} aria-hidden="true" />
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#5e7166]">Journée d'exploitation active</p>
          <p className="text-sm font-bold text-[#102b20]">{range ? range.label : "Aucune donnée pour le moment"}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={dayIndex <= 0}
          onClick={() => onChange(days[dayIndex - 1])}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[#dfe6d7] text-[#5e7166] hover:bg-[#f3f8ef] disabled:cursor-not-allowed disabled:opacity-40"
          title="Journée plus récente"
        >
          <ChevronLeft size={15} aria-hidden="true" />
        </button>
        <select
          value={activeDay ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-bold text-[#314238] outline-none focus:border-[#0d6b4d]"
        >
          {days.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={dayIndex === -1 || dayIndex >= days.length - 1}
          onClick={() => onChange(days[dayIndex + 1])}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[#dfe6d7] text-[#5e7166] hover:bg-[#f3f8ef] disabled:cursor-not-allowed disabled:opacity-40"
          title="Journée plus ancienne"
        >
          <ChevronRight size={15} aria-hidden="true" />
        </button>

        <div className="ml-1 flex h-9 items-center gap-1.5 rounded-md border border-[#bfdcef] bg-[#e7f2fa] px-3 text-xs font-black text-[#1d4d75]">
          Durée du jour : {totals ? formatHM(totals.dureeTotaleMinutes) : "0:00"}
        </div>
      </div>
    </div>
  );
}
