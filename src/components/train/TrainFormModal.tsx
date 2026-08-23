import { useEffect, useState } from "react";
import { AlertTriangle, PlusCircle, Trash2, X } from "lucide-react";
import {
  AXES,
  CELLULES,
  PESEUSES,
  PHOSPHATE_QUALITIES,
  PORTIQUES,
  SILOS,
  type CelluleAllocation,
  type Dechargement,
  type DestinationRow,
  type NavireDirectRow
} from "./trainData";
import {
  buildLiveCellules,
  calculateDuration,
  civilDateForOperationalDay,
  collectSelectedCelluleIds,
  formatCelluleLabel,
  getBlockedCellIds,
  getCurrentOperationalDay,
  getDestinationShares,
  getOperationalDay,
  type LiveCelluleStock,
  validateAxeExclusivity,
  validateCellQualityCompatibility,
  validateQuantityDistribution
} from "./dechargementRules";
import MultiDestinationCell from "./MultiDestinationCell";
import * as api from "../../api";

const AXE_OPTIONS = AXES.map((a) => ({ value: a.name, label: a.name }));
const CELLULE_OPTIONS = CELLULES.map((c) => ({ value: c.id, label: formatCelluleLabel(c) }));
const SILO_OPTIONS = SILOS.map((s) => ({ value: s.id, label: s.label }));
const PESEUSE_DESTINATION_OPTIONS = PESEUSES.map((p) => ({ value: p.id, label: `${p.label} (navire direct)` }));
// DA, DB et Silos peuvent tous rediriger vers une cellule, un silo, ou directement au navire via une peseuse.
const ALL_DESTINATION_OPTIONS = [...CELLULE_OPTIONS, ...SILO_OPTIONS, ...PESEUSE_DESTINATION_OPTIONS];

const inputClass =
  "h-10 w-full rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-semibold text-[#102b20] outline-none transition placeholder:text-[#829187] focus:border-[#0d6b4d] focus:shadow-[0_0_0_4px_rgba(13,107,77,0.10)]";
const labelClass = "text-[10px] font-bold uppercase tracking-[0.06em] text-[#5e7166]";

function emptyDestinationRow(): DestinationRow {
  return { destinations: [], qualite: PHOSPHATE_QUALITIES[0].code, quantite: 0, periode: "" };
}

function emptyHeader(prefillDate: string) {
  return {
    date: prefillDate,
    numeroTrain: "",
    matricule: "",
    nombreWagons: "",
    tonnageExpedie: "",
    tonnageBascule: "",
    axe: "",
    debutDechargement: "",
    finDechargement: "",
    observations: ""
  };
}

