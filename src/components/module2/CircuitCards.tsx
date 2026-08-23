import { Eye } from "lucide-react";
import { CIRCUITS, EQUIPMENTS, FAMILY_META, type EquipmentFamily } from "./synoptiqueManutentionData";

export default function CircuitCards({
  onVisualize,
  circuitIds,
  title = "Circuits de manutention"
}: {
  onVisualize: (circuitId: string) => void;
  circuitIds?: string[];
  title?: string;
}) {
  const circuits = circuitIds ? CIRCUITS.filter((circuit) => circuitIds.includes(circuit.id)) : CIRCUITS;

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">{title}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {circuits.map((circuit) => {
          const count =
            circuit.id === "vue-globale" ? EQUIPMENTS.length : EQUIPMENTS.filter((eq) => eq.circuitId === circuit.id).length;
          const meta = circuit.family === "Global" ? null : FAMILY_META[circuit.family as EquipmentFamily];

          return (
            <article
              key={circuit.id}
              className="group flex flex-col rounded-lg border border-[#dfe6d7] bg-white/90 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#0d6b4d]/40 hover:shadow-[0_20px_50px_rgba(16,43,32,0.10)]"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg font-medium text-[#102b20]">{circuit.name}</h3>
                <span
                  className="shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em]"
                  style={
                    meta
                      ? { color: meta.text, backgroundColor: meta.bg, borderColor: meta.border }
                      : { color: "#0d6b4d", backgroundColor: "#e8f4ed", borderColor: "#cfe3d8" }
                  }
                >
                  {meta ? meta.label : "Global"}
                </span>
              </div>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#6c7c71]">{circuit.shortDescription}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#5e7166]">
                  ~{count} équipement{count > 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => onVisualize(circuit.id)}
                  className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[#0d6b4d] bg-white px-3.5 text-xs font-bold text-[#0d6b4d] transition group-hover:bg-[#0d6b4d] group-hover:text-white"
                >
                  <Eye size={14} aria-hidden="true" />
                  Visualiser
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
