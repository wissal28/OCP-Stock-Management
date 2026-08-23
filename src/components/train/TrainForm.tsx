import { useState } from "react";
import { PlusCircle } from "lucide-react";
import {
  DESTINATION_LABELS,
  PHOSPHATE_QUALITIES,
  computeDestinationPrevue,
  type CelluleQuantitePrevue,
  type Train,
  type TrainStatus
} from "./trainData";
import CelluleQuantiteEditor from "./CelluleQuantiteEditor";

const inputClass =
  "h-11 w-full rounded-md border border-[#dfe6d7] bg-white px-3.5 text-sm font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]";
const labelClass = "text-xs font-bold uppercase tracking-[0.06em] text-[#5e7166]";

const STATUTS: TrainStatus[] = ["Prévu", "Arrivé", "En déchargement", "Déchargé", "En retard", "Annulé"];

export default function TrainForm({ onCreate }: { onCreate: (train: Train) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    dateArriveePrevue: "",
    heureArriveePrevue: "",
    heureArriveeReelle: "",
    numeroTrain: "",
    matricule: "",
    nombreWagons: "",
    qualite: PHOSPHATE_QUALITIES[0].code,
    tonnagePrevu: "",
    tonnageExpedie: "",
    tonnageBascule: "",
    statut: "Prévu" as TrainStatus,
    celluleDestinationPrevue: [] as CelluleQuantitePrevue[],
    observations: ""
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.numeroTrain || !form.dateArriveePrevue || !form.heureArriveePrevue) return;

    const train: Train = {
      id: `train-${form.numeroTrain}-${Date.now()}`,
      dateArriveePrevue: form.dateArriveePrevue,
      heureArriveePrevue: form.heureArriveePrevue,
      heureArriveeReelle: form.heureArriveeReelle,
      numeroTrain: form.numeroTrain,
      matricule: form.matricule || form.numeroTrain,
      nombreWagons: Number(form.nombreWagons) || 0,
      qualite: form.qualite,
      tonnagePrevu: Number(form.tonnagePrevu) || 0,
      tonnageExpedie: Number(form.tonnageExpedie) || 0,
      tonnageBascule: Number(form.tonnageBascule) || 0,
      statut: form.statut,
      destinationPrevue: computeDestinationPrevue(form.celluleDestinationPrevue),
      celluleDestinationPrevue: form.celluleDestinationPrevue,
      observations: form.observations
    };

    onCreate(train);
    setForm({
      dateArriveePrevue: "",
      heureArriveePrevue: "",
      heureArriveeReelle: "",
      numeroTrain: "",
      matricule: "",
      nombreWagons: "",
      qualite: PHOSPHATE_QUALITIES[0].code,
      tonnagePrevu: "",
      tonnageExpedie: "",
      tonnageBascule: "",
      statut: "Prévu",
      celluleDestinationPrevue: [],
      observations: ""
    });
    setOpen(false);
  }

  const retard = form.heureArriveeReelle && form.heureArriveePrevue && form.heureArriveeReelle > form.heureArriveePrevue;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-[#0d6b4d] px-5 text-sm font-bold text-white transition hover:bg-[#0a563d]"
      >
        <PlusCircle size={16} aria-hidden="true" />
        Ajouter un train
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[#dfe6d7] bg-white/95 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-medium text-[#102b20]">Nouveau train</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-bold text-[#5e7166] hover:text-[#102b20]">
          Annuler
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
          <input required value={form.numeroTrain} onChange={(e) => update("numeroTrain", e.target.value)} className={inputClass} placeholder="9608" />
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
        <label className="col-span-2 flex flex-col gap-1 sm:col-span-3 lg:col-span-4">
          <span className={labelClass}>Observations</span>
          <input value={form.observations} onChange={(e) => update("observations", e.target.value)} className={inputClass} />
        </label>
      </div>

      <div className="mt-4 rounded-md border border-[#dfe6d7] bg-[#f6f9f2] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={labelClass}>Cellule(s)/silo(s)/navire prévu(s) — quantité exacte</span>
          <span className="rounded-full border border-[#cfe3d8] bg-[#e8f4ed] px-2.5 py-1 text-[10px] font-black text-[#0d6b4d]">
            {DESTINATION_LABELS[computeDestinationPrevue(form.celluleDestinationPrevue)]}
          </span>
        </div>
        <p className="mt-1 text-xs text-[#829187]">
          Indicatif : la quantité réellement transférée reste enregistrée plus tard via le déchargement. La destination prévue ci-dessus
          est déduite automatiquement de ce que vous saisissez ici. Pour une cellule, cliquez le badge DA10/DB10 pour choisir vous-même
          le flux — l'alternance affichée n'est qu'une proposition par défaut.
        </p>
        <div className="mt-3">
          <CelluleQuantiteEditor rows={form.celluleDestinationPrevue} onChange={(rows) => update("celluleDestinationPrevue", rows)} qualite={form.qualite} />
        </div>
      </div>

      {retard && (
        <p className="mt-3 rounded-md border border-[#f3c9a8] bg-[#fdece0] px-3 py-2 text-xs font-bold text-[#a5460f]">
          ⚠ Le train arrive après l'heure prévue — il sera marqué en retard.
        </p>
      )}

      <button
        type="submit"
        className="mt-4 inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-[#0d6b4d] px-5 text-sm font-bold text-white transition hover:bg-[#0a563d]"
      >
        <PlusCircle size={16} aria-hidden="true" />
        Créer opération de déchargement
      </button>
    </form>
  );
}
