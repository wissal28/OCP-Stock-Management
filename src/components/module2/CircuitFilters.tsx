import { CIRCUITS } from "./synoptiqueManutentionData";

export interface FilterOption {
  id: string;
  label: string;
}

export default function CircuitFilters({
  activeFilter,
  onSelectFilter,
  options
}: {
  activeFilter: string;
  onSelectFilter: (id: string) => void;
  options?: FilterOption[];
}) {
  const items = options ?? CIRCUITS.map((circuit) => ({ id: circuit.id, label: circuit.name }));

  return (
    <div className="-mx-1 flex flex-wrap gap-2 overflow-x-auto px-1 pb-1" aria-label="Filtres">
      {items.map((item) => {
        const isActive = activeFilter === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectFilter(item.id)}
            aria-pressed={isActive}
            className={`shrink-0 cursor-pointer rounded-full border px-3.5 py-2 text-xs font-bold transition-colors duration-200 ${
              isActive
                ? "border-[#0d6b4d] bg-[#0d6b4d] text-white shadow-[0_8px_20px_rgba(13,107,77,0.22)]"
                : "border-[#dfe6d7] bg-white text-[#5e7166] hover:border-[#0d6b4d]/40 hover:text-[#0d6b4d]"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
