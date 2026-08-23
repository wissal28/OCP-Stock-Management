import { useState } from "react";
import { ArrowRight, Eye, Route } from "lucide-react";
import CircuitCards from "./CircuitCards";
import CircuitFilters, { type FilterOption } from "./CircuitFilters";
import EquipmentTable from "./EquipmentTable";
import { getEquipmentsByCircuit } from "./synoptiqueManutentionData";

const FAMILY_OPTIONS: FilterOption[] = [
  { id: "all", label: "Toutes les familles" },
  { id: "SA", label: "Famille SA" },
  { id: "SB", label: "Famille SB" }
];

interface TrajetPath {
  title: string;
  description: string;
  steps: string[];
  branches: { label: string; steps: string[] }[];
}

const TRAJETS: TrajetPath[] = [
  {
    title: "Trajet SA (Lot 1)",
    description: "Depuis les silos de stockage jusqu'aux silos de reprise RA/RB.",
    steps: ["Silos de stockage", "SA10", "SA20", "SA200"],
    branches: [
      { label: "Vers RA", steps: ["SA210", "SA211 / SA212 / SA213", "Silos RA11-RA13"] },
      { label: "Vers RB", steps: ["SA220", "SA221 / SA222 / SA223", "Silos RB11-RB13"] }
    ]
  },
  {
    title: "Trajet SB (Lot 2)",
    description: "Depuis les silos de stockage jusqu'aux silos de reprise RC/RD, via le Lot 1.",
    steps: ["Silos de stockage", "SB10", "SB20", "Lot 1", "SB30", "Lot 2", "SB300"],
    branches: [
      { label: "Vers RC", steps: ["SB310", "SB311 / SB312 / SB313", "Silos RC11-RC13"] },
      { label: "Vers RD", steps: ["SB320", "SB321 / SB322 / SB323", "Silos RD11-RD13"] }
    ]
  },
  {
    title: "Trajet vers le Lot 3",
    description: "Prolongement SA/SB au-delà du Lot 2, jusqu'aux 9 cellules du Lot 3 (n°13 à n°21).",
    steps: ["Lot 2", "SA44 / SB40", "SA54-84 / SB50-84"],
    branches: [
      { label: "Cellules Lot 3", steps: ["RC114/RC124/RC134", "RD114/RD124", "RA114/RA124", "RB114/RB124"] }
    ]
  }
];

export default function ConvoyeursView({ onViewGlobal }: { onViewGlobal: () => void }) {
  const [familyFilter, setFamilyFilter] = useState("all");
  const allEquipments = getEquipmentsByCircuit("convoyage-sasb");
  const equipments = familyFilter === "all" ? allEquipments : allEquipments.filter((equipment) => equipment.code.startsWith(familyFilter));

  return (
    <div className="grid gap-5">
      <section className="relative overflow-hidden rounded-lg border border-[#dfe6d7] bg-white/85 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-md sm:p-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,rgba(183,213,52,0.14),transparent_45%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0d6b4d]">Convoyeurs et circuits</p>
            <h2 className="font-display mt-2 text-2xl font-medium tracking-tight text-[#102b20] sm:text-3xl">Convoyeurs et circuits</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c7c71]">
              Convoyeurs principaux SA/SB et leurs aiguillages de répartition vers les silos de reprise des Lots 1 et 2.
            </p>
          </div>
          <button
            type="button"
            onClick={onViewGlobal}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#0d6b4d] bg-white px-5 text-sm font-bold text-[#0d6b4d] transition hover:bg-[#e8f4ed]"
          >
            <Eye size={16} aria-hidden="true" />
            Visualiser dans la vue globale
          </button>
        </div>
      </section>

      <CircuitCards circuitIds={["convoyage-sasb"]} onVisualize={onViewGlobal} title="Circuit de convoyage" />

      <section>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">Trajets des convoyeurs</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {TRAJETS.map((trajet) => (
            <article
              key={trajet.title}
              className="rounded-lg border border-[#dfe6d7] bg-white/90 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm"
            >
              <p className="flex items-center gap-1.5 text-sm font-black text-[#102b20]">
                <Route size={15} className="text-[#0d6b4d]" aria-hidden="true" />
                {trajet.title}
              </p>
              <p className="mt-1.5 text-xs leading-5 text-[#6c7c71]">{trajet.description}</p>

              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {trajet.steps.map((step, index) => (
                  <span key={step} className="flex items-center gap-1.5">
                    {index > 0 && <ArrowRight size={12} className="shrink-0 text-[#a9b1aa]" aria-hidden="true" />}
                    <span className="rounded-full border border-[#cfe3d8] bg-[#e8f4ed] px-2.5 py-1 text-[11px] font-bold text-[#0d6b4d]">
                      {step}
                    </span>
                  </span>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {trajet.branches.map((branch) => (
                  <div key={branch.label} className="rounded-md border border-dashed border-[#cfe3d8] bg-[#f6f7ef] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#5e7166]">{branch.label}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {branch.steps.map((step, index) => (
                        <span key={step} className="flex items-center gap-1.5">
                          {index > 0 && <ArrowRight size={11} className="shrink-0 text-[#a9b1aa]" aria-hidden="true" />}
                          <span className="rounded-full border border-[#dfe6d7] bg-white px-2 py-0.5 text-[10px] font-bold text-[#314238]">
                            {step}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#dfe6d7] bg-white/85 p-4 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm sm:p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">Filtrer par famille</p>
        <CircuitFilters activeFilter={familyFilter} onSelectFilter={setFamilyFilter} options={FAMILY_OPTIONS} />
      </section>

      <EquipmentTable equipments={equipments} selectedCode={null} onSelectCode={() => undefined} />
    </div>
  );
}
