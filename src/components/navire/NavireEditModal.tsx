import { useEffect, useState } from "react";
import { Save, Trash2, X } from "lucide-react";
import { PHOSPHATE_QUALITIES, type CalePlan, type Navire, type NavireStatus } from "./navireData";

const inputClass =
  "h-10 w-full rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]";
const labelClass = "text-[10px] font-bold uppercase tracking-[0.06em] text-[#5e7166]";

const STATUTS: NavireStatus[] = ["En rade", "Accosté", "En chargement", "Chargé", "Parti"];

function toFormState(navire: Navire) {
  return {
    nom: navire.nom,
    numeroEC: navire.numeroEC,
    qualite: navire.qualite,
    poste: navire.poste,
    dateDebutChargement: navire.dateDebutChargement,
    heureDebutChargement: navire.heureDebutChargement,
    dateFinChargement: navire.dateFinChargement,
    heureFinChargement: navire.heureFinChargement,
    tonnagePrevu: String(navire.tonnagePrevu || ""),
    statut: navire.statut,
    observations: navire.observations
  };
}

/** Modale d'édition d'un navire existant — mêmes champs que NavireForm (création), même
 * organisation visuelle que TrainFormModal (modale, pré-remplie via `navire`). */
export default function NavireEditModal({
  navire,
  onClose,
  onSubmit
}: {
  navire: Navire | null;
  onClose: () => void;
  onSubmit: (id: string, patch: Partial<Navire>) => void;
}) {
  const [form, setForm] = useState(() => (navire ? toFormState(navire) : null));
  const [calesPlan, setCalesPlan] = useState<CalePlan[]>(navire?.calesPlan ?? []);

  useEffect(() => {
    if (navire) {
      setForm(toFormState(navire));
      setCalesPlan(navire.calesPlan ?? []);
    }
  }, [navire]);

  if (!navire || !form) return null;

  function update<K extends keyof NonNullable<typeof form>>(key: K, value: NonNullable<typeof form>[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateCale(index: number, patch: Partial<CalePlan>) {
    setCalesPlan((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form || !navire) return;
    onSubmit(navire.id, {
      nom: form.nom,
      numeroEC: form.numeroEC,
      qualite: form.qualite,
      poste: form.poste,
      dateDebutChargement: form.dateDebutChargement,
      heureDebutChargement: form.heureDebutChargement,
      dateFinChargement: form.dateFinChargement,
      heureFinChargement: form.heureFinChargement,
      tonnagePrevu: Number(form.tonnagePrevu) || 0,
      statut: form.statut,
      observations: form.observations,
      calesPlan: calesPlan.filter((c) => c.cale.trim())
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
          <h3 className="font-display text-lg font-medium text-[#102b20]">Modifier le navire</h3>
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
            <span className={labelClass}>Nom du navire</span>
            <input required value={form.nom} onChange={(e) => update("nom", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>N° EC</span>
            <input value={form.numeroEC} onChange={(e) => update("numeroEC", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Poste / quai</span>
            <input value={form.poste} onChange={(e) => update("poste", e.target.value)} className={inputClass} />
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
            <span className={labelClass}>Date début chargement</span>
            <input type="date" required value={form.dateDebutChargement} onChange={(e) => update("dateDebutChargement", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Heure début</span>
            <input type="time" required value={form.heureDebutChargement} onChange={(e) => update("heureDebutChargement", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Date fin chargement</span>
            <input type="date" value={form.dateFinChargement} onChange={(e) => update("dateFinChargement", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Heure fin</span>
            <input type="time" value={form.heureFinChargement} onChange={(e) => update("heureFinChargement", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Tonnage prévu</span>
            <input type="number" min={0} value={form.tonnagePrevu} onChange={(e) => update("tonnagePrevu", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Statut</span>
            <select value={form.statut} onChange={(e) => update("statut", e.target.value as NavireStatus)} className={inputClass}>
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

        <div className="mt-4 rounded-md border border-[#dfe6d7] bg-[#f6f9f2] p-3">
          <div className="flex items-center justify-between">
            <span className={labelClass}>Tonnage prévu par cale (RAF)</span>
            <button
              type="button"
              onClick={() => setCalesPlan((prev) => [...prev, { cale: "", tonnagePrevu: 0 }])}
              className="text-xs font-bold text-[#0d6b4d] hover:text-[#0a563d]"
            >
              + Ajouter une cale
            </button>
          </div>
          {calesPlan.length === 0 ? (
            <p className="mt-2 text-xs text-[#829187]">Aucune cale planifiée.</p>
          ) : (
            <div className="mt-3 grid gap-2">
              {calesPlan.map((cale, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input value={cale.cale} onChange={(e) => updateCale(index, { cale: e.target.value })} placeholder="N° cale" className={`${inputClass} max-w-[140px]`} />
                  <input
                    type="number"
                    min={0}
                    value={cale.tonnagePrevu || ""}
                    onChange={(e) => updateCale(index, { tonnagePrevu: Number(e.target.value) || 0 })}
                    placeholder="Tonnage prévu"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setCalesPlan((prev) => prev.filter((_, i) => i !== index))}
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded border border-[#f0c2c2] text-[#9a2f2f] hover:bg-[#fbe9e9]"
                  >
                    <Trash2 size={13} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
