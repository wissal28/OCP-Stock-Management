import { useState } from "react";
import { Search, X } from "lucide-react";
import { searchEquipments } from "./synoptiqueManutentionData";

export default function EquipmentSearch({ onSelectCode }: { onSelectCode: (code: string) => void }) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const suggestions = searchEquipments(query);
  const showSuggestions = isFocused && query.trim().length > 0;

  const selectCode = (code: string) => {
    onSelectCode(code);
    setQuery(code);
    setIsFocused(false);
  };

  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829187]" size={17} aria-hidden="true" />
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 120)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && suggestions[0]) selectCode(suggestions[0].code);
        }}
        placeholder="Rechercher un équipement (ex: DA10, V20, T10...)"
        aria-label="Rechercher un équipement par code"
        className="h-12 w-full rounded-md border border-[#dfe6d7] bg-white pl-11 pr-10 text-sm font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-[#829187] transition hover:text-[#0d6b4d]"
          aria-label="Effacer la recherche"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}

      {showSuggestions && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-md border border-[#dfe6d7] bg-white shadow-[0_16px_42px_rgba(16,43,32,0.12)]">
          {suggestions.length === 0 ? (
            <p className="px-4 py-3 text-xs font-semibold text-[#6c7c71]">Aucun équipement trouvé pour « {query} ».</p>
          ) : (
            <ul>
              {suggestions.map((equipment) => (
                <li key={equipment.code}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectCode(equipment.code)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-[#f6f7ef]"
                  >
                    <span className="font-black text-[#102b20]">{equipment.label}</span>
                    <span className="truncate text-xs font-semibold text-[#6c7c71]">{equipment.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
