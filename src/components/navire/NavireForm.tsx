import { useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";
import { PHOSPHATE_QUALITIES, type CalePlan, type Navire, type NavireStatus } from "./navireData";

const inputClass =
  "h-11 w-full rounded-md border border-[#dfe6d7] bg-white px-3.5 text-sm font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]";
const labelClass = "text-xs font-bold uppercase tracking-[0.06em] text-[#5e7166]";

const STATUTS: NavireStatus[] = ["En rade", "Accosté", "En chargement", "Chargé", "Parti"];

const EMPTY_FORM = {
  nom: "",
  numeroEC: "",
  qualite: PHOSPHATE_QUALITIES[0].code,
  poste: "",
  dateDebutChargement: "",
  heureDebutChargement: "",
  dateFinChargement: "",
  heureFinChargement: "",
  tonnagePrevu: "",
  statut: "En rade" as NavireStatus,
  observations: ""
};

const EMPTY_CALE: CalePlan = { cale: "", tonnagePrevu: 0 };

export default function NavireForm({ onCreate }: { onCreate: (navire: Navire) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [calesPlan, setCalesPlan] = useState<CalePlan[]>([]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateCale(index: number, patch: Partial<CalePlan>) {
    setCalesPlan((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.nom || !form.dateDebutChargement || !form.heureDebutChargement) return;

    const navire: Navire = {
      id: `navire-${form.nom.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      nom: form.nom,
      numeroEC: form.numeroEC,
      qualite: form.qualite,
      poste: form.poste,
      dateDebutChargement: form.dateDebutChargement,
      heureDebutChargement: form.heureDebutChargement,
      dateFinChargement: form.dateFinChargement,
      heureFinChargement: form.heureFinChargement,
      tonnagePrevu: Number(form.tonnagePrevu) || 0,
      tonnageCharge: 0,
      statut: form.statut,
      observations: form.observations,
      calesPlan: calesPlan.filter((c) => c.cale.trim())
    };

    onCreate(navire);
    setForm(EMPTY_FORM);
    setCalesPlan([]);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-[#0d6b4d] px-5 text-sm font-bold text-white transition hover:bg-[#0a563d]"
      >
        <PlusCircle size={16} aria-hidden="true" />
        Ajouter un navire
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[#dfe6d7] bg-white/95 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)] backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-medium text-[#102b20]">Nouveau navire</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-bold text-[#5e7166] hover:text-[#102b20]">
          Annuler
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Nom du navire</span>
          <input required value={form.nom} onChange={(e) => update("nom", e.target.value)} className={inputClass} placeholder="SAINT VASSILIOS" />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>N° EC</span>
          <input value={form.numeroEC} onChange={(e) => update("numeroEC", e.target.value)} className={inputClass} placeholder="7155" />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Poste / quai</span>
          <input value={form.poste} onChange={(e) => update("poste", e.target.value)} className={inputClass} placeholder="P66" />
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
        <label className="col-span-2 flex flex-col gap-1 sm:col-span-3 lg:col-span-4">
          <span className={labelClass}>Observations</span>
          <input value={form.observations} onChange={(e) => update("observations", e.target.value)} className={inputClass} />
        </label>
      </div>

      <div className="mt-4 rounded-md border border-[#dfe6d7] bg-[#f6f9f2] p-4">
        <div className="flex items-center justify-between">
          <span className={labelClass}>Tonnage prévu par cale (RAF)</span>
          <button
            type="button"
            onClick={() => setCalesPlan((prev) => [...prev, { ...EMPTY_CALE }])}
            className="text-xs font-bold text-[#0d6b4d] hover:text-[#0a563d]"
          >
            + Ajouter une cale
          </button>
        </div>
        {calesPlan.length === 0 ? (
          <p className="mt-2 text-xs text-[#829187]">Aucune cale planifiée — optionnel, active le suivi RAF par cale sur la fiche navire.</p>
        ) : (
          <div className="mt-3 grid gap-2">
            {calesPlan.map((cale, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={cale.cale}
                  onChange={(e) => updateCale(index, { cale: e.target.value })}
                  placeholder="N° cale"
                  className={`${inputClass} h-9 max-w-[140px]`}
                />
                <input
                  type="number"
                  min={0}
                  value={cale.tonnagePrevu || ""}
                  onChange={(e) => updateCale(index, { tonnagePrevu: Number(e.target.value) || 0 })}
                  placeholder="Tonnage prévu"
                  className={`${inputClass} h-9`}
                />
                <button
                  type="button"
                  onClick={() => setCalesPlan((prev) => prev.filter((_, i) => i !== index))}
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded border border-[#f0c2c2] text-[#9a2f2f] hover:bg-[#fbe9e9]"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="mt-4 inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-[#0d6b4d] px-5 text-sm font-bold text-white transition hover:bg-[#0a563d]"
      >
        <PlusCircle size={16} aria-hidden="true" />
        Créer le navire
      </button>
    </form>
  );
}
