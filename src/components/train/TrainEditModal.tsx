import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import { DESTINATION_LABELS, PHOSPHATE_QUALITIES, computeDestinationPrevue, type Train, type TrainStatus } from "./trainData";
import CelluleQuantiteEditor from "./CelluleQuantiteEditor";

const inputClass =
  "h-10 w-full rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]";
const labelClass = "text-[10px] font-bold uppercase tracking-[0.06em] text-[#5e7166]";

const STATUTS: TrainStatus[] = ["Prévu", "Arrivé", "En déchargement", "Déchargé", "En retard", "Annulé"];

function toFormState(train: Train) {
  return {
    dateArriveePrevue: train.dateArriveePrevue,
    heureArriveePrevue: train.heureArriveePrevue,
    heureArriveeReelle: train.heureArriveeReelle,
    numeroTrain: train.numeroTrain,
    matricule: train.matricule,
    nombreWagons: String(train.nombreWagons || ""),
    qualite: train.qualite,
    tonnagePrevu: String(train.tonnagePrevu || ""),
    tonnageExpedie: String(train.tonnageExpedie || ""),
    tonnageBascule: String(train.tonnageBascule || ""),
    statut: train.statut,
    celluleDestinationPrevue: train.celluleDestinationPrevue ?? [],
    observations: train.observations
  };
}

/** Modale d'édition d'un train existant (fiche "horaires & arrivées") — même organisation visuelle
 * que NavireEditModal / TrainFormModal (modale, pré-remplie via `train`). */
export default function TrainEditModal({
  train,
  onClose,
  onSubmit
}: {
  train: Train | null;
  onClose: () => void;
  onSubmit: (id: string, patch: Partial<Train>) => void;
}) {
  const [form, setForm] = useState(() => (train ? toFormState(train) : null));

  useEffect(() => {
    if (train) setForm(toFormState(train));
  }, [train]);

  if (!train || !form) return null;

  function update<K extends keyof NonNullable<typeof form>>(key: K, value: NonNullable<typeof form>[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form || !train) return;
    onSubmit(train.id, {
      dateArriveePrevue: form.dateArriveePrevue,
      heureArriveePrevue: form.heureArriveePrevue,
      heureArriveeReelle: form.heureArriveeReelle,
      numeroTrain: form.numeroTrain,
      matricule: form.matricule,
      nombreWagons: Number(form.nombreWagons) || 0,
      qualite: form.qualite,
      tonnagePrevu: Number(form.tonnagePrevu) || 0,
      tonnageExpedie: Number(form.tonnageExpedie) || 0,
      tonnageBascule: Number(form.tonnageBascule) || 0,
      statut: form.statut,
      destinationPrevue: computeDestinationPrevue(form.celluleDestinationPrevue),
      celluleDestinationPrevue: form.celluleDestinationPrevue,
      observations: form.observations
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[#102b20]/30 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="my-6 w-full max-w-2xl rounded-lg border border-[#dfe6d7] bg-white p-5 shadow-[0_24px_60px_rgba(16,43,32,0.2)]"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-medium text-[#102b20]">Modifier le train</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#dfe6d7] text-[#5e7166] hover:bg-[#f3f8ef]"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Date arrivée prévue</span>
            <input type="date" required value={form.dateArriveePrevue} onChange={(e) => update("dateArriveePrevue", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Heure prévue</span>
            <input type="time" required value={form.heureArriveePrevue} onChange={(e) => update("heureArriveePrevue", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Heure réelle</span>
            <input type="time" value={form.heureArriveeReelle} onChange={(e) => update("heureArriveeReelle", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>N° train</span>
            <input required value={form.numeroTrain} onChange={(e) => update("numeroTrain", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Matricule</span>
            <input value={form.matricule} onChange={(e) => update("matricule", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Nombre de wagons</span>
            <input type="number" min={0} value={form.nombreWagons} onChange={(e) => update("nombreWagons", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Qualité phosphate</span>
            <select value={form.qualite} onChange={(e) => update("qualite", e.target.value)} className={inputClass}>
              {PHOSPHATE_QUALITIES.map((q) => (
                <option key={q.code} value={q.code}>
                  {q.code}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Tonnage prévu</span>
            <input type="number" min={0} value={form.tonnagePrevu} onChange={(e) => update("tonnagePrevu", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Tonnage expédié</span>
            <input type="number" min={0} value={form.tonnageExpedie} onChange={(e) => update("tonnageExpedie", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Tonnage bascule</span>
            <input type="number" min={0} value={form.tonnageBascule} onChange={(e) => update("tonnageBascule", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Statut</span>
            <select value={form.statut} onChange={(e) => update("statut", e.target.value as TrainStatus)} className={inputClass}>
              {STATUTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2 flex flex-col gap-1 sm:col-span-3">
            <span className={labelClass}>Observations</span>
            <input value={form.observations} onChange={(e) => update("observations", e.target.value)} className={inputClass} />
          </label>
        </div>

        <div className="mt-4 rounded-md border border-[#dfe6d7] bg-[#f6f9f2] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={labelClass}>Cellule(s)/silo(s)/navire prévu(s) — quantité exacte</span>
            <span className="rounded-full border border-[#cfe3d8] bg-[#e8f4ed] px-2.5 py-1 text-[10px] font-black text-[#0d6b4d]">
              {DESTINATION_LABELS[computeDestinationPrevue(form.celluleDestinationPrevue)]}
            </span>
          </div>
          <div className="mt-2.5">
            <CelluleQuantiteEditor
              rows={form.celluleDestinationPrevue}
              onChange={(rows) => update("celluleDestinationPrevue", rows)}
              compact
              qualite={form.qualite}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-[#0d6b4d] px-5 text-sm font-bold text-white transition hover:bg-[#0a563d]"
          >
            <Save size={16} aria-hidden="true" />
            Enregistrer les modifications
          </button>
          <button type="button" onClick={onClose} className="text-xs font-bold text-[#5e7166] hover:text-[#102b20]">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
