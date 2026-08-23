import { Eye } from "lucide-react";
import { SILOS } from "./synoptiqueManutentionData";

export default function SilosView({ onViewGlobal }: { onViewGlobal: () => void }) {
  return (
    <div className="grid gap-5">
      <section className="relative overflow-hidden rounded-lg border border-[#dfe6d7] bg-white/85 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-md sm:p-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,rgba(183,213,52,0.14),transparent_45%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0d6b4d]">Silos</p>
            <h2 className="font-display mt-2 text-2xl font-medium tracking-tight text-[#102b20] sm:text-3xl">Silos de stockage</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c7c71]">
              Deux équipements tampons du circuit DB : les trémies T10 assurent la reprise et le dosage vers le poste de chargement 66 ;
              le silo de vidange DB210 absorbe le débordement lorsque les cellules de stockage sont saturées, en attendant qu'une
              capacité se libère. Son état (actif ou non) est visible en direct sur la Vue globale, à partir du bordereau de stock réel.
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SILOS.map((silo) => (
          <article
            key={silo.id}
            className="flex flex-col rounded-lg border border-[#dfe6d7] bg-white/90 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#0d6b4d]/40"
          >
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: silo.color }} aria-hidden="true" />
              <span className="font-display text-lg font-medium text-[#102b20]">{silo.label}</span>
            </span>
            <p className="mt-2 flex-1 text-sm leading-6 text-[#6c7c71]">{silo.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border border-[#dfe6d7] bg-[#f6f7ef] px-2.5 py-2 text-center">
                <p className="font-black uppercase tracking-[0.06em] text-[#5e7166]">Alimenté par</p>
                <p className="mt-1 font-bold text-[#102b20]">{silo.fedBy}</p>
              </div>
              <div className="rounded-md border border-[#dfe6d7] bg-[#f6f7ef] px-2.5 py-2 text-center">
                <p className="font-black uppercase tracking-[0.06em] text-[#5e7166]">Vidange vers</p>
                <p className="mt-1 font-bold text-[#102b20]">{silo.feeds}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
