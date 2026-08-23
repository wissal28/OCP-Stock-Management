import { useMemo, useState } from "react";
import CircuitFilters, { type FilterOption } from "./CircuitFilters";
import EquipmentSearch from "./EquipmentSearch";
import EquipmentTable from "./EquipmentTable";
import { EQUIPMENTS, LOTS, type EquipmentFamily } from "./synoptiqueManutentionData";

const FAMILY_FILTERS: FilterOption[] = [
  { id: "all", label: "Toutes les familles" },
  { id: "Déchargement", label: "Déchargement" },
  { id: "Chargement", label: "Chargement" },
  { id: "Convoyeur", label: "Convoyeur" },
  { id: "Reprise", label: "Reprise" },
  { id: "Portique", label: "Portique" }
];

const LOT_FILTERS: FilterOption[] = [{ id: "all", label: "Tous les lots" }, ...LOTS.map((lot) => ({ id: lot.id, label: lot.name }))];

export default function EquipementsView() {
  const [familyFilter, setFamilyFilter] = useState("all");
  const [lotFilter, setLotFilter] = useState("all");
  const [qualiteFilter, setQualiteFilter] = useState("all");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const qualiteOptions = useMemo<FilterOption[]>(() => {
    const present = Array.from(new Set(EQUIPMENTS.map((equipment) => equipment.qualite).filter(Boolean))) as string[];
    present.sort();
    return [{ id: "all", label: "Toutes les qualités" }, ...present.map((qualite) => ({ id: qualite, label: qualite }))];
  }, []);

  const handleSelectCode = (code: string) => {
    setSelectedCode(code);
    setFamilyFilter("all");
    setLotFilter("all");
    setQualiteFilter("all");
  };

  const equipments = useMemo(() => {
    return EQUIPMENTS.filter((equipment) => {
      if (familyFilter !== "all" && equipment.family !== (familyFilter as EquipmentFamily)) return false;
      if (lotFilter !== "all" && equipment.lotId !== lotFilter) return false;
      if (qualiteFilter !== "all" && equipment.qualite !== qualiteFilter) return false;
      return true;
    });
  }, [familyFilter, lotFilter, qualiteFilter]);

  return (
    <div className="grid gap-5">
      <section className="relative overflow-hidden rounded-lg border border-[#dfe6d7] bg-white/85 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-md sm:p-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,rgba(183,213,52,0.14),transparent_45%)]"
          aria-hidden="true"
        />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0d6b4d]">Équipements</p>
          <h2 className="font-display mt-2 text-2xl font-medium tracking-tight text-[#102b20] sm:text-3xl">Liste des équipements</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c7c71]">
            Recherchez un équipement par code, ou filtrez par famille, par lot ou par qualité de phosphate.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-[#dfe6d7] bg-white/85 p-4 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm sm:p-5">
        <EquipmentSearch onSelectCode={handleSelectCode} />

        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">Famille</p>
          <CircuitFilters activeFilter={familyFilter} onSelectFilter={setFamilyFilter} options={FAMILY_FILTERS} />
        </div>
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">Lot</p>
          <CircuitFilters activeFilter={lotFilter} onSelectFilter={setLotFilter} options={LOT_FILTERS} />
        </div>
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">Qualité de phosphate</p>
          <CircuitFilters activeFilter={qualiteFilter} onSelectFilter={setQualiteFilter} options={qualiteOptions} />
        </div>
      </section>

      <EquipmentTable equipments={equipments} selectedCode={selectedCode} onSelectCode={handleSelectCode} />
    </div>
  );
}