function DestinationRowsEditor({
  title,
  rows,
  onChange,
  destinationOptions,
  getBlockedIdsForIndex
}: {
  title: string;
  rows: DestinationRow[];
  onChange: (rows: DestinationRow[]) => void;
  destinationOptions: { value: string; label: string }[];
  getBlockedIdsForIndex?: (index: number) => Set<string>;
}) {
  function updateRow(index: number, patch: Partial<DestinationRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="rounded-md border border-[#dfe6d7] bg-[#f6f9f2] p-3">
      <div className="flex items-center justify-between">
        <p className={labelClass}>{title}</p>
        <button
          type="button"
          onClick={() => onChange([...rows, emptyDestinationRow()])}
          className="flex items-center gap-1 text-[11px] font-bold text-[#0d6b4d] hover:underline"
        >
          <PlusCircle size={12} aria-hidden="true" /> Ajouter une ligne
        </button>
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {rows.map((row, index) => {
          const blocked = getBlockedIdsForIndex?.(index) ?? new Set<string>();
          return (
            <div key={index} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2">
              <div className="flex h-10 items-center rounded-md border border-[#dfe6d7] bg-white px-1">
                <MultiDestinationCell
                  selected={row.destinations}
                  options={destinationOptions}
                  quantiteTotale={row.quantite}
                  blockedIds={blocked}
                  onChange={(values) => updateRow(index, { destinations: values })}
                />
              </div>
              <select value={row.qualite} onChange={(e) => updateRow(index, { qualite: e.target.value })} className={inputClass}>
                {PHOSPHATE_QUALITIES.map((q) => (
                  <option key={q.code} value={q.code}>
                    {q.code}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                placeholder="Quantité (t)"
                value={row.quantite || ""}
                onChange={(e) => updateRow(index, { quantite: Number(e.target.value) || 0 })}
                className={inputClass}
              />
              <input placeholder="Période" value={row.periode} onChange={(e) => updateRow(index, { periode: e.target.value })} className={inputClass} />
              <button
                type="button"
                onClick={() => onChange(rows.filter((_, i) => i !== index))}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#f0c2c2] text-[#9a2f2f] hover:bg-[#fbe9e9]"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          );
        })}
        {rows.length === 0 && <p className="text-xs font-semibold text-[#829187]">Aucune ligne — flux non utilisé pour ce déchargement.</p>}
      </div>
    </div>
  );
}

function CellulesEditor({
  rows,
  onChange,
  getBlockedIdsForIndex
}: {
  rows: CelluleAllocation[];
  onChange: (rows: CelluleAllocation[]) => void;
  getBlockedIdsForIndex: (index: number) => Set<string>;
}) {
  function updateRow(index: number, patch: Partial<CelluleAllocation>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="rounded-md border border-[#dfe6d7] bg-[#f6f9f2] p-3">
      <div className="flex items-center justify-between">
        <p className={labelClass}>Cellules</p>
        <button
          type="button"
          onClick={() => {
            const blockedForNewRow = getBlockedIdsForIndex(rows.length);
            const firstAvailable = CELLULES.find((c) => !blockedForNewRow.has(c.id)) ?? CELLULES[0];
            onChange([...rows, { celluleId: firstAvailable.id, quantite: 0 }]);
          }}
          className="flex items-center gap-1 text-[11px] font-bold text-[#0d6b4d] hover:underline"
        >
          <PlusCircle size={12} aria-hidden="true" /> Ajouter une cellule
        </button>
      </div>
      <p className="mt-1.5 text-[10px] font-semibold text-[#6c7c71]">
        Une seule cellule par axe est autorisée par opération, tous flux confondus (DA, DB, Cellules) — ex. une cellule de l'axe A + une de
        l'axe B est possible, deux cellules de l'axe A ne le sont pas.
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {rows.map((row, index) => {
          const blocked = getBlockedIdsForIndex(index);
          return (
            <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <select value={row.celluleId} onChange={(e) => updateRow(index, { celluleId: e.target.value })} className={inputClass}>
                {CELLULES.filter((c) => !blocked.has(c.id) || c.id === row.celluleId).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} ({c.repriseCode})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                placeholder="Quantité (t)"
                value={row.quantite || ""}
                onChange={(e) => updateRow(index, { quantite: Number(e.target.value) || 0 })}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => onChange(rows.filter((_, i) => i !== index))}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#f0c2c2] text-[#9a2f2f] hover:bg-[#fbe9e9]"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          );
        })}
        {rows.length === 0 && <p className="text-xs font-semibold text-[#829187]">Aucune cellule affectée.</p>}
      </div>
    </div>
  );
}

function NavireDirectEditor({ rows, onChange }: { rows: NavireDirectRow[]; onChange: (rows: NavireDirectRow[]) => void }) {
  function updateRow(index: number, patch: Partial<NavireDirectRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="rounded-md border border-[#dfe6d7] bg-[#f6f9f2] p-3">
      <div className="flex items-center justify-between">
        <p className={labelClass}>Navire direct</p>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...rows,
              { quantite: 0, qualite: PHOSPHATE_QUALITIES[0].code, peseuseId: PESEUSES[0].id, portiqueId: PORTIQUES[0].id, periode: "", navire: "" }
            ])
          }
          className="flex items-center gap-1 text-[11px] font-bold text-[#0d6b4d] hover:underline"
        >
          <PlusCircle size={12} aria-hidden="true" /> Ajouter une ligne
        </button>
      </div>
      <div className="mt-2 flex flex-col gap-2">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-2 gap-2 border-b border-dashed border-[#dfe6d7] pb-2 last:border-0 sm:grid-cols-3">
            <input placeholder="Navire" value={row.navire} onChange={(e) => updateRow(index, { navire: e.target.value })} className={inputClass} />
            <select value={row.qualite} onChange={(e) => updateRow(index, { qualite: e.target.value })} className={inputClass}>
              {PHOSPHATE_QUALITIES.map((q) => (
                <option key={q.code} value={q.code}>
                  {q.code}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              placeholder="Quantité (t)"
              value={row.quantite || ""}
              onChange={(e) => updateRow(index, { quantite: Number(e.target.value) || 0 })}
              className={inputClass}
            />
            <select value={row.peseuseId} onChange={(e) => updateRow(index, { peseuseId: e.target.value })} className={inputClass}>
              {PESEUSES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <select value={row.portiqueId} onChange={(e) => updateRow(index, { portiqueId: e.target.value })} className={inputClass}>
              {PORTIQUES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input placeholder="Période" value={row.periode} onChange={(e) => updateRow(index, { periode: e.target.value })} className={inputClass} />
              <button
                type="button"
                onClick={() => onChange(rows.filter((_, i) => i !== index))}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#f0c2c2] text-[#9a2f2f] hover:bg-[#fbe9e9]"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-xs font-semibold text-[#829187]">Aucun flux vers navire direct.</p>}
      </div>
    </div>
  );
}

export default function TrainFormModal({
  open,
  initial,
  defaultDate,
  onClose,
  onSubmit
}: {
  open: boolean;
  initial?: Dechargement | null;
  defaultDate: string;
  onClose: () => void;
  onSubmit: (dechargement: Dechargement) => void;
}) {
  const [header, setHeader] = useState(emptyHeader(defaultDate));
  const [da, setDa] = useState<DestinationRow[]>([]);
  const [db, setDb] = useState<DestinationRow[]>([]);
  const [silos, setSilos] = useState<DestinationRow[]>([]);
  const [cellules, setCellules] = useState<CelluleAllocation[]>([]);
  const [navireDirect, setNavireDirect] = useState<NavireDirectRow[]>([]);
  const [liveStock, setLiveStock] = useState<LiveCelluleStock[] | null>(null);

  useEffect(() => {
    if (!open) return;
    api
      .computeStockSnapshot(getCurrentOperationalDay())
      .then((snapshot) => setLiveStock(snapshot.cellules))
      .catch(() => setLiveStock(null));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setHeader({
        date: initial.date,
        numeroTrain: initial.numeroTrain,
        matricule: initial.matricule,
        nombreWagons: String(initial.nombreWagons || ""),
        tonnageExpedie: String(initial.tonnageExpedie || ""),
        tonnageBascule: String(initial.tonnageBascule || ""),
        axe: initial.axe,
        debutDechargement: initial.debutDechargement,
        finDechargement: initial.finDechargement,
        observations: initial.observations
      });
      setDa(initial.da);
      setDb(initial.db);
      setSilos(initial.silos);
      setCellules(initial.cellules);
      setNavireDirect(initial.navireDirect);
    } else {
      setHeader(emptyHeader(defaultDate));
      setDa([]);
      setDb([]);
      setSilos([]);
      setCellules([]);
      setNavireDirect([]);
    }
  }, [open, initial, defaultDate]);

  if (!open) return null;

  // Vérifie CHAQUE destination réellement saisie (DA/DB/Silos + section Cellules) contre l'état réel
  // du stock (qualité active ET capacité restante par cellule, calculées en direct depuis Gestion de
  // stock) — pas la structure statique qui ne reflète jamais aucune saisie. Une cellule vide (stock
  // réel = 0) accepte n'importe quelle qualité ; une cellule non vide n'accepte que sa qualité déjà
  // active, et seulement si l'espace restant suffit pour la quantité exacte qui lui revient
  // (getDestinationShares répartit la quantité de la ligne entre ses destinations simultanées).
  const liveCellules = buildLiveCellules(liveStock);
  const celluleIds = new Set(CELLULES.map((c) => c.id));
  function issuesForRow(row: DestinationRow) {
    const qualite = row.qualite || PHOSPHATE_QUALITIES[0].code;
    return getDestinationShares(row)
      .filter((share) => celluleIds.has(share.destination))
      .map((share) => validateCellQualityCompatibility(share.destination, qualite, liveCellules, share.quantite));
  }
  const cellQualityIssues = [
    ...da.flatMap(issuesForRow),
    ...db.flatMap(issuesForRow),
    ...silos.flatMap(issuesForRow),
    ...cellules.map((c) =>
      validateCellQualityCompatibility(c.celluleId, da[0]?.qualite ?? silos[0]?.qualite ?? PHOSPHATE_QUALITIES[0].code, liveCellules, c.quantite)
    )
  ].filter((check) => !check.valid);

  const selectedCelluleIds = collectSelectedCelluleIds({ da, db, silos, cellules });
  const axeConflicts = validateAxeExclusivity(selectedCelluleIds);

  function otherSelectedIds(source: "da" | "db" | "silos" | "cellules", index: number): string[] {
    const ids: string[] = [];
    da.forEach((r, i) => {
      if (!(source === "da" && i === index)) ids.push(...r.destinations);
    });
    db.forEach((r, i) => {
      if (!(source === "db" && i === index)) ids.push(...r.destinations);
    });
    silos.forEach((r, i) => {
      if (!(source === "silos" && i === index)) ids.push(...r.destinations);
    });
    cellules.forEach((c, i) => {
      if (!(source === "cellules" && i === index) && c.celluleId) ids.push(c.celluleId);
    });
    return ids;
  }

  const allAllocations = [...da, ...db, ...silos].map((r) => r.quantite).concat(cellules.map((c) => c.quantite), navireDirect.map((n) => n.quantite));
  const distribution = validateQuantityDistribution(Number(header.tonnageBascule) || 0, allAllocations);
  const duree = calculateDuration(header.debutDechargement, header.finDechargement);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!header.numeroTrain || !header.date) return;
    if (axeConflicts.length > 0) return;

    const dechargement: Dechargement = {
      id: initial?.id ?? `dech-${header.numeroTrain}-${Date.now()}`,
      trainId: initial?.trainId ?? `train-${header.numeroTrain}`,
      date: header.date,
      numeroTrain: header.numeroTrain,
      matricule: header.matricule || header.numeroTrain,
      nombreWagons: Number(header.nombreWagons) || 0,
      tonnageExpedie: Number(header.tonnageExpedie) || 0,
      tonnageBascule: Number(header.tonnageBascule) || 0,
      axe: header.axe,
      debutDechargement: header.debutDechargement,
      finDechargement: header.finDechargement,
      da,
      db,
      silos,
      cellules,
      navireDirect,
      observations: header.observations
    };

    onSubmit(dechargement);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#102b20]/30 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="my-6 w-full max-w-4xl rounded-lg border border-[#dfe6d7] bg-white p-5 shadow-[0_24px_60px_rgba(16,43,32,0.2)]"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-medium text-[#102b20]">{initial ? "Modifier le déchargement" : "Nouveau déchargement"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#dfe6d7] text-[#5e7166] hover:bg-[#f3f8ef]"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Date</span>
            <input type="date" required value={header.date} onChange={(e) => setHeader((h) => ({ ...h, date: e.target.value }))} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>N° train</span>
            <input required value={header.numeroTrain} onChange={(e) => setHeader((h) => ({ ...h, numeroTrain: e.target.value }))} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Matricule</span>
            <input value={header.matricule} onChange={(e) => setHeader((h) => ({ ...h, matricule: e.target.value }))} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Nombre de wagons</span>
            <input type="number" min={0} value={header.nombreWagons} onChange={(e) => setHeader((h) => ({ ...h, nombreWagons: e.target.value }))} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Axe</span>
            <select value={header.axe} onChange={(e) => setHeader((h) => ({ ...h, axe: e.target.value }))} className={inputClass}>
              <option value="">— choisir —</option>
              {AXE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Tonnage expédié</span>
            <input type="number" min={0} value={header.tonnageExpedie} onChange={(e) => setHeader((h) => ({ ...h, tonnageExpedie: e.target.value }))} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Tonnage bascule</span>
            <input type="number" min={0} value={header.tonnageBascule} onChange={(e) => setHeader((h) => ({ ...h, tonnageBascule: e.target.value }))} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Début déchargement</span>
            <input
              type="time"
              value={header.debutDechargement}
              onChange={(e) => {
                const rawValue = e.target.value;
                setHeader((h) => {
                  // La ligne reste rattachée à la même journée d'exploitation (7h → 7h) quelle que
                  // soit l'heure saisie, pour éviter qu'elle ne dérive silencieusement vers la veille.
                  const operationalDay = getOperationalDay(h.date, h.debutDechargement || "12:00");
                  return { ...h, debutDechargement: rawValue, date: civilDateForOperationalDay(operationalDay, rawValue) };
                });
              }}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Fin déchargement</span>
            <input type="time" value={header.finDechargement} onChange={(e) => setHeader((h) => ({ ...h, finDechargement: e.target.value }))} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Durée calculée</span>
            <input disabled value={duree !== null ? `${Math.floor(duree / 60)}h${String(duree % 60).padStart(2, "0")}` : "—"} className={`${inputClass} bg-[#edf2e8] text-[#829187]`} />
          </label>
        </div>

        <div className="mt-4 grid gap-3">
          <DestinationRowsEditor
            title="DA"
            rows={da}
            onChange={setDa}
            destinationOptions={ALL_DESTINATION_OPTIONS}
            getBlockedIdsForIndex={(index) => getBlockedCellIds(otherSelectedIds("da", index))}
          />
          <DestinationRowsEditor
            title="DB"
            rows={db}
            onChange={setDb}
            destinationOptions={ALL_DESTINATION_OPTIONS}
            getBlockedIdsForIndex={(index) => getBlockedCellIds(otherSelectedIds("db", index))}
          />
          <DestinationRowsEditor
            title="Silos"
            rows={silos}
            onChange={setSilos}
            destinationOptions={ALL_DESTINATION_OPTIONS}
            getBlockedIdsForIndex={(index) => getBlockedCellIds(otherSelectedIds("silos", index))}
          />
          <CellulesEditor rows={cellules} onChange={setCellules} getBlockedIdsForIndex={(index) => getBlockedCellIds(otherSelectedIds("cellules", index))} />
          <NavireDirectEditor rows={navireDirect} onChange={setNavireDirect} />
        </div>

        {axeConflicts.length > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-[#f3c9a8] bg-[#fdece0] px-3 py-2.5 text-xs font-bold text-[#a5460f]">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              {axeConflicts.map((c) => `${c.axeName} : ${c.celluleIds.join(", ")} — une seule cellule autorisée par axe et par opération`).join(" · ")}
            </span>
          </div>
        )}

        <label className="mt-4 flex flex-col gap-1">
          <span className={labelClass}>Observations</span>
          <input value={header.observations} onChange={(e) => setHeader((h) => ({ ...h, observations: e.target.value }))} className={inputClass} />
        </label>

        {cellQualityIssues.length > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-[#f3c9a8] bg-[#fdece0] px-3 py-2.5 text-xs font-bold text-[#a5460f]">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{cellQualityIssues.map((r) => r.reason).join(" · ")}</span>
          </div>
        )}

        {header.tonnageBascule && !distribution.isValid && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-[#f3c9a8] bg-[#fdece0] px-3 py-2.5 text-xs font-bold text-[#a5460f]">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              Incohérence : total réparti {distribution.totalReparti.toLocaleString("fr-FR")} t ≠ tonnage bascule{" "}
              {distribution.tonnageBascule.toLocaleString("fr-FR")} t (écart {distribution.ecart > 0 ? "+" : ""}
              {distribution.ecart.toLocaleString("fr-FR")} t)
            </span>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={axeConflicts.length > 0}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-[#0d6b4d] px-5 text-sm font-bold text-white transition hover:bg-[#0a563d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlusCircle size={16} aria-hidden="true" />
            {initial ? "Enregistrer les modifications" : "Enregistrer le déchargement"}
          </button>
          <button type="button" onClick={onClose} className="text-xs font-bold text-[#5e7166] hover:text-[#102b20]">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
