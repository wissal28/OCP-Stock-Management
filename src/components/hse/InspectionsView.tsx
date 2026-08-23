import { useState } from "react";
import { CheckCircle2, Pencil, PlusCircle, Trash2, X, XCircle } from "lucide-react";
import { INSPECTION_STATUTS, INSPECTION_TYPES, type ChecklistItem, type HSEInspection, type InspectionStatut } from "./hseData";

const inputClass =
  "h-10 w-full rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]";
const labelClass = "text-[10px] font-bold uppercase tracking-[0.06em] text-[#5e7166]";

const STATUT_META: Record<InspectionStatut, { bg: string; border: string; text: string }> = {
  Conforme: { bg: "#eef8f1", border: "#b9ddc9", text: "#237343" },
  "Non conforme": { bg: "#fbe9e9", border: "#f0c2c2", text: "#9a2f2f" },
  "Conforme avec réserves": { bg: "#fdece0", border: "#f3c9a8", text: "#a5460f" }
};

function emptyInspection(): HSEInspection {
  return {
    id: `hse-insp-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    zone: "",
    type: INSPECTION_TYPES[0],
    inspecteur: "",
    statut: "Conforme",
    checklist: [],
    observations: "",
    actionsRequises: "",
    dateProchaineInspection: ""
  };
}

function ChecklistEditor({ items, onChange }: { items: ChecklistItem[]; onChange: (items: ChecklistItem[]) => void }) {
  function updateItem(index: number, patch: Partial<ChecklistItem>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }
  function addItem() {
    onChange([...items, { libelle: "", conforme: null, observation: "" }]);
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            value={item.libelle}
            onChange={(e) => updateItem(index, { libelle: e.target.value })}
            placeholder="Point de contrôle"
            className={`${inputClass} flex-1`}
          />
          <button
            type="button"
            onClick={() => updateItem(index, { conforme: item.conforme === true ? null : true })}
            className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded border transition ${
              item.conforme === true ? "border-[#b9ddc9] bg-[#eef8f1] text-[#237343]" : "border-[#dfe6d7] text-[#829187] hover:bg-[#f6f9f2]"
            }`}
            title="Conforme"
          >
            <CheckCircle2 size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => updateItem(index, { conforme: item.conforme === false ? null : false })}
            className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded border transition ${
              item.conforme === false ? "border-[#f0c2c2] bg-[#fbe9e9] text-[#9a2f2f]" : "border-[#dfe6d7] text-[#829187] hover:bg-[#f6f9f2]"
            }`}
            title="Non conforme"
          >
            <XCircle size={16} aria-hidden="true" />
          </button>
          <input
            value={item.observation}
            onChange={(e) => updateItem(index, { observation: e.target.value })}
            placeholder="Observation"
            className={`${inputClass} w-40`}
          />
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded border border-[#f0c2c2] text-[#9a2f2f] hover:bg-[#fbe9e9]"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      ))}
      <button type="button" onClick={addItem} className="self-start text-xs font-bold text-[#0d6b4d] hover:text-[#0a563d]">
        + Ajouter un point de contrôle
      </button>
    </div>
  );
}

function InspectionModal({
  open,
  initial,
  onClose,
  onSubmit
}: {
  open: boolean;
  initial: HSEInspection | null;
  onClose: () => void;
  onSubmit: (inspection: HSEInspection) => void;
}) {
  const [form, setForm] = useState<HSEInspection>(() => initial ?? emptyInspection());

  if (!open) return null;

  function update<K extends keyof HSEInspection>(key: K, value: HSEInspection[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.date || !form.zone) return;
    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-[#102b20]/30 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="my-6 w-full max-w-2xl rounded-lg border border-[#dfe6d7] bg-white p-5 shadow-[0_24px_60px_rgba(16,43,32,0.2)]"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-medium text-[#102b20]">{initial ? "Modifier l'inspection" : "Nouvelle inspection"}</h3>
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
            <span className={labelClass}>Date</span>
            <input type="date" required value={form.date} onChange={(e) => update("date", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Zone / équipement</span>
            <input required value={form.zone} onChange={(e) => update("zone", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Type d'inspection</span>
            <select value={form.type} onChange={(e) => update("type", e.target.value)} className={inputClass}>
              {INSPECTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Inspecteur (matricule)</span>
            <input value={form.inspecteur} onChange={(e) => update("inspecteur", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Statut</span>
            <select value={form.statut} onChange={(e) => update("statut", e.target.value as InspectionStatut)} className={inputClass}>
              {INSPECTION_STATUTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Prochaine inspection</span>
            <input
              type="date"
              value={form.dateProchaineInspection}
              onChange={(e) => update("dateProchaineInspection", e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-4 rounded-md border border-[#dfe6d7] bg-[#f6f9f2] p-3.5">
          <span className={labelClass}>Points de contrôle</span>
          <div className="mt-2.5">
            <ChecklistEditor items={form.checklist} onChange={(checklist) => update("checklist", checklist)} />
          </div>
        </div>

        <label className="mt-3 flex flex-col gap-1">
          <span className={labelClass}>Observations</span>
          <textarea value={form.observations} onChange={(e) => update("observations", e.target.value)} rows={2} className={`${inputClass} h-auto py-2`} />
        </label>
        <label className="mt-3 flex flex-col gap-1">
          <span className={labelClass}>Actions requises</span>
          <textarea
            value={form.actionsRequises}
            onChange={(e) => update("actionsRequises", e.target.value)}
            rows={2}
            className={`${inputClass} h-auto py-2`}
          />
        </label>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-[#0d6b4d] px-5 text-sm font-bold text-white transition hover:bg-[#0a563d]"
          >
            <PlusCircle size={16} aria-hidden="true" />
            {initial ? "Enregistrer les modifications" : "Créer l'inspection"}
          </button>
          <button type="button" onClick={onClose} className="text-xs font-bold text-[#5e7166] hover:text-[#102b20]">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

export default function InspectionsView({
  inspections,
  onCreate,
  onUpdate,
  onDelete
}: {
  inspections: HSEInspection[];
  onCreate: (inspection: HSEInspection) => void;
  onUpdate: (id: string, patch: Partial<HSEInspection>) => void;
  onDelete: (id: string) => void;
}) {
  const [modal, setModal] = useState<{ open: boolean; editing: HSEInspection | null }>({ open: false, editing: null });

  function handleSubmit(inspection: HSEInspection) {
    if (modal.editing) onUpdate(inspection.id, inspection);
    else onCreate(inspection);
    setModal({ open: false, editing: null });
  }

  function handleDelete(inspection: HSEInspection) {
    if (!window.confirm(`Supprimer définitivement cette inspection (${inspection.zone}, ${inspection.date}) ?`)) return;
    onDelete(inspection.id);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-medium text-[#102b20]">Inspections & checklists sécurité</h2>
          <p className="mt-1 text-sm text-[#6c7c71]">Suivi des inspections périodiques et de leur conformité.</p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ open: true, editing: null })}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-[#0d6b4d] px-5 text-sm font-bold text-white transition hover:bg-[#0a563d]"
        >
          <PlusCircle size={16} aria-hidden="true" />
          Nouvelle inspection
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#dfe6d7] bg-white/90 shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#dfe6d7] bg-[#f3f8ef] text-left text-[11px] font-black uppercase tracking-[0.06em] text-[#5e7166]">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Inspecteur</th>
              <th className="px-4 py-3">Points contrôlés</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Prochaine</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {inspections.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm font-bold text-[#6c7c71]">
                  Aucune inspection enregistrée.
                </td>
              </tr>
            ) : (
              inspections.map((i) => {
                const sm = STATUT_META[i.statut];
                const nonConformes = i.checklist.filter((c) => c.conforme === false).length;
                return (
                  <tr key={i.id} className="border-b border-[#eef1ea] last:border-0 hover:bg-[#f6f9f2]">
                    <td className="px-4 py-3 font-semibold text-[#314238]">{i.date}</td>
                    <td className="px-4 py-3 font-black text-[#102b20]">{i.zone}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-[#314238]">{i.type}</td>
                    <td className="px-4 py-3 font-semibold text-[#314238]">{i.inspecteur || "—"}</td>
                    <td className="px-4 py-3 text-xs font-bold text-[#314238]">
                      {i.checklist.length} point{i.checklist.length > 1 ? "s" : ""}
                      {nonConformes > 0 && <span className="ml-1 text-[#9a2f2f]">({nonConformes} non conforme{nonConformes > 1 ? "s" : ""})</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full border px-2 py-0.5 text-[11px] font-black"
                        style={{ color: sm.text, backgroundColor: sm.bg, borderColor: sm.border }}
                      >
                        {i.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#314238]">{i.dateProchaineInspection || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setModal({ open: true, editing: i })}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#cfe3d8] bg-[#e8f4ed] text-[#0d6b4d] hover:bg-[#d9edc8]"
                          title="Modifier"
                        >
                          <Pencil size={13} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(i)}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#f0c2c2] bg-[#fbe9e9] text-[#9a2f2f] hover:bg-[#f6d5d5]"
                          title="Supprimer"
                        >
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <InspectionModal open={modal.open} initial={modal.editing} onClose={() => setModal({ open: false, editing: null })} onSubmit={handleSubmit} />
    </div>
  );
}
