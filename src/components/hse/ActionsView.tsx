import { useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Pencil, PlusCircle, Trash2, X } from "lucide-react";
import {
  ACTION_ORIGINES,
  ACTION_PRIORITES,
  ACTION_STATUTS,
  type ActionOrigine,
  type ActionPriorite,
  type ActionStatut,
  type HSEAction,
  type HSEIncident,
  type HSEInspection
} from "./hseData";

const inputClass =
  "h-10 w-full rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]";
const labelClass = "text-[10px] font-bold uppercase tracking-[0.06em] text-[#5e7166]";

const PRIORITE_META: Record<ActionPriorite, { bg: string; border: string; text: string }> = {
  Basse: { bg: "#f2f4f0", border: "#dfe6d7", text: "#5e7166" },
  Moyenne: { bg: "#fdece0", border: "#f3c9a8", text: "#a5460f" },
  Haute: { bg: "#fbe9e9", border: "#f0c2c2", text: "#9a2f2f" }
};

const COLUMNS: ActionStatut[] = ["À faire", "En cours", "Fait"];

function emptyAction(): HSEAction {
  return {
    id: `hse-action-${Date.now()}`,
    titre: "",
    description: "",
    origine: "libre",
    origineId: "",
    responsable: "",
    echeance: "",
    priorite: "Moyenne",
    statut: "À faire"
  };
}

function isOverdue(action: HSEAction): boolean {
  if (action.statut === "Fait" || !action.echeance) return false;
  return action.echeance < new Date().toISOString().slice(0, 10);
}

