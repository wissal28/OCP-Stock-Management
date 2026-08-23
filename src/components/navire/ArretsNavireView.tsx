import { useState } from "react";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { NATURE_ARRET_OPTIONS, NAVIRE_PORTIQUES, type ArretNavire, type Navire } from "./navireData";
import { calculateArretDuration, formatDuration } from "./navireRules";

const inputClass =
  "h-10 w-full rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d]";
const labelClass = "text-[10px] font-bold uppercase tracking-[0.06em] text-[#5e7166]";

const EMPTY_FORM = {
  navireId: "",
  portique: NAVIRE_PORTIQUES[0],
  elementConcerne: "",
  nature: NATURE_ARRET_OPTIONS[0],
  dateDebut: "",
  heureDebut: "",
  dateFin: "",
  heureFin: "",
  description: ""
};

export default function ArretsNavireView({
  navires,
  arrets,
  onCreate,
  onUpdate,
  onDelete
}: {
  navires: Navire[];
  arrets: ArretNavire[];
  onCreate: (arret: ArretNavire) => void;
  onUpdate: (id: string, patch: Partial<ArretNavire>) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, navireId: navires[0]?.id ?? "" });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function closeForm() {
    setOpen(false);
    setEditingId(null);
  }

  function startEdit(arret: ArretNavire) {
    setForm({
      navireId: arret.navireId,
      portique: arret.portique,
      elementConcerne: arret.elementConcerne,
      nature: arret.nature,
      dateDebut: arret.dateDebut,
      heureDebut: arret.heureDebut,
      dateFin: arret.dateFin,
      heureFin: arret.heureFin,
      description: arret.description
    });
    setEditingId(arret.id);
    setOpen(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.navireId || !form.dateDebut || !form.heureDebut || !form.nature) return;

    if (editingId) {
      onUpdate(editingId, { ...form });
    } else {
      onCreate({
        id: `arret-${Date.now()}`,
        navireId: form.navireId,
        portique: form.portique,
        elementConcerne: form.elementConcerne,
        nature: form.nature,
        dateDebut: form.dateDebut,
        heureDebut: form.heureDebut,
        dateFin: form.dateFin,
        heureFin: form.heureFin,
        description: form.description
      });
    }
    setForm({ ...EMPTY_FORM, navireId: form.navireId });
    closeForm();
  }

  const navireName = (id: string) => navires.find((n) => n.id === id)?.nom ?? "—";

  if (navires.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#b8c6bc] bg-white/70 p-10 text-center text-sm font-bold text-[#6c7c71]">
        Créez d'abord un navire dans l'onglet « Navires » pour enregistrer ses arrêts.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-medium text-[#102b20]">Arrêts de chargement</h2>
          <p className="mt-1 text-sm text-[#6c7c71]">Journal des arrêts par portique — même structure que la feuille "Arrêt".</p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-[#0d6b4d] px-4 text-xs font-bold text-white transition hover:bg-[#0a563d]"
          >
            <PlusCircle size={15} aria-hidden="true" />
            Ajouter un arrêt
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-[#dfe6d7] bg-white/95 p-5 shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-medium text-[#102b20]">{editingId ? "Modifier l'arrêt" : "Nouvel arrêt"}</h3>
            <button type="button" onClick={closeForm} className="text-xs font-bold text-[#5e7166] hover:text-[#102b20]">
              Annuler
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Navire</span>
              <select value={form.navireId} onChange={(e) => update("navireId", e.target.value)} className={inputClass}>
                {navires.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nom}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Portique</span>
              <select value={form.portique} onChange={(e) => update("portique", e.target.value)} className={inputClass}>
                {NAVIRE_PORTIQUES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Élément concerné (S/E)</span>
              <input value={form.elementConcerne} onChange={(e) => update("elementConcerne", e.target.value)} className={inputClass} placeholder="RD124" />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Nature</span>
              <select value={form.nature} onChange={(e) => update("nature", e.target.value)} className={inputClass}>
                {NATURE_ARRET_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Date début</span>
              <input type="date" required value={form.dateDebut} onChange={(e) => update("dateDebut", e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Heure début</span>
              <input type="time" required value={form.heureDebut} onChange={(e) => update("heureDebut", e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Date fin</span>
              <input type="date" value={form.dateFin} onChange={(e) => update("dateFin", e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Heure fin</span>
              <input type="time" value={form.heureFin} onChange={(e) => update("heureFin", e.target.value)} className={inputClass} />
            </label>
            <label className="col-span-2 flex flex-col gap-1 sm:col-span-3 lg:col-span-4">
              <span className={labelClass}>Description</span>
              <input value={form.description} onChange={(e) => update("description", e.target.value)} className={inputClass} />
            </label>
          </div>

          <button
            type="submit"
            className="mt-4 inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-[#0d6b4d] px-5 text-xs font-bold text-white transition hover:bg-[#0a563d]"
          >
            <PlusCircle size={15} aria-hidden="true" />
            {editingId ? "Enregistrer les modifications" : "Enregistrer l'arrêt"}
          </button>
        </form>
      )}

      {arrets.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#b8c6bc] bg-white/70 p-10 text-center text-sm font-bold text-[#6c7c71]">
          Aucun arrêt enregistré.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#dfe6d7] bg-white/90 shadow-[0_16px_42px_rgba(16,43,32,0.06)]">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#dfe6d7] bg-[#f3f8ef] text-left text-[11px] font-black uppercase tracking-[0.06em] text-[#5e7166]">
                <th className="px-4 py-3">Navire</th>
                <th className="px-4 py-3">Portique</th>
                <th className="px-4 py-3">Élément</th>
                <th className="px-4 py-3">Nature</th>
                <th className="px-4 py-3">Début</th>
                <th className="px-4 py-3">Fin</th>
                <th className="px-4 py-3">Durée</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {arrets.map((arret) => (
                <tr key={arret.id} className="border-b border-[#eef1ea] last:border-0 hover:bg-[#f6f9f2]">
                  <td className="px-4 py-3 font-black text-[#102b20]">{navireName(arret.navireId)}</td>
                  <td className="px-4 py-3 font-semibold text-[#314238]">{arret.portique}</td>
                  <td className="px-4 py-3 font-semibold text-[#314238]">{arret.elementConcerne || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-[#f3c9a8] bg-[#fdece0] px-2 py-0.5 text-xs font-black text-[#a5460f]">{arret.nature}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#314238]">
                    {arret.dateDebut} · {arret.heureDebut}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#314238]">{arret.heureFin ? `${arret.dateFin} · ${arret.heureFin}` : "en cours"}</td>
                  <td className="px-4 py-3 font-semibold text-[#314238]">{formatDuration(calculateArretDuration(arret))}</td>
                  <td className="px-4 py-3 text-[#6c7c71]">{arret.description || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEdit(arret)}
                        title="Modifier"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-[#cfe3d8] bg-[#e8f4ed] text-[#0d6b4d] hover:bg-[#d9edc8]"
                      >
                        <Pencil size={12} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(arret.id)}
                        title="Supprimer"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-[#f0c2c2] text-[#9a2f2f] hover:bg-[#fbe9e9]"
                      >
                        <Trash2 size={12} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
