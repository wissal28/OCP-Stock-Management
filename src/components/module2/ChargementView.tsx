import { Eye } from "lucide-react";
import CircuitCards from "./CircuitCards";
import EquipmentTable from "./EquipmentTable";
import { EQUIPMENTS } from "./synoptiqueManutentionData";

const CHARGEMENT_CIRCUITS = ["portique-a", "portique-b", "portique-c", "portique-d", "chargement-navire"];

export default function ChargementView({ onViewGlobal }: { onViewGlobal: () => void }) {
  const equipments = EQUIPMENTS.filter((equipment) => CHARGEMENT_CIRCUITS.includes(equipment.circuitId));

  return (
    <div className="grid gap-5">
      <section className="relative overflow-hidden rounded-lg border border-[#dfe6d7] bg-white/85 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-md sm:p-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,rgba(183,213,52,0.14),transparent_45%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0d6b4d]">Moyens de chargement</p>
            <h2 className="font-display mt-2 text-2xl font-medium tracking-tight text-[#102b20] sm:text-3xl">Moyens de chargement</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c7c71]">
              Lignes CA/CB/CC/CD, descentes PA/PB/PC/PD, portiques A à D et zone finale de chargement navire.
            </p>
          </div>
          <button
            type="button"
            onClick={onViewGlobal}
            className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-[#0d6b4d] bg-white px-5 text-sm font-bold text-[#0d6b4d] transition hover:bg-[#e8f4ed]"
          >
            <Eye size={16} aria-hidden="true" />
            Voir sur le schéma global
          </button>
        </div>
      </section>

      <CircuitCards circuitIds={CHARGEMENT_CIRCUITS} onVisualize={onViewGlobal} title="Familles de chargement" />

      <EquipmentTable equipments={equipments} selectedCode={null} onSelectCode={() => undefined} />
    </div>
  );
}
