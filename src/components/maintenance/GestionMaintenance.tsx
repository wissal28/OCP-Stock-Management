import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, Pencil, PlusCircle, Trash2, Wrench, X } from "lucide-react";
import {
  MAINTENANCE_INTERVENTIONS,
  MAINTENANCE_STATUTS,
  MAINTENANCE_TYPES,
  type MaintenanceIntervention,
  type MaintenanceStatut,
  type MaintenanceType
} from "./maintenanceData";
import { interventionsAVenir, interventionsEnRetard, tauxPreventif } from "./maintenanceRules";
import { EQUIPMENTS } from "../module2/synoptiqueManutentionData";
import * as api from "../../api";

const inputClass =
  "h-10 w-full rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]";
const labelClass = "text-[10px] font-bold uppercase tracking-[0.06em] text-[#5e7166]";
const kpiCardClass = "rounded-lg border border-[#dfe6d7] bg-white/90 p-4";

const STATUT_META: Record<MaintenanceStatut, { bg: string; border: string; text: string }> = {
  "Planifiée": { bg: "#e7f2fa", border: "#bfdcef", text: "#1d6fa5" },
  "En cours": { bg: "#fdece0", border: "#f3c9a8", text: "#a5460f" },
  "Terminée": { bg: "#eef8f1", border: "#b9ddc9", text: "#237343" },
  "Annulée": { bg: "#f2f4f0", border: "#dfe6d7", text: "#5e7166" }
};

function emptyIntervention(): MaintenanceIntervention {
  return {
    id: `maint-${Date.now()}`,
    equipementCode: EQUIPMENTS[0]?.code ?? "",
    type: "Préventive",
    statut: "Planifiée",
    datePrevue: new Date().toISOString().slice(0, 10),
    dateRealisee: "",
    description: "",
    intervenant: "",
    dureeMinutes: 0
  };
}

function isOverdue(intervention: MaintenanceIntervention): boolean {
  if (intervention.statut === "Terminée" || intervention.statut === "Annulée") return false;
  return intervention.datePrevue < new Date().toISOString().slice(0, 10);
}

