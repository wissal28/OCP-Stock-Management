import { useState } from "react";
import { Pencil, PlusCircle, Trash2, X } from "lucide-react";
import {
  INCIDENT_GRAVITES,
  INCIDENT_STATUTS,
  INCIDENT_TYPES,
  type HSEIncident,
  type IncidentGravite,
  type IncidentStatut,
  type IncidentType
} from "./hseData";

const inputClass =
  "h-10 w-full rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]";
const labelClass = "text-[10px] font-bold uppercase tracking-[0.06em] text-[#5e7166]";

const GRAVITE_META: Record<IncidentGravite, { bg: string; border: string; text: string }> = {
  Mineur: { bg: "#eef8f1", border: "#b9ddc9", text: "#237343" },
  "Modéré": { bg: "#fdece0", border: "#f3c9a8", text: "#a5460f" },
  Grave: { bg: "#fbe9e9", border: "#f0c2c2", text: "#9a2f2f" },
  "Très grave": { bg: "#f6e3e3", border: "#e6a8a8", text: "#7a1f1f" }
};

const STATUT_META: Record<IncidentStatut, { bg: string; border: string; text: string }> = {
  Ouvert: { bg: "#fbe9e9", border: "#f0c2c2", text: "#9a2f2f" },
  "En cours": { bg: "#fdece0", border: "#f3c9a8", text: "#a5460f" },
  "Clôturé": { bg: "#eef8f1", border: "#b9ddc9", text: "#237343" }
};

function emptyIncident(): HSEIncident {
  return {
    id: `hse-inc-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    heure: "",
    zone: "",
    type: "Presqu'accident",
    gravite: "Mineur",
    personnesImpliquees: "",
    description: "",
    causeProbable: "",
    actionsCorrectives: "",
    statut: "Ouvert",
    declarePar: ""
  };
}

function IncidentModal({
  open,
  initial,
  onClose,
  onSubmit
}: {
  open: boolean;
  initial: HSEIncident | null;
  onClose: () => void;
  onSubmit: (incident: HSEIncident) => void;
}) {
  const [form, setForm] = useState<HSEIncident>(() => initial ?? emptyIncident());

  if (!open) return null;

  function update<K extends keyof HSEIncident>(key: K, value: HSEIncident[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.date || !form.zone || !form.description) return;
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
          <h3 className="font-display text-lg font-medium text-[#102b20]">{initial ? "Modifier l'incident" : "Déclarer un incident"}</h3>
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
            <span className={labelClass}>Heure</span>
            <input type="time" value={form.heure} onChange={(e) => update("heure", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Zone / lieu</span>
            <input required value={form.zone} onChange={(e) => update("zone", e.target.value)} className={inputClass} placeholder="Ex. Lot 1 - Axe A" />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Type</span>
            <select value={form.type} onChange={(e) => update("type", e.target.value as IncidentType)} className={inputClass}>
              {INCIDENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Gravité</span>
            <select value={form.gravite} onChange={(e) => update("gravite", e.target.value as IncidentGravite)} className={inputClass}>
              {INCIDENT_GRAVITES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Statut</span>
            <select value={form.statut} onChange={(e) => update("statut", e.target.value as IncidentStatut)} className={inputClass}>
              {INCIDENT_STATUTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Personnes impliquées</span>
            <input value={form.personnesImpliquees} onChange={(e) => update("personnesImpliquees", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Déclaré par (matricule)</span>
            <input value={form.declarePar} onChange={(e) => update("declarePar", e.target.value)} className={inputClass} />
          </label>
        </div>

        <label className="mt-3 flex flex-col gap-1">
          <span className={labelClass}>Description</span>
          <textarea
            required
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={2}
            className={`${inputClass} h-auto py-2`}
          />
        </label>
        <label className="mt-3 flex flex-col gap-1">
          <span className={labelClass}>Cause probable</span>
          <textarea value={form.causeProbable} onChange={(e) => update("causeProbable", e.target.value)} rows={2} className={`${inputClass} h-auto py-2`} />
        </label>
        <label className="mt-3 flex flex-col gap-1">
          <span className={labelClass}>Actions correctives</span>
          <textarea
            value={form.actionsCorrectives}
            onChange={(e) => update("actionsCorrectives", e.target.value)}
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
            {initial ? "Enregistrer les modifications" : "Déclarer l'incident"}
          </button>
          <button type="button" onClick={onClose} className="text-xs font-bold text-[#5e7166] hover:text-[#102b20]">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

export default function IncidentsView({
  incidents,
  onCreate,
  onUpdate,
  onDelete
}: {
  incidents: HSEIncident[];
  onCreate: (incident: HSEIncident) => void;
  onUpdate: (id: string, patch: Partial<HSEIncident>) => void;
  onDelete: (id: string) => void;
}) {
  const [modal, setModal] = useState<{ open: boolean; editing: HSEIncident | null }>({ open: false, editing: null });

  function handleSubmit(incident: HSEIncident) {
    if (modal.editing) onUpdate(incident.id, incident);
    else onCreate(incident);
    setModal({ open: false, editing: null });
  }

  function handleDelete(incident: HSEIncident) {
    if (!window.confirm(`Supprimer définitivement cet incident (${incident.zone}, ${incident.date}) ?`)) return;
    onDelete(incident.id);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-medium text-[#102b20]">Incidents & accidents</h2>
          <p className="mt-1 text-sm text-[#6c7c71]">Déclaration et suivi des accidents, incidents et presqu'accidents.</p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ open: true, editing: null })}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-[#0d6b4d] px-5 text-sm font-bold text-white transition hover:bg-[#0a563d]"
        >
          <PlusCircle size={16} aria-hidden="true" />
          Déclarer un incident
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#dfe6d7] bg-white/90 shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#dfe6d7] bg-[#f3f8ef] text-left text-[11px] font-black uppercase tracking-[0.06em] text-[#5e7166]">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Zone</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Gravité</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm font-bold text-[#6c7c71]">
                  Aucun incident déclaré.
                </td>
              </tr>
            ) : (
              incidents.map((i) => {
                const gm = GRAVITE_META[i.gravite];
                const sm = STATUT_META[i.statut];
                return (
                  <tr key={i.id} className="border-b border-[#eef1ea] last:border-0 hover:bg-[#f6f9f2]">
                    <td className="px-4 py-3 font-semibold text-[#314238]">
                      {i.date} {i.heure && `· ${i.heure}`}
                    </td>
                    <td className="px-4 py-3 font-black text-[#102b20]">{i.zone}</td>
                    <td className="px-4 py-3 font-semibold text-[#314238]">{i.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full border px-2 py-0.5 text-[11px] font-black"
                        style={{ color: gm.text, backgroundColor: gm.bg, borderColor: gm.border }}
                      >
                        {i.gravite}
                      </span>
                    </td>
                    <td className="max-w-[260px] truncate px-4 py-3 text-xs text-[#6c7c71]" title={i.description}>
                      {i.description}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full border px-2 py-0.5 text-[11px] font-black"
                        style={{ color: sm.text, backgroundColor: sm.bg, borderColor: sm.border }}
                      >
                        {i.statut}
                      </span>
                    </td>
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

      <IncidentModal open={modal.open} initial={modal.editing} onClose={() => setModal({ open: false, editing: null })} onSubmit={handleSubmit} />
    </div>
  );
}
