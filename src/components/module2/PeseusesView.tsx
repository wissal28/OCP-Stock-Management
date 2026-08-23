import { CheckCircle2, Eye, Gauge } from "lucide-react";
import { getCircuitById, PESEUSES } from "./synoptiqueManutentionData";
import { useManutentionState } from "./manutentionState";

export default function PeseusesView({ onViewGlobal }: { onViewGlobal: () => void }) {
  // Reprise active par peseuse : une seule par groupe (axe Lot 1/2, puis Lot 3), imposée par les
  // groupes de boutons radio ci-dessous — impossible de sélectionner deux reprises du même groupe à la fois.
  // État partagé avec la Vue globale du schéma (manutentionState) : sélectionner ici ou sur le
  // schéma met à jour la même sélection.
  const { axisSelection, lot3Selection, selectReprise } = useManutentionState();

  return (
    <div className="grid gap-5">
      <section className="relative overflow-hidden rounded-lg border border-[#dfe6d7] bg-white/85 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-md sm:p-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_0%,rgba(183,213,52,0.14),transparent_45%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0d6b4d]">Peseuses</p>
            <h2 className="font-display mt-2 text-2xl font-medium tracking-tight text-[#102b20] sm:text-3xl">Peseuses</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c7c71]">
              Avant tout chargement navire, le phosphate passe obligatoirement par une peseuse : elle mesure la quantité transférée
              sur son circuit, juste avant le portique de chargement correspondant. Chaque peseuse est alimentée par DA40 et DB40, plus
              une reprise de son axe (Lot 1/2) et une reprise du Lot 3 — une seule de chaque à la fois.
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
        {PESEUSES.map((peseuse) => {
          const circuit = getCircuitById(peseuse.circuitId);
          return (
            <article
              key={peseuse.id}
              className="flex flex-col rounded-lg border border-[#dfe6d7] bg-white/90 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#0d6b4d]/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dfe6d7] bg-[#f3f8d9] text-[#0d6b4d]">
                <Gauge size={19} aria-hidden="true" />
              </span>
              <p className="font-display mt-4 text-lg font-medium text-[#102b20]">{peseuse.label}</p>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#6c7c71]">{peseuse.role}</p>
              <div className="mt-4 grid gap-2 text-xs">
                <div className="rounded-md border border-[#dfe6d7] bg-[#f6f7ef] px-2.5 py-2">
                  <p className="font-black uppercase tracking-[0.06em] text-[#5e7166]">Circuit associé</p>
                  <p className="mt-1 font-bold text-[#102b20]">{circuit?.name ?? "Non renseigné"}</p>
                </div>
                <div className="rounded-md border border-[#dfe6d7] bg-[#f6f7ef] px-2.5 py-2">
                  <p className="font-black uppercase tracking-[0.06em] text-[#5e7166]">Quantité mesurée</p>
                  <p className="mt-1 font-bold text-[#102b20]">{peseuse.quantite}</p>
                </div>

                <div className="rounded-md border border-[#dfe6d7] bg-[#f6f7ef] px-2.5 py-2">
                  <p className="font-black uppercase tracking-[0.06em] text-[#5e7166]">Entrées obligatoires</p>
                  <p className="mt-1 font-bold text-[#102b20]">{peseuse.dechargementInputs.join(" + ")}</p>
                </div>

                <div className="rounded-md border border-[#dfe6d7] bg-[#f6f7ef] px-2.5 py-2.5">
                  <p className="font-black uppercase tracking-[0.06em] text-[#5e7166]">Reprise d'axe (une seule)</p>
                  <div className="mt-1.5 flex flex-col gap-1">
                    {peseuse.axisReprises.map((code) => (
                      <label key={code} className="flex cursor-pointer items-center gap-1.5 font-bold text-[#102b20]">
                        <input
                          type="radio"
                          name={`${peseuse.id}-axe`}
                          checked={axisSelection[peseuse.id] === code}
                          onChange={() => selectReprise(peseuse.id, "axis", code)}
                          className="h-3.5 w-3.5 accent-[#0d6b4d]"
                        />
                        {code}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-[#dfe6d7] bg-[#f6f7ef] px-2.5 py-2.5">
                  <p className="font-black uppercase tracking-[0.06em] text-[#5e7166]">Reprise Lot 3 (une seule)</p>
                  <div className="mt-1.5 flex flex-col gap-1">
                    {peseuse.lot3Reprises.map((code) => (
                      <label key={code} className="flex cursor-pointer items-center gap-1.5 font-bold text-[#102b20]">
                        <input
                          type="radio"
                          name={`${peseuse.id}-lot3`}
                          checked={lot3Selection[peseuse.id] === code}
                          onChange={() => selectReprise(peseuse.id, "lot3", code)}
                          className="h-3.5 w-3.5 accent-[#0d6b4d]"
                        />
                        {code}
                      </label>
                    ))}
                  </div>
                </div>

                {axisSelection[peseuse.id] && lot3Selection[peseuse.id] && (
                  <div className="flex items-start gap-1.5 rounded-md border border-[#b9ddc9] bg-[#eef8f1] px-2.5 py-2 text-[#237343]">
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <p className="font-bold">
                      {peseuse.dechargementInputs.join(" + ")} + {axisSelection[peseuse.id]} + {lot3Selection[peseuse.id]}
                    </p>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