function InterventionModal({
  open,
  initial,
  onClose,
  onSubmit
}: {
  open: boolean;
  initial: MaintenanceIntervention | null;
  onClose: () => void;
  onSubmit: (intervention: MaintenanceIntervention) => void;
}) {
  const [form, setForm] = useState<MaintenanceIntervention>(() => initial ?? emptyIntervention());

  if (!open) return null;

  function update<K extends keyof MaintenanceIntervention>(key: K, value: MaintenanceIntervention[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.equipementCode || !form.datePrevue) return;
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
          <h3 className="font-display text-lg font-medium text-[#102b20]">{initial ? "Modifier l'intervention" : "Nouvelle intervention"}</h3>
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
            <span className={labelClass}>Équipement</span>
            <select value={form.equipementCode} onChange={(e) => update("equipementCode", e.target.value)} className={inputClass}>
              {EQUIPMENTS.map((eq) => (
                <option key={eq.code} value={eq.code}>
                  {eq.code} — {eq.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Type</span>
            <select value={form.type} onChange={(e) => update("type", e.target.value as MaintenanceType)} className={inputClass}>
              {MAINTENANCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Statut</span>
            <select value={form.statut} onChange={(e) => update("statut", e.target.value as MaintenanceStatut)} className={inputClass}>
              {MAINTENANCE_STATUTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Date prévue</span>
            <input type="date" required value={form.datePrevue} onChange={(e) => update("datePrevue", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Date réalisée</span>
            <input type="date" value={form.dateRealisee} onChange={(e) => update("dateRealisee", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Intervenant (matricule)</span>
            <input value={form.intervenant} onChange={(e) => update("intervenant", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Durée (minutes)</span>
            <input
              type="number"
              min={0}
              value={form.dureeMinutes}
              onChange={(e) => update("dureeMinutes", Number(e.target.value) || 0)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="mt-3 flex flex-col gap-1">
          <span className={labelClass}>Description</span>
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} className={`${inputClass} h-auto py-2`} />
        </label>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-[#0d6b4d] px-5 text-sm font-bold text-white transition hover:bg-[#0a563d]"
          >
            <PlusCircle size={16} aria-hidden="true" />
            {initial ? "Enregistrer les modifications" : "Créer l'intervention"}
          </button>
          <button type="button" onClick={onClose} className="text-xs font-bold text-[#5e7166] hover:text-[#102b20]">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

export default function GestionMaintenance() {
  const [interventions, setInterventions] = useState<MaintenanceIntervention[]>(MAINTENANCE_INTERVENTIONS);
  const [modal, setModal] = useState<{ open: boolean; editing: MaintenanceIntervention | null }>({ open: false, editing: null });

  useEffect(() => {
    api.listMaintenance().then(setInterventions).catch(() => {});
  }, []);

  function handleCreate(intervention: MaintenanceIntervention) {
    setInterventions((prev) => [intervention, ...prev]);
    api.createMaintenance(intervention).catch(() => {});
  }

  function handleUpdate(id: string, patch: Partial<MaintenanceIntervention>) {
    setInterventions((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    api.updateMaintenance(id, patch).catch(() => {});
  }

  function handleDelete(id: string) {
    setInterventions((prev) => prev.filter((i) => i.id !== id));
    api.deleteMaintenance(id).catch(() => {});
  }

  function handleSubmit(intervention: MaintenanceIntervention) {
    if (modal.editing) handleUpdate(intervention.id, intervention);
    else handleCreate(intervention);
    setModal({ open: false, editing: null });
  }

  function handleDeleteClick(intervention: MaintenanceIntervention) {
    if (!window.confirm(`Supprimer définitivement l'intervention sur ${intervention.equipementCode} ?`)) return;
    handleDelete(intervention.id);
  }

  const enRetard = interventionsEnRetard(interventions);
  const aVenir = interventionsAVenir(interventions, 7);
  const taux = tauxPreventif(interventions);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0d6b4d]">Module métier</p>
          <h1 className="font-display mt-1 text-2xl font-medium text-[#102b20]">Maintenance</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#6c7c71]">
            Planification et suivi des interventions préventives et correctives sur les équipements du schéma de manutention.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ open: true, editing: null })}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-[#0d6b4d] px-5 text-sm font-bold text-white transition hover:bg-[#0a563d]"
        >
          <PlusCircle size={16} aria-hidden="true" />
          Nouvelle intervention
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className={kpiCardClass}>
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
            <Wrench size={13} aria-hidden="true" />
            Interventions
          </p>
          <p className="font-display mt-2 text-2xl font-medium text-[#102b20]">{interventions.length}</p>
        </div>
        <div className={kpiCardClass}>
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
            <AlertTriangle size={13} aria-hidden="true" />
            En retard
          </p>
          <p className={`font-display mt-2 text-2xl font-medium ${enRetard.length > 0 ? "text-[#9a2f2f]" : "text-[#102b20]"}`}>{enRetard.length}</p>
        </div>
        <div className={kpiCardClass}>
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
            <CalendarClock size={13} aria-hidden="true" />
            À venir (7 j)
          </p>
          <p className="font-display mt-2 text-2xl font-medium text-[#102b20]">{aVenir.length}</p>
        </div>
        <div className={kpiCardClass}>
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#5e7166]">
            <Wrench size={13} aria-hidden="true" />
            Taux préventif
          </p>
          <p className="font-display mt-2 text-2xl font-medium text-[#102b20]">{taux}%</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#dfe6d7] bg-white/90 shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#dfe6d7] bg-[#f3f8ef] text-left text-[11px] font-black uppercase tracking-[0.06em] text-[#5e7166]">
              <th className="px-4 py-3">Équipement</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Date prévue</th>
              <th className="px-4 py-3">Date réalisée</th>
              <th className="px-4 py-3">Intervenant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {interventions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm font-bold text-[#6c7c71]">
                  Aucune intervention enregistrée.
                </td>
              </tr>
            ) : (
              interventions.map((i) => {
                const sm = STATUT_META[i.statut];
                const overdue = isOverdue(i);
                return (
                  <tr key={i.id} className="border-b border-[#eef1ea] last:border-0 hover:bg-[#f6f9f2]">
                    <td className="px-4 py-3 font-black text-[#102b20]">{i.equipementCode}</td>
                    <td className="px-4 py-3 font-semibold text-[#314238]">{i.type}</td>
                    <td className="px-4 py-3 font-semibold text-[#314238]">
                      <span className={overdue ? "flex items-center gap-1 font-black text-[#9a2f2f]" : ""}>
                        {overdue && <AlertTriangle size={12} aria-hidden="true" />}
                        {i.datePrevue}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#314238]">{i.dateRealisee || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-[#314238]">{i.intervenant || "—"}</td>
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
                          onClick={() => handleDeleteClick(i)}
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

      <InterventionModal open={modal.open} initial={modal.editing} onClose={() => setModal({ open: false, editing: null })} onSubmit={handleSubmit} />
    </div>
  );
}
