import { Search } from "lucide-react";

export default function TrainFilters({
  query,
  onQueryChange
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#dfe6d7] bg-white/80 p-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#cfe3d8] bg-[#e8f4ed] text-[#0d6b4d]">
        <Search size={13} aria-hidden="true" />
      </span>
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Rechercher un train par n°, axe, qualité ou destination…"
        className="h-9 w-full max-w-md rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]"
      />
      {query && (
        <button type="button" onClick={() => onQueryChange("")} className="text-xs font-bold text-[#0d6b4d] hover:underline">
          Réinitialiser
        </button>
      )}
    </div>
  );
}
