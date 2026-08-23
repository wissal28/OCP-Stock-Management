import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { getDestinationShares } from "./dechargementRules";

export interface DestinationOption {
  value: string;
  label: string;
}

export default function MultiDestinationCell({
  selected,
  options,
  quantiteTotale,
  onChange,
  blockedIds,
  compact
}: {
  selected: string[];
  options: DestinationOption[];
  quantiteTotale: number;
  onChange: (values: string[]) => void;
  blockedIds?: Set<string>;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  const labelFor = (value: string) => options.find((o) => o.value === value)?.label ?? value;
  const shares = getDestinationShares({ destinations: selected, quantite: quantiteTotale });
  const summary = selected.length === 0 ? "—" : selected.length === 1 ? labelFor(selected[0]) : `${selected.length} destinations`;

  return (
    <div className="relative h-full w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full cursor-pointer items-center justify-between gap-1 truncate rounded border border-transparent px-1 py-1 text-center font-semibold text-[#314238] hover:border-[#dfe6d7] ${
          compact ? "text-[10px]" : "text-xs"
        }`}
        title={selected.map(labelFor).join(", ") || "Aucune destination"}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown size={11} className="shrink-0 text-[#829187]" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-md border border-[#dfe6d7] bg-white p-2 text-left shadow-[0_16px_42px_rgba(16,43,32,0.18)]">
          <p className="px-1 pb-1 text-[10px] font-bold text-[#5e7166]">Plusieurs destinations possibles à la fois</p>
          <div className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
            {options.map((opt) => {
              const isChecked = selected.includes(opt.value);
              const isBlocked = Boolean(blockedIds?.has(opt.value)) && !isChecked;
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 rounded px-1.5 py-1 text-xs font-semibold ${
                    isBlocked ? "cursor-not-allowed text-[#b8c6bc]" : "cursor-pointer text-[#314238] hover:bg-[#f6f9f2]"
                  }`}
                >
                  <input type="checkbox" checked={isChecked} disabled={isBlocked} onChange={() => toggle(opt.value)} className="h-3.5 w-3.5 accent-[#0d6b4d]" />
                  {opt.label}
                </label>
              );
            })}
          </div>
          {shares.length > 0 && (
            <div className="mt-2 border-t border-dashed border-[#dfe6d7] pt-2 text-[11px] font-bold text-[#5e7166]">
              Répartition automatique (par lot, puis par axe au sein d'un même lot) :
              <ul className="mt-1 flex flex-col gap-0.5 font-bold text-[#102b20]">
                {shares.map((s) => (
                  <li key={s.destination}>
                    {labelFor(s.destination)} : {s.quantite.toLocaleString("fr-FR")} t
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 w-full cursor-pointer rounded-md bg-[#0d6b4d] px-2 py-1.5 text-[11px] font-bold text-white hover:bg-[#0a563d]"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