function ActionModal({
  open,
  initial,
  incidents,
  inspections,
  onClose,
  onSubmit
}: {
  open: boolean;
  initial: HSEAction | null;
  incidents: HSEIncident[];
  inspections: HSEInspection[];
  onClose: () => void;
  onSubmit: (action: HSEAction) => void;
}) {
  const [form, setForm] = useState<HSEAction>(() => initial ?? emptyAction());

  if (!open) return null;

  function update<K extends keyof HSEAction>(key: K, value: HSEAction[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.titre) return;
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
          <h3 className="font-display text-lg font-medium text-[#102b20]">{initial ? "Modifier l'action" : "Nouvelle action corrective"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#dfe6d7] text-[#5e7166] hover:bg-[#f3f8ef]"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        <label className="mt-4 flex flex-col gap-1">
          <span className={labelClass}>Titre</span>
          <input required value={form.titre} onChange={(e) => update("titre", e.target.value)} className={inputClass} placeholder="Ex. Remplacer les projecteurs défectueux" />
        </label>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Priorité</span>
            <select value={form.priorite} onChange={(e) => update("priorite", e.target.value as ActionPriorite)} className={inputClass}>
              {ACTION_PRIORITES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Statut</span>
            <select value={form.statut} onChange={(e) => update("statut", e.target.value as ActionStatut)} className={inputClass}>
              {ACTION_STATUTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Échéance</span>
            <input type="date" value={form.echeance} onChange={(e) => update("echeance", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Responsable (matricule)</span>
            <input value={form.responsable} onChange={(e) => update("responsable", e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Origine</span>
            <select
              value={form.origine}
              onChange={(e) => update("origine", e.target.value as ActionOrigine)}
              className={inputClass}
            >
              {ACTION_ORIGINES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {form.origine === "incident" && (
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Incident lié</span>
              <select value={form.origineId} onChange={(e) => update("origineId", e.target.value)} className={inputClass}>
                <option value="">—</option>
                {incidents.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.date} · {i.zone}
                  </option>
                ))}
              </select>
            </label>
          )}
          {form.origine === "inspection" && (
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Inspection liée</span>
              <select value={form.origineId} onChange={(e) => update("origineId", e.target.value)} className={inputClass}>
                <option value="">—</option>
                {inspections.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.date} · {i.zone}
                  </option>
                ))}
              </select>
            </label>
          )}
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
            {initial ? "Enregistrer les modifications" : "Créer l'action"}
          </button>
          <button type="button" onClick={onClose} className="text-xs font-bold text-[#5e7166] hover:text-[#102b20]">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

function ActionCard({
  action,
  onEdit,
  onDelete,
  onMove
}: {
  action: HSEAction;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const pm = PRIORITE_META[action.priorite];
  const columnIndex = COLUMNS.indexOf(action.statut);
  const overdue = isOverdue(action);

  return (
    <div className="rounded-md border border-[#dfe6d7] bg-white p-3 shadow-[0_10px_28px_rgba(16,43,32,0.05)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-black text-[#102b20]">{action.titre}</p>
        <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black" style={{ color: pm.text, backgroundColor: pm.bg, borderColor: pm.border }}>
          {action.priorite}
        </span>
      </div>
      {action.description && <p className="mt-1.5 text-xs leading-5 text-[#6c7c71]">{action.description}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-[#5e7166]">
        {action.responsable && <span>{action.responsable}</span>}
        {action.echeance && (
          <span className={overdue ? "flex items-center gap-1 font-black text-[#9a2f2f]" : ""}>
            {overdue && <AlertTriangle size={11} aria-hidden="true" />}
            {action.echeance}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={columnIndex === 0}
            onClick={() => onMove(-1)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-[#dfe6d7] text-[#5e7166] hover:bg-[#f3f8ef] disabled:cursor-not-allowed disabled:opacity-30"
            title="Étape précédente"
          >
            <ArrowLeft size={12} aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={columnIndex === COLUMNS.length - 1}
            onClick={() => onMove(1)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-[#dfe6d7] text-[#5e7166] hover:bg-[#f3f8ef] disabled:cursor-not-allowed disabled:opacity-30"
            title="Étape suivante"
          >
            <ArrowRight size={12} aria-hidden="true" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[#cfe3d8] bg-[#e8f4ed] text-[#0d6b4d] hover:bg-[#d9edc8]"
            title="Modifier"
          >
            <Pencil size={12} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[#f0c2c2] bg-[#fbe9e9] text-[#9a2f2f] hover:bg-[#f6d5d5]"
            title="Supprimer"
          >
            <Trash2 size={12} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Onglet "Plan d'actions" — remplace les champs texte libre "actionsCorrectives"/"actionsRequises"
 * des incidents/inspections par des tâches pilotables en Kanban (À faire / En cours / Fait), avec
 * responsable, échéance et priorité. */
export default function ActionsView({
  actions,
  incidents,
  inspections,
  onCreate,
  onUpdate,
  onDelete
}: {
  actions: HSEAction[];
  incidents: HSEIncident[];
  inspections: HSEInspection[];
  onCreate: (action: HSEAction) => void;
  onUpdate: (id: string, patch: Partial<HSEAction>) => void;
  onDelete: (id: string) => void;
}) {
  const [modal, setModal] = useState<{ open: boolean; editing: HSEAction | null }>({ open: false, editing: null });

  function handleSubmit(action: HSEAction) {
    if (modal.editing) onUpdate(action.id, action);
    else onCreate(action);
    setModal({ open: false, editing: null });
  }

  function handleDelete(action: HSEAction) {
    if (!window.confirm(`Supprimer définitivement l'action "${action.titre}" ?`)) return;
    onDelete(action.id);
  }

  function handleMove(action: HSEAction, direction: -1 | 1) {
    const nextIndex = COLUMNS.indexOf(action.statut) + direction;
    if (nextIndex < 0 || nextIndex >= COLUMNS.length) return;
    onUpdate(action.id, { statut: COLUMNS[nextIndex] });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-medium text-[#102b20]">Plan d'actions correctives</h2>
          <p className="mt-1 text-sm text-[#6c7c71]">Suivi des actions issues des incidents et inspections — ou créées librement.</p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ open: true, editing: null })}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-[#0d6b4d] px-5 text-sm font-bold text-white transition hover:bg-[#0a563d]"
        >
          <PlusCircle size={16} aria-hidden="true" />
          Nouvelle action
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((column) => {
          const columnActions = actions.filter((a) => a.statut === column);
          return (
            <div key={column} className="rounded-lg border border-[#dfe6d7] bg-[#f6f9f2] p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-xs font-black uppercase tracking-[0.06em] text-[#5e7166]">{column}</p>
                <span className="rounded-full border border-[#dfe6d7] bg-white px-2 py-0.5 text-[10px] font-black text-[#5e7166]">
                  {columnActions.length}
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {columnActions.length === 0 ? (
                  <p className="rounded-md border border-dashed border-[#cfe3d8] bg-white/60 p-3 text-center text-xs font-semibold text-[#829187]">
                    Aucune action.
                  </p>
                ) : (
                  columnActions.map((action) => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      onEdit={() => setModal({ open: true, editing: action })}
                      onDelete={() => handleDelete(action)}
                      onMove={(direction) => handleMove(action, direction)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ActionModal
        open={modal.open}
        initial={modal.editing}
        incidents={incidents}
        inspections={inspections}
        onClose={() => setModal({ open: false, editing: null })}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
