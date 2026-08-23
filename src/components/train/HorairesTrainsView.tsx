import { useMemo, useState } from "react";
import { Filter, RefreshCw } from "lucide-react";
import { PHOSPHATE_QUALITIES, type ArretTrain, type Dechargement, type DestinationPrevue, type Train, type TrainStatus } from "./trainData";
import TrainForm from "./TrainForm";
import TrainTable from "./TrainTable";
import TrainDetailsPanel from "./TrainDetailsPanel";

const STATUTS: TrainStatus[] = ["Prévu", "Arrivé", "En déchargement", "Déchargé", "En retard", "Annulé"];
const DESTINATIONS: DestinationPrevue[] = ["Lots", "Silos", "Navire direct", "Mixte"];

const selectClass =
  "h-10 rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-bold text-[#314238] outline-none transition focus:border-[#0d6b4d]";

export default function HorairesTrainsView({
  trains,
  dechargements,
  arretsTrain,
  onCreate,
  onUpdate,
  onDelete,
  onImportCsv
}: {
  trains: Train[];
  /** Tous les déchargements connus — sert à afficher, dans la fiche d'un train, exactement quelles
   * cellules ont reçu son phosphate et en quelle quantité. */
  dechargements?: Dechargement[];
  /** Tous les arrêts connus — filtrés par train dans la fiche, pour l'analyse des immobilisations. */
  arretsTrain?: ArretTrain[];
  onCreate: (train: Train) => void;
  onUpdate?: (id: string, patch: Partial<Train>) => void;
  onDelete?: (id: string) => void;
  /** Relit database/trains.csv (édité à la main dans un tableur) et réconcilie avec la base. */
  onImportCsv?: () => Promise<{ created: number; updated: number; total: number }>;
}) {
  const [dateFilter, setDateFilter] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("");
  const [qualiteFilter, setQualiteFilter] = useState<string>("");
  const [destinationFilter, setDestinationFilter] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const selected = trains.find((t) => t.id === selectedId) ?? null;

  async function handleImportCsv() {
    if (!onImportCsv) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const result = await onImportCsv();
      setImportMessage(`${result.created} créé(s), ${result.updated} mis à jour depuis trains.csv.`);
    } catch {
      setImportMessage("Échec de l'import depuis trains.csv.");
    } finally {
      setImporting(false);
    }
  }

  const filtered = useMemo(() => {
    return trains.filter((train) => {
      if (dateFilter && train.dateArriveePrevue !== dateFilter) return false;
      if (statutFilter && train.statut !== statutFilter) return false;
      if (qualiteFilter && train.qualite !== qualiteFilter) return false;
      if (destinationFilter && train.destinationPrevue !== destinationFilter) return false;
      return true;
    });
  }, [trains, dateFilter, statutFilter, qualiteFilter, destinationFilter]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-medium text-[#102b20]">Horaires & arrivées des trains</h2>
          <p className="mt-1 text-sm text-[#6c7c71]">Planification et suivi des arrivées de trains sur site.</p>
        </div>
        <div className="flex items-center gap-2">
          {onImportCsv && (
            <button
              type="button"
              onClick={handleImportCsv}
              disabled={importing}
              title="Relit database/trains.csv (si modifié à la main) et enregistre les changements dans la base"
              className="flex h-10 items-center gap-1.5 rounded-md border border-[#dfe6d7] bg-white px-3 text-xs font-bold text-[#314238] transition hover:border-[#0d6b4d] hover:text-[#0d6b4d] disabled:opacity-60"
            >
              <RefreshCw size={14} className={importing ? "animate-spin" : ""} aria-hidden="true" />
              Importer depuis CSV
            </button>
          )}
          <TrainForm onCreate={onCreate} />
        </div>
      </div>
      {importMessage && <p className="text-xs font-semibold text-[#0d6b4d]">{importMessage}</p>}

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#dfe6d7] bg-white/80 p-3">
        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.06em] text-[#5e7166]">
          <Filter size={13} aria-hidden="true" />
          Filtres
        </span>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className={selectClass} />
        <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)} className={selectClass}>
          <option value="">Tous statuts</option>
          {STATUTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={qualiteFilter} onChange={(e) => setQualiteFilter(e.target.value)} className={selectClass}>
          <option value="">Toutes qualités</option>
          {PHOSPHATE_QUALITIES.map((q) => (
            <option key={q.code} value={q.code}>
              {q.code}
            </option>
          ))}
        </select>
        <select value={destinationFilter} onChange={(e) => setDestinationFilter(e.target.value)} className={selectClass}>
          <option value="">Toutes destinations</option>
          {DESTINATIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {(dateFilter || statutFilter || qualiteFilter || destinationFilter) && (
          <button
            type="button"
            onClick={() => {
              setDateFilter("");
              setStatutFilter("");
              setQualiteFilter("");
              setDestinationFilter("");
            }}
            className="text-xs font-bold text-[#0d6b4d] hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <TrainTable trains={filtered} onSelect={(t) => setSelectedId(t.id)} selectedId={selected?.id} />

      <TrainDetailsPanel
        train={selected}
        dechargements={dechargements}
        arretsTrain={arretsTrain}
        onClose={() => setSelectedId(null)}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
}
